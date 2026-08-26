import type { ProductVariant } from "@/data/products";

type ProductArtProps = {
  variant: ProductVariant;
  frame: string;
  lens: string;
  blob: "orange" | "purple";
  /** Identificador único para los gradientes SVG (usar el id del producto). */
  uid: string;
  className?: string;
};

/** Arte SVG placeholder de cada producto: blob de marca + armazón. */
export function ProductArt({ variant, frame, lens, blob, uid, className = "" }: ProductArtProps) {
  const blobId = `blob-${uid}`;
  const lensId = `lens-${uid}`;
  const start = blob === "orange" ? "#FA5800" : "#7C4DFF";
  const end = blob === "orange" ? "#663399" : "#B388FF";
  const lensStart = blob === "orange" ? "#B9C9FF" : "#8FD3FF";

  const parts: Record<ProductVariant, React.ReactNode> = {
    round: (
      <g stroke={frame} strokeWidth={9} strokeLinecap="round" fill="none">
        <circle cx="62" cy="70" r="30" fill={`url(#${lensId})`} stroke={frame} />
        <circle cx="138" cy="70" r="30" fill={`url(#${lensId})`} stroke={frame} />
        <path d="M92,70 Q100,58 108,70" />
        <path d="M32,70 Q20,66 8,58" />
        <path d="M168,70 Q180,66 192,58" />
      </g>
    ),
    square: (
      <g stroke={frame} strokeWidth={9} strokeLinecap="round" fill="none">
        <rect x="26" y="38" width="70" height="54" rx="12" fill={`url(#${lensId})`} stroke={frame} />
        <rect x="104" y="38" width="70" height="54" rx="12" fill={`url(#${lensId})`} stroke={frame} />
        <path d="M96,60 Q100,50 104,60" />
        <path d="M26,52 Q15,48 6,40" />
        <path d="M174,52 Q185,48 194,40" />
      </g>
    ),
    aviator: (
      <g stroke={frame} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path
          d="M24,44 Q24,24 46,24 L72,24 Q94,24 94,44 Q94,70 76,86 Q58,102 42,94 Q24,84 24,44 Z"
          fill={`url(#${lensId})`}
          stroke={frame}
        />
        <path
          d="M106,44 Q106,24 128,24 L154,24 Q176,24 176,44 Q176,70 158,86 Q142,102 126,94 Q106,84 106,44 Z"
          fill={`url(#${lensId})`}
          stroke={frame}
        />
        <path d="M94,50 Q100,40 106,50" />
        <path d="M24,58 Q12,54 4,46" />
        <path d="M176,58 Q188,54 196,46" />
      </g>
    ),
    shield: (
      <g>
        <path
          d="M16,30 Q16,14 38,14 L162,14 Q184,14 184,30 Q184,44 172,54 Q150,72 114,74 Q82,76 56,68 Q26,62 16,44 Z"
          fill={`url(#${lensId})`}
          stroke={frame}
          strokeWidth={9}
          strokeLinejoin="round"
        />
        <path
          d="M30,34 Q30,24 44,24 L156,24 Q170,24 170,34 Q170,44 160,50 Q140,62 112,64 Q82,65 64,60 Q38,56 30,44 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </g>
    ),
    cateye: (
      <g stroke={frame} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path
          d="M24,40 Q26,24 42,26 Q56,27 62,36 L74,44 Q80,50 74,60 Q66,74 50,74 Q34,74 26,62 Q18,52 24,40 Z"
          fill={`url(#${lensId})`}
          stroke={frame}
        />
        <path
          d="M176,40 Q174,24 158,26 Q144,27 138,36 L126,44 Q120,50 126,60 Q134,74 150,74 Q166,74 174,62 Q182,52 176,40 Z"
          fill={`url(#${lensId})`}
          stroke={frame}
        />
        <path d="M74,52 Q100,42 126,52" />
        <path d="M24,52 Q14,48 6,40" />
        <path d="M176,52 Q186,48 194,40" />
      </g>
    ),
    "kids-round": (
      <g stroke={frame} strokeWidth={9} strokeLinecap="round" fill="none">
        <circle cx="62" cy="72" r="26" fill={`url(#${lensId})`} stroke={frame} />
        <circle cx="138" cy="72" r="26" fill={`url(#${lensId})`} stroke={frame} />
        <path d="M88,72 Q100,60 112,72" />
        <path d="M36,72 Q22,68 8,60" />
        <path d="M164,72 Q178,68 192,60" />
        <path d="M50,50 l4,8 8,4 -8,4 -4,8 -4,-8 -8,-4 8,-4 Z" fill={frame} stroke="none" />
        <path d="M150,50 l4,8 8,4 -8,4 -4,8 -4,-8 -8,-4 8,-4 Z" fill={frame} stroke="none" />
      </g>
    ),
    "kids-flex": (
      <g stroke={frame} strokeWidth={9} strokeLinecap="round" fill="none">
        <rect x="30" y="44" width="62" height="48" rx="16" fill={`url(#${lensId})`} stroke={frame} />
        <rect x="108" y="44" width="62" height="48" rx="16" fill={`url(#${lensId})`} stroke={frame} />
        <path d="M92,62 Q100,52 108,62" />
        <path d="M30,58 Q18,54 8,46" />
        <path d="M170,58 Q182,54 192,46" />
      </g>
    ),
    contacts: (
      <g>
        <rect x="72" y="26" width="56" height="84" rx="10" fill={`url(#${lensId})`} stroke={frame} strokeWidth={8} />
        <circle cx="100" cy="62" r="20" fill="#FFFFFF" fillOpacity="0.85" stroke={frame} strokeWidth={5} />
        <circle cx="100" cy="62" r="9" fill="none" stroke={frame} strokeWidth={3} />
        <path d="M93,33 h14 M93,40 h14" stroke={frame} strokeWidth={5} strokeLinecap="round" />
        <circle cx="158" cy="40" r="14" fill={`url(#${lensId})`} stroke={frame} strokeWidth={5} />
        <path d="M158,34 Q168,30 172,38" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" />
      </g>
    ),
    case: (
      <g>
        <rect x="34" y="48" width="132" height="46" rx="23" fill={`url(#${lensId})`} stroke={frame} strokeWidth={8} />
        <path d="M46,56 Q54,52 62,56" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth={4} strokeLinecap="round" fill="none" />
        <circle cx="156" cy="71" r="6" fill={frame} />
        <path d="M34,58 h10" stroke={frame} strokeWidth={8} strokeLinecap="round" />
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 200 140" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={blobId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={start} />
          <stop offset="100%" stopColor={end} />
        </linearGradient>
        <linearGradient id={lensId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lensStart} stopOpacity="0.9" />
          <stop offset="100%" stopColor={lens} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M100,4 C152,-4 200,26 199,70 C198,114 168,138 118,138 C68,138 40,110 32,76 C24,42 52,12 100,4 Z"
        fill={`url(#${blobId})`}
        opacity="0.16"
      />
      <path
        d="M30,18 C46,8 66,12 74,24 C82,36 74,52 58,56 C42,60 26,52 20,38 C16,28 20,24 30,18 Z"
        fill={start}
        opacity="0.12"
      />
      {parts[variant]}
    </svg>
  );
}
