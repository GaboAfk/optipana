"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { products, type Category, type Gender, type Product } from "@/data/products";
import { CloseIcon } from "./icons";
import { waLink } from "@/lib/site";

type TryOnPanelProps = {
  product: Product | null;
  onClose: () => void;
  onProductChange: (product: Product) => void;
  activeCategory: Category | "todos";
  activeGender: Gender | "todos";
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

function getProductReferenceImage(product: Product): string {
  return product.hoverImg ?? product.img;
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

  const response = await window.puter.ai.chat(instruction, getProductReferenceImage(product));
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

// Clave para localStorage
const STORAGE_KEY = "optipana-tryon-image";

// TODO(dev): poner en false (o eliminar) antes de producción. Evita llamar a la IA mientras se desarrolla.
const DEV_SKIP_AI = true;

export function TryOnPanel({ product, onClose, onProductChange, activeCategory, activeGender }: TryOnPanelProps) {
  const [showAdditionalProducts, setShowAdditionalProducts] = useState(false);
  
  // Filtrar productos según los filtros activos y disponibilidad de try-on
  const filteredProducts = products.filter((p) => {
    const catMatch = activeCategory === "todos" || p.category === activeCategory;
    const genderMatch = activeGender === "todos" || p.gender === activeGender || p.gender === "unisex";
    const hasTryOn = p["try-on"];
    return catMatch && genderMatch && hasTryOn;
  });
  
  // Productos adicionales que no están en los filtrados
  const additionalProducts = products.filter((p) => {
    const hasTryOn = p["try-on"];
    const isAlreadyShown = filteredProducts.some((fp) => fp.id === p.id);
    return hasTryOn && !isAlreadyShown;
  });
  
  // Productos a mostrar (filtrados + adicionales si se activó el botón)
  const displayProducts = showAdditionalProducts 
    ? [...filteredProducts, ...additionalProducts]
    : filteredProducts;
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  // Descripción del producto generada automáticamente por IA (cuando no hay product.prompt)
  const [autoDescription, setAutoDescription] = useState<string | null>(null);
  const [describing, setDescribing] = useState(false);
  const selectedModel: ModelId = "google/gemini-2.5-flash-image";
  const [showHoverImg, setShowHoverImg] = useState(false);
  // Mobile: la lista de lentes se minimiza al hacer scroll hacia abajo
  const [listCollapsed, setListCollapsed] = useState(false);
  const lastScrollTopRef = useRef(0);
  // Recuerda si la foto vino de la cámara o de un archivo
  const [photoSource, setPhotoSource] = useState<"camera" | "file" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Marca que la foto fue cargada por el usuario (no restaurada) para hacer scroll al paso 2
  const justLoadedRef = useRef(false);
  // Cámara en vivo (getUserMedia)
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const productButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Pan & zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const pinchRef = useRef<{ initialDist: number; initialScale: number } | null>(null);

  // Drag-to-close state (mobile)
  const [panelX, setPanelX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const prevProductRef = useRef<Product | null>(null);
  const panelDragRef = useRef<{ startX: number; startY: number; dragging: boolean; horizontal: boolean } | null>(null);

  // Cargar imagen guardada al montar el componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { dataUrl, savedScale, savedOffset, savedSource } = JSON.parse(saved);
        if (dataUrl) {
          setImgUrl(dataUrl);
          setScale(savedScale || 1);
          setOffset(savedOffset || { x: 0, y: 0 });
          if (savedSource) setPhotoSource(savedSource);
          
          const img = new Image();
          img.onload = () => setImgEl(img);
          img.src = dataUrl;
        }
      }
    } catch (e) {
      console.error("Error loading saved image:", e);
    }
  }, []);

  // Limpia el estado cuando se cierra o cambia el producto (excepto la imagen)
  useEffect(() => {
    setStatus("idle");
    setResultUrl(null);
    setErrorMsg("");
    setAutoDescription(null);
    setDescribing(false);
    setShowAdditionalProducts(false);
    setShowHoverImg(false);
    setIsDragging(false);
    if (!product) {
      setListCollapsed(false);
      lastScrollTopRef.current = 0;
    }
  }, [product]);

  // Mientras el panel está cerrado, se mantiene fuera de pantalla para que
  // el primer render al abrir ya parta desde la derecha (sin flash).
  useLayoutEffect(() => {
    if (!product) setPanelX(window.innerWidth);
  }, [product]);

  // Animación de entrada: cuando el panel se abre (product pasa de null a un valor),
  // se desliza desde la derecha. Al cambiar de producto con el panel ya abierto, se queda en su sitio.
  useEffect(() => {
    const wasClosed = prevProductRef.current === null;
    prevProductRef.current = product;
    if (!product || !wasClosed) return;

    // Doble rAF: el navegador pinta primero la posición fuera de pantalla y luego anima a 0
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPanelX(0));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [product]);

  // Activa la imagen hover del producto seleccionado
  useEffect(() => {
    setShowHoverImg(!!product?.hoverImg);
  }, [product]);

  // Hace scroll al botón del producto seleccionado si está fuera de la vista
  useEffect(() => {
    if (!product) return;
    const btn = productButtonRefs.current.get(product.id);
    if (!btn) return;
    // Solo en mobile (scroll horizontal); en desktop el scroll es vertical
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    btn.scrollIntoView({
      behavior: "smooth",
      block: isMobile ? "nearest" : "nearest",
      inline: "center",
    });
  }, [product, showAdditionalProducts]);

  // Pequeño "nudge" de scroll en la lista al abrir el panel (solo mobile)
  // para indicar al usuario que la lista es desplazable horizontalmente.
  // Solo ocurre la primera vez que se abre, no al cambiar de lente.
  const nudgePrevProduct = useRef<Product | null>(null);
  useEffect(() => {
    const wasClosed = nudgePrevProduct.current === null;
    nudgePrevProduct.current = product;
    if (!product || !wasClosed) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const list = document.querySelector("[data-product-list]") as HTMLElement | null;
    if (!list) return;

    let animId: number;
    const timer = setTimeout(() => {
      const startScroll = list.scrollLeft;
      const distance = 80;
      const duration = 1200;
      const startTime = performance.now();

      // Ease in-out sinusoidal: va y vuelve suavemente
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        const progress = Math.sin(t * Math.PI); // 0 → 1 → 0
        list.scrollLeft = startScroll + distance * progress;
        if (t < 1) animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    }, 600);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
    };
  }, [product]);

  // Guardar estado de zoom y offset cuando cambian (con debounce)
  useEffect(() => {
    if (!imgUrl) return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          dataUrl: imgUrl,
          savedScale: scale,
          savedOffset: offset,
          savedSource: photoSource
        }));
      } catch (e) {
        console.error("Error saving zoom state:", e);
      }
    }, 500); // 500ms de debounce
    
    return () => clearTimeout(timeoutId);
  }, [scale, offset, imgUrl, photoSource]);

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

  // Calcular el scale mínimo para que la imagen siempre cubra el área de recorte
  const minScale = imgEl ? Math.max(
    CROP_SIZE / imgEl.naturalWidth,
    CROP_SIZE / imgEl.naturalHeight
  ) : 0.2;

  // Limpia URLs temporales
  useEffect(() => {
    return () => {
      if (imgUrl && imgUrl.startsWith("blob:")) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file, "file");
    // Reset para poder seleccionar el mismo archivo otra vez
    e.target.value = "";
  };

  const loadFile = (file: File, source: "camera" | "file" = "file") => {
    setPhotoSource(source);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImgUrl(dataUrl);
      setStatus("idle");
      setResultUrl(null);
      setErrorMsg("");
      setScale(1);
      setOffset({ x: 0, y: 0 });

      const img = new Image();
      img.onload = () => {
        justLoadedRef.current = true;
        setImgEl(img);
        // Guardar en localStorage (data URL persiste entre sesiones)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            dataUrl,
            savedScale: 1,
            savedOffset: { x: 0, y: 0 },
            savedSource: source
          }));
        } catch (e) {
          console.error("Error saving image to localStorage:", e);
        }
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setErrorMsg("No se pudo leer el archivo de imagen.");
      setStatus("error");
    };
    reader.readAsDataURL(file);
  };

  // --- Cámara en vivo ---
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    // Fallback al input nativo si el navegador no soporta getUserMedia (o no hay HTTPS)
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    stopCamera();
    setCameraError(null);
    if (window.matchMedia("(max-width: 767px)").matches) setListCollapsed(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCameraError("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") {
        setCameraError("No se encontró ninguna cámara en este dispositivo.");
      } else {
        setCameraError("No se pudo iniciar la cámara. Inténtalo de nuevo.");
      }
    }
  };

  // Conecta el stream al <video> cuando se monta
  useEffect(() => {
    const video = videoRef.current;
    if (!cameraActive || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [cameraActive]);

  // Apaga la cámara al cerrar el panel o desmontar (no al cambiar de lente)
  const isOpen = !!product;
  useEffect(() => {
    if (!isOpen) return;
    return stopCamera;
  }, [isOpen, stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // La cámara frontal se muestra en espejo; se voltea al capturar para que coincida con lo que ve el usuario
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      loadFile(new File([blob], "camera.jpg", { type: "image/jpeg" }), "camera");
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  // Limpiar la imagen guardada
  const handleClearImage = () => {
    localStorage.removeItem(STORAGE_KEY);
    setImgUrl(null);
    setImgEl(null);
    setStatus("idle");
    setResultUrl(null);
    setErrorMsg("");
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setPhotoSource(null);
  };

  // --- Pan (mouse + touch) ---
  const onPointerDown = (e: React.PointerEvent) => {
    if (!imgEl) return;
    e.preventDefault(); // Prevenir scroll cuando se interactúa con la imagen
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !imgEl) return;
    e.preventDefault(); // Prevenir scroll cuando se arrastra la imagen
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    // Calcular límites del offset para que la imagen no se salga del área de recorte
    const imgWidth = imgEl.naturalWidth * scale;
    const imgHeight = imgEl.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (imgWidth - CROP_SIZE) / 2);
    const maxOffsetY = Math.max(0, (imgHeight - CROP_SIZE) / 2);
    
    let newX = dragRef.current.baseX + dx;
    let newY = dragRef.current.baseY + dy;
    
    // Restringir el offset dentro de los límites
    newX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
    newY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));
    
    setOffset({
      x: newX,
      y: newY,
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
    const newScale = Math.max(minScale, Math.min(5, scale * delta));
    setScale(newScale);
    
    // Al hacer zoom, recentrar la imagen para asegurar que siempre cubra el área
    if (newScale === minScale) {
      setOffset({ x: 0, y: 0 });
    }
  };

  // --- Pinch-to-zoom (touch con dos dedos) ---
  const getPinchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStartCrop = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && imgEl) {
      e.preventDefault();
      pinchRef.current = {
        initialDist: getPinchDistance(e.touches),
        initialScale: scale,
      };
    }
  };

  const onTouchMoveCrop = (e: React.TouchEvent) => {
    if (!pinchRef.current || !imgEl || e.touches.length !== 2) return;
    e.preventDefault();
    const dist = getPinchDistance(e.touches);
    const ratio = dist / pinchRef.current.initialDist;
    const newScale = Math.max(minScale, Math.min(5, pinchRef.current.initialScale * ratio));
    setScale(newScale);
    if (newScale === minScale) {
      setOffset({ x: 0, y: 0 });
    }
  };

  const onTouchEndCrop = () => {
    pinchRef.current = null;
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

  // Recorta la foto con el encuadre actual y la envía junto a la imagen del catálogo a la IA
  const handleSend = useCallback(async () => {
    if (!imgEl || !product) return;
    if (!window.puter) {
      setErrorMsg("El servicio de IA aún se está cargando. Intenta en unos segundos.");
      setStatus("error");
      return;
    }

    const cropped = cropImage();
    if (!cropped) {
      setErrorMsg("No se pudo procesar la imagen.");
      setStatus("error");
      return;
    }
    const base64User = cropped.data;
    const mimeUser = cropped.mime;

    setStatus("loading");
    setErrorMsg("");
    setResultUrl(null);

    // TODO(dev): quitar antes de producción — no llama a la IA, solo muestra el recorte
    if (DEV_SKIP_AI) {
      console.log("[DEV] Foto recortada enviada (simulado)", { mime: mimeUser, bytes: Math.round((base64User.length * 3) / 4) });
      setResultUrl(`data:${mimeUser};base64,${base64User}`);
      setStatus("done");
      return;
    }

    try {
      // Cargar la imagen del catálogo y convertirla a base64
      const catalogImg = await loadImage(getProductReferenceImage(product!));
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
  }, [imgEl, product, cropImage, selectedModel]);

  // Al subir/tomar la foto: en mobile se minimiza la lista (para dejar ver el botón)
  // y se lleva al usuario al paso 2 (ajustar)
  useEffect(() => {
    if (!justLoadedRef.current || !imgEl) return;
    justLoadedRef.current = false;
    if (window.matchMedia("(max-width: 767px)").matches) setListCollapsed(true);
    // Scroll mínimo: solo lo justo para que el botón "Recortar y probar" quede visible
    const timer = setTimeout(() => {
      sendButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 350);
    return () => clearTimeout(timer);
  }, [imgEl]);

  // Compartir el resultado: Web Share API con la imagen; si no se soporta, WhatsApp con texto
  const handleShare = async () => {
    if (!resultUrl || !product) return;
    const text = `Mira cómo me quedan los lentes "${product.name}" de OptiPana`;
    try {
      const blob = await (await fetch(resultUrl)).blob();
      const file = new File([blob], "optipana-tryon.png", { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
    } catch (err) {
      // Cancelado por el usuario u otro error de share: no hacer fallback ruidoso
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    window.open(waLink(text), "_blank", "noopener,noreferrer");
  };

  // Al terminar (resultado o error), hacer scroll hasta el resultado
  useEffect(() => {
    if (status !== "done" && status !== "error") return;
    const timer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [status, resultUrl]);

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
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-4xl bg-white shadow-2xl flex-col md:flex-row ${!isDragging ? "transition-transform duration-300 ease-out" : ""}`}
        style={{ transform: `translateX(${panelX}px)` }}
        onTouchStart={(e) => {
          // Solo en mobile
          if (window.matchMedia("(min-width: 768px)").matches) return;
          // No iniciar drag-to-close si el toque comienza en la lista scrolleable
          // o en el área de recorte/zoom de la imagen
          const target = e.target as HTMLElement;
          if (target.closest("[data-product-list]")) return;
          if (target.closest("[data-crop-area]")) return;
          if (target.closest("[data-zoom-controls]")) return;
          if (target.closest("[data-lens-picker]")) return;
          setIsDragging(true);
          panelDragRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            dragging: false,
            horizontal: false,
          };
        }}
        onTouchMove={(e) => {
          const drag = panelDragRef.current;
          if (!drag) return;
          const dx = e.touches[0].clientX - drag.startX;
          const dy = e.touches[0].clientY - drag.startY;

          // Determinar dirección del gesto
          if (!drag.horizontal && !drag.dragging) {
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
              drag.horizontal = Math.abs(dx) > Math.abs(dy);
              drag.dragging = true;
            }
          }

          // Solo arrastrar horizontalmente hacia la derecha
          if (drag.horizontal && dx > 0) {
            setPanelX(dx);
          }
        }}
        onTouchEnd={() => {
          const drag = panelDragRef.current;
          if (!drag) return;
          setIsDragging(false);
          // Si arrastró más de 100px hacia la derecha, animar salida y cerrar
          if (panelX > 100) {
            setPanelX(window.innerWidth);
            setTimeout(onClose, 300);
          } else {
            setPanelX(0);
          }
          panelDragRef.current = null;
        }}
        role="dialog"
        aria-label="Probador virtual"
      >
        {/* Lista de productos - Mobile (arriba) / Desktop (izquierda) */}
        {/* En mobile se minimiza a una barra al hacer scroll hacia abajo o al subir la foto; se expande al tocarla o al subir */}
        <div className="flex flex-shrink-0 flex-col border-b border-brand-ink/10 bg-brand-bg/50 md:h-full md:w-64 md:border-b-0 md:border-r">
          {/* Barra minimizada — solo mobile */}
          <button
            type="button"
            onClick={() => setListCollapsed((v) => !v)}
            aria-expanded={!listCollapsed}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-brand-ink/60 md:hidden"
          >
            <span className="inline-flex items-center gap-2">
              Otros estilos
              <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] text-brand-orange">
                {displayProducts.length}
              </span>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-3.5 w-3.5 transition-transform ${listCollapsed ? "" : "rotate-180"}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 md:flex md:min-h-0 md:flex-1 md:flex-col ${
              listCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
            }`}
          >
          {/* Lista horizontal en mobile, vertical en desktop */}
          <div className="min-h-0 overflow-hidden md:flex md:min-h-full md:flex-1 md:flex-col md:overflow-y-auto">
          <div className={`p-4 ${!showAdditionalProducts && additionalProducts.length > 0 ? 'md:pb-16' : ''}`}>
            {/* Título solo en desktop */}
            <h4 className="hidden md:block text-xs font-bold uppercase tracking-wide text-brand-ink/40 mb-3">
              Cambiar lente
            </h4>
            
            <div data-product-list className={`flex gap-3 ${!showAdditionalProducts && additionalProducts.length > 0 ? 'md:flex-col md:gap-3' : 'md:flex-col md:gap-3'} overflow-x-auto md:overflow-x-visible pt-2 pb-3 pl-2 pr-2 md:pl-0 md:pr-0 md:pb-0 scrollbar-hide`}>
              {displayProducts.map((p) => (
                <button
                  key={p.id}
                  ref={(el) => {
                    if (el) productButtonRefs.current.set(p.id, el);
                    else productButtonRefs.current.delete(p.id);
                  }}
                  type="button"
                  onClick={() => onProductChange(p)}
                  className={`relative flex-shrink-0 flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    p.id === product.id
                      ? "bg-white ring-2 ring-brand-orange shadow-sm"
                      : "bg-white hover:bg-brand-ink/5"
                  }`}
                >
                  {/* Imagen del modelo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt={p.name}
                    className={`h-12 w-12 md:h-16 md:w-16 rounded-lg object-cover flex-shrink-0 transition-all duration-500 ${
                      p.id === product.id && p.hoverImg && showHoverImg ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  {/* Imagen del lente (hover) */}
                  {p.hoverImg && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.hoverImg}
                      alt={p.name}
                      className={`pointer-events-none absolute h-12 w-12 md:h-16 md:w-16 rounded-lg object-cover transition-all duration-500 ${
                        p.id === product.id && showHoverImg ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand-ink line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-brand-ink/50">{p.brand}</p>
                    <p className="text-xs font-bold text-brand-orange mt-1">${p.price}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Botón "Probar más" - solo en desktop */}
            {!showAdditionalProducts && additionalProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAdditionalProducts(true)}
                className="hidden md:block mt-4 w-full rounded-xl bg-brand-orange-soft px-4 py-3 text-xs font-bold text-brand-orange transition-all hover:bg-brand-orange hover:text-white"
              >
                Probar más ({additionalProducts.length} disponibles)
              </button>
            )}
          </div>
          </div>
          </div>
        </div>

        {/* Columna derecha - Contenido principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto md:overflow-auto">
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
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6"
            onScroll={(e) => {
              if (window.matchMedia("(min-width: 768px)").matches) return;
              const el = e.currentTarget;
              const top = el.scrollTop;
              const delta = top - lastScrollTopRef.current;
              // Ignorar micro-movimientos
              if (Math.abs(delta) < 6) return;
              // Se minimiza al bajar; solo se vuelve a abrir al llegar al tope del contenido
              if (delta > 0 && top > 40) setListCollapsed(true);
              else if (top <= 2) setListCollapsed(false);
              lastScrollTopRef.current = top;
            }}
          >
          {/* Paso 1: Subir foto */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-brand-ink">
              {imgEl ? "2. Ajusta tu foto" : "1. Sube tu foto frontal"}
            </h3>
            <p className="text-sm text-brand-ink/60">
              {imgEl
                ? "Arrastra y haz zoom para que tu cara quede centrada dentro del marco."
                : "Usa una foto donde se vea tu cara de frente, bien iluminada y sin lentes puestos."}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imgUrl && cameraActive ? (
              <div className="space-y-3">
                {/* Visor de cámara en vivo */}
                <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-black ring-1 ring-brand-ink/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                    style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
                  />
                  {/* Cerrar cámara */}
                  <button
                    type="button"
                    onClick={stopCamera}
                    aria-label="Cancelar cámara"
                    className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                  {/* Cambiar cámara (frontal/trasera) */}
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode === "user" ? "environment" : "user")}
                    aria-label="Cambiar cámara"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path d="M4 10a8 8 0 0114-4.9M20 14a8 8 0 01-14 4.9" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18 2v4h-4M6 22v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {/* Disparador */}
                  <button
                    type="button"
                    onClick={capturePhoto}
                    aria-label="Tomar foto"
                    className="absolute bottom-4 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/30 backdrop-blur transition-transform active:scale-90"
                  >
                    <span className="h-12 w-12 rounded-full bg-white" />
                  </button>
                </div>
              </div>
            ) : !imgUrl ? (
              <div className="space-y-3">
                {/* Área de recorte con dos botones que ocupan todo el espacio */}
                <div className="mx-auto flex aspect-square w-full max-w-[320px] flex-col overflow-hidden rounded-2xl border-2 border-dashed border-brand-ink/20 bg-brand-bg/50">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-1 flex-col items-center justify-center gap-2 text-brand-ink/60 transition-colors hover:bg-brand-ink/5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                      <path d="M3 16.5V18a3 3 0 003 3h12a3 3 0 003-3v-1.5M12 3v13M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-semibold">Subir imagen</span>
                  </button>
                  <div className="h-px w-full bg-brand-ink/10" />
                  <button
                    type="button"
                    onClick={() => { setCameraError(null); startCamera(); }}
                    className={`flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center transition-colors ${
                      cameraError
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "text-brand-ink/60 hover:bg-brand-ink/5"
                    }`}
                  >
                    {cameraError ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                          <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs font-medium leading-snug">{cameraError}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                            <path d="M4 4v6h6M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 10A8 8 0 006 5.3M4 14a8 8 0 0014 4.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Reintentar
                        </span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                          <path d="M3 8a2 2 0 012-2h2.5l1.5-2h6l1.5 2H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-semibold">Usar cámara</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Área de recorte interactiva */}
                <div
                  ref={cropRef}
                  data-crop-area
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onWheel={onWheel}
                  onTouchStart={onTouchStartCrop}
                  onTouchMove={onTouchMoveCrop}
                  onTouchEnd={onTouchEndCrop}
                  className="relative mx-auto aspect-square w-full max-w-[320px] cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-brand-bg ring-1 ring-brand-ink/10 active:cursor-grabbing"
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

                  {/* Acciones: cambiar foto / limpiar (esquina superior derecha) */}
                  <div
                    data-zoom-controls
                    className="absolute right-3 top-3 flex gap-2"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (photoSource === "camera") startCamera();
                        else fileInputRef.current?.click();
                      }}
                      aria-label="Cambiar foto"
                      title="Cambiar foto"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                        <path d="M4 4v6h6M20 20v-6h-6" />
                        <path d="M20 10A8 8 0 006 5.3M4 14a8 8 0 0014 4.7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      aria-label="Limpiar foto"
                      title="Limpiar foto"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-red-600"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                        <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Controles de zoom */}
                <div data-zoom-controls className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newScale = Math.max(minScale, scale * 0.8);
                      setScale(newScale);
                      if (newScale === minScale) setOffset({ x: 0, y: 0 });
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-bg text-brand-ink/70 transition-colors hover:bg-brand-ink/10"
                    aria-label="Alejar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min={minScale}
                    max={5}
                    step={0.05}
                    value={scale}
                    onChange={(e) => {
                      const newScale = parseFloat(e.target.value);
                      setScale(newScale);
                      if (newScale === minScale) setOffset({ x: 0, y: 0 });
                    }}
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

                <p className="text-xs text-brand-ink/40">
                  Arrastra para mover · Usa la rueda o los botones para zoom
                </p>
              </div>
            )}
          </div>

          {/* Botón final: recorta con el encuadre actual y envía a la IA */}
          {imgEl && (
            <button
              ref={sendButtonRef}
              type="button"
              onClick={() => void handleSend()}
              disabled={status === "loading"}
              className="mt-6 w-full scroll-mb-4 rounded-full bg-brand-orange px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-orange/30 transition-all hover:-translate-y-0.5 hover:bg-brand-orange-dark disabled:translate-y-0 disabled:opacity-60"
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
                "Recortar y probar"
              )}
            </button>
          )}

          {/* Paso 3: Resultado */}
          {status === "done" && resultUrl && (
            <div ref={resultRef} className="mt-8 scroll-mt-4 space-y-4">
              <h3 className="font-display text-lg font-bold text-brand-ink">
                3. Tu resultado
              </h3>
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-brand-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Resultado try-on" className="w-full object-cover" />
                {/* Compartir + animación "Compartir" que aparece y se oculta hacia el botón */}
                <div className="absolute right-3 top-3 flex items-center">
                  <motion.span
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [12, 0, 0, 12] }}
                    transition={{ duration: 2.5, times: [0, 0.15, 0.8, 1], delay: 0.4 }}
                    className="mr-2 whitespace-nowrap rounded-full bg-black/50 px-3 py-2 text-xs font-bold text-white backdrop-blur"
                  >
                    Compartir
                  </motion.span>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    aria-label="Compartir resultado"
                    title="Compartir"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={resultUrl}
                  download="optipana-tryon.png"
                  className="flex-1 rounded-full bg-brand-purple px-6 py-3 text-center text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-purple-dark"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  className="flex-1 rounded-full bg-brand-bg px-6 py-3 text-sm font-bold text-brand-ink/70 transition-all hover:bg-brand-ink/5"
                >
                  Volver a generar
                </button>
              </div>

              {/* Probar otro lente — lista inferior solo en mobile (en desktop está la columna izquierda) */}
              <div className="pt-2 md:hidden">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-ink/40">
                  ¿Quieres probar otro estilo?
                </p>
                <div data-lens-picker className="-mx-5 flex gap-3 overflow-x-auto px-5 pt-1 pb-3 scrollbar-hide">
                  {displayProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onProductChange(p);
                        setTimeout(() => sendButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                      }}
                      className={`flex w-24 flex-shrink-0 flex-col items-center gap-1.5 rounded-xl bg-white p-2 text-center transition-all ${
                        p.id === product.id ? "ring-2 ring-brand-orange shadow-sm" : "ring-1 ring-brand-ink/10"
                      } hover:-translate-y-0.5`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.hoverImg ?? p.img} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />
                      <span className="line-clamp-2 text-[11px] font-bold leading-tight text-brand-ink">{p.name}</span>
                      <span className="text-[11px] font-bold text-brand-orange">${p.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div ref={resultRef} className="mt-6 scroll-mt-4 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-bold">No se pudo generar la imagen</p>
              <p className="mt-1">{errorMsg}</p>
              <button
                type="button"
                onClick={() => void handleSend()}
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
        </div>
        </div>
      </aside>
    </>
  );
}
