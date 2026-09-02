import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import CommissionsAdmin from "./CommissionsAdmin";

export const metadata: Metadata = { title: "Comisiones | Crisdal OS", robots: { index: false, follow: false } };

export default async function CommissionsPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "sales", "supervisor"].includes(session.role)) redirect("/panel/dashboard");
  return <CommissionsAdmin />;
}
