import Stripe from 'stripe';

/**
 * Singleton Stripe client — used in all API routes.
 * Uses the secret key from .env.local
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

/** Map plan IDs to Stripe Price IDs from env */
export const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  pro:    process.env.STRIPE_PRO_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_PRICE_ID,
};
