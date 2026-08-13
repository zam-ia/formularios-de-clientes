"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Handshake,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
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
  visible: boolean;
  mustChangePassword: boolean;
};
type View =
  | "landing"
  | "login"
  | "register"
  | "waiting"
  | "password"
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
    [allies, setAllies] = useState<PublicAlly[]>([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [selected, setSelected] = useState<PublicAlly | null>(null),
    [showPass, setShowPass] = useState(false);
  useEffect(() => {
    void api<{ authenticated: boolean; ally?: Me }>("/api/allies/auth/session")
      .then(async (r) => {
        if (r.authenticated && r.ally) {
          setMe(r.ally);
          if (r.ally.mustChangePassword) setView("password");
          else {
            setView("directory");
            setAllies(await api("/api/allies/directory"));
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
        setAllies(await api("/api/allies/directory"));
        setView("directory");
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
      setAllies(await api("/api/allies/directory"));
      setView("directory");
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
      {(view === "directory" || view === "profile") && me ? (
        <MemberShell
          logout={logout}
          profile={() => setView("profile")}
          directory={() => setView("directory")}
        >
          {view === "directory" ? (
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
  children,
}: {
  logout: () => void;
  profile: () => void;
  directory: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className={styles.memberHeader}>
        <Brand />
        <nav>
          <button onClick={directory}>Directorio</button>
          <button onClick={profile}>Mi perfil</button>
          <button onClick={logout}>
            <LogOut /> Salir
          </button>
        </nav>
      </header>
      {children}
      <div className={styles.memberMobile}>
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
