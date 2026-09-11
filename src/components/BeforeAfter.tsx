"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ImageCompare } from "./ImageCompare";

export function BeforeAfter() {
  const stickyRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  // El contenedor sticky ocupa 200vh: 1 pantalla de "lock" + el espacio para salir
  const { scrollYProgress } = useScroll({
    target: stickyRef,
    offset: ["start start", "end end"],
  });

  // Scroll abajo → position 0 → se ve "after" (con lentes)
  // Scroll arriba → position 100 → se ve "before" (sin lentes)
  const sliderPosition = useTransform(scrollYProgress, [0, 1], [100, 0]);

  // Swipe horizontal en mobile → mueve el scroll de la página (y con él, la barra).
  // El swipe vertical se deja al scroll nativo para no bloquear la navegación.
  useEffect(() => {
    const container = stickyRef.current;
    if (!container) return;
    const sticky = container.firstElementChild as HTMLElement | null;
    if (!sticky) return;

    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let sectionTop = 0;
    let axis: "x" | "y" | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScroll = window.scrollY;
      sectionTop = container.getBoundingClientRect().top + window.scrollY;
      axis = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      // Direction lock: decide el eje dominante una sola vez
      if (!axis) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (axis === "x") {
        e.preventDefault();
        const maxV = container.scrollHeight - window.innerHeight;
        // 1:1 — la barra recorre los mismos px que el dedo (100% de posición = ancho del comparador)
        const width = compareRef.current?.offsetWidth || window.innerWidth;
        const delta = -(dx / width) * maxV;
        const next = Math.min(sectionTop + maxV, Math.max(sectionTop, startScroll + delta));
        // "instant" evita que html { scroll-behavior: smooth } anime cada paso del swipe
        window.scrollTo({ top: next, behavior: "instant" });
      }
    };

    sticky.addEventListener("touchstart", onTouchStart, { passive: true });
    sticky.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      sticky.removeEventListener("touchstart", onTouchStart);
      sticky.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <section className="relative bg-[#F7F7F9]">
      {/* Contenedor alto que crea el espacio de scroll para el sticky */}
      <div ref={stickyRef} className="relative h-[200vh]">
        <div className="sticky top-5 flex h-screen touch-pan-y flex-col items-center justify-center overflow-hidden px-5 sm:top-0 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
            className="mx-auto w-full px-2 sm:max-w-4xl sm:px-0"
          >
            {/* Encabezado */}
            <div className="mb-6 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-purple-light px-4 py-1.5 text-sm font-bold text-brand-purple">
                Antes y después
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-brand-ink sm:text-4xl md:text-5xl">
                La diferencia se <span className="text-brand-orange">ve</span>
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-[15px] leading-relaxed text-brand-ink/70">
                Sigue scrolleando para ver la transformación.
              </p>
            </div>

            {/* Comparador */}
            <div ref={compareRef} className="relative overflow-hidden rounded-3xl shadow-2xl shadow-brand-purple/15">
              <ImageCompare
                beforeSrc="/niña_sin_lentes.jpg"
                afterSrc="/niña_con_lentes.jpg"
                beforeAlt="Niña sin lentes"
                afterAlt="Niña con lentes"
                beforeLabel="Sin lentes"
                afterLabel="Con lentes"
                sliderColor="#FA5800"
                scrollPosition={sliderPosition}
                className="aspect-[4/5] w-full sm:aspect-[3/2] sm:max-w-4xl"
              />
            </div>

            {/* Indicador de progreso */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-xs font-bold text-brand-ink/50">Sin lentes</span>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-brand-ink/10">
                <motion.div
                  style={{ scaleX: scrollYProgress }}
                  className="h-full origin-left rounded-full bg-brand-orange"
                />
              </div>
              <span className="text-xs font-bold text-brand-ink/50">Con lentes</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
