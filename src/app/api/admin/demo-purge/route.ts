import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const demoSalons = await prisma.salon.findMany({ where: { isDemo: true }, select: { id: true } });
  const salonIds = demoSalons.map((s) => s.id);
  const conversations = await prisma.conversation.findMany({ where: { salonId: { in: salonIds }, lastActivity: { lt: cutoff } }, select: { id: true, customerId: true } });
  const conversationIds = conversations.map((c) => c.id);
  const customerIds = Array.from(new Set(conversations.map((c) => c.customerId)));
  const [messages, appointments, deletedConversations, customers] = await Promise.all([
    prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } }),
    prisma.appointment.deleteMany({ where: { salonId: { in: salonIds }, source: 'DEMO', createdAt: { lt: cutoff } } }),
    prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } }),
    prisma.customer.deleteMany({ where: { id: { in: customerIds } } }),
  ]);
  return NextResponse.json({ ok: true, messages: messages.count, appointments: appointments.count, conversations: deletedConversations.count, customers: customers.count });
}

export async function GET() { return POST(); }
