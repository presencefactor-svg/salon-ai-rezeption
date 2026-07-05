import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encryptPlaintext } from '@/lib/gdpr/crypto';
import { notifyOwnerBooking } from '@/lib/notifications';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get('salonId') || '';
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon || salon.isDemo) return NextResponse.json({ ok: false, error: 'Salon nicht gefunden' }, { status: 404 });
  const [services, staff, openingHours] = await Promise.all([
    prisma.service.findMany({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } }),
    prisma.staff.findMany({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } }),
    prisma.openingHours.findMany({ where: { salonId }, orderBy: { weekday: 'asc' } }),
  ]);
  return NextResponse.json({ ok: true, salon: { id: salon.id, name: salon.name, greetingText: salon.greetingText, tonePreference: salon.tonePreference, whatsappPhone: salon.whatsappPhone }, services, staff, openingHours });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const salonId = String(body.salonId || '');
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) throw new Error('Salon nicht gefunden.');
    const service = await prisma.service.findFirst({ where: { id: String(body.serviceId || ''), salonId, active: true } });
    const staff = body.staffId ? await prisma.staff.findFirst({ where: { id: String(body.staffId), salonId, active: true } }) : await prisma.staff.findFirst({ where: { salonId, active: true }, orderBy: { createdAt: 'asc' } });
    if (!service || !staff) throw new Error('Leistung oder Team nicht gefunden.');
    const startUtc = new Date(String(body.startLocal || body.startUtc));
    if (Number.isNaN(startUtc.getTime())) throw new Error('Bitte Datum und Uhrzeit wählen.');
    const endUtc = addMinutes(startUtc, service.durationMinutes);
    const weekday = startUtc.getDay();
    const hours = await prisma.openingHours.findUnique({ where: { salonId_weekday: { salonId, weekday } } });
    if (!hours || hours.isClosed) throw new Error('Salon ist an diesem Tag geschlossen.');
    const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (hm(startUtc) < hours.openTime || hm(endUtc) > hours.closeTime) throw new Error(`Termin liegt außerhalb der Öffnungszeiten (${hours.openTime}–${hours.closeTime}).`);
    const overlap = await prisma.appointment.findFirst({ where: { salonId, staffId: staff.id, status: 'CONFIRMED', startUtc: { lt: endUtc }, endUtc: { gt: startUtc } } });
    if (overlap) throw new Error('Dieser Slot ist leider bereits belegt. Bitte eine andere Uhrzeit wählen.');
    const customer = await prisma.customer.create({ data: { salonId, nameEncrypted: encryptPlaintext(String(body.customerName || 'Kundin')), whatsappEncrypted: encryptPlaintext(String(body.customerContact || '')), consentTimestamp: new Date() } });
    const appointment = await prisma.appointment.create({ data: { salonId, customerId: customer.id, serviceId: service.id, staffId: staff.id, startUtc, endUtc, source: 'AI' }, include: { service: true, staff: true } });
    const notification = await notifyOwnerBooking({ salonId, appointmentId: appointment.id }).catch((error) => ({ ok: false, error: error instanceof Error ? error.message : 'notification_error' }));
    return NextResponse.json({ ok: true, appointment, notification });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Buchung fehlgeschlagen' }, { status: 400 });
  }
}
