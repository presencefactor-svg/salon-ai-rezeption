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
  const [manualReply, setManualReply] = useState('Gerne, wir kümmern uns darum.');
  const [aiAnswer, setAiAnswer] = useState('');
  const [notice, setNotice] = useState('');
  const [serviceEdits, setServiceEdits] = useState<Record<string, ServiceEdit>>({});
  const [staffEdits, setStaffEdits] = useState<Record<string, StaffEdit>>({});

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

  if (loading) return <main className="min-h-screen bg-[#faf7f2] p-8"><div className="card p-8">Lade Dashboard aus Neon…</div></main>;

  if (error && !data) return <main className="min-h-screen bg-[#faf7f2] p-8"><div className="card p-8"><h1 className="text-3xl font-black">Dashboard braucht Setup</h1><p className="mt-3 text-red-700">{error}</p><a className="btn mt-4 inline-block" href="/setup">Setup öffnen</a></div></main>;

  const salon = data!.salon;
  const firstConversation = data!.conversations?.[0];

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
          <nav className="mt-4 grid gap-2 text-sm font-bold">{['Konfiguration','Kalender','Posteingang','Leistungen','Team','KI-Test','Statistiken'].map((item) => <a className="rounded-xl px-3 py-2 hover:bg-white" href={`#${item}`} key={item}>{item}</a>)}</nav>
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
            <textarea id="greeting" className="input mt-3 w-full" defaultValue={salon.greetingText || ''} placeholder="Begrüßungstext" />
            <button className="btn mt-3" disabled={!!saving} onClick={() => act('settings', () => post('updateSalon', { name: (document.getElementById('salonName') as HTMLInputElement).value, address: (document.getElementById('address') as HTMLInputElement).value, tonePreference: (document.getElementById('tone') as HTMLSelectElement).value, channelMode: (document.getElementById('mode') as HTMLSelectElement).value, greetingText: (document.getElementById('greeting') as HTMLTextAreaElement).value, aiEnabled: true }))}>{saving === 'settings' ? 'Speichere…' : 'Speichern'}</button>
          </div>

          <div id="Kalender" className="card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="text-2xl font-black">Kalender / Termine</h2><button className="btn" onClick={() => act('appointment', () => post('createAppointment', { customerName }))}>Termin für {customerName} anlegen</button></div>
            <input className="input mt-3" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data!.appointments.length ? data!.appointments.map((a) => <div className="rounded-2xl border bg-white p-4" key={a.id}><b>{new Date(a.startUtc).toLocaleString('de-DE')}</b><p>{a.service?.name} · {a.staff?.displayName}</p><span className="text-sm text-emerald-700">{a.status}</span></div>) : <p className="text-neutral-600">Noch keine Termine. Button oben legt einen echten DB-Termin an.</p>}</div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <div id="Posteingang" className="card p-5"><h2 className="text-2xl font-black">Posteingang</h2><div className="mt-4 grid gap-2">{data!.conversations.map((c) => <div className="rounded-2xl border bg-white p-3" key={c.id}><b>Konversation</b><p className="text-xs text-neutral-500">{c.mode} · Fenster bis {c.windowExpiresAt ? new Date(c.windowExpiresAt).toLocaleString('de-DE') : '—'}</p></div>)}</div></div>
            <div className="card p-5"><h2 className="text-2xl font-black">Manuelle Antwort</h2><p className="text-sm text-neutral-600">Speichert echte Message in DB und setzt Gespräch auf HUMAN.</p><textarea className="input mt-3 w-full" value={manualReply} onChange={(e) => setManualReply(e.target.value)} /><button className="btn mt-3" disabled={!firstConversation || !!saving} onClick={() => act('reply', () => post('sendManualReply', { conversationId: firstConversation.id, message: manualReply }))}>Antwort speichern</button></div>
          </div>

          <div className="grid gap-4 2xl:grid-cols-2">
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
                      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_72px_72px_72px] 2xl:grid-cols-[minmax(0,1fr)_72px_72px_72px_auto_auto]">
                        <input className="input min-w-0" value={edit.name} onChange={(e) => changeService(s.id, { name: e.target.value })} />
                        <input className="input min-w-0" value={edit.durationMinutes} onChange={(e) => changeService(s.id, { durationMinutes: e.target.value })} />
                        <input className="input min-w-0" value={edit.priceEur} onChange={(e) => changeService(s.id, { priceEur: e.target.value })} />
                        <input className="input min-w-0" value={edit.bufferMinutes} onChange={(e) => changeService(s.id, { bufferMinutes: e.target.value })} />
                        <button className="btn whitespace-nowrap px-3 2xl:col-auto" disabled={!!saving} onClick={() => act(`save-service-${s.id}`, () => post('updateService', { id: s.id, ...edit }))}>{saving === `save-service-${s.id}` ? 'Speichere…' : 'Speichern'}</button>
                        <button className="rounded-xl border px-3 py-2 font-bold whitespace-nowrap" disabled={!!saving} onClick={() => act(`delete-service-${s.id}`, () => post('deleteService', { id: s.id }))}>Deaktivieren</button>
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
                      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <input className="input min-w-0" value={edit.displayName} onChange={(e) => changeStaff(m.id, { displayName: e.target.value })} />
                        <button className="btn whitespace-nowrap px-3" disabled={!!saving} onClick={() => act(`save-staff-${m.id}`, () => post('updateStaff', { id: m.id, ...edit }))}>{saving === `save-staff-${m.id}` ? 'Speichere…' : 'Speichern'}</button>
                        <button className="rounded-xl border px-3 py-2 font-bold whitespace-nowrap" disabled={!!saving} onClick={() => act(`delete-staff-${m.id}`, () => post('deleteStaff', { id: m.id }))}>Deaktivieren</button>
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
