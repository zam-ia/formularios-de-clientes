import type { Metadata } from 'next';
import PanelClient from './PanelClient';

export const metadata: Metadata = {
  title: 'Panel privado | Crisdal Agency',
  description: 'Gestión privada de enlaces y brochure de Crisdal Agency.',
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return <PanelClient />;
}
