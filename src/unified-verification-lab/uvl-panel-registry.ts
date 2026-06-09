/**
 * UVL Panel registry — temporary Validators navigation panel (Phase 16.7).
 */

import { listVerificationProviders } from './verification-provider-registry.js';
import { listVerificationSessions } from './verification-session-manager.js';
import {
  listVerificationTargets,
  listVerificationOwners,
  listVerificationDependencies,
  listVerificationRequirements,
  listVerificationCapabilities,
} from '../verification-registry/index.js';
import { getVerificationOrchestratorContext } from '../verification-orchestrator/index.js';
import { getVerificationEvidenceContext } from '../verification-evidence-engine/index.js';
import { getVerificationReportingContext } from '../verification-reporting-engine/index.js';
import { getUnifiedVerificationContext } from '../unified-verification-entry/index.js';
import { getCloudRuntimeContext } from '../cloud-runtime/index.js';
import { getWorkspaceHostingContext } from '../workspace-hosting/index.js';
import { getPersistentBuildContext } from '../persistent-build-runtime/index.js';
import { getCloudVerificationContext } from '../cloud-verification/index.js';
import { getCloudRecoveryContext } from '../cloud-recovery/index.js';
import { getCloudMonitoringContext } from '../cloud-monitoring/index.js';
import { getMobileCommandContext } from '../mobile-command-runtime/index.js';
import { getMobileChatContext } from '../mobile-chat-runtime/index.js';
import { getMobilePreviewContext } from '../mobile-preview-runtime/index.js';
import { getMobileApprovalContext } from '../mobile-approval-runtime/index.js';
import { getCrossDeviceContext } from '../cross-device-runtime/index.js';
import { getFounderNotificationContext } from '../founder-notification-runtime/index.js';
import { getFounderInboxContext } from '../founder-inbox/index.js';
import { getNotificationDeliveryContext } from '../notification-delivery/index.js';
import { getMobilePushContext } from '../mobile-push/index.js';
import { getBuildStrategyEngineContext } from '../build-strategy-engine/index.js';
import { getAutonomousBuilderContext } from '../autonomous-builder/index.js';
import type { PrepareFounderInboxFoundationResult } from '../founder-inbox/founder-inbox-types.js';
import type { PrepareNotificationDeliveryFoundationResult } from '../notification-delivery/notification-delivery-types.js';
import type { PrepareMobilePushFoundationResult } from '../mobile-push/mobile-push-types.js';
import type { PrepareBuildStrategyEngineResult } from '../build-strategy-engine/build-strategy-types.js';
import type { PrepareAutonomousBuilderFoundationResult } from '../autonomous-builder/autonomous-builder-types.js';
import type { PrepareMobilePreviewRuntimeFoundationResult } from '../mobile-preview-runtime/mobile-preview-types.js';
import type { PrepareMobileApprovalRuntimeFoundationResult } from '../mobile-approval-runtime/mobile-approval-types.js';
import type { PrepareCrossDeviceRuntimeFoundationResult } from '../cross-device-runtime/cross-device-types.js';
import type { PrepareFounderNotificationRuntimeFoundationResult } from '../founder-notification-runtime/founder-notification-types.js';
import type { PrepareMobileCommandRuntimeFoundationResult } from '../mobile-command-runtime/mobile-command-types.js';
import type { PrepareMobileChatRuntimeFoundationResult } from '../mobile-chat-runtime/mobile-chat-types.js';
import type { PrepareCloudMonitoringFoundationResult } from '../cloud-monitoring/cloud-monitoring-types.js';
import type { VerificationRuntimeState } from './types.js';

export interface UvlPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  registeredProviders: string[];
  verificationSessions: string[];
  runtimeState: VerificationRuntimeState;
  providerCount: number;
  sessionCount: number;
  temporary: true;
}

export function buildUvlPanelSnapshot(runtimeState: VerificationRuntimeState = 'READY'): UvlPanelSnapshot {
  const providers = listVerificationProviders();
  const sessions = listVerificationSessions();

  return {
    panelId: 'UNIFIED_VERIFICATION_LAB_RUNTIME',
    panelTitle: 'Unified Verification Lab Runtime',
    navigationPath: 'Left Navigation → Validators',
    registeredProviders: providers.map((p) => `${p.providerName} (${p.providerId})`),
    verificationSessions: sessions.map(
      (s) => `${s.verificationSessionId} — ${s.verificationType} — ${s.sessionState}`,
    ),
    runtimeState,
    providerCount: providers.length,
    sessionCount: sessions.length,
    temporary: true,
  };
}

export interface VerificationRegistryPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  targets: string[];
  owners: string[];
  dependencies: string[];
  requirements: string[];
  capabilities: string[];
  targetCount: number;
  temporary: true;
}

export function buildVerificationRegistryPanelSnapshot(): VerificationRegistryPanelSnapshot {
  const targets = listVerificationTargets().map(
    (t) => `${t.verificationTargetName} (${t.verificationTargetId})`,
  );
  const owners = listVerificationOwners().map((o) => `${o.ownerModule} — ${o.ownerDomain}`);
  const dependencies = listVerificationDependencies().map(
    (d) => `${d.targetId}: ${d.upstreamDependencies.join(', ') || 'none'}`,
  );
  const requirements = listVerificationRequirements().map(
    (r) => `${r.targetId}: ${r.requiredEvidence.join(', ')}`,
  );
  const capabilities = listVerificationCapabilities().map(
    (c) => `${c.targetId}: ${c.supportedModes.join(', ')}`,
  );

  return {
    panelId: 'VERIFICATION_REGISTRY',
    panelTitle: 'Verification Registry',
    navigationPath: 'Left Navigation → Validators',
    targets,
    owners,
    dependencies,
    requirements,
    capabilities,
    targetCount: targets.length,
    temporary: true,
  };
}

export interface VerificationOrchestratorPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  executionPlan: string[];
  executionOrder: string[];
  parallelGroups: string[];
  blockedTargets: string[];
  waitingTargets: string[];
  planCount: number;
  temporary: true;
}

