import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { computeAvailability } from '../src/lib/availability/engine';
import type { AvailabilityInput } from '../src/lib/availability/types';

const tz = 'Europe/Berlin';
const base: Omit<AvailabilityInput, 'rangeStartUtc' | 'rangeEndUtc'> = {
  timezone: tz,
  openingHours: [
    { weekday: 1, openTime: '09:00', closeTime: '18:00' },
    { weekday: 2, openTime: '09:00', closeTime: '18:00' },
    { weekday: 3, openTime: '09:00', closeTime: '18:00' },
    { weekday: 4, openTime: '09:00', closeTime: '18:00' },
    { weekday: 5, openTime: '09:00', closeTime: '18:00' },
    { weekday: 6, openTime: '10:00', closeTime: '14:00' },
  ],
  closedDates: [],
  staff: [
    { id: 'anna', displayName: 'Anna', active: true, workingHours: [{ weekday: 1, ranges: [{ start: '10:00', end: '16:00' }] }] },
    { id: 'lea', displayName: 'Lea', active: true, workingHours: [{ weekday: 1, ranges: [{ start: '12:00', end: '18:00' }] }] },
  ],
  service: { id: 'cut', name: 'Damenhaarschnitt', durationMinutes: 60, bufferMinutes: 15, staffIds: ['anna', 'lea'] },
  existingAppointments: [],
};

describe('availability engine', () => {
  it('intersects salon opening hours, staff hours, service duration and max suggestions', () => {
    const slots = computeAvailability({
      ...base,
      rangeStartUtc: fromZonedTime('2026-07-06T00:00:00', tz),
      rangeEndUtc: fromZonedTime('2026-07-06T23:59:00', tz),
      maxSuggestions: 3,
    });
    expect(slots.map((s) => `${s.staffId} ${s.localDate} ${s.localStart}-${s.localEnd}`)).toEqual([
      'anna 2026-07-06 10:00-11:00',
      'anna 2026-07-06 10:15-11:15',
      'anna 2026-07-06 10:30-11:30',
    ]);
  });

  it('blocks existing appointments including buffer time', () => {
    const slots = computeAvailability({
      ...base,
      staffId: 'anna',
      existingAppointments: [{ id: 'a1', staffId: 'anna', startUtc: fromZonedTime('2026-07-06T11:00:00', tz), endUtc: fromZonedTime('2026-07-06T12:00:00', tz), status: 'CONFIRMED' }],
      rangeStartUtc: fromZonedTime('2026-07-06T09:00:00', tz),
      rangeEndUtc: fromZonedTime('2026-07-06T17:00:00', tz),
      maxSuggestions: 20,
    });
    expect(slots.some((s) => s.localStart === '10:00')).toBe(false);
    expect(slots.some((s) => s.localStart === '12:00')).toBe(false);
    expect(slots.find((s) => s.localStart === '12:15')).toBeTruthy();
  });

  it('respects closed dates and DST conversion in salon timezone', () => {
    const slots = computeAvailability({
      ...base,
      closedDates: [{ date: fromZonedTime('2026-03-30T12:00:00', tz), reason: 'Urlaub' }],
      rangeStartUtc: fromZonedTime('2026-03-30T00:00:00', tz),
      rangeEndUtc: fromZonedTime('2026-03-30T23:59:00', tz),
    });
    expect(slots).toHaveLength(0);
  });
});
