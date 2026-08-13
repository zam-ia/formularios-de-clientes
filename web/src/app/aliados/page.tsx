import type { Metadata } from "next";
import AlliesClient from "./AlliesClient";
export const metadata: Metadata = {
  title: "Red de Aliados | Crisdal",
  description:
    "Una red privada para conectar a clientes verificados de Crisdal.",
  robots: { index: false, follow: false },
};
export default function AlliesPage() {
  return <AlliesClient />;
}
