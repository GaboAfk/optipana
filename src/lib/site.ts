// TODO: reemplazar placeholders con los datos reales antes de publicar.
export const SITE = {
  whatsapp: "https://wa.me/58XXXXXXXXXX", // placeholder — confirmar número
  whatsappDisplay: "+58 XXX-XXXXXXX",
  email: "hola@optipana.com", // placeholder
  phone: "+58 XXX-XXXXXXX", // placeholder
  instagram: "https://instagram.com/optipana", // placeholder
  facebook: "https://facebook.com/optipana", // placeholder
  hours: "Lun – Sáb · 9:00 am – 6:00 pm",
  zone: "Los Teques · Carrizal · San Antonio de los Altos",
  mapsEmbed: "https://www.google.com/maps?q=Los+Teques,+Miranda,+Venezuela&output=embed",
} as const;

export function waLink(message?: string): string {
  const base = SITE.whatsapp;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
