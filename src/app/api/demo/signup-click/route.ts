import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const signupUrl = process.env.DEMO_SIGNUP_URL || '/register?signup=trial&utm_source=whatsapp_demo&utm_medium=followup&utm_campaign=salon_aurora';
  await prisma.demoAnalyticsEvent.create({ data: { type: 'signup_click', metadata: { source: 'homepage' } } }).catch(() => null);
  return NextResponse.redirect(new URL(signupUrl, process.env.NEXT_PUBLIC_APP_URL || 'https://salon-ai-rezeption.vercel.app'));
}
