/**
 * Notification Delivery Foundation — in-memory store.
 */

import type {
  NotificationDeliveryRecord,
  DeliveryHistoryEntry,
  DeliveryLifecycleEvent,
  DeliveryStateHistoryEntry,
  DeliveryIntent,
  DeliveryRoute,
  DeliveryTarget,
  DeliveryChannelEligibility,
  DeliveryPolicy,
  DeliveryBlockingRecord,
  DeliveryDeferralRecord,
} from './notification-delivery-types.js';

const deliveryRecords = new Map<string, NotificationDeliveryRecord>();
const lifecycleEvents = new Map<string, DeliveryLifecycleEvent>();
const historyEntries = new Map<string, DeliveryHistoryEntry>();
const stateHistory = new Map<string, DeliveryStateHistoryEntry[]>();
const intents = new Map<string, DeliveryIntent>();
const routes = new Map<string, DeliveryRoute>();
const targets = new Map<string, DeliveryTarget>();
const eligibilities = new Map<string, DeliveryChannelEligibility>();
const policies = new Map<string, DeliveryPolicy>();
const blockings = new Map<string, DeliveryBlockingRecord>();
const deferrals = new Map<string, DeliveryDeferralRecord>();

let deliveryCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let reportCounter = 0;
let intentCounter = 0;
let routeCounter = 0;
let targetCounter = 0;
let eligibilityCounter = 0;
let policyCounter = 0;
let blockCounter = 0;
let deferCounter = 0;

export function resetNotificationDeliveryStoreForTests(): void {
  deliveryRecords.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  intents.clear();
  routes.clear();
  targets.clear();
  eligibilities.clear();
  policies.clear();
  blockings.clear();
  deferrals.clear();
  deliveryCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  reportCounter = 0;
  intentCounter = 0;
  routeCounter = 0;
  targetCounter = 0;
  eligibilityCounter = 0;
  policyCounter = 0;
  blockCounter = 0;
  deferCounter = 0;
}

export function nextDeliveryId(): string {
  deliveryCounter += 1;
  return `ndeliv-${deliveryCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `ndelivlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryHistoryEntryId(): string {
  historyCounter += 1;
  return `ndelivhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryReportId(): string {
  reportCounter += 1;
  return `ndelivrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryIntentId(): string {
  intentCounter += 1;
  return `ndelivintent-${intentCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryRouteId(): string {
  routeCounter += 1;
  return `ndelivroute-${routeCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryTargetId(): string {
  targetCounter += 1;
  return `ndelivtarget-${targetCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryEligibilityId(): string {
  eligibilityCounter += 1;
  return `ndelivelig-${eligibilityCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryPolicyId(): string {
  policyCounter += 1;
  return `ndelivpolicy-${policyCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryBlockId(): string {
  blockCounter += 1;
  return `ndelivblock-${blockCounter.toString().padStart(4, '0')}`;
}

export function nextDeliveryDeferId(): string {
  deferCounter += 1;
  return `ndelivdefer-${deferCounter.toString().padStart(4, '0')}`;
}

export function storeDeliveryRecord(record: NotificationDeliveryRecord): void {
  deliveryRecords.set(record.deliveryId, record);
}

export function getStoredDeliveryRecord(deliveryId: string): NotificationDeliveryRecord | null {
  return deliveryRecords.get(deliveryId) ?? null;
}

export function listStoredDeliveryRecords(): NotificationDeliveryRecord[] {
  return [...deliveryRecords.values()];
}

export function storeDeliveryLifecycleEvent(event: DeliveryLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredDeliveryLifecycleEvents(): DeliveryLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeDeliveryHistoryEntry(entry: DeliveryHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredDeliveryHistoryEntries(): DeliveryHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendDeliveryStateHistory(entry: DeliveryStateHistoryEntry): void {
  const existing = stateHistory.get(entry.deliveryId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.deliveryId, existing);
}

export function getStoredDeliveryStateHistory(deliveryId: string): DeliveryStateHistoryEntry[] {
  return [...(stateHistory.get(deliveryId) ?? [])];
}

export function storeDeliveryIntent(intent: DeliveryIntent): void {
  intents.set(intent.intentId, intent);
}

export function listStoredDeliveryIntents(): DeliveryIntent[] {
  return [...intents.values()];
}

export function storeDeliveryRoute(route: DeliveryRoute): void {
  routes.set(route.routeId, route);
}

export function listStoredDeliveryRoutes(): DeliveryRoute[] {
  return [...routes.values()];
}

export function storeDeliveryTarget(target: DeliveryTarget): void {
  targets.set(target.targetId, target);
}

export function listStoredDeliveryTargets(): DeliveryTarget[] {
  return [...targets.values()];
}

export function storeDeliveryEligibility(eligibility: DeliveryChannelEligibility): void {
  eligibilities.set(eligibility.eligibilityId, eligibility);
}

export function listStoredDeliveryEligibilities(): DeliveryChannelEligibility[] {
  return [...eligibilities.values()];
}

export function storeDeliveryPolicy(policy: DeliveryPolicy): void {
  policies.set(policy.policyId, policy);
}

export function listStoredDeliveryPolicies(): DeliveryPolicy[] {
  return [...policies.values()];
}

export function storeDeliveryBlocking(blocking: DeliveryBlockingRecord): void {
  blockings.set(blocking.blockId, blocking);
}

export function listStoredDeliveryBlockings(): DeliveryBlockingRecord[] {
  return [...blockings.values()];
}

export function storeDeliveryDeferral(deferral: DeliveryDeferralRecord): void {
  deferrals.set(deferral.deferralId, deferral);
}

export function listStoredDeliveryDeferrals(): DeliveryDeferralRecord[] {
  return [...deferrals.values()];
}

export function resetNotificationDeliveryReportCounterForTests(): void {
  reportCounter = 0;
}
