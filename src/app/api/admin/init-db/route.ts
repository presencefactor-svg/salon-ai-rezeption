import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Salon" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
      "locale" TEXT NOT NULL DEFAULT 'de-DE',
      "tonePreference" TEXT NOT NULL DEFAULT 'SIE',
      "phoneNumberId" TEXT,
      "wabaId" TEXT,
      "encryptedAccessToken" TEXT,
      "channelMode" TEXT NOT NULL DEFAULT 'INBOUND_ONLY',
      "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIALING',
      "retentionMonths" INTEGER NOT NULL DEFAULT 12,
      "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
      "greetingText" TEXT,
      "stripeCustomerId" TEXT,
      "stripeSubscriptionId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Staff" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"displayName" TEXT NOT NULL,"workingHours" JSONB NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Staff_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Service" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"name" TEXT NOT NULL,"durationMinutes" INTEGER NOT NULL,"priceEurCents" INTEGER NOT NULL,"bufferMinutes" INTEGER NOT NULL DEFAULT 0,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Service_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "_StaffServices" ("A" TEXT NOT NULL,"B" TEXT NOT NULL)`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "_StaffServices_AB_unique" ON "_StaffServices"("A", "B")`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "OpeningHours" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"weekday" INTEGER NOT NULL,"openTime" TEXT NOT NULL,"closeTime" TEXT NOT NULL,"isClosed" BOOLEAN NOT NULL DEFAULT false,CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OpeningHours_salon_id_weekday_key" ON "OpeningHours"("salon_id", "weekday")`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Customer" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"nameEncrypted" TEXT,"whatsappEncrypted" TEXT NOT NULL,"notesEncrypted" TEXT,"consentTimestamp" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Conversation" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"customerId" TEXT NOT NULL,"channel" TEXT NOT NULL DEFAULT 'WHATSAPP',"mode" TEXT NOT NULL DEFAULT 'AI',"lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"windowExpiresAt" TIMESTAMP(3),CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "MessageTemplate" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"name" TEXT NOT NULL,"metaTemplateId" TEXT,"approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',"category" TEXT NOT NULL DEFAULT 'UTILITY',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_salon_id_name_key" ON "MessageTemplate"("salon_id", "name")`);
    return NextResponse.json({ ok: true, message: 'Core tables ensured. Now open /api/admin/seed.' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
