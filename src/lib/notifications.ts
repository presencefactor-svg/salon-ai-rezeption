import { prisma } from '@/lib/db/prisma';
import { sendBookingEmail } from '@/lib/email';

export async function notifyOwnerBooking(input: { salonId: string; appointmentId: string }) {
  const appointment = await prisma.appointment.findUnique({ where: { id: input.appointmentId }, include: { salon: true, service: true, staff: true, customer: true } });
  if (!appointment) return { ok: false, reason: 'appointment_not_found' };
  const salon = appointment.salon;
  if (salon.notificationFrequency !== 'IMMEDIATE') {
    await prisma.auditLog.create({ data: { salonId: salon.id, actorType: 'SYSTEM', action: 'notification_queued_for_digest', entityType: 'Appointment', entityId: appointment.id, metadata: { frequency: salon.notificationFrequency, channel: salon.notificationChannel } } });
    return { ok: true, queued: true, frequency: salon.notificationFrequency };
  }
  const when = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: salon.timezone }).format(appointment.startUtc);
  const subject = `Neue Buchung: ${appointment.service?.name || 'Termin'} am ${when}`;
  const text = `Neue Buchung für ${salon.name}\nLeistung: ${appointment.service?.name}\nTeam: ${appointment.staff?.displayName}\nZeit: ${when}\nDashboard: https://salon-ai-rezeption.vercel.app/dashboard`;
  let result: any = { ok: false, provider: 'not_configured' };
  if (salon.notificationChannel === 'EMAIL' || salon.notificationChannel === 'BOTH') {
    result = await sendBookingEmail({ to: salon.notificationEmail || '', subject, text }).catch((error) => ({ ok: false, provider: 'email_error', body: error instanceof Error ? error.message : 'error' }));
  } else {
    result = { ok: false, provider: salon.notificationChannel.toLowerCase(), body: 'WhatsApp/Viber/SMS provider not configured yet; logged for manual follow-up.' };
  }
  await prisma.auditLog.create({ data: { salonId: salon.id, actorType: 'SYSTEM', action: 'owner_booking_notification', entityType: 'Appointment', entityId: appointment.id, metadata: { channel: salon.notificationChannel, result, phone: salon.notificationPhone } } }).catch(() => null);
  return result;
}
