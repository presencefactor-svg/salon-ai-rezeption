import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');
  const signature = request.headers.get('stripe-signature') ?? '';
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder');
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
  // TODO: update Salon.subscriptionStatus by stripeCustomerId/subscriptionId in webhook-driven flow.
  return NextResponse.json({ received: true, type: event.type });
}
