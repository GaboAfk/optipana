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
  },
];
