/** Service adapter for inventory — reusable components where */
import type { InventoryRecord } from './inventory.types';

const DEMO_INVENTORY_RECORDS: InventoryRecord[] = [
  { id: 'inventory-1', label: 'Sample Inventory record', createdAt: new Date().toISOString() },
  { id: 'inventory-2', label: 'Inventory preview entry', createdAt: new Date().toISOString() },
];

export function listInventoryRecords(): InventoryRecord[] {
  return DEMO_INVENTORY_RECORDS;
}
