import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encryptPlaintext } from '@/lib/gdpr/crypto';
import { DEMO_SALON_ID, demoSignupUrl, demoWhatsAppNumber, nextDemoSlots } from '@/lib/demo-whatsapp';

const services = [
  ['aurora-damen', 'Damenhaarschnitt', 60, 4500, 10],
  ['aurora-herren', 'Herrenhaarschnitt', 35, 2800, 5],
  ['aurora-balayage', 'Balayage', 180, 14000, 20],
  ['aurora-foehnen', 'Föhnen', 30, 2500, 5],
  ['aurora-glossing', 'Glossing', 45, 4900, 10],
] as const;

async function seedAurora() {
  const salon = await prisma.salon.upsert({
    where: { id: DEMO_SALON_ID },
    update: {
      name: 'Salon Aurora',
      address: 'Kollwitzstraße 44, 10405 Berlin',
      isDemo: true,
      demoSignupUrl: demoSignupUrl(),
      phoneNumberId: process.env.DEMO_META_PHONE_NUMBER_ID || null,
      channelMode: 'INBOUND_ONLY',
    },
    create: {
      id: DEMO_SALON_ID,
      name: 'Salon Aurora',
      address: 'Kollwitzstraße 44, 10405 Berlin',
      timezone: 'Europe/Berlin',
      locale: 'de-DE',
      tonePreference: 'SIE',
      isDemo: true,
      demoSignupUrl: demoSignupUrl(),
      phoneNumberId: process.env.DEMO_META_PHONE_NUMBER_ID || null,
      channelMode: 'INBOUND_ONLY',
      greetingText: 'Hallo! Ich bin die digitale Assistentin von Salon Aurora — das ist ein Demo-Salon von Salon AI Rezeption.',
    },
  });

  await prisma.openingHours.createMany({
    data: [1, 2, 3, 4, 5].map((weekday) => ({ salonId: salon.id, weekday, openTime: '09:00', closeTime: '18:00' })),
    skipDuplicates: true,
  });

  const mia = await prisma.staff.upsert({ where: { id: 'aurora-mia' }, update: { active: true }, create: { id: 'aurora-mia', salonId: salon.id, displayName: 'Mia', workingHours: [{ weekday: 1, ranges: [{ start: '09:00', end: '17:00' }] }] } });
  const noah = await prisma.staff.upsert({ where: { id: 'aurora-noah' }, update: { active: true }, create: { id: 'aurora-noah', salonId: salon.id, displayName: 'Noah', workingHours: [{ weekday: 1, ranges: [{ start: '10:00', end: '18:00' }] }] } });

  const createdServices = [];
  for (const [id, name, durationMinutes, priceEurCents, bufferMinutes] of services) {
    const service = await prisma.service.upsert({
      where: { id },
      update: { name, durationMinutes, priceEurCents, bufferMinutes, active: true },
      create: { id, salonId: salon.id, name, durationMinutes, priceEurCents, bufferMinutes, staff: { connect: [{ id: mia.id }, { id: noah.id }] } },
    });
    createdServices.push(service);
  }

  await prisma.appointment.deleteMany({ where: { salonId: salon.id, source: 'DEMO', createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  const takenSlots = nextDemoSlots(6).filter((_, index) => index % 2 === 0);
  for (let i = 0; i < takenSlots.length; i += 1) {
    const start = new Date(takenSlots[i]);
    const service = createdServices[i % createdServices.length];
    const customer = await prisma.customer.upsert({
      where: { id: `aurora-seed-customer-${i}` },
      update: {},
      create: { id: `aurora-seed-customer-${i}`, salonId: salon.id, nameEncrypted: encryptPlaintext(['Lena', 'Sofia', 'Mara'][i] || 'Demo'), whatsappEncrypted: encryptPlaintext(`+49170demo${i}`), consentTimestamp: new Date() },
    });
    await prisma.appointment.upsert({
      where: { id: `aurora-seed-appt-${i}` },
      update: { startUtc: start, endUtc: new Date(start.getTime() + service.durationMinutes * 60000), status: 'CONFIRMED' },
      create: { id: `aurora-seed-appt-${i}`, salonId: salon.id, customerId: customer.id, serviceId: service.id, staffId: i % 2 ? noah.id : mia.id, startUtc: start, endUtc: new Date(start.getTime() + service.durationMinutes * 60000), source: 'DEMO' },
    });
  }

  await prisma.demoAnalyticsEvent.create({ data: { type: 'demo_seeded', salonId: salon.id, metadata: { whatsapp: demoWhatsAppNumber() } } });
  return { salonId: salon.id, name: salon.name, whatsapp: demoWhatsAppNumber(), services: createdServices.length };
}

export async function POST() {
  try { return NextResponse.json({ ok: true, ...(await seedAurora()) }); } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 }); }
}

export async function GET() { return POST(); }
