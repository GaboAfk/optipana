type WaveDividerProps = {
  fill: string;
  className?: string;
};

export function WaveDivider({ fill, className = "" }: WaveDividerProps) {
  return (
    <div
      className={`pointer-events-none absolute -bottom-px left-0 right-0 z-10 leading-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 56"
        className="block w-full"
        style={{ height: 40 }}
        preserveAspectRatio="none"
      >
        <path
          fill={fill}
          d="M0,28 C360,56 720,0 1080,28 C1260,42 1380,28 1440,16 L1440,56 L0,56 Z"
        />
      </svg>
    </div>
  );
}
