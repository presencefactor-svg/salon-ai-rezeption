import { NextResponse } from 'next/server';
import { handleDemoInbound } from '@/lib/demo-agent';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_TEST_ENDPOINT !== 'true') {
    return NextResponse.json({ ok: false, error: 'Disabled in production. Set ENABLE_DEMO_TEST_ENDPOINT=true to use.' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await handleDemoInbound({
    from: String(body.from || '491700000000'),
    text: String(body.text || 'Hallo! Ich möchte einen Termin buchen'),
    metaMessageId: body.metaMessageId ? String(body.metaMessageId) : `test_${crypto.randomUUID()}`,
  });
  return NextResponse.json({ ok: true, result });
}
