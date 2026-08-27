"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { StarIcon } from "./icons";

type Testimonial = {
  name: string;
  initial: string;
  location: string;
  color: string;
  comment: string;
};

type OrbitTestimonialsProps = {
  testimonials: readonly Testimonial[];
};

type ModelViewerElement = HTMLElement & {
  getCameraOrbit: () => { theta: number; phi: number; radius: number };
  cameraOrbit: string;
};

const RADIUS = 260;
const ROTATE_SPEED = 0.045; // grados por frame
const PRECISION = 10000; // 4 decimales — evita mismatches de hidratación SSR/cliente
const PHI_DEFAULT = 75;
const SCROLL_TO_DEG = 0.16; // grados de giro vertical por px de scroll
const SCROLL_IDLE_MS = 500; // tiempo sin scroll antes de empezar a volver a la posición normal
const EASE_BACK_SPEED = 0.06; // fracción de la distancia restante que recupera por frame

function round(n: number) {
  return Math.round(n * PRECISION) / PRECISION;
}

// Distribución uniforme de N puntos sobre una esfera (Fibonacci sphere)
function fibonacciSphere(count: number) {
  const points: { azimuth: number; elevation: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2; // de 1 a -1
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    const azimuth = round((Math.atan2(x, z) * 180) / Math.PI);
    const elevation = round((Math.asin(y) * 180) / Math.PI);
    points.push({ azimuth, elevation });
  }
  return points;
}

