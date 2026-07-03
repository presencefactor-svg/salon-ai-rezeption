'use client';

import { useState } from 'react';
import { demoServices } from '@/lib/demo-data';

export default function Home() {
  const [salonName, setSalonName] = useState('Salon Demo GmbH');
  const [service, setService] = useState(demoServices[0].name);
  const selected = demoServices.find((s) => s.name === service) ?? demoServices[0];
  return (
    <main className="min-h-screen p-6 md:p-10">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="card overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_.9fr]">
            <div className="p-8 md:p-12">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-700">Salon AI Rezeption</p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">24/7 WhatsApp-KI-Rezeption für Friseursalons.</h1>
              <p className="mt-5 max-w-2xl text-lg text-neutral-700">Beantwortet Kundenanfragen auf Deutsch, bucht Termine, verschickt Erinnerungen und füllt abgesagte Slots — direkt im WhatsApp-Posteingang Ihres Salons.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a className="btn text-center" href="/dashboard">Demo-Dashboard öffnen</a>
                <a className="rounded-xl border border-neutral-300 px-4 py-3 text-center font-bold" href="/datenschutz">Datenschutz ansehen</a>
              </div>
            </div>
            <div className="bg-neutral-950 p-6 text-white md:p-10">
              <h2 className="text-2xl font-black">Schnelltest</h2>
              <p className="mt-1 text-neutral-300">Konfiguration ändern und Beispielantwort sehen.</p>
              <label className="mt-5 block text-sm font-bold">Salonname</label>
              <input className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-3" value={salonName} onChange={(e) => setSalonName(e.target.value)} />
              <label className="mt-4 block text-sm font-bold">Leistung</label>
              <select className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-3" value={service} onChange={(e) => setService(e.target.value)}>
                {demoServices.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
              <div className="mt-5 rounded-2xl bg-white p-4 text-neutral-950">
                <p className="text-sm font-bold text-emerald-700">WhatsApp Antwort</p>
                <p className="mt-2">Hallo, ich bin die digitale Assistentin von {salonName}. Für {selected.name} ({selected.durationMinutes} Min., {selected.priceEur} €) habe ich heute 14:00, 15:30 oder 17:00 Uhr frei. Welche Uhrzeit passt Ihnen?</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[["Buchungen diesen Monat", "128"], ["Davon durch KI", "74"], ["Nach Feierabend", "31"], ["Umsatz zurückgewonnen", "2.170 €"]].map(([label, value]) => <div className="card p-5" key={label}><div className="text-2xl font-black">{value}</div><div className="text-sm text-neutral-600">{label}</div></div>)}
        </div>
      </section>
    </main>
  );
}
