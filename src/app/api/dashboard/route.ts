import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encryptPlaintext } from '@/lib/gdpr/crypto';

const DEMO_SALON_ID = 'demo-salon';

async function getSalonId() {
  const salon = await prisma.salon.findFirst({ orderBy: { createdAt: 'asc' } });
  return salon?.id ?? DEMO_SALON_ID;
}

function minutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function weekdaySundayZero(date: Date) {
  return date.getDay();
}

async function assertInsideOpeningHours(salonId: string, startUtc: Date, endUtc: Date) {
  const day = weekdaySundayZero(startUtc);
  const rule = await prisma.openingHours.findUnique({ where: { salonId_weekday: { salonId, weekday: day } } });
  if (!rule || rule.isClosed) throw new Error('Salon ist an diesem Tag geschlossen.');
  const start = startUtc.getHours() * 60 + startUtc.getMinutes();
  const end = endUtc.getHours() * 60 + endUtc.getMinutes();
  if (start < minutes(rule.openTime) || end > minutes(rule.closeTime)) {
    throw new Error(`Termin liegt außerhalb der Öffnungszeiten (${rule.openTime}–${rule.closeTime}).`);
  }
}

export async function GET() {
  try {
    const salonId = await getSalonId();
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) return NextResponse.json({ ok: false, error: 'Salon not found. Open /setup and run steps 1-2.' }, { status: 404 });

    const [services, staff, openingHours, appointments, conversations, templates] = await Promise.all([
      prisma.service.findMany({ where: { salonId }, orderBy: { createdAt: 'asc' }, include: { staff: true } }),
      prisma.staff.findMany({ where: { salonId }, orderBy: { createdAt: 'asc' }, include: { services: true } }),
      prisma.openingHours.findMany({ where: { salonId }, orderBy: { weekday: 'asc' } }),
      prisma.appointment.findMany({ where: { salonId }, orderBy: { startUtc: 'asc' }, take: 20, include: { service: true, staff: true } }),
      prisma.conversation.findMany({ where: { salonId }, orderBy: { lastActivity: 'desc' }, take: 20, include: { customer: true, messages: { orderBy: { timestamp: 'asc' }, take: 20 } } }),
      prisma.messageTemplate.findMany({ where: { salonId }, orderBy: { name: 'asc' } }),
    ]);

    return NextResponse.json({ ok: true, salon, services, staff, openingHours, appointments, conversations, templates });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const salonId = await getSalonId();

    if (body.action === 'updateSalon') {
      const salon = await prisma.salon.update({
        where: { id: salonId },
        data: {
          name: String(body.name || 'Salon'),
          address: String(body.address || ''),
          tonePreference: body.tonePreference === 'DU' ? 'DU' : 'SIE',
          channelMode: body.channelMode === 'FULL' ? 'FULL' : 'INBOUND_ONLY',
          aiEnabled: Boolean(body.aiEnabled),
          greetingText: String(body.greetingText || ''),
        },
      });
      return NextResponse.json({ ok: true, salon });
    }

    if (body.action === 'updateOpeningHours') {
      const rows = Array.isArray(body.openingHours) ? body.openingHours : [];
      await Promise.all(rows.map((row: any) => prisma.openingHours.upsert({
        where: { salonId_weekday: { salonId, weekday: Number(row.weekday) } },
        update: { openTime: String(row.openTime || '09:00'), closeTime: String(row.closeTime || '18:00'), isClosed: Boolean(row.isClosed) },
        create: { salonId, weekday: Number(row.weekday), openTime: String(row.openTime || '09:00'), closeTime: String(row.closeTime || '18:00'), isClosed: Boolean(row.isClosed) },
      })));
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'createService') {
      const service = await prisma.service.create({
        data: {
          salonId,
          name: String(body.name || 'Neue Leistung'),
          durationMinutes: Number(body.durationMinutes || 60),
          priceEurCents: Math.round(Number(body.priceEur || 0) * 100),
          bufferMinutes: Number(body.bufferMinutes || 0),
        },
      });
      return NextResponse.json({ ok: true, service });
    }

    if (body.action === 'updateService') {
      const service = await prisma.service.update({
        where: { id: String(body.id) },
        data: {
          name: String(body.name || 'Leistung'),
          durationMinutes: Number(body.durationMinutes || 60),
          priceEurCents: Math.round(Number(body.priceEur || 0) * 100),
          bufferMinutes: Number(body.bufferMinutes || 0),
          active: body.active !== false,
        },
      });
      return NextResponse.json({ ok: true, service });
    }

    if (body.action === 'deleteService') {
      await prisma.service.update({ where: { id: String(body.id) }, data: { active: false } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'createStaff') {
      const staff = await prisma.staff.create({
        data: {
          salonId,
          displayName: String(body.displayName || 'Team'),
          workingHours: [{ weekday: 1, ranges: [{ start: '09:00', end: '17:00' }] }],
        },
      });
      return NextResponse.json({ ok: true, staff });
    }

    if (body.action === 'updateStaff') {
      const staff = await prisma.staff.update({
        where: { id: String(body.id) },
        data: {
          displayName: String(body.displayName || 'Team'),
          active: body.active !== false,
        },
      });
      return NextResponse.json({ ok: true, staff });
    }

    if (body.action === 'deleteStaff') {
      await prisma.staff.update({ where: { id: String(body.id) }, data: { active: false } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'createAppointment') {
      const service = await prisma.service.findFirst({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } });
      const staff = await prisma.staff.findFirst({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } });
      if (!service || !staff) throw new Error('Bitte zuerst Leistung und Team-Mitglied anlegen.');
      const startUtc = body.startLocal ? new Date(String(body.startLocal)) : body.startUtc ? new Date(body.startUtc) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endUtc = new Date(startUtc.getTime() + service.durationMinutes * 60 * 1000);
      await assertInsideOpeningHours(salonId, startUtc, endUtc);
      const customer = await prisma.customer.create({ data: { salonId, nameEncrypted: encryptPlaintext(String(body.customerName || 'Kundin')), whatsappEncrypted: encryptPlaintext(String(body.phone || '+491****0000')) } });
      const appointment = await prisma.appointment.create({ data: { salonId, customerId: customer.id, serviceId: service.id, staffId: staff.id, startUtc, endUtc, source: 'MANUAL' }, include: { service: true, staff: true } });
      return NextResponse.json({ ok: true, appointment });
    }

    if (body.action === 'updateAppointment') {
      const existing = await prisma.appointment.findFirst({ where: { id: String(body.id), salonId }, include: { service: true } });
      if (!existing) throw new Error('Termin nicht gefunden.');
      const startUtc = body.startLocal ? new Date(String(body.startLocal)) : new Date(String(body.startUtc));
      const endUtc = new Date(startUtc.getTime() + existing.service.durationMinutes * 60 * 1000);
      await assertInsideOpeningHours(salonId, startUtc, endUtc);
      const appointment = await prisma.appointment.update({ where: { id: existing.id }, data: { startUtc, endUtc }, include: { service: true, staff: true } });
      return NextResponse.json({ ok: true, appointment });
    }

    if (body.action === 'cancelAppointment') {
      await prisma.appointment.update({ where: { id: String(body.id) }, data: { status: 'CANCELLED' } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'sendManualReply') {
      const conversationId = String(body.conversationId);
      await prisma.conversation.update({ where: { id: conversationId }, data: { mode: 'HUMAN', lastActivity: new Date() } });
      const message = await prisma.message.create({ data: { salonId, conversationId, direction: 'OUTBOUND', bodyEncrypted: encryptPlaintext(String(body.message || '')) } });
      return NextResponse.json({ ok: true, message });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
