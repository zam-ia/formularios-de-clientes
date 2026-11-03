import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import AlliesAdmin from "./AlliesAdmin";
import AdminNav from "../AdminNav";
export const metadata: Metadata = {
  title: "Administrar aliados | Crisdal",
  robots: { index: false, follow: false },
};
export default async function AlliesAdminPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!['owner', 'admin'].includes(session.role)) redirect('/panel/dashboard');
  return <><AdminNav role={session.role} /><AlliesAdmin /></>;
}
