/** Service adapter for orders — reusable components where */
import type { OrdersRecord } from './orders.types';

const DEMO_ORDERS_RECORDS: OrdersRecord[] = [
  { id: 'orders-1', label: 'Sample Orders record', createdAt: new Date().toISOString() },
  { id: 'orders-2', label: 'Orders preview entry', createdAt: new Date().toISOString() },
];

export function listOrdersRecords(): OrdersRecord[] {
  return DEMO_ORDERS_RECORDS;
}
