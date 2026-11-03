import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, readAdminSession } from '@/lib/adminAuth';
import PanelLogin from './PanelLogin';

export const metadata: Metadata = {
  title: 'Panel privado | Crisdal Agency',
  description: 'Gestión privada de enlaces y brochure de Crisdal Agency.',
  robots: { index: false, follow: false },
};

export default async function PanelPage() {
  const session = readAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (session) redirect('/panel/dashboard');
  return <PanelLogin />;
}
