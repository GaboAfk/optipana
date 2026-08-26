import type { Metadata } from "next";
import { Quicksand, Nunito_Sans, Allura } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "OptiPana — Tu mirada, con estilo y color",
  description:
    "Óptica en Los Teques, Carrizal y San Antonio de los Altos. Monturas, lentes de contacto y examen visual en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${quicksand.variable} ${nunitoSans.variable} ${allura.variable}`}>
      <head>
        {/* Puter.js — acceso gratis a Nano Banana (Gemini) sin API keys */}
        <script src="https://js.puter.com/v2/" async />
      </head>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
