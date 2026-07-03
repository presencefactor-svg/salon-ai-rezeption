export const pricingPlans = [
  { key: 'solo', name: 'Solo', monthlyEur: 39, staffLimit: 1, features: ['KI-Rezeption', 'Erinnerungen'] },
  { key: 'salon', name: 'Salon', monthlyEur: 69, staffLimit: 5, features: ['Warteliste', 'Statistiken'] },
  { key: 'salon-plus', name: 'Salon Plus', monthlyEur: 99, staffLimit: null, features: ['Unbegrenztes Team', 'Priority Support'] },
] as const;

export function trialDays() { return 14; }
