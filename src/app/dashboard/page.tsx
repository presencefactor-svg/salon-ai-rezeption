'use client';

import { useMemo, useState } from 'react';
import { demoConversations, demoServices, demoSlots, demoStaff, pricing } from '@/lib/demo-data';

type Tone = 'SIE' | 'DU';
type ChannelMode = 'INBOUND_ONLY' | 'FULL';

function money(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export default function DashboardPage() {
  const [step, setStep] = useState(1);
  const [salonName, setSalonName] = useState('Salon Demo GmbH');
  const [tone, setTone] = useState<Tone>('SIE');
  const [channelMode, setChannelMode] = useState<ChannelMode>('INBOUND_ONLY');
  const [selectedConversation, setSelectedConversation] = useState(demoConversations[0]);
  const [aiPaused, setAiPaused] = useState(selectedConversation.mode === 'HUMAN');
  const [manualReply, setManualReply] = useState('');
  const [testService, setTestService] = useState('Damenhaarschnitt');
  const [testAnswer, setTestAnswer] = useState('');

  const avgPrice = useMemo(() => Math.round(demoServices.reduce((sum, s) => sum + s.priceEur, 0) / demoServices.length), []);
  const recovered = 31 * avgPrice;

  function simulateAi() {
    const service = demoServices.find((s) => s.name === testService) ?? demoServices[0];
    const address = tone === 'SIE' ? 'Ihnen' : 'dir';
    setTestAnswer(`Hallo, ich bin die digitale Assistentin von ${salonName}. Nachrichten werden zur Terminverwaltung verarbeitet. Für ${service.name} (${service.durationMinutes} Min., ${money(service.priceEur)}) kann ich ${address} heute 14:00, 15:30 oder 17:00 Uhr anbieten. Welche Uhrzeit passt?`);
  }

  function chooseConversation(id: string) {
    const conversation = demoConversations.find((c) => c.id === id) ?? demoConversations[0];
    setSelectedConversation(conversation);
    setAiPaused(conversation.mode === 'HUMAN');
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="card p-4 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-auto">
          <div className="rounded-2xl bg-neutral-950 p-4 text-white">
            <p className="text-xs uppercase tracking-widest text-amber-300">MVP Demo</p>
            <h1 className="mt-1 text-2xl font-black">{salonName}</h1>
            <p className="text-sm text-neutral-300">Berlin · Europe/Berlin · {tone === 'SIE' ? 'Sie' : 'du'}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <b>{channelMode === 'FULL' ? 'FULL Modus aktiv' : 'Vorlagen in Prüfung…'}</b><br />
            {channelMode === 'FULL' ? 'Erinnerungen und Warteliste sind freigeschaltet.' : 'AI antwortet inbound im 24h-Fenster. Reminder/Warteliste sind gesperrt.'}
          </div>

          <nav className="mt-4 grid gap-2 text-sm font-bold">
            {['Onboarding', 'Kalender', 'Posteingang', 'Leistungen', 'Team', 'Öffnungszeiten', 'Assistent', 'Statistiken', 'Abo'].map((item) => (
              <a className="rounded-xl px-3 py-2 hover:bg-white" href={`#${item}`} key={item}>{item}</a>
            ))}
          </nav>
        </aside>

        <section className="grid gap-4">
          <div id="Onboarding" className="card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-amber-700">Onboarding Wizard</p>
                <h2 className="text-3xl font-black">Salon konfigurieren und testen</h2>
              </div>
              <div className="flex gap-2">{[1, 2, 3, 4, 5, 6].map((n) => <button onClick={() => setStep(n)} className={`h-9 w-9 rounded-full font-black ${step === n ? 'bg-neutral-950 text-white' : 'bg-neutral-100'}`} key={n}>{n}</button>)}</div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <label className="text-sm font-bold">Salonname</label>
                <input className="input mt-2 w-full" value={salonName} onChange={(e) => setSalonName(e.target.value)} />
                <label className="mt-4 block text-sm font-bold">Tonalität</label>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setTone('SIE')} className={`rounded-xl px-4 py-2 font-bold ${tone === 'SIE' ? 'bg-neutral-950 text-white' : 'bg-neutral-100'}`}>Sie</button>
                  <button onClick={() => setTone('DU')} className={`rounded-xl px-4 py-2 font-bold ${tone === 'DU' ? 'bg-neutral-950 text-white' : 'bg-neutral-100'}`}>du</button>
                </div>
                <label className="mt-4 block text-sm font-bold">WhatsApp Kanalmodus</label>
                <select className="input mt-2 w-full" value={channelMode} onChange={(e) => setChannelMode(e.target.value as ChannelMode)}>
                  <option value="INBOUND_ONLY">INBOUND_ONLY — Vorlagen in Prüfung</option>
                  <option value="FULL">FULL — Vorlagen freigegeben</option>
                </select>
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-black">WhatsApp verbinden</h3>
                <p className="mt-2 text-sm text-neutral-600">Meta Embedded Signup Platzhalter: bestehende Nummer migrieren oder neue dedizierte Nummer registrieren.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button className="rounded-xl border p-3 text-left"><b>Bestehende Nummer</b><br /><span className="text-sm text-neutral-600">Kunden kennen sie bereits; WhatsApp App wird deaktiviert.</span></button>
                  <button className="rounded-xl border p-3 text-left"><b>Neue Nummer</b><br /><span className="text-sm text-neutral-600">Dediziert für KI-Rezeption, Verifikation per Anruf/SMS.</span></button>
                </div>
                <button className="btn mt-4 w-full" onClick={() => setStep(Math.min(6, step + 1))}>Weiter</button>
              </div>
            </div>
          </div>

          <div id="Kalender" className="card p-5">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-black">Kalender</h2><button className="btn">Termin manuell anlegen</button></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {demoSlots.map((slot) => {
                const staff = demoStaff.find((s) => s.id === slot.staffId)!;
                return <div className={`rounded-2xl border p-4 ${slot.service ? staff.color : 'bg-white'}`} key={`${slot.time}-${slot.staffId}`}><div className="flex justify-between font-black"><span>{slot.time}</span><span>{staff.name}</span></div>{slot.service ? <p className="mt-2">{slot.service}<br /><span className="text-sm text-neutral-600">{slot.customer}</span></p> : <p className="mt-2 text-emerald-700">Frei — per KI buchbar</p>}</div>;
              })}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <div id="Posteingang" className="card p-5">
              <h2 className="text-2xl font-black">Posteingang</h2>
              <div className="mt-4 grid gap-2">
                {demoConversations.map((c) => <button onClick={() => chooseConversation(c.id)} className={`rounded-2xl border p-3 text-left ${selectedConversation.id === c.id ? 'border-neutral-950 bg-white' : 'bg-neutral-50'}`} key={c.id}><div className="flex justify-between"><b>{c.name}</b><span className="text-xs font-bold">{c.mode}</span></div><p className="text-xs text-neutral-500">{c.phone} · {c.window}</p><p className="mt-1 text-sm">{c.preview}</p></button>)}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-black">{selectedConversation.name}</h2><p className="text-sm text-neutral-600">24h-Fenster: {selectedConversation.window}</p></div><button onClick={() => setAiPaused(!aiPaused)} className={`rounded-xl px-4 py-2 font-bold ${aiPaused ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>{aiPaused ? 'KI wieder aktivieren' : 'Übernehmen'}</button></div>
              <div className="mt-4 grid gap-3 rounded-2xl bg-neutral-50 p-4">
                {selectedConversation.messages.map(([dir, body], i) => <div className={`max-w-[85%] rounded-2xl p-3 ${dir === 'out' ? 'ml-auto bg-neutral-950 text-white' : 'bg-white'}`} key={i}>{body}</div>)}
              </div>
              <div className="mt-4 flex gap-2"><input className="input flex-1" value={manualReply} onChange={(e) => setManualReply(e.target.value)} placeholder={aiPaused ? 'Manuelle Antwort schreiben…' : 'KI aktiv — zuerst übernehmen'} /><button className="btn" disabled={!aiPaused || !manualReply}>Senden</button></div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div id="Leistungen" className="card p-5"><h2 className="text-2xl font-black">Leistungen & Preise</h2><div className="mt-4 grid gap-2">{demoServices.map((s) => <div className="rounded-2xl border p-3" key={s.id}><b>{s.name}</b><br /><span className="text-sm text-neutral-600">{s.durationMinutes} Min · {money(s.priceEur)} · Puffer {s.bufferMinutes} Min</span></div>)}</div></div>
            <div id="Assistent" className="card p-5"><h2 className="text-2xl font-black">KI-Testgespräch</h2><p className="mt-1 text-sm text-neutral-600">Simuliert die erste WhatsApp-Antwort mit aktueller Konfiguration.</p><select className="input mt-4 w-full" value={testService} onChange={(e) => setTestService(e.target.value)}>{demoServices.map((s) => <option key={s.id}>{s.name}</option>)}</select><button className="btn mt-3" onClick={simulateAi}>KI-Antwort simulieren</button>{testAnswer && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-950">{testAnswer}</div>}</div>
          </div>

          <div id="Statistiken" className="grid gap-4 md:grid-cols-4">
            {[['Buchungen diesen Monat', '128'], ['Durch KI erstellt', '74'], ['Nach Feierabend', '31'], ['Zurückgewonnener Umsatz', money(recovered)]].map(([label, value]) => <div className="card p-5" key={label}><div className="text-3xl font-black">{value}</div><div className="text-sm text-neutral-600">{label}</div></div>)}
          </div>

          <div id="Abo" className="card p-5"><h2 className="text-2xl font-black">Abo & Rechnung</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{pricing.map((p) => <div className="rounded-2xl border p-4" key={p.name}><b>{p.name}</b><div className="text-3xl font-black">{p.price}</div><p className="text-sm text-neutral-600">{p.detail}</p></div>)}</div></div>
        </section>
      </div>
    </main>
  );
}
