import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'crisdal_admin_session';
const ADMIN_SESSION_SECONDS = 60 * 60 * 12;
const MAGIC_LINK_SECONDS = 60 * 15;

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || 'crisdalagency@gmail.com').trim().toLowerCase();
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

export function createMagicLinkToken() {
  const expires = Math.floor(Date.now() / 1000) + MAGIC_LINK_SECONDS;
  const nonce = randomBytes(24).toString('base64url');
  return `${expires}.${nonce}.${sign(`${getAdminEmail()}.${expires}.${nonce}`)}`;
}

export function verifyMagicLinkToken(token: string) {
  const [expiresRaw, nonce, signature] = token.split('.');
  const expires = Number(expiresRaw);
  if (!expires || expires < Math.floor(Date.now() / 1000) || !nonce || !signature) return false;
  return safeEqual(signature, sign(`${getAdminEmail()}.${expires}.${nonce}`));
}

export function createSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  return `${expires}.${sign(`${getAdminEmail()}.${expires}`)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [expiresRaw, signature] = token.split('.');
  const expires = Number(expiresRaw);
  if (!expires || expires < Math.floor(Date.now() / 1000) || !signature) return false;
  return safeEqual(signature, sign(`${getAdminEmail()}.${expires}`));
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
