import type { Metadata } from 'next';
import { constructMetadata } from '../../lib/seo';
import { OrdersClient } from './orders-client';

export const metadata: Metadata = constructMetadata({
  title: 'Order Tracking & Delivery Status',
  description: 'Track your custom PC shipment, transit insurance status, and download tax invoices.',
  canonicalPath: '/orders',
  noIndex: true,
});

export default function OrdersPage() {
  return <OrdersClient />;
}
