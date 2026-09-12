"use client";

import { useSyncExternalStore } from "react";

let cached: boolean | null = null;

function detectLowEnd(): boolean {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency || 0;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 0;
  // Low-end si reduce-motion, o si ambos CPU/RAM son bajos, o si alguno es muy bajo
  return reduced || (cores <= 4 && memory <= 4) || cores <= 2 || memory <= 2;
}

const subscribe = () => () => {};

// ?lowend en la URL fuerza el modo ligero (útil para probar en desktop)
const forced =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("lowend");

// El resultado no cambia durante la sesión: se calcula una sola vez
const getSnapshot = () => forced || (cached ??= detectLowEnd());
const getServerSnapshot = () => false;

export function useLowEndDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
