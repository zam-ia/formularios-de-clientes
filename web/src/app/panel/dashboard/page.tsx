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
  Trophy,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { ADMIN_COOKIE, readAdminSession } from "@/lib/adminAuth";
import { readAdminData, type FinanceAccount, type Quote, type QuoteStatus } from "@/lib/adminData";
import styles from "../os.module.css";

export const metadata: Metadata = { title: "Dashboard | Crisdal OS", robots: { index: false, follow: false } };

const accountLabels: Record<FinanceAccount, string> = { bcp: "BCP", bbva: "BBVA", interbank: "Interbank", cash: "Efectivo", other: "Otra" };
const quoteLabels: Record<QuoteStatus, string> = { draft: "Borradores", sent: "Enviadas", accepted: "Aceptadas", approved: "Aprobadas", won: "Ganadas", lost: "Perdidas", rejected: "Rechazadas", expired: "Vencidas" };

function limaDate(now: Date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function money(value: number, currency: "PEN" | "USD" = "PEN") { return new Intl.NumberFormat("es-PE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
function eventDate(value: string) { return new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "short", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)); }
function quoteBase(quote: Quote) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0);
  const discount = quote.global_discount_type === "percent" ? subtotal * quote.global_discount_value / 100 : Math.min(subtotal, quote.global_discount_value);
  return Math.max(0, subtotal - discount);
}

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
  const relevantClients = session.role === "sales" ? data.clients.filter((client) => (client.advisor_id || client.created_by) === session.id) : data.clients;
  const activeClients = relevantClients.filter((client) => client.status === "active");
  const expectedIncome = activeClients.filter((client) => client.currency === "PEN").reduce((sum, client) => sum + client.monthly_fee, 0);
  const renewals = activeClients.filter((client) => {
    const end = new Date(`${client.end_date}T23:59:59-05:00`).getTime();
    return end >= todayMs && end <= todayMs + 30 * 86400000;
  }).toSorted((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 5);
  const relevantEvents = session.role === "collaborator" ? data.calendar_events.filter((event) => event.assignees.includes(session.displayName)) : data.calendar_events;
  const upcoming = relevantEvents.filter((event) => event.status !== "cancelled" && new Date(event.end_at).getTime() >= now.getTime()).toSorted((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 5);
  const relevantQuotes = session.role === "sales" ? data.quotes.filter((quote) => (quote.advisor_id || quote.created_by) === session.id) : data.quotes;
  const quoteCounts = (Object.keys(quoteLabels) as QuoteStatus[]).map((status) => ({ status, count: relevantQuotes.filter((quote) => quote.status === status).length }));
  const activeQuotes = relevantQuotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length;
  const accounts = (Object.keys(accountLabels) as FinanceAccount[]).map((account) => ({ account, balance: monthEntries.filter((entry) => entry.account === account).reduce((sum, entry) => sum + (entry.type === "income" ? entry.amount : -entry.amount), 0) }));
  const maxAccount = Math.max(1, ...accounts.map((account) => Math.abs(account.balance)));
  const showFinance = ["owner", "admin", "finance"].includes(session.role);
  const showProjects = ["owner", "admin", "editor", "project_manager", "collaborator", "supervisor"].includes(session.role);
  const showPersonnel = ["owner", "admin", "hr"].includes(session.role);
  const showClients = ["owner", "admin", "editor", "project_manager", "finance", "sales", "supervisor"].includes(session.role);
  const showCalendar = !["finance", "hr", "sales"].includes(session.role);
  const showCommercial = ["owner", "admin", "editor", "project_manager", "sales", "supervisor"].includes(session.role);
  const showRankings = ["owner", "admin"].includes(session.role);
  const finalProjectColumnId = data.project_columns.toSorted((a, b) => b.order - a.order)[0]?.id;
  const relevantTasks = session.role === "collaborator" ? data.project_tasks.filter((task) => task.assignees.includes(session.id)) : data.project_tasks;
  const openTasks = relevantTasks.filter((task) => task.column_id !== finalProjectColumnId);
  const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today).toSorted((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);
  const employeeWorkload = data.employees.map((employee) => ({ employee, count: data.project_tasks.filter((task) => task.column_id !== finalProjectColumnId && (task.assignees.includes(employee.user_id) || task.assignees.includes(employee.id))).length })).toSorted((a, b) => b.count - a.count).slice(0, 5);
  const sellerRankingMap = new Map<string, { id: string; name: string; sales: number; pen: number; usd: number; clients: number }>();
  for (const user of data.users.filter((item) => item.active && ["sales", "supervisor"].includes(item.role))) {
    sellerRankingMap.set(user.id, { id: user.id, name: user.display_name, sales: 0, pen: 0, usd: 0, clients: 0 });
  }
  for (const quote of data.quotes.filter((item) => item.status === "won")) {
    const commission = data.commissions.find((record) => record.quote_id === quote.id);
    if (!(commission?.created_at || quote.updated_at).startsWith(month)) continue;
    const id = quote.advisor_id || quote.created_by;
    const current = sellerRankingMap.get(id) || { id, name: quote.advisor_name || quote.created_by_name || "Sin asesor", sales: 0, pen: 0, usd: 0, clients: 0 };
    const value = quoteBase(quote);
    current.sales += 1;
    current[quote.currency === "USD" ? "usd" : "pen"] += value;
    sellerRankingMap.set(id, current);
  }
  for (const client of data.clients.filter((item) => item.status === "active")) {
    const id = client.advisor_id || client.created_by;
    const current = sellerRankingMap.get(id) || { id, name: client.advisor_name || "Sin asesor", sales: 0, pen: 0, usd: 0, clients: 0 };
    current.clients += 1;
    sellerRankingMap.set(id, current);
  }
  const sellerRanking = [...sellerRankingMap.values()].toSorted((a, b) => b.pen - a.pen || b.usd - a.usd || b.sales - a.sales).slice(0, 5);
  const maxSellerRevenue = Math.max(1, ...sellerRanking.map((item) => item.pen || item.usd));
  const clientIncomeMap = new Map<string, { id: string; name: string; pen: number; usd: number; payments: number }>();
  for (const entry of data.finance_entries.filter((item) => item.type === "income" && item.date.startsWith(month) && item.client_id)) {
    const client = data.clients.find((item) => item.id === entry.client_id);
    if (!client) continue;
    const current = clientIncomeMap.get(client.id) || { id: client.id, name: client.company_name, pen: 0, usd: 0, payments: 0 };
    current[entry.currency === "USD" ? "usd" : "pen"] += entry.amount;
    current.payments += 1;
    clientIncomeMap.set(client.id, current);
  }
  const clientRanking = [...clientIncomeMap.values()].toSorted((a, b) => b.pen - a.pen || b.usd - a.usd || b.payments - a.payments).slice(0, 5);
  const maxClientIncome = Math.max(1, ...clientRanking.map((item) => item.pen || item.usd));

  return <main className={styles.osPage}>
    <header className={`${styles.osHeader} ${styles.dashboardHeader}`}><div><Link href={["owner", "admin", "editor"].includes(session.role) ? "/panel" : "/"}><ArrowRight className={styles.backArrow} size={17} /> {["owner", "admin", "editor"].includes(session.role) ? "Ir al editor central" : "Ir al sitio web"}</Link><p>CRISDAL OS · CENTRO DE CONTROL</p><h1>Hola, {session.displayName.split(" ")[0]}.</h1><span>Todo lo importante de la agencia, priorizado para tomar decisiones y actuar rápido.</span></div><span className={styles.dashboardMark}><LayoutDashboard /><small>{new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "long", day: "numeric", month: "long" }).format(now)}</small></span></header>

    <section className={`${styles.quickActions} ${styles.quickActionsTop}`}><div><CircleDollarSign /><span><small>ACCESOS RÁPIDOS</small><h2>¿Qué quieres gestionar?</h2></span></div><nav>{showCommercial ? <Link href="/panel/cotizador">Nueva cotización <ArrowRight /></Link> : null}{showCommercial ? <Link href="/panel/comisiones">Ver comisiones <ArrowRight /></Link> : null}{showClients && !["collaborator", "hr"].includes(session.role) ? <Link href="/panel/clientes">Registrar cliente <ArrowRight /></Link> : null}{showProjects ? <Link href="/panel/proyectos">Gestionar proyectos <ArrowRight /></Link> : null}{showCalendar ? <Link href="/panel/agenda">Agendar actividad <ArrowRight /></Link> : null}{showFinance ? <Link href="/panel/finanzas">Registrar movimiento <ArrowRight /></Link> : null}{showPersonnel ? <Link href="/panel/personal"><BriefcaseBusiness /> Personal</Link> : null}</nav></section>

    <section className={styles.dashboardMetrics}>
      {showClients ? <Link href="/panel/clientes"><span><ContactRound /></span><div><small>CLIENTES ACTIVOS</small><strong>{activeClients.length}</strong><em>{relevantClients.length} registrados</em></div><ArrowRight /></Link> : null}
      {showCalendar ? <Link href="/panel/agenda"><span><CalendarDays /></span><div><small>PRÓXIMAS ACTIVIDADES</small><strong>{upcoming.length}</strong><em>{renewals.length} renovaciones cercanas</em></div><ArrowRight /></Link> : null}
      {showCommercial ? <Link href="/panel/cotizador"><span><FileClock /></span><div><small>EMBUDO ABIERTO</small><strong>{activeQuotes}</strong><em>{relevantQuotes.length} cotizaciones {session.role === "sales" ? "propias" : "creadas"}</em></div><ArrowRight /></Link> : null}
      {showProjects ? <Link href="/panel/proyectos"><span><Columns3 /></span><div><small>PRODUCCIÓN ACTIVA</small><strong>{openTasks.length}</strong><em>{overdueTasks.length} tareas atrasadas</em></div><ArrowRight /></Link> : null}
      {showFinance ? <Link href="/panel/finanzas"><span><TrendingUp /></span><div><small>INGRESO ESPERADO</small><strong>{money(expectedIncome)}</strong><em>{money(income)} registrado este mes</em></div><ArrowRight /></Link> : showCommercial ? <Link href="/panel/catalogo"><span><Sparkles /></span><div><small>CATÁLOGO COMERCIAL</small><strong>{data.catalog_services.filter((service) => service.active).length}</strong><em>{data.service_categories.filter((category) => category.active).length} categorías activas</em></div><ArrowRight /></Link> : null}
      {showPersonnel ? <Link href="/panel/personal"><span><BriefcaseBusiness /></span><div><small>EQUIPO ACTIVO</small><strong>{data.employees.filter((employee) => employee.status === "active").length}</strong><em>{employeeWorkload.reduce((sum, item) => sum + item.count, 0)} asignaciones abiertas</em></div><ArrowRight /></Link> : null}
    </section>

    <section className={styles.dashboardGrid}>
      {showCalendar ? <article className={styles.dashboardPanel}><header><div><CalendarDays /><span><small>AGENDA</small><h2>Lo próximo</h2></span></div><Link href="/panel/agenda">Ver agenda <ArrowRight /></Link></header><div className={styles.dashboardList}>{upcoming.length ? upcoming.map((event) => <Link href="/panel/agenda" key={event.id}><span className={`${styles.dashboardEventIcon} ${styles[event.type]}`}><Clock3 /></span><div><strong>{event.title}</strong><small>{event.client_name || "Actividad interna"} · {eventDate(event.start_at)}</small></div><em>{event.status === "confirmed" ? "Confirmada" : event.status === "completed" ? "Completada" : "Programada"}</em></Link>) : <p>No hay actividades próximas. La agenda está libre.</p>}</div></article> : null}

      {showCommercial ? <article className={styles.dashboardPanel}><header><div><FileCheck2 /><span><small>COMERCIAL</small><h2>Estado de propuestas</h2></span></div><Link href="/panel/cotizador">Abrir cotizador <ArrowRight /></Link></header><div className={styles.pipelineChart}>{quoteCounts.map((item) => <div key={item.status}><span><strong>{item.count}</strong><small>{quoteLabels[item.status]}</small></span><i><b style={{ width: `${relevantQuotes.length ? Math.max(5, item.count / relevantQuotes.length * 100) : 0}%` }} /></i></div>)}</div></article> : null}

      {showRankings ? <article className={styles.dashboardPanel}><header><div><Trophy /><span><small>RANKING COMERCIAL · {month}</small><h2>Vendedores por ventas ganadas</h2></span></div><Link href="/panel/comisiones">Ver comisiones <ArrowRight /></Link></header><div className={styles.rankingList}>{sellerRanking.length ? sellerRanking.map((seller, index) => <div key={seller.id}><span className={styles.rankingPosition}>{index + 1}</span><span><strong>{seller.name}</strong><small>{seller.sales} {seller.sales === 1 ? "venta" : "ventas"} · {seller.clients} clientes activos</small><i><b style={{ width: `${Math.max(7, (seller.pen || seller.usd) / maxSellerRevenue * 100)}%` }} /></i></span><em>{seller.pen ? money(seller.pen) : ""}{seller.pen && seller.usd ? " + " : ""}{seller.usd ? money(seller.usd, "USD") : ""}</em></div>) : <p>Las ventas marcadas como ganadas aparecerán aquí.</p>}</div></article> : null}

      {showRankings ? <article className={styles.dashboardPanel}><header><div><TrendingUp /><span><small>RANKING DE CLIENTES · {month}</small><h2>Ingresos realmente cobrados</h2></span></div><Link href="/panel/finanzas">Ver finanzas <ArrowRight /></Link></header><div className={styles.rankingList}>{clientRanking.length ? clientRanking.map((client, index) => <div key={client.id}><span className={styles.rankingPosition}>{index + 1}</span><span><strong>{client.name}</strong><small>{client.payments} {client.payments === 1 ? "movimiento de ingreso" : "movimientos de ingreso"}</small><i><b style={{ width: `${Math.max(7, (client.pen || client.usd) / maxClientIncome * 100)}%` }} /></i></span><em>{client.pen ? money(client.pen) : ""}{client.pen && client.usd ? " + " : ""}{client.usd ? money(client.usd, "USD") : ""}</em></div>) : <p>Registra ingresos vinculados a clientes para construir este ranking.</p>}</div></article> : null}

      {showClients ? <article className={styles.dashboardPanel}><header><div><UsersRound /><span><small>CLIENTES</small><h2>Renovaciones en 30 días</h2></span></div><Link href="/panel/clientes">Ver clientes <ArrowRight /></Link></header><div className={styles.renewalStack}>{renewals.length ? renewals.map((client) => <Link href="/panel/clientes" key={client.id}><span>{client.company_name}<small>{client.plan_name} · {money(client.monthly_fee, client.currency)}</small></span><strong>{client.end_date}</strong></Link>) : <p>No hay vencimientos próximos.</p>}</div></article> : null}

      {showProjects ? <article className={styles.dashboardPanel}><header><div><AlertTriangle /><span><small>PRODUCCIÓN</small><h2>Atención prioritaria</h2></span></div><Link href="/panel/proyectos">Ver tablero <ArrowRight /></Link></header><div className={styles.dashboardList}>{overdueTasks.length ? overdueTasks.map((task) => <Link href="/panel/proyectos" key={task.id}><span className={styles.dashboardEventIcon}><Columns3 /></span><div><strong>{task.title}</strong><small>{data.clients.find((client) => client.id === task.client_id)?.company_name || "Cliente"} · venció {task.due_date}</small></div><em>{task.priority === "urgent" ? "Urgente" : "Atrasada"}</em></Link>) : <p>No hay tareas atrasadas. El flujo está al día.</p>}</div></article> : null}

      {showFinance ? <article className={styles.dashboardPanel}><header><div><WalletCards /><span><small>FINANZAS · {month}</small><h2>Salud del mes</h2></span></div><Link href="/panel/finanzas">Ver detalle <ArrowRight /></Link></header><div className={styles.healthSummary}><span><small>Ingresos</small><strong>{money(income)}</strong></span><span><small>Egresos</small><strong>{money(expense)}</strong></span><span className={income - expense >= 0 ? styles.positiveBalance : styles.negativeBalance}><small>Saldo</small><strong>{money(income - expense)}</strong></span></div><div className={styles.accountChart}>{accounts.map((item) => <div key={item.account}><span><Landmark />{accountLabels[item.account]}<strong>{money(item.balance)}</strong></span><i><b style={{ width: `${Math.abs(item.balance) / maxAccount * 100}%` }} /></i></div>)}</div></article> : null}
      {showPersonnel ? <article className={styles.dashboardPanel}><header><div><BriefcaseBusiness /><span><small>PERSONAL</small><h2>Carga del equipo</h2></span></div><Link href="/panel/personal">Ver personal <ArrowRight /></Link></header><div className={styles.pipelineChart}>{employeeWorkload.length ? employeeWorkload.map(({ employee, count }) => <div key={employee.id}><span><strong>{count}</strong><small>{employee.full_name} · {employee.area}</small></span><i><b style={{ width: `${Math.min(100, count * 12.5)}%` }} /></i></div>) : <p>Registra al equipo para visualizar su carga.</p>}</div></article> : null}
    </section>

  </main>;
}
