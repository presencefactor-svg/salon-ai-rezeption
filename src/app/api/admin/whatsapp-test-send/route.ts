import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendWhatsAppText } from '@/lib/whatsapp-cloud';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const to = String(body.to || '').replace(/\D/g, '');
  if (!to) return NextResponse.json({ ok: false, error: 'Missing JSON body.to, e.g. {"to":"4917..."}' }, { status: 400 });
  const salon = await prisma.salon.findUnique({ where: { id: 'salon-aurora-demo' } }).catch(() => null);
  const text = String(body.text || 'Hallo! Das ist ein direkter Test von Salon Aurora über die Meta WhatsApp Cloud API.');
  const result = await sendWhatsAppText({ phoneNumberId: salon?.phoneNumberId, accessToken: process.env.DEMO_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN, to, body: text });
  await prisma.auditLog.create({ data: { salonId: salon?.id || 'salon-aurora-demo', actorType: 'SYSTEM', action: 'manual_whatsapp_test_send', entityType: 'Debug', metadata: { to, result } } }).catch(() => null);
  return NextResponse.json({ ok: Boolean(result.ok), result });
}
