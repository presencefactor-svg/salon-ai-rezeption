export interface DemoService {
  id: string;
  name: string;
  durationMinutes: number;
  priceEur: number;
  bufferMinutes: number;
}

export interface DemoStaff {
  id: string;
  name: string;
  color: string;
}

export const demoServices: DemoService[] = [
  { id: 'cut', name: 'Damenhaarschnitt', durationMinutes: 60, priceEur: 59, bufferMinutes: 15 },
  { id: 'balayage', name: 'Balayage', durationMinutes: 180, priceEur: 189, bufferMinutes: 20 },
  { id: 'blowdry', name: 'Föhnen', durationMinutes: 30, priceEur: 29, bufferMinutes: 10 },
  { id: 'color', name: 'Ansatzfarbe', durationMinutes: 90, priceEur: 79, bufferMinutes: 15 },
];

export const demoStaff: DemoStaff[] = [
  { id: 'anna', name: 'Anna', color: 'bg-rose-100 border-rose-300' },
  { id: 'lea', name: 'Lea', color: 'bg-violet-100 border-violet-300' },
];

export const demoSlots = [
  { time: '09:00', staffId: 'anna', service: null },
  { time: '10:00', staffId: 'anna', service: 'Damenhaarschnitt', customer: 'Mara K.' },
  { time: '11:30', staffId: 'lea', service: 'Balayage', customer: 'Sabine L.' },
  { time: '14:00', staffId: 'anna', service: null },
  { time: '15:30', staffId: 'lea', service: 'Föhnen', customer: 'Julia P.' },
  { time: '17:00', staffId: 'anna', service: null },
];

export const demoConversations = [
  {
    id: 'c1',
    name: 'Mara König',
    phone: '+49 151 ****4567',
    mode: 'AI',
    window: '23h offen',
    preview: 'Super, dann nehme ich Montag um 10 Uhr.',
    messages: [
      ['in', 'Hallo, habt ihr Montag einen Termin für Damenhaarschnitt?'],
      ['out', 'Hallo, ich bin die digitale Assistentin von Salon Demo GmbH. Nachrichten werden zur Terminverwaltung verarbeitet. Für Damenhaarschnitt habe ich Montag 10:00, 14:00 oder 17:00 Uhr frei. Was passt Ihnen?'],
      ['in', '10 Uhr passt.'],
      ['out', 'Gerne. Ich buche Damenhaarschnitt am Montag um 10:00 Uhr bei Anna für 59 €. Soll ich das verbindlich eintragen?'],
    ],
  },
  {
    id: 'c2',
    name: 'Sabine Lehmann',
    phone: '+49 170 ****1122',
    mode: 'HUMAN',
    window: '3h offen',
    preview: 'Ich möchte mit jemandem sprechen.',
    messages: [
      ['in', 'Ich habe eine Beschwerde zum letzten Termin.'],
      ['out', 'Das gebe ich direkt an unser Team weiter. Eine Mitarbeiterin meldet sich gleich persönlich.'],
    ],
  },
  {
    id: 'c3',
    name: 'Julia Peters',
    phone: '+43 664 ****9988',
    mode: 'AI',
    window: 'Vorlage nötig',
    preview: 'Bitte erinnert mich morgen nochmal.',
    messages: [
      ['in', 'Bitte erinnert mich morgen nochmal.'],
      ['out', 'Gerne — sobald unsere WhatsApp-Vorlagen freigegeben sind, senden wir automatische Erinnerungen.'],
    ],
  },
];

export const pricing = [
  { name: 'Solo', price: '39 €', detail: '1 Mitarbeiter, KI-Rezeption, Erinnerungen' },
  { name: 'Salon', price: '69 €', detail: 'Bis 5 Mitarbeiter, Warteliste, Statistiken' },
  { name: 'Salon Plus', price: '99 €', detail: 'Unbegrenztes Team, Priority Support' },
];
