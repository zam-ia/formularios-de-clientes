import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import SiteAdmin from "./SiteAdmin";
export const metadata: Metadata = { title: "Editar web | Crisdal", robots: { index: false, follow: false } };
export default async function SiteAdminPage() { if (!verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/panel"); return <SiteAdmin />; }
