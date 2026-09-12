"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, animate } from "framer-motion";
import { ClockIcon, SparkleIcon, TagIcon, WalletIcon } from "./icons";
import { Blob } from "./Blob";

const OFFER_KEY = "optipana-oferta-fin";
const OFFER_DAYS = 3;

function useLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cores = navigator.hardwareConcurrency || 0;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 0;
    // Low-end si reduce-motion, o si ambos CPU/RAM son bajos, o si alguno es muy bajo
    setIsLowEnd(
      reduced ||
      (cores <= 4 && memory <= 4) ||
      cores <= 2 ||
      memory <= 2,
    );
  }, []);

  return isLowEnd;
}

function useOfferCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let end: number;
    try {
      const stored = window.localStorage.getItem(OFFER_KEY);
      end = stored ? Number(stored) : 0;
      if (!end || Number.isNaN(end) || end < Date.now()) {
        end = Date.now() + OFFER_DAYS * 24 * 60 * 60 * 1000;
        window.localStorage.setItem(OFFER_KEY, String(end));
      }
    } catch {
      end = Date.now() + OFFER_DAYS * 24 * 60 * 60 * 1000;
    }

    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (remaining === null) {
    return { days: "--", hours: "--", minutes: "--", seconds: "--" };
  }
  const total = Math.floor(remaining / 1000);
  return {
    days: String(Math.floor(total / 86400)).padStart(2, "0"),
    hours: String(Math.floor((total % 86400) / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
    seconds: String(total % 60).padStart(2, "0"),
  };
}

function CountdownBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/20 px-3 py-2 text-white backdrop-blur">
      <span className="font-display text-xl font-bold tabular-nums leading-none">{value}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );
}

// Cuenta animada de `from` a `to` cuando el elemento entra en pantalla
function useCountUp(from: number, to: number, duration = 1.5) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, from, to, duration]);

  return { ref, value };
}

// Variantes desktop: fade-up escalonado (estilo AOS)
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const cardVariantsDesktop = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 16 },
  },
};

/* ── Tarjetas ────────────────────────────────────────────── */

function Card2x1({ countdown }: { countdown: ReturnType<typeof useOfferCountdown> }) {
  return (
    <>
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
        <Blob className="h-52 w-52" color="white" opacity={1} />
      </div>
      <span className="mb-5 inline-block self-start rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
        <ClockIcon className="mr-1 inline h-3.5 w-3.5" />
        Tiempo limitado
      </span>
      <p className="mb-2 font-display text-8xl font-bold leading-none">2×1</p>
      <p className="mb-2 font-display text-xl font-bold">en nuestras monturas</p>
      <p className="mb-7 text-sm leading-relaxed text-white/80">
        Con la compra de tus cristales, te llevas <strong>dos monturas</strong> al precio de una.
      </p>
      <div className="mt-auto mb-6 flex gap-2">
        <CountdownBox value={countdown.days} label="días" />
        <CountdownBox value={countdown.hours} label="horas" />
        <CountdownBox value={countdown.minutes} label="min" />
        <CountdownBox value={countdown.seconds} label="seg" />
      </div>
      <a
        href="#catalogo"
        className="self-start inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#FA5800] transition-colors hover:bg-orange-50"
      >
        Aprovechar oferta
      </a>
    </>
  );
}

function Card0Percent() {
  const { ref, value } = useCountUp(50, 0, 2);
  return (
    <>
      {/* Gif de Cashea como fondo de la card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/walking-guy-cashea.gif"
        alt="Cashea — financia tus lentes en cuotas"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
        <Blob className="h-52 w-52" color="white" opacity={1} />
      </div>
      <div className="relative flex flex-1 flex-col">
        <span className="mb-5 inline-block self-start rounded-full  px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
          {/* <WalletIcon className="mr-1 inline h-3.5 w-3.5" />
          Financiamiento disponible */}
        </span>
        <p className="mb-2 font-display text-8xl font-bold leading-none">
          <span ref={ref}>{value}%</span>
        </p>
        <p className="mb-2 font-display text-xl font-bold">Llévatelos hoy. Paga después con Cashea.</p>
        <p className="mb-5 text-sm leading-relaxed text-white/80">
          0% de inicial — financia tus lentes en <strong className="font-display text-lg">6 cuotas</strong> cómodas.
        </p>
        <div className="mt-auto mb-6 flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <WalletIcon className="h-8 w-8 shrink-0 text-white" />
          <p className="text-sm font-bold text-white">Paga tu lente en 6 cuotas sin intereses.</p>
        </div>
        <a
          href="#contacto"
          className="self-start inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#663399] transition-colors hover:bg-purple-50"
        >
          Saber más
        </a>
      </div>
    </>
  );
}