export function buildVerificationOrchestratorPanelSnapshot(
  query = 'What should run first?',
): VerificationOrchestratorPanelSnapshot {
  const ctx = getVerificationOrchestratorContext(query);
  const report = ctx.orchestrationReport;

  return {
    panelId: 'VERIFICATION_ORCHESTRATOR',
    panelTitle: 'Verification Orchestrator',
    navigationPath: 'Left Navigation → Validators',
    executionPlan: ctx.executionPlan.map(
      (p) => `${p.verificationPlanId} — ${p.targetId} — ${p.executionState}`,
    ),
    executionOrder: report.executionOrder,
    parallelGroups: report.parallelGroups.map(
      (g) => `${g.groupId}: ${g.targetIds.join(', ')}`,
    ),
    blockedTargets: report.blockedTargets,
    waitingTargets: report.waitingTargets,
    planCount: ctx.executionPlan.length,
    temporary: true,
  };
}

export interface VerificationEvidencePanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  evidenceInventory: string[];
  ownershipRecords: string[];
  lineageLinks: string[];
  traceabilityKeys: string[];
  evidenceCount: number;
  categoryCount: number;
  temporary: true;
}

export function buildVerificationEvidencePanelSnapshot(
  query = 'What evidence exists?',
): VerificationEvidencePanelSnapshot {
  const ctx = getVerificationEvidenceContext(query);
  const summary = ctx.evidenceSummaryReport;

  return {
    panelId: 'VERIFICATION_EVIDENCE_ENGINE',
    panelTitle: 'Verification Evidence Engine',
    navigationPath: 'Left Navigation → Validators',
    evidenceInventory: ctx.inventoryReport.evidenceIds.map(
      (id) => {
        const record = ctx.evidenceRecords.find((r) => r.evidenceId === id);
        return record ? `${id} — ${record.evidenceType}` : id;
      },
    ),
    ownershipRecords: ctx.ownershipReport.ownershipRecords.map(
      (o) => `${o.evidenceId} — ${o.ownerModule}`,
    ),
    lineageLinks: ctx.lineageReport.lineageLinks
      .filter((l) => l.parents.length > 0 || l.children.length > 0)
      .map((l) => `${l.evidenceId}: ${l.parents.length} parent(s), ${l.children.length} child(ren)`),
    traceabilityKeys: ctx.traceabilityReport.traceabilityIndex.map(
      (t) => `${t.key} (${t.evidenceIds.length})`,
    ),
    evidenceCount: summary.evidenceCount,
    categoryCount: summary.categoryCount,
    temporary: true,
  };
}

export interface VerificationReportingPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  reportInventory: string[];
  reportTypes: string[];
  historyEntries: string[];
  trendFindings: string[];
  reportCount: number;
  exportTargets: string[];
  temporary: true;
}

export function buildVerificationReportingPanelSnapshot(
  query = 'What happened in verification?',
): VerificationReportingPanelSnapshot {
  const ctx = getVerificationReportingContext(query);

  return {
    panelId: 'VERIFICATION_REPORTING_ENGINE',
    panelTitle: 'Verification Reporting Engine',
    navigationPath: 'Left Navigation → Validators',
    reportInventory: ctx.reports.map((r) => `${r.reportId} — ${r.reportType}`),
    reportTypes: [...new Set(ctx.reports.map((r) => r.reportType))],
    historyEntries: ctx.historyEntries.slice(-8).map(
      (h) => `${h.event} — ${h.reportType} — ${h.reportId}`,
    ),
    trendFindings:
      ctx.reports.find((r) => r.reportType === 'VERIFICATION_TREND_REPORT')?.reportFindings.slice(0, 4) ?? [],
    reportCount: ctx.reports.length,
    exportTargets: ['JSON', 'Founder', 'UVL', 'World2'],
    temporary: true,
  };
}

export interface UnifiedVerificationEntryPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  requests: string[];
  sessions: string[];
  states: string[];
  evidenceRefs: string[];
  reportRefs: string[];
  historyEntries: string[];
  requestCount: number;
  temporary: true;
}

export function buildUnifiedVerificationEntryPanelSnapshot(
  query = 'Request verification',
): UnifiedVerificationEntryPanelSnapshot {
  const ctx = getUnifiedVerificationContext(query);
  const response = ctx.response;

  return {
    panelId: 'UNIFIED_VERIFICATION_ENTRY',
    panelTitle: 'Unified Verification Entry',
    navigationPath: 'Left Navigation → Validators',
    requests: [`${response.request.requestId} — ${response.request.requestType}`],
    sessions: [`${response.session.sessionId} — ${response.session.state}`],
    states: [`${response.request.requestId} — ${response.state}`],
    evidenceRefs: response.evidenceReferences.slice(0, 8),
    reportRefs: response.reportReferences.slice(0, 8),
    historyEntries: response.historyReferences.slice(-6),
    requestCount: 1,
    temporary: true,
  };
}

export interface CloudRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  runtimes: string[];
  sessions: string[];
  states: string[];
  lifecycleEvents: string[];
  historyEntries: string[];
  reportSummaries: string[];
  runtimeCount: number;
  temporary: true;
}

export function buildCloudRuntimeFoundationPanelSnapshot(
  query = 'Show cloud runtime inventory',
): CloudRuntimeFoundationPanelSnapshot {
  const ctx = getCloudRuntimeContext(query);

  return {
    panelId: 'CLOUD_RUNTIME_FOUNDATION',
    panelTitle: 'Cloud Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    runtimes:
      ctx.reports
        .find((r) => r.reportType === 'RUNTIME_INVENTORY_REPORT')
        ?.findings.slice(0, 8) ?? [],
    sessions: ctx.session ? [`${ctx.session.sessionId} — ${ctx.session.sessionState}`] : [],
    states: ctx.runtime ? [`${ctx.runtime.runtimeId} — ${ctx.runtime.runtimeState}`] : [],
    lifecycleEvents:
      ctx.reports
        .find((r) => r.reportType === 'RUNTIME_LIFECYCLE_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'RUNTIME_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    runtimeCount: ctx.diagnostics.registeredRuntimeCount,
    temporary: true,
  };
}

export interface WorkspaceHostingFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  workspaces: string[];
  sessions: string[];
  states: string[];
  isolationFindings: string[];
  runtimeLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  workspaceCount: number;
  temporary: true;
}

