import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleDemoInbound } from '@/lib/demo-agent';

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
  const message = value?.messages?.[0];
  const messageId = message?.id as string | undefined;
  const eventId = messageId ?? `evt_${crypto.randomUUID()}`;
  let salon = phoneNumberId ? await prisma.salon.findFirst({ where: { phoneNumberId } }) : null;
  if (!salon && phoneNumberId && phoneNumberId === process.env.DEMO_META_PHONE_NUMBER_ID) {
    salon = await prisma.salon.findUnique({ where: { id: 'salon-aurora-demo' } });
  }
  await prisma.rawWebhookPayload.upsert({
    where: { externalEventId: eventId },
    create: { externalEventId: eventId, salonId: salon?.id, payload },
    update: { payload, salonId: salon?.id },
  });

  if (salon?.isDemo && message?.type === 'text') {
    const result = await handleDemoInbound({ from: String(message.from || ''), text: String(message.text?.body || ''), metaMessageId: messageId });
    return NextResponse.json({ ok: true, queued: false, demo: true, reply: result?.reply });
  }

  return NextResponse.json({ ok: true, queued: true });
}
