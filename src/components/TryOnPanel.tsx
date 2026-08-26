"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/data/products";
import { CloseIcon } from "./icons";

type TryOnPanelProps = {
  product: Product | null;
  onClose: () => void;
};

type Status = "idle" | "loading" | "done" | "error";

const MODELS = [
  { id: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
  { id: "google/gemini-3.1-flash-image-preview", label: "Nano Banana 2" },
  { id: "gemini-3-pro-image-preview", label: "Nano Banana Pro" },
  { id: "gpt-image-2", label: "GPT Image 2" },
];

type ModelId = (typeof MODELS)[number]["id"];

// Declara puter en el window global
declare global {
  interface Window {
    puter?: {
      ai: {
        txt2img: (
          prompt: string,
          options: {
            provider?: string;
            model?: string;
            input_image?: string;
            input_images?: string[];
            input_image_mime_type?: string;
            test_mode?: boolean;
          },
        ) => Promise<HTMLImageElement>;
        chat: (
          prompt: string,
          media?: string,
          testMode?: boolean,
          options?: { model?: string },
        ) => Promise<{
          message?: { content?: string | Array<{ text?: string }> };
          text?: string;
        }>;
      };
    };
  }
}

/** Convierte una imagen (URL o cross-origin) en un HTMLImageElement cargado */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`));
    img.src = url;
  });
}

/** Convierte un HTMLImageElement a base64 crudo con su MIME */
function imageToBase64(img: HTMLImageElement, mime = "image/jpeg", quality = 0.9): { data: string; mime: string } {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL(mime, quality);
  const [meta, base64] = dataUrl.split(",");
  const outMime = meta.match(/data:(.*?);/)?.[1] ?? mime;
  return { data: base64, mime: outMime };
}
function extractChatText(response: {
  message?: { content?: string | Array<{ text?: string }> };
  text?: string;
}): string {
  if (typeof response.text === "string") return response.text;
  const content = response.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => c.text ?? "").join(" ");
  }
  return "";
}

/**
 * Genera automáticamente una descripción del producto a partir de su imagen,
 * usando puter.ai.chat() con visión (equivalente a un "image-to-prompt").
 * Se usa como fallback cuando el producto no tiene un `prompt` definido manualmente.
 */
async function generatePromptFromImage(product: Product): Promise<string> {
  if (!window.puter) {
    throw new Error("El servicio de IA aún se está cargando. Intenta en unos segundos.");
  }

  const instruction =
    "Describe this eyewear product image in vivid, detailed language suitable as a prompt for an AI image generator. " +
    "Focus only on the glasses/sunglasses themselves: their shape, frame color and material, lens color/tint, and style. " +
    "Do not mention the background or setting. Keep it under 60 words, written in English, third person, objective.";

  const response = await window.puter.ai.chat(instruction, product.img);
  const description = extractChatText(response).trim();

  if (!description) {
    throw new Error("No se pudo describir la imagen del producto.");
  }

  return description;
}

/** Construye el prompt final de edición a partir de una descripción del producto */
function buildEditPrompt(description: string): string {
  return `Edit this photo: place these sunglasses on the person's face. ${description} The sunglasses should rest naturally on the bridge of their nose, covering their eyes, with the arms going over their ears. Keep everything else in the photo exactly the same.`;
}

/** Descripción genérica de respaldo basada en los datos del producto (si la IA falla) */
function buildFallbackDescription(product: Product): string {
  const variantDesc: Record<string, string> = {
    round: "round",
    square: "square",
    aviator: "aviator-style",
    shield: "sport shield",
    cateye: "cat-eye",
    "kids-round": "round kids",
    "kids-flex": "flexible kids",
    contacts: "contact lenses",
    case: "case",
  };

  const shape = variantDesc[product.variant] ?? "";
  return `A pair of ${shape} sunglasses with ${product.frame} frames and ${product.lens}-tinted lenses.`;
}

const CROP_SIZE = 320; // tamaño del área de recorte en px

