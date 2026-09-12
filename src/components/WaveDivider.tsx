type WaveDividerProps = {
  fill: string;
  className?: string;
  /** Onda superior: se renderiza ANTES de la sección y se solapa sobre su tope. */
  flip?: boolean;
};

export function WaveDivider({ fill, className = "", flip = false }: WaveDividerProps) {
  // En flujo entre secciones (no absolute dentro del overflow-hidden de la
  // sección): evita que el compositor pinte la onda desplazada tras un scroll
  // con anchor, dejando una banda del color de la sección debajo de la onda.
  return (
    <div
      className={`pointer-events-none relative z-10 h-10 leading-none ${flip ? "-mb-10" : "-mt-10"} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 56"
        className="block h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          fill={fill}
          d={
            flip
              ? "M0,28 C360,0 720,56 1080,28 C1260,14 1380,28 1440,40 L1440,0 L0,0 Z"
              : "M0,28 C360,56 720,0 1080,28 C1260,42 1380,28 1440,16 L1440,56 L0,56 Z"
          }
        />
      </svg>
    </div>
  );
}
