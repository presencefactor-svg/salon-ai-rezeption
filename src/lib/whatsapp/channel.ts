export type WhatsAppSendMode = 'FREE_FORM' | 'TEMPLATE' | 'BLOCKED';

export function decideSendMode(now: Date, windowExpiresAt: Date | null | undefined, templateApproved: boolean): WhatsAppSendMode {
  if (windowExpiresAt && now <= windowExpiresAt) return 'FREE_FORM';
  if (templateApproved) return 'TEMPLATE';
  return 'BLOCKED';
}

export async function createUtilityTemplates(_salonId: string) {
  return ['termin_erinnerung', 'warteliste_angebot', 'buchung_bestaetigung_followup'].map((name) => ({ name, approvalStatus: 'PENDING' as const }));
}
