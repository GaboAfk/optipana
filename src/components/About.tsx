"use client";

import { CheckIcon, GlassesIcon, MapPinIcon } from "./icons";
import { WaveDivider } from "./WaveDivider";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: GlassesIcon,
    stat: "+10 años",
    label: "de experiencia cuidando tu visión",
  },
  {
    icon: MapPinIcon,
    stat: "4 sucursales",
    label: "en Los Teques, Carrizal y San Antonio de los Altos",
  },
  {
    icon: CheckIcon,
    stat: "Atención personalizada",
    label: "con optometristas certificados",
  },
] as const;

export function About() {
  return (
    <section id="nosotros" className="relative overflow-hidden bg-brand-bg py-16 md:py-24">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-orange/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-brand-purple/10 blur-2xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 70, damping: 18 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-purple-light px-4 py-1.5 text-sm font-bold text-brand-purple">
            Nosotros
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-ink sm:text-4xl md:text-5xl">
            Cuatro locales, una sola pasión:{" "}
            <span className="bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">
              que veas bien y te veas increíble
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-brand-ink/70">
            En OptiPana combinamos calidad, atención personalizada y una gran variedad de estilos
            para que encuentres los lentes perfectos. Nuestros precios son en USD y contamos con
            opciones de financiamiento para que lleves tus lentes hoy.
          </p>

          <div className="mt-9 space-y-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.stat}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ delay: i * 0.12, type: "spring" as const, stiffness: 80, damping: 16 }}
                  className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-orange-soft text-brand-orange">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold leading-tight text-brand-ink">
                      {feature.stat}
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-brand-ink/60">{feature.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Visual decorativo */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 70, damping: 18 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <AboutArt />
        </motion.div>
      </div>
      <WaveDivider fill="#f3ebf9" />
    </section>
  );
}

function AboutArt() {
  return (
    <svg viewBox="0 0 480 480" className="h-auto w-full" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="aboutBlob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FA5800" />
          <stop offset="100%" stopColor="#663399" />
        </linearGradient>
        <linearGradient id="aboutLens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FA5800" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#663399" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      <path
        d="M240,24 C330,8 444,80 458,192 C472,304 404,430 292,462 C180,494 56,436 34,322 C12,208 60,74 150,40 C178,30 210,32 240,24 Z"
        fill="url(#aboutBlob)"
        opacity="0.9"
      />
      <path
        d="M60,132 C78,118 104,124 114,140 C124,156 114,176 96,180 C78,184 58,172 52,156 C46,144 48,140 60,132 Z"
        fill="#FFFFFF"
        opacity="0.25"
      />
      <path
        d="M404,352 C424,340 450,348 458,364 C466,380 454,398 436,400 C418,402 398,388 392,372 C388,360 392,358 404,352 Z"
        fill="#FFFFFF"
        opacity="0.2"
      />

      {/* Lentes grandes */}
      <circle cx="170" cy="240" r="88" fill="url(#aboutLens)" stroke="#FA5800" strokeWidth="16" />
      <circle cx="310" cy="240" r="88" fill="url(#aboutLens)" stroke="#FA5800" strokeWidth="16" />
      <path d="M258,240 Q240,212 222,240" stroke="#FA5800" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M82,240 Q54,232 36,214" stroke="#FA5800" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M398,240 Q426,232 444,214" stroke="#FA5800" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M118,186 Q142,164 170,166" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M258,186 Q282,164 310,166" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="12" fill="none" strokeLinecap="round" />

      {/* Chip flotante */}
      <g transform="translate(268,84)">
        <rect width="180" height="52" rx="26" fill="#FFFFFF" />
        <circle cx="26" cy="26" r="13" fill="#663399" />
        <path d="M20,26 l4,4 8,-9" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="50" y="31" fontFamily="Nunito, sans-serif" fontSize="17" fontWeight="800" fill="#2B2B2B">
          4 locales en Miranda
        </text>
      </g>
      <g transform="translate(36,360)">
        <rect width="170" height="52" rx="26" fill="#FFFFFF" />
        <circle cx="26" cy="26" r="13" fill="#FA5800" />
        <path d="M26,19 v14 M19,26 h14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <text x="50" y="31" fontFamily="Nunito, sans-serif" fontSize="17" fontWeight="800" fill="#2B2B2B">
          +10 años contigo
        </text>
      </g>
      <circle cx="96" cy="120" r="9" fill="#FA5800" opacity="0.8" />
      <circle cx="408" cy="160" r="7" fill="#663399" opacity="0.8" />
      <path d="M420,60 l7,14 14,7 -14,7 -7,14 -7,-14 -14,-7 14,-7 Z" fill="#FA5800" opacity="0.7" />
    </svg>
  );
}
