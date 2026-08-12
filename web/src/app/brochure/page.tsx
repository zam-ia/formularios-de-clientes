import type { Metadata } from 'next';
import { getBrochureContent } from '@/lib/brochure';
import BrochureLanding from './BrochureLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Crisdal Agency | Crecer con orden',
  description: 'Ayudamos a empresas en crecimiento a ordenar estrategia, procesos, cultura y tecnología para construir operaciones más claras, medibles y preparadas para crecer.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Crisdal Agency | Estrategia, Procesos, Cultura y Tecnología',
    description: 'Transformamos crecimiento desordenado en una estructura más clara, rentable y preparada para escalar.',
    type: 'website',
    locale: 'es_PE',
  },
};

export default async function BrochurePage() {
  return <BrochureLanding content={await getBrochureContent()} />;
}
