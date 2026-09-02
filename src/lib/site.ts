export const SITE = {
  whatsapp: "https://wa.me/584120194396",
  whatsappDisplay: "+58 412-0194396",
  email: "optipanaredes@gmail.com",
  phone: "+58 412-0194396",
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
