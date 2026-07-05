import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'Admin login required' }, { status: 401 });
  const [salons, totals, subscriptions] = await Promise.all([
    prisma.salon.findMany({ orderBy: { createdAt: 'desc' }, include: { users: { select: { email: true, role: true, createdAt: true } }, services: { select: { id: true } }, staff: { select: { id: true } }, appointments: { select: { id: true } } } }),
    prisma.$transaction([prisma.salon.count(), prisma.user.count(), prisma.appointment.count(), prisma.conversation.count()]),
    prisma.salon.groupBy({ by: ['subscriptionStatus'], _count: { _all: true } }),
  ]);
  return NextResponse.json({ ok: true, totals: { salons: totals[0], users: totals[1], appointments: totals[2], conversations: totals[3] }, subscriptions, salons });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'Admin login required' }, { status: 401 });
  const body = await request.json();
  if (body.action === 'updateSubscription') {
    const salon = await prisma.salon.update({ where: { id: String(body.salonId) }, data: { subscriptionStatus: body.subscriptionStatus } });
    return NextResponse.json({ ok: true, salon });
  }
  if (body.action === 'toggleAi') {
    const salon = await prisma.salon.update({ where: { id: String(body.salonId) }, data: { aiEnabled: Boolean(body.aiEnabled) } });
    return NextResponse.json({ ok: true, salon });
  }
  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
