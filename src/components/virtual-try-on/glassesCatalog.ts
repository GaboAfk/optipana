// Catálogo de modelos 3D disponibles para el probador virtual.
// Incluye TODOS los .glb de public/glasses_models/, no solo los del manifest
// (que es regenerado por `npm run models:generate`).
import type { GlassesModel } from "./types";

export const GLASSES_CATALOG: GlassesModel[] = [
  // --- Modelos con SVG preview (del manifest) ---
  {
    id: "209833317-orange",
    name: "Oversize Naranja",
    url: "/glasses_models/209833317-orange.glb",
    preview: "/glasses_models/209833317-orange-preview.svg",
    referenceImage: "/glasses_catalog/209833317-1-orange.jpg",
    estimatedBoundsMm: [154.4, 62.35, 145.15],
  },
  {
    id: "209833300-red",
    name: "Rectangular Rubí",
    url: "/glasses_models/209833300-red.glb",
    preview: "/glasses_models/209833300-red-preview.svg",
    referenceImage: "/glasses_catalog/209833300-1-red.jpg",
    estimatedBoundsMm: [143.44, 41.76, 144],
  },
  // --- Modelos con preview .avif (fuera del manifest) ---
  {
    id: "ardsley",
    name: "Ardsley",
    url: "/glasses_models/ardsley-opt-sbf-sesame-tortoise-with-riesling_medium.glb",
    preview: "/glasses_models/ardsley-glasses.avif",
    referenceImage: "/glasses_models/ardsley-selfie.avif",
  },
  {
    id: "caleb",
    name: "Caleb",
    url: "/glasses_models/caleb-opt-sbf-midnight-fade-with-polished-silver_medium.glb",
    preview: "/glasses_models/caleb-glasses.avif",
    referenceImage: "/glasses_models/caleb-selfie.jpg",
  },
  {
    id: "duncan",
    name: "Duncan",
    url: "/glasses_models/duncan-opt-sbf-oak-barrel-with-riesling_medium.glb",
    preview: "/glasses_models/duncan-glasses.avif",
    referenceImage: "/glasses_models/duncan-selfie.avif",
  },
  {
    id: "morley",
    name: "Morley",
    url: "/glasses_models/morley-opt-sbf-inlet-crystal-with-polished-silver_wide.glb",
    preview: "/glasses_models/morley-glasses.avif",
    referenceImage: "/glasses_models/morley-selfie.jpg",
  },
  {
    id: "penn-sun",
    name: "Penn Sun",
    url: "/glasses_models/penn-sun-sbf-oak-barrel-with-polished-gold_wide.glb",
    preview: "/glasses_models/penn-sun-glasses.avif",
  },
];
