import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const [salons, services, staff, conversations] = await Promise.all([
      prisma.salon.count(),
      prisma.service.count(),
      prisma.staff.count(),
      prisma.conversation.count(),
    ]);
    return NextResponse.json({ ok: true, database: 'connected', counts: { salons, services, staff, conversations } });
  } catch (error) {
    return NextResponse.json({ ok: false, database: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
