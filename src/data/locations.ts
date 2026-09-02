export interface Location {
  name: string;
  address: string;
  mapsUrl: string; // placeholder hasta confirmar dirección exacta
}

export const locations: Location[] = [
  {
    name: "C.C. La Hoyada",
    address: "8XW5+382, Av. La Hoyada, Los Teques 1201, Miranda, Venezuela",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=8XW5+382,+Av.+La+Hoyada,+Los+Teques+1201,+Miranda,+Venezuela",
  },
  {
    name: "C.C. La Colina",
    address: "8XW5+382, Av. La Hoyada, Los Teques 1201, Miranda, Venezuela",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=8XW5+382,+Av.+La+Hoyada,+Los+Teques+1201,+Miranda,+Venezuela",
  },
  {
    name: "C.C. Tibisay",
    address: "82X3+7V2, Carr. San Antonio - San Diego - San José, Municipio Carrizal 1203, Miranda, Venezuela",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=82X3+7V2,+Carr.+San+Antonio+-+San+Diego+-+San+José,+Municipio+Carrizal+1203,+Miranda,+Venezuela",
  },
  {
    name: "Carrizal",
    address: "Carrizal, Municipio Carrizal, Miranda, Venezuela",
    mapsUrl: "#", // Sin botón de navegación
  },
];
