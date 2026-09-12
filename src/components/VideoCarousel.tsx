"use client";

import { useEffect, useRef, useState } from "react";
import { useLowEndDevice } from "@/lib/useLowEndDevice";

const REELS = [
  "/hero_reel/reel1.mp4",
  "/hero_reel/reel2.mp4",
  "/hero_reel/reel3.mp4",
  "/hero_reel/reel4.mp4",
];

// Variantes ligeras (360px, tune fastdecode) para gama baja
const REELS_LOW = [
  "/hero_reel/reel1-low.mp4",
  "/hero_reel/reel2-low.mp4",
  "/hero_reel/reel3-low.mp4",
  "/hero_reel/reel4-low.mp4",
];

const POSTERS = [
  "/hero_reel/reel1.avif",
  "/hero_reel/reel2.avif",
  "/hero_reel/reel3.avif",
  "/hero_reel/reel4.avif",
];

const AUTO_ADVANCE_MS = 5000;

export function VideoCarousel() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const isLowEnd = useLowEndDevice();

  const sources = isLowEnd ? REELS_LOW : REELS;

  // Detecta mobile para cambiar la disposición de los videos adyacentes
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Carga todos los videos desde el inicio (en low-end se omite: preload="metadata" basta)
  useEffect(() => {
    if (isLowEnd) return;
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.load();
    });
  }, [isLowEnd]);

  // Pausa todo cuando el carrusel sale del viewport o la pestaña se oculta
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Reproduce solo el video activo, pausa los demás (sin reiniciar)
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && inView && pageVisible) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, isLowEnd, inView, pageVisible]);

  // Auto-advance cada 5s en bucle
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % REELS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-transparent" style={{ perspective: isMobile ? "800px" : "1000px" }}>
      {sources.map((src, i) => {
        const offset = i - active;
        const isLeft = offset === -1 || (active === 0 && i === sources.length - 1);
        const isRight = offset === 1 || (active === sources.length - 1 && i === 0);
        const isActive = i === active;

        let transform = "";
        let opacity = 0;
        let zIndex = 0;

        if (isActive) {
          transform = "translateX(0) translateZ(0) scale(1)";
          opacity = 1;
          zIndex = 10;
        } else if (isLeft) {
          // En mobile: arriba; en desktop: izquierda. En low-end: solo transforms 2D.
          transform = isMobile
            ? isLowEnd
              ? "translateY(-35%) scale(0.7)"
              : "translateY(-45%) translateZ(-100px) scale(0.78) rotateX(15deg)"
            : isLowEnd
              ? "translateX(-85%) scale(0.75)"
              : "translateX(-85%) translateZ(-150px) scale(0.75) rotateY(20deg)";
          opacity = isMobile ? 0.4 : 0.3;
          zIndex = 5;
        } else if (isRight) {
          // En mobile: abajo; en desktop: derecha
          transform = isMobile
            ? isLowEnd
              ? "translateY(35%) scale(0.7)"
              : "translateY(45%) translateZ(-100px) scale(0.78) rotateX(-15deg)"
            : isLowEnd
              ? "translateX(85%) scale(0.75)"
              : "translateX(85%) translateZ(-150px) scale(0.75) rotateY(-20deg)";
          opacity = isMobile ? 0.4 : 0.3;
          zIndex = 5;
        } else {
          transform = isLowEnd ? "scale(0.6)" : "translateZ(-200px) scale(0.6)";
          opacity = 0;
          zIndex = 0;
        }

        return (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={src}
            poster={POSTERS[i]}
            muted
            loop
            preload={isLowEnd ? "metadata" : "auto"}
            playsInline
            className="absolute inset-0 h-full w-full rounded-[2.5rem] object-cover transition-all duration-700 ease-out [&]:bg-transparent"
            style={{
              transform,
              opacity,
              zIndex,
              // blur sobre video en reproducción es muy caro en GPUs débiles
              filter: !isActive && !isLowEnd ? "blur(4px)" : "none",
              backgroundColor: "transparent",
              background: "transparent",
            }}
          />
        );
      })}

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {sources.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Video ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
