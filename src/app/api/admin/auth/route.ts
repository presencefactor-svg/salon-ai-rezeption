import { NextResponse } from 'next/server';
import { makeAdminCookie, clearAdminCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');
  const expected = process.env.ADMIN_PASSWORD || process.env.SEED_TOKEN || '';
  if (!expected || password !== expected) return NextResponse.json({ ok: false, error: 'Admin Passwort falsch oder ADMIN_PASSWORD fehlt.' }, { status: 401 });
  return NextResponse.json({ ok: true }, { headers: { 'Set-Cookie': makeAdminCookie() } });
}

export async function DELETE() {
  return NextResponse.json({ ok: true }, { headers: { 'Set-Cookie': clearAdminCookie() } });
}
