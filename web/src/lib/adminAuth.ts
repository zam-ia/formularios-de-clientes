import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest, NextResponse } from "next/server";
import type { AdminRole } from "@/lib/adminData";
import { mutateAdminData, readAdminData } from "@/lib/adminData";

const scrypt = promisify(scryptCallback);
export const ADMIN_COOKIE = "crisdal_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 12;
const SESSION_VERSION = "v3";
const LEGACY_SESSION_VERSION = "v2";

export type AdminSession = {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  source: "environment" | "user";
};

type SessionPayload = AdminSession & { expires: number };

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "crisdalagency@gmail.com").trim().toLowerCase();
}

export function getAdminUsername() {
  return (process.env.ADMIN_USERNAME || "crisdal").trim().toLowerCase();
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("Configura ADMIN_SESSION_SECRET o SUPABASE_SERVICE_ROLE_KEY con al menos 32 caracteres.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `s1:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [version, salt, expected] = encoded.split(":");
  if (version !== "s1" || !salt || !expected) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return safeEqual(derived.toString("hex"), expected);
}

export async function verifyAdminCredentials(username: string, password: string): Promise<AdminSession | null> {
  const normalized = username.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (configuredPassword && configuredPassword.length >= 12) {
    const matchesOwner = safeEqual(normalized, getAdminUsername()) && safeEqual(password, configuredPassword);
    if (matchesOwner) {
      return {
        id: "environment-owner",
        username: getAdminUsername(),
        displayName: "Crisdal Agency",
        role: "owner",
        source: "environment",
      };
    }
  }

  const data = await readAdminData();
  const user = data.users.find((item) => item.username === normalized && item.active);
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;

  const loggedAt = new Date().toISOString();
  await mutateAdminData((current) => {
    const stored = current.users.find((item) => item.id === user.id);
    if (stored) {
      stored.last_login_at = loggedAt;
      stored.updated_at = loggedAt;
    }
  });

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    source: "user",
  };
}

export function createSessionToken(session: AdminSession) {
  const payload: SessionPayload = {
    ...session,
    expires: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsigned = `${SESSION_VERSION}.${encoded}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function readAdminSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [version, payloadRaw, signature] = token.split(".");

  if (version === LEGACY_SESSION_VERSION) {
    const expires = Number(payloadRaw);
    if (!expires || expires < Math.floor(Date.now() / 1000) || !signature) return null;
    const expected = sign(`${LEGACY_SESSION_VERSION}.${getAdminUsername()}.${expires}`);
    if (!safeEqual(signature, expected)) return null;
    return {
      id: "environment-owner",
      username: getAdminUsername(),
      displayName: "Crisdal Agency",
      role: "owner",
      source: "environment",
    };
  }

  if (version !== SESSION_VERSION || !payloadRaw || !signature) return null;
  const unsigned = `${version}.${payloadRaw}`;
  if (!safeEqual(signature, sign(unsigned))) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadRaw, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.id || !payload.username || !payload.role || payload.expires < Math.floor(Date.now() / 1000)) return null;
    const { expires: _expires, ...session } = payload;
    void _expires;
    return session;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined) {
  return Boolean(readAdminSession(token));
}

function canAccessPath(session: AdminSession, pathname: string) {
  if (session.role === "owner") return true;
  if (pathname.startsWith("/api/admin/users")) return false;
  if (session.role === "admin") return true;
  if (session.role === "editor") {
    return !pathname.startsWith("/api/admin/allies") &&
      !pathname.startsWith("/api/admin/loyalty") &&
      !pathname.startsWith("/api/admin/finance");
  }
  return pathname.startsWith("/api/admin/calendar") || pathname.startsWith("/api/admin/auth/");
}

export function adminSessionFromRequest(request: NextRequest) {
  return readAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export function isAdminRequest(request: NextRequest, requireSameOrigin = false) {
  const session = adminSessionFromRequest(request);
  if (!session || !canAccessPath(session, request.nextUrl.pathname)) return false;
  if (!requireSameOrigin) return true;
  const origin = request.headers.get("origin");
  return Boolean(origin && (origin === request.nextUrl.origin || origin === process.env.NEXT_PUBLIC_SITE_URL));
}

export function setAdminCookie(response: NextResponse, session: AdminSession) {
  response.cookies.set(ADMIN_COOKIE, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
