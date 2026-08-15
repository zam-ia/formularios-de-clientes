"use client";

import { Download, MessageCircle } from "lucide-react";
import styles from "./quote.module.css";

export default function QuoteActions({ whatsapp }: { whatsapp: string }) {
  return <div className={styles.quoteActions}><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /> Conversar por WhatsApp</a><button onClick={() => window.print()}><Download /> Guardar como PDF</button></div>;
}
