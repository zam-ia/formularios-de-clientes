import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import CalendarAdmin from "./CalendarAdmin";
import AdminNav from "../AdminNav";

export const metadata: Metadata = { title: "Agenda | Crisdal OS", robots: { index: false, follow: false } };

export default async function CalendarPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (["finance", "hr", "sales"].includes(session.role)) redirect("/panel/dashboard");
  return <><AdminNav role={session.role} /><CalendarAdmin currentUser={session.displayName} /></>;
}