export function buildWorkspaceHostingFoundationPanelSnapshot(
  query = 'Show hosted workspace inventory',
): WorkspaceHostingFoundationPanelSnapshot {
  const ctx = getWorkspaceHostingContext(query);

  return {
    panelId: 'WORKSPACE_HOSTING_FOUNDATION',
    panelTitle: 'Workspace Hosting Foundation',
    navigationPath: 'Left Navigation → Validators',
    workspaces:
      ctx.reports
        .find((r) => r.reportType === 'WORKSPACE_INVENTORY_REPORT')
        ?.findings.slice(0, 8) ?? [],
    sessions: ctx.session ? [`${ctx.session.sessionId} — ${ctx.session.sessionState}`] : [],
    states: ctx.workspace ? [`${ctx.workspace.workspaceId} — ${ctx.workspace.workspaceState}`] : [],
    isolationFindings:
      ctx.reports
        .find((r) => r.reportType === 'WORKSPACE_ISOLATION_REPORT')
        ?.findings.slice(0, 6) ?? [],
    runtimeLinks:
      ctx.reports
        .find((r) => r.reportType === 'WORKSPACE_RUNTIME_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'WORKSPACE_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    workspaceCount: ctx.diagnostics.registeredWorkspaceCount,
    temporary: true,
  };
}

export interface PersistentBuildRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  builds: string[];
  sessions: string[];
  states: string[];
  progressFindings: string[];
  contextFindings: string[];
  resumeFindings: string[];
  runtimeLinks: string[];
  workspaceLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  buildCount: number;
  temporary: true;
}

export function buildPersistentBuildRuntimeFoundationPanelSnapshot(
  query = 'Show persistent build inventory',
): PersistentBuildRuntimeFoundationPanelSnapshot {
  const ctx = getPersistentBuildContext(query);

  return {
    panelId: 'PERSISTENT_BUILD_RUNTIME_FOUNDATION',
    panelTitle: 'Persistent Build Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    builds:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_INVENTORY_REPORT')
        ?.findings.slice(0, 8) ?? [],
    sessions: ctx.session ? [`${ctx.session.sessionId} — ${ctx.session.sessionState}`] : [],
    states: ctx.build ? [`${ctx.build.buildId} — ${ctx.build.buildState}`] : [],
    progressFindings:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_PROGRESS_REPORT')
        ?.findings.slice(0, 6) ?? [],
    contextFindings:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_CONTEXT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    resumeFindings:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_RESUME_REPORT')
        ?.findings.slice(0, 6) ?? [],
    runtimeLinks:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_CLOUD_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_WORKSPACE_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'PERSISTENT_BUILD_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    buildCount: ctx.diagnostics.registeredBuildCount,
    temporary: true,
  };
}

export interface CloudVerificationFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  verifications: string[];
  sessions: string[];
  states: string[];
  scopeFindings: string[];
  contextFindings: string[];
  evidenceLinks: string[];
  reportLinks: string[];
  runtimeLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  verificationCount: number;
  temporary: true;
}

export function buildCloudVerificationFoundationPanelSnapshot(
  query = 'Show cloud verification inventory',
): CloudVerificationFoundationPanelSnapshot {
  const ctx = getCloudVerificationContext(query);

  return {
    panelId: 'CLOUD_VERIFICATION_FOUNDATION',
    panelTitle: 'Cloud Verification Foundation',
    navigationPath: 'Left Navigation → Validators',
    verifications:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_INVENTORY_REPORT')
        ?.findings.slice(0, 9) ?? [],
    sessions: ctx.session ? [`${ctx.session.sessionId} — ${ctx.session.sessionState}`] : [],
    states: ctx.verification ? [`${ctx.verification.verificationId} — ${ctx.verification.verificationState}`] : [],
    scopeFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_SCOPE_REPORT')
        ?.findings.slice(0, 6) ?? [],
    contextFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_CONTEXT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    evidenceLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_EVIDENCE_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    reportLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_REPORT_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    runtimeLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_RUNTIME_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_WORKSPACE_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    buildLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_PERSISTENT_BUILD_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_VERIFICATION_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    verificationCount: ctx.diagnostics.registeredVerificationCount,
    temporary: true,
  };
}

export interface CloudRecoveryFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  recoveries: string[];
  sessions: string[];
  states: string[];
  scopeFindings: string[];
  contextFindings: string[];
  runtimeLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  verificationLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  recoveryCount: number;
  temporary: true;
}

export function buildCloudRecoveryFoundationPanelSnapshot(
  query = 'Show cloud recovery inventory',
): CloudRecoveryFoundationPanelSnapshot {
  const ctx = getCloudRecoveryContext(query);

  return {
    panelId: 'CLOUD_RECOVERY_FOUNDATION',
    panelTitle: 'Cloud Recovery Foundation',
    navigationPath: 'Left Navigation → Validators',
    recoveries:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_INVENTORY_REPORT')
        ?.findings.slice(0, 9) ?? [],
    sessions: ctx.session ? [`${ctx.session.sessionId} — ${ctx.session.sessionState}`] : [],
    states: ctx.recovery ? [`${ctx.recovery.recoveryId} — ${ctx.recovery.recoveryState}`] : [],
    scopeFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_SCOPE_REPORT')
        ?.findings.slice(0, 6) ?? [],
    contextFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_CONTEXT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    runtimeLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_RUNTIME_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_WORKSPACE_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    buildLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_BUILD_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    verificationLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_VERIFICATION_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_RECOVERY_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    recoveryCount: ctx.diagnostics.registeredRecoveryCount,
    temporary: true,
  };
}

export interface CloudMonitoringFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  monitoringRecords: string[];
  sessions: string[];
  states: string[];
  healthFindings: string[];
  alertFindings: string[];
  contextFindings: string[];
  runtimeLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  verificationLinks: string[];
  recoveryLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  monitoringCount: number;
  temporary: true;
}

