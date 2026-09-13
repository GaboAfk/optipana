"use client";

import { useSyncExternalStore } from "react";

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

// GPUs de gama baja o renderizadores por software (vía WebGL)
const LOW_END_GPU =
  /swiftshader|llvmpipe|software|mali-[34]0\d|mali-t[678]\d\d|mali-g31|adreno ?[34]\d\d|adreno ?50\d|powervr|vivante/i;

function gpuIsLowEnd(): boolean {
  try {
    const canvas = document.createElement("canvas");
    // failIfMajorPerformanceCaveat devuelve null si el renderizado es por
    // software o el driver está en lista negra: eso ya es señal de gama baja
    const gl = canvas.getContext("webgl", {
      failIfMajorPerformanceCaveat: true,
    }) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(
      (ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER)) ?? ""
    );
    return LOW_END_GPU.test(renderer);
  } catch {
    return false;
  }
}

function detectLowEnd(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

  const nav = navigator as NavigatorExtras;
  const cores = nav.hardwareConcurrency || 0;
  // deviceMemory no existe en iOS/Firefox: undefined, no tratarlo como 0
  const memory = nav.deviceMemory;

  // El usuario pide ahorro de datos o la red es lenta
  const conn = nav.connection;
  if (
    conn?.saveData ||
    conn?.effectiveType === "3g" ||
    conn?.effectiveType === "2g" ||
    conn?.effectiveType === "slow-2g"
  ) {
    return true;
  }

  // 4GB o menos de RAM es gama baja aunque tenga 8 núcleos.
  // Nota: Chrome redondea deviceMemory hacia abajo a potencias de 2
  // (máx. 8), así que 4 también cubre equipos de ~5-7GB reales.
  if (memory !== undefined && memory <= 4) return true;

  // hardwareConcurrency infla el conteo en big.LITTLE (8 núcleos = 2 rápidos
  // + 6 lentos), por eso solo es fiable como señal en conteos muy bajos
  if (cores > 0 && cores <= 4) return true;

  if (gpuIsLowEnd()) return true;

  // Android viejo casi siempre implica hardware viejo
  const android = /Android (\d+)/.exec(navigator.userAgent);
  if (android && Number(android[1]) <= 9) return true;

  return false;
}

// Último recurso: medir FPS reales tras la carga. Atrapa dispositivos que
// mienten en specs (octa-core lento, throttling térmico, poca RAM libre)
function probeFrameRate(onSlow: () => void) {
  let frames = 0;
  let active = 0;
  let prev = -1;
  const start = performance.now();

  function tick(now: number) {
    if (prev >= 0) {
      const delta = now - prev;
      // >1s entre frames = pestaña oculta, no jank
      if (delta < 1000) {
        frames++;
        active += delta;
      }
    }
    prev = now;
    if (now - start < 1200) {
      requestAnimationFrame(tick);
    } else {
      const fps = active > 0 ? (frames * 1000) / active : 0;
      if (frames >= 10 && fps < 45) onSlow();
    }
  }
  requestAnimationFrame(tick);
}

let cached: boolean | null = null;
let probing = false;
const listeners = new Set<() => void>();

// ?lowend en la URL fuerza el modo ligero (útil para probar en desktop)
const forced =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("lowend");

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // Si las heurísticas no lo detectaron, medir el rendimiento real una vez
  if (!probing && !(cached ??= forced || detectLowEnd())) {
    probing = true;
    const start = () =>
      probeFrameRate(() => {
        cached = true;
        listeners.forEach((l) => l());
      });
    if (window.requestIdleCallback) {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 300);
    }
  }
  return () => {
    listeners.delete(onChange);
  };
};

// El resultado no cambia durante la sesión: se calcula una sola vez
const getSnapshot = () => (cached ??= forced || detectLowEnd());
const getServerSnapshot = () => false;

export function useLowEndDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
