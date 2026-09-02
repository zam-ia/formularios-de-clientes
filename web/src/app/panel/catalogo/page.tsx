import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import CatalogAdmin from "./CatalogAdmin";

export const metadata: Metadata = { title: "Catálogo comercial | Crisdal OS", robots: { index: false, follow: false } };

export default async function CatalogPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "sales", "supervisor"].includes(session.role)) redirect("/panel/dashboard");
  return <CatalogAdmin />;
}
