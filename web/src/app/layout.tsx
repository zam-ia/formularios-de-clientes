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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://crisdalagency.vercel.app"),
  title: {
    default: "Crisdal Agency | Marketing, IA y automatización",
    template: "%s | Crisdal Agency",
  },
  description:
    "Marketing, producción audiovisual y automatización con IA para negocios de salud, estética y educación.",
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
