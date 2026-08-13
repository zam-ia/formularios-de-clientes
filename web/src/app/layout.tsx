import type { Metadata } from "next";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Radiografía de Marca | Crisdal Agency",
  description:
    "Cuéntanos lo esencial de tu negocio para crear una estrategia, contenido y campañas con mayor claridad.",
  applicationName: "Crisdal Agency",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Radiografía de Marca | Crisdal Agency",
    description:
      "Ordenemos lo esencial de tu marca antes de diseñar, grabar o pautar.",
    type: "website",
    locale: "es_PE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${poppins.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
