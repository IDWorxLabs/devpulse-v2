/** Service adapter for cart — Custom App */
import type { CartRecord } from './cart.types';

const DEMO_CART_RECORDS: CartRecord[] = [
  { id: 'cart-1', label: 'Sample Cart record', createdAt: new Date().toISOString() },
  { id: 'cart-2', label: 'Cart preview entry', createdAt: new Date().toISOString() },
];

export function listCartRecords(): CartRecord[] {
  return DEMO_CART_RECORDS;
}
