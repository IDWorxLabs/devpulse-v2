/**
 * Autonomous Builder Foundation — report builder.
 */

import {
  listStoredAutonomousBuildRecords,
  listStoredAutonomousBuildLifecycleEvents,
  nextAutonomousBuildReportId,
  resetAutonomousBuilderReportCounterForTests as resetStoreReportCounterForTests,
} from './autonomous-builder-store.js';
import { getAutonomousBuildHistory } from './autonomous-builder-history.js';
import { getAutonomousBuildDiagnostics, runAutonomousBuildDiagnosticsScan } from './autonomous-builder-diagnostics.js';
import { detectAutonomousBuildDeliveryMismatch } from './autonomous-builder-delivery-bridge.js';
import { detectAutonomousBuildPushMismatch } from './autonomous-builder-push-bridge.js';
import { detectAutonomousBuildNotificationMismatch } from './autonomous-builder-notification-bridge.js';
import { detectAutonomousBuildInboxMismatch } from './autonomous-builder-inbox-bridge.js';
import { detectAutonomousBuildCloudMismatch } from './autonomous-builder-cloud-bridge.js';
import { detectAutonomousBuildWorld2Mismatch } from './autonomous-builder-world2-bridge.js';
import { detectAutonomousBuildAiDevMismatch } from './autonomous-builder-aidev-bridge.js';
import { listAutonomousBuildLifecycleEvents } from './autonomous-builder-lifecycle.js';
import { isAutonomousBuilderFoundationQuestion } from './autonomous-builder-types.js';
import type { AutonomousBuildReport, AutonomousBuildReportType } from './autonomous-builder-types.js';

export function resetAutonomousBuilderReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: AutonomousBuildReportType, summary: string, findings: string[]): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const events = listStoredAutonomousBuildLifecycleEvents();
  return {
    reportId: nextAutonomousBuildReportId(),
    reportType,
    generatedAt: Date.now(),
    buildRecordCount: records.length,
    lifecycleEventCount: events.length,
    summary,
    findings,
    planningOnly: true,
  };
}

export function buildAutonomousBuildInventoryReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId} — ${r.buildMetadata.buildName} (${r.buildCategory}) state=${r.buildState} push=${r.pushId}`,
  );
  return buildReport(
    'AUTONOMOUS_BUILD_INVENTORY_REPORT',
    `Autonomous build inventory — ${records.length} records`,
    findings.length ? findings : ['No build records'],
  );
}

export function buildAutonomousBuildOwnershipReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: project=${r.buildOwnership.projectId} push=${r.buildOwnership.pushId} delivery=${r.buildOwnership.deliveryId}`,
  );
  return buildReport('AUTONOMOUS_BUILD_OWNERSHIP_REPORT', `Ownership — ${records.length} records`, findings.length ? findings : ['No ownership records']);
}

export function buildAutonomousBuildGoalReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords().filter((r) => r.buildGoal !== null);
  const findings = records.map((r) => `${r.autonomousBuildId}: goal=${r.buildGoal?.goalId} ${r.buildGoal?.goalName}`);
  return buildReport('AUTONOMOUS_BUILD_GOAL_REPORT', `Goals — ${records.length} records`, findings.length ? findings : ['No goals']);
}

export function buildAutonomousBuildPlanReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords().filter((r) => r.buildPlan !== null);
  const findings = records.map((r) => `${r.autonomousBuildId}: plan=${r.buildPlan?.planId} ${r.buildPlan?.planName}`);
  return buildReport('AUTONOMOUS_BUILD_PLAN_REPORT', `Plans — ${records.length} records`, findings.length ? findings : ['No plans']);
}

export function buildAutonomousBuildStageReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords().filter((r) => r.buildStages.length > 0);
  const findings = records.flatMap((r) =>
    r.buildStages.map((s) => `${r.autonomousBuildId}: stage=${s.stageId} ${s.stageName}`),
  );
  return buildReport('AUTONOMOUS_BUILD_STAGE_REPORT', `Stages — ${findings.length} entries`, findings.length ? findings : ['No stages']);
}

export function buildAutonomousBuildReadinessReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords().filter((r) => r.buildReadiness !== null);
  const findings = records.map(
    (r) => `${r.autonomousBuildId}: ready=${r.buildReadiness?.ready} reason=${r.buildReadiness?.readinessReason}`,
  );
  return buildReport('AUTONOMOUS_BUILD_READINESS_REPORT', `Readiness — ${records.length} records`, findings.length ? findings : ['No readiness evaluations']);
}

export function buildAutonomousBuildConstraintReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords().filter((r) => r.buildConstraints.length > 0);
  const findings = records.flatMap((r) =>
    r.buildConstraints.map((c) => `${r.autonomousBuildId}: constraint=${c.constraintId} ${c.constraintName}`),
  );
  return buildReport('AUTONOMOUS_BUILD_CONSTRAINT_REPORT', `Constraints — ${findings.length} entries`, findings.length ? findings : ['No constraints']);
}

export function buildAutonomousBuildCapabilityReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords().filter((r) => r.buildCapabilities.length > 0);
  const findings = records.flatMap((r) =>
    r.buildCapabilities.map((c) => `${r.autonomousBuildId}: capability=${c.capabilityId} ${c.capabilityName}`),
  );
  return buildReport('AUTONOMOUS_BUILD_CAPABILITY_REPORT', `Capabilities — ${findings.length} entries`, findings.length ? findings : ['No capabilities']);
}

export function buildAutonomousBuildContextReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) => `${r.autonomousBuildId}: project=${r.buildContext.projectId} push=${r.buildContext.pushId}`,
  );
  return buildReport('AUTONOMOUS_BUILD_CONTEXT_REPORT', `Context — ${records.length} records`, findings.length ? findings : ['No context']);
}

export function buildAutonomousBuildStateReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map((r) => `${r.autonomousBuildId}: ${r.buildState}`);
  return buildReport('AUTONOMOUS_BUILD_STATE_REPORT', `State — ${records.length} records`, findings.length ? findings : ['No state records']);
}

export function buildAutonomousBuildLifecycleReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.flatMap((r) =>
    listAutonomousBuildLifecycleEvents(r.autonomousBuildId).map((e) => `${r.autonomousBuildId}: ${e.eventType} → ${e.newState}`),
  );
  return buildReport('AUTONOMOUS_BUILD_LIFECYCLE_REPORT', `Lifecycle — ${findings.length} events`, findings.length ? findings : ['No lifecycle events']);
}

export function buildAutonomousBuildHistoryReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const allHistory = records.flatMap((r) => getAutonomousBuildHistory(r.autonomousBuildId));
  const findings = allHistory.slice(-20).map((e) => `${e.autonomousBuildId} [${e.category}]: ${e.summary}`);
  return buildReport('AUTONOMOUS_BUILD_HISTORY_REPORT', `History — ${allHistory.length} entries`, findings.length ? findings : ['No history']);
}

export function buildAutonomousBuildDiagnosticsReport(): AutonomousBuildReport {
  const diag = getAutonomousBuildDiagnostics();
  runAutonomousBuildDiagnosticsScan();
  const findings = [
    `Planning active: ${diag.buildPlanningActive}`,
    `Registered builds: ${diag.registeredBuildCount}`,
    `Completed: ${diag.completedBuildCount}`,
    `Delivery mismatches: ${diag.deliveryMismatchCount}`,
    `Push mismatches: ${diag.pushMismatchCount}`,
  ];
  return buildReport('AUTONOMOUS_BUILD_DIAGNOSTICS_REPORT', 'Diagnostics — planning validation only', findings);
}

export function buildAutonomousBuildCloudReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) => `${r.autonomousBuildId}: runtime=${r.buildCloudLink.runtimeId} mismatch=${detectAutonomousBuildCloudMismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_CLOUD_REPORT', `Cloud links — ${records.length}`, findings.length ? findings : ['No cloud links']);
}

export function buildAutonomousBuildWorld2Report(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: world2=${r.buildWorld2Link.world2OperationId} mismatch=${detectAutonomousBuildWorld2Mismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_WORLD2_REPORT', `World2 links — ${records.length}`, findings.length ? findings : ['No world2 links']);
}

export function buildAutonomousBuildAiDevReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: aidev=${r.buildAiDevLink.aidevOperationId} mismatch=${detectAutonomousBuildAiDevMismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_AIDEV_REPORT', `AiDev links — ${records.length}`, findings.length ? findings : ['No aidev links']);
}

export function buildAutonomousBuildProjectVaultReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: vault=${r.buildProjectVaultLink.vaultProjectId} mismatch=${r.buildProjectVaultLink.mismatchDetected}`,
  );
  return buildReport('AUTONOMOUS_BUILD_PROJECT_VAULT_REPORT', `Project vault links — ${records.length}`, findings.length ? findings : ['No project vault links']);
}

export function buildAutonomousBuildOperatorFeedReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: feed=${r.buildOperatorFeedLink.feedAuthorityId} mismatch=${r.buildOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport('AUTONOMOUS_BUILD_OPERATOR_FEED_REPORT', `Operator feed links — ${records.length}`, findings.length ? findings : ['No operator feed links']);
}

export function buildAutonomousBuildNotificationReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: notification=${r.buildNotificationLink.notificationId} mismatch=${detectAutonomousBuildNotificationMismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_NOTIFICATION_REPORT', `Notification links — ${records.length}`, findings.length ? findings : ['No notification links']);
}

export function buildAutonomousBuildInboxReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: inbox=${r.buildInboxLink.inboxEntryId} mismatch=${detectAutonomousBuildInboxMismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_INBOX_REPORT', `Inbox links — ${records.length}`, findings.length ? findings : ['No inbox links']);
}

export function buildAutonomousBuildDeliveryReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: delivery=${r.buildDeliveryLink.deliveryId} mismatch=${detectAutonomousBuildDeliveryMismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_DELIVERY_REPORT', `Delivery links — ${records.length}`, findings.length ? findings : ['No delivery links']);
}

export function buildAutonomousBuildPushReport(): AutonomousBuildReport {
  const records = listStoredAutonomousBuildRecords();
  const findings = records.map(
    (r) =>
      `${r.autonomousBuildId}: push=${r.buildPushLink.pushId} mismatch=${detectAutonomousBuildPushMismatch(r.autonomousBuildId)}`,
  );
  return buildReport('AUTONOMOUS_BUILD_PUSH_REPORT', `Push links — ${records.length}`, findings.length ? findings : ['No push links']);
}

export function buildAllAutonomousBuilderReports(): AutonomousBuildReport[] {
  return [
    buildAutonomousBuildInventoryReport(),
    buildAutonomousBuildOwnershipReport(),
    buildAutonomousBuildGoalReport(),
    buildAutonomousBuildPlanReport(),
    buildAutonomousBuildStageReport(),
    buildAutonomousBuildReadinessReport(),
    buildAutonomousBuildConstraintReport(),
    buildAutonomousBuildCapabilityReport(),
    buildAutonomousBuildContextReport(),
    buildAutonomousBuildStateReport(),
    buildAutonomousBuildLifecycleReport(),
    buildAutonomousBuildHistoryReport(),
    buildAutonomousBuildDiagnosticsReport(),
    buildAutonomousBuildCloudReport(),
    buildAutonomousBuildWorld2Report(),
    buildAutonomousBuildAiDevReport(),
    buildAutonomousBuildProjectVaultReport(),
    buildAutonomousBuildOperatorFeedReport(),
    buildAutonomousBuildNotificationReport(),
    buildAutonomousBuildInboxReport(),
    buildAutonomousBuildDeliveryReport(),
    buildAutonomousBuildPushReport(),
  ];
}

export function composeAutonomousBuilderResponse(
  query: string,
  record: import('./autonomous-builder-types.js').AutonomousBuildSession | null,
  reports: AutonomousBuildReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Autonomous Builder Foundation: BLOCKED' : 'Autonomous Builder Foundation: READY');
  lines.push(`Query: ${query}`);
  if (record) {
    lines.push(`Build: ${record.autonomousBuildId} — ${record.buildMetadata.buildName}`);
    lines.push(`Push Ref: ${record.pushId} Delivery Ref: ${record.deliveryId}`);
    lines.push(`State: ${record.buildState}`);
    lines.push(`Category: ${record.buildCategory}`);
  }
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Planning only — no code execution, autonomous executor, or deployer.');
  return lines.join('\n');
}

export function buildAutonomousBuilderFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isAutonomousBuilderFoundationQuestion(query)) return [];
  return [
    {
      title: 'Build record registration blocked',
      description: 'Registration rejected due to missing push/delivery reference or duplicate autonomous builder authority risk.',
      sourceSystem: 'autonomous_builder_foundation',
    },
    {
      title: 'Build planning blocked',
      description: 'Planning could not be finalized — inspect mobile push and notification delivery upstream authorities.',
      sourceSystem: 'autonomous_builder_foundation',
    },
    {
      title: 'Readiness evaluation deferred',
      description: 'Readiness could not complete — missing goal, plan, or stages.',
      sourceSystem: 'autonomous_builder_foundation',
    },
    {
      title: 'Build link mismatch',
      description: 'Link metadata mismatch detected — verify push and delivery links.',
      sourceSystem: 'autonomous_builder_foundation',
    },
  ];
}
