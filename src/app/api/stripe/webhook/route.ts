import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events. Stripe signs every request with
 * STRIPE_WEBHOOK_SECRET so we can verify it's genuine.
 *
 * Events handled:
 *  - checkout.session.completed         → subscription started
 *  - customer.subscription.updated      → plan changed / renewed
 *  - customer.subscription.deleted      → cancelled → downgrade to free
 *  - invoice.payment_failed             → payment failed → notify or downgrade
 */

// Note: In Next.js 14 App Router, req.text() gives the raw body automatically.
// No bodyParser config needed (that was Pages Router syntax).

// Map Stripe product/price to our plan names
function getPlanFromStripeEvent(priceId: string): 'pro' | 'agency' | 'free' {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)    return 'pro';
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';
  return 'free';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  // ── 1. Verify webhook signature ───────────────────────────
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Stripe webhook signature failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── 2. Service-role Supabase client (no user session here) ─
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // ── 3. Handle events ──────────────────────────────────────
  try {
    switch (event.type) {

      // ── Subscription created (after successful checkout) ───
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId  = session.subscription_data?.metadata?.supabase_user_id
                     ?? session.metadata?.supabase_user_id;
        const plan    = session.subscription_data?.metadata?.plan ?? 'pro';
        const subId   = session.subscription;

        if (userId) {
          await supabase.from('users').update({
            plan,
            stripe_customer_id: session.customer,
          }).eq('id', userId);

          console.log(`✅ Subscription activated: user=${userId} plan=${plan} sub=${subId}`);
        }
        break;
      }

      // ── Subscription updated (plan change / renewal) ────────
      case 'customer.subscription.updated': {
        const sub        = event.data.object as any;
        const customerId = sub.customer as string;
        const priceId    = sub.items.data[0]?.price?.id as string;
        const plan       = getPlanFromStripeEvent(priceId);
        const status     = sub.status; // active, past_due, canceled...

        const resolvedPlan = status === 'active' ? plan : 'free';

        const { data: profileRows } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (profileRows?.[0]) {
          await supabase.from('users')
            .update({ plan: resolvedPlan })
            .eq('id', profileRows[0].id);

          console.log(`🔄 Subscription updated: customer=${customerId} plan=${resolvedPlan}`);
        }
        break;
      }

      // ── Subscription cancelled ──────────────────────────────
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as any;
        const customerId = sub.customer as string;

        const { data: profileRows } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (profileRows?.[0]) {
          await supabase.from('users')
            .update({ plan: 'free' })
            .eq('id', profileRows[0].id);

          console.log(`❌ Subscription cancelled: customer=${customerId} → downgraded to free`);
        }
        break;
      }

      // ── Payment failed ──────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as any;
        const customerId = invoice.customer as string;
        console.warn(`⚠️  Payment failed for customer ${customerId}`);
        // TODO: send a payment-failed email via Resend
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
