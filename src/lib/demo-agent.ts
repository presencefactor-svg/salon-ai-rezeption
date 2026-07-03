import { prisma } from '@/lib/db/prisma';
import { encryptPlaintext } from '@/lib/gdpr/crypto';
import { DEMO_SALON_ID, demoSignupUrl, nextDemoSlots } from '@/lib/demo-whatsapp';
import { sendWhatsAppText } from '@/lib/whatsapp-cloud';

function lower(text: string) { return text.toLowerCase(); }

export async function handleDemoInbound(input: { from: string; text: string; metaMessageId?: string }) {
  const salon = await prisma.salon.findUnique({ where: { id: DEMO_SALON_ID }, include: { services: true, staff: true } });
  if (!salon) return null;

  const customerId = `aurora-customer-${input.from.replace(/\D/g, '')}`;
  const customer = await prisma.customer.upsert({
    where: { id: customerId },
    update: { consentTimestamp: new Date() },
    create: { id: customerId, salonId: salon.id, nameEncrypted: encryptPlaintext('WhatsApp Demo'), whatsappEncrypted: encryptPlaintext(input.from), consentTimestamp: new Date() },
  });

  const existing = await prisma.conversation.findFirst({ where: { salonId: salon.id, customerId: customer.id }, orderBy: { lastActivity: 'desc' } });
  const reset = !existing || Date.now() - existing.lastActivity.getTime() > 2 * 60 * 60 * 1000;
  const conversation = reset ? await prisma.conversation.create({ data: { salonId: salon.id, customerId: customer.id, lastActivity: new Date(), windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), demoMessageCount: 1 } }) : await prisma.conversation.update({ where: { id: existing.id }, data: { lastActivity: new Date(), windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), demoMessageCount: { increment: 1 } } });

  if (conversation.demoMessageCount > 30) return { conversation, reply: 'Danke! Für heute ist die Demo-Nutzung für diese Nummer begrenzt. Bitte versuchen Sie es morgen erneut.' };

  await prisma.message.create({ data: { salonId: salon.id, conversationId: conversation.id, direction: 'INBOUND', bodyEncrypted: encryptPlaintext(input.text), metaMessageId: input.metaMessageId } }).catch(() => null);
  if (reset) await prisma.demoAnalyticsEvent.create({ data: { type: 'demo_conversation_started', salonId: salon.id } }).catch(() => null);

  const text = lower(input.text);
  const services = salon.services.filter((s) => s.active);
  const service = services.find((s) => text.includes(s.name.toLowerCase().split(' ')[0])) || services[0];
  let reply = '';

  if (/preis|kost|€|eur/.test(text)) {
    reply = `Gerne. ${services.slice(0, 5).map((s) => `${s.name}: ${(s.priceEurCents / 100).toFixed(0)} €`).join(', ')}. Möchten Sie einen Termin buchen?`;
  } else if (/storno|absag|cancel/.test(text)) {
    reply = 'Kein Problem — in dieser Demo würde ich den Termin stornieren. Im echten Salon wird der Kalender sofort aktualisiert.';
  } else if (/mensch|team|mitarbeiter|beschwer|medizin|haut/.test(text)) {
    reply = 'Das gebe ich gern ans Team weiter. In der echten App würde ich jetzt auf menschliche Übernahme stellen.';
  } else if (/buch|termin|frei|zeit|morgen|heute|samstag|montag|dienstag|mittwoch|donnerstag|freitag/.test(text)) {
    const slots = nextDemoSlots(3).map((iso) => new Date(iso));
    if (/ja|passt|ok|okay|nehmen|bestätig/.test(text)) {
      const staff = salon.staff.find((s) => s.active) || salon.staff[0];
      const start = slots[0];
      const appt = await prisma.appointment.create({ data: { salonId: salon.id, customerId: customer.id, serviceId: service.id, staffId: staff.id, startUtc: start, endUtc: new Date(start.getTime() + service.durationMinutes * 60000), source: 'DEMO' } });
      await prisma.demoAnalyticsEvent.create({ data: { type: 'demo_booking_completed', salonId: salon.id, metadata: { appointmentId: appt.id } } }).catch(() => null);
      reply = `Perfekt, Ihr Demo-Termin für ${service.name} ist gebucht: ${start.toLocaleString('de-DE')} bei ${staff.displayName}. So einfach ist das. 🙂 Möchten Sie das für Ihren eigenen Salon? 14 Tage kostenlos testen: ${demoSignupUrl()}`;
      await prisma.conversation.update({ where: { id: conversation.id }, data: { demoFollowupSent: true } });
      await prisma.demoAnalyticsEvent.create({ data: { type: 'demo_followup_sent', salonId: salon.id } }).catch(() => null);
    } else {
      reply = `Hallo! Ich bin die digitale Assistentin von Salon Aurora — das ist ein Demo-Salon von Salon AI Rezeption. Für ${service.name} kann ich anbieten: ${slots.map((s) => s.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })).join(' oder ')}. Welche Zeit passt Ihnen?`;
    }
  } else if (/idiot|spam|fuck|schei/.test(text)) {
    reply = 'Ich helfe hier nur mit der Salon-Demo weiter. Wenn Sie einen Termin testen möchten, schreiben Sie gern kurz die gewünschte Leistung.';
  } else {
    reply = `Hallo! Ich bin die digitale Assistentin von Salon Aurora — das ist ein Demo-Salon von Salon AI Rezeption. Schreiben Sie mir einfach, als wären Sie Kundin oder Kunde. 💇‍♀️ Zum Beispiel: „Was kostet Balayage?“ oder „Ich möchte einen Termin buchen“. `;
  }

  await prisma.message.create({ data: { salonId: salon.id, conversationId: conversation.id, direction: 'OUTBOUND', bodyEncrypted: encryptPlaintext(reply) } });
  const sendResult = await sendWhatsAppText({ phoneNumberId: salon.phoneNumberId, accessToken: process.env.DEMO_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN, to: input.from, body: reply });
  await prisma.auditLog.create({ data: { salonId: salon.id, actorType: 'SYSTEM', action: 'demo_whatsapp_send', entityType: 'Conversation', entityId: conversation.id, metadata: sendResult } }).catch(() => null);
  return { conversation, reply, sendResult };
}
