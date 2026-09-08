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
  hoverImg?: string;
  variant: ProductVariant;
  frame: string; // color de la montura
  lens: string; // tinte del lente
  blob: "orange" | "purple";
  prompt: string; // descripción detallada para try-on IA
  "try-on": boolean; // si tiene try-on disponible
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

function makeProduct(
  id: number,
  img: string,
  hoverImg: string | undefined,
  name: string,
  category: Category,
  gender: Gender,
  frame: string,
  blob: "orange" | "purple"
): Product {
  return {
    id,
    name,
    category,
    gender,
    brand: "OptiPana",
    price: 45,
    img,
    hoverImg,
    variant: "square",
    frame,
    lens: "tinted",
    blob,
    prompt: "",
    "try-on": true,
  };
}

export const products: Product[] = [
  makeProduct(1, "/glasses_catalog/selfies/209675188-1-tort.jpg", "/glasses_catalog/209675188-2.jpg", "Mariposa Carey", "recetados", "damas", "tortoise", "orange"),
  makeProduct(2, "/glasses_catalog/selfies/209680312-1-brown.jpg", "/glasses_catalog/209680312-1.jpg", "Rectangular Café", "recetados", "unisex", "brown", "purple"),
  {
    id: 3,
    name: "Mini Star",
    category: "ninos",
    gender: "unisex",
    brand: "Kids Vision",
    price: 30,
    img: "https://images.unsplash.com/photo-1593194777536-e155e6d100b2?w=500&h=500&fit=crop&auto=format",
    variant: "kids-round",
    frame: "#FA5800",
    lens: "#FFE9DC",
    blob: "purple",
    prompt: "A close-up portrait of a young girl wearing chunky, translucent bubblegum pink eyeglasses. The frames are rounded-oval in shape, made of glossy pink acetate, with thick matching pink temples. The prescription lenses are clear with a slight visible thickness at the edges.",
    "try-on": true,
  },
  {
    id: 23,
    name: "Flex Junior",
    category: "ninos",
    gender: "unisex",
    brand: "Silhouette Kids",
    price: 35,
    img: "https://images.unsplash.com/photo-1601782744132-f08f10b3343e?w=500&h=500&fit=crop&auto=format",
    variant: "kids-flex",
    frame: "#4C9A2A",
    lens: "#DCF5C7",
    blob: "purple",
    prompt: "",
    "try-on": true,
  },
  makeProduct(4, "/glasses_catalog/selfies/209833250-2-brown.jpg", "/glasses_catalog/209833250-1-brown.jpg", "Clásico Ámbar", "recetados", "damas", "brown", "purple"),
  makeProduct(5, "/glasses_catalog/selfies/209833279-2-clear.jpg", "/glasses_catalog/209833279-1-clear.jpg", "Aviador Cristal", "recetados", "damas", "clear", "orange"),
  makeProduct(6, "/glasses_catalog/209833300-1-red.jpg", undefined, "Rectangular Rubí", "recetados", "damas", "red", "purple"),
  makeProduct(7, "/glasses_catalog/209833309-1-multi.jpg", undefined, "Panto Mosaico", "recetados", "unisex", "multicolor", "orange"),
  makeProduct(8, "/glasses_catalog/selfies/209833317-2-orange.jpg", "/glasses_catalog/209833317-1-orange.jpg", "Oversize Naranja", "sol", "damas", "orange", "purple"),
  makeProduct(9, "/glasses_catalog/209833338-1-green.jpg", undefined, "Esmeralda Bold", "recetados", "damas", "green", "orange"),
  makeProduct(10, "/glasses_catalog/selfies/209833378-2-brown.jpg", "/glasses_catalog/209833378-1-brown.jpg", "Cuadrado Ámbar", "recetados", "damas", "brown", "purple"),
  makeProduct(11, "/glasses_catalog/209833408-1-multi.jpg", undefined, "Mosaico Carmesí", "recetados", "damas", "multicolor", "orange"),
  makeProduct(12, "/glasses_catalog/selfies/209994771-2-torte.jpg", "/glasses_catalog/209994771-1-torte.jpg", "Milano Carey", "recetados", "damas", "tortoise", "purple"),
  makeProduct(13, "/glasses_catalog/selfies/210121474-2-brown.jpg", "/glasses_catalog/210121474-1-brown.jpg", "Clubmaster Café", "recetados", "caballeros", "brown", "orange"),
  makeProduct(14, "/glasses_catalog/210388310-1-clearandblack.jpg", undefined, "Aviador Noir", "recetados", "unisex", "clear and black", "purple"),
  makeProduct(15, "/glasses_catalog/selfies/210723065-2-black.jpg", "/glasses_catalog/210723065-1-black.jpg", "Rectangular Ónix", "recetados", "caballeros", "black", "orange"),
  makeProduct(16, "/glasses_catalog/210899041-1-tort.jpg", undefined, "Aviador Carey", "recetados", "unisex", "tortoise", "purple"),
  makeProduct(17, "/glasses_catalog/210899148-1-lightgrey.jpg", undefined, "Cristal Felino", "recetados", "damas", "light grey", "orange"),
  makeProduct(18, "/glasses_catalog/selfies/211027814-2-black.jpg", "/glasses_catalog/211027814-1-black.jpg", "Shield Deportivo Negro", "sol", "damas", "black", "purple"),
  makeProduct(19, "/glasses_catalog/211097521-1-tortandgreen.jpg", undefined, "Shield Carey Verde", "sol", "caballeros", "tortoise and green", "orange"),
  makeProduct(20, "/glasses_catalog/211554149-1-grey.jpg", undefined, "Oval Cristal Rosa", "recetados", "damas", "grey", "purple"),
  makeProduct(21, "/glasses_catalog/selfies/211554151-2-burgundy.jpg", "/glasses_catalog/211554151-1-burgundy.jpg", "Aviador Borgoña", "recetados", "caballeros", "burgundy", "orange"),
  makeProduct(22, "/glasses_catalog/image_e009da6.png", undefined, "Diciotto Ejecutivo", "recetados", "caballeros", "silver", "purple"),
  {
    id: 24,
    name: "Lentes de Contacto Diarios",
    category: "contacto",
    gender: "unisex",
    brand: "OptiPana",
    price: 25,
    img: "/glasses_catalog/contacto.jpg",
    variant: "contacts",
    frame: "transparent",
    lens: "clear",
    blob: "orange",
    prompt: "",
    "try-on": false,
  },
  {
    id: 25,
    name: "Lentes de Contacto Hidrogel",
    category: "contacto",
    gender: "unisex",
    brand: "OptiPana",
    price: 30,
    img: "/glasses_catalog/contacto-2.png",
    variant: "contacts",
    frame: "transparent",
    lens: "clear",
    blob: "purple",
    prompt: "",
    "try-on": false,
  },
  {
    id: 26,
    name: "Correa Multicolor de Vidrio",
    category: "accesorios",
    gender: "unisex",
    brand: "Symphorine",
    price: 8,
    img: "/glasses_catalog/correa-canutillo-multicolor.jpg",
    variant: "case",
    frame: "multicolor",
    lens: "clear",
    blob: "orange",
    prompt: "",
    "try-on": false,
  },
  {
    id: 27,
    name: "Cadena de Eslabón Chico",
    category: "accesorios",
    gender: "unisex",
    brand: "Óptica Carrau",
    price: 15,
    img: "/glasses_catalog/cadena-eslabon-chico.jpg",
    variant: "case",
    frame: "gold",
    lens: "clear",
    blob: "purple",
    prompt: "",
    "try-on": false,
  },
  {
    id: 28,
    name: "Estuche 2 en 1 Verde Petróleo",
    category: "accesorios",
    gender: "unisex",
    brand: "Mis Petates",
    price: 25,
    img: "/glasses_catalog/estuche-verde-petroleo.jpg",
    variant: "case",
    frame: "petrol green",
    lens: "clear",
    blob: "orange",
    prompt: "",
    "try-on": false,
  },
];
