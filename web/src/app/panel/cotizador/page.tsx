import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import QuoteAdmin from "./QuoteAdmin";

export const metadata: Metadata = { title: "Cotizador | Crisdal OS", robots: { index: false, follow: false } };

export default async function QuotesPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "editor", "project_manager"].includes(session.role)) redirect("/panel/dashboard");
  return <QuoteAdmin />;
}
