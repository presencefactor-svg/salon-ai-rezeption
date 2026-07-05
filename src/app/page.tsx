import { demoQrDataUrl, demoWaLink } from '@/lib/demo-whatsapp';

const stats = [
  ['46%', 'der Buchungen passieren außerhalb der Öffnungszeiten*'],
  ['<4%', 'No-show-Ziel mit automatischen Erinnerungen*'],
  ['6–10h', 'weniger Telefonstress pro Woche*'],
];

const prices = [
  ['Solo', '39 €', '1 Mitarbeiter, KI-Rezeption, Erinnerungen'],
  ['Salon', '69 €', 'bis 5 Mitarbeiter, Warteliste, Statistiken'],
  ['Salon Plus', '99 €', 'unbegrenztes Team, Prioritätssupport'],
];

export default async function Home() {
  const waLink = demoWaLink();
  const qr = await demoQrDataUrl();

  return (
    <main className="min-h-screen bg-[#fffaf3] text-neutral-950">
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Salon AI Rezeption</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">Ihre Rezeption schläft nie.</h1>
          <p className="mt-6 max-w-2xl text-xl text-neutral-700">Die KI beantwortet WhatsApp-Anfragen 24/7, bucht Termine, reduziert No-shows und übergibt schwierige Fälle an Ihr Team.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="btn text-center text-lg" href={waLink}>WhatsApp-Demo öffnen</a>
            <a className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-center font-black" href="/register">14 Tage kostenlos testen</a>
          </div>
          <p className="mt-4 text-sm text-neutral-600">Schreiben Sie unserer Assistentin — als wären Sie Kundin.</p>
        </div>
        <div className="card p-6 md:p-8">
          <div className="rounded-[2rem] bg-neutral-950 p-5 text-white shadow-2xl">
            <p className="text-sm font-bold text-amber-300">Live WhatsApp Demo</p>
            <div className="mt-4 hidden rounded-3xl bg-[#fffaf3] p-4 md:block"><img src={qr} alt="WhatsApp Demo QR Code" className="mx-auto w-full max-w-sm rounded-2xl" /></div>
            <a className="btn mt-4 block text-center md:hidden" href={waLink}>In WhatsApp öffnen</a>
            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-3">Kundin: Hallo! Ich möchte einen Termin buchen</div>
              <div className="rounded-2xl bg-emerald-400 p-3 text-neutral-950">Salon Aurora: Gerne. Damenhaarschnitt ist diese Woche Di 14:00 oder Mi 10:30 frei. Was passt Ihnen?</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <h2 className="text-3xl font-black">So funktioniert's</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Kundin schreibt', '„Habt ihr heute noch Zeit für Föhnen?”'],
            ['2', 'KI antwortet & prüft', '„Ja, 16:30 bei Lea wäre frei.”'],
            ['3', 'Termin steht', 'Kalender, Inbox und AuditLog werden aktualisiert.'],
          ].map(([n, t, c]) => <div className="card p-5" key={n}><div className="text-4xl font-black text-amber-700">{n}</div><h3 className="mt-3 text-xl font-black">{t}</h3><p className="mt-2 text-neutral-700">{c}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-3">{stats.map(([v, l]) => <div className="card p-6" key={v}><div className="text-5xl font-black">{v}</div><p className="mt-2 text-neutral-700">{l}</p></div>)}</div>
        <p className="mt-2 text-xs text-neutral-500">*Marketing-Richtwerte, im Produkt editierbar.</p>
      </section>

      <section id="preise" className="mx-auto max-w-7xl px-5 py-10">
        <h2 className="text-3xl font-black">Preise</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{prices.map(([name, price, text]) => <div className="card p-6" key={name}><h3 className="text-2xl font-black">{name}</h3><div className="mt-3 text-4xl font-black">{price}<span className="text-base font-bold text-neutral-500"> / Monat</span></div><p className="mt-3 text-neutral-700">{text}</p><a className="btn mt-5 block text-center" href="/register">Kostenlos testen</a></div>)}</div>
        <p className="mt-3 text-sm text-neutral-600">14 Tage kostenlos, netto zzgl. USt. / Reverse Charge nach Prüfung.</p>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <h2 className="text-3xl font-black">FAQ</h2>
        <div className="mt-6 grid gap-3">
          {[
            ['Kann ich meine bestehende WhatsApp-Nummer nutzen?', 'Ja. Alternativ können Sie eine neue dedizierte Nummer registrieren. Bei Migration läuft die Kommunikation danach über das Dashboard.'],
            ['Wo liegen die Daten?', 'EU-Region, Frankfurt geplant. DSGVO/UK GDPR Funktionen sind im Produkt angelegt.'],
            ['Was macht die KI, wenn sie etwas nicht weiß?', 'Sie erfindet nichts, sondern übergibt an Ihr Team.'],
            ['Kann ich die KI pausieren?', 'Ja, jede Unterhaltung kann im Posteingang auf HUMAN gestellt werden.'],
            ['Wie kündige ich?', 'Monatlich kündbar nach der Testphase.'],
          ].map(([q, a]) => <details className="card p-5" key={q}><summary className="cursor-pointer font-black">{q}</summary><p className="mt-3 text-neutral-700">{a}</p></details>)}
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-sm text-neutral-600"><a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a> · <a href="/admin/demo-stats">Demo Stats</a></footer>
    </main>
  );
}
