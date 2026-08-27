"use client";

import { StarIcon } from "./icons";
import { WaveDivider } from "./WaveDivider";
import { OrbitTestimonials } from "./OrbitTestimonials";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "María G.",
    initial: "M",
    location: "C.C. La Colina",
    color: "orange",
    comment:
      "Excelente atención, encontré las monturas perfectas para mi cara. Los precios son muy accesibles y el examen visual fue muy profesional.",
  },
  {
    name: "Carlos R.",
    initial: "C",
    location: "Carrizal",
    color: "purple",
    comment:
      "Llevo años comprando en OptiPana. Siempre tienen las últimas tendencias y el personal es súper amable.",
  },
  {
    name: "Luisa M.",
    initial: "L",
    location: "C.C. Tibisay",
    color: "purple",
    comment:
      "Me ayudaron a elegir mis primeros lentes de contacto. Me explicaron todo con paciencia. ¡Totalmente recomendados!",
  },
  {
    name: "Pedro A.",
    initial: "P",
    location: "C.C. La Colina",
    color: "orange",
    comment:
      "El financiamiento en cuotas me ayudó muchísimo. Salí con mis lentes nuevos el mismo día.",
  },
  {
    name: "Andreína S.",
    initial: "A",
    location: "Carrizal",
    color: "purple",
    comment:
      "Fui a una jornada de salud visual y quedé encantada. Examen gratis y atención de primera.",
  },
  {
    name: "José T.",
    initial: "J",
    location: "C.C. Tibisay",
    color: "orange",
    comment:
      "El catálogo es enorme, encontré justo el estilo que buscaba para mis lentes de sol.",
  },
  {
    name: "Genesis R.",
    initial: "G",
    location: "C.C. La Colina",
    color: "purple",
    comment:
      "Muy buena calidad en los cristales. Se nota la diferencia con los que tenía antes.",
  },
  {
    name: "Miguel D.",
    initial: "M",
    location: "Carrizal",
    color: "orange",
    comment:
      "El personal me asesoró súper bien para elegir la montura ideal según mi rostro.",
  },
  {
    name: "Valentina P.",
    initial: "V",
    location: "C.C. Tibisay",
    color: "purple",
    comment:
      "Rapidez y buen precio. Ya es mi óptica de confianza para toda la familia.",
  },
] as const;

export function Testimonials() {
  return (
    <section id="testimonios" className="relative overflow-hidden bg-brand-purple-light py-16 md:py-24">
      {/* Blobs decorativos */}
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-brand-purple/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-brand-orange/10 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand-purple shadow-sm">
            Testimonios
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-ink sm:text-4xl md:text-5xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-4 text-lg text-brand-ink/70">
            Tu confianza nos llena de orgullo. Estas son algunas experiencias reales.
          </p>
        </motion.div>

        {/* Esfera orbital 3D — solo desktop */}
        <div className="mt-12 hidden lg:block">
          <OrbitTestimonials testimonials={TESTIMONIALS} />
        </div>

        {/* Carrusel horizontal — mobile / tablet */}
        <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 will-change-transform lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              className="flex w-[85%] shrink-0 snap-center flex-col rounded-3xl bg-white p-7 shadow-md shadow-brand-purple/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[70%] lg:w-auto"
            >
              <div className="flex items-center gap-1 text-brand-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4.5 w-4.5" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-brand-ink/80">
                “{t.comment}”
              </blockquote>
              <footer className="mt-6 flex items-center gap-3 border-t border-brand-ink/5 pt-5">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full font-display text-lg font-bold text-white ${
                    t.color === "orange" ? "bg-brand-orange" : "bg-brand-purple"
                  }`}
                >
                  {t.initial}
                </span>
                <div>
                  <p className="font-display text-base font-bold text-brand-ink">{t.name}</p>
                  <p className="text-sm font-semibold text-brand-ink/50">Atendido en {t.location}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
      <WaveDivider fill="#ffffff" />
    </section>
  );
}
