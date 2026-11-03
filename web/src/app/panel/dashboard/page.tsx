import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, CalendarDays, CircleDollarSign, Clock3, ContactRound, Columns3, FileClock, LayoutDashboard, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import { readAdminDataSafe } from "@/lib/adminData";
import AdminNav from "../AdminNav";
import styles from "../os.module.css";

export const metadata: Metadata = { title: "Dashboard | Crisdal OS", robots: { index: false, follow: false } };

function limaDate(now: Date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function money(value: number) { return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(value); }
function eventDate(value: string) { return new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "short", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)); }

export default async function DashboardPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (session.role === "calendar") redirect("/panel/agenda");

  const { data, warning } = await readAdminDataSafe();
  const now = new Date();
  const today = limaDate(now);
  const month = today.slice(0, 7);
  const todayMs = new Date(`${today}T00:00:00-05:00`).getTime();
  const isSales = session.role === "sales";
  const showFinance = ["owner", "admin", "finance"].includes(session.role);
  const showProjects = ["owner", "admin", "editor", "project_manager", "collaborator", "supervisor"].includes(session.role);
  const showClients = ["owner", "admin", "editor", "project_manager", "finance", "sales", "supervisor"].includes(session.role);
  const showCalendar = !["finance", "hr", "sales"].includes(session.role);
  const showCommercial = ["owner", "admin", "editor", "project_manager", "sales", "supervisor"].includes(session.role);

  const clients = isSales ? data.clients.filter((client) => (client.advisor_id || client.created_by) === session.id) : data.clients;
  const activeClients = clients.filter((client) => client.status === "active");
  const renewals = activeClients.filter((client) => {
    const end = new Date(`${client.end_date}T23:59:59-05:00`).getTime();
    return end >= todayMs && end <= todayMs + 30 * 86400000;
  }).toSorted((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 5);
  const events = session.role === "collaborator" ? data.calendar_events.filter((event) => event.assignees.includes(session.displayName)) : data.calendar_events;
  const upcoming = events.filter((event) => event.status !== "cancelled" && new Date(event.end_at).getTime() >= now.getTime()).toSorted((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 5);
  const quotes = isSales ? data.quotes.filter((quote) => (quote.advisor_id || quote.created_by) === session.id) : data.quotes;
  const openQuotes = quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length;
  const lastColumnId = data.project_columns.toSorted((a, b) => b.order - a.order)[0]?.id;
  const tasks = session.role === "collaborator" ? data.project_tasks.filter((task) => task.assignees.includes(session.id)) : data.project_tasks;
  const openTasks = tasks.filter((task) => task.column_id !== lastColumnId);
  const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today).toSorted((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);
  const monthEntries = data.finance_entries.filter((entry) => entry.currency === "PEN" && entry.date.startsWith(month));
  const income = monthEntries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = monthEntries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);

  return <>
    <AdminNav role={session.role} />
    <main className={styles.osPage}>
      <header className={`${styles.osHeader} ${styles.dashboardHeader}`}><div><p>CRISDAL OS · CENTRO DE CONTROL</p><h1>Hola, {session.displayName.split(" ")[0]}.</h1><span>Lo esencial de la agencia, ordenado para actuar rápido.</span></div><span className={styles.dashboardMark}><LayoutDashboard /><small>{new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "long", day: "numeric", month: "long" }).format(now)}</small></span></header>

      {warning ? <aside className={styles.syncNotice} role="status"><AlertTriangle /><span><strong>Sincronización temporalmente limitada</strong><small>{warning}</small></span></aside> : null}

      <section className={`${styles.quickActions} ${styles.quickActionsTop}`}><div><CircleDollarSign /><span><small>ACCESOS RÁPIDOS</small><h2>¿Qué quieres gestionar?</h2></span></div><nav>{showCommercial ? <Link href="/panel/cotizador">Nueva cotización <ArrowRight /></Link> : null}{showClients ? <Link href="/panel/clientes">Registrar cliente <ArrowRight /></Link> : null}{showProjects ? <Link href="/panel/proyectos">Ver proyectos <ArrowRight /></Link> : null}{showCalendar ? <Link href="/panel/agenda">Agendar <ArrowRight /></Link> : null}{showFinance ? <Link href="/panel/finanzas">Movimiento <ArrowRight /></Link> : null}</nav></section>

      <section className={styles.dashboardMetrics}>
        {showClients ? <Link href="/panel/clientes"><span><ContactRound /></span><div><small>CLIENTES ACTIVOS</small><strong>{activeClients.length}</strong><em>{clients.length} registrados</em></div><ArrowRight /></Link> : null}
        {showCalendar ? <Link href="/panel/agenda"><span><CalendarDays /></span><div><small>PRÓXIMAS ACTIVIDADES</small><strong>{upcoming.length}</strong><em>{renewals.length} renovaciones cercanas</em></div><ArrowRight /></Link> : null}
        {showCommercial ? <Link href="/panel/cotizador"><span><FileClock /></span><div><small>COTIZACIONES ABIERTAS</small><strong>{openQuotes}</strong><em>{quotes.length} creadas</em></div><ArrowRight /></Link> : null}
        {showProjects ? <Link href="/panel/proyectos"><span><Columns3 /></span><div><small>TAREAS ABIERTAS</small><strong>{openTasks.length}</strong><em>{overdueTasks.length} atrasadas</em></div><ArrowRight /></Link> : null}
        {showFinance ? <Link href="/panel/finanzas"><span><TrendingUp /></span><div><small>SALDO DEL MES</small><strong>{money(income - expense)}</strong><em>{money(income)} ingresado</em></div><ArrowRight /></Link> : null}
      </section>

      <section className={styles.dashboardGrid}>
        {showCalendar ? <article className={styles.dashboardPanel}><header><div><CalendarDays /><span><small>AGENDA</small><h2>Lo próximo</h2></span></div><Link href="/panel/agenda">Ver agenda <ArrowRight /></Link></header><div className={styles.dashboardList}>{upcoming.length ? upcoming.map((event) => <Link href="/panel/agenda" key={event.id}><span className={styles.dashboardEventIcon}><Clock3 /></span><div><strong>{event.title}</strong><small>{event.client_name || "Actividad interna"} · {eventDate(event.start_at)}</small></div></Link>) : <p>No hay actividades próximas.</p>}</div></article> : null}
        {showClients ? <article className={styles.dashboardPanel}><header><div><UsersRound /><span><small>CLIENTES</small><h2>Renovaciones cercanas</h2></span></div><Link href="/panel/clientes">Ver clientes <ArrowRight /></Link></header><div className={styles.renewalStack}>{renewals.length ? renewals.map((client) => <Link href="/panel/clientes" key={client.id}><span>{client.company_name}<small>{client.plan_name}</small></span><strong>{client.end_date}</strong></Link>) : <p>No hay vencimientos en 30 días.</p>}</div></article> : null}
        {showProjects ? <article className={styles.dashboardPanel}><header><div><AlertTriangle /><span><small>PRODUCCIÓN</small><h2>Atención prioritaria</h2></span></div><Link href="/panel/proyectos">Ver tablero <ArrowRight /></Link></header><div className={styles.dashboardList}>{overdueTasks.length ? overdueTasks.map((task) => <Link href="/panel/proyectos" key={task.id}><span className={styles.dashboardEventIcon}><Columns3 /></span><div><strong>{task.title}</strong><small>Venció {task.due_date}</small></div></Link>) : <p>No hay tareas atrasadas.</p>}</div></article> : null}
        {showFinance ? <article className={styles.dashboardPanel}><header><div><WalletCards /><span><small>FINANZAS · {month}</small><h2>Resumen del mes</h2></span></div><Link href="/panel/finanzas">Ver detalle <ArrowRight /></Link></header><div className={styles.healthSummary}><span><small>Ingresos</small><strong>{money(income)}</strong></span><span><small>Egresos</small><strong>{money(expense)}</strong></span><span className={income - expense >= 0 ? styles.positiveBalance : styles.negativeBalance}><small>Saldo</small><strong>{money(income - expense)}</strong></span></div></article> : null}
      </section>
    </main>
  </>;
}