export function buildCloudMonitoringFoundationPanelSnapshot(
  query = 'Show cloud monitoring inventory',
  existingContext?: PrepareCloudMonitoringFoundationResult,
): CloudMonitoringFoundationPanelSnapshot {
  const ctx = existingContext ?? getCloudMonitoringContext(query);

  return {
    panelId: 'CLOUD_MONITORING_FOUNDATION',
    panelTitle: 'Cloud Monitoring Foundation',
    navigationPath: 'Left Navigation → Validators',
    monitoringRecords:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_INVENTORY_REPORT')
        ?.findings.slice(0, 9) ?? [],
    sessions: ctx.session ? [`${ctx.session.sessionId} — ${ctx.session.sessionState}`] : [],
    states: ctx.record ? [`${ctx.record.monitoringId} — ${ctx.record.monitoringState}`] : [],
    healthFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_HEALTH_REPORT')
        ?.findings.slice(0, 6) ?? [],
    alertFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_ALERT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    contextFindings:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_CONTEXT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    runtimeLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_RUNTIME_REPORT')
        ?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_WORKSPACE_REPORT')
        ?.findings.slice(0, 6) ?? [],
    buildLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_BUILD_REPORT')
        ?.findings.slice(0, 6) ?? [],
    verificationLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_VERIFICATION_REPORT')
        ?.findings.slice(0, 6) ?? [],
    recoveryLinks:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_RECOVERY_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'CLOUD_MONITORING_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    monitoringCount: ctx.diagnostics.registeredMonitoringCount,
    temporary: true,
  };
}

export interface MobileCommandRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  mobileCommands: string[];
  sessions: string[];
  states: string[];
  contextFindings: string[];
  permissionsFindings: string[];
  actionGateFindings: string[];
  cloudLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  verificationLinks: string[];
  recoveryLinks: string[];
  monitoringLinks: string[];
  operatorFeedLinks: string[];
  projectVaultLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  mobileCommandCount: number;
  temporary: true;
}

export function buildMobileCommandRuntimeFoundationPanelSnapshot(
  query = 'Show mobile command inventory',
  existingContext?: PrepareMobileCommandRuntimeFoundationResult,
): MobileCommandRuntimeFoundationPanelSnapshot {
  const ctx = existingContext ?? getMobileCommandContext(query);

  return {
    panelId: 'MOBILE_COMMAND_RUNTIME_FOUNDATION',
    panelTitle: 'Mobile Command Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    mobileCommands:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_INVENTORY_REPORT')
        ?.findings.slice(0, 9) ?? [],
    sessions: ctx.trackedSession ? [`${ctx.trackedSession.sessionId} — ${ctx.trackedSession.sessionState}`] : [],
    states: ctx.session ? [`${ctx.session.mobileCommandId} — ${ctx.session.mobileCommandState}`] : [],
    contextFindings:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_CONTEXT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    permissionsFindings:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_PERMISSIONS_REPORT')
        ?.findings.slice(0, 6) ?? [],
    actionGateFindings:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_ACTION_GATE_REPORT')
        ?.findings.slice(0, 6) ?? [],
    cloudLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_CLOUD_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_WORKSPACE_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    buildLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_BUILD_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    verificationLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_VERIFICATION_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    recoveryLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_RECOVERY_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    monitoringLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_MONITORING_LINK_REPORT')
        ?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_OPERATOR_FEED_REPORT')
        ?.findings.slice(0, 6) ?? [],
    projectVaultLinks:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_PROJECT_VAULT_REPORT')
        ?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports
        .find((r) => r.reportType === 'MOBILE_COMMAND_HISTORY_REPORT')
        ?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    mobileCommandCount: ctx.diagnostics.registeredMobileCommandCount,
    temporary: true,
  };
}

export interface MobileChatRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  mobileChats: string[];
  sessions: string[];
  messages: string[];
  prompts: string[];
  responses: string[];
  routingFindings: string[];
  actionGateFindings: string[];
  contextFindings: string[];
  cloudLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  verificationLinks: string[];
  monitoringLinks: string[];
  operatorFeedLinks: string[];
  projectVaultLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  mobileChatCount: number;
  temporary: true;
}

export function buildMobileChatRuntimeFoundationPanelSnapshot(
  query = 'Show mobile chat inventory',
  existingContext?: PrepareMobileChatRuntimeFoundationResult,
): MobileChatRuntimeFoundationPanelSnapshot {
  const ctx = existingContext ?? getMobileChatContext(query);

  return {
    panelId: 'MOBILE_CHAT_RUNTIME_FOUNDATION',
    panelTitle: 'Mobile Chat Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    mobileChats:
      ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_INVENTORY_REPORT')?.findings.slice(0, 9) ?? [],
    sessions: ctx.trackedSession ? [`${ctx.trackedSession.sessionId} — ${ctx.trackedSession.sessionState}`] : [],
    messages: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_MESSAGE_REPORT')?.findings.slice(0, 6) ?? [],
    prompts: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_PROMPT_REPORT')?.findings.slice(0, 6) ?? [],
    responses: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_RESPONSE_STATE_REPORT')?.findings.slice(0, 6) ?? [],
    routingFindings: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_COMMAND_ROUTING_REPORT')?.findings.slice(0, 6) ?? [],
    actionGateFindings: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_ACTION_GATE_REPORT')?.findings.slice(0, 6) ?? [],
    contextFindings: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_CONTEXT_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_CLOUD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    workspaceLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_WORKSPACE_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    buildLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_BUILD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    verificationLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_VERIFICATION_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    monitoringLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_MONITORING_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    projectVaultLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_PROJECT_VAULT_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries: ctx.reports.find((r) => r.reportType === 'MOBILE_CHAT_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    mobileChatCount: ctx.diagnostics.registeredMobileChatCount,
    temporary: true,
  };
}

export interface MobilePreviewRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  mobilePreviews: string[];
  sessions: string[];
  eligibilityFindings: string[];
  safetyFindings: string[];
  devicePolicyFindings: string[];
  desktopRecommendationFindings: string[];
  previewLinks: string[];
  commandLinks: string[];
  chatLinks: string[];
  cloudLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  verificationLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  mobilePreviewCount: number;
  temporary: true;
}

