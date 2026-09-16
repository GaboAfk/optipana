"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFaceLandmarker, disposeFaceLandmarker, computeFacePose } from "./faceLandmarker";
import { GlassesRenderer } from "./glassesRenderer";
import { GLASSES_CATALOG } from "./glassesCatalog";
import type { GlassesModel } from "./types";

type Status = "idle" | "loading-model" | "running" | "error";

export function VirtualTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<GlassesRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);

  // Catálogo de modelos 3D disponibles (todos los .glb de public/glasses_models).
  const [models] = useState<GlassesModel[]>(GLASSES_CATALOG);
  const [selectedId, setSelectedId] = useState<string | null>(
    GLASSES_CATALOG.length ? GLASSES_CATALOG[0].id : null,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setFaceDetected(false);
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg("Tu navegador no soporta acceso a la cámara.");
      setStatus("error");
      return;
    }
    setInitLoading(true);
    try {
      // Inicializa MediaPipe en paralelo mientras se pide la cámara.
      getFaceLandmarker().catch((e) => {
        console.error("MediaPipe init error", e);
        setErrorMsg("No se pudo inicializar el detector facial. Revisa tu conexión (el modelo se descarga la primera vez).");
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setCameraActive(true);
      setStatus("running");
    } catch (err) {
      console.error("Camera error", err);
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setErrorMsg("Permiso de cámara denegado. Actívalo en los ajustes del navegador para probarte los lentes.");
      } else if (name === "NotFoundError") {
        setErrorMsg("No se encontró ninguna cámara en este dispositivo.");
      } else {
        setErrorMsg("No se pudo iniciar la cámara. Inténtalo de nuevo.");
      }
      setStatus("error");
    } finally {
      setInitLoading(false);
    }
  }, []);

  // Bucle de tracking + renderizado.
  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container) return;

    // Crea el renderer la primera vez que la cámara está activa.
    if (!rendererRef.current) {
      rendererRef.current = new GlassesRenderer(canvas, {
        scale: 1, offsetX: 0, offsetY: 0, offsetZ: 0, rotationX: 0, rotationY: 0, rotationZ: 0,
      });
    }
    const renderer = rendererRef.current;

    const loop = async () => {
      rafRef.current = requestAnimationFrame(loop);
      if (video.readyState < 2) return;

      // Ajustar tamaño del canvas al contenedor (y recalcular recorte del video).
      const w = container.clientWidth;
      const h = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        renderer.resize(w, h, video.videoWidth, video.videoHeight);
      } else if (video.videoWidth && video.videoHeight) {
        // Recalcular recorte aunque el contenedor no cambie (video puede cambiar).
        renderer.updateCrop(video.videoWidth, video.videoHeight, w, h);
      }

      // Detectar solo con frames nuevos.
      const now = video.currentTime;
      if (now !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = now;
        try {
          const landmarker = await getFaceLandmarker();
          const result = landmarker.detectForVideo(video, performance.now());
          const pose = computeFacePose(result, video.videoWidth);
          frameCountRef.current++;
          if (frameCountRef.current % 10 === 0) {
            setDebugInfo(
              `detected=${pose.detected} cx=${pose.centerX.toFixed(3)} cy=${pose.centerY.toFixed(3)} ` +
                `eye=${pose.eyeDistance.toFixed(1)}px video=${video.videoWidth}x${video.videoHeight} ` +
                `landmarks=${result.faceLandmarks?.length ?? 0} roll=${pose.roll.toFixed(1)} yaw=${pose.yaw.toFixed(1)}`,
            );
          }
          setFaceDetected(pose.detected);
          renderer.applyPose(pose, video.videoWidth);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setDebugInfo(`ERROR detectForVideo: ${msg}`);
          // Si detect falla, ocultar los lentes.
          rendererRef.current?.applyPose({ centerX: 0.5, centerY: 0.5, eyeDistance: 0, roll: 0, yaw: 0, pitch: 0, faceWidth: 0, detected: false }, video.videoWidth);
        }
      }
      renderer.render();
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [cameraActive]);

  // Carga el modelo 3D cuando cambia la selección.
  useEffect(() => {
    if (!selectedId || !rendererRef.current) return;
    const model = models.find((m) => m.id === selectedId);
    if (!model) return;
    let cancelled = false;
    (async () => {
      setStatus("loading-model");
      try {
        await rendererRef.current!.loadModel(model.url, model.estimatedBoundsMm);
        if (!cancelled) setStatus("running");
      } catch {
        if (!cancelled) {
          setErrorMsg("No se pudo cargar el modelo 3D de este lente.");
          setStatus("running");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, models]);

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      stopCamera();
      rendererRef.current?.dispose();
      rendererRef.current = null;
      disposeFaceLandmarker();
    };
  }, [stopCamera]);

  const selectedModel = models.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black shadow-lg"
      >
        {/* Video espejo (cámara frontal) */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        {/* Canvas overlay espejo para coincidir con el video */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />

        {/* Estado: sin cámara */}
        {!cameraActive && status !== "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <div className="text-5xl">👓</div>
            <p className="text-sm opacity-90">
              Para probarte los lentes necesitamos acceso a tu cámara. El video se procesa en tu
              dispositivo y no se almacena ni se sube a ningún servidor.
            </p>
            <button
              onClick={startCamera}
              disabled={initLoading}
              className="rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-orange-dark disabled:opacity-60"
            >
              {initLoading ? "Iniciando…" : "Activar cámara"}
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <div className="text-4xl">📷</div>
            <p className="text-sm opacity-90">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Indicador de detección facial */}
        {cameraActive && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${faceDetected ? "bg-green-400" : "bg-amber-400"}`} />
            {faceDetected ? "Rostro detectado" : "Buscando rostro…"}
          </div>
        )}

        {/* Cargando modelo */}
        {cameraActive && status === "loading-model" && (
          <div className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">
            Cargando lente…
          </div>
        )}

        {/* Botón cerrar cámara */}
        {cameraActive && (
          <button
            onClick={stopCamera}
            className="absolute bottom-3 right-3 rounded-full bg-black/40 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/60"
          >
            Detener cámara
          </button>
        )}

        {/* DEBUG temporal: valores de tracking en vivo */}
        {cameraActive && debugInfo && (
          <div className="absolute bottom-12 left-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-[10px] leading-tight text-lime-300 backdrop-blur">
            {debugInfo}
          </div>
        )}
      </div>

      {/* Selector de lentes */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-brand-ink">Elige un lente:</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {models.map((m) => {
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition ${
                  active ? "border-brand-orange bg-brand-orange-soft" : "border-transparent bg-brand-bg hover:border-brand-orange/40"
                }`}
                title={m.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.preview}
                  alt={m.name}
                  className="h-16 w-20 rounded-md bg-white object-contain"
                />
                <span className="max-w-[5rem] truncate text-[11px] font-medium text-brand-ink">
                  {m.name}
                </span>
              </button>
            );
          })}
        </div>
        {selectedModel && (
          <p className="mt-2 text-xs text-brand-ink/60">
            Probando: <span className="font-semibold">{selectedModel.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
