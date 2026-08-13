import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import AlliesAdmin from "./AlliesAdmin";
export const metadata: Metadata = {
  title: "Administrar aliados | Crisdal",
  robots: { index: false, follow: false },
};
export default async function AlliesAdminPage() {
  if (!verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/panel");
  return <AlliesAdmin />;
}
