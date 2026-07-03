const stats = [
  ['Buchungen diesen Monat', '128'],
  ['Davon durch KI', '74'],
  ['Nach Feierabend', '31'],
  ['Zurückgewonnener Umsatz', '2.170 €'],
];

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="card p-8 md:p-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-700">Salon AI Rezeption</p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">24/7 WhatsApp-KI-Rezeption für Friseursalons.</h1>
          <p className="mt-5 max-w-2xl text-lg text-neutral-700">Beantwortet Kundenanfragen auf Deutsch, bucht Termine, verschickt Erinnerungen und füllt abgesagte Slots — direkt im WhatsApp-Posteingang Ihres Salons.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="btn text-center" href="/dashboard">Demo-Dashboard öffnen</a>
            <a className="rounded-xl border border-neutral-300 px-4 py-3 text-center font-bold" href="/datenschutz">Datenschutz ansehen</a>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map(([label, value]) => <div className="card p-5" key={label}><div className="text-2xl font-black">{value}</div><div className="text-sm text-neutral-600">{label}</div></div>)}
        </div>
      </section>
    </main>
  );
}
