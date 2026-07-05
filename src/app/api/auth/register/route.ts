import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, makeSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

const defaultServices = [
  ['Damenhaarschnitt', 60, 4500, 10],
  ['Herrenhaarschnitt', 35, 2800, 5],
  ['Föhnen', 30, 2500, 5],
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const salonName = String(body.salonName || '').trim();
    const ownerName = String(body.ownerName || '').trim() || 'Inhaber/in';
    const whatsappPhone = String(body.whatsappPhone || '').trim();
    if (!email || !email.includes('@')) throw new Error('Bitte gültige E-Mail eingeben.');
    if (password.length < 8) throw new Error('Passwort muss mindestens 8 Zeichen haben.');
    if (!salonName) throw new Error('Bitte Salonname eingeben.');

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('Diese E-Mail ist bereits registriert.');

    const result = await prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({ data: { name: salonName, address: String(body.address || ''), whatsappPhone, notificationEmail: email, notificationPhone: whatsappPhone, notificationChannel: 'EMAIL', notificationFrequency: 'IMMEDIATE', timezone: 'Europe/Berlin', locale: 'de-DE', subscriptionStatus: 'TRIALING', greetingText: `Hallo! Ich bin die digitale Assistentin von ${salonName}.` } });
      const user = await tx.user.create({ data: { salonId: salon.id, email, passwordHash: hashPassword(password), role: 'OWNER' } });
      const staff = await tx.staff.create({ data: { salonId: salon.id, displayName: ownerName, workingHours: [{ weekday: 1, ranges: [{ start: '09:00', end: '17:00' }] }] } });
      await tx.openingHours.createMany({ data: [1,2,3,4,5].map((weekday) => ({ salonId: salon.id, weekday, openTime: '09:00', closeTime: '18:00' })), skipDuplicates: true });
      for (const [name, durationMinutes, priceEurCents, bufferMinutes] of defaultServices) {
        await tx.service.create({ data: { salonId: salon.id, name, durationMinutes, priceEurCents, bufferMinutes, staff: { connect: [{ id: staff.id }] } } });
      }
      await tx.auditLog.create({ data: { salonId: salon.id, actorType: 'USER', actorId: user.id, action: 'tenant_registered', entityType: 'Salon', entityId: salon.id, metadata: { email } } });
      return { salon, user };
    });

    const emailResult = await sendWelcomeEmail({ to: email, salonName }).catch((error) => ({ provider: 'error', ok: false, status: 0, body: error instanceof Error ? error.message : 'Email error' }));
    await prisma.auditLog.create({ data: { salonId: result.salon.id, actorType: 'SYSTEM', action: 'welcome_email', entityType: 'User', entityId: result.user.id, metadata: emailResult } }).catch(() => null);

    return NextResponse.json({ ok: true, salon: result.salon, user: { id: result.user.id, email: result.user.email, role: result.user.role }, email: emailResult }, { headers: { 'Set-Cookie': makeSessionCookie({ userId: result.user.id, salonId: result.salon.id, role: result.user.role, email: result.user.email }) } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Registrierung fehlgeschlagen' }, { status: 400 });
  }
}
