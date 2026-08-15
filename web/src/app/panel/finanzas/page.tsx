import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import FinanceAdmin from "./FinanceAdmin";

export const metadata: Metadata = { title: "Finanzas | Crisdal OS", robots: { index: false, follow: false } };

export default async function FinancePage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!['owner', 'admin'].includes(session.role)) redirect("/panel");
  return <FinanceAdmin />;
}
