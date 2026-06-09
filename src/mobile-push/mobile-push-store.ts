/**
 * Mobile Push Foundation — in-memory store.
 */

import type {
  MobilePushRecord,
  PushHistoryEntry,
  PushLifecycleEvent,
  PushStateHistoryEntry,
  PushTokenMetadata,
  PushPlatformMeta,
  PushPayload,
  PushDeviceTarget,
  PushRoute,
  PushEligibility,
  PushPolicy,
  PushBlockingRecord,
  PushDeferralRecord,
} from './mobile-push-types.js';

const pushRecords = new Map<string, MobilePushRecord>();
const lifecycleEvents = new Map<string, PushLifecycleEvent>();
const historyEntries = new Map<string, PushHistoryEntry>();
const stateHistory = new Map<string, PushStateHistoryEntry[]>();
const tokens = new Map<string, PushTokenMetadata>();
const platforms = new Map<string, PushPlatformMeta>();
const payloads = new Map<string, PushPayload>();
const targets = new Map<string, PushDeviceTarget>();
const routes = new Map<string, PushRoute>();
const eligibilities = new Map<string, PushEligibility>();
const policies = new Map<string, PushPolicy>();
const blockings = new Map<string, PushBlockingRecord>();
const deferrals = new Map<string, PushDeferralRecord>();

let pushCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let reportCounter = 0;
let tokenCounter = 0;
let platformCounter = 0;
let payloadCounter = 0;
let targetCounter = 0;
let routeCounter = 0;
let eligibilityCounter = 0;
let policyCounter = 0;
let blockCounter = 0;
let deferCounter = 0;

export function resetMobilePushStoreForTests(): void {
  pushRecords.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  tokens.clear();
  platforms.clear();
  payloads.clear();
  targets.clear();
  routes.clear();
  eligibilities.clear();
  policies.clear();
  blockings.clear();
  deferrals.clear();
  pushCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  reportCounter = 0;
  tokenCounter = 0;
  platformCounter = 0;
  payloadCounter = 0;
  targetCounter = 0;
  routeCounter = 0;
  eligibilityCounter = 0;
  policyCounter = 0;
  blockCounter = 0;
  deferCounter = 0;
}

export function nextPushId(): string {
  pushCounter += 1;
  return `mpush-${pushCounter.toString().padStart(4, '0')}`;
}

export function nextPushLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `mpushlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextPushHistoryEntryId(): string {
  historyCounter += 1;
  return `mpushhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextPushReportId(): string {
  reportCounter += 1;
  return `mpushrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function nextPushTokenId(): string {
  tokenCounter += 1;
  return `mpush-token-${tokenCounter.toString().padStart(4, '0')}`;
}

export function nextPushPlatformId(): string {
  platformCounter += 1;
  return `mpush-platform-${platformCounter.toString().padStart(4, '0')}`;
}

export function nextPushPayloadId(): string {
  payloadCounter += 1;
  return `mpush-payload-${payloadCounter.toString().padStart(4, '0')}`;
}

export function nextPushTargetId(): string {
  targetCounter += 1;
  return `mpush-target-${targetCounter.toString().padStart(4, '0')}`;
}

export function nextPushRouteId(): string {
  routeCounter += 1;
  return `mpush-route-${routeCounter.toString().padStart(4, '0')}`;
}

export function nextPushEligibilityId(): string {
  eligibilityCounter += 1;
  return `mpush-elig-${eligibilityCounter.toString().padStart(4, '0')}`;
}

export function nextPushPolicyId(): string {
  policyCounter += 1;
  return `mpush-policy-${policyCounter.toString().padStart(4, '0')}`;
}

export function nextPushBlockId(): string {
  blockCounter += 1;
  return `mpush-block-${blockCounter.toString().padStart(4, '0')}`;
}

export function nextPushDeferId(): string {
  deferCounter += 1;
  return `mpush-defer-${deferCounter.toString().padStart(4, '0')}`;
}

export function storePushRecord(record: MobilePushRecord): void {
  pushRecords.set(record.pushId, record);
}

export function getStoredPushRecord(pushId: string): MobilePushRecord | null {
  return pushRecords.get(pushId) ?? null;
}

export function listStoredPushRecords(): MobilePushRecord[] {
  return [...pushRecords.values()];
}

export function storePushLifecycleEvent(event: PushLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredPushLifecycleEvents(): PushLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storePushHistoryEntry(entry: PushHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredPushHistoryEntries(): PushHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendPushStateHistory(entry: PushStateHistoryEntry): void {
  const existing = stateHistory.get(entry.pushId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.pushId, existing);
}

export function getStoredPushStateHistory(pushId: string): PushStateHistoryEntry[] {
  return [...(stateHistory.get(pushId) ?? [])];
}

export function storePushToken(token: PushTokenMetadata): void {
  tokens.set(token.tokenId, token);
}

export function listStoredPushTokens(): PushTokenMetadata[] {
  return [...tokens.values()];
}

export function storePushPlatform(platform: PushPlatformMeta): void {
  platforms.set(platform.platformId, platform);
}

export function storePushPayload(payload: PushPayload): void {
  payloads.set(payload.payloadId, payload);
}

export function storePushDeviceTarget(target: PushDeviceTarget): void {
  targets.set(target.targetId, target);
}

export function storePushRoute(route: PushRoute): void {
  routes.set(route.routeId, route);
}

export function storePushEligibility(eligibility: PushEligibility): void {
  eligibilities.set(eligibility.eligibilityId, eligibility);
}

export function storePushPolicy(policy: PushPolicy): void {
  policies.set(policy.policyId, policy);
}

export function storePushBlocking(blocking: PushBlockingRecord): void {
  blockings.set(blocking.blockId, blocking);
}

export function storePushDeferral(deferral: PushDeferralRecord): void {
  deferrals.set(deferral.deferralId, deferral);
}

export function resetMobilePushReportCounterForTests(): void {
  reportCounter = 0;
}
