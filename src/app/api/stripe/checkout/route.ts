import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLAN_PRICE_IDS } from '@/lib/stripe';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for the requested plan.
 * Body: { plan: 'pro' | 'agency' }
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth check ─────────────────────────────────────────
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Validate plan ──────────────────────────────────────
  const { plan } = await req.json() as { plan: string };
  const priceId = PLAN_PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.json(
      { error: `Invalid plan "${plan}" or price ID not configured.` },
      { status: 400 }
    );
  }

  // ── 3. Fetch user profile (for existing Stripe customer ID) ──
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single();

  // ── 4. Get or create Stripe customer ──────────────────────
  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name:  profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    // Save the customer ID to Supabase
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // ── 5. Create Checkout Session ────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?tab=billing&success=1`,
    cancel_url:  `${appUrl}/dashboard/settings?tab=billing&canceled=1`,
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return NextResponse.json({ url: session.url });
}
