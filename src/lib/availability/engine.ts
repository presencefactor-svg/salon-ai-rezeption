import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addMinutes, isBefore } from 'date-fns';
import type { AvailabilityInput, AvailableSlot, TimeRange, Weekday } from './types';

const ACTIVE_BLOCKING_STATUSES = new Set(['CONFIRMED', 'NO_SHOW', 'COMPLETED']);

function parseMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) throw new Error(`Invalid HH:mm time: ${value}`);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function localDateTimeToUtc(localDate: string, time: string, timezone: string): Date {
  return fromZonedTime(`${localDate}T${time}:00`, timezone);
}

function intersectRanges(a: TimeRange, b: TimeRange): TimeRange | null {
  const start = Math.max(parseMinutes(a.start), parseMinutes(b.start));
  const end = Math.min(parseMinutes(a.end), parseMinutes(b.end));
  return start < end ? { start: minutesToTime(start), end: minutesToTime(end) } : null;
}

function eachLocalDate(rangeStartUtc: Date, rangeEndUtc: Date, timezone: string): string[] {
  const dates: string[] = [];
  const startLocal = toZonedTime(rangeStartUtc, timezone);
  const endLocal = toZonedTime(rangeEndUtc, timezone);
  let cursor = new Date(startLocal.getFullYear(), startLocal.getMonth(), startLocal.getDate());
  const end = new Date(endLocal.getFullYear(), endLocal.getMonth(), endLocal.getDate());
  while (cursor <= end) {
    dates.push(formatInTimeZone(cursor, timezone, 'yyyy-MM-dd'));
    cursor = addMinutes(cursor, 24 * 60);
  }
  return dates;
}

function weekdayForLocalDate(localDate: string, timezone: string): Weekday {
  const noonUtc = fromZonedTime(`${localDate}T12:00:00`, timezone);
  return Number(formatInTimeZone(noonUtc, timezone, 'i')) % 7 as Weekday;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA;
}

export function computeAvailability(input: AvailabilityInput): AvailableSlot[] {
  const step = input.slotStepMinutes ?? 15;
  const max = input.maxSuggestions ?? 5;
  const result: AvailableSlot[] = [];
  const closed = new Set(input.closedDates.map((d) => formatInTimeZone(d.date, input.timezone, 'yyyy-MM-dd')));
  const eligibleStaff = input.staff
    .filter((s) => s.active)
    .filter((s) => !input.staffId || s.id === input.staffId)
    .filter((s) => input.service.staffIds.length === 0 || input.service.staffIds.includes(s.id));

  for (const localDate of eachLocalDate(input.rangeStartUtc, input.rangeEndUtc, input.timezone)) {
    if (closed.has(localDate)) continue;
    const weekday = weekdayForLocalDate(localDate, input.timezone);
    const opening = input.openingHours.find((h) => h.weekday === weekday && !h.isClosed);
    if (!opening) continue;

    for (const member of eligibleStaff) {
      const staffDay = member.workingHours.find((h) => h.weekday === weekday);
      if (!staffDay) continue;
      const workingIntersections = staffDay.ranges
        .map((r) => intersectRanges(r, { start: opening.openTime, end: opening.closeTime }))
        .filter((r): r is TimeRange => Boolean(r));

      for (const range of workingIntersections) {
        const first = parseMinutes(range.start);
        const lastStart = parseMinutes(range.end) - input.service.durationMinutes;
        for (let minutes = first; minutes <= lastStart; minutes += step) {
          const localStart = minutesToTime(minutes);
          const localEnd = minutesToTime(minutes + input.service.durationMinutes);
          const startUtc = localDateTimeToUtc(localDate, localStart, input.timezone);
          const endUtc = localDateTimeToUtc(localDate, localEnd, input.timezone);
          const blockedEnd = addMinutes(endUtc, input.service.bufferMinutes);
          if (isBefore(startUtc, input.rangeStartUtc) || isBefore(input.rangeEndUtc, endUtc)) continue;
          const busy = input.existingAppointments.some((appt) =>
            appt.staffId === member.id &&
            ACTIVE_BLOCKING_STATUSES.has(appt.status) &&
            overlaps(startUtc, blockedEnd, appt.startUtc, addMinutes(appt.endUtc, input.service.bufferMinutes)),
          );
          if (busy) continue;
          result.push({
            staffId: member.id,
            staffName: member.displayName,
            startUtc,
            endUtc,
            localDate,
            localStart,
            localEnd,
          });
          if (result.length >= max) return result;
        }
      }
    }
  }
  return result;
}

export function assertSlotAvailable(input: AvailabilityInput, staffId: string, startUtc: Date): boolean {
  return computeAvailability({ ...input, staffId, maxSuggestions: 500 }).some(
    (slot) => slot.staffId === staffId && slot.startUtc.getTime() === startUtc.getTime(),
  );
}
