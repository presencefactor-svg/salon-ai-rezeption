'use client';

import { useEffect, useMemo, useState } from 'react';

type ApiData = {
  salon: any;
  services: any[];
  staff: any[];
  openingHours: any[];
  appointments: any[];
  conversations: any[];
  templates: any[];
};

type ServiceEdit = { name: string; durationMinutes: string; priceEur: string; bufferMinutes: string; active: boolean };
type StaffEdit = { displayName: string; active: boolean };
type HoursEdit = { weekday: number; openTime: string; closeTime: string; isClosed: boolean };

function money(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);
}

async function post(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error || 'Fehler');
  return json;
}

export default function DashboardPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [serviceName, setServiceName] = useState('Glossing');
  const [price, setPrice] = useState('49');
  const [duration, setDuration] = useState('45');
  const [staffName, setStaffName] = useState('Mia');
  const [customerName, setCustomerName] = useState('Neue Kundin');
  const [appointmentLocal, setAppointmentLocal] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [manualReply, setManualReply] = useState('Gerne, wir kümmern uns darum.');
  const [aiAnswer, setAiAnswer] = useState('');
  const [notice, setNotice] = useState('');
  const [serviceEdits, setServiceEdits] = useState<Record<string, ServiceEdit>>({});
  const [staffEdits, setStaffEdits] = useState<Record<string, StaffEdit>>({});
  const [hoursEdits, setHoursEdits] = useState<HoursEdit[]>([]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Dashboard API Fehler');
      setData(json);
      setServiceEdits(Object.fromEntries(json.services.map((s: any) => [s.id, { name: s.name, durationMinutes: String(s.durationMinutes), priceEur: String(s.priceEurCents / 100), bufferMinutes: String(s.bufferMinutes), active: Boolean(s.active) }])));
      setStaffEdits(Object.fromEntries(json.staff.map((m: any) => [m.id, { displayName: m.displayName, active: Boolean(m.active) }])));
      setHoursEdits([0, 1, 2, 3, 4, 5, 6].map((weekday) => {
        const row = json.openingHours.find((h: any) => h.weekday === weekday);
        return { weekday, openTime: row?.openTime || '09:00', closeTime: row?.closeTime || '18:00', isClosed: row?.isClosed ?? (weekday === 0 || weekday === 6) };
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const appts = data?.appointments?.length || 0;
    const avg = data?.services?.length ? Math.round(data.services.reduce((s, x) => s + x.priceEurCents, 0) / data.services.length) : 0;
    return { appts, ai: Math.max(1, appts + 7), revenue: money(avg * 12) };
  }, [data]);

  async function act(label: string, fn: () => Promise<unknown>) {
    setSaving(label);
    setError('');
    setNotice('');
    try { await fn(); setNotice('Gespeichert.'); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Fehler'); } finally { setSaving(''); }
  }

  function changeService(id: string, patch: Partial<ServiceEdit>) {
    setServiceEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function changeStaff(id: string, patch: Partial<StaffEdit>) {
    setStaffEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function changeHours(weekday: number, patch: Partial<HoursEdit>) {
    setHoursEdits((prev) => prev.map((row) => row.weekday === weekday ? { ...row, ...patch } : row));
  }

  function toLocalInput(value: string | Date) {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  if (loading) return <main className="min-h-screen bg-[#faf7f2] p-8"><div className="card p-8">Lade Dashboard aus Neon…</div></main>;

  if (error && !data) return <main className="min-h-screen bg-[#faf7f2] p-8"><div className="card p-8"><h1 className="text-3xl font-black">Dashboard braucht Setup</h1><p className="mt-3 text-red-700">{error}</p><a className="btn mt-4 inline-block" href="/setup">Setup öffnen</a></div></main>;

  const salon = data!.salon;
  const firstConversation = data!.conversations?.[0];
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  function simulateAi() {
    const s = data?.services?.[0];
    const address = salon.tonePreference === 'DU' ? 'dir' : 'Ihnen';
    setAiAnswer(`Hallo, ich bin die digitale Assistentin von ${salon.name}. Nachrichten werden zur Terminverwaltung verarbeitet. Für ${s?.name || 'einen Termin'} (${s ? money(s.priceEurCents) : 'Preis laut Salon'}) kann ich ${address} heute 14:00 oder 16:30 Uhr anbieten. Passt eine dieser Zeiten?`);
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="card p-4 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
          <div className="rounded-2xl bg-neutral-950 p-4 text-white"><p className="text-xs uppercase tracking-widest text-amber-300">Live Neon Dashboard</p><h1 className="mt-1 text-2xl font-black">{salon.name}</h1><p className="text-sm text-neutral-300">{salon.timezone} · {salon.tonePreference === 'DU' ? 'du' : 'Sie'}</p></div>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"><b>Datenbank verbunden</b><br />Änderungen werden in Neon gespeichert.</div>
          <nav className="mt-4 grid gap-2 text-sm font-bold">{['Konfiguration','WhatsApp','AI-Nachrichten','Kalender','Öffnungszeiten','Posteingang','Leistungen','Team','KI-Test','Statistiken'].map((item) => <a className="rounded-xl px-3 py-2 hover:bg-white" href={`#${item}`} key={item}>{item}</a>)}</nav>
        </aside>

        <section className="grid gap-4">
          {error && <div className="rounded-2xl bg-red-50 p-4 text-red-800">{error}</div>}
          {notice && <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">{notice}</div>}

          <div id="Konfiguration" className="card p-5">
            <h2 className="text-3xl font-black">Salon konfigurieren</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <input id="salonName" className="input" defaultValue={salon.name} placeholder="Salonname" />
              <input id="address" className="input" defaultValue={salon.address || ''} placeholder="Adresse" />
              <select id="tone" className="input" defaultValue={salon.tonePreference}><option value="SIE">Sie</option><option value="DU">du</option></select>
              <select id="mode" className="input" defaultValue={salon.channelMode}><option value="INBOUND_ONLY">INBOUND_ONLY</option><option value="FULL">FULL</option></select>
            </div>
          </div>

          <div id="WhatsApp" className="card p-5">
            <h2 className="text-2xl font-black">WhatsApp verbinden</h2>
            <p className="mt-2 text-sm text-neutral-600">Trage hier den WhatsApp/Meta Anschluss des Salons ein. Die Kundennummer ist die öffentliche Nummer, die Kunden anschreiben.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <input id="phoneNumberId" className="input" defaultValue={salon.phoneNumberId || ''} placeholder="Meta phone_number_id" />
              <input id="wabaId" className="input" defaultValue={salon.wabaId || ''} placeholder="WABA ID" />
              <input id="publicWhatsapp" className="input" defaultValue={salon.whatsappPhone || ''} placeholder="Öffentliche WhatsApp Nummer, z.B. +49..." />
            </div>
            <p className="mt-2 text-xs text-neutral-500">Hinweis: Token/Embedded Signup kommt als nächster Schritt; aus Sicherheitsgründen wird der Access Token nicht im Browser angezeigt.</p>
          </div>

          <div id="AI-Nachrichten" className="card p-5">
            <h2 className="text-2xl font-black">AI-Nachrichten konfigurieren</h2>
            <p className="mt-2 text-sm text-neutral-600">Diese Texte steuern, wie die KI begrüßt, übergibt und mit Terminbuchungen arbeitet.</p>
            <label className="mt-4 block text-sm font-bold">Begrüßung / System-Ton</label>
            <textarea id="greeting" className="input mt-2 w-full" rows={4} defaultValue={salon.greetingText || ''} placeholder="Hallo! Ich bin die digitale Assistentin von ..." />
            <label className="mt-4 block text-sm font-bold">Übergabe an Mensch / Eskalation</label>
            <textarea id="escalationText" className="input mt-2 w-full" rows={3} defaultValue={salon.demoSignupUrl || ''} placeholder="Ich gebe das gerne an das Team weiter. Wir melden uns gleich." />
            <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
              <input id="replyDelaySec" className="input" type="number" min="0" defaultValue={salon.demoFollowupDelaySec || 0} placeholder="Delay Sek." />
              <label className="flex items-center gap-2 font-bold"><input id="aiEnabled" type="checkbox" defaultChecked={salon.aiEnabled !== false} /> KI aktiv</label>
            </div>
            <button className="btn mt-4" disabled={!!saving} onClick={() => act('settings', () => post('updateSalon', { name: (document.getElementById('salonName') as HTMLInputElement).value, address: (document.getElementById('address') as HTMLInputElement).value, tonePreference: (document.getElementById('tone') as HTMLSelectElement).value, channelMode: (document.getElementById('mode') as HTMLSelectElement).value, greetingText: (document.getElementById('greeting') as HTMLTextAreaElement).value, escalationText: (document.getElementById('escalationText') as HTMLTextAreaElement).value, replyDelaySec: (document.getElementById('replyDelaySec') as HTMLInputElement).value, aiEnabled: (document.getElementById('aiEnabled') as HTMLInputElement).checked, phoneNumberId: (document.getElementById('phoneNumberId') as HTMLInputElement).value, whatsappPhone: (document.getElementById('publicWhatsapp') as HTMLInputElement).value, wabaId: (document.getElementById('wabaId') as HTMLInputElement).value }))}>{saving === 'settings' ? 'Speichere…' : 'Konfiguration speichern'}</button>
          </div>

          <div id="Kalender" className="card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-black">Kalender / Termine</h2>
              <button className="btn" onClick={() => act('appointment', () => post('createAppointment', { customerName, startLocal: appointmentLocal }))}>Termin anlegen</button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_230px]">
              <input className="input min-w-0" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Kundenname" />
              <input className="input min-w-0" type="datetime-local" value={appointmentLocal} onChange={(e) => setAppointmentLocal(e.target.value)} />
            </div>
            <p className="mt-2 text-xs text-neutral-500">Wähle Datum und Uhrzeit. Termine außerhalb der Öffnungszeiten werden abgelehnt.</p>
            <div className="mt-4 grid gap-3">
              {data!.appointments.length ? data!.appointments.map((a) => (
                <div className="grid gap-2 rounded-2xl border bg-white p-4 xl:grid-cols-[220px_minmax(0,1fr)_110px_110px_100px]" key={a.id}>
                  <input className="input min-w-0" type="datetime-local" defaultValue={toLocalInput(a.startUtc)} id={`appt-${a.id}`} />
                  <p className="self-center min-w-0">{a.service?.name} · {a.staff?.displayName}<br /><span className="text-sm text-emerald-700">{a.status}</span></p>
                  <button className="btn px-3" onClick={() => act(`appt-${a.id}`, () => post('updateAppointment', { id: a.id, startLocal: (document.getElementById(`appt-${a.id}`) as HTMLInputElement).value }))}>Speichern</button>
                  <button className="rounded-xl border px-3 py-2 font-bold" onClick={() => act(`cancel-${a.id}`, () => post('cancelAppointment', { id: a.id }))}>Stornieren</button>
                  <button className="rounded-xl border border-red-300 px-3 py-2 font-bold text-red-700" onClick={() => act(`delete-${a.id}`, () => post('deleteAppointment', { id: a.id }))}>Löschen</button>
                </div>
              )) : <p className="text-neutral-600">Noch keine Termine. Button oben legt einen echten DB-Termin zum gewählten Datum an.</p>}
            </div>
          </div>

          <div id="Öffnungszeiten" className="card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-black">Öffnungszeiten</h2>
              <button className="btn" onClick={() => act('hours', () => post('updateOpeningHours', { openingHours: hoursEdits }))}>Öffnungszeiten speichern</button>
            </div>
            <div className="mt-4 grid gap-2">
              {hoursEdits.map((h) => (
                <div className="grid gap-2 rounded-2xl border p-3 md:grid-cols-[60px_120px_120px_120px]" key={h.weekday}>
                  <b className="self-center">{dayNames[h.weekday]}</b>
                  <input className="input" type="time" value={h.openTime} onChange={(e) => changeHours(h.weekday, { openTime: e.target.value })} disabled={h.isClosed} />
                  <input className="input" type="time" value={h.closeTime} onChange={(e) => changeHours(h.weekday, { closeTime: e.target.value })} disabled={h.isClosed} />
                  <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={h.isClosed} onChange={(e) => changeHours(h.weekday, { isClosed: e.target.checked })} /> geschlossen</label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <div id="Posteingang" className="card p-5"><h2 className="text-2xl font-black">Posteingang</h2><div className="mt-4 grid gap-2">{data!.conversations.map((c) => <div className="rounded-2xl border bg-white p-3" key={c.id}><b>Konversation</b><p className="text-xs text-neutral-500">{c.mode} · Fenster bis {c.windowExpiresAt ? new Date(c.windowExpiresAt).toLocaleString('de-DE') : '—'}</p></div>)}</div></div>
            <div className="card p-5"><h2 className="text-2xl font-black">Manuelle Antwort</h2><p className="text-sm text-neutral-600">Speichert echte Message in DB und setzt Gespräch auf HUMAN.</p><textarea className="input mt-3 w-full" value={manualReply} onChange={(e) => setManualReply(e.target.value)} /><button className="btn mt-3" disabled={!firstConversation || !!saving} onClick={() => act('reply', () => post('sendManualReply', { conversationId: firstConversation.id, message: manualReply }))}>Antwort speichern</button></div>
          </div>

          <div className="grid gap-4">
            <div id="Leistungen" className="card p-5">
              <h2 className="text-2xl font-black">Leistungen & Preise</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_90px_90px_auto]">
                <input className="input" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Name" />
                <input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Min" />
                <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="EUR" />
                <button className="btn" onClick={() => act('service', () => post('createService', { name: serviceName, durationMinutes: duration, priceEur: price, bufferMinutes: 10 }))}>+</button>
              </div>
              <div className="mt-4 grid gap-3">
                {data!.services.map((s) => {
                  const edit = serviceEdits[s.id] || { name: s.name, durationMinutes: String(s.durationMinutes), priceEur: String(s.priceEurCents / 100), bufferMinutes: String(s.bufferMinutes), active: Boolean(s.active) };
                  return (
                    <div className="rounded-2xl border p-3" key={s.id}>
                      <div className="grid gap-2 xl:grid-cols-[minmax(180px,1fr)_90px_90px_90px_110px_120px_100px]">
                        <input className="input min-w-0" value={edit.name} onChange={(e) => changeService(s.id, { name: e.target.value })} />
                        <input className="input min-w-0" value={edit.durationMinutes} onChange={(e) => changeService(s.id, { durationMinutes: e.target.value })} />
                        <input className="input min-w-0" value={edit.priceEur} onChange={(e) => changeService(s.id, { priceEur: e.target.value })} />
                        <input className="input min-w-0" value={edit.bufferMinutes} onChange={(e) => changeService(s.id, { bufferMinutes: e.target.value })} />
                        <button className="btn whitespace-nowrap px-3 2xl:col-auto" disabled={!!saving} onClick={() => act(`save-service-${s.id}`, () => post('updateService', { id: s.id, ...edit }))}>{saving === `save-service-${s.id}` ? 'Speichere…' : 'Speichern'}</button>
                        <button className="rounded-xl border px-3 py-2 font-bold whitespace-nowrap" disabled={!!saving} onClick={() => act(`delete-service-${s.id}`, () => post('deleteService', { id: s.id }))}>Deaktivieren</button>
                        <button className="rounded-xl border border-red-300 px-3 py-2 font-bold text-red-700 whitespace-nowrap" disabled={!!saving} onClick={() => act(`remove-service-${s.id}`, () => post('removeService', { id: s.id }))}>Löschen</button>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">Name · Minuten · Preis € · Puffer Min · Status: {s.active ? 'aktiv' : 'inaktiv'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div id="Team" className="card p-5">
              <h2 className="text-2xl font-black">Team</h2>
              <div className="mt-3 flex gap-2"><input className="input flex-1" value={staffName} onChange={(e) => setStaffName(e.target.value)} /><button className="btn" onClick={() => act('staff', () => post('createStaff', { displayName: staffName }))}>Hinzufügen</button></div>
              <div className="mt-4 grid gap-3">
                {data!.staff.map((m) => {
                  const edit = staffEdits[m.id] || { displayName: m.displayName, active: Boolean(m.active) };
                  return (
                    <div className="rounded-2xl border p-3" key={m.id}>
                      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_110px_120px_100px]">
                        <input className="input min-w-0" value={edit.displayName} onChange={(e) => changeStaff(m.id, { displayName: e.target.value })} />
                        <button className="btn whitespace-nowrap px-3" disabled={!!saving} onClick={() => act(`save-staff-${m.id}`, () => post('updateStaff', { id: m.id, ...edit }))}>{saving === `save-staff-${m.id}` ? 'Speichere…' : 'Speichern'}</button>
                        <button className="rounded-xl border px-3 py-2 font-bold whitespace-nowrap" disabled={!!saving} onClick={() => act(`delete-staff-${m.id}`, () => post('deleteStaff', { id: m.id }))}>Deaktivieren</button>
                        <button className="rounded-xl border border-red-300 px-3 py-2 font-bold text-red-700 whitespace-nowrap" disabled={!!saving} onClick={() => act(`remove-staff-${m.id}`, () => post('removeStaff', { id: m.id }))}>Löschen</button>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">Status: {m.active ? 'aktiv' : 'inaktiv'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div id="KI-Test" className="card p-5"><h2 className="text-2xl font-black">KI-Testgespräch</h2><button className="btn mt-3" onClick={simulateAi}>Antwort aus aktuellen DB-Daten simulieren</button>{aiAnswer && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-950">{aiAnswer}</div>}</div>
          <div id="Statistiken" className="grid gap-4 md:grid-cols-3">{[['Termine', String(stats.appts)], ['KI-Potenzial', String(stats.ai)], ['Umsatz-Potenzial', stats.revenue]].map(([l,v]) => <div className="card p-5" key={l}><div className="text-3xl font-black">{v}</div><div className="text-sm text-neutral-600">{l}</div></div>)}</div>
        </section>
      </div>
    </main>
  );
}
