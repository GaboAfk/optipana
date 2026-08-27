"use client";

import { CaseIcon, ContactLensIcon, EyeIcon, GlassesIcon } from "./icons";
import { WaveDivider } from "./WaveDivider";
import { motion } from "framer-motion";

const SERVICES = [
  {
    icon: GlassesIcon,
    title: "Monturas",
    description: "Amplio catálogo para todos los estilos.",
    color: "orange",
  },
  {
    icon: ContactLensIcon,
    title: "Lentes de contacto",
    description: "Marcas reconocidas y asesoría para elegir las tuyas.",
    color: "purple",
  },
  {
    icon: EyeIcon,
    title: "Examen visual",
    description: "Optometría profesional incluida en los locales.",
    color: "purple",
  },
  {
    icon: CaseIcon,
    title: "Accesorios",
    description: "Estuches, cadenas, limpiadores y más.",
    color: "orange",
  },
] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 16 },
  },
};

export function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden bg-brand-bg py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-orange-soft px-4 py-1.5 text-sm font-bold text-brand-orange">
            Servicios
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-ink sm:text-4xl md:text-5xl">
            Todo para tu salud visual
          </h2>
          <p className="mt-4 text-lg text-brand-ink/70">
            Encontrá la montura que va contigo y cuidá tu visión con nosotros.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {SERVICES.map((service) => {
            const Icon = service.icon;
            const isOrange = service.color === "orange";
            return (
              <motion.article
                key={service.title}
                variants={item}
                className="group rounded-3xl bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-purple/10"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                    isOrange
                      ? "bg-brand-orange-soft text-brand-orange"
                      : "bg-brand-purple-light text-brand-purple"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-brand-ink">{service.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-ink/70">{service.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
      {/* Onda inferior — transición hacia Catalog (#ffffff) */}
      <WaveDivider fill="#ffffff" />
    </section>
  );
}
