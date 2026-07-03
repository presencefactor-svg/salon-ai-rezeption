import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { createBookingRaceSafe, SlotUnavailableError, type BookingRepository } from '../src/lib/availability/booking';
import type { AvailabilityInput } from '../src/lib/availability/types';

class MemoryRepo implements BookingRepository {
  appointments: AvailabilityInput['existingAppointments'] = [];
  locks: string[] = [];
  async transaction<T>(fn: (tx: BookingRepository) => Promise<T>): Promise<T> { return fn(this); }
  async lockStaffDay(_salonId: string, staffId: string, dayKey: string) { this.locks.push(`${staffId}:${dayKey}`); }
  async listAppointmentsForAvailability({ staffId }: { salonId: string; staffId: string; fromUtc: Date; toUtc: Date }) { return this.appointments.filter((a) => a.staffId === staffId); }
  async createAppointment(data: { staffId: string; startUtc: Date; endUtc: Date }) {
    const id = `a${this.appointments.length + 1}`;
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

describe('race-safe booking', () => {
  it('revalidates inside transaction and rejects second booking for same slot', async () => {
    const repo = new MemoryRepo();
    const startUtc = fromZonedTime('2026-07-06T10:00:00', tz);
    await expect(createBookingRaceSafe(repo, availability, { salonId: 's1', customerId: 'c1', serviceId: 'cut', staffId: 'anna', startUtc })).resolves.toEqual({ id: 'a1' });
    await expect(createBookingRaceSafe(repo, availability, { salonId: 's1', customerId: 'c2', serviceId: 'cut', staffId: 'anna', startUtc })).rejects.toBeInstanceOf(SlotUnavailableError);
    expect(repo.appointments).toHaveLength(1);
    expect(repo.locks).toEqual(['anna:2026-07-06', 'anna:2026-07-06']);
  });
});
