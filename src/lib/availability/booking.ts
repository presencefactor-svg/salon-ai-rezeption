import { addMinutes } from 'date-fns';
import { assertSlotAvailable } from './engine';
import type { AvailabilityInput } from './types';

type AppointmentSourceValue = 'AI' | 'MANUAL';

export interface BookingRepository {
  transaction<T>(fn: (tx: BookingRepository) => Promise<T>): Promise<T>;
  lockStaffDay(salonId: string, staffId: string, dayKey: string): Promise<void>;
  listAppointmentsForAvailability(input: { salonId: string; staffId: string; fromUtc: Date; toUtc: Date }): Promise<AvailabilityInput['existingAppointments']>;
  createAppointment(data: {
    salonId: string;
    customerId: string;
    serviceId: string;
    staffId: string;
    startUtc: Date;
    endUtc: Date;
    source: AppointmentSourceValue;
  }): Promise<{ id: string }>;
  audit(data: { salonId: string; action: string; entityId?: string; metadata?: unknown }): Promise<void>;
}

export class SlotUnavailableError extends Error {
  constructor() {
    super('Gewählter Termin ist nicht mehr verfügbar.');
  }
}

export async function createBookingRaceSafe(
  repo: BookingRepository,
  availability: Omit<AvailabilityInput, 'existingAppointments'>,
  data: { salonId: string; customerId: string; serviceId: string; staffId: string; startUtc: Date; source?: AppointmentSourceValue },
): Promise<{ id: string }> {
  const endUtc = addMinutes(data.startUtc, availability.service.durationMinutes);
  return repo.transaction(async (tx) => {
    const dayKey = data.startUtc.toISOString().slice(0, 10);
    await tx.lockStaffDay(data.salonId, data.staffId, dayKey);
    const existingAppointments = await tx.listAppointmentsForAvailability({
      salonId: data.salonId,
      staffId: data.staffId,
      fromUtc: availability.rangeStartUtc,
      toUtc: availability.rangeEndUtc,
    });
    const ok = assertSlotAvailable({ ...availability, existingAppointments }, data.staffId, data.startUtc);
    if (!ok) throw new SlotUnavailableError();
    const appointment = await tx.createAppointment({
      salonId: data.salonId,
      customerId: data.customerId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      startUtc: data.startUtc,
      endUtc,
      source: data.source ?? 'AI',
    });
    await tx.audit({ salonId: data.salonId, action: 'appointment.create', entityId: appointment.id, metadata: { source: data.source ?? 'AI' } });
    return appointment;
  });
}
