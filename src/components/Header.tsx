"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { CloseIcon, GlassesIcon, MenuIcon } from "./icons";
import { SlidingTextButton } from "./SlidingTextButton";

const NAV_LINKS = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#jornadas", label: "Jornadas" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/probador-virtual", label: "Probador VR", isNew: true },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#testimonios", label: "Testimonios" },
  { href: "/#locales", label: "Locales" },
  { href: "/#contacto", label: "Contacto" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/60 shadow-md shadow-brand-purple/10 backdrop-blur-md" : "bg-white/30 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <Logo className="shrink-0" />

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple ${
                link.isNew
                  ? "nav-vr-link bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white shadow-md shadow-brand-purple/20 hover:from-brand-purple-dark"
                  : "text-brand-ink/80 hover:bg-brand-orange-soft hover:text-brand-orange"
              }`}
            >
              <NavLinkContent label={link.label} isNew={link.isNew} />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SlidingTextButton href="/#locales" variant="primary" className="hidden sm:inline-flex !min-w-0 !px-6 !py-3 !text-sm">
            Visítanos
          </SlidingTextButton>

          {/* Toggle mobile */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="grid h-11 w-11 place-items-center rounded-full bg-brand-bg text-brand-ink xl:hidden"
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menú mobile — grid-rows anima la altura al contenido real */}
      <div
        id="mobile-navigation"
        inert={!open}
        aria-hidden={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            toggleRef.current?.focus();
          }
        }}
        className={`grid border-t border-brand-ink/5 bg-white transition-all duration-300 xl:hidden ${
          open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-t-0"
        }`}
      >
        <nav className="min-h-0 overflow-hidden" aria-label="Móvil">
          <div className="flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto px-5 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple ${
                  link.isNew
                    ? "nav-vr-link bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white shadow-md shadow-brand-purple/20"
                    : "text-brand-ink/85 hover:bg-brand-orange-soft hover:text-brand-orange"
                }`}
              >
                <NavLinkContent label={link.label} isNew={link.isNew} />
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavLinkContent({ label, isNew }: { label: string; isNew?: boolean }) {
  return (
    <>
      {isNew && <GlassesIcon className="relative z-10 h-4 w-4 shrink-0" />}
      <span className="relative z-10">{label}</span>
      {isNew && (
        <span className="relative z-10 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-purple">
          Nuevo
        </span>
      )}
    </>
  );
}
