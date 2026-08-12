'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { ArrowDownRight, ArrowRight, Download, FileText, MessageCircle, Play, Sparkles } from 'lucide-react';
import type { BrochureContent } from '@/lib/brochure';
import styles from './brochure.module.css';

const serviceNumbers = ['01', '02', '03', '04', '05', '06', '07', '08'];

export default function BrochureLanding({ content }: { content: BrochureContent }) {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) entry.target.setAttribute('data-visible', 'true');
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const whatsappUrl = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent('Hola Crisdal, vi su brochure y quiero conversar sobre un proyecto.')}`;
  const ctaUrl = content.ctaUrl.startsWith('http') ? content.ctaUrl : content.ctaUrl;
  const images = content.media.filter((item) => item.kind === 'image');
  const videos = content.media.filter((item) => item.kind === 'video');
  const documents = content.media.filter((item) => item.kind === 'document');

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label="Crisdal Agency, inicio">
          <span className={styles.brandMark}>C</span>
          <span>CRISDAL<small>AGENCY</small></span>
        </a>
        <nav className={styles.nav} aria-label="Navegación del brochure">
          <a href="#servicios">Servicios</a>
          <a href="#trabajo">Nuestro trabajo</a>
        </nav>
        <a className={styles.headerCta} href={whatsappUrl} target="_blank" rel="noreferrer">Hablemos <ArrowDownRight size={18} /></a>
      </header>

      <section id="inicio" className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroCopy} data-reveal>
          <p className={styles.kicker}><Sparkles size={15} /> {content.kicker}</p>
          <h1>{content.title}</h1>
          <p className={styles.lead}>{content.lead}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href={ctaUrl}>{content.ctaLabel} <ArrowRight size={19} /></a>
            <a className={styles.textButton} href="#servicios">Ver lo que hacemos <ArrowDownRight size={18} /></a>
          </div>
        </div>
        <div className={styles.heroVisual} data-reveal>
          <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.avatarFrame}>
            <Image src="/avatar-crisdal-cutout.webp" alt="Asistente virtual de Crisdal Agency" width={800} height={800} priority sizes="(max-width: 900px) 82vw, 42vw" />
          </div>
          <span className={`${styles.floatingPill} ${styles.pillTop}`}>Estrategia primero</span>
          <span className={`${styles.floatingPill} ${styles.pillBottom}`}>Diseño que conecta</span>
        </div>
        <div className={styles.heroFoot}>
          <span>Lima · Perú</span><span>Branding</span><span>Contenido</span><span>Digital</span>
        </div>
      </section>

      <section id="servicios" className={styles.services}>
        <div className={styles.sectionIntro} data-reveal>
          <p className={styles.sectionIndex}>01 / CAPACIDADES</p>
          <h2>Una sola visión.<br />Todo lo necesario para mover tu marca.</h2>
        </div>
        <div className={styles.serviceGrid}>
          {content.services.map((service, index) => (
            <article className={styles.serviceCard} key={service.id} data-reveal>
              <span className={styles.cardNumber}>{serviceNumbers[index] || String(index + 1).padStart(2, '0')}</span>
              <span className={styles.serviceTag}>{service.tag}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ArrowDownRight className={styles.cardArrow} size={24} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.story}>
        <div className={styles.storyLabel} data-reveal><span>02</span><p>NUESTRA MANERA<br />DE TRABAJAR</p></div>
        <div className={styles.storyCopy} data-reveal><h2>{content.storyTitle}</h2><p>{content.story}</p></div>
        <div className={styles.storyStamp} aria-hidden="true"><span>CRISDAL</span><small>CRECER CON ORDEN</small></div>
      </section>

      <section id="trabajo" className={styles.mediaSection}>
        <div className={styles.sectionIntro} data-reveal>
          <p className={styles.sectionIndex}>03 / BROCHURE VIVO</p>
          <h2>Ideas en movimiento.</h2>
          <p className={styles.sectionLead}>Este espacio evoluciona con nuestros proyectos, campañas y producciones.</p>
        </div>

        {videos.length > 0 ? <div className={styles.videoGrid}>
          {videos.map((item) => <article className={styles.videoCard} key={item.id} data-reveal>
            <video controls playsInline preload="metadata" src={item.url} aria-label={item.title || 'Video de Crisdal'} />
            <div><span><Play size={14} /> VIDEO</span><h3>{item.title || 'Producción Crisdal'}</h3>{item.caption ? <p>{item.caption}</p> : null}</div>
          </article>)}
        </div> : <div className={styles.motionPlaceholder} data-reveal>
          <div className={styles.motionRings}><span /><span /><span /></div>
          <div><span className={styles.serviceTag}>SHOWREEL</span><h3>Próximamente: historias que merecen verse en movimiento.</h3><p>Nuestro panel está listo para incorporar reels, spots y piezas audiovisuales.</p></div>
        </div>}

        {images.length > 0 ? <div className={styles.imageGrid}>
          {images.map((item, index) => <figure className={index % 3 === 0 ? styles.imageWide : ''} key={item.id} data-reveal>
            <Image src={item.url} alt={item.title || item.caption || 'Proyecto de Crisdal Agency'} fill unoptimized sizes="(max-width: 720px) 100vw, 50vw" />
            <figcaption><strong>{item.title || 'Proyecto Crisdal'}</strong>{item.caption ? <span>{item.caption}</span> : null}</figcaption>
          </figure>)}
        </div> : null}

        {documents.length > 0 ? <div className={styles.documentGrid}>
          {documents.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id} data-reveal><FileText size={28} /><span><strong>{item.title || 'Documento Crisdal'}</strong><small>{item.caption || 'Abrir documento PDF'}</small></span><Download size={20} /></a>)}
        </div> : null}
      </section>

      <section className={styles.finalCta} data-reveal>
        <div><p className={styles.sectionIndex}>TU SIGUIENTE PASO</p><h2>Tu marca puede sentirse tan grande como la imaginas.</h2></div>
        <div className={styles.finalActions}>
          <a className={styles.primaryButton} href={ctaUrl}>{content.ctaLabel} <ArrowRight size={19} /></a>
          <a className={styles.whatsappButton} href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={20} /> WhatsApp</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brand}><span className={styles.brandMark}>C</span><span>CRISDAL<small>AGENCY</small></span></div>
        <p>Ideas claras. Diseño con intención. Crecimiento con orden.</p>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Contactar a Crisdal por WhatsApp"><MessageCircle size={20} /></a>
      </footer>
    </main>
  );
}
