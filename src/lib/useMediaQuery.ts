"use client";

import { useSyncExternalStore } from "react";

// El servidor siempre asume no-mobile; React corrige el render en el commit
// de hidratación antes de pintar, así que no hay flash ni montaje inútil
// de la versión pesada en teléfonos.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Mismo breakpoint que usan Hero, VideoCarousel y TryOnPanel
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
