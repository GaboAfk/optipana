"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { CloseIcon, MenuIcon } from "./icons";
import { SlidingTextButton } from "./SlidingTextButton";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#catalogo", label: "Catálogo" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#locales", label: "Locales" },
  { href: "#contacto", label: "Contacto" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[15px] font-bold text-brand-ink/80 transition-colors hover:bg-brand-orange-soft hover:text-brand-orange"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SlidingTextButton href="#locales" variant="primary" className="hidden sm:inline-flex !min-w-0 !px-6 !py-3 !text-sm">
            Visítanos
          </SlidingTextButton>

          {/* Toggle mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-full bg-brand-bg text-brand-ink lg:hidden"
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      <div
        className={`overflow-hidden border-t border-brand-ink/5 bg-white transition-all duration-300 lg:hidden ${
          open ? "max-h-[420px]" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Móvil">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 font-bold text-brand-ink/85 transition-colors hover:bg-brand-orange-soft hover:text-brand-orange"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#locales"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex justify-center rounded-full bg-brand-orange px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-orange/30"
          >
            Visítanos
          </a>
        </nav>
      </div>
    </header>
  );
}