function CardPrecios() {
  const { ref, value } = useCountUp(100, 50, 2);
  return (
    <>
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
        <Blob className="h-52 w-52" color="#FA5800" opacity={1} />
      </div>
      <span className="mb-5 inline-block self-start rounded-full bg-[#FA5800]/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
        <TagIcon className="mr-1 inline h-3.5 w-3.5" />
        Esta semana
      </span>
      <p className="mb-2 font-display text-4xl font-bold leading-tight">
        Precios<br />especiales
      </p>
      <p className="mb-2 font-display text-xl font-bold text-[#FA5800]">¡No te lo pierdas!</p>
      <p className="mb-5 text-sm leading-relaxed text-white/70">
        Visítanos en cualquiera de nuestros <strong>4 locales</strong> y pregunta por las ofertas del momento.
      </p>
      <div className="mt-auto mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 p-3 text-center">
          <p className="font-display text-2xl font-bold text-[#FA5800]">4</p>
          <p className="text-xs font-bold text-white/60">locales</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 text-center">
          <p className="font-display text-2xl font-bold text-[#FA5800]">
            <span ref={ref}>-{value}%</span>
          </p>
          <p className="text-xs font-bold text-white/60">en selección</p>
        </div>
      </div>
      <a
        href="#locales"
        className="self-start inline-block rounded-full bg-[#FA5800] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e04d00]"
      >
        Ver locales
      </a>
    </>
  );
}

const CARDS = [
  { bg: "bg-gradient-to-br from-[#FA5800] to-[#ff7030]", shadow: "shadow-[#FA5800]/25", Component: Card2x1 },
  { bg: "bg-gradient-to-br from-[#663399] to-[#8B44CC]", shadow: "shadow-[#663399]/25", Component: Card0Percent },
  { bg: "bg-gradient-to-br from-[#1A0D2B] to-[#2D1452]", shadow: "", Component: CardPrecios },
] as const;

function renderCard(Component: (typeof CARDS)[number]["Component"], countdown: ReturnType<typeof useOfferCountdown>) {
  if (Component === Card2x1) return <Card2x1 countdown={countdown} />;
  if (Component === Card0Percent) return <Card0Percent />;
  return <CardPrecios />;
}

/* ── Modos mobile ────────────────────────────────────────── */

