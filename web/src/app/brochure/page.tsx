import type { Metadata } from 'next';
import { getBrochureContent } from '@/lib/brochure';
import BrochureLanding from './BrochureLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Crisdal Agency | Contenido, video, redes y publicidad en Huancayo' },
  description: 'Planes de video, diseño, manejo de redes y Meta Ads para negocios de Huancayo que quieren contenido que venda.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Crisdal Agency | Contenido que vende',
    description: 'Conoce nuestros planes de video, diseño, redes y publicidad para negocios de Huancayo.',
    type: 'website',
    locale: 'es_PE',
  },
};

export default async function BrochurePage() {
  return <BrochureLanding content={await getBrochureContent()} />;
}
