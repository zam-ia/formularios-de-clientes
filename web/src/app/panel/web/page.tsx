import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import SiteAdmin from "./SiteAdmin";
import AdminNav from "../AdminNav";
export const metadata: Metadata = { title: "Editar web | Crisdal", robots: { index: false, follow: false } };
export default async function SiteAdminPage() { const session=readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value); if (!session) redirect("/panel"); if(!['owner','admin','editor'].includes(session.role)) redirect('/panel/dashboard'); return <><AdminNav role={session.role}/><SiteAdmin /></>; }
