import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import UsersAdmin from "./UsersAdmin";

export const metadata: Metadata = { title: "Usuarios | Crisdal OS", robots: { index: false, follow: false } };

export default async function UsersPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (session.role !== "owner") redirect("/panel");
  return <UsersAdmin currentUser={session} />;
}
