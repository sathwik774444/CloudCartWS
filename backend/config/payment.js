import Stripe from 'stripe';

import { env } from './env.js';

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
}

export function getCashfreeConfig() {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) return null;

  const baseUrl = env.CASHFREE_ENVIRONMENT === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';

  return {
    baseUrl,
    headers: {
      'x-client-id': env.CASHFREE_APP_ID,
      'x-client-secret': env.CASHFREE_SECRET_KEY,
      'x-api-version': '2022-09-01',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
}
