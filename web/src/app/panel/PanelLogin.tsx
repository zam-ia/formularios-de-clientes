"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";
import styles from "./login.module.css";

async function loginRequest(username: string, password: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || "No pudimos iniciar sesión.");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("El acceso tardó demasiado. Inténtalo nuevamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function PanelLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("crisdal");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await loginRequest(username, password);
      router.replace("/panel/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  return <main className={styles.page}>
    <section className={styles.card}>
      <div className={styles.brand}><span>C</span><strong>CRISDAL<small>AGENCY</small></strong></div>
      <div className={styles.heading}><span><LockKeyhole /></span><div><small>ACCESO PRIVADO</small><h1>Panel administrativo</h1><p>Ingresa para gestionar la agencia. El sitio público permanece separado.</p></div></div>
      <form onSubmit={submit}>
        <label>Usuario<input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} required /></label>
        <label>Contraseña<input type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required /></label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <button type="submit" disabled={busy}>{busy ? <LoaderCircle className={styles.spin} /> : <LockKeyhole />} {busy ? "Verificando…" : "Ingresar"}</button>
      </form>
      <p className={styles.note}>Usa la contraseña administrativa configurada en Vercel. Por seguridad debe tener al menos 12 caracteres.</p>
      <Link href="/"><ArrowLeft /> Volver al sitio web</Link>
    </section>
  </main>;
}
