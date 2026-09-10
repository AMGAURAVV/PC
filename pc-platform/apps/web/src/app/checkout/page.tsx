import type { Metadata } from 'next';
import { constructMetadata } from '../../lib/seo';
import { CheckoutClient } from './checkout-client';

export const metadata: Metadata = constructMetadata({
  title: 'Secure Checkout',
  description: 'Complete your hardware order with insured shipping, genuine warranty registration, and encrypted payment.',
  canonicalPath: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
