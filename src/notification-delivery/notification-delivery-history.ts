/**
 * Notification Delivery Foundation — history tracking.
 */

import {
  nextDeliveryHistoryEntryId,
  storeDeliveryHistoryEntry,
  listStoredDeliveryHistoryEntries,
} from './notification-delivery-store.js';
import type { DeliveryHistoryEntry } from './notification-delivery-types.js';

export function recordDeliveryHistoryEntry(
  input: Omit<DeliveryHistoryEntry, 'entryId' | 'timestamp' | 'consumer'> & {
    consumer?: string | null;
  },
): DeliveryHistoryEntry {
  const entry: DeliveryHistoryEntry = {
    entryId: nextDeliveryHistoryEntryId(),
    deliveryId: input.deliveryId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeDeliveryHistoryEntry(entry);
  return entry;
}

export function getDeliveryHistory(deliveryId: string): DeliveryHistoryEntry[] {
  return listStoredDeliveryHistoryEntries().filter((e) => e.deliveryId === deliveryId);
}

export function listDeliveryHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredDeliveryHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
