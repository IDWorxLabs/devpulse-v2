/**
 * Autonomous Builder Foundation — diagnostics tracker.
 */

import { listStoredAutonomousBuildRecords, listStoredAutonomousBuildLifecycleEvents } from './autonomous-builder-store.js';
import { detectAutonomousBuildDeliveryMismatch } from './autonomous-builder-delivery-bridge.js';
import { detectAutonomousBuildPushMismatch } from './autonomous-builder-push-bridge.js';
import { detectAutonomousBuildNotificationMismatch } from './autonomous-builder-notification-bridge.js';
import { detectAutonomousBuildInboxMismatch } from './autonomous-builder-inbox-bridge.js';
import { detectAutonomousBuildCloudMismatch } from './autonomous-builder-cloud-bridge.js';
import { detectAutonomousBuildWorld2Mismatch } from './autonomous-builder-world2-bridge.js';
import { detectAutonomousBuildAiDevMismatch } from './autonomous-builder-aidev-bridge.js';
import type { AutonomousBuildDiagnostics, AutonomousBuildState } from './autonomous-builder-types.js';

let diagnostics: AutonomousBuildDiagnostics = {
  buildPlanningActive: true,
  registeredBuildCount: 0,
  planningBuildCount: 0,
  readyBuildCount: 0,
  waitingBuildCount: 0,
  inProgressBuildCount: 0,
  pausedBuildCount: 0,
  blockedBuildCount: 0,
  completedBuildCount: 0,
  failedBuildCount: 0,
  archivedBuildCount: 0,
  duplicateRiskCount: 0,
  deliveryMismatchCount: 0,
  pushMismatchCount: 0,
  notificationMismatchCount: 0,
  inboxMismatchCount: 0,
  cloudMismatchCount: 0,
  world2MismatchCount: 0,
  aidevMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getAutonomousBuildDiagnostics(): AutonomousBuildDiagnostics {
  return { ...diagnostics };
}

export function updateAutonomousBuildDiagnostics(
  query: string,
  lastState: AutonomousBuildState | null,
  duplicateRiskCount = 0,
): AutonomousBuildDiagnostics {
  const records = listStoredAutonomousBuildRecords();
  diagnostics = {
    buildPlanningActive: true,
    registeredBuildCount: records.length,
    planningBuildCount: records.filter((r) =>
      ['PLANNING', 'READY', 'WAITING', 'IN_PROGRESS', 'COMPLETED'].includes(r.buildState),
    ).length,
    readyBuildCount: records.filter((r) => r.buildState === 'READY' || r.buildState === 'COMPLETED').length,
    waitingBuildCount: records.filter((r) => r.buildState === 'WAITING').length,
    inProgressBuildCount: records.filter((r) => r.buildState === 'IN_PROGRESS').length,
    pausedBuildCount: records.filter((r) => r.buildState === 'PAUSED').length,
    blockedBuildCount: records.filter((r) => r.buildState === 'BLOCKED').length,
    completedBuildCount: records.filter((r) => r.buildState === 'COMPLETED').length,
    failedBuildCount: records.filter((r) => r.buildState === 'FAILED').length,
    archivedBuildCount: records.filter((r) => r.buildState === 'ARCHIVED').length,
    duplicateRiskCount,
    deliveryMismatchCount: records.filter((r) => detectAutonomousBuildDeliveryMismatch(r.autonomousBuildId)).length,
    pushMismatchCount: records.filter((r) => detectAutonomousBuildPushMismatch(r.autonomousBuildId)).length,
    notificationMismatchCount: records.filter((r) => detectAutonomousBuildNotificationMismatch(r.autonomousBuildId)).length,
    inboxMismatchCount: records.filter((r) => detectAutonomousBuildInboxMismatch(r.autonomousBuildId)).length,
    cloudMismatchCount: records.filter((r) => detectAutonomousBuildCloudMismatch(r.autonomousBuildId)).length,
    world2MismatchCount: records.filter((r) => detectAutonomousBuildWorld2Mismatch(r.autonomousBuildId)).length,
    aidevMismatchCount: records.filter((r) => detectAutonomousBuildAiDevMismatch(r.autonomousBuildId)).length,
    lastQuery: query,
    lastState,
  };
  return getAutonomousBuildDiagnostics();
}

export function resetAutonomousBuildDiagnosticsForTests(): void {
  diagnostics = {
    buildPlanningActive: true,
    registeredBuildCount: 0,
    planningBuildCount: 0,
    readyBuildCount: 0,
    waitingBuildCount: 0,
    inProgressBuildCount: 0,
    pausedBuildCount: 0,
    blockedBuildCount: 0,
    completedBuildCount: 0,
    failedBuildCount: 0,
    archivedBuildCount: 0,
    duplicateRiskCount: 0,
    deliveryMismatchCount: 0,
    pushMismatchCount: 0,
    notificationMismatchCount: 0,
    inboxMismatchCount: 0,
    cloudMismatchCount: 0,
    world2MismatchCount: 0,
    aidevMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runAutonomousBuildDiagnosticsScan(): AutonomousBuildDiagnostics {
  return updateAutonomousBuildDiagnostics(diagnostics.lastQuery ?? 'scan', diagnostics.lastState);
}

export function getAutonomousBuildLifecycleEventCount(): number {
  return listStoredAutonomousBuildLifecycleEvents().length;
}
