const nav = ['Kalender', 'Posteingang', 'Leistungen & Preise', 'Team', 'Öffnungszeiten', 'Assistent-Einstellungen', 'Statistiken', 'Abo & Rechnung'];
const services = ['Damenhaarschnitt · 60 Min · 59 €', 'Balayage · 180 Min · 189 €', 'Föhnen · 30 Min · 29 €'];
const conversations = ['Mara K. · KI · 24h offen', 'Sabine L. · HUMAN · 3h offen', 'Julia P. · KI · Vorlage nötig'];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[250px_1fr]">
        <aside className="card p-4">
          <h1 className="text-xl font-black">Salon Demo GmbH</h1>
          <p className="text-sm text-neutral-600">Berlin · Europe/Berlin · Sie</p>
          <nav className="mt-6 grid gap-2">{nav.map((n) => <a className="rounded-xl px-3 py-2 hover:bg-amber-50" href={`#${n}`} key={n}>{n}</a>)}</nav>
          <div className="mt-6 rounded-xl bg-amber-100 p-3 text-sm"><b>Vorlagen in Prüfung…</b><br/>INBOUND_ONLY aktiv: Erinnerungen und Warteliste starten nach Meta-Freigabe.</div>
        </aside>
        <section className="grid gap-4">
          <div id="Kalender" className="card p-5">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-black">Kalender</h2><button className="btn">Termin anlegen</button></div>
            <div className="mt-4 grid gap-2 md:grid-cols-5">{['09:00 Frei','10:00 Damenhaarschnitt · Anna','11:30 Balayage · Lea','14:00 Frei','16:00 Föhnen · Anna'].map((s) => <div className="rounded-xl border p-4" key={s}>{s}</div>)}</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div id="Posteingang" className="card p-5"><h2 className="text-2xl font-black">Posteingang</h2><ul className="mt-4 space-y-2">{conversations.map((c) => <li className="rounded-xl border p-3" key={c}>{c}<button className="float-right font-bold">Übernehmen</button></li>)}</ul><textarea className="input mt-4 w-full" placeholder="Manuelle Antwort…" /></div>
            <div id="Leistungen & Preise" className="card p-5"><h2 className="text-2xl font-black">Leistungen & Preise</h2><ul className="mt-4 space-y-2">{services.map((s) => <li className="rounded-xl border p-3" key={s}>{s}</li>)}</ul></div>
          </div>
          <div id="Assistent-Einstellungen" className="card p-5"><h2 className="text-2xl font-black">Assistent-Einstellungen</h2><p className="mt-2 text-neutral-700">KI aktiv · Tonalität: Sie · Eskalation bei Beschwerden, Preisverhandlungen, medizinischen Fragen und unbekannten Leistungen.</p></div>
        </section>
      </div>
    </main>
  );
}