export function OrbitTestimonials({ testimonials }: OrbitTestimonialsProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const modelWrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modelRef = useRef<ModelViewerElement | null>(null);
  const rotationRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const lastScrollYRef = useRef<number | null>(null);
  const phiRef = useRef(PHI_DEFAULT);
  const scrollIdleTimerRef = useRef<number | undefined>(undefined);
  const easeRafRef = useRef<number | undefined>(undefined);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const points = useMemo(() => fibonacciSphere(testimonials.length), [testimonials.length]);

  // Registra el custom element <model-viewer> solo en el cliente
  useEffect(() => {
    import("@google/model-viewer").then(() => setModelReady(true));
  }, []);

  // Rotación automática de la esfera + gating de tarjetas de frente/atrás
  useEffect(() => {
    const tick = () => {
      if (!pausedRef.current && sceneRef.current) {
        rotationRef.current += ROTATE_SPEED;
        const g = round(rotationRef.current);
        sceneRef.current.style.transform = `rotateY(${g}deg)`;

        // Contrarresta la rotación del grupo para que el logo (que gira por
        // su cuenta vía auto-rotate) se mantenga estable en el centro,
        // mientras sigue ordenado por profundidad real junto a las tarjetas
        // (mismo grupo preserve-3d ⇒ el navegador intercala automáticamente).
        if (modelWrapperRef.current) {
          modelWrapperRef.current.style.transform = `rotateY(${-g}deg)`;
        }

        // Determina qué tan de frente está cada tarjeta y solo bloquea la
        // interacción de las que quedan realmente detrás del logo (centro
        // de la esfera); el resto —aunque estén de lado— sí se pueden
        // seleccionar, con una opacidad que se degrada de forma continua.
        points.forEach((p, i) => {
          const card = cardRefs.current[i];
          if (!card) return;
          const totalAzimuthRad = ((g + p.azimuth) * Math.PI) / 180;
          const elevationRad = (p.elevation * Math.PI) / 180;
          const facingCamera = Math.cos(totalAzimuthRad) * Math.cos(elevationRad);
          const isBehindLogo = facingCamera < -0.55;
          const opacity = Math.min(1, Math.max(0.45, 0.7 + facingCamera * 0.3));
          card.style.pointerEvents = isBehindLogo ? "none" : "auto";
          card.style.opacity = String(opacity);
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [points]);

  // El scroll de la página gira el logo verticalmente, incluso hasta
  // ponerlo de cabeza. La rotación horizontal sigue siendo automática vía
  // auto-rotate, independiente del scroll. Al detenerse el scroll, el logo
  // regresa poco a poco a su orientación normal.
  useEffect(() => {
    if (!modelReady) return;
    const model = modelRef.current;
    if (!model) return;

    const applyPhi = (theta: number) => {
      try {
        const current = model.getCameraOrbit();
        const radiusStr = `${current.radius}m`;
        model.cameraOrbit = `${theta}deg ${round(phiRef.current)}deg ${radiusStr}`;
      } catch {
        // getCameraOrbit puede no estar listo aún en el primer render
      }
    };

    const stopEaseBack = () => {
      if (easeRafRef.current) {
        cancelAnimationFrame(easeRafRef.current);
        easeRafRef.current = undefined;
      }
    };

    const startEaseBack = () => {
      stopEaseBack();
      const step = () => {
        const diff = PHI_DEFAULT - phiRef.current;
        if (Math.abs(diff) < 0.05) {
          phiRef.current = PHI_DEFAULT;
          const current = model.getCameraOrbit();
          applyPhi(round((current.theta * 180) / Math.PI));
          easeRafRef.current = undefined;
          return;
        }
        phiRef.current += diff * EASE_BACK_SPEED;
        const current = model.getCameraOrbit();
        applyPhi(round((current.theta * 180) / Math.PI));
        easeRafRef.current = requestAnimationFrame(step);
      };
      easeRafRef.current = requestAnimationFrame(step);
    };

    const onScroll = () => {
      stopEaseBack();

      const y = window.scrollY;
      if (lastScrollYRef.current === null) {
        lastScrollYRef.current = y;
        return;
      }
      const delta = y - lastScrollYRef.current;
      lastScrollYRef.current = y;
      // Sin límites: puede girar libremente e incluso quedar de cabeza
      phiRef.current += delta * SCROLL_TO_DEG;

      const current = model.getCameraOrbit();
      applyPhi(round((current.theta * 180) / Math.PI));

      window.clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = window.setTimeout(startEaseBack, SCROLL_IDLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollIdleTimerRef.current);
      stopEaseBack();
    };
  }, [modelReady]);

  const hovered = hoveredIndex !== null ? testimonials[hoveredIndex] : null;

  return (
    <div
      className="relative mx-auto h-[560px] w-full max-w-4xl"
      style={{ perspective: "1400px" }}
    >
      {/* Panel de lectura — desacoplado del grupo 3D para que nunca se mueva
          bajo el cursor y así evitar el parpadeo con tarjetas muy inclinadas */}
      {hovered && (
        <div
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          style={{ perspective: "none" }}
        >
          <div className="orbit-spotlight-in w-72 rounded-2xl bg-white p-6 shadow-2xl shadow-brand-purple/25 ring-1 ring-brand-ink/5">
            <div className="flex items-center gap-0.5 text-brand-orange">
              {Array.from({ length: 5 }).map((_, j) => (
                <StarIcon key={j} className="h-4 w-4" />
              ))}
            </div>
            <blockquote className="mt-3 text-[15px] leading-relaxed text-brand-ink/80">
              “{hovered.comment}”
            </blockquote>
            <footer className="mt-5 flex items-center gap-3 border-t border-brand-ink/5 pt-4">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-base font-bold text-white ${
                  hovered.color === "orange" ? "bg-brand-orange" : "bg-brand-purple"
                }`}
              >
                {hovered.initial}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-brand-ink">{hovered.name}</p>
                <p className="truncate text-sm font-semibold text-brand-ink/50">{hovered.location}</p>
              </div>
            </footer>
          </div>
        </div>
      )}

      <div
        ref={sceneRef}
        className="absolute left-1/2 top-1/2 z-10"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateY(0deg)",
        }}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
          setHoveredIndex(null);
        }}
      >
        {/* Logo 3D en el centro de la esfera. Al ser hermano de las tarjetas
            dentro del mismo grupo preserve-3d, el navegador las ordena por
            profundidad real: las tarjetas de frente lo tapan, y él tapa las
            de atrás, sin necesitar z-index manual. */}
        {modelReady && (
          <div
            ref={modelWrapperRef}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="pointer-events-none h-52 w-52">
              <model-viewer
                ref={modelRef as unknown as RefObject<HTMLElement>}
                src="/optipana_logo.glb"
                alt="Logo OptiPana"
                auto-rotate
                rotation-per-second="18deg"
                camera-orbit={`0deg ${PHI_DEFAULT}deg 150%`}
                min-camera-orbit="auto 0deg auto"
                max-camera-orbit="auto 180deg auto"
                interpolation-decay="50"
                disable-zoom
                interaction-prompt="none"
                exposure="1.2"
                shadow-intensity="0.7"
                tone-mapping="neutral"
                style={{ width: "100%", height: "100%", backgroundColor: "transparent", pointerEvents: "none" }}
              />
            </div>
          </div>
        )}

        {testimonials.map((t, i) => {
          const { azimuth, elevation } = points[i];
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={t.name}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                transformStyle: "preserve-3d",
                // La posición de la tarjeta en la esfera NUNCA cambia al
                // hacer hover — solo se resalta. Así el cursor jamás queda
                // fuera del área y no hay parpadeo/vibración.
                transform: `rotateY(${azimuth}deg) rotateX(${-elevation}deg) translateZ(${RADIUS}px)`,
              }}
            >
              <div
                className="orbit-float w-56"
                style={{
                  animationDelay: `${(i * 0.37) % 3}s`,
                  animationPlayState: isHovered ? "paused" : "running",
                }}
              >
                <div
                  className={`cursor-pointer rounded-2xl bg-white p-5 shadow-lg shadow-brand-purple/15 ring-1 transition-all duration-300 ${
                    isHovered ? "opacity-0 ring-brand-orange" : "opacity-100 ring-brand-ink/5"
                  }`}
                  onMouseEnter={() => setHoveredIndex(i)}
                >
                  <div className="flex items-center gap-0.5 text-brand-orange">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <StarIcon key={j} className="h-3.5 w-3.5" />
                    ))}
                  </div>
                  <blockquote className="mt-3 line-clamp-4 text-[13px] leading-relaxed text-brand-ink/80">
                    “{t.comment}”
                  </blockquote>
                  <footer className="mt-4 flex items-center gap-2.5 border-t border-brand-ink/5 pt-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-white ${
                        t.color === "orange" ? "bg-brand-orange" : "bg-brand-purple"
                      }`}
                    >
                      {t.initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-brand-ink">{t.name}</p>
                      <p className="truncate text-xs font-semibold text-brand-ink/50">{t.location}</p>
                    </div>
                  </footer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
