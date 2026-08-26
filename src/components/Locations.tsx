"use client";

import { locations } from "@/data/locations";
import { SITE, waLink } from "@/lib/site";
import { ClockIcon, MapPinIcon, NavigationIcon, WhatsAppIcon } from "./icons";
import { motion } from "framer-motion";

export function Locations() {
  return (
    <section id="locales" className="relative overflow-hidden bg-white py-16 md:py-24">
      <div className="pointer-events-none absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-brand-orange/10 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-orange-soft px-4 py-1.5 text-sm font-bold text-brand-orange">
            Locales
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-ink sm:text-4xl md:text-5xl">
            Encuéntranos cerca de ti
          </h2>
          <p className="mt-4 text-lg text-brand-ink/70">
            Estamos en Los Teques, Carrizal y San Antonio de los Altos. ¡Te esperamos!
          </p>
        </motion.div>

        {/* Grid de locales */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {locations.map((location, i) => (
            <motion.article
              key={location.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ delay: i * 0.15, type: "spring" as const, stiffness: 80, damping: 16 }}
              className="flex flex-col rounded-3xl bg-brand-bg p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-brand-purple/10"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-purple-light text-brand-purple">
                  <MapPinIcon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-xl font-bold text-brand-ink">{location.name}</h3>
              </div>

              <p className="mt-4 flex items-start gap-2 text-[15px] font-semibold text-brand-ink/70">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                {location.address}
              </p>
              <p className="mt-2 flex items-start gap-2 text-[15px] font-semibold text-brand-ink/70">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                {SITE.hours}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={location.mapsUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-purple-dark"
                >
                  <NavigationIcon className="h-4 w-4" />
                  Cómo llegar
                </a>
                <a
                  href={waLink(`Hola OptiPana, quiero información sobre el local ${location.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-whatsapp px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-95"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Mapa */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ type: "spring" as const, stiffness: 70, damping: 18 }}
          className="mt-12 overflow-hidden rounded-3xl shadow-lg shadow-brand-purple/10 ring-1 ring-brand-ink/5"
        >
          <iframe
            src={SITE.mapsEmbed}
            title="Mapa — OptiPana en Los Teques"
            className="h-[320px] w-full border-0 md:h-[420px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  );
}
