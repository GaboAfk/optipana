"use client";

import { motion } from "framer-motion";
import { WaveDivider } from "./WaveDivider";

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.5 12h16" />
      </svg>
    ),
    title: "1. Examen Gratis",
    desc: "Evaluación completa por especialistas.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <circle cx="6.5" cy="13" r="4" />
        <circle cx="17.5" cy="13" r="4" />
        <path d="M10.5 13c0-2.5 1-4 1.5-4s1.5 1.5 1.5 4" />
        <path d="M2.5 13c0-3 .5-5 1-6M21.5 13c0-3-.5-5-1-6" />
      </svg>
    ),
    title: "2. Elige tus Lentes",
    desc: "Cientos de opciones a tu disposición.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
    title: "3. Entrega Inmediata",
    desc: "Llevate tus lentes listos en minutos.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 16 },
  },
};

export function Jornadas() {
  return (
    <section
      id="jornadas"
      className="relative overflow-hidden bg-gradient-to-br from-brand-purple to-purple-900 py-16 text-white md:py-24"
    >
      {/* Onda superior — transición desde Services (#f7f7f9) */}
      <div
        className="pointer-events-none absolute -top-px left-0 right-0 z-10 leading-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 56"
          className="block w-full"
          style={{ height: 40 }}
          preserveAspectRatio="none"
        >
          <path
            fill="#f7f7f9"
            d="M0,28 C360,0 720,56 1080,28 C1260,14 1380,28 1440,40 L1440,0 L0,0 Z"
          />
        </svg>
      </div>

      {/* Formas decorativas */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-brand-orange/20 blur-2xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-12 px-5 text-center sm:px-8">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FDFA3E] px-5 py-2 text-sm font-bold text-black shadow-lg transition-transform hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            <span className="whitespace-nowrap">Paga en cuotas con</span>
            <span className="relative inline-flex h-7 w-28 items-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cashea.webp"
                alt="CASHEA"
                className="absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 object-contain"
                style={{ clipPath: "inset(40% 20% 40% 20%)" }}
              />
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Operativos de Salud Visual
          </h2>
          <p className="mx-auto max-w-2xl text-lg opacity-90">
            Acércate a nuestras jornadas, examina tu vista gratis y llévate tus lentes de inmediato.
          </p>
        </motion.div>

        {/* Pasos */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3"
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.title}
              variants={item}
              className="group flex flex-col items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 transition-colors group-hover:bg-brand-orange">
                {step.icon}
              </div>
              <h3 className="font-display text-xl font-bold">{step.title}</h3>
              <p className="text-sm opacity-80">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
      {/* Onda inferior — transición hacia Catalog (#ffffff) */}
      <WaveDivider fill="#ffffff" />
    </section>
  );
}