export function buildMobilePreviewRuntimeFoundationPanelSnapshot(
  query = 'Show mobile preview inventory',
  existingContext?: PrepareMobilePreviewRuntimeFoundationResult,
): MobilePreviewRuntimeFoundationPanelSnapshot {
  const ctx = existingContext ?? getMobilePreviewContext(query);

  return {
    panelId: 'MOBILE_PREVIEW_RUNTIME_FOUNDATION',
    panelTitle: 'Mobile Preview Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    mobilePreviews:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_INVENTORY_REPORT')?.findings.slice(0, 9) ?? [],
    sessions: ctx.trackedSession ? [`${ctx.trackedSession.sessionId} — ${ctx.trackedSession.sessionState}`] : [],
    eligibilityFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_ELIGIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    safetyFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_SAFETY_REPORT')?.findings.slice(0, 6) ?? [],
    devicePolicyFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_DEVICE_POLICY_REPORT')?.findings.slice(0, 6) ?? [],
    desktopRecommendationFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_DESKTOP_RECOMMENDATION_REPORT')?.findings.slice(0, 6) ??
      [],
    previewLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_COMMAND_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_CHAT_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_CLOUD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_WORKSPACE_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    buildLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_BUILD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    verificationLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_VERIFICATION_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries: ctx.reports.find((r) => r.reportType === 'MOBILE_PREVIEW_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    mobilePreviewCount: ctx.diagnostics.registeredMobilePreviewCount,
    temporary: true,
  };
}

export interface MobileApprovalRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  mobileApprovals: string[];
  sessions: string[];
  requestFindings: string[];
  decisionFindings: string[];
  governanceFindings: string[];
  visibilityFindings: string[];
  commandLinks: string[];
  chatLinks: string[];
  previewLinks: string[];
  cloudLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  flowLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  mobileApprovalCount: number;
  temporary: true;
}

export function buildMobileApprovalRuntimeFoundationPanelSnapshot(
  query = 'Show mobile approval inventory',
  existingContext?: PrepareMobileApprovalRuntimeFoundationResult,
): MobileApprovalRuntimeFoundationPanelSnapshot {
  const ctx = existingContext ?? getMobileApprovalContext(query);

  return {
    panelId: 'MOBILE_APPROVAL_RUNTIME_FOUNDATION',
    panelTitle: 'Mobile Approval Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    mobileApprovals:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_INVENTORY_REPORT')?.findings.slice(0, 9) ?? [],
    sessions: ctx.trackedSession ? [`${ctx.trackedSession.sessionId} — ${ctx.trackedSession.sessionState}`] : [],
    requestFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_REQUEST_REPORT')?.findings.slice(0, 6) ?? [],
    decisionFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_DECISION_REPORT')?.findings.slice(0, 6) ?? [],
    governanceFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_GOVERNANCE_REPORT')?.findings.slice(0, 6) ?? [],
    visibilityFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_CONTEXT_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_COMMAND_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_CHAT_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    previewLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_PREVIEW_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_CLOUD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_WORKSPACE_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    buildLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_BUILD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    flowLinks: ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_FLOW_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries: ctx.reports.find((r) => r.reportType === 'MOBILE_APPROVAL_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    mobileApprovalCount: ctx.diagnostics.registeredMobileApprovalCount,
    temporary: true,
  };
}

export interface CrossDeviceRuntimeFoundationPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  crossDevices: string[];
  sessions: string[];
  deviceRegistrationFindings: string[];
  deviceLinkFindings: string[];
  deviceHandoffFindings: string[];
  visibilityFindings: string[];
  commandLinks: string[];
  chatLinks: string[];
  previewLinks: string[];
  approvalLinks: string[];
  cloudLinks: string[];
  workspaceLinks: string[];
  buildLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  crossDeviceCount: number;
  temporary: true;
}

