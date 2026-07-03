import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { runAgentTurn } from '../src/lib/agent/runtime';
import type { LLMProvider } from '../src/lib/llm/provider';
import { createBookingRaceSafe, type BookingRepository } from '../src/lib/availability/booking';
import type { AvailabilityInput } from '../src/lib/availability/types';

class BookingLLM implements LLMProvider {
  async chat() {
    return { toolCalls: [{ name: 'create_booking', arguments: { service_id: 'cut', staff_id: 'anna', slot: '2026-07-06T10:00:00+02:00' } }] };
  }
}

class MemoryRepo implements BookingRepository {
  appointments: AvailabilityInput['existingAppointments'] = [];
  async transaction<T>(fn: (tx: BookingRepository) => Promise<T>): Promise<T> { return fn(this); }
  async lockStaffDay() {}
  async listAppointmentsForAvailability() { return this.appointments; }
  async createAppointment(data: { staffId: string; startUtc: Date; endUtc: Date }) {
    const id = 'booked-1';
    this.appointments.push({ id, staffId: data.staffId, startUtc: data.startUtc, endUtc: data.endUtc, status: 'CONFIRMED' });
    return { id };
  }
  async audit() {}
}

const tz = 'Europe/Berlin';
const availability: Omit<AvailabilityInput, 'existingAppointments'> = {
  timezone: tz,
  openingHours: [{ weekday: 1, openTime: '09:00', closeTime: '18:00' }],
  closedDates: [],
  staff: [{ id: 'anna', displayName: 'Anna', active: true, workingHours: [{ weekday: 1, ranges: [{ start: '09:00', end: '18:00' }] }] }],
  service: { id: 'cut', name: 'Damenhaarschnitt', durationMinutes: 60, bufferMinutes: 15, staffIds: ['anna'] },
  rangeStartUtc: fromZonedTime('2026-07-06T00:00:00', tz),
  rangeEndUtc: fromZonedTime('2026-07-06T23:59:00', tz),
};

describe('webhook -> agent -> booking happy path', () => {
  it('mocked LLM proposes a booking tool call and backend validates/creates it', async () => {
    const llm = new BookingLLM();
    const repo = new MemoryRepo();
    const response = await runAgentTurn({
      llm,
      salonName: 'Salon Demo GmbH',
      tone: 'SIE',
      privacyUrl: 'https://example.test/datenschutz',
      messages: [{ role: 'user', content: 'Ich bestätige den Termin am Montag um 10 Uhr.' }],
    });
    expect(response.toolCalls?.[0]?.name).toBe('create_booking');
    const args = response.toolCalls![0].arguments;
    const booking = await createBookingRaceSafe(repo, availability, {
      salonId: 'demo-salon',
      customerId: 'customer-1',
      serviceId: String(args.service_id),
      staffId: String(args.staff_id),
      startUtc: fromZonedTime('2026-07-06T10:00:00', tz),
    });
    expect(booking).toEqual({ id: 'booked-1' });
    expect(repo.appointments).toHaveLength(1);
  });
});
