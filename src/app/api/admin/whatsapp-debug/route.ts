import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

function redact(value: unknown) {
  if (typeof value !== 'string') return value;
  if (value.length < 8) return value ? '[SET]' : '[EMPTY]';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export async function GET() {
  const demo = await prisma.salon.findUnique({
    where: { id: 'salon-aurora-demo' },
    select: { id: true, name: true, isDemo: true, phoneNumberId: true, channelMode: true },
  }).catch((error) => ({ error: error instanceof Error ? error.message : 'DB error' }));
  const rawLatest = await prisma.rawWebhookPayload.findFirst({ orderBy: { createdAt: 'desc' }, select: { externalEventId: true, createdAt: true, salonId: true, payload: true } }).catch(() => null);
  const latestAudit = await prisma.auditLog.findFirst({ where: { action: 'demo_whatsapp_send' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, metadata: true } }).catch(() => null);
  return NextResponse.json({
    ok: true,
    env: {
      DEMO_WHATSAPP_NUMBER: redact(process.env.DEMO_WHATSAPP_NUMBER || ''),
      DEMO_META_PHONE_NUMBER_ID: redact(process.env.DEMO_META_PHONE_NUMBER_ID || ''),
      DEMO_META_ACCESS_TOKEN: process.env.DEMO_META_ACCESS_TOKEN ? '[SET]' : '[MISSING]',
      META_WEBHOOK_VERIFY_TOKEN: process.env.META_WEBHOOK_VERIFY_TOKEN ? '[SET]' : '[MISSING]',
    },
    demo,
    latestWebhook: rawLatest,
    latestSendAudit: latestAudit,
  });
}
