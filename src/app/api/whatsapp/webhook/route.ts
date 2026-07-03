import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.get('hub.verify_token') === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(params.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId = value?.metadata?.phone_number_id as string | undefined;
  const messageId = value?.messages?.[0]?.id as string | undefined;
  const salon = phoneNumberId ? await prisma.salon.findFirst({ where: { phoneNumberId } }) : null;
  await prisma.rawWebhookPayload.upsert({
    where: { externalEventId: messageId ?? `evt_${crypto.randomUUID()}` },
    create: { externalEventId: messageId, salonId: salon?.id, payload },
    update: { payload },
  });
  return NextResponse.json({ ok: true, queued: true });
}
