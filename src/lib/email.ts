export async function sendWelcomeEmail(input: { to: string; salonName: string }) {
  const from = process.env.MAIL_FROM || 'Salon AI Rezeption <noreply@salon-ai-rezeption.vercel.app>';
  const subject = 'Willkommen bei Salon AI Rezeption';
  const html = `<p>Hallo,</p><p>Ihr Salon <b>${input.salonName}</b> wurde angelegt.</p><p>Sie können jetzt Ihr Dashboard konfigurieren: <a href="https://salon-ai-rezeption.vercel.app/dashboard">Dashboard öffnen</a></p><p>Viele Grüße<br/>Salon AI Rezeption</p>`;

  if (process.env.BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({ sender: parseSender(from), to: [{ email: input.to }], subject, htmlContent: html }),
    });
    return { provider: 'brevo', ok: res.ok, status: res.status, body: await res.text().catch(() => '') };
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from, to: input.to, subject, html }),
    });
    return { provider: 'resend', ok: res.ok, status: res.status, body: await res.text().catch(() => '') };
  }

  return { provider: 'none', ok: false, status: 0, body: 'No BREVO_API_KEY or RESEND_API_KEY configured' };
}

function parseSender(from: string) {
  const match = from.match(/^(.*)<(.+)>$/);
  if (!match) return { email: from };
  return { name: match[1].trim(), email: match[2].trim() };
}
