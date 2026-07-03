export async function sendWhatsAppText(input: { phoneNumberId?: string | null; accessToken?: string | null; to: string; body: string }) {
  const phoneNumberId = input.phoneNumberId || process.env.DEMO_META_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;
  const accessToken = input.accessToken || process.env.DEMO_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return { ok: false, skipped: true, reason: 'Missing DEMO_META_PHONE_NUMBER_ID/DEMO_META_ACCESS_TOKEN or META_* env vars' };
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to.replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: true, body: input.body },
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, error: json };
  return { ok: true, status: res.status, data: json };
}