export function buildCrossDeviceRuntimeFoundationPanelSnapshot(
  query = 'Show cross device inventory',
  existingContext?: PrepareCrossDeviceRuntimeFoundationResult,
): CrossDeviceRuntimeFoundationPanelSnapshot {
  const ctx = existingContext ?? getCrossDeviceContext(query);

  return {
    panelId: 'CROSS_DEVICE_RUNTIME_FOUNDATION',
    panelTitle: 'Cross Device Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    crossDevices:
      ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_INVENTORY_REPORT')?.findings.slice(0, 9) ?? [],
    sessions: ctx.trackedSession ? [`${ctx.trackedSession.sessionId} — ${ctx.trackedSession.sessionState}`] : [],
    deviceRegistrationFindings:
      ctx.reports.find((r) => r.reportType === 'DEVICE_REGISTRATION_REPORT')?.findings.slice(0, 6) ?? [],
    deviceLinkFindings:
      ctx.reports.find((r) => r.reportType === 'DEVICE_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    deviceHandoffFindings:
      ctx.reports.find((r) => r.reportType === 'DEVICE_HANDOFF_REPORT')?.findings.slice(0, 6) ?? [],
    visibilityFindings:
      ctx.reports.find((r) => r.reportType === 'DEVICE_VISIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_COMMAND_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks: ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_CHAT_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    previewLinks:
      ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_PREVIEW_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    approvalLinks:
      ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_APPROVAL_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks: ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_CLOUD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    workspaceLinks:
      ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_WORKSPACE_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    buildLinks: ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_BUILD_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries: ctx.reports.find((r) => r.reportType === 'CROSS_DEVICE_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    crossDeviceCount: ctx.diagnostics.registeredCrossDeviceCount,
    temporary: true,
  };
}

export interface FounderNotificationRuntimeFoundationPanelSnapshot {
  panelId: 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION';
  panelTitle: string;
  navigationPath: string;
  notifications: string[];
  routingFindings: string[];
  visibilityFindings: string[];
  priorityFindings: string[];
  channelFindings: string[];
  mobileLinks: string[];
  crossDeviceLinks: string[];
  cloudLinks: string[];
  commandLinks: string[];
  chatLinks: string[];
  previewLinks: string[];
  approvalLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  notificationCount: number;
  temporary: true;
}

export function buildFounderNotificationRuntimeFoundationPanelSnapshot(
  query = 'Show founder notification inventory',
  existingContext?: PrepareFounderNotificationRuntimeFoundationResult,
): FounderNotificationRuntimeFoundationPanelSnapshot {
  const ctx = existingContext ?? getFounderNotificationContext(query);

  return {
    panelId: 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION',
    panelTitle: 'Founder Notification Runtime Foundation',
    navigationPath: 'Left Navigation → Validators',
    notifications:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_INVENTORY_REPORT')?.findings.slice(0, 13) ?? [],
    routingFindings:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_ROUTING_REPORT')?.findings.slice(0, 6) ?? [],
    visibilityFindings:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_VISIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    priorityFindings:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_PRIORITY_REPORT')?.findings.slice(0, 6) ?? [],
    channelFindings:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_CHANNEL_REPORT')?.findings.slice(0, 6) ?? [],
    mobileLinks:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_MOBILE_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    crossDeviceLinks:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_CROSS_DEVICE_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks: ctx.reports.find((r) => r.reportType === 'NOTIFICATION_CLOUD_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_COMMAND_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks: ctx.reports.find((r) => r.reportType === 'NOTIFICATION_CHAT_REPORT')?.findings.slice(0, 6) ?? [],
    previewLinks:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_PREVIEW_REPORT')?.findings.slice(0, 6) ?? [],
    approvalLinks:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_APPROVAL_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'NOTIFICATION_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries: ctx.reports.find((r) => r.reportType === 'NOTIFICATION_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    notificationCount: ctx.diagnostics.registeredNotificationCount,
    temporary: true,
  };
}

export interface FounderInboxFoundationPanelSnapshot {
  panelId: 'FOUNDER_INBOX_FOUNDATION';
  panelTitle: string;
  navigationPath: string;
  inboxEntries: string[];
  visibilityFindings: string[];
  ownershipFindings: string[];
  priorityFindings: string[];
  filteringFindings: string[];
  searchFindings: string[];
  groupingFindings: string[];
  acknowledgementFindings: string[];
  archiveFindings: string[];
  notificationLinks: string[];
  crossDeviceLinks: string[];
  cloudLinks: string[];
  commandLinks: string[];
  chatLinks: string[];
  previewLinks: string[];
  approvalLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  inboxEntryCount: number;
  temporary: true;
}

export function buildFounderInboxFoundationPanelSnapshot(
  query = 'Show founder inbox inventory',
  existingContext?: PrepareFounderInboxFoundationResult,
): FounderInboxFoundationPanelSnapshot {
  const ctx = existingContext ?? getFounderInboxContext(query);

  return {
    panelId: 'FOUNDER_INBOX_FOUNDATION',
    panelTitle: 'Founder Inbox Foundation',
    navigationPath: 'Left Navigation → Validators',
    inboxEntries:
      ctx.reports.find((r) => r.reportType === 'INBOX_INVENTORY_REPORT')?.findings.slice(0, 12) ?? [],
    visibilityFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_VISIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    ownershipFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_OWNERSHIP_REPORT')?.findings.slice(0, 6) ?? [],
    priorityFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_STATE_REPORT')?.findings.slice(0, 6) ?? [],
    filteringFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_FILTERING_REPORT')?.findings.slice(0, 6) ?? [],
    searchFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_SEARCH_REPORT')?.findings.slice(0, 6) ?? [],
    groupingFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_GROUPING_REPORT')?.findings.slice(0, 6) ?? [],
    acknowledgementFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_ACKNOWLEDGEMENT_REPORT')?.findings.slice(0, 6) ?? [],
    archiveFindings:
      ctx.reports.find((r) => r.reportType === 'INBOX_ARCHIVE_REPORT')?.findings.slice(0, 6) ?? [],
    notificationLinks:
      ctx.reports.find((r) => r.reportType === 'INBOX_NOTIFICATION_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    crossDeviceLinks:
      ctx.reports.find((r) => r.reportType === 'INBOX_CROSS_DEVICE_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks: ctx.reports.find((r) => r.reportType === 'INBOX_CLOUD_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'INBOX_COMMAND_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks: ctx.reports.find((r) => r.reportType === 'INBOX_CHAT_REPORT')?.findings.slice(0, 6) ?? [],
    previewLinks:
      ctx.reports.find((r) => r.reportType === 'INBOX_PREVIEW_REPORT')?.findings.slice(0, 6) ?? [],
    approvalLinks:
      ctx.reports.find((r) => r.reportType === 'INBOX_APPROVAL_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'INBOX_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries: ctx.reports.find((r) => r.reportType === 'INBOX_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    inboxEntryCount: ctx.diagnostics.registeredInboxEntryCount,
    temporary: true,
  };
}

export interface NotificationDeliveryFoundationPanelSnapshot {
  panelId: 'NOTIFICATION_DELIVERY_FOUNDATION';
  panelTitle: string;
  navigationPath: string;
  deliveryRecords: string[];
  intentFindings: string[];
  routingFindings: string[];
  targetingFindings: string[];
  eligibilityFindings: string[];
  policyFindings: string[];
  blockingFindings: string[];
  deferralFindings: string[];
  visibilityFindings: string[];
  ownershipFindings: string[];
  notificationLinks: string[];
  inboxLinks: string[];
  crossDeviceLinks: string[];
  cloudLinks: string[];
  commandLinks: string[];
  chatLinks: string[];
  previewLinks: string[];
  approvalLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  deliveryRecordCount: number;
  temporary: true;
}

export function buildNotificationDeliveryFoundationPanelSnapshot(
  query = 'Show notification delivery inventory',
  existingContext?: PrepareNotificationDeliveryFoundationResult,
): NotificationDeliveryFoundationPanelSnapshot {
  const ctx = existingContext ?? getNotificationDeliveryContext(query);

  return {
    panelId: 'NOTIFICATION_DELIVERY_FOUNDATION',
    panelTitle: 'Notification Delivery Foundation',
    navigationPath: 'Left Navigation → Validators',
    deliveryRecords:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_INVENTORY_REPORT')?.findings.slice(0, 14) ?? [],
    intentFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_INTENT_REPORT')?.findings.slice(0, 6) ?? [],
    routingFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_ROUTING_REPORT')?.findings.slice(0, 6) ?? [],
    targetingFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_TARGETING_REPORT')?.findings.slice(0, 6) ?? [],
    eligibilityFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_CHANNEL_ELIGIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    policyFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_POLICY_REPORT')?.findings.slice(0, 6) ?? [],
    blockingFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_BLOCKING_REPORT')?.findings.slice(0, 6) ?? [],
    deferralFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_DEFERRAL_REPORT')?.findings.slice(0, 6) ?? [],
    visibilityFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_VISIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    ownershipFindings:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_OWNERSHIP_REPORT')?.findings.slice(0, 6) ?? [],
    notificationLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_NOTIFICATION_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    inboxLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_INBOX_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    crossDeviceLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_CROSS_DEVICE_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_CLOUD_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_COMMAND_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_CHAT_REPORT')?.findings.slice(0, 6) ?? [],
    previewLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_PREVIEW_REPORT')?.findings.slice(0, 6) ?? [],
    approvalLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_APPROVAL_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports.find((r) => r.reportType === 'DELIVERY_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    deliveryRecordCount: ctx.diagnostics.registeredDeliveryCount,
    temporary: true,
  };
}

export interface AutonomousBuilderFoundationPanelSnapshot {
  panelId: 'AUTONOMOUS_BUILDER_FOUNDATION';
  panelTitle: string;
  navigationPath: string;
  buildRecords: string[];
  goalFindings: string[];
  planFindings: string[];
  stageFindings: string[];
  readinessFindings: string[];
  constraintFindings: string[];
  capabilityFindings: string[];
  ownershipFindings: string[];
  contextFindings: string[];
  deliveryLinks: string[];
  pushLinks: string[];
  notificationLinks: string[];
  inboxLinks: string[];
  cloudLinks: string[];
  world2Links: string[];
  aidevLinks: string[];
  operatorFeedLinks: string[];
  projectVaultLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  buildRecordCount: number;
  temporary: true;
}

export function buildAutonomousBuilderFoundationPanelSnapshot(
  query = 'Show autonomous builder inventory',
  existingContext?: PrepareAutonomousBuilderFoundationResult,
): AutonomousBuilderFoundationPanelSnapshot {
  const ctx = existingContext ?? getAutonomousBuilderContext(query);

  return {
    panelId: 'AUTONOMOUS_BUILDER_FOUNDATION',
    panelTitle: 'Autonomous Builder Foundation',
    navigationPath: 'Left Navigation → Validators',
    buildRecords:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_INVENTORY_REPORT')?.findings.slice(0, 14) ?? [],
    goalFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_GOAL_REPORT')?.findings.slice(0, 6) ?? [],
    planFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_PLAN_REPORT')?.findings.slice(0, 6) ?? [],
    stageFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_STAGE_REPORT')?.findings.slice(0, 6) ?? [],
    readinessFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_READINESS_REPORT')?.findings.slice(0, 6) ?? [],
    constraintFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_CONSTRAINT_REPORT')?.findings.slice(0, 6) ?? [],
    capabilityFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_CAPABILITY_REPORT')?.findings.slice(0, 6) ?? [],
    ownershipFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_OWNERSHIP_REPORT')?.findings.slice(0, 6) ?? [],
    contextFindings:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_CONTEXT_REPORT')?.findings.slice(0, 6) ?? [],
    deliveryLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_DELIVERY_REPORT')?.findings.slice(0, 6) ?? [],
    pushLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_PUSH_REPORT')?.findings.slice(0, 6) ?? [],
    notificationLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_NOTIFICATION_REPORT')?.findings.slice(0, 6) ?? [],
    inboxLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_INBOX_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_CLOUD_REPORT')?.findings.slice(0, 6) ?? [],
    world2Links:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_WORLD2_REPORT')?.findings.slice(0, 6) ?? [],
    aidevLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_AIDEV_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    projectVaultLinks:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_PROJECT_VAULT_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports.find((r) => r.reportType === 'AUTONOMOUS_BUILD_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    buildRecordCount: ctx.diagnostics.registeredBuildCount,
    temporary: true,
  };
}

export interface BuildStrategyEnginePanelSnapshot {
  panelId: 'BUILD_STRATEGY_ENGINE';
  panelTitle: string;
  navigationPath: string;
  strategyRecords: string[];
  classificationFindings: string[];
  modeFindings: string[];
  autonomyFindings: string[];
  riskFindings: string[];
  confidenceFindings: string[];
  depthFindings: string[];
  stageFindings: string[];
  readinessFindings: string[];
  constraintFindings: string[];
  dependencyFindings: string[];
  policyFindings: string[];
  ownershipFindings: string[];
  contextFindings: string[];
  autonomousBuilderLinks: string[];
  deliveryLinks: string[];
  pushLinks: string[];
  notificationLinks: string[];
  inboxLinks: string[];
  cloudLinks: string[];
  world2Links: string[];
  aidevLinks: string[];
  operatorFeedLinks: string[];
  projectVaultLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  strategyRecordCount: number;
  temporary: true;
}

export function buildBuildStrategyEnginePanelSnapshot(
  query = 'Show build strategy inventory',
  existingContext?: PrepareBuildStrategyEngineResult,
): BuildStrategyEnginePanelSnapshot {
  const ctx = existingContext ?? getBuildStrategyEngineContext(query);

  return {
    panelId: 'BUILD_STRATEGY_ENGINE',
    panelTitle: 'Build Strategy Engine',
    navigationPath: 'Left Navigation → Validators',
    strategyRecords:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_INVENTORY_REPORT')?.findings.slice(0, 14) ?? [],
    classificationFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_CLASSIFICATION_REPORT')?.findings.slice(0, 6) ?? [],
    modeFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_MODE_REPORT')?.findings.slice(0, 6) ?? [],
    autonomyFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_AUTONOMY_REPORT')?.findings.slice(0, 6) ?? [],
    riskFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_RISK_REPORT')?.findings.slice(0, 6) ?? [],
    confidenceFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_CONFIDENCE_REPORT')?.findings.slice(0, 6) ?? [],
    depthFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_DEPTH_REPORT')?.findings.slice(0, 6) ?? [],
    stageFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_STAGES_REPORT')?.findings.slice(0, 6) ?? [],
    readinessFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_READINESS_REPORT')?.findings.slice(0, 6) ?? [],
    constraintFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_CONSTRAINT_REPORT')?.findings.slice(0, 6) ?? [],
    dependencyFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_DEPENDENCY_REPORT')?.findings.slice(0, 6) ?? [],
    policyFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_POLICY_REPORT')?.findings.slice(0, 6) ?? [],
    ownershipFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_OWNERSHIP_REPORT')?.findings.slice(0, 6) ?? [],
    contextFindings:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_CONTEXT_REPORT')?.findings.slice(0, 6) ?? [],
    autonomousBuilderLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_AUTONOMOUS_BUILDER_REPORT')?.findings.slice(0, 6) ?? [],
    deliveryLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_DELIVERY_REPORT')?.findings.slice(0, 6) ?? [],
    pushLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_PUSH_REPORT')?.findings.slice(0, 6) ?? [],
    notificationLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_NOTIFICATION_REPORT')?.findings.slice(0, 6) ?? [],
    inboxLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_INBOX_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_CLOUD_REPORT')?.findings.slice(0, 6) ?? [],
    world2Links:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_WORLD2_REPORT')?.findings.slice(0, 6) ?? [],
    aidevLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_AIDEV_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    projectVaultLinks:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_PROJECT_VAULT_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports.find((r) => r.reportType === 'BUILD_STRATEGY_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    strategyRecordCount: ctx.diagnostics.registeredStrategyCount,
    temporary: true,
  };
}

export interface MobilePushFoundationPanelSnapshot {
  panelId: 'MOBILE_PUSH_FOUNDATION';
  panelTitle: string;
  navigationPath: string;
  pushRecords: string[];
  tokenFindings: string[];
  platformFindings: string[];
  payloadFindings: string[];
  targetingFindings: string[];
  eligibilityFindings: string[];
  routingFindings: string[];
  policyFindings: string[];
  blockingFindings: string[];
  deferralFindings: string[];
  visibilityFindings: string[];
  ownershipFindings: string[];
  deliveryLinks: string[];
  notificationLinks: string[];
  inboxLinks: string[];
  crossDeviceLinks: string[];
  cloudLinks: string[];
  commandLinks: string[];
  chatLinks: string[];
  previewLinks: string[];
  approvalLinks: string[];
  operatorFeedLinks: string[];
  historyEntries: string[];
  reportSummaries: string[];
  pushRecordCount: number;
  temporary: true;
}

export function buildMobilePushFoundationPanelSnapshot(
  query = 'Show mobile push inventory',
  existingContext?: PrepareMobilePushFoundationResult,
): MobilePushFoundationPanelSnapshot {
  const ctx = existingContext ?? getMobilePushContext(query);

  return {
    panelId: 'MOBILE_PUSH_FOUNDATION',
    panelTitle: 'Mobile Push Foundation',
    navigationPath: 'Left Navigation → Validators',
    pushRecords:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_INVENTORY_REPORT')?.findings.slice(0, 14) ?? [],
    tokenFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_TOKEN_METADATA_REPORT')?.findings.slice(0, 6) ?? [],
    platformFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_PLATFORM_REPORT')?.findings.slice(0, 6) ?? [],
    payloadFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_PAYLOAD_REPORT')?.findings.slice(0, 6) ?? [],
    targetingFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_TARGETING_REPORT')?.findings.slice(0, 6) ?? [],
    eligibilityFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_ELIGIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    routingFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_ROUTING_REPORT')?.findings.slice(0, 6) ?? [],
    policyFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_POLICY_REPORT')?.findings.slice(0, 6) ?? [],
    blockingFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_BLOCKING_REPORT')?.findings.slice(0, 6) ?? [],
    deferralFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_DEFERRAL_REPORT')?.findings.slice(0, 6) ?? [],
    visibilityFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_VISIBILITY_REPORT')?.findings.slice(0, 6) ?? [],
    ownershipFindings:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_OWNERSHIP_REPORT')?.findings.slice(0, 6) ?? [],
    deliveryLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_DELIVERY_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    notificationLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_NOTIFICATION_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    inboxLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_INBOX_LINK_REPORT')?.findings.slice(0, 6) ?? [],
    crossDeviceLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_CROSS_DEVICE_REPORT')?.findings.slice(0, 6) ?? [],
    cloudLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_CLOUD_REPORT')?.findings.slice(0, 6) ?? [],
    commandLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_COMMAND_REPORT')?.findings.slice(0, 6) ?? [],
    chatLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_CHAT_REPORT')?.findings.slice(0, 6) ?? [],
    previewLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_PREVIEW_REPORT')?.findings.slice(0, 6) ?? [],
    approvalLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_APPROVAL_REPORT')?.findings.slice(0, 6) ?? [],
    operatorFeedLinks:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_OPERATOR_FEED_REPORT')?.findings.slice(0, 6) ?? [],
    historyEntries:
      ctx.reports.find((r) => r.reportType === 'MOBILE_PUSH_HISTORY_REPORT')?.findings.slice(-6) ?? [],
    reportSummaries: ctx.reports.map((r) => `${r.reportType}: ${r.summary}`),
    pushRecordCount: ctx.diagnostics.registeredPushCount,
    temporary: true,
  };
}
