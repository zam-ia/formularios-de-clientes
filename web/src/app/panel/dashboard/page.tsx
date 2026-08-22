import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  ContactRound,
  Columns3,
  FileCheck2,
  FileClock,
  Landmark,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import { readAdminData, type FinanceAccount, type QuoteStatus } from "@/lib/adminData";
import styles from "../os.module.css";

export const metadata: Metadata = { title: "Dashboard | Crisdal OS", robots: { index: false, follow: false } };

const accountLabels: Record<FinanceAccount, string> = { bcp: "BCP", bbva: "BBVA", interbank: "Interbank", cash: "Efectivo", other: "Otra" };
const quoteLabels: Record<QuoteStatus, string> = { draft: "Borradores", sent: "Enviadas", accepted: "Aceptadas", rejected: "Rechazadas", expired: "Vencidas" };

function limaDate(now: Date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function money(value: number, currency: "PEN" | "USD" = "PEN") { return new Intl.NumberFormat("es-PE", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); }
function eventDate(value: string) { return new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "short", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)); }

export default async function DashboardPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/panel");
  if (session.role === "calendar") redirect("/panel/agenda");
  const data = await readAdminData();
  const now = new Date();
  const today = limaDate(now);
  const month = today.slice(0, 7);
  const todayMs = new Date(`${today}T00:00:00-05:00`).getTime();
  const monthEntries = data.finance_entries.filter((entry) => entry.currency === "PEN" && entry.date.startsWith(month));
  const income = monthEntries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = monthEntries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const activeClients = data.clients.filter((client) => client.status === "active");
  const expectedIncome = activeClients.filter((client) => client.currency === "PEN").reduce((sum, client) => sum + client.monthly_fee, 0);
  const renewals = activeClients.filter((client) => {
    const end = new Date(`${client.end_date}T23:59:59-05:00`).getTime();
    return end >= todayMs && end <= todayMs + 30 * 86400000;
  }).toSorted((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 5);
  const relevantEvents = session.role === "collaborator" ? data.calendar_events.filter((event) => event.assignees.includes(session.displayName)) : data.calendar_events;
  const upcoming = relevantEvents.filter((event) => event.status !== "cancelled" && new Date(event.end_at).getTime() >= now.getTime()).toSorted((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 5);
  const quoteCounts = (Object.keys(quoteLabels) as QuoteStatus[]).map((status) => ({ status, count: data.quotes.filter((quote) => quote.status === status).length }));
  const activeQuotes = data.quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length;
  const accounts = (Object.keys(accountLabels) as FinanceAccount[]).map((account) => ({ account, balance: monthEntries.filter((entry) => entry.account === account).reduce((sum, entry) => sum + (entry.type === "income" ? entry.amount : -entry.amount), 0) }));
  const maxAccount = Math.max(1, ...accounts.map((account) => Math.abs(account.balance)));
  const showFinance = ["owner", "admin", "finance"].includes(session.role);
  const showProjects = ["owner", "admin", "editor", "project_manager", "collaborator"].includes(session.role);
  const showPersonnel = ["owner", "admin", "hr"].includes(session.role);
  const showClients = ["owner", "admin", "editor", "project_manager", "finance"].includes(session.role);
  const showCalendar = !["finance", "hr"].includes(session.role);
  const showCommercial = ["owner", "admin", "editor", "project_manager"].includes(session.role);
  const finalProjectColumnId = data.project_columns.toSorted((a, b) => b.order - a.order)[0]?.id;
  const relevantTasks = session.role === "collaborator" ? data.project_tasks.filter((task) => task.assignees.includes(session.id)) : data.project_tasks;
  const openTasks = relevantTasks.filter((task) => task.column_id !== finalProjectColumnId);
  const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today).toSorted((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);
  const employeeWorkload = data.employees.map((employee) => ({ employee, count: data.project_tasks.filter((task) => task.column_id !== finalProjectColumnId && (task.assignees.includes(employee.user_id) || task.assignees.includes(employee.id))).length })).toSorted((a, b) => b.count - a.count).slice(0, 5);

  return <main className={styles.osPage}>
    <header className={`${styles.osHeader} ${styles.dashboardHeader}`}><div><Link href="/panel"><ArrowRight className={styles.backArrow} size={17} /> Ir al editor central</Link><p>CRISDAL OS · CENTRO DE CONTROL</p><h1>Hola, {session.displayName.split(" ")[0]}.</h1><span>Todo lo importante de la agencia, priorizado para tomar decisiones y actuar rápido.</span></div><span className={styles.dashboardMark}><LayoutDashboard /><small>{new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "long", day: "numeric", month: "long" }).format(now)}</small></span></header>

    <section className={styles.dashboardMetrics}>
      {showClients ? <Link href="/panel/clientes"><span><ContactRound /></span><div><small>CLIENTES ACTIVOS</small><strong>{activeClients.length}</strong><em>{data.clients.length} registrados</em></div><ArrowRight /></Link> : null}
      {showCalendar ? <Link href="/panel/agenda"><span><CalendarDays /></span><div><small>PRÓXIMAS ACTIVIDADES</small><strong>{upcoming.length}</strong><em>{renewals.length} renovaciones cercanas</em></div><ArrowRight /></Link> : null}
      {showCommercial ? <Link href="/panel/cotizador"><span><FileClock /></span><div><small>EMBUDO ABIERTO</small><strong>{activeQuotes}</strong><em>{data.quotes.length} cotizaciones creadas</em></div><ArrowRight /></Link> : null}
      {showProjects ? <Link href="/panel/proyectos"><span><Columns3 /></span><div><small>PRODUCCIÓN ACTIVA</small><strong>{openTasks.length}</strong><em>{overdueTasks.length} tareas atrasadas</em></div><ArrowRight /></Link> : null}
      {showFinance ? <Link href="/panel/finanzas"><span><TrendingUp /></span><div><small>INGRESO ESPERADO</small><strong>{money(expectedIncome)}</strong><em>{money(income)} registrado este mes</em></div><ArrowRight /></Link> : showCommercial ? <Link href="/panel/cotizador"><span><Sparkles /></span><div><small>CATÁLOGO COMERCIAL</small><strong>{data.quote_plans.filter((plan) => plan.active).length}</strong><em>{data.discount_rules.filter((discount) => discount.active).length} descuentos activos</em></div><ArrowRight /></Link> : null}
      {showPersonnel ? <Link href="/panel/personal"><span><BriefcaseBusiness /></span><div><small>EQUIPO ACTIVO</small><strong>{data.employees.filter((employee) => employee.status === "active").length}</strong><em>{employeeWorkload.reduce((sum, item) => sum + item.count, 0)} asignaciones abiertas</em></div><ArrowRight /></Link> : null}
    </section>

    <section className={styles.dashboardGrid}>
      {showCalendar ? <article className={styles.dashboardPanel}><header><div><CalendarDays /><span><small>AGENDA</small><h2>Lo próximo</h2></span></div><Link href="/panel/agenda">Ver agenda <ArrowRight /></Link></header><div className={styles.dashboardList}>{upcoming.length ? upcoming.map((event) => <Link href="/panel/agenda" key={event.id}><span className={`${styles.dashboardEventIcon} ${styles[event.type]}`}><Clock3 /></span><div><strong>{event.title}</strong><small>{event.client_name || "Actividad interna"} · {eventDate(event.start_at)}</small></div><em>{event.status === "confirmed" ? "Confirmada" : event.status === "completed" ? "Completada" : "Programada"}</em></Link>) : <p>No hay actividades próximas. La agenda está libre.</p>}</div></article> : null}

      {showCommercial ? <article className={styles.dashboardPanel}><header><div><FileCheck2 /><span><small>COMERCIAL</small><h2>Estado de propuestas</h2></span></div><Link href="/panel/cotizador">Abrir cotizador <ArrowRight /></Link></header><div className={styles.pipelineChart}>{quoteCounts.map((item) => <div key={item.status}><span><strong>{item.count}</strong><small>{quoteLabels[item.status]}</small></span><i><b style={{ width: `${data.quotes.length ? Math.max(5, item.count / data.quotes.length * 100) : 0}%` }} /></i></div>)}</div></article> : null}

      {showClients ? <article className={styles.dashboardPanel}><header><div><UsersRound /><span><small>CLIENTES</small><h2>Renovaciones en 30 días</h2></span></div><Link href="/panel/clientes">Ver clientes <ArrowRight /></Link></header><div className={styles.renewalStack}>{renewals.length ? renewals.map((client) => <Link href="/panel/clientes" key={client.id}><span>{client.company_name}<small>{client.plan_name} · {money(client.monthly_fee, client.currency)}</small></span><strong>{client.end_date}</strong></Link>) : <p>No hay vencimientos próximos.</p>}</div></article> : null}

      {showProjects ? <article className={styles.dashboardPanel}><header><div><AlertTriangle /><span><small>PRODUCCIÓN</small><h2>Atención prioritaria</h2></span></div><Link href="/panel/proyectos">Ver tablero <ArrowRight /></Link></header><div className={styles.dashboardList}>{overdueTasks.length ? overdueTasks.map((task) => <Link href="/panel/proyectos" key={task.id}><span className={styles.dashboardEventIcon}><Columns3 /></span><div><strong>{task.title}</strong><small>{data.clients.find((client) => client.id === task.client_id)?.company_name || "Cliente"} · venció {task.due_date}</small></div><em>{task.priority === "urgent" ? "Urgente" : "Atrasada"}</em></Link>) : <p>No hay tareas atrasadas. El flujo está al día.</p>}</div></article> : null}

      {showFinance ? <article className={styles.dashboardPanel}><header><div><WalletCards /><span><small>FINANZAS · {month}</small><h2>Salud del mes</h2></span></div><Link href="/panel/finanzas">Ver detalle <ArrowRight /></Link></header><div className={styles.healthSummary}><span><small>Ingresos</small><strong>{money(income)}</strong></span><span><small>Egresos</small><strong>{money(expense)}</strong></span><span className={income - expense >= 0 ? styles.positiveBalance : styles.negativeBalance}><small>Saldo</small><strong>{money(income - expense)}</strong></span></div><div className={styles.accountChart}>{accounts.map((item) => <div key={item.account}><span><Landmark />{accountLabels[item.account]}<strong>{money(item.balance)}</strong></span><i><b style={{ width: `${Math.abs(item.balance) / maxAccount * 100}%` }} /></i></div>)}</div></article> : null}
      {showPersonnel ? <article className={styles.dashboardPanel}><header><div><BriefcaseBusiness /><span><small>PERSONAL</small><h2>Carga del equipo</h2></span></div><Link href="/panel/personal">Ver personal <ArrowRight /></Link></header><div className={styles.pipelineChart}>{employeeWorkload.length ? employeeWorkload.map(({ employee, count }) => <div key={employee.id}><span><strong>{count}</strong><small>{employee.full_name} · {employee.area}</small></span><i><b style={{ width: `${Math.min(100, count * 12.5)}%` }} /></i></div>) : <p>Registra al equipo para visualizar su carga.</p>}</div></article> : null}
    </section>

    <section className={styles.quickActions}><div><CircleDollarSign /><span><small>ACCESOS RÁPIDOS</small><h2>¿Qué quieres gestionar?</h2></span></div><nav>{showClients && !["collaborator", "hr"].includes(session.role) ? <Link href="/panel/clientes">Registrar cliente <ArrowRight /></Link> : null}{showProjects ? <Link href="/panel/proyectos">Gestionar proyectos <ArrowRight /></Link> : null}{showCalendar ? <Link href="/panel/agenda">Agendar actividad <ArrowRight /></Link> : null}{showFinance ? <Link href="/panel/finanzas">Registrar movimiento <ArrowRight /></Link> : null}{showPersonnel ? <Link href="/panel/personal"><BriefcaseBusiness /> Personal</Link> : null}</nav></section>
  </main>;
}
