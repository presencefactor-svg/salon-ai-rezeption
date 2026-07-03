export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeRange {
  start: string;
  end: string;
}

export interface OpeningHour {
  weekday: Weekday;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

export interface StaffSchedule {
  weekday: Weekday;
  ranges: TimeRange[];
}

export interface StaffAvailabilityProfile {
  id: string;
  displayName: string;
  active: boolean;
  workingHours: StaffSchedule[];
}

export interface ServiceAvailabilityProfile {
  id: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  staffIds: string[];
}

export interface ExistingAppointment {
  id: string;
  staffId: string;
  startUtc: Date;
  endUtc: Date;
  status: 'CONFIRMED' | 'NO_SHOW' | 'COMPLETED' | 'CANCELLED';
}

export interface ClosedDateProfile {
  date: Date;
  reason?: string;
}

export interface AvailabilityInput {
  timezone: string;
  openingHours: OpeningHour[];
  closedDates: ClosedDateProfile[];
  staff: StaffAvailabilityProfile[];
  service: ServiceAvailabilityProfile;
  existingAppointments: ExistingAppointment[];
  rangeStartUtc: Date;
  rangeEndUtc: Date;
  staffId?: string;
  slotStepMinutes?: number;
  maxSuggestions?: number;
}

export interface AvailableSlot {
  staffId: string;
  staffName: string;
  startUtc: Date;
  endUtc: Date;
  localDate: string;
  localStart: string;
  localEnd: string;
}
