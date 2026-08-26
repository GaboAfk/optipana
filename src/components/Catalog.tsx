"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, products, type Category } from "@/data/products";
import { WaveDivider } from "./WaveDivider";
import { WhatsAppIcon } from "./icons";
import { waLink } from "@/lib/site";
import { motion } from "framer-motion";

type FilterId = Category | "todos";

export function Catalog() {
  const [active, setActive] = useState<FilterId>("todos");
  const [showAll, setShowAll] = useState(false);

  const filtered = active === "todos" ? products : products.filter((p) => p.category === active);
  const visible = showAll ? filtered : filtered.slice(0, 4);

  return (
    <section id="catalogo" className="relative overflow-hidden bg-white py-16 md:py-24">
      <div className="pointer-events-none absolute -right-28 top-40 h-72 w-72 rounded-full bg-brand-purple/10 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-orange-soft px-4 py-1.5 text-sm font-bold text-brand-orange">
            Catálogo
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold text-brand-ink sm:text-4xl md:text-5xl">
            Armazones para todos los estilos
          </h2>
          <p className="mt-4 text-lg text-brand-ink/70">
            Ver bien nunca fue tan divertido. Precios en USD, cómodo financiamiento.
          </p>
        </div>

        {/* Filtros */}
        <div className="mt-10 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Filtrar catálogo">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActive(cat.id);
                  setShowAll(false);
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-brand-orange text-white shadow-md shadow-brand-orange/30"
                    : "bg-brand-bg text-brand-ink/70 hover:bg-brand-orange-soft hover:text-brand-orange"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid de productos */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-12 text-center font-semibold text-brand-ink/60">
            No hay productos en esta categoría por ahora. ¡Escríbenos y te ayudamos a encontrarlo!
          </p>
        )}

        {/* Botón cargar más — solo mobile cuando hay productos ocultos */}
        {filtered.length > 4 && !showAll && (
          <div className="mt-8 flex justify-center md:hidden">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-full bg-brand-orange px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-orange/30 transition-all hover:-translate-y-0.5 hover:bg-brand-orange-dark"
            >
              Cargar más ({filtered.length - 4} restantes)
            </button>
          </div>
        )}
      </div>
      <WaveDivider fill="#F7F7F9" />
    </section>
  );
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  const waMessage = `Hola OptiPana, me interesa el producto "${product.name}" (${product.brand}) — $${product.price} USD.`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-ink/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-purple/15"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${
            product.blob === "orange" ? "bg-brand-orange" : "bg-brand-purple"
          }`}
        >
          {CATEGORY_LABELS[product.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/40">
          {product.brand}
        </p>
        <h3 className="font-display text-lg font-bold leading-snug text-brand-ink">{product.name}</h3>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-brand-ink/5 pt-4">
          <p className="font-display text-2xl font-bold text-brand-orange">${product.price}</p>
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-purple-dark"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Consultar
          </a>
        </div>
      </div>
    </motion.article>
  );
}
