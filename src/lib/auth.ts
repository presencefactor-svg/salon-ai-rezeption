import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'salon_session';
const ADMIN_COOKIE_NAME = 'salon_admin_session';

type Session = { userId: string; salonId: string; role: 'OWNER' | 'STAFF'; email: string };

function secret() {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-secret-change-me';
}

function sign(value: string) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function encode(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode<T>(token?: string | null): T | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (sign(body) !== sig) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T; } catch { return null; }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('base64url');
  return `pbkdf2:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string | null) {
  if (!stored) return false;
  const [, salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('base64url');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

function parseCookieHeader(header: string | null) {
  return Object.fromEntries((header || '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function makeSessionCookie(session: Session) {
  return `${COOKIE_NAME}=${encode(session)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionFromRequest(request: Request): Session | null {
  return decode<Session>(parseCookieHeader(request.headers.get('cookie'))[COOKIE_NAME]);
}

export async function getSessionFromCookies(): Promise<Session | null> {
  const store = await cookies();
  return decode<Session>(store.get(COOKIE_NAME)?.value);
}

export function makeAdminCookie() {
  return `${ADMIN_COOKIE_NAME}=${encode({ admin: true, at: Date.now() })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}`;
}

export function clearAdminCookie() {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAdminRequest(request: Request) {
  const payload = decode<{ admin: boolean }>(parseCookieHeader(request.headers.get('cookie'))[ADMIN_COOKIE_NAME]);
  return payload?.admin === true;
}
