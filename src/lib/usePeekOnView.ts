"use client";

import { useEffect, type RefObject } from "react";
import { animate } from "framer-motion";

// Al entrar en vista, "asoma" el siguiente item de una lista scrolleable
// horizontal y regresa — sugiere que hay más contenido. No hace nada si la
// lista no es scrolleable (p. ej. en desktop donde se muestra como grid).
export function usePeekOnView(listRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = listRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    let interacted = false;
    let anim: ReturnType<typeof animate> | null = null;
    let timer: number | undefined;

    const peek = () => {
      if (interacted || el.scrollLeft > 4) return;
      const distance = Math.min(130, el.clientWidth * 0.32);
      // sin snap para poder quedar a mitad de camino entre cards
      el.style.scrollSnapType = "none";
      anim?.stop();
      anim = animate(0, distance, {
        duration: 0.6,
        ease: "easeOut",
        onUpdate: (v) => { el.scrollLeft = v; },
        onComplete: () => {
          anim = animate(distance, 0, {
            duration: 0.9,
            ease: [0.32, 0.72, 0, 1],
            onUpdate: (v) => { el.scrollLeft = v; },
            onComplete: () => { el.style.scrollSnapType = ""; },
          });
        },
      });
    };

    const cancel = () => {
      interacted = true;
      anim?.stop();
      window.clearTimeout(timer);
      el.style.scrollSnapType = "";
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) timer = window.setTimeout(peek, 500);
    }, { threshold: 0.5 });

    io.observe(el);
    el.addEventListener("pointerdown", cancel);
    return () => {
      io.disconnect();
      cancel();
      el.removeEventListener("pointerdown", cancel);
    };
  }, [listRef]);
}
