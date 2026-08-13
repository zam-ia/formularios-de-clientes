import type { Metadata } from "next";
import { Montserrat, Oswald } from "next/font/google";
import { PUBLIC_SITE_URL } from "@/lib/publicSiteUrl";
import "./globals.css";

const montserrat = Montserrat({
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
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: "Crisdal Agency | Marketing, IA y automatización",
    template: "%s | Crisdal Agency",
  },
  description:
    "Crisdal conecta estrategia, creatividad, tecnología y seguimiento para convertir atención en oportunidades comerciales.",
  alternates: { canonical: "/" },
  applicationName: "Crisdal Agency",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Crisdal Agency | Que ninguna oportunidad se quede esperando",
    description:
      "Conectamos estrategia, contenido y automatización con IA para crecer con orden.",
    type: "website",
    locale: "es_PE",
    images: ["/brand/crisdal-agency-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crisdal Agency | Estrategia, creatividad y conversión",
    description: "Convertimos atención en oportunidades reales.",
    images: ["/brand/crisdal-agency-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
