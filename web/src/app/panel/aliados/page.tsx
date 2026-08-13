import type { Metadata } from "next";
import AlliesAdmin from "./AlliesAdmin";
export const metadata: Metadata = {
  title: "Administrar aliados | Crisdal",
  robots: { index: false, follow: false },
};
export default function AlliesAdminPage() {
  return <AlliesAdmin />;
}
