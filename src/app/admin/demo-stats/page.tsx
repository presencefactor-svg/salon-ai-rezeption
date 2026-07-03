import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function DemoStatsPage() {
  const [events, conversations, bookings] = await Promise.all([
    prisma.demoAnalyticsEvent.groupBy({ by: ['type'], _count: { _all: true } }).catch(() => []),
    prisma.conversation.count({ where: { salon: { isDemo: true } } }).catch(() => 0),
    prisma.appointment.count({ where: { salon: { isDemo: true }, source: 'DEMO' } }).catch(() => 0),
  ]);
  const map = Object.fromEntries(events.map((e) => [e.type, e._count._all]));
  const cards = [
    ['Demo-Konversationen', String(map.demo_conversation_started || conversations || 0)],
    ['Demo-Buchungen', String(map.demo_booking_completed || bookings || 0)],
    ['Follow-up gesendet', String(map.demo_followup_sent || 0)],
    ['Signup-Klicks', String(map.signup_click || 0)],
  ];
  return (
    <main className="min-h-screen bg-[#fffaf3] p-6 md:p-10">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">Demo Funnel Stats</h1>
        <p className="mt-2 text-neutral-600">Privacy-friendly aggregate counters für Salon Aurora.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{cards.map(([label, value]) => <div className="card p-5" key={label}><div className="text-3xl font-black">{value}</div><div className="text-sm text-neutral-600">{label}</div></div>)}</div>
        <a className="btn mt-6 inline-block" href="/">Homepage öffnen</a>
      </section>
    </main>
  );
}
