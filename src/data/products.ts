export type Category = "sol" | "recetados" | "ninos" | "contacto" | "accesorios";
export type Gender = "damas" | "caballeros" | "unisex";

export type ProductVariant =
  | "round"
  | "square"
  | "aviator"
  | "shield"
  | "cateye"
  | "kids-round"
  | "kids-flex"
  | "contacts"
  | "case";

export interface Product {
  id: number;
  name: string;
  category: Category;
  gender: Gender;
  brand: string;
  price: number; // USD
  img: string;
  variant: ProductVariant;
  frame: string; // color de la montura
  lens: string; // tinte del lente
  blob: "orange" | "purple";
  prompt: string; // descripción detallada para try-on IA
}

export const CATEGORIES: { id: Category | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "sol", label: "Sol" },
  { id: "recetados", label: "Recetados" },
  { id: "ninos", label: "Niños" },
  { id: "contacto", label: "Lentes de contacto" },
  { id: "accesorios", label: "Accesorios" },
];

export const GENDERS: { id: Gender | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "damas", label: "Damas" },
  { id: "caballeros", label: "Caballeros" },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  sol: "Sol",
  recetados: "Recetados",
  ninos: "Niños",
  contacto: "Lentes de contacto",
  accesorios: "Accesorios",
};

const U = "https://images.unsplash.com";

export const products: Product[] = [
  {
    id: 1,
    name: "Clásico Round",
    category: "recetados",
    gender: "unisex",
    brand: "Ray-Ban",
    price: 45,
    img: `${U}/photo-1759910546772-73e4bb7fdadd?w=500&h=500&fit=crop&auto=format`,
    variant: "round",
    frame: "#2B2B2B",
    lens: "#B9C9FF",
    blob: "orange",
    prompt: "",
  },
  {
    id: 2,
    name: "Sport Shield",
    category: "sol",
    gender: "caballeros",
    brand: "Oakley",
    price: 55,
    img: `${U}/photo-1577803645773-f96470509666?w=500&h=500&fit=crop&auto=format`,
    variant: "shield",
    frame: "#663399",
    lens: "#3B5BDB",
    blob: "purple",
    prompt: "A pair of modern, round sunglasses with translucent frames and amber-tinted lenses rests on a textured, leather-like surface in the foreground, centered in the frame. The sunglasses are oriented horizontally, facing the viewer, casting a crisp, dark shadow onto the surface directly beneath them. In the background, a vast, calm body of water sparkles under bright, warm sunlight, with a hazy, soft-focus coastline visible on the horizon. The lighting is bright and summery, characterized by high-contrast golden-hour illumination that creates bokeh reflections on the water's surface. The overall atmosphere is peaceful and vacation-oriented, conveying a sense of leisure and travel. The composition utilizes a shallow depth of field, keeping the sunglasses in sharp focus while the marine backdrop dissolves into a soft, blurred expanse of blue and shimmering light. The aesthetic is clean, stylish, and reminiscent of travel photography.",
  },
  {
    id: 3,
    name: "Mini Star",
    category: "ninos",
    gender: "unisex",
    brand: "Kids Vision",
    price: 30,
    img: `${U}/photo-1593194777536-e155e6d100b2?w=500&h=500&fit=crop&auto=format`,
    variant: "kids-round",
    frame: "#FA5800",
    lens: "#FFE9DC",
    blob: "purple",
    prompt: "A close-up portrait of a young girl wearing chunky, translucent bubblegum pink eyeglasses. The frames are rounded-oval in shape, made of glossy pink acetate, with thick matching pink temples. The prescription lenses are clear with a slight visible thickness at the edges.",
  },
  {
    id: 4,
    name: "Acetato Milano",
    category: "recetados",
    gender: "damas",
    brand: "Vogue",
    price: 40,
    img: `${U}/photo-1656074520589-bd325dc7aa4f?w=500&h=500&fit=crop&auto=format`,
    variant: "square",
    frame: "#8A5A2B",
    lens: "#EFE4D3",
    blob: "orange",
    prompt: "",
  },
  {
    id: 5,
    name: "Mariposa Chic",
    category: "sol",
    gender: "damas",
    brand: "Guess",
    price: 50,
    img: `${U}/photo-1608539733292-190446b22b83?w=500&h=500&fit=crop&auto=format`,
    variant: "cateye",
    frame: "#2B2B2B",
    lens: "#7C4DFF",
    blob: "purple",
    prompt: "",
  },
  {
    id: 6,
    name: "Daily Fresh (caja 30)",
    category: "contacto",
    gender: "unisex",
    brand: "Acuvue",
    price: 25,
    img: `${U}/photo-1776890948428-5cb3e62cc680?w=500&h=500&fit=crop&auto=format`,
    variant: "contacts",
    frame: "#E04F00",
    lens: "#8FD3FF",
    blob: "orange",
    prompt: "",
  },
  {
    id: 7,
    name: "Estuche Premium",
    category: "accesorios",
    gender: "unisex",
    brand: "OptiPana",
    price: 8,
    img: `${U}/photo-1776950227879-6e3b44cbe830?w=500&h=500&fit=crop&auto=format`,
    variant: "case",
    frame: "#663399",
    lens: "#F3EBF9",
    blob: "purple",
    prompt: "",
  },
  {
    id: 8,
    name: "Retro Square",
    category: "sol",
    gender: "unisex",
    brand: "Polaroid",
    price: 38,
    img: `${U}/photo-1610136649349-0f646f318053?w=500&h=500&fit=crop&auto=format`,
    variant: "square",
    frame: "#FA5800",
    lens: "#37474F",
    blob: "orange",
    prompt: "",
  },
  {
    id: 9,
    name: "Flex Junior",
    category: "ninos",
    gender: "unisex",
    brand: "Silhouette Kids",
    price: 35,
    img: `${U}/photo-1601782744132-f08f10b3343e?w=500&h=500&fit=crop&auto=format`,
    variant: "kids-flex",
    frame: "#4C9A2A",
    lens: "#DCF5C7",
    blob: "purple",
    prompt: "",
  },
  {
    id: 10,
    name: "Multifocal Pro",
    category: "recetados",
    gender: "unisex",
    brand: "Essilor",
    price: 60,
    img: `${U}/photo-1611222777277-61319d63ca94?w=500&h=500&fit=crop&auto=format`,
    variant: "aviator",
    frame: "#C9A86A",
    lens: "#D9E6FF",
    blob: "orange",
    prompt: "",
  },
];
