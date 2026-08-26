"use client";

import { waLink } from "@/lib/site";
import { MapPinIcon, WhatsAppIcon } from "./icons";
import { WaveDivider } from "./WaveDivider";
import { motion } from "framer-motion";

export function ContactCTA() {
  return (
    <section id="contacto" className="relative overflow-hidden bg-gradient-to-r from-brand-orange via-[#C2491F] to-brand-purple py-20 md:py-28">
      {/* Onda superior — transición desde Locations (#ffffff) */}
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
            fill="#ffffff"
            d="M0,28 C360,0 720,56 1080,28 C1260,14 1380,28 1440,40 L1440,0 L0,0 Z"
          />
        </svg>
      </div>

      {/* Decoración */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute left-[12%] top-14 h-16 w-16 rounded-full border-2 border-white/20" />
      <div className="pointer-events-none absolute bottom-16 right-[14%] h-10 w-10 rounded-full bg-white/15" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ type: "spring" as const, stiffness: 70, damping: 18 }}
        className="relative mx-auto max-w-3xl px-5 text-center sm:px-8"
      >
        <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          ¿Listo para ver el mundo con estilo?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
          Visitá cualquiera de nuestros locales o escribinos por WhatsApp.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={waLink("Hola OptiPana, quiero más información sobre sus productos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-purple-dark/30 transition-all hover:-translate-y-0.5 hover:bg-brand-orange-dark sm:w-auto"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Escribirnos por WhatsApp
          </a>
          <a
            href="#locales"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white hover:text-brand-purple sm:w-auto"
          >
            <MapPinIcon className="h-5 w-5" />
            Ver locales
          </a>
        </div>
      </motion.div>
      <WaveDivider fill="#2d1452" />
    </section>
  );
}
