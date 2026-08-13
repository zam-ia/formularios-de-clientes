"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  Coins,
  Eye,
  EyeOff,
  Gift,
  Handshake,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { allyCategories } from "@/lib/allies";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import styles from "./allies.module.css";
type PublicAlly = {
  id: string;
  businessName: string;
  category: string;
  description: string;
  logoUrl: string | null;
};
type Me = PublicAlly & {
  documentType: "DNI" | "RUC";
  documentNumberMasked: string;
  contactName: string;
  contactWhatsapp: string;
  contactEmail: string | null;
  status: string;
  loyaltyStatus: "active" | "frozen";
  visible: boolean;
  mustChangePassword: boolean;
};
type DashboardData = {
  summary: { balance: number; reserved: number; available: number; status: "active" | "frozen"; expiresAt: string | null };
  movements: Array<{ id: string; type: string; points: number; reference: string; created_at: string }>;
  services: Array<{ id: string; period: string; plan: string; services: string; amount_paid: number; points_awarded: number }>;
  metrics: Array<{ id: string; period: string; reach: number; audience: number; audience_growth: number; organic_growth: number; engagement: number; leads: number; sales: number | null; revenue: number | null; ad_spend: number | null; roi: number | null; notes: string }>;
  rewards: Array<{ id: string; title: string; description: string; category: string; points: number; stock: number | null }>;
  redemptions: Array<{ id: string; reward_title: string; points: number; status: string; requested_at: string }>;
};
type View =
  | "landing"
  | "login"
  | "register"
  | "waiting"
  | "password"
  | "dashboard"
  | "directory"
  | "profile";
