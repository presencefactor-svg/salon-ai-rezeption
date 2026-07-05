import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    const enums = [
      ["Role", ["OWNER", "STAFF"]],
      ["TonePreference", ["SIE", "DU"]],
      ["ChannelMode", ["INBOUND_ONLY", "FULL"]],
      ["SubscriptionStatus", ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"]],
      ["AppointmentStatus", ["CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"]],
      ["AppointmentSource", ["AI", "MANUAL", "DEMO"]],
      ["ConversationChannel", ["WHATSAPP"]],
      ["ConversationMode", ["AI", "HUMAN"]],
      ["MessageDirection", ["INBOUND", "OUTBOUND"]],
      ["TemplateStatus", ["PENDING", "APPROVED", "REJECTED"]],
      ["TemplateCategory", ["UTILITY"]],
      ["WaitlistStatus", ["OPEN", "OFFERED", "BOOKED", "EXPIRED", "CANCELLED"]],
      ["AuditActorType", ["AI", "USER", "SYSTEM", "WEBHOOK", "JOB"]],
    ] as const;

    for (const [name, values] of enums) {
      await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(', ')}); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    }

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Salon" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
      "locale" TEXT NOT NULL DEFAULT 'de-DE',
      "tonePreference" "TonePreference" NOT NULL DEFAULT 'SIE',
      "whatsappPhone" TEXT,
      "phoneNumberId" TEXT,
      "wabaId" TEXT,
      "encryptedAccessToken" TEXT,
      "channelMode" "ChannelMode" NOT NULL DEFAULT 'INBOUND_ONLY',
      "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
      "retentionMonths" INTEGER NOT NULL DEFAULT 12,
      "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
      "greetingText" TEXT,
      "stripeCustomerId" TEXT,
      "stripeSubscriptionId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT,"role" "Role" NOT NULL DEFAULT 'STAFF',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "User_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_salon_id_idx" ON "User"("salon_id")`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Staff" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"displayName" TEXT NOT NULL,"workingHours" JSONB NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Staff_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Service" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"name" TEXT NOT NULL,"durationMinutes" INTEGER NOT NULL,"priceEurCents" INTEGER NOT NULL,"bufferMinutes" INTEGER NOT NULL DEFAULT 0,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Service_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "_StaffServices" ("A" TEXT NOT NULL,"B" TEXT NOT NULL)`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "_StaffServices_AB_unique" ON "_StaffServices"("A", "B")`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "OpeningHours" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"weekday" INTEGER NOT NULL,"openTime" TEXT NOT NULL,"closeTime" TEXT NOT NULL,"isClosed" BOOLEAN NOT NULL DEFAULT false,CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OpeningHours_salon_id_weekday_key" ON "OpeningHours"("salon_id", "weekday")`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Customer" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"nameEncrypted" TEXT,"whatsappEncrypted" TEXT NOT NULL,"notesEncrypted" TEXT,"consentTimestamp" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ClosedDate" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"date" TIMESTAMP(3) NOT NULL,"reason" TEXT,CONSTRAINT "ClosedDate_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Appointment" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"customerId" TEXT NOT NULL,"serviceId" TEXT NOT NULL,"staffId" TEXT NOT NULL,"startUtc" TIMESTAMP(3) NOT NULL,"endUtc" TIMESTAMP(3) NOT NULL,"status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',"source" "AppointmentSource" NOT NULL DEFAULT 'AI',"reminderSent" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "WaitlistEntry" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"customerId" TEXT NOT NULL,"serviceId" TEXT NOT NULL,"preferences" JSONB NOT NULL,"status" "WaitlistStatus" NOT NULL DEFAULT 'OPEN',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Conversation" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"customerId" TEXT NOT NULL,"channel" "ConversationChannel" NOT NULL DEFAULT 'WHATSAPP',"mode" "ConversationMode" NOT NULL DEFAULT 'AI',"lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"windowExpiresAt" TIMESTAMP(3),CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Message" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"conversationId" TEXT NOT NULL,"direction" "MessageDirection" NOT NULL,"bodyEncrypted" TEXT NOT NULL,"rawPayloadRef" TEXT,"metaMessageId" TEXT,"timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Message_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "MessageTemplate" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"name" TEXT NOT NULL,"metaTemplateId" TEXT,"approvalStatus" "TemplateStatus" NOT NULL DEFAULT 'PENDING',"category" "TemplateCategory" NOT NULL DEFAULT 'UTILITY',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL,"salon_id" TEXT NOT NULL,"actorType" "AuditActorType" NOT NULL,"actorId" TEXT,"action" TEXT NOT NULL,"entityType" TEXT,"entityId" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "RawWebhookPayload" ("id" TEXT NOT NULL,"salon_id" TEXT,"provider" TEXT NOT NULL DEFAULT 'META_WHATSAPP',"externalEventId" TEXT,"payload" JSONB NOT NULL,"processedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "RawWebhookPayload_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_salon_id_name_key" ON "MessageTemplate"("salon_id", "name")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "whatsappPhone" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "demoSignupUrl" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "demoFollowupDelaySec" INTEGER NOT NULL DEFAULT 30`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "demoFollowupSent" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "demoMessageCount" INTEGER NOT NULL DEFAULT 0`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "DemoAnalyticsEvent" ("id" TEXT NOT NULL,"type" TEXT NOT NULL,"salon_id" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "DemoAnalyticsEvent_pkey" PRIMARY KEY ("id"))`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Message_metaMessageId_key" ON "Message"("metaMessageId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DemoAnalyticsEvent_type_createdAt_idx" ON "DemoAnalyticsEvent"("type", "createdAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DemoAnalyticsEvent_salon_id_createdAt_idx" ON "DemoAnalyticsEvent"("salon_id", "createdAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Appointment_salon_id_startUtc_endUtc_idx" ON "Appointment"("salon_id", "startUtc", "endUtc")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Conversation_salon_id_lastActivity_idx" ON "Conversation"("salon_id", "lastActivity")`);
    return NextResponse.json({ ok: true, message: 'All SaaS dashboard tables ensured. Registration/login is ready.' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
