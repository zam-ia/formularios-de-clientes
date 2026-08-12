import type { Metadata } from 'next';
import { getBrochureContent } from '@/lib/brochure';
import BrochureLanding from './BrochureLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Crisdal Agency | Brochure digital',
  description: 'Conoce cómo Crisdal transforma estrategia, creatividad y tecnología en marcas que conectan y crecen.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Crisdal Agency | Ideas que se convierten en crecimiento',
    description: 'Branding, contenido, video, campañas y experiencias digitales construidas con estrategia.',
    type: 'website',
    locale: 'es_PE',
  },
};

export default async function BrochurePage() {
  return <BrochureLanding content={await getBrochureContent()} />;
}
