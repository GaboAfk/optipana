"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, animate } from "framer-motion";
import { ClockIcon, SparkleIcon, TagIcon, WalletIcon } from "./icons";
import { Blob } from "./Blob";

const OFFER_KEY = "optipana-oferta-fin";
const OFFER_DAYS = 3;

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
      <span className="mb-5 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
        <ClockIcon className="mr-1 inline h-3.5 w-3.5" />
        Tiempo limitado
      </span>
      <p className="mb-2 font-display text-8xl font-bold leading-none">2×1</p>
      <p className="mb-2 font-display text-xl font-bold">en nuestras monturas</p>
      <p className="mb-7 text-sm leading-relaxed text-white/80">
        Con la compra de tus cristales, te llevas <strong>dos monturas</strong> al precio de una.
      </p>
      <div className="mb-6 flex gap-2">
        <CountdownBox value={countdown.days} label="días" />
        <CountdownBox value={countdown.hours} label="horas" />
        <CountdownBox value={countdown.minutes} label="min" />
        <CountdownBox value={countdown.seconds} label="seg" />
      </div>
      <a
        href="#catalogo"
        className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#FA5800] transition-colors hover:bg-orange-50"
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
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
        <Blob className="h-52 w-52" color="white" opacity={1} />
      </div>
      <span className="mb-5 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
        <WalletIcon className="mr-1 inline h-3.5 w-3.5" />
        Financiamiento disponible
      </span>
      <p className="mb-2 font-display text-8xl font-bold leading-none">
        <span ref={ref}>{value}%</span>
      </p>
      <p className="mb-2 font-display text-xl font-bold">Llévatelos hoy. Paga después.</p>
      <p className="mb-5 text-sm leading-relaxed text-white/80">
        0% de inicial — financia tus lentes en <strong className="font-display text-lg">6 cuotas</strong> cómodas.
      </p>
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur">
        <WalletIcon className="h-8 w-8 shrink-0 text-white" />
        <p className="text-sm font-bold text-white">Paga tu lente en 6 cuotas sin intereses.</p>
      </div>
      <a
        href="#contacto"
        className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#663399] transition-colors hover:bg-purple-50"
      >
        Saber más
      </a>
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
      <span className="mb-5 inline-block rounded-full bg-[#FA5800]/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
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
      <div className="mb-6 grid grid-cols-2 gap-3">
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
        className="inline-block rounded-full bg-[#FA5800] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e04d00]"
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

export function Offers() {
  const countdown = useOfferCountdown();
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Scroll horizontal secuestrado del scroll vertical en mobile
  const { scrollYProgress } = useScroll({
    target: mobileScrollRef,
    offset: ["start start", "end end"],
  });

  // 3 tarjetas de ~85vw cada una → necesitamos desplazar ~2 * 85vw = 170vw
  // Convertimos el progreso del scroll vertical en translateX horizontal
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.7%"]);

  const renderCard = (Component: (typeof CARDS)[number]["Component"]) => {
    if (Component === Card2x1) return <Card2x1 countdown={countdown} />;
    if (Component === Card0Percent) return <Card0Percent />;
    return <CardPrecios />;
  };

  return (
    <section id="ofertas" className="relative bg-[#F7F7F9] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-5 py-2 text-xs font-bold uppercase tracking-widest text-white">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            Ofertas por tiempo limitado
          </span>
        </div>

        {/* ── Mobile: scroll vertical → horizontal ────────────────────
            Un contenedor alto (300vh) que se queda "pegado" (sticky)
            mientras las tarjetas se desplazan horizontalmente.          */}
        <div ref={mobileScrollRef} className="relative h-[300vh] md:hidden">
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            <motion.div style={{ x }} className="flex gap-5 pl-4 pr-4">
              {CARDS.map(({ bg, shadow, Component }, i) => (
                <div
                  key={i}
                  className={`relative w-[85vw] max-w-sm shrink-0 overflow-hidden rounded-3xl ${bg} p-8 text-white shadow-xl ${shadow}`}
                >
                  {renderCard(Component)}
                </div>
              ))}
            </motion.div>

            {/* Indicador de progreso */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  style={{ scaleX: scrollYProgress }}
                  className="h-full origin-left rounded-full bg-brand-orange"
                />
              </div>
            </div>
          </div>
        </div>

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
              className={`relative overflow-hidden rounded-3xl ${bg} p-8 text-white shadow-xl ${shadow} transition-transform duration-300 hover:-translate-y-1.5`}
            >
              {renderCard(Component)}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
