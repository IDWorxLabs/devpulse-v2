/**
 * Build Strategy Engine — diagnostics tracker.
 */

import { listStoredBuildStrategyRecords, listStoredBuildStrategyLifecycleEvents } from './build-strategy-store.js';
import { detectBuildStrategyDeliveryMismatch } from './build-strategy-delivery-bridge.js';
import { detectBuildStrategyPushMismatch } from './build-strategy-push-bridge.js';
import { detectBuildStrategyNotificationMismatch } from './build-strategy-notification-bridge.js';
import { detectBuildStrategyInboxMismatch } from './build-strategy-inbox-bridge.js';
import { detectBuildStrategyCloudMismatch } from './build-strategy-cloud-bridge.js';
import { detectBuildStrategyWorld2Mismatch } from './build-strategy-world2-bridge.js';
import { detectBuildStrategyAiDevMismatch } from './build-strategy-aidev-bridge.js';
import { detectBuildStrategyAutonomousBuilderMismatch } from './build-strategy-autonomous-builder-bridge.js';
import type { BuildStrategyDiagnostics, BuildStrategyState } from './build-strategy-types.js';

let diagnostics: BuildStrategyDiagnostics = {
  strategyPlanningActive: true,
  registeredStrategyCount: 0,
  classifiedStrategyCount: 0,
  modeSelectedCount: 0,
  autonomySelectedCount: 0,
  riskEvaluatedCount: 0,
  confidenceEvaluatedCount: 0,
  depthSelectedCount: 0,
  stagesRecommendedCount: 0,
  readyStrategyCount: 0,
  blockedStrategyCount: 0,
  completedStrategyCount: 0,
  failedStrategyCount: 0,
  archivedStrategyCount: 0,
  duplicateRiskCount: 0,
  autonomousBuilderMismatchCount: 0,
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

export function getBuildStrategyDiagnostics(): BuildStrategyDiagnostics {
  return { ...diagnostics };
}

export function updateBuildStrategyDiagnostics(
  query: string,
  lastState: BuildStrategyState | null,
  duplicateRiskCount = 0,
): BuildStrategyDiagnostics {
  const records = listStoredBuildStrategyRecords();
  diagnostics = {
    strategyPlanningActive: true,
    registeredStrategyCount: records.length,
    classifiedStrategyCount: records.filter((r) => r.strategyClassification !== null).length,
    modeSelectedCount: records.filter((r) => r.strategyMode !== null).length,
    autonomySelectedCount: records.filter((r) => r.strategyAutonomy !== null).length,
    riskEvaluatedCount: records.filter((r) => r.strategyRisk !== null).length,
    confidenceEvaluatedCount: records.filter((r) => r.strategyConfidence !== null).length,
    depthSelectedCount: records.filter((r) => r.strategyDepth !== null).length,
    stagesRecommendedCount: records.filter((r) => r.strategyStages.length > 0).length,
    readyStrategyCount: records.filter((r) => r.strategyState === 'READY' || r.strategyState === 'COMPLETED').length,
    blockedStrategyCount: records.filter((r) => r.strategyState === 'BLOCKED').length,
    completedStrategyCount: records.filter((r) => r.strategyState === 'COMPLETED').length,
    failedStrategyCount: records.filter((r) => r.strategyState === 'FAILED').length,
    archivedStrategyCount: records.filter((r) => r.strategyState === 'ARCHIVED').length,
    duplicateRiskCount,
    autonomousBuilderMismatchCount: records.filter((r) => detectBuildStrategyAutonomousBuilderMismatch(r.buildStrategyId)).length,
    deliveryMismatchCount: records.filter((r) => detectBuildStrategyDeliveryMismatch(r.buildStrategyId)).length,
    pushMismatchCount: records.filter((r) => detectBuildStrategyPushMismatch(r.buildStrategyId)).length,
    notificationMismatchCount: records.filter((r) => detectBuildStrategyNotificationMismatch(r.buildStrategyId)).length,
    inboxMismatchCount: records.filter((r) => detectBuildStrategyInboxMismatch(r.buildStrategyId)).length,
    cloudMismatchCount: records.filter((r) => detectBuildStrategyCloudMismatch(r.buildStrategyId)).length,
    world2MismatchCount: records.filter((r) => detectBuildStrategyWorld2Mismatch(r.buildStrategyId)).length,
    aidevMismatchCount: records.filter((r) => detectBuildStrategyAiDevMismatch(r.buildStrategyId)).length,
    lastQuery: query,
    lastState,
  };
  return getBuildStrategyDiagnostics();
}

export function resetBuildStrategyDiagnosticsForTests(): void {
  diagnostics = {
    strategyPlanningActive: true,
    registeredStrategyCount: 0,
    classifiedStrategyCount: 0,
    modeSelectedCount: 0,
    autonomySelectedCount: 0,
    riskEvaluatedCount: 0,
    confidenceEvaluatedCount: 0,
    depthSelectedCount: 0,
    stagesRecommendedCount: 0,
    readyStrategyCount: 0,
    blockedStrategyCount: 0,
    completedStrategyCount: 0,
    failedStrategyCount: 0,
    archivedStrategyCount: 0,
    duplicateRiskCount: 0,
    autonomousBuilderMismatchCount: 0,
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

export function runBuildStrategyDiagnosticsScan(): BuildStrategyDiagnostics {
  return updateBuildStrategyDiagnostics(diagnostics.lastQuery ?? 'scan', diagnostics.lastState);
}

export function getBuildStrategyLifecycleEventCount(): number {
  return listStoredBuildStrategyLifecycleEvents().length;
}
