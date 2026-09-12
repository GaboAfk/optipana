"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, GENDERS, products, type Category, type Gender, type Product } from "@/data/products";
import { WaveDivider } from "./WaveDivider";
import { WhatsAppIcon } from "./icons";
import { waLink } from "@/lib/site";
import { motion, useScroll, useTransform } from "framer-motion";
import { TryOnPanel } from "./TryOnPanel";

type FilterId = Category | "todos";
type GenderFilterId = Gender | "todos";

export function Catalog() {
  const [active, setActive] = useState<FilterId>("todos");
  const [gender, setGender] = useState<GenderFilterId>("todos");
  const [showAll, setShowAll] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress } = useScroll({
    target: titleRef,
    offset: ["start 85%", "end 20%"],
  });

  // "estilos" pasa de naranja a morado al hacer scroll
  const estilosColor = useTransform(
    scrollYProgress,
    [0, 1],
    ["#fa5800", "#663399"],
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const filtered = products.filter((p) => {
    const catMatch = active === "todos" || p.category === active;
    const genderMatch =
      gender === "todos" || p.gender === gender || p.gender === "unisex";
    return catMatch && genderMatch;
  });

  const pageSize = isDesktop ? 8 : 4;
  const visible = showAll ? filtered : filtered.slice(0, pageSize);
  const remaining = filtered.length - pageSize;

  const resetPaging = () => setShowAll(false);

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-24">
      <div className="pointer-events-none absolute -right-28 top-40 h-72 w-72 rounded-full bg-brand-purple/10 blur-2xl" />

      <div id="catalogo" className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-orange-soft px-4 py-1.5 text-sm font-bold text-brand-orange">
            Catálogo
          </p>
          <h2
            ref={titleRef}
            className="mt-4 font-display text-3xl font-bold leading-[1.15] tracking-tight text-brand-ink sm:text-4xl md:text-5xl"
          >
            Monturas para todos los{" "}
            <motion.span
              style={{ color: estilosColor }}
              className="font-[family-name:var(--font-allura)] text-4xl sm:text-5xl md:text-7xl"
            >
              estilos
            </motion.span>
          </h2>
          <p className="mt-4 text-lg text-brand-ink/70">
            Ver bien nunca fue tan divertido. Precios en USD, cómodo financiamiento.
          </p>
        </div>

        {/* Filtros de género (arriba) */}
        <div className="mt-10 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Filtrar por género">
          {GENDERS.map((g) => {
            const isActive = gender === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setGender(g.id);
                  resetPaging();
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-brand-purple text-white shadow-md shadow-brand-purple/30"
                    : "bg-brand-bg text-brand-ink/70 hover:bg-brand-purple/10 hover:text-brand-purple"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Filtros de categoría (abajo) — colapsables en mobile */}
        {/* Botón "Más filtros" — solo mobile */}
        <div className="mt-3 flex justify-center md:hidden">
          <button
            type="button"
            onClick={() => setShowMoreFilters((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-bg px-5 py-2.5 text-sm font-bold text-brand-ink/70 transition-colors hover:bg-brand-orange-soft hover:text-brand-orange"
          >
            {showMoreFilters ? "Menos filtros" : "Más filtros"}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-3.5 w-3.5 transition-transform ${showMoreFilters ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Contenedor colapsable: grid-rows anima la altura al contenido real */}
        <div
          className={`grid transition-all duration-300 md:grid md:grid-rows-[1fr] ${
            showMoreFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-3 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Filtrar por categoría">
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
                      resetPaging();
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
          </div>
        </div>

        {/* Grid de productos */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onTryOn={product["try-on"] ? () => setTryOnProduct(product) : undefined} 
            />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-12 text-center font-semibold text-brand-ink/60">
            No hay productos en esta categoría por ahora. ¡Escríbenos y te ayudamos a encontrarlo!
          </p>
        )}

        {/* Botón cargar más — mobile y desktop cuando hay productos ocultos */}
        {remaining > 0 && !showAll && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-full bg-brand-orange px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-orange/30 transition-all hover:-translate-y-0.5 hover:bg-brand-orange-dark"
            >
              Cargar más ({remaining} restantes)
            </button>
          </div>
        )}
      </div>
      <WaveDivider fill="#F7F7F9" />
      <TryOnPanel 
        product={tryOnProduct} 
        onClose={() => setTryOnProduct(null)} 
        onProductChange={setTryOnProduct}
        activeCategory={active}
        activeGender={gender}
      />
    </section>
  );
}

function ProductCard({ product, onTryOn }: { product: (typeof products)[number]; onTryOn?: () => void }) {
  const waMessage = `Hola OptiPana, me interesa el producto "${product.name}" (${product.brand}) — $${product.price} USD.`;
  const [touched, setTouched] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ type: "spring" as const, stiffness: 80, damping: 16 }}
      onTouchStart={() => setTouched(true)}
      onTouchEnd={() => setTouched(false)}
      onTouchCancel={() => setTouched(false)}
      className={`group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-ink/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-purple/15 ${touched ? "-translate-y-2 shadow-xl shadow-brand-purple/15" : ""}`}
    >
      <div
        className="no-callout relative aspect-square select-none overflow-hidden bg-brand-bg"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.img}
          alt={product.name}
          draggable={false}
          loading="lazy"
          className={`no-callout h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${product.hoverImg ? "group-hover:opacity-0" : ""} ${touched ? "scale-105" : ""} ${product.hoverImg && touched ? "opacity-0" : ""}`}
        />
        {product.hoverImg && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.hoverImg}
              alt={product.name}
              draggable={false}
              loading="lazy"
              className={`no-callout absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 ${touched ? "scale-105 opacity-100" : ""}`}
            />
          </>
        )}
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

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-brand-ink/5 pt-4">
          <p className="font-display text-2xl font-bold text-brand-orange">${product.price}</p>
          <div className="flex gap-2">
            {onTryOn && (
              <button
                type="button"
                onClick={onTryOn}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold transition-all hover:-translate-y-0.5 hover:bg-brand-orange hover:text-white ${
                  touched
                    ? "-translate-y-0.5 bg-brand-orange text-white shadow-md shadow-brand-orange/30 delay-150 duration-700"
                    : "bg-brand-orange-soft text-brand-orange duration-300"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Probar
              </button>
            )}
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
      </div>
    </motion.article>
  );
}
