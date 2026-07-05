'use client';

import { useEffect, useState } from 'react';

type Data = { salon: any; services: any[]; staff: any[]; openingHours: any[] };

export default function PublicBookingPage({ params }: { params: { salonId: string } }) {
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState({ customerName: '', customerContact: '', serviceId: '', staffId: '', startLocal: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`/api/public/booking?salonId=${params.salonId}`).then(r=>r.json()).then(j=>{ if(j.ok){ setData(j); setForm(f=>({...f, serviceId:j.services[0]?.id||'', staffId:j.staff[0]?.id||''})); } else setMsg(j.error); }).finally(()=>setLoading(false)); }, [params.salonId]);
  async function submit(e: React.FormEvent) { e.preventDefault(); setMsg(''); const res = await fetch('/api/public/booking', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, salonId: params.salonId }) }); const json = await res.json(); if(!res.ok || !json.ok) setMsg(json.error || 'Fehler'); else setMsg('Termin ist gebucht. Der Salon wurde benachrichtigt.'); }
  if (loading) return <main className="min-h-screen bg-[#fffaf3] p-5">Lade…</main>;
  if (!data) return <main className="min-h-screen bg-[#fffaf3] p-5"><div className="card mx-auto max-w-xl p-6">{msg || 'Salon nicht gefunden'}</div></main>;
  const wa = data.salon.whatsappPhone ? `https://wa.me/${String(data.salon.whatsappPhone).replace(/\D/g,'')}` : '';
  return <main className="min-h-screen bg-[#fffaf3] p-5"><section className="card mx-auto mt-8 max-w-2xl p-6"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">AI Booking Assistant</p><h1 className="mt-2 text-4xl font-black">{data.salon.name}</h1><p className="mt-3 text-neutral-700">{data.salon.greetingText || 'Buchen Sie Ihren Termin online.'}</p>{msg && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-900">{msg}</div>}<form onSubmit={submit} className="mt-6 grid gap-3"><input className="input" placeholder="Ihr Name" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})}/><input className="input" placeholder="Telefon / WhatsApp / Email" value={form.customerContact} onChange={e=>setForm({...form,customerContact:e.target.value})}/><select className="input" value={form.serviceId} onChange={e=>setForm({...form,serviceId:e.target.value})}>{data.services.map(s=><option key={s.id} value={s.id}>{s.name} · {s.durationMinutes} Min · {(s.priceEurCents/100).toFixed(0)} €</option>)}</select><select className="input" value={form.staffId} onChange={e=>setForm({...form,staffId:e.target.value})}>{data.staff.map(s=><option key={s.id} value={s.id}>{s.displayName}</option>)}</select><input className="input" type="datetime-local" value={form.startLocal} onChange={e=>setForm({...form,startLocal:e.target.value})}/><button className="btn">Termin buchen</button></form>{wa && <a className="mt-4 block rounded-xl border bg-white px-4 py-3 text-center font-black" href={wa}>Auf WhatsApp fortsetzen</a>}</section></main>;
}
