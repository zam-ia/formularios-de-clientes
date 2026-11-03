"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, ContactRound, FileText, Globe2, LayoutDashboard, LogOut, UsersRound, WalletCards, Workflow } from "lucide-react";
import type { AdminRole } from "@/lib/adminData";
import styles from "./adminNav.module.css";

type NavItem = { href: string; label: string; roles?: AdminRole[]; icon: React.ReactNode };
const items: NavItem[] = [
  { href: "/panel/dashboard", label: "Inicio", icon: <LayoutDashboard /> },
  { href: "/panel/agenda", label: "Agenda", roles: ["owner", "admin", "editor", "project_manager", "collaborator", "supervisor", "calendar"], icon: <CalendarDays /> },
  { href: "/panel/clientes", label: "Clientes", roles: ["owner", "admin", "editor", "project_manager", "finance", "sales", "supervisor"], icon: <ContactRound /> },
  { href: "/panel/cotizador", label: "Ventas", roles: ["owner", "admin", "editor", "project_manager", "sales", "supervisor"], icon: <FileText /> },
  { href: "/panel/proyectos", label: "Proyectos", roles: ["owner", "admin", "editor", "project_manager", "collaborator", "supervisor"], icon: <Workflow /> },
  { href: "/panel/finanzas", label: "Finanzas", roles: ["owner", "admin", "finance"], icon: <WalletCards /> },
  { href: "/panel/personal", label: "Equipo", roles: ["owner", "admin", "hr"], icon: <BriefcaseBusiness /> },
  { href: "/panel/web", label: "Web", roles: ["owner", "admin", "editor"], icon: <Globe2 /> },
  { href: "/panel/usuarios", label: "Usuarios", roles: ["owner"], icon: <UsersRound /> },
];

export default function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const visible = items.filter((item) => !item.roles || item.roles.includes(role));
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.replace("/panel");
    router.refresh();
  }
  return <header className={styles.shell}>
    <Link className={styles.brand} href="/panel/dashboard"><span>C</span><strong>CRISDAL OS</strong></Link>
    <nav aria-label="Módulos administrativos">{visible.map((item) => <Link key={item.href} href={item.href} data-active={pathname === item.href || pathname.startsWith(`${item.href}/`)}>{item.icon}<span>{item.label}</span></Link>)}</nav>
    <button type="button" onClick={logout} aria-label="Cerrar sesión"><LogOut /><span>Salir</span></button>
  </header>;
}
