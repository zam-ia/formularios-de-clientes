import type { Metadata } from "next";
import MultiStepForm from "@/components/MultiStepForm";

export const metadata: Metadata = {
  title: "Radiografía de Marca | Crisdal Agency",
  description: "Cuéntanos lo esencial de tu negocio para preparar tu proyecto con claridad.",
  robots: { index: false, follow: false },
};

export default function FormularioPage() {
  return <MultiStepForm />;
}
