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
