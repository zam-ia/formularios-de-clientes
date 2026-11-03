import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import PanelClient from "../PanelClient";

export const metadata: Metadata = { title: "Editor de brochure | Crisdal OS", robots: { index: false, follow: false } };

export default async function BrochureAdminPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "editor"].includes(session.role)) redirect("/panel/dashboard");
  return <PanelClient />;
}
