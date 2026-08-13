import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import LoyaltyAdmin from "./LoyaltyAdmin";

export const metadata: Metadata = { title: "Puntos y resultados | Crisdal", robots: { index: false, follow: false } };
export default async function LoyaltyAdminPage() { if (!verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/panel"); return <LoyaltyAdmin />; }
