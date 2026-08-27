"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ImageCompare } from "./ImageCompare";

export function BeforeAfter() {
  const stickyRef = useRef<HTMLDivElement>(null);

  // El contenedor sticky ocupa 200vh: 1 pantalla de "lock" + el espacio para salir
  const { scrollYProgress } = useScroll({
    target: stickyRef,
    offset: ["start start", "end end"],
  });

  // Scroll abajo → position 0 → se ve "after" (con lentes)
  // Scroll arriba → position 100 → se ve "before" (sin lentes)
  const sliderPosition = useTransform(scrollYProgress, [0, 1], [100, 0]);

  return (
    <section className="relative bg-[#F7F7F9]">
      {/* Contenedor alto que crea el espacio de scroll para el sticky */}
      <div ref={stickyRef} className="relative h-[200vh]">
        <div className="sticky top-5 flex h-screen flex-col items-center justify-center overflow-hidden px-5 sm:top-0 sm:px-8">
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
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-brand-purple/15">
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
