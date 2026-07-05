'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ salonName: '', ownerName: '', email: '', password: '', address: '', whatsappPhone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Registrierung fehlgeschlagen');
      router.push('/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Fehler'); } finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-[#fffaf3] p-5"><section className="card mx-auto mt-10 max-w-xl p-6"><h1 className="text-3xl font-black">Salon registrieren</h1><p className="mt-2 text-neutral-600">Erstellt einen eigenen SaaS-Tenant mit separatem Dashboard, Team, Leistungen und Kalender.</p>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<form onSubmit={submit} className="mt-6 grid gap-3"><input className="input" placeholder="Salonname" value={form.salonName} onChange={(e)=>setForm({...form,salonName:e.target.value})}/><input className="input" placeholder="Inhaber/in" value={form.ownerName} onChange={(e)=>setForm({...form,ownerName:e.target.value})}/><input className="input" placeholder="Adresse" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/><input className="input" placeholder="WhatsApp / Telefonnummer, z.B. +49..." value={form.whatsappPhone} onChange={(e)=>setForm({...form,whatsappPhone:e.target.value})}/><input className="input" type="email" placeholder="E-Mail" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/><input className="input" type="password" placeholder="Passwort, min. 8 Zeichen" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/><button className="btn" disabled={loading}>{loading ? 'Erstelle…' : 'Kostenlos starten'}</button></form><p className="mt-4 text-sm">Schon registriert? <a className="font-bold underline" href="/login">Einloggen</a></p></section></main>;
}
