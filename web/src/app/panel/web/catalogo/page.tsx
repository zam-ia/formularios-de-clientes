import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import CatalogWebAdmin from "./CatalogWebAdmin";

export const metadata: Metadata = { title: "Catálogo web y portafolio | Crisdal", robots: { index: false, follow: false } };
export default async function CatalogWebAdminPage(){ const session=readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value); if(!session||!["owner","admin","editor"].includes(session.role)) redirect("/panel"); return <CatalogWebAdmin/>; }
