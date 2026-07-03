import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encryptPlaintext } from '@/lib/gdpr/crypto';

const DEMO_SALON_ID = 'demo-salon';

async function getSalonId() {
  const salon = await prisma.salon.findFirst({ orderBy: { createdAt: 'asc' } });
  return salon?.id ?? DEMO_SALON_ID;
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

    if (body.action === 'createAppointment') {
      const service = await prisma.service.findFirst({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } });
      const staff = await prisma.staff.findFirst({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } });
      if (!service || !staff) throw new Error('Bitte zuerst Leistung und Team-Mitglied anlegen.');
      const startUtc = body.startUtc ? new Date(body.startUtc) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endUtc = new Date(startUtc.getTime() + service.durationMinutes * 60 * 1000);
      const customer = await prisma.customer.create({ data: { salonId, nameEncrypted: encryptPlaintext(String(body.customerName || 'Kundin')), whatsappEncrypted: encryptPlaintext(String(body.phone || '+491000000000')) } });
      const appointment = await prisma.appointment.create({ data: { salonId, customerId: customer.id, serviceId: service.id, staffId: staff.id, startUtc, endUtc, source: 'MANUAL' }, include: { service: true, staff: true } });
      return NextResponse.json({ ok: true, appointment });
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
