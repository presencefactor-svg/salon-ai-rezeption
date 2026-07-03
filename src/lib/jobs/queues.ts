import { Queue } from 'bullmq';
import { decideSendMode } from '../whatsapp/channel';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };
export const reminderQueue = new Queue('appointment-reminders', { connection });
export const waitlistQueue = new Queue('waitlist-offers', { connection });

export async function scheduleReminder(appointmentId: string, startUtc: Date) {
  const delay = Math.max(0, startUtc.getTime() - Date.now() - 24 * 60 * 60 * 1000);
  await reminderQueue.add('send-reminder', { appointmentId }, { delay, attempts: 5, backoff: { type: 'exponential', delay: 30_000 } });
}

export function canSendAutomation(input: { channelMode: 'INBOUND_ONLY' | 'FULL'; windowExpiresAt?: Date | null; templateApproved: boolean }) {
  if (input.channelMode !== 'FULL') return false;
  return decideSendMode(new Date(), input.windowExpiresAt, input.templateApproved) !== 'BLOCKED';
}
