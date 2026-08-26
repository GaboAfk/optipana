import type { ReactNode } from "react";

type SlidingTextButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
};

const BASE =
  "group relative inline-flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-full pt-[12px] pr-[20px] pb-[12px] pl-[20px] font-semibold tracking-tight transition-[transform,box-shadow] duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px] shadow-lg";

// El botón base ya no pinta el fondo — lo hace una capa separada que se desvanece al hover
const ORIGINAL = {
  primary: "text-white shadow-brand-orange/30 hover:shadow-xl hover:shadow-brand-purple/20",
  outline:
    "border-2 border-brand-purple text-brand-purple hover:shadow-xl hover:shadow-brand-purple/20",
} as const;

// Capa de fondo que se desvanece al hover
const BG_LAYER = {
  primary: "bg-brand-orange",
  outline: "bg-transparent",
} as const;

// Clon: primary → fondo transparente + texto naranja
//       outline → fondo morado + texto blanco
const CLONE = {
  primary: "bg-transparent text-brand-orange",
  outline: "bg-brand-purple text-white",
} as const;

export function SlidingTextButton({
  href,
  children,
  variant = "primary",
  className = "",
}: SlidingTextButtonProps) {
  return (
    <a href={href} className={`${BASE} ${ORIGINAL[variant]} ${className}`}>
      {/* Capa de fondo que se desvanece al hover */}
      <span
        className={`absolute inset-0 z-0 rounded-full transition-opacity duration-500 ease-out group-hover:opacity-0 ${BG_LAYER[variant]}`}
        aria-hidden="true"
      />

      {/* Texto original: se desliza abajo + fade + blur al hover */}
      <span className="relative z-10 flex items-center gap-2 font-medium transition-all duration-500 ease-out group-hover:translate-y-8 group-hover:opacity-0 group-hover:blur-md">
        {children}
      </span>

      {/* Texto clon: entra desde arriba al hover, con fondo y texto invertidos */}
      <span
        className={`absolute inset-0 z-20 flex items-center justify-center gap-2 -translate-y-8 rounded-full font-medium opacity-0 blur-md transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none ${CLONE[variant]}`}
        style={variant === "primary" ? { color: "#FA5800" } : undefined}
      >
        {children}
      </span>

      {/* Línea inferior estilo underline */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 blur-[2px] transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] group-hover:opacity-80"
      />

      {/* Gradiente de luz inferior al hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-full rounded-full bg-gradient-to-t from-white/20 via-white/10 to-transparent opacity-0 transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] group-hover:opacity-60"
      />
    </a>
  );
}
