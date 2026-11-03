import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import ClientsAdmin from "./ClientsAdmin";
import AdminNav from "../AdminNav";

export const metadata: Metadata = { title: "Clientes | Crisdal OS", robots: { index: false, follow: false } };

export default async function ClientsPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "editor", "project_manager", "finance", "sales", "supervisor"].includes(session.role)) redirect("/panel/dashboard");
  return <><AdminNav role={session.role} /><ClientsAdmin readOnly={session.role === "finance"} /></>;
}
