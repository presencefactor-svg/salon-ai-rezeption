# Salon AI Rezeption

Production-grade MVP scaffold for a multi-tenant AI receptionist SaaS for hair salons in Germany/Austria. Operated by Factory Direct LTD.

## Stack

- Next.js App Router + TypeScript + Tailwind
- PostgreSQL + Prisma ORM
- Redis + BullMQ jobs
- Meta WhatsApp Business Cloud API direct integration
- LLM provider adapter, default OpenAI
- Stripe subscriptions + Stripe Tax assumptions
- GDPR/DSGVO scaffolding: Datenschutz, Impressum, AVV, encrypted PII helpers, audit model

## Local setup

```bash
npm install
cp .env.example .env
# edit .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Required services:

- PostgreSQL, preferably EU/Frankfurt in production
- Redis for reminders/waitlist queues
- Meta app with `whatsapp_business_messaging`
- Stripe account with Tax enabled
- OpenAI API key or compatible provider implementation

## Environment variables

See `.env.example`:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_ID`, `META_APP_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## Build order implemented

1. Data model + availability engine with tests
2. Dashboard German UI skeleton + calendar/inbox/service sections
3. WhatsApp webhook raw persistence + channel send-mode rules
4. LLMProvider adapter + German agent system prompt + mocked happy-path test
5. BullMQ jobs scaffold gated by `FULL` channel mode
6. Stripe pricing/webhook scaffold
7. Legal/GDPR placeholder pages + encryption helper
8. Demo seed script

## WhatsApp Business test-number guide

1. Create/verify Factory Direct LTD Meta app as Tech Provider.
2. Add `whatsapp_business_messaging` permission.
3. In dashboard, use Embedded Signup flow (`WhatsApp verbinden`) to link salon WABA and phone number.
4. Persist returned `waba_id`, `phone_number_id`, and encrypted access token on `Salon`.
5. Register webhook URL: `/api/whatsapp/webhook`.
6. Set verify token equal to `META_WEBHOOK_VERIFY_TOKEN`.
7. After connection create utility templates:
   - `termin_erinnerung`
   - `warteliste_angebot`
   - `buchung_bestaetigung_followup`
8. Until all utility templates are `APPROVED`, salon remains in `INBOUND_ONLY`: AI can answer inbound messages in the 24h window, but reminders/waitlist are disabled.
9. Once approved, switch to `FULL` and enable reminder/waitlist jobs.

## Critical product rules

- Every tenant data table carries `salon_id`.
- Do not trust client-side `salon_id`; repository/server layer must derive tenant from authenticated user.
- Appointment times are stored UTC and displayed in salon timezone.
- Free-form WhatsApp replies are only sent inside the 24h service window.
- Outside 24h, only approved templates may be used.
- AI may propose tool calls only; backend validates availability and mutates state transactionally.
- Agent must disclose it is a digital assistant and never claim to be human.
- Prices, services, hours, and availability come only from backend/tool results.

## Tests

```bash
npm test
```

Current tests:

- availability: opening hours × staff schedule × buffers × appointments × timezone/DST
- race-safe booking: second booking of same slot rejected
- mocked webhook/agent/booking happy path

## Legal placeholders

Pages exist but require lawyer-approved final wording before launch:

- `/datenschutz`
- `/impressum`
- `/avv`

Important legal note: UK company targeting EU customers means UK GDPR and EU GDPR apply. EU Article 27 representative placeholder is included in `/impressum`.
