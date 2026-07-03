import type { LLMProvider } from '../llm/provider';
import { buildGermanAgentSystemPrompt } from './system-prompt';

export async function runAgentTurn(input: { llm: LLMProvider; salonName: string; tone: 'SIE' | 'DU'; privacyUrl: string; messages: { role: 'user' | 'assistant'; content: string }[] }) {
  return input.llm.chat({
    messages: [
      { role: 'system', content: buildGermanAgentSystemPrompt(input) },
      ...input.messages,
    ],
    tools: [
      { name: 'get_services', description: 'Leistungen mit Dauer und Preis abrufen', parameters: { type: 'object', properties: {} } },
      { name: 'check_availability', description: 'Freie Slots berechnen, maximal 3-5 Vorschläge', parameters: { type: 'object', properties: { service_id: { type: 'string' }, date_range: { type: 'string' }, staff_id: { type: 'string' } }, required: ['service_id', 'date_range'] } },
      { name: 'create_booking', description: 'Termin nach finaler Bestätigung transaktional buchen', parameters: { type: 'object', properties: { service_id: { type: 'string' }, slot: { type: 'string' }, staff_id: { type: 'string' } }, required: ['service_id', 'slot'] } },
      { name: 'escalate_to_human', description: 'An Salonteam übergeben', parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
    ],
  });
}
