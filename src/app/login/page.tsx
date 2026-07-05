'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Login fehlgeschlagen');
      router.push('/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Fehler'); } finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-[#fffaf3] p-5"><section className="card mx-auto mt-10 max-w-md p-6"><h1 className="text-3xl font-black">Login</h1>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<form onSubmit={submit} className="mt-6 grid gap-3"><input className="input" type="email" placeholder="E-Mail" value={email} onChange={(e)=>setEmail(e.target.value)}/><input className="input" type="password" placeholder="Passwort" value={password} onChange={(e)=>setPassword(e.target.value)}/><button className="btn" disabled={loading}>{loading ? 'Einloggen…' : 'Einloggen'}</button></form><p className="mt-4 text-sm">Noch kein Konto? <a className="font-bold underline" href="/register">Registrieren</a></p></section></main>;
}
