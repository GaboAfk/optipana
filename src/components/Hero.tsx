import Image from "next/image";
import { ArrowRightIcon } from "./icons";
import { PortalFieldBackground } from "./PortalFieldBackground";
import { SlidingTextButton } from "./SlidingTextButton";
import { WaveDivider } from "./WaveDivider";

const UNS = "https://images.unsplash.com";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-white pt-16 md:pt-16">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-12 px-5 py-10 sm:px-8 md:flex-row md:gap-16 md:py-20">
        {/* Columna de texto */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="relative font-display text-4xl font-bold leading-[1.15] tracking-tight text-brand-purple sm:text-5xl md:text-6xl">
            Tu mirada, con{" "}
            <span className="px-2 py-0.5 text-brand-orange">
              color
            </span>{" y "}
            <span
              className="px-2 py-0.5 font-[family-name:var(--font-allura)] text-5xl text-brand-purple sm:text-5xl md:text-7xl"
            >
              estilo
            </span>
            <svg
              className="absolute -bottom-2 left-1/2 h-3 w-3/4 -translate-x-1/2 text-brand-orange/40 md:left-0 md:translate-x-0"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 100 10"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 5 Q 25 0 50 5 T 100 5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </h1>

          <p className="mx-auto max-w-md text-lg leading-relaxed text-brand-ink/70 md:mx-0">
            Descubre la colección de lentes más vibrante y moderna. Diseños únicos que resaltan
            tu personalidad.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row md:justify-start">
            <SlidingTextButton href="#catalogo" variant="primary">
              Ver Catálogo
              <ArrowRightIcon className="h-5 w-5" />
            </SlidingTextButton>
            <SlidingTextButton href="#locales" variant="outline">
              ¿Dónde estamos?
            </SlidingTextButton>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 mt-10">
            {["+500 modelos", "4 sucursales", "Examen visual incluido"].map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <svg className="w-4 h-4 text-[#FA5800]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Columna visual */}
        <div className="relative flex min-h-[520px] w-full flex-1 items-center justify-center py-10">
          {/* Portal Field detrás de la imagen y del texto — z negativo para quedar siempre de fondo, sin recorte.
              pointer-events habilitado para que el aro reaccione al acercarse el mouse (los elementos
              en primer plano, imagen y botón, siguen recibiendo los clics con normalidad). */}
          <PortalFieldBackground
            className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[40rem] -translate-x-1/2 -translate-y-1/2 sm:w-[44rem] lg:w-[48rem]"
            opacity={0.55}
          />
          {/** sustituir por carrusel de videos de framer (pedir videos de 15s) https://framer.com/m/VideoCarousel-3ACghD.js@gN3OxtTWepzM2Kd4SUcE */}
          <div className="relative z-10 aspect-[3/4] w-64 overflow-hidden rounded-[2.5rem] bg-[#FFF0E6] shadow-2xl sm:w-80 lg:w-96">
            <Image
              src={`${UNS}/photo-1525786210598-d527194d3e9a?w=700&h=900&fit=crop&auto=format`}
              alt="Persona con armazones de OptiPana"
              fill
              priority
              sizes="(max-width: 768px) 90vw, 25rem"
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <WaveDivider fill="#F7F7F9" />
    </section>
  );
}
