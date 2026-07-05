import { prisma } from '@/lib/db/prisma';
import { sendBookingEmail } from '@/lib/email';
import { sendTwilioMessage } from '@/lib/twilio';

type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'EMAIL_SMS' | 'EMAIL_WHATSAPP';

function wantsEmail(channel: string) {
  return channel === 'EMAIL' || channel === 'EMAIL_SMS' || channel === 'EMAIL_WHATSAPP';
}

function wantsSms(channel: string) {
  return channel === 'SMS' || channel === 'EMAIL_SMS';
}

function wantsWhatsapp(channel: string) {
  return channel === 'WHATSAPP' || channel === 'EMAIL_WHATSAPP';
}

export async function notifyOwnerBooking(input: { salonId: string; appointmentId: string }) {
  const appointment = await prisma.appointment.findUnique({ where: { id: input.appointmentId }, include: { salon: true, service: true, staff: true, customer: true } });
  if (!appointment) return { ok: false, reason: 'appointment_not_found' };
  const salon = appointment.salon;
  const channel = (salon.notificationChannel || 'EMAIL') as NotificationChannel;
  if (salon.notificationFrequency !== 'IMMEDIATE') {
    await prisma.auditLog.create({ data: { salonId: salon.id, actorType: 'SYSTEM', action: 'notification_queued_for_digest', entityType: 'Appointment', entityId: appointment.id, metadata: { frequency: salon.notificationFrequency, channel } } });
    return { ok: true, queued: true, frequency: salon.notificationFrequency };
  }
  const when = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: salon.timezone }).format(appointment.startUtc);
  const subject = `Neue Buchung: ${appointment.service?.name || 'Termin'} am ${when}`;
  const text = `Neue Buchung für ${salon.name}\nLeistung: ${appointment.service?.name}\nTeam: ${appointment.staff?.displayName}\nZeit: ${when}\nDashboard: https://salon-ai-rezeption.vercel.app/dashboard`;
  const results: any[] = [];
  if (wantsEmail(channel)) {
    results.push(await sendBookingEmail({ to: salon.notificationEmail || '', subject, text }).catch((error) => ({ ok: false, provider: 'email_error', body: error instanceof Error ? error.message : 'error' })));
  }
  if (wantsSms(channel)) {
    results.push(await sendTwilioMessage({ channel: 'SMS', to: salon.notificationPhone || '', body: text }).catch((error) => ({ ok: false, provider: 'twilio_sms_error', body: error instanceof Error ? error.message : 'error' })));
  }
  if (wantsWhatsapp(channel)) {
    results.push(await sendTwilioMessage({ channel: 'WHATSAPP', to: salon.notificationPhone || salon.whatsappPhone || '', body: text }).catch((error) => ({ ok: false, provider: 'twilio_whatsapp_error', body: error instanceof Error ? error.message : 'error' })));
  }
  if (!results.length) results.push({ ok: false, provider: 'none', body: `Unsupported notification channel: ${channel}` });
  const result = { ok: results.some((r) => r.ok), results };
  await prisma.auditLog.create({ data: { salonId: salon.id, actorType: 'SYSTEM', action: 'owner_booking_notification', entityType: 'Appointment', entityId: appointment.id, metadata: { channel, result, phone: salon.notificationPhone } } }).catch(() => null);
  return result;
}
