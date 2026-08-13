import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest, NextResponse } from "next/server";

const scrypt = promisify(scryptCallback);
export const ALLY_COOKIE = "crisdal_ally_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const VERSION = "a1";

function secret() {
  const value =
    process.env.ALLY_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value || value.length < 32)
    throw new Error("Falta un secreto de sesión seguro para aliados.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function normalizeDocument(value: string) {
  return value.replace(/\D/g, "");
}
export function isValidDocument(type: "DNI" | "RUC", value: string) {
  return type === "DNI" ? /^\d{8}$/.test(value) : /^\d{11}$/.test(value);
}

export async function hashAllyPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `s1:${salt}:${derived.toString("hex")}`;
}

export async function verifyAllyPassword(password: string, encoded: string) {
  const [version, salt, expected] = encoded.split(":");
  if (version !== "s1" || !salt || !expected) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return safeEqual(derived.toString("hex"), expected);
}

export function createAllySession(allyId: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${VERSION}.${allyId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function readAllySession(token?: string) {
  if (!token) return null;
  const [version, allyId, expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (
    version !== VERSION ||
    !allyId ||
    !expires ||
    expires < Math.floor(Date.now() / 1000) ||
    !signature
  )
    return null;
  const payload = `${version}.${allyId}.${expires}`;
  return safeEqual(signature, sign(payload)) ? allyId : null;
}

export function allyIdFromRequest(request: NextRequest) {
  return readAllySession(request.cookies.get(ALLY_COOKIE)?.value);
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(
    origin &&
    (origin === request.nextUrl.origin ||
      origin === process.env.NEXT_PUBLIC_SITE_URL),
  );
}
export function setAllyCookie(response: NextResponse, allyId: string) {
  response.cookies.set(ALLY_COOKIE, createAllySession(allyId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}
export function clearAllyCookie(response: NextResponse) {
  response.cookies.set(ALLY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