async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ocurrió un error.");
  return data as T;
}
export default function AlliesClient() {
  const [view, setView] = useState<View>("landing"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [me, setMe] = useState<Me | null>(null),
    [dashboard, setDashboard] = useState<DashboardData | null>(null),
    [allies, setAllies] = useState<PublicAlly[]>([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [selected, setSelected] = useState<PublicAlly | null>(null),
    [reward, setReward] = useState<DashboardData["rewards"][number] | null>(null),
    [showPass, setShowPass] = useState(false);
  useEffect(() => {
    void api<{ authenticated: boolean; ally?: Me }>("/api/allies/auth/session")
      .then(async (r) => {
        if (r.authenticated && r.ally) {
          setMe(r.ally);
          if (r.ally.mustChangePassword) setView("password");
          else {
            const [directory, dashboardData] = await Promise.all([
              api<PublicAlly[]>("/api/allies/directory"),
              api<DashboardData>("/api/allies/dashboard"),
            ]);
            setAllies(directory);
            setDashboard(dashboardData);
            setView("dashboard");
          }
        }
      })
      .catch(() => undefined);
  }, []);
  const filtered = useMemo(
    () =>
      allies.filter(
        (a) =>
          (category === "Todos" || a.category === category) &&
          `${a.businessName} ${a.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [allies, search, category],
  );
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const f = new FormData(e.currentTarget);
    try {
      const result = await api<{ mustChangePassword: boolean }>(
        "/api/allies/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            document: f.get("document"),
            password: f.get("password"),
          }),
        },
      );
      const session = await api<{ ally: Me }>("/api/allies/auth/session");
      setMe(session.ally);
      if (result.mustChangePassword) setView("password");
      else {
        const [directory, dashboardData] = await Promise.all([
          api<PublicAlly[]>("/api/allies/directory"),
          api<DashboardData>("/api/allies/dashboard"),
        ]);
        setAllies(directory);
        setDashboard(dashboardData);
        setView("dashboard");
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "No pudimos ingresar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/allies/register", {
        method: "POST",
        body: JSON.stringify({
          documentType: f.get("documentType"),
          documentNumber: f.get("documentNumber"),
          businessName: f.get("businessName"),
          category: f.get("category"),
          contactName: f.get("contactName"),
          whatsapp: f.get("whatsapp"),
          email: f.get("email"),
          description: f.get("description"),
          consent: f.get("consent") === "on",
          website: f.get("website"),
        }),
      });
      setView("waiting");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No pudimos registrar la solicitud.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const f = new FormData(e.currentTarget);
    const next = String(f.get("newPassword"));
    if (next !== f.get("confirmPassword")) {
      setNotice("Las contraseñas nuevas no coinciden.");
      setBusy(false);
      return;
    }
    try {
      await api("/api/allies/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: f.get("currentPassword"),
          newPassword: next,
        }),
      });
      const session = await api<{ ally: Me }>("/api/allies/auth/session");
      setMe(session.ally);
      const [directory, dashboardData] = await Promise.all([
        api<PublicAlly[]>("/api/allies/directory"),
        api<DashboardData>("/api/allies/dashboard"),
      ]);
      setAllies(directory);
      setDashboard(dashboardData);
      setView("dashboard");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No pudimos activar tu cuenta.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await api("/api/allies/auth/logout", { method: "POST", body: "{}" });
    setMe(null);
    setAllies([]);
    setDashboard(null);
    setView("landing");
  }
  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    setNotice("");
    const f = new FormData(e.currentTarget);
    try {
      const updated = await api<Me>("/api/allies/profile", {
        method: "PUT",
        body: JSON.stringify({
          businessName: f.get("businessName"),
          category: f.get("category"),
          description: f.get("description"),
          contactName: f.get("contactName"),
          whatsapp: f.get("whatsapp"),
          email: f.get("email"),
          visible: f.get("visible") === "on",
          logoUrl: me.logoUrl,
        }),
      });
      setMe(updated);
      setNotice("Perfil guardado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function uploadLogo(file?: File) {
    if (!file || !me) return;
    setBusy(true);
    try {
      const signed = await api<{ path: string; token: string; url: string }>(
        "/api/allies/logo",
        {
          method: "POST",
          body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
        },
      );
      const { error } = await getSupabaseBrowser()
        .storage.from("crisdal-allies-data")
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type,
        });
      if (error) throw error;
      setMe({ ...me, logoUrl: signed.url });
      setNotice("Logo cargado. Guarda el perfil para publicarlo.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "No pudimos cargar el logo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      {view === "landing" ? (
        <Landing
          onLogin={() => setView("login")}
          onRegister={() => setView("register")}
        />
      ) : null}
      {view === "login" ? (
        <AuthShell
          title="Bienvenido de vuelta"
          text="Ingresa con tu DNI o RUC y tu contraseña."
          back={() => setView("landing")}
        >
          <form onSubmit={login} className={styles.form}>
            <label>
              DNI o RUC
              <input
                name="document"
                inputMode="numeric"
                required
                minLength={8}
                maxLength={11}
              />
            </label>
            <label>
              Contraseña
              <div className={styles.password}>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Mostrar contraseña"
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>
            <Submit busy={busy}>Ingresar</Submit>
          </form>
        </AuthShell>
      ) : null}
      {view === "register" ? (
        <AuthShell
          title="Solicita acceso"
          text="Verificaremos que seas cliente de Crisdal antes de activar tu cuenta."
          back={() => setView("landing")}
        >
          <form onSubmit={register} className={styles.form}>
            <div className={styles.two}>
              <label>
                Tipo de documento
                <select name="documentType">
                  <option>DNI</option>
                  <option>RUC</option>
                </select>
              </label>
              <label>
                Número
                <input
                  name="documentNumber"
                  inputMode="numeric"
                  required
                  minLength={8}
                  maxLength={11}
                />
              </label>
            </div>
            <label>
              Negocio o empresa
              <input name="businessName" required maxLength={120} />
            </label>
            <label>
              Rubro
              <select name="category">
                {allyCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Tu nombre
              <input name="contactName" required maxLength={100} />
            </label>
            <div className={styles.two}>
              <label>
                WhatsApp
                <input name="whatsapp" required inputMode="tel" />
              </label>
              <label>
                Correo
                <input name="email" type="email" />
              </label>
            </div>
            <label>
              ¿Qué ofreces?
              <textarea name="description" maxLength={500} rows={3} />
            </label>
            <label className={styles.check}>
              <input type="checkbox" name="consent" required />
              <span>
                <Check />
              </span>
              Autorizo que mi perfil aparezca cuando sea aprobado. Podré
              ocultarlo después.
            </label>
            <input className={styles.honey} name="website" tabIndex={-1} />
            <Submit busy={busy}>Enviar solicitud</Submit>
          </form>
        </AuthShell>
      ) : null}
      {view === "waiting" ? <StatusCard /> : null}
      {view === "password" ? (
        <AuthShell
          title="Protege tu cuenta"
          text="Tu documento fue la clave temporal. Crea una contraseña personal antes de entrar."
          back={logout}
        >
          <form onSubmit={changePassword} className={styles.form}>
            <label>
              Clave temporal <small>Tu DNI o RUC</small>
              <input name="currentPassword" type="password" required />
            </label>
            <label>
              Nueva contraseña
              <input
                name="newPassword"
                type="password"
                required
                minLength={10}
              />
            </label>
            <label>
              Repite la contraseña
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={10}
              />
            </label>
            <Submit busy={busy}>Activar mi cuenta</Submit>
          </form>
        </AuthShell>
      ) : null}
      {(view === "dashboard" || view === "directory" || view === "profile") && me ? (
        <MemberShell
          logout={logout}
          profile={() => setView("profile")}
          directory={() => setView("directory")}
          dashboard={() => setView("dashboard")}
        >
          {view === "dashboard" && dashboard ? (
            <Dashboard me={me} data={dashboard} redeem={setReward} />
          ) : view === "directory" ? (
            <Directory
              allies={filtered}
              all={allies}
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              select={setSelected}
            />
          ) : (
            <Profile
              me={me}
              busy={busy}
              save={saveProfile}
              upload={uploadLogo}
            />
          )}
        </MemberShell>
      ) : null}
      {selected ? (
        <ContactModal
          ally={selected}
          close={() => setSelected(null)}
          done={() => {
            setSelected(null);
            setNotice("Solicitud enviada. Ambos recibirán una notificación.");
          }}
        />
      ) : null}
      {reward ? (
        <RewardModal
          reward={reward}
          available={dashboard?.summary.available || 0}
          close={() => setReward(null)}
          confirm={async () => {
            setBusy(true);
            try {
              await api("/api/allies/redemptions", { method: "POST", body: JSON.stringify({ rewardId: reward.id }) });
              setDashboard(await api<DashboardData>("/api/allies/dashboard"));
              setReward(null);
              setNotice("Canje solicitado. El equipo Crisdal lo revisará antes de hacerlo efectivo.");
            } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos solicitar el canje."); }
            finally { setBusy(false); }
          }}
          busy={busy}
        />
      ) : null}
      {notice ? (
        <div className={styles.notice}>
          {notice}
          <button onClick={() => setNotice("")}>
            <X />
          </button>
        </div>
      ) : null}
    </main>
  );
}
function Landing({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <>
      <header className={styles.header}>
        <Brand />
        <button onClick={onLogin}>Ingresar</button>
      </header>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>
            Una comunidad privada de clientes Crisdal
          </p>
          <h1>
            Negocios que
            <br />
            <em>crecen juntos.</em>
          </h1>
          <p>
            Conoce proveedores y posibles aliados de confianza dentro de nuestra
            propia cartera de clientes.
          </p>
          <div>
            <button className={styles.primary} onClick={onRegister}>
              Solicitar acceso <ArrowRight />
            </button>
            <button className={styles.ghost} onClick={onLogin}>
              Ya soy aliado
            </button>
          </div>
        </div>
        <div className={styles.network}>
          <Handshake />
          <i />
          <i />
          <i />
          <span>Conexiones verificadas</span>
        </div>
      </section>
      <section className={styles.benefits}>
        {[
          [
            ShieldCheck,
            "Solo clientes verificados",
            "Cada perfil pasa por la aprobación del equipo Crisdal.",
          ],
          [
            Search,
            "Encuentra lo que necesitas",
            "Busca por nombre o rubro sin exponer datos privados.",
          ],
          [
            Sparkles,
            "Genera nuevas oportunidades",
            "Solicita una conexión y nosotros acercamos a ambas partes.",
          ],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof ShieldCheck;
          return (
            <article key={title as string}>
              <I />
              <h2>{title as string}</h2>
              <p>{text as string}</p>
            </article>
          );
        })}
      </section>
    </>
  );
}
function Brand() {
  return (
    <div className={styles.brand}>
      <b>C</b>
      <span>
        CRISDAL<small>RED DE ALIADOS</small>
      </span>
    </div>
  );
}
function AuthShell({
  title,
  text,
  back,
  children,
}: {
  title: string;
  text: string;
  back: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.auth}>
      <div className={styles.authVisual}>
        <Brand />
        <Handshake />
        <h2>Una red para hacer negocios con confianza.</h2>
      </div>
      <div className={styles.authCard}>
        <button className={styles.back} onClick={back}>
          ← Volver
        </button>
        <p className={styles.eyebrow}>Red de Aliados</p>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
      </div>
    </section>
  );
}
function Submit({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="submit" className={styles.primary} disabled={busy}>
      {busy ? <LoaderCircle className={styles.spin} /> : null}
      {children}
      <ArrowRight />
    </button>
  );
}
function StatusCard() {
  return (
    <section className={styles.status}>
      <div>
        <ShieldCheck />
      </div>
      <p className={styles.eyebrow}>Solicitud recibida</p>
      <h1>Ahora nos toca verificarte.</h1>
      <p>
        El equipo revisará que tus datos correspondan a un cliente activo.
        Cuando te aprobemos, podrás ingresar usando tu DNI o RUC como usuario y
        clave temporal.
      </p>
      <a href="/aliados">Entendido</a>
    </section>
  );
}
function MemberShell({
  logout,
  profile,
  directory,
  dashboard,
  children,
}: {
  logout: () => void;
  profile: () => void;
  directory: () => void;
  dashboard: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className={styles.memberHeader}>
        <Brand />
        <nav>
          <button onClick={dashboard}>Mis resultados</button>
          <button onClick={directory}>Directorio</button>
          <button onClick={profile}>Mi perfil</button>
          <button onClick={logout}>
            <LogOut /> Salir
          </button>
        </nav>
      </header>
      {children}
      <div className={styles.memberMobile}>
        <button onClick={dashboard}>
          <Coins />
          Puntos
        </button>
        <button onClick={directory}>
          <Search />
          Directorio
        </button>
        <button onClick={profile}>
          <UserRound />
          Mi perfil
        </button>
        <button onClick={logout}>
          <LogOut />
          Salir
        </button>
      </div>
    </>
  );
}

function Dashboard({ me, data, redeem }: { me: Me; data: DashboardData; redeem: (reward: DashboardData["rewards"][number]) => void }) {
  const latest = data.metrics[0];
  const progressReward = data.rewards.find((reward) => reward.points > data.summary.available) || data.rewards.at(-1);
  const progress = progressReward ? Math.min(100, (data.summary.available / progressReward.points) * 100) : 100;
  return (
    <section className={styles.loyaltyDashboard}>
      <div className={styles.loyaltyHero}>
        <div><p className={styles.eyebrow}>Hola, {me.contactName}</p><h1>Tu crecimiento también acumula.</h1><span>Aquí puedes seguir tus resultados, servicios y beneficios dentro de Crisdal.</span></div>
        <div className={styles.pointsOrb}><small>SALDO DISPONIBLE</small><strong>{data.summary.available.toLocaleString("es-PE")}</strong><span>puntos</span>{data.summary.status === "frozen" ? <b>CUENTA CONGELADA</b> : null}</div>
      </div>
      <div className={styles.loyaltyStats}>
        <article><Coins /><span>Puntos acumulados</span><strong>{data.summary.balance.toLocaleString("es-PE")}</strong><small>{data.summary.reserved ? `${data.summary.reserved} reservados en canjes` : "Listos para usar"}</small></article>
        <article><BarChart3 /><span>Último alcance</span><strong>{latest ? latest.reach.toLocaleString("es-PE") : "—"}</strong><small>{latest ? `Periodo ${formatPeriod(latest.period)}` : "Aún sin reporte"}</small></article>
        <article><Trophy /><span>ROI de campañas</span><strong>{latest?.roi !== null && latest?.roi !== undefined ? `${latest.roi.toFixed(0)}%` : "—"}</strong><small>{latest?.ad_spend ? `Sobre S/${latest.ad_spend.toLocaleString("es-PE")} en pauta` : "Se mostrará con autorización"}</small></article>
        <article><CalendarDays /><span>Servicios registrados</span><strong>{data.services.length}</strong><small>{data.summary.expiresAt ? `Actividad vigente hasta ${new Date(data.summary.expiresAt).toLocaleDateString("es-PE")}` : "Sin vencimiento próximo"}</small></article>
      </div>
      {progressReward ? <div className={styles.rewardProgress}><div><span>PRÓXIMO BENEFICIO</span><h2>{progressReward.title}</h2><p>Te faltan {Math.max(0, progressReward.points - data.summary.available)} puntos.</p></div><div><strong>{Math.round(progress)}%</strong><span><i style={{ width: `${progress}%` }} /></span><small>{data.summary.available} / {progressReward.points} pts</small></div></div> : null}
      <div className={styles.dashboardGrid}>
        <section className={styles.performance}><div className={styles.dashboardHead}><div><p className={styles.eyebrow}>Resultados con Crisdal</p><h2>Tu evolución, sin métricas de vanidad.</h2></div>{latest ? <span>{formatPeriod(latest.period)}</span> : null}</div>
          {latest ? <><div className={styles.performanceGrid}><Metric label="Audiencia" value={latest.audience.toLocaleString("es-PE")} change={`${latest.audience_growth >= 0 ? "+" : ""}${latest.audience_growth}%`} /><Metric label="Crecimiento orgánico" value={`${latest.organic_growth}%`} change="del periodo" /><Metric label="Engagement" value={`${latest.engagement}%`} change="interacción" /><Metric label="Oportunidades" value={String(latest.leads)} change={latest.sales !== null ? `${latest.sales} ventas` : "leads registrados"} /></div>{latest.notes ? <p className={styles.metricNote}>{latest.notes}</p> : null}</> : <Empty text="Tu primer reporte aparecerá aquí cuando el equipo registre las métricas del mes." />}
        </section>
        <section className={styles.servicesHistory}><div className={styles.dashboardHead}><div><p className={styles.eyebrow}>Historial</p><h2>Servicios y puntos.</h2></div></div>{data.services.slice(0, 5).map((service) => <article key={service.id}><div><span>{formatPeriod(service.period)}</span><h3>{service.plan}</h3><p>{service.services}</p></div><strong>+{service.points_awarded}<small> PTS</small></strong></article>)}{!data.services.length ? <Empty text="Cuando se registre un pago verás aquí el plan, servicios y puntos obtenidos." /> : null}</section>
      </div>
      <section className={styles.rewardCatalog}><div className={styles.dashboardHead}><div><p className={styles.eyebrow}>Catálogo de canje</p><h2>Convierte tus puntos en nuevas posibilidades.</h2></div><span>Los canjes requieren aprobación</span></div><div className={styles.rewardCards}>{data.rewards.map((item) => { const available = data.summary.available >= item.points && data.summary.status === "active"; return <article key={item.id} className={!available ? styles.rewardLocked : ""}><div><Gift /><span>{item.category}</span></div><h3>{item.title}</h3><p>{item.description}</p><strong>{item.points.toLocaleString("es-PE")} <small>PTS</small></strong><button disabled={!available} onClick={() => redeem(item)}>{available ? "Solicitar canje" : `Te faltan ${Math.max(0, item.points - data.summary.available)} pts`}</button></article>; })}</div></section>
      {data.redemptions.length ? <section className={styles.myRedemptions}><div className={styles.dashboardHead}><div><p className={styles.eyebrow}>Solicitudes</p><h2>Estado de tus canjes.</h2></div></div>{data.redemptions.map((item) => <article key={item.id}><div><strong>{item.reward_title}</strong><span>{new Date(item.requested_at).toLocaleDateString("es-PE")} · {item.points} puntos</span></div><b className={styles[item.status]}>{redemptionLabel(item.status)}</b></article>)}</section> : null}
    </section>
  );
}

function Metric({ label, value, change }: { label: string; value: string; change: string }) { return <article><span>{label}</span><strong>{value}</strong><small>{change}</small></article>; }
function Empty({ text }: { text: string }) { return <div className={styles.dashboardEmpty}><Sparkles /><p>{text}</p></div>; }
function formatPeriod(period: string) { const [year, month] = period.split("-").map(Number); return new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)); }
function redemptionLabel(status: string) { return ({ pending: "En revisión", approved: "Aprobado", rejected: "No aprobado", delivered: "Entregado" } as Record<string, string>)[status] || status; }

function Directory({
  allies,
  all,
  search,
  setSearch,
  category,
  setCategory,
  select,
}: {
  allies: PublicAlly[];
  all: PublicAlly[];
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  select: (a: PublicAlly) => void;
}) {
  const cats = ["Todos", ...new Set(all.map((a) => a.category))];
  return (
    <section className={styles.directory}>
      <p className={styles.eyebrow}>Directorio privado</p>
      <h1>Encuentra a tu próximo aliado.</h1>
      <div className={styles.filters}>
        <label>
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio o servicio"
          />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className={styles.grid}>
        {allies.map((a) => (
          <article key={a.id}>
            {a.logoUrl ? (
              <Image
                src={a.logoUrl}
                alt={`Logo de ${a.businessName}`}
                width={90}
                height={90}
                unoptimized
              />
            ) : (
              <div className={styles.initial}>{a.businessName.charAt(0)}</div>
            )}
            <span>{a.category}</span>
            <h2>{a.businessName}</h2>
            <p>
              {a.description ||
                "Conoce más sobre este aliado solicitando una conexión."}
            </p>
            <button onClick={() => select(a)}>
              <MessageCircle /> Solicitar contacto
            </button>
          </article>
        ))}
      </div>
      {!allies.length ? (
        <div className={styles.empty}>
          No encontramos aliados con esos filtros.
        </div>
      ) : null}
    </section>
  );
}
function Profile({
  me,
  busy,
  save,
  upload,
}: {
  me: Me;
  busy: boolean;
  save: (e: React.FormEvent<HTMLFormElement>) => void;
  upload: (file?: File) => void;
}) {
  return (
    <section className={styles.profile}>
      <div>
        <p className={styles.eyebrow}>Mi perfil</p>
        <h1>Así te verá la red.</h1>
        <p>Tú decides si quieres aparecer en el directorio.</p>
      </div>
      <form onSubmit={save} className={styles.profileCard}>
        <label className={styles.logoUpload}>
          {me.logoUrl ? (
            <Image
              src={me.logoUrl}
              alt="Logo actual"
              width={110}
              height={110}
              unoptimized
            />
          ) : (
            <Building2 />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <span>
            <UploadCloud /> Cambiar logo
          </span>
        </label>
        <label>
          Negocio
          <input name="businessName" defaultValue={me.businessName} required />
        </label>
        <label>
          Rubro
          <select name="category" defaultValue={me.category}>
            {allyCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Descripción
          <textarea
            name="description"
            defaultValue={me.description}
            rows={4}
            maxLength={500}
          />
        </label>
        <div className={styles.two}>
          <label>
            Contacto
            <input name="contactName" defaultValue={me.contactName} required />
          </label>
          <label>
            WhatsApp
            <input name="whatsapp" defaultValue={me.contactWhatsapp} required />
          </label>
        </div>
        <label>
          Correo
          <input
            name="email"
            type="email"
            defaultValue={me.contactEmail || ""}
          />
        </label>
        <label className={styles.check}>
          <input name="visible" type="checkbox" defaultChecked={me.visible} />
          <span>
            <Check />
          </span>
          Quiero aparecer en el directorio.
        </label>
        <Submit busy={busy}>Guardar perfil</Submit>
      </form>
    </section>
  );
}
function RewardModal({ reward, available, close, confirm, busy }: { reward: DashboardData["rewards"][number]; available: number; close: () => void; confirm: () => Promise<void>; busy: boolean }) {
  return <div className={`${styles.modal} ${styles.rewardModal}`} role="dialog" aria-modal="true"><div><button onClick={close} aria-label="Cerrar"><X /></button><div className={styles.rewardModalIcon}><Gift /></div><p className={styles.eyebrow}>Confirmar canje</p><h2>{reward.title}</h2><p>{reward.description}</p><div className={styles.rewardBalance}><span>Tu saldo</span><strong>{available} pts</strong><i /><span>Canje</span><strong>-{reward.points} pts</strong></div><small>La solicitud será revisada por Crisdal. Los puntos se descontarán cuando el canje sea aprobado.</small><button className={styles.primary} disabled={busy} onClick={() => void confirm()}>{busy ? <LoaderCircle className={styles.spin} /> : <Sparkles />} Solicitar canje</button></div></div>;
}

function ContactModal({
  ally,
  close,
  done,
}: {
  ally: PublicAlly;
  close: () => void;
  done: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/allies/contact", {
        method: "POST",
        body: JSON.stringify({
          recipientId: ally.id,
          message: f.get("message"),
        }),
      });
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviarla.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.modal}>
      <form onSubmit={send}>
        <button type="button" onClick={close}>
          <X />
        </button>
        <p className={styles.eyebrow}>Solicitar conexión</p>
        <h2>{ally.businessName}</h2>
        <p>
          Cuéntale brevemente por qué te gustaría conversar. No mostraremos sus
          datos directamente.
        </p>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={600}
          rows={5}
          placeholder="Hola, me gustaría conversar sobre…"
        />
        {error ? <span>{error}</span> : null}
        <Submit busy={busy}>Enviar solicitud</Submit>
      </form>
    </div>
  );
}
