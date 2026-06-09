/**
 * Mobile Preview Runtime Foundation — in-memory store.
 */

import type {
  MobilePreviewSession,
  MobilePreviewHistoryEntry,
  MobilePreviewLifecycleEvent,
  MobilePreviewTrackedSession,
  MobilePreviewStateHistoryEntry,
  MobilePreviewLink,
  MobilePreviewDesktopRecommendation,
} from './mobile-preview-types.js';

const sessions = new Map<string, MobilePreviewSession>();
const trackedSessions = new Map<string, MobilePreviewTrackedSession>();
const lifecycleEvents = new Map<string, MobilePreviewLifecycleEvent>();
const historyEntries = new Map<string, MobilePreviewHistoryEntry>();
const stateHistory = new Map<string, MobilePreviewStateHistoryEntry[]>();
const previewLinks = new Map<string, MobilePreviewLink>();
const desktopRecommendations = new Map<string, MobilePreviewDesktopRecommendation>();

let previewCounter = 0;
let trackedSessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let previewLinkCounter = 0;
let desktopRecommendationCounter = 0;
let reportCounter = 0;

export function resetMobilePreviewStoreForTests(): void {
  sessions.clear();
  trackedSessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  previewLinks.clear();
  desktopRecommendations.clear();
  previewCounter = 0;
  trackedSessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  previewLinkCounter = 0;
  desktopRecommendationCounter = 0;
  reportCounter = 0;
}

export function nextMobilePreviewId(): string {
  previewCounter += 1;
  return `mpview-${previewCounter.toString().padStart(4, '0')}`;
}

export function nextMobilePreviewTrackedSessionId(): string {
  trackedSessionCounter += 1;
  return `mpvsess-${trackedSessionCounter.toString().padStart(4, '0')}`;
}

export function nextMobilePreviewLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `mpvlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextMobilePreviewHistoryEntryId(): string {
  historyCounter += 1;
  return `mpvi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextMobilePreviewLinkId(): string {
  previewLinkCounter += 1;
  return `mpvlink-${previewLinkCounter.toString().padStart(4, '0')}`;
}

export function nextMobilePreviewDesktopRecommendationId(): string {
  desktopRecommendationCounter += 1;
  return `mpvdesk-${desktopRecommendationCounter.toString().padStart(4, '0')}`;
}

export function nextMobilePreviewReportId(): string {
  reportCounter += 1;
  return `mpvrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function storeMobilePreviewSession(session: MobilePreviewSession): void {
  sessions.set(session.mobilePreviewId, session);
}

export function getStoredMobilePreviewSession(mobilePreviewId: string): MobilePreviewSession | null {
  return sessions.get(mobilePreviewId) ?? null;
}

export function listStoredMobilePreviewSessions(): MobilePreviewSession[] {
  return [...sessions.values()];
}

export function storeMobilePreviewTrackedSession(session: MobilePreviewTrackedSession): void {
  trackedSessions.set(session.sessionId, session);
}

export function getStoredMobilePreviewTrackedSession(sessionId: string): MobilePreviewTrackedSession | null {
  return trackedSessions.get(sessionId) ?? null;
}

export function listStoredMobilePreviewTrackedSessions(): MobilePreviewTrackedSession[] {
  return [...trackedSessions.values()];
}

export function storeMobilePreviewLifecycleEvent(event: MobilePreviewLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredMobilePreviewLifecycleEvents(): MobilePreviewLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeMobilePreviewHistoryEntry(entry: MobilePreviewHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredMobilePreviewHistoryEntries(): MobilePreviewHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendMobilePreviewStateHistory(entry: MobilePreviewStateHistoryEntry): void {
  const existing = stateHistory.get(entry.mobilePreviewId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.mobilePreviewId, existing);
}

export function getStoredMobilePreviewStateHistory(mobilePreviewId: string): MobilePreviewStateHistoryEntry[] {
  return [...(stateHistory.get(mobilePreviewId) ?? [])];
}

export function storeMobilePreviewLink(link: MobilePreviewLink): void {
  previewLinks.set(link.linkId, link);
}

export function getStoredMobilePreviewLink(linkId: string): MobilePreviewLink | null {
  return previewLinks.get(linkId) ?? null;
}

export function listStoredMobilePreviewLinks(): MobilePreviewLink[] {
  return [...previewLinks.values()];
}

export function listStoredMobilePreviewLinksForSession(mobilePreviewId: string): MobilePreviewLink[] {
  return [...previewLinks.values()].filter((l) => l.mobilePreviewId === mobilePreviewId);
}

export function storeMobilePreviewDesktopRecommendation(
  recommendation: MobilePreviewDesktopRecommendation,
): void {
  desktopRecommendations.set(recommendation.recommendationId, recommendation);
}

export function getStoredMobilePreviewDesktopRecommendation(
  recommendationId: string,
): MobilePreviewDesktopRecommendation | null {
  return desktopRecommendations.get(recommendationId) ?? null;
}

export function listStoredMobilePreviewDesktopRecommendations(): MobilePreviewDesktopRecommendation[] {
  return [...desktopRecommendations.values()];
}

export function listStoredMobilePreviewDesktopRecommendationsForSession(
  mobilePreviewId: string,
): MobilePreviewDesktopRecommendation[] {
  return [...desktopRecommendations.values()].filter((r) => r.mobilePreviewId === mobilePreviewId);
}

export function resetMobilePreviewLinkCounterForTests(): void {
  previewLinkCounter = 0;
}

export function resetMobilePreviewDesktopRecommendationCounterForTests(): void {
  desktopRecommendationCounter = 0;
}
