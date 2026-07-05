import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { makeSessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = await prisma.user.findUnique({ where: { email }, include: { salon: true } });
    if (!user || !verifyPassword(password, user.passwordHash)) throw new Error('E-Mail oder Passwort falsch.');
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role }, salon: user.salon }, { headers: { 'Set-Cookie': makeSessionCookie({ userId: user.id, salonId: user.salonId, role: user.role, email: user.email }) } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Login fehlgeschlagen' }, { status: 401 });
  }
}
