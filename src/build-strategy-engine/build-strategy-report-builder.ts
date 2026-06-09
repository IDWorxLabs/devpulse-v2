/**
 * Build Strategy Engine — report builder.
 */

import {
  listStoredBuildStrategyRecords,
  listStoredBuildStrategyLifecycleEvents,
  nextBuildStrategyReportId,
  resetBuildStrategyReportCounterForTests as resetStoreReportCounterForTests,
} from './build-strategy-store.js';
import { getBuildStrategyHistory } from './build-strategy-history.js';
import { getBuildStrategyDiagnostics, runBuildStrategyDiagnosticsScan } from './build-strategy-diagnostics.js';
import { detectBuildStrategyDeliveryMismatch } from './build-strategy-delivery-bridge.js';
import { detectBuildStrategyPushMismatch } from './build-strategy-push-bridge.js';
import { detectBuildStrategyNotificationMismatch } from './build-strategy-notification-bridge.js';
import { detectBuildStrategyInboxMismatch } from './build-strategy-inbox-bridge.js';
import { detectBuildStrategyCloudMismatch } from './build-strategy-cloud-bridge.js';
import { detectBuildStrategyWorld2Mismatch } from './build-strategy-world2-bridge.js';
import { detectBuildStrategyAiDevMismatch } from './build-strategy-aidev-bridge.js';
import { detectBuildStrategyAutonomousBuilderMismatch } from './build-strategy-autonomous-builder-bridge.js';
import { listBuildStrategyLifecycleEvents } from './build-strategy-lifecycle.js';
import { isBuildStrategyEngineQuestion } from './build-strategy-types.js';
import type { BuildStrategyReport, BuildStrategyReportType } from './build-strategy-types.js';

export function resetBuildStrategyReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: BuildStrategyReportType, summary: string, findings: string[]): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const events = listStoredBuildStrategyLifecycleEvents();
  return {
    reportId: nextBuildStrategyReportId(),
    reportType,
    generatedAt: Date.now(),
    strategyRecordCount: records.length,
    lifecycleEventCount: events.length,
    summary,
    findings,
    strategyOnly: true,
  };
}

export function buildBuildStrategyInventoryReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId} — ${r.strategyMetadata.strategyName} (${r.strategyCategory}) state=${r.strategyState} autonomousBuild=${r.autonomousBuildId}`,
  );
  return buildReport(
    'BUILD_STRATEGY_INVENTORY_REPORT',
    `Build strategy inventory — ${records.length} records`,
    findings.length ? findings : ['No strategy records'],
  );
}

export function buildBuildStrategyOwnershipReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: project=${r.strategyOwnership.projectId} autonomousBuild=${r.strategyOwnership.autonomousBuildId} push=${r.strategyOwnership.pushId}`,
  );
  return buildReport('BUILD_STRATEGY_OWNERSHIP_REPORT', `Ownership — ${records.length} records`, findings.length ? findings : ['No ownership records']);
}

export function buildBuildStrategyClassificationReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyClassification !== null);
  const findings = records.map(
    (r) => `${r.buildStrategyId}: classification=${r.strategyClassification?.classificationId} ${r.strategyClassification?.category}`,
  );
  return buildReport('BUILD_STRATEGY_CLASSIFICATION_REPORT', `Classifications — ${records.length} records`, findings.length ? findings : ['No classifications']);
}

export function buildBuildStrategyModeReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyMode !== null);
  const findings = records.map((r) => `${r.buildStrategyId}: mode=${r.strategyMode?.modeId} ${r.strategyMode?.buildMode}`);
  return buildReport('BUILD_STRATEGY_MODE_REPORT', `Modes — ${records.length} records`, findings.length ? findings : ['No mode selections']);
}

export function buildBuildStrategyAutonomyReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyAutonomy !== null);
  const findings = records.map((r) => `${r.buildStrategyId}: autonomy=${r.strategyAutonomy?.autonomyId} ${r.strategyAutonomy?.autonomyLevel}`);
  return buildReport('BUILD_STRATEGY_AUTONOMY_REPORT', `Autonomy — ${records.length} records`, findings.length ? findings : ['No autonomy selections']);
}

export function buildBuildStrategyRiskReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyRisk !== null);
  const findings = records.map((r) => `${r.buildStrategyId}: risk=${r.strategyRisk?.riskId} level=${r.strategyRisk?.riskLevel}`);
  return buildReport('BUILD_STRATEGY_RISK_REPORT', `Risk — ${records.length} records`, findings.length ? findings : ['No risk evaluations']);
}

export function buildBuildStrategyConfidenceReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyConfidence !== null);
  const findings = records.map((r) => `${r.buildStrategyId}: confidence=${r.strategyConfidence?.confidenceId} level=${r.strategyConfidence?.confidenceLevel}`);
  return buildReport('BUILD_STRATEGY_CONFIDENCE_REPORT', `Confidence — ${records.length} records`, findings.length ? findings : ['No confidence evaluations']);
}

export function buildBuildStrategyDepthReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyDepth !== null);
  const findings = records.map((r) => `${r.buildStrategyId}: depth=${r.strategyDepth?.depthId} ${r.strategyDepth?.buildDepth}`);
  return buildReport('BUILD_STRATEGY_DEPTH_REPORT', `Depth — ${records.length} records`, findings.length ? findings : ['No depth selections']);
}

export function buildBuildStrategyStagesReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyStages.length > 0);
  const findings = records.flatMap((r) =>
    r.strategyStages.map((s) => `${r.buildStrategyId}: stage=${s.stageId} ${s.stageName}`),
  );
  return buildReport('BUILD_STRATEGY_STAGES_REPORT', `Stages — ${findings.length} entries`, findings.length ? findings : ['No stage recommendations']);
}

export function buildBuildStrategyReadinessReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyReadiness !== null);
  const findings = records.map(
    (r) => `${r.buildStrategyId}: ready=${r.strategyReadiness?.ready} reason=${r.strategyReadiness?.readinessReason}`,
  );
  return buildReport('BUILD_STRATEGY_READINESS_REPORT', `Readiness — ${records.length} records`, findings.length ? findings : ['No readiness evaluations']);
}

export function buildBuildStrategyConstraintReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyConstraints.length > 0);
  const findings = records.flatMap((r) =>
    r.strategyConstraints.map((c) => `${r.buildStrategyId}: constraint=${c.constraintId} ${c.constraintName}`),
  );
  return buildReport('BUILD_STRATEGY_CONSTRAINT_REPORT', `Constraints — ${findings.length} entries`, findings.length ? findings : ['No constraints']);
}

export function buildBuildStrategyDependencyReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyDependencies.length > 0);
  const findings = records.flatMap((r) =>
    r.strategyDependencies.map((d) => `${r.buildStrategyId}: dependency=${d.dependencyId} ${d.dependencyName}`),
  );
  return buildReport('BUILD_STRATEGY_DEPENDENCY_REPORT', `Dependencies — ${findings.length} entries`, findings.length ? findings : ['No dependencies']);
}

export function buildBuildStrategyPolicyReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords().filter((r) => r.strategyPolicy !== null);
  const findings = records.map((r) => `${r.buildStrategyId}: policy=${r.strategyPolicy?.policyId} ${r.strategyPolicy?.policyName}`);
  return buildReport('BUILD_STRATEGY_POLICY_REPORT', `Policy — ${records.length} records`, findings.length ? findings : ['No policies']);
}

export function buildBuildStrategyContextReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) => `${r.buildStrategyId}: project=${r.strategyContext.projectId} autonomousBuild=${r.strategyContext.autonomousBuildId}`,
  );
  return buildReport('BUILD_STRATEGY_CONTEXT_REPORT', `Context — ${records.length} records`, findings.length ? findings : ['No context']);
}

export function buildBuildStrategyStateReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map((r) => `${r.buildStrategyId}: ${r.strategyState}`);
  return buildReport('BUILD_STRATEGY_STATE_REPORT', `State — ${records.length} records`, findings.length ? findings : ['No state records']);
}

export function buildBuildStrategyLifecycleReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.flatMap((r) =>
    listBuildStrategyLifecycleEvents(r.buildStrategyId).map((e) => `${r.buildStrategyId}: ${e.eventType} → ${e.newState}`),
  );
  return buildReport('BUILD_STRATEGY_LIFECYCLE_REPORT', `Lifecycle — ${findings.length} events`, findings.length ? findings : ['No lifecycle events']);
}

export function buildBuildStrategyHistoryReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const allHistory = records.flatMap((r) => getBuildStrategyHistory(r.buildStrategyId));
  const findings = allHistory.slice(-20).map((e) => `${e.buildStrategyId} [${e.category}]: ${e.summary}`);
  return buildReport('BUILD_STRATEGY_HISTORY_REPORT', `History — ${allHistory.length} entries`, findings.length ? findings : ['No history']);
}

export function buildBuildStrategyDiagnosticsReport(): BuildStrategyReport {
  const diag = getBuildStrategyDiagnostics();
  runBuildStrategyDiagnosticsScan();
  const findings = [
    `Strategy planning active: ${diag.strategyPlanningActive}`,
    `Registered strategies: ${diag.registeredStrategyCount}`,
    `Completed: ${diag.completedStrategyCount}`,
    `Autonomous builder mismatches: ${diag.autonomousBuilderMismatchCount}`,
    `Delivery mismatches: ${diag.deliveryMismatchCount}`,
  ];
  return buildReport('BUILD_STRATEGY_DIAGNOSTICS_REPORT', 'Diagnostics — strategy planning validation only', findings);
}

export function buildBuildStrategyCloudReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) => `${r.buildStrategyId}: runtime=${r.strategyCloudLink.runtimeId} mismatch=${detectBuildStrategyCloudMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_CLOUD_REPORT', `Cloud links — ${records.length}`, findings.length ? findings : ['No cloud links']);
}

export function buildBuildStrategyWorld2Report(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: world2=${r.strategyWorld2Link.world2OperationId} mismatch=${detectBuildStrategyWorld2Mismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_WORLD2_REPORT', `World2 links — ${records.length}`, findings.length ? findings : ['No world2 links']);
}

export function buildBuildStrategyAiDevReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: aidev=${r.strategyAiDevLink.aidevOperationId} mismatch=${detectBuildStrategyAiDevMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_AIDEV_REPORT', `AiDev links — ${records.length}`, findings.length ? findings : ['No aidev links']);
}

export function buildBuildStrategyProjectVaultReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: vault=${r.strategyProjectVaultLink.vaultProjectId} mismatch=${r.strategyProjectVaultLink.mismatchDetected}`,
  );
  return buildReport('BUILD_STRATEGY_PROJECT_VAULT_REPORT', `Project vault links — ${records.length}`, findings.length ? findings : ['No project vault links']);
}

export function buildBuildStrategyOperatorFeedReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: feed=${r.strategyOperatorFeedLink.feedAuthorityId} mismatch=${r.strategyOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport('BUILD_STRATEGY_OPERATOR_FEED_REPORT', `Operator feed links — ${records.length}`, findings.length ? findings : ['No operator feed links']);
}

export function buildBuildStrategyNotificationReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: notification=${r.strategyNotificationLink.notificationId} mismatch=${detectBuildStrategyNotificationMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_NOTIFICATION_REPORT', `Notification links — ${records.length}`, findings.length ? findings : ['No notification links']);
}

export function buildBuildStrategyInboxReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: inbox=${r.strategyInboxLink.inboxEntryId} mismatch=${detectBuildStrategyInboxMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_INBOX_REPORT', `Inbox links — ${records.length}`, findings.length ? findings : ['No inbox links']);
}

export function buildBuildStrategyDeliveryReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: delivery=${r.strategyDeliveryLink.deliveryId} mismatch=${detectBuildStrategyDeliveryMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_DELIVERY_REPORT', `Delivery links — ${records.length}`, findings.length ? findings : ['No delivery links']);
}

