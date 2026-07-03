import * as QRCode from 'qrcode';

export const DEMO_SALON_ID = 'salon-aurora-demo';

export function demoWhatsAppNumber() {
  return (process.env.DEMO_WHATSAPP_NUMBER || '447451285419').replace(/\D/g, '');
}

export function demoSignupUrl() {
  return process.env.DEMO_SIGNUP_URL || '/api/demo/signup-click';
}

export function demoWaText() {
  return 'Hallo! Ich möchte einen Termin buchen';
}

export function demoWaLink() {
  return `https://wa.me/${demoWhatsAppNumber()}?text=${encodeURIComponent(demoWaText())}`;
}

export async function demoQrDataUrl() {
  return QRCode.toDataURL(demoWaLink(), { margin: 1, width: 520, color: { dark: '#111827', light: '#fffaf3' } });
}

export function nextDemoSlots(count = 4) {
  const slots: string[] = [];
  const now = new Date();
  for (let i = 1; slots.length < count && i <= 14; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    for (const hour of [10, 14, 16]) {
      if (slots.length >= count) break;
      const slot = new Date(d);
      slot.setHours(hour, hour === 16 ? 30 : 0, 0, 0);
      slots.push(slot.toISOString());
    }
  }
  return slots;
}
