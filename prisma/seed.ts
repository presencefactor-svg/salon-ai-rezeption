import { PrismaClient } from '@prisma/client';
import { encryptPlaintext } from '../src/lib/gdpr/crypto';

const prisma = new PrismaClient();

async function main() {
  const salon = await prisma.salon.upsert({
    where: { id: 'demo-salon' },
    update: {},
    create: { id: 'demo-salon', name: 'Salon Demo GmbH', address: 'Prenzlauer Allee 1, 10405 Berlin', timezone: 'Europe/Berlin', locale: 'de-DE', tonePreference: 'SIE' },
  });
  const [anna, lea] = await Promise.all([
    prisma.staff.create({ data: { salonId: salon.id, displayName: 'Anna', workingHours: { monday: [['09:00','17:00']], tuesday: [['09:00','17:00']] } } }),
    prisma.staff.create({ data: { salonId: salon.id, displayName: 'Lea', workingHours: { monday: [['12:00','20:00']], friday: [['09:00','16:00']] } } }),
  ]);
  await prisma.openingHours.createMany({ data: [1,2,3,4,5].map((weekday) => ({ salonId: salon.id, weekday, openTime: '09:00', closeTime: '18:00' })), skipDuplicates: true });
  await prisma.service.create({ data: { salonId: salon.id, name: 'Damenhaarschnitt', durationMinutes: 60, priceEurCents: 5900, bufferMinutes: 15, staff: { connect: [{ id: anna.id }, { id: lea.id }] } } });
  await prisma.service.create({ data: { salonId: salon.id, name: 'Balayage', durationMinutes: 180, priceEurCents: 18900, bufferMinutes: 20, staff: { connect: [{ id: lea.id }] } } });
  await prisma.customer.create({ data: { salonId: salon.id, nameEncrypted: encryptPlaintext('Mara König'), whatsappEncrypted: encryptPlaintext('+491701234567'), consentTimestamp: new Date() } });
}

main().finally(() => prisma.$disconnect());
