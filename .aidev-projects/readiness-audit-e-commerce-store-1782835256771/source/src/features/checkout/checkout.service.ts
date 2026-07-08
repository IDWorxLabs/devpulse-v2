/** Service adapter for checkout — Custom App */
import type { CheckoutRecord } from './checkout.types';

const DEMO_CHECKOUT_RECORDS: CheckoutRecord[] = [
  { id: 'checkout-1', label: 'Sample Checkout record', createdAt: new Date().toISOString() },
  { id: 'checkout-2', label: 'Checkout preview entry', createdAt: new Date().toISOString() },
];

export function listCheckoutRecords(): CheckoutRecord[] {
  return DEMO_CHECKOUT_RECORDS;
}
