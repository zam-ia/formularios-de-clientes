import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'El acceso por correo fue desactivado. Usa usuario y contraseña.' }, { status: 410 });
}
