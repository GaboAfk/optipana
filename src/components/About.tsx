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

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 70, damping: 18 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-brand-purple/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/chica_optipana.jpg"
              alt="Persona con armazones OptiPana"
              className="h-full w-full object-cover"
            />
            {/* Chips flotantes */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-purple text-white">
                <CheckIcon className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-bold text-brand-ink">4 locales en Miranda</span>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-orange text-white">
                <GlassesIcon className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-bold text-brand-ink">+10 años contigo</span>
            </div>
          </div>
        </motion.div>
      </div>
      <WaveDivider fill="#f3ebf9" />
    </section>
  );
}
