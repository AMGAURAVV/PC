import type { Metadata } from 'next';
import { constructMetadata } from '../../lib/seo';
import { CartClient } from './cart-client';

export const metadata: Metadata = constructMetadata({
  title: 'Shopping Cart',
  description: 'Review your selected hardware components, custom builds, and checkout with insured delivery.',
  canonicalPath: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return <CartClient />;
}
