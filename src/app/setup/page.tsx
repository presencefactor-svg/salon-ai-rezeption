'use client';

import { useState } from 'react';

type StepState = 'idle' | 'loading' | 'ok' | 'error';

export default function SetupPage() {
  const [initState, setInitState] = useState<StepState>('idle');
  const [seedState, setSeedState] = useState<StepState>('idle');
  const [healthState, setHealthState] = useState<StepState>('idle');
  const [message, setMessage] = useState('');

  async function call(path: string, setter: (state: StepState) => void) {
    setter('loading');
    setMessage('');
    try {
      const res = await fetch(path, { method: 'GET' });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Fehler');
      setter('ok');
      setMessage(JSON.stringify(json, null, 2));
    } catch (error) {
      setter('error');
      setMessage(error instanceof Error ? error.message : 'Unbekannter Fehler');
    }
  }

  const badge = (state: StepState) => state === 'ok' ? '✅' : state === 'loading' ? '⏳' : state === 'error' ? '❌' : '○';

  return (
    <main className="min-h-screen bg-[#faf7f2] p-6">
      <div className="card mx-auto max-w-3xl p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-700">Salon AI Rezeption</p>
        <h1 className="mt-2 text-4xl font-black">Setup & Datenbank-Test</h1>
        <p className="mt-3 text-neutral-700">Diese Seite initialisiert die Neon-Datenbank für den Demo-Test und lädt Beispieldaten. Danach Dashboard öffnen.</p>
        <div className="mt-6 grid gap-3">
          <button className="btn text-left" onClick={() => call('/api/admin/init-db', setInitState)}>{badge(initState)} 1. Datenbanktabellen anlegen</button>
          <button className="btn text-left" onClick={() => call('/api/admin/seed', setSeedState)}>{badge(seedState)} 2. Demo-Salon laden</button>
          <button className="btn text-left" onClick={() => call('/api/health/db', setHealthState)}>{badge(healthState)} 3. Datenbank prüfen</button>
        </div>
        {message && <pre className="mt-6 max-h-80 overflow-auto rounded-2xl bg-neutral-950 p-4 text-sm text-white">{message}</pre>}
        <div className="mt-6 flex gap-3">
          <a className="btn" href="/dashboard">Dashboard öffnen</a>
          <a className="rounded-xl border px-4 py-3 font-bold" href="/">Startseite</a>
        </div>
      </div>
    </main>
  );
}
