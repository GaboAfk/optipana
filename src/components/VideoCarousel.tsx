"use client";

import { useEffect, useRef, useState } from "react";

const REELS = [
  "/hero_reel/reel1.mp4",
  "/hero_reel/reel2.mp4",
  "/hero_reel/reel3.mp4",
  "/hero_reel/reel4.mp4",
];

const AUTO_ADVANCE_MS = 5000;

export function VideoCarousel() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Carga todos los videos desde el inicio
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.load();
    });
  }, []);

  // Reproduce solo el video activo, pausa los demás (sin reiniciar)
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active]);

  // Auto-advance cada 5s en bucle
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % REELS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full" style={{ perspective: "1000px" }}>
      {REELS.map((src, i) => {
        const offset = i - active;
        const isLeft = offset === -1 || (active === 0 && i === REELS.length - 1);
        const isRight = offset === 1 || (active === REELS.length - 1 && i === 0);
        const isActive = i === active;

        let transform = "";
        let opacity = 0;
        let zIndex = 0;

        if (isActive) {
          transform = "translateX(0) translateZ(0) scale(1)";
          opacity = 1;
          zIndex = 10;
        } else if (isLeft) {
          transform = "translateX(-60%) translateZ(-100px) scale(0.8) rotateY(15deg)";
          opacity = 0.4;
          zIndex = 5;
        } else if (isRight) {
          transform = "translateX(60%) translateZ(-100px) scale(0.8) rotateY(-15deg)";
          opacity = 0.4;
          zIndex = 5;
        } else {
          transform = "translateZ(-200px) scale(0.6)";
          opacity = 0;
          zIndex = 0;
        }

        return (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={src}
            muted
            loop
            preload="auto"
            playsInline
            className="absolute inset-0 h-full w-full rounded-[2.5rem] object-cover transition-all duration-700 ease-out [&]:bg-transparent"
            style={{
              transform,
              opacity,
              zIndex,
              filter: isActive ? "blur(0)" : "blur(4px)",
              backgroundColor: "transparent",
            }}
          />
        );
      })}

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {REELS.map((_, i) => (
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
