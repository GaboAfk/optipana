import { SITE, waLink } from "@/lib/site";
import { Logo } from "./Logo";
import { FacebookIcon, InstagramIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "./icons";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#catalogo", label: "Catálogo" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#locales", label: "Locales" },
  { href: "#contacto", label: "Contacto" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-purple-dark text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marca */}
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-white/70">
              Óptica en Los Teques, Carrizal y San Antonio de los Altos. Armazones, lentes de
              contacto y examen visual en un solo lugar.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de OptiPana"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-all hover:-translate-y-0.5 hover:bg-brand-orange"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de OptiPana"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-all hover:-translate-y-0.5 hover:bg-brand-orange"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp de OptiPana"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-all hover:-translate-y-0.5 hover:bg-brand-whatsapp"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <nav aria-label="Footer">
            <h3 className="font-display text-lg font-bold">Navegación</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[15px] font-semibold text-white/70 transition-colors hover:text-brand-orange"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div>
            <h3 className="font-display text-lg font-bold">Contacto</h3>
            <ul className="mt-4 space-y-3 text-[15px] font-semibold text-white/70">
              <li className="flex items-center gap-3">
                <MailIcon className="h-4.5 w-4.5 shrink-0 text-brand-orange" />
                <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-brand-orange">
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon className="h-4.5 w-4.5 shrink-0 text-brand-orange" />
                {SITE.phone}
              </li>
              <li className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-orange" />
                Los Teques · Carrizal · San Antonio de los Altos — Miranda, Venezuela
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm font-semibold text-white/50 md:flex-row md:items-center">
          <p>© {year} Optipana. | Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Desarrollo por{" "}
            <a
              href="https://www.aponrroy.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              Aponrroy
            </a>{" "}
            <a
              href="https://www.aponrroy.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/imgi_80_icono aponrroy sin fondo.png"
                alt="Aponrroy"
                style={{ height: "50px", marginLeft: "5px", verticalAlign: "middle" }}
                className="md:!h-[80px]"
              />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
