import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'crisdal_admin_session';
const ADMIN_SESSION_SECONDS = 60 * 60 * 12;
const SESSION_VERSION = 'v2';

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || 'crisdalagency@gmail.com').trim().toLowerCase();
}

export function getAdminUsername() {
  return (process.env.ADMIN_USERNAME || 'crisdal').trim().toLowerCase();
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('Configura ADMIN_SESSION_SECRET o SUPABASE_SERVICE_ROLE_KEY con al menos 32 caracteres.');
  }
  return secret;
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminCredentials(username: string, password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || configuredPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  }
  return safeEqual(username.trim().toLowerCase(), getAdminUsername()) && safeEqual(password, configuredPassword);
}

export function createSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  return `${SESSION_VERSION}.${expires}.${sign(`${SESSION_VERSION}.${getAdminUsername()}.${expires}`)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [version, expiresRaw, signature] = token.split('.');
  const expires = Number(expiresRaw);
  if (version !== SESSION_VERSION || !expires || expires < Math.floor(Date.now() / 1000) || !signature) return false;
  return safeEqual(signature, sign(`${SESSION_VERSION}.${getAdminUsername()}.${expires}`));
}

export function isAdminRequest(request: NextRequest, requireSameOrigin = false) {
  if (!verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) return false;
  if (!requireSameOrigin) return true;
  const origin = request.headers.get('origin');
  return Boolean(origin && (origin === request.nextUrl.origin || origin === process.env.NEXT_PUBLIC_SITE_URL));
}

export function setAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