export function TryOnPanel({ product, onClose }: TryOnPanelProps) {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [cropPreview, setCropPreview] = useState<string | null>(null);
  // Descripción del producto generada automáticamente por IA (cuando no hay product.prompt)
  const [autoDescription, setAutoDescription] = useState<string | null>(null);
  const [describing, setDescribing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("google/gemini-2.5-flash-image");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  // Pan & zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Limpia el estado cuando se cierra o cambia el producto
  useEffect(() => {
    setImgEl(null);
    setImgUrl(null);
    setStatus("idle");
    setResultUrl(null);
    setErrorMsg("");
    setCropPreview(null);
    setAutoDescription(null);
    setDescribing(false);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [product]);

  // Bloquea el scroll del body cuando el panel está abierto
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [product]);

  // Calcula el scale inicial para que la imagen cubra el área de recorte
  useEffect(() => {
    if (!imgEl || !cropRef.current) return;
    const crop = cropRef.current.getBoundingClientRect();
    const cropW = crop.width || CROP_SIZE;
    const cropH = crop.height || CROP_SIZE;
    const scaleW = cropW / imgEl.naturalWidth;
    const scaleH = cropH / imgEl.naturalHeight;
    const initialScale = Math.max(scaleW, scaleH);
    setScale(initialScale);
    setOffset({ x: 0, y: 0 });
  }, [imgEl]);

  // Limpia URLs temporales
  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imgUrl) URL.revokeObjectURL(imgUrl);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setStatus("idle");
    setResultUrl(null);
    setErrorMsg("");

    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
  };

  // --- Pan (mouse + touch) ---
  const onPointerDown = (e: React.PointerEvent) => {
    if (!imgEl) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: dragRef.current.baseX + dx,
      y: dragRef.current.baseY + dy,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { /* noop */ }
  };

  // --- Zoom con rueda ---
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.2, Math.min(5, s * delta)));
  };

  // --- Recorta la imagen visible del área de crop y devuelve base64 ---
  const cropImage = useCallback((): { data: string; mime: string } | null => {
    if (!imgEl || !cropRef.current) return null;
    const crop = cropRef.current.getBoundingClientRect();
    const cropW = Math.round(crop.width);
    const cropH = Math.round(crop.height);

    // Usa devicePixelRatio para que el recorte tenga la resolución correcta
    const dpr = window.devicePixelRatio || 1;
    const canvasW = Math.round(cropW * dpr);
    const canvasH = Math.round(cropH * dpr);

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fondo blanco por si la imagen no cubre todo
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Calcula posición de la imagen relativa al crop
    // El CSS: left-1/2 top-1/2 + translate(-50%,-50%) centra el centro de la imagen natural
    // en el centro del crop. Luego translate(offset) la desplaza.
    // Luego scale(scale) escala desde transformOrigin: center (centro de la imagen natural).
    // El centro final de la imagen escalada = cropCenter + offset
    // drawX + imgW/2 = canvasW/2 + offset.x*dpr
    const imgW = imgEl.naturalWidth * scale * dpr;
    const imgH = imgEl.naturalHeight * scale * dpr;
    const drawX = canvasW / 2 + offset.x * dpr - imgW / 2;
    const drawY = canvasH / 2 + offset.y * dpr - imgH / 2;

    ctx.drawImage(imgEl, drawX, drawY, imgW, imgH);

    // Devuelve base64 crudo (sin el prefijo data:) como en el tutorial de Puter
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
    return { data: base64, mime };
  }, [imgEl, scale, offset]);

  // Paso 1: Recortar — genera el preview de lo que se enviará
  const handleCrop = () => {
    if (!imgEl) return;
    const cropped = cropImage();
    if (!cropped) {
      setErrorMsg("No se pudo procesar la imagen.");
      setStatus("error");
      return;
    }
    setCropPreview(`data:${cropped.mime};base64,${cropped.data}`);
    setStatus("idle");
    setErrorMsg("");
    setResultUrl(null);
  };

  // Paso 2: Mandar — envía el recorte de la cara + la imagen real del catálogo a la IA
  const handleSend = async () => {
    if (!cropPreview || !window.puter) {
      if (!window.puter) {
        setErrorMsg("El servicio de IA aún se está cargando. Intenta en unos segundos.");
        setStatus("error");
      }
      return;
    }

    // Extraer base64 del data-URI del recorte del usuario
    const [meta, base64User] = cropPreview.split(",");
    const mimeUser = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";

    setStatus("loading");
    setErrorMsg("");
    setResultUrl(null);

    try {
      // Cargar la imagen del catálogo y convertirla a base64
      const catalogImg = await loadImage(product!.img);
      const { data: catalogBase64, mime: catalogMime } = imageToBase64(catalogImg, "image/jpeg", 0.9);

      const prompt =
        "Use the first image as the person's face — keep their identity, skin tone, hairstyle, expression, head pose, lighting, and background completely unchanged. " +
"Use the second image only as a reference for the eyewear itself: ignore any other face, model, hands, mannequin, or background present in the second image. " +
"Place the exact frames from the second image naturally on the person's face from the first image, " +
"resting on the bridge of the nose and covering the eyes, with the arms passing naturally over the ears. " +
"Match the real shape, color, material, texture, and proportions of the frames exactly as shown in the second image — do not simplify, restyle, or invent details. " +
"Scale the frames to fit the person's face naturally without distorting their original design. " +
"If the lenses are tinted or dark in the second image, keep them tinted; if they are clear prescription lenses, keep them transparent. " +
"Do not add logos, text, reflections, or accessories that are not present in the second image. " +
"Do not generate a different person or alter any facial feature. " +
"The output must be a single photorealistic image, same resolution and framing as the first image, showing the same person wearing the exact eyewear from the second image.";

      // Image-to-image con dos imágenes: [cara, catálogo]
      const img = await window.puter.ai.txt2img(prompt, {
        model: selectedModel,
        input_images: [base64User, catalogBase64],
        input_image_mime_type: mimeUser,
      });

      if (img instanceof HTMLImageElement && img.src) {
        setResultUrl(img.src);
        setStatus("done");
      } else {
        throw new Error("Respuesta inesperada del modelo");
      }
    } catch (err) {
      console.error("Try-on error:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Ocurrió un error al generar la imagen.",
      );
      setStatus("error");
    }
  };

  if (!product) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral derecho */}
      <aside
        className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-label="Probador virtual"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-ink/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.img}
              alt={product.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div>
              <p className="font-display text-sm font-bold text-brand-ink">{product.name}</p>
              <p className="text-xs text-brand-ink/50">{product.brand}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full bg-brand-bg text-brand-ink/60 transition-colors hover:bg-brand-ink/10"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Paso 1: Subir foto */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-brand-ink">
              1. Sube tu foto frontal
            </h3>
            <p className="text-sm text-brand-ink/60">
              Usa una foto donde se vea tu cara de frente, bien iluminada y sin lentes puestos.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imgUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-ink/20 bg-brand-bg/50 px-6 py-12 transition-colors hover:border-brand-orange hover:bg-brand-orange-soft/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-brand-ink/40">
                  <path d="M3 16.5V18a3 3 0 003 3h12a3 3 0 003-3v-1.5M12 3v13M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-semibold text-brand-ink/60">
                  Toca para subir una foto
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Área de recorte interactiva */}
                <div
                  ref={cropRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onWheel={onWheel}
                  className="relative mx-auto aspect-square w-full max-w-[320px] cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-brand-bg ring-1 ring-brand-ink/10 active:cursor-grabbing"
                  style={{ touchAction: "none" }}
                >
                  {imgEl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl!}
                      alt="Tu foto"
                      draggable={false}
                      className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                      style={{
                        width: imgEl.naturalWidth,
                        height: imgEl.naturalHeight,
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: "center center",
                      }}
                    />
                  )}
                  {/* Marco de recorte */}
                  <div className="pointer-events-none absolute inset-0 ring-2 ring-brand-orange/60 rounded-2xl" />
                  {/* Esquinas del marco */}
                  <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-brand-orange" />
                  <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-brand-orange" />
                  <div className="pointer-events-none absolute left-2 bottom-2 h-4 w-4 border-l-2 border-b-2 border-brand-orange" />
                  <div className="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r-2 border-b-2 border-brand-orange" />
                </div>

                {/* Controles de zoom */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.2, s * 0.8))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-bg text-brand-ink/70 transition-colors hover:bg-brand-ink/10"
                    aria-label="Alejar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min={0.2}
                    max={5}
                    step={0.05}
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 accent-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.min(5, s * 1.25))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-bg text-brand-ink/70 transition-colors hover:bg-brand-ink/10"
                    aria-label="Acercar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-brand-ink/40">
                    Arrastra para mover · Usa la rueda o los botones para zoom
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 rounded-full bg-brand-bg px-4 py-2 text-xs font-bold text-brand-ink/70 transition-colors hover:bg-brand-ink/10"
                  >
                    Cambiar foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Paso 2: Recortar y mandar */}
          {imgEl && (
            <div className="mt-8 space-y-4">
              <h3 className="font-display text-lg font-bold text-brand-ink">
                2. Recorta y prueba
              </h3>
              <p className="text-sm text-brand-ink/60">
                Ajusta la foto para que tu cara quede centrada. Luego recorta y envía.
              </p>

              {/* Botón Recortar */}
              <button
                type="button"
                onClick={handleCrop}
                className="w-full rounded-full bg-brand-purple px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-purple/30 transition-all hover:-translate-y-0.5 hover:bg-brand-purple-dark"
              >
                Recortar
              </button>

              {/* Preview del recorte + Botón Mandar */}
              {cropPreview && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-brand-bg p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-ink/40">
                      Imagen que se enviará a la IA:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cropPreview} alt="Recorte" className="mx-auto rounded-lg ring-1 ring-brand-ink/10" style={{ maxWidth: 200 }} />
                  </div>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={status === "loading"}
                    className="w-full rounded-full bg-brand-orange px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-orange/30 transition-all hover:-translate-y-0.5 hover:bg-brand-orange-dark disabled:translate-y-0 disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        {describing ? "Analizando producto..." : "Generando..."}
                      </span>
                    ) : (
                      "Mandar a IA"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resultado */}
          {status === "done" && resultUrl && (
            <div className="mt-8 space-y-4">
              <h3 className="font-display text-lg font-bold text-brand-ink">
                Resultado
              </h3>
              <div className="overflow-hidden rounded-2xl ring-1 ring-brand-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Resultado try-on" className="w-full object-cover" />
              </div>
              <div className="flex gap-3">
                <a
                  href={resultUrl}
                  download="optipana-tryon.png"
                  className="flex-1 rounded-full bg-brand-purple px-6 py-3 text-center text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-purple-dark"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={handleSend}
                  className="flex-1 rounded-full bg-brand-bg px-6 py-3 text-sm font-bold text-brand-ink/70 transition-all hover:bg-brand-ink/5"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-bold">No se pudo generar la imagen</p>
              <p className="mt-1">{errorMsg}</p>
              <button
                type="button"
                onClick={handleSend}
                className="mt-3 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Nota de privacidad */}
          <p className="mt-4 text-xs text-brand-ink/40">
            Tu foto se procesa mediante IA en la nube. No la almacenamos. Necesitarás iniciar sesión
            en Puter la primera vez que uses esta función.
          </p>

          {/* Selector de modelo */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-ink/40">
              Modelo de IA
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                    selectedModel === m.id
                      ? "bg-brand-orange text-white shadow-md shadow-brand-orange/30"
                      : "bg-brand-bg text-brand-ink/70 hover:bg-brand-ink/5"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