function MobileHighEndCarousel({ countdown }: { countdown: ReturnType<typeof useOfferCountdown> }) {
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: mobileScrollRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.7%"]);

  // Swipe horizontal en mobile → mueve el scroll de la página (y con él, el carrusel).
  // El swipe vertical se deja al scroll nativo para no bloquear la navegación.
  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const sticky = container.firstElementChild as HTMLElement | null;
    if (!sticky) return;

    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let sectionTop = 0;
    let axis: "x" | "y" | null = null;

    // ── Snap a la card más cercana al soltar el scroll ──
    let settleTimer: number | undefined;
    let snapAnim: ReturnType<typeof animate> | null = null;
    let lastY = window.scrollY;
    let dir: 1 | -1 = 1;

    const sectionRange = () => ({
      top: container.getBoundingClientRect().top + window.scrollY,
      max: container.scrollHeight - window.innerHeight,
    });

    // Progreso de scroll (0-1) en el que cada card queda alineada como la primera
    const snapPoints = () => {
      const track = trackRef.current;
      const count = track?.children.length ?? 0;
      if (!track || count < 2) return [0, 1];
      const cardW = (track.children[0] as HTMLElement).offsetWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const travel = track.offsetWidth * 0.667;
      const step = cardW + gap;
      return Array.from({ length: count }, (_, i) =>
        i === count - 1 ? 1 : Math.min(1, (i * step) / travel),
      );
    };

    const snapToNearest = () => {
      const { top, max } = sectionRange();
      const y = window.scrollY;
      // Si el usuario ya salió de la sección, no hacer nada
      if (y < top - 1 || y > top + max + 1) return;
      const p = Math.min(1, Math.max(0, (y - top) / max));
      const pts = snapPoints();
      let i = 0;
      while (i < pts.length - 2 && p > pts[i + 1]) i++;
      const a = pts[i];
      const b = pts[i + 1];
      const local = (p - a) / (b - a || 1);
      // ~30% de la siguiente card visible → completa el avance en esa dirección
      const target = dir === 1 ? (local > 0.3 ? b : a) : (local < 0.7 ? a : b);
      const targetY = top + target * max;
      if (Math.abs(targetY - y) < 2) return;
      snapAnim?.stop();
      snapAnim = animate(y, targetY, {
        duration: 0.45,
        ease: [0.32, 0.72, 0, 1],
        onUpdate: (v) => window.scrollTo({ top: v, behavior: "instant" }),
      });
    };

    const scheduleSnap = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(snapToNearest, 140);
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 1) dir = y > lastY ? 1 : -1;
      lastY = y;
      const { top, max } = sectionRange();
      if (y >= top - 1 && y <= top + max + 1) scheduleSnap();
    };

    const cancelSnap = () => snapAnim?.stop();

    const onTouchStart = (e: TouchEvent) => {
      cancelSnap();
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
        // 1:1 — las cards recorren los mismos px que el dedo.
        // El track se traslada -66.7% de su ancho a lo largo de todo el rango de scroll.
        const travel = (trackRef.current?.offsetWidth || window.innerWidth) * 0.667;
        const delta = -(dx / travel) * maxV;
        const next = Math.min(sectionTop + maxV, Math.max(sectionTop, startScroll + delta));
        // "instant" evita que html { scroll-behavior: smooth } anime cada paso del swipe
        window.scrollTo({ top: next, behavior: "instant" });
      }
    };

    sticky.addEventListener("touchstart", onTouchStart, { passive: true });
    sticky.addEventListener("touchmove", onTouchMove, { passive: false });
    sticky.addEventListener("touchend", scheduleSnap, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", cancelSnap, { passive: true });
    return () => {
      window.clearTimeout(settleTimer);
      snapAnim?.stop();
      sticky.removeEventListener("touchstart", onTouchStart);
      sticky.removeEventListener("touchmove", onTouchMove);
      sticky.removeEventListener("touchend", scheduleSnap);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", cancelSnap);
    };
  }, []);

  return (
    <div ref={mobileScrollRef} className="relative h-[250vh] md:hidden">
      <div className="sticky top-0 flex h-screen touch-pan-y flex-col overflow-hidden">
        <div className="pt-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-5 py-2 text-xs font-bold uppercase tracking-widest text-white">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            Ofertas por tiempo limitado
          </span>
        </div>

        <div className="flex flex-1 items-center overflow-hidden">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex gap-5 pl-4 pr-4 will-change-transform"
          >
            {CARDS.map(({ bg, shadow, Component }, i) => (
              <div
                key={i}
                className={`relative flex w-[85vw] max-w-sm shrink-0 flex-col overflow-hidden rounded-3xl ${bg} p-8 text-white shadow-xl ${shadow}`}
              >
                {renderCard(Component, countdown)}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="pb-8 pt-4 text-center">
          <div className="mx-auto h-1 w-24 overflow-hidden rounded-full bg-white/20">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-full origin-left rounded-full bg-brand-orange"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLowEndCarousel({ countdown }: { countdown: ReturnType<typeof useOfferCountdown> }) {
  return (
    <div className="md:hidden">
      <div className="pb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-5 py-2 text-xs font-bold uppercase tracking-widest text-white">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          Ofertas por tiempo limitado
        </span>
      </div>

      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CARDS.map(({ bg, shadow, Component }, i) => (
          <div
            key={i}
            className={`relative flex w-[85vw] max-w-sm shrink-0 snap-center flex-col overflow-hidden rounded-3xl ${bg} p-8 text-white shadow-xl ${shadow} will-change-transform`}
          >
            {renderCard(Component, countdown)}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs font-semibold text-brand-ink/40">
        Desliza para ver más ofertas
      </p>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────── */

export function Offers() {
  const countdown = useOfferCountdown();
  const isLowEnd = useLowEndDevice();

  return (
    <section id="ofertas" className="relative bg-[#F7F7F9] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-center md:mb-10 md:block" style={{ display: 'none' }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-5 py-2 text-xs font-bold uppercase tracking-widest text-white">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            Ofertas por tiempo limitado
          </span>
        </div>

        {/* ── Mobile: dos modos según FPS medido ── */}
        {isLowEnd ? (
          <MobileLowEndCarousel countdown={countdown} />
        ) : (
          <MobileHighEndCarousel countdown={countdown} />
        )}

        {/* ── Desktop: grid de 3 columnas con fade-up escalonado ─────── */}
        <motion.div
          className="hidden gap-5 md:grid md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
        >
          {CARDS.map(({ bg, shadow, Component }, i) => (
            <motion.div
              key={i}
              variants={cardVariantsDesktop}
              className={`relative flex flex-col overflow-hidden rounded-3xl ${bg} p-8 text-white shadow-xl ${shadow} transition-transform duration-300 hover:-translate-y-1.5`}
            >
              {renderCard(Component, countdown)}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
