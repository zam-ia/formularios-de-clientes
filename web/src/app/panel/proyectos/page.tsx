import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import ProjectsAdmin from "./ProjectsAdmin";
import AdminNav from "../AdminNav";

export const metadata: Metadata = { title: "Proyectos | Crisdal OS", robots: { index: false, follow: false } };

export default async function ProjectsPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (!["owner", "admin", "editor", "project_manager", "collaborator", "supervisor"].includes(session.role)) redirect("/panel/dashboard");
  return <><AdminNav role={session.role} /><ProjectsAdmin role={session.role} /></>;
}
