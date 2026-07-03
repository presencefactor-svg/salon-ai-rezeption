-- Demo homepage + WhatsApp demo support
ALTER TYPE "AppointmentSource" ADD VALUE IF NOT EXISTS 'DEMO';

ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "demoSignupUrl" TEXT;
ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "demoFollowupDelaySec" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "demoFollowupSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "demoMessageCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "DemoAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "salon_id" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemoAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DemoAnalyticsEvent_type_createdAt_idx" ON "DemoAnalyticsEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "DemoAnalyticsEvent_salon_id_createdAt_idx" ON "DemoAnalyticsEvent"("salon_id", "createdAt");