export function buildBuildStrategyPushReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: push=${r.strategyPushLink.pushId} mismatch=${detectBuildStrategyPushMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_PUSH_REPORT', `Push links — ${records.length}`, findings.length ? findings : ['No push links']);
}

export function buildBuildStrategyAutonomousBuilderReport(): BuildStrategyReport {
  const records = listStoredBuildStrategyRecords();
  const findings = records.map(
    (r) =>
      `${r.buildStrategyId}: autonomousBuild=${r.strategyAutonomousBuilderLink.autonomousBuildId} mismatch=${detectBuildStrategyAutonomousBuilderMismatch(r.buildStrategyId)}`,
  );
  return buildReport('BUILD_STRATEGY_AUTONOMOUS_BUILDER_REPORT', `Autonomous builder links — ${records.length}`, findings.length ? findings : ['No autonomous builder links']);
}

export function buildAllBuildStrategyReports(): BuildStrategyReport[] {
  return [
    buildBuildStrategyInventoryReport(),
    buildBuildStrategyOwnershipReport(),
    buildBuildStrategyClassificationReport(),
    buildBuildStrategyModeReport(),
    buildBuildStrategyAutonomyReport(),
    buildBuildStrategyRiskReport(),
    buildBuildStrategyConfidenceReport(),
    buildBuildStrategyDepthReport(),
    buildBuildStrategyStagesReport(),
    buildBuildStrategyReadinessReport(),
    buildBuildStrategyConstraintReport(),
    buildBuildStrategyDependencyReport(),
    buildBuildStrategyPolicyReport(),
    buildBuildStrategyContextReport(),
    buildBuildStrategyStateReport(),
    buildBuildStrategyLifecycleReport(),
    buildBuildStrategyHistoryReport(),
    buildBuildStrategyDiagnosticsReport(),
    buildBuildStrategyCloudReport(),
    buildBuildStrategyWorld2Report(),
    buildBuildStrategyAiDevReport(),
    buildBuildStrategyProjectVaultReport(),
    buildBuildStrategyOperatorFeedReport(),
    buildBuildStrategyNotificationReport(),
    buildBuildStrategyInboxReport(),
    buildBuildStrategyDeliveryReport(),
    buildBuildStrategyPushReport(),
    buildBuildStrategyAutonomousBuilderReport(),
  ];
}

export function composeBuildStrategyResponse(
  query: string,
  record: import('./build-strategy-types.js').BuildStrategySession | null,
  reports: BuildStrategyReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Build Strategy Engine: BLOCKED' : 'Build Strategy Engine: READY');
  lines.push(`Query: ${query}`);
  if (record) {
    lines.push(`Strategy: ${record.buildStrategyId} — ${record.strategyMetadata.strategyName}`);
    lines.push(`Autonomous Build Ref: ${record.autonomousBuildId} Push Ref: ${record.pushId}`);
    lines.push(`State: ${record.strategyState}`);
    lines.push(`Category: ${record.strategyCategory}`);
  }
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Strategy/planning only — no code modification, execution, builds, tests, fixes, or deploys.');
  return lines.join('\n');
}

export function buildBuildStrategyFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isBuildStrategyEngineQuestion(query)) return [];
  return [
    {
      title: 'Strategy record registration blocked',
      description: 'Registration rejected due to missing autonomous builder reference or duplicate build strategy authority risk.',
      sourceSystem: 'build_strategy_engine',
    },
    {
      title: 'Strategy planning blocked',
      description: 'Strategy pipeline could not be finalized — inspect autonomous builder upstream authority.',
      sourceSystem: 'build_strategy_engine',
    },
    {
      title: 'Readiness evaluation deferred',
      description: 'Readiness could not complete — missing classification, mode, autonomy, risk, confidence, depth, or stages.',
      sourceSystem: 'build_strategy_engine',
    },
    {
      title: 'Strategy link mismatch',
      description: 'Link metadata mismatch detected — verify autonomous builder and push links.',
      sourceSystem: 'build_strategy_engine',
    },
  ];
}
