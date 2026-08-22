import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import PersonnelAdmin from "./PersonnelAdmin";

export const metadata: Metadata = { title: "Personal | Crisdal OS", robots: { index: false, follow: false } };

export default async function PersonnelPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "hr"].includes(session.role)) redirect("/panel/dashboard");
  return <PersonnelAdmin />;
}
