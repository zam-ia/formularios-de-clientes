"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import styles from "../catalog.module.css";

export default function ContactForm() {
  const [state, setState] = useState<"idle"|"sending"|"sent"|"error">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending");
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget));
      if (!String(payload.company || "").trim()) payload.company = "Sin especificar";
      const response = await fetch("/api/brochure-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      event.currentTarget.reset(); setState("sent");
    } catch { setState("error"); }
  }
  return <form className={styles.contactForm} onSubmit={(event)=>void submit(event)}><label>Nombre<input name="name" autoComplete="name" required minLength={2}/></label><label>WhatsApp<input name="whatsapp" type="tel" autoComplete="tel" required minLength={8}/></label><label>Empresa <span>opcional</span><input name="company" autoComplete="organization"/></label><label>¿Qué necesitas?<textarea name="message" required minLength={10} rows={5}/></label><input name="website" tabIndex={-1} autoComplete="off" className={styles.honeypot}/><button className={styles.primaryButton} disabled={state==="sending"}>{state==="sending"?<LoaderCircle/>:<>Enviar consulta <ArrowRight/></>}</button>{state==="sent"?<p className={styles.formSuccess}>Recibimos tu consulta. Te escribiremos para entender el contexto.</p>:null}{state==="error"?<p className={styles.formError}>No pudimos enviarla. Inténtalo nuevamente o escríbenos por WhatsApp.</p>:null}</form>;
}
