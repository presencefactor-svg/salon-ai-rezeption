-- Public WhatsApp phone for tenant dashboard configuration
ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "whatsappPhone" TEXT;
