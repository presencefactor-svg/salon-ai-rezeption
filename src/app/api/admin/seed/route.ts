import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encryptPlaintext } from '@/lib/gdpr/crypto';

async function seedDemo() {
  const salon = await prisma.salon.upsert({
    where: { id: 'demo-salon' },
    update: { name: 'Salon Demo GmbH', address: 'Prenzlauer Allee 1, 10405 Berlin' },
    create: {
      id: 'demo-salon',
      name: 'Salon Demo GmbH',
      address: 'Prenzlauer Allee 1, 10405 Berlin',
      timezone: 'Europe/Berlin',
      locale: 'de-DE',
      tonePreference: 'SIE',
    },
  });

  await prisma.openingHours.createMany({
    data: [1, 2, 3, 4, 5].map((weekday) => ({ salonId: salon.id, weekday, openTime: '09:00', closeTime: '18:00' })),
    skipDuplicates: true,
  });

  const anna = await prisma.staff.upsert({
    where: { id: 'demo-anna' },
    update: {},
    create: { id: 'demo-anna', salonId: salon.id, displayName: 'Anna', workingHours: [{ weekday: 1, ranges: [{ start: '09:00', end: '17:00' }] }] },
  });
  const lea = await prisma.staff.upsert({
    where: { id: 'demo-lea' },
    update: {},
    create: { id: 'demo-lea', salonId: salon.id, displayName: 'Lea', workingHours: [{ weekday: 1, ranges: [{ start: '12:00', end: '20:00' }] }] },
  });

  const cut = await prisma.service.upsert({
    where: { id: 'demo-cut' },
    update: {},
    create: { id: 'demo-cut', salonId: salon.id, name: 'Damenhaarschnitt', durationMinutes: 60, priceEurCents: 5900, bufferMinutes: 15, staff: { connect: [{ id: anna.id }, { id: lea.id }] } },
  });
  await prisma.service.upsert({
    where: { id: 'demo-balayage' },
    update: {},
    create: { id: 'demo-balayage', salonId: salon.id, name: 'Balayage', durationMinutes: 180, priceEurCents: 18900, bufferMinutes: 20, staff: { connect: [{ id: lea.id }] } },
  });

  const customer = await prisma.customer.upsert({
    where: { id: 'demo-customer' },
    update: {},
    create: { id: 'demo-customer', salonId: salon.id, nameEncrypted: encryptPlaintext('Mara König'), whatsappEncrypted: encryptPlaintext('+491****4567'), consentTimestamp: new Date() },
  });

  await prisma.conversation.upsert({
    where: { id: 'demo-conversation' },
    update: { lastActivity: new Date(), windowExpiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000) },
    create: { id: 'demo-conversation', salonId: salon.id, customerId: customer.id, lastActivity: new Date(), windowExpiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000) },
  });

  await prisma.messageTemplate.createMany({
    data: ['termin_erinnerung', 'warteliste_angebot', 'buchung_bestaetigung_followup'].map((name) => ({ salonId: salon.id, name })),
    skipDuplicates: true,
  });

  return { salonId: salon.id, serviceId: cut.id, staff: [anna.displayName, lea.displayName] };
}

export async function POST(request: Request) {
  const token = request.headers.get('x-seed-token');
  if (process.env.SEED_TOKEN && token !== process.env.SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await seedDemo();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_PUBLIC_SETUP === 'true') {
    return NextResponse.json({ error: 'Public setup disabled' }, { status: 403 });
  }
  try {
    const result = await seedDemo();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
