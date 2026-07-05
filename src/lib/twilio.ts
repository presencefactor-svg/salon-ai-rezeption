type TwilioSendInput = {
  channel: 'SMS' | 'WHATSAPP';
  to: string;
  body: string;
};

function missing(name: string) {
  return { provider: 'twilio', ok: false, status: 0, body: `Missing ${name}` };
}

function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  return `+${trimmed.replace(/\D/g, '')}`;
}

export async function sendTwilioMessage(input: TwilioSendInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromSms = process.env.TWILIO_SMS_FROM;
  const fromWhatsapp = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid) return missing('TWILIO_ACCOUNT_SID');
  if (!authToken) return missing('TWILIO_AUTH_TOKEN');
  const from = input.channel === 'WHATSAPP' ? fromWhatsapp : fromSms;
  if (!from) return missing(input.channel === 'WHATSAPP' ? 'TWILIO_WHATSAPP_FROM' : 'TWILIO_SMS_FROM');
  const to = normalizePhone(input.to);
  if (!to) return { provider: 'twilio', ok: false, status: 0, body: 'Missing destination phone' };

  const twilioTo = input.channel === 'WHATSAPP' ? `whatsapp:${to}` : to;
  const twilioFrom = input.channel === 'WHATSAPP' && !from.startsWith('whatsapp:') ? `whatsapp:${normalizePhone(from)}` : from;
  const body = new URLSearchParams({ To: twilioTo, From: twilioFrom, Body: input.body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return { provider: 'twilio', channel: input.channel, ok: res.ok, status: res.status, body: await res.text().catch(() => '') };
}
