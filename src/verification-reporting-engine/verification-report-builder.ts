/**
 * Verification report builder — orchestrates report generation and reporting authority.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { prepareVerificationEvidence } from '../verification-evidence-engine/index.js';
import { prepareVerificationOrchestration } from '../verification-orchestrator/index.js';
import { prepareVerificationRegistry } from '../verification-registry/index.js';
import {
  listVerificationSessions,
  prepareVerificationRuntime,
} from '../unified-verification-lab/index.js';
import { publishVerificationReportingFeedStages } from '../operator-feed/verification-reporting-feed-bridge.js';
import { buildVerificationSummaryReport } from './verification-summary-builder.js';
import { buildFailureReport } from './verification-failure-report-builder.js';
import { buildEvidenceReport } from './verification-evidence-report-builder.js';
import { buildSessionReport } from './verification-session-report-builder.js';
import {
  buildHistoryReport,
  listReportHistory,
  recordReportHistory,
  resetVerificationHistoryForTests,
} from './verification-history-report-builder.js';
import { buildTrendReport, computeTrendMetrics } from './verification-trend-report-builder.js';
import {
  registerReport,
  listReports,
  nextReportId,
  resetVerificationReportStoreForTests,
} from './verification-report-store.js';
import {
  evaluateReportingGates,
  validateReportIntegrity,
  validateVerificationReporting,
} from './verification-report-validator.js';
import { buildReportExportBundle } from './verification-report-export.js';
import {
  getVerificationReportingDiagnostics,
  updateVerificationReportingDiagnostics,
} from './verification-report-diagnostics.js';
import {
  isDuplicateVerificationReportingQuestion,
  isVerificationReportingQuestion,
  type PrepareVerificationReportingInput,
  type PrepareVerificationReportingResult,
  type ReportOwnership,
  type ReportingAuthorityState,
  type VerificationReport,
} from './verification-report-types.js';

let authorityCounter = 0;

export function resetVerificationReportingAuthorityCounterForTests(): void {
  authorityCounter = 0;
}

export function nextReportingAuthorityId(): string {
  authorityCounter += 1;
  return `vrptauth-${authorityCounter.toString().padStart(4, '0')}`;
}

function buildReportOwnership(
  projectId: string,
  workspaceId: string,
  orchestrationId?: string,
  verificationSession?: string,
): ReportOwnership {
  return {
    ownerModule: 'devpulse_v2_verification_reporting_engine',
    ownerDomain: 'verification_reporting_engine',
    generatedBy: 'verification_reporting_engine',
    verificationSession,
    orchestrationId,
    projectId,
    workspaceId,
    generatedAt: Date.now(),
  };
}

function buildFounderReport(opts: {
  ownership: ReportOwnership;
  evidenceIds: string[];
  summary: VerificationReport;
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'FOUNDER_VERIFICATION_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportScope: 'founder',
    reportStatus: 'READY',
    reportSummary: 'Founder verification report — structured reporting for Founder Reality consumption',
    reportFindings: [
      'What happened: verification planning and evidence registration completed',
      'What was verified: registry targets and orchestration plans defined',
      'What failed: see failure report for blocked targets',
      `Evidence records: ${opts.evidenceIds.length}`,
      opts.summary.reportSummary,
    ],
    reportEvidence: opts.evidenceIds,
    reportRisks: ['Blocked targets may delay completion criteria'],
    reportRecommendations: ['Review verification summary before Trust Engine consumption'],
    reportMetadata: { founderExport: true },
    reportVisibility: 'WORKSPACE',
    reportReferences: [opts.summary.reportId],
    reportingOnly: true,
  };
}

function buildWorld2Report(opts: {
  ownership: ReportOwnership;
  evidenceIds: string[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'WORLD2_VERIFICATION_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportScope: 'world2',
    reportStatus: 'READY',
    reportSummary: 'World 2 verification report — isolated builder zone reporting authority',
    reportFindings: [
      'WORLD2_TARGET registered in verification registry',
      'World 2 evidence chain linked via evidence engine',
      'No World 2 execution performed in reporting phase',
    ],
    reportEvidence: opts.evidenceIds.filter((id) => id.includes('vevid')).slice(0, 3),
    reportRisks: ['World 2 apply and completion gates not evaluated in reporting'],
    reportRecommendations: ['Consume via World 2 export — no direct World 1 mutation'],
    reportMetadata: { world2Chain: 'w2chain-0001' },
    reportVisibility: 'PROJECT',
    reportReferences: ['w2chain-0001'],
    reportingOnly: true,
  };
}

function buildCompletionReport(opts: {
  ownership: ReportOwnership;
  evidenceIds: string[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'COMPLETION_VERIFICATION_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportScope: 'completion',
    reportStatus: 'READY',
    reportSummary: 'Completion verification report — criteria satisfaction reporting only',
    reportFindings: [
      'Completion criteria referenced from registry requirements',
      'Evidence-backed completion chain: w2comp-chain-0001',
      'No completion runtime decisions in Phase 16.11',
    ],
    reportEvidence: opts.evidenceIds.slice(-3),
    reportRisks: ['Missing evidence may block completion'],
    reportRecommendations: ['Cross-reference evidence report for missing requirements'],
    reportMetadata: { completionChainId: 'w2comp-chain-0001' },
    reportVisibility: 'PROJECT',
    reportReferences: ['w2comp-chain-0001'],
    reportingOnly: true,
  };
}

function buildUvlReport(opts: {
  ownership: ReportOwnership;
  sessions: Array<{ sessionId: string; providerType: string; state: string }>;
  evidenceIds: string[];
}): VerificationReport {
  return {
    reportId: nextReportId(),
    reportType: 'UVL_VERIFICATION_REPORT',
    reportOwner: opts.ownership,
    reportTimestamp: Date.now(),
    reportScope: 'uvl',
    reportStatus: 'READY',
    reportSummary: `UVL verification report — ${opts.sessions.length} session(s), provider registration context`,
    reportFindings: opts.sessions.slice(0, 7).map((s) => `UVL session: ${s.sessionId} — ${s.providerType}`),
    reportEvidence: opts.evidenceIds.slice(0, 4),
    reportRisks: [],
    reportRecommendations: ['UVL export for Validators panel consumption'],
    reportMetadata: { sessionCount: opts.sessions.length, providerCount: 7 },
    reportVisibility: 'PROJECT',
    reportReferences: opts.sessions.map((s) => s.sessionId),
    reportingOnly: true,
  };
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareVerificationReportingInput> = {},
): PrepareVerificationReportingInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('verification_reporting_engine');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_verification_reporting_engine',
    ...overrides,
  };
}

function deriveReportingAuthorityState(blocked: boolean, validationValid: boolean): ReportingAuthorityState {
  if (blocked) return 'BLOCKED';
  if (!validationValid) return 'INVALID';
  return 'READY';
}

export function composeVerificationReportingResponse(
  query: string,
  authorityId: string,
  state: ReportingAuthorityState,
  reports: VerificationReport[],
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Verification Reporting Engine Response', ''];

  lines.push(`Authority ID: ${authorityId}`);
  lines.push(`State: ${state}`);
  lines.push(`Report count: ${reports.length}`);
  lines.push('');

  if (lower.includes('summary') || lower.includes('what happened')) {
    const summary = reports.find((r) => r.reportType === 'VERIFICATION_SUMMARY_REPORT');
    if (summary) {
      lines.push('Summary:');
      lines.push(summary.reportSummary);
      for (const f of summary.reportFindings.slice(0, 5)) lines.push(`• ${f}`);
    }
  }

  if (lower.includes('fail') || lower.includes('what failed')) {
    const failure = reports.find((r) => r.reportType === 'VERIFICATION_FAILURE_REPORT');
    if (failure) {
      lines.push('Failures:');
      for (const f of failure.reportFindings) lines.push(`• ${f}`);
    }
  }

  if (lower.includes('evidence') || lower.includes('missing')) {
    const evidence = reports.find((r) => r.reportType === 'VERIFICATION_EVIDENCE_REPORT');
    if (evidence) {
      lines.push('Evidence:');
      lines.push(evidence.reportSummary);
      for (const r of evidence.reportRisks) lines.push(`• ${r}`);
    }
  }

  if (lower.includes('history')) {
    const history = reports.find((r) => r.reportType === 'VERIFICATION_HISTORY_REPORT');
    if (history) {
      lines.push('History:');
      for (const f of history.reportFindings.slice(0, 5)) lines.push(`• ${f}`);
    }
  }

  if (lower.includes('trend')) {
    const trend = reports.find((r) => r.reportType === 'VERIFICATION_TREND_REPORT');
    if (trend) {
      lines.push('Trends:');
      for (const f of trend.reportFindings) lines.push(`• ${f}`);
    }
  }

  if (lower.includes('founder')) {
    const founder = reports.find((r) => r.reportType === 'FOUNDER_VERIFICATION_REPORT');
    if (founder) lines.push(`Founder report: ${founder.reportSummary}`);
  }

  if (lower.includes('export')) {
    lines.push('Exports available: JSON, founder, UVL, World 2');
  }

  lines.push('');
  lines.push('Reporting only — no verification execution, trust scoring, or auto-fix.');
  return lines.join('\n');
}

export interface VerificationReportingFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVerificationReportingFailureContext(
  query: string,
): VerificationReportingFailureContext[] {
  if (!isVerificationReportingQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: VerificationReportingFailureContext[] = [
    {
      title: 'Verification reporting: authority only',
      description: 'Phase 16.11 reporting authority without provider execution or trust decisions',
      sourceSystem: 'verification_reporting_engine',
      severity: 'LOW',
    },
  ];

  if (lower.includes('missing evidence') || lower.includes('evidence link')) {
    records.push({
      title: 'Missing evidence link',
      description: 'Report finding references evidence not registered in evidence engine',
      sourceSystem: 'verification_reporting_engine',
      severity: 'HIGH',
    });
  }

  if (lower.includes('report blocked') || lower.includes('reporting blocked') || lower.includes('blocked')) {
    records.push({
      title: 'Reporting blocked',
      description: 'Verification reporting gates failed — inspect report generation and ownership',
      sourceSystem: 'verification_reporting_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate')) {
    records.push({
      title: 'Duplicate report id',
      description: 'Report rejected due to duplicate identifier',
      sourceSystem: 'verification_reporting_engine',
      severity: 'CRITICAL',
    });
  }

  return records;
}

function registerAllReports(reports: VerificationReport[]): VerificationReport[] {
  const registered: VerificationReport[] = [];
  for (const report of reports) {
    const result = registerReport(report);
    if (result.report) {
      recordReportHistory(result.report, 'CREATED');
      registered.push(result.report);
    }
  }
  return registered;
}

export function prepareVerificationReporting(
  input: PrepareVerificationReportingInput,
): PrepareVerificationReportingResult {
  const query = input.query ?? 'What happened in verification?';

  if (isDuplicateVerificationReportingQuestion(query)) {
    return {
      reportingAuthorityId: nextReportingAuthorityId(),
      authorityState: 'BLOCKED',
      diagnostics: getVerificationReportingDiagnostics(),
      reports: [],
      summaryReport: null,
      historyEntries: [],
      validationResult: { valid: false, issues: [], warnings: ['Duplicate engine rejected'] },
      exports: { json: '{}', founder: '', uvl: '{}', world2: '{}' },
      responseText: composeVerificationReportingResponse(query, 'vrptauth-blocked', 'BLOCKED', []),
    };
  }

  const evidenceCtx = prepareVerificationEvidence({
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: input.suppressRuntimeBootstrap,
  });

  const registry = prepareVerificationRegistry({
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: true,
  });

  const orchestration = prepareVerificationOrchestration({
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: true,
  });

  if (!input.suppressRuntimeBootstrap) {
    prepareVerificationRuntime({
      query,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      projectExists: input.projectExists,
      workspaceExists: input.workspaceExists,
      world1Protected: input.world1Protected,
      ownershipValid: input.ownershipValid,
      suppressRuntimeBootstrap: false,
    });
  }

  const evidenceRecords = evidenceCtx.evidenceRecords;
  const evidenceIds = evidenceRecords.map((e) => e.evidenceId);
  const ownership = buildReportOwnership(
    input.projectId ?? 'none',
    input.workspaceId ?? 'none',
    orchestration.orchestrationReport.orchestrationId,
  );

  const sessions = listVerificationSessions().map((s) => ({
    sessionId: s.verificationSessionId,
    providerType: s.verificationType,
    state: s.sessionState,
  }));

  const missingEvidence = registry.verificationRequirements
    .flatMap((r) => r.requiredEvidence)
    .filter((req) => !evidenceRecords.some((e) => e.evidenceType === req || e.evidenceSource.includes(req)));

  const summaryReport = buildVerificationSummaryReport({
    ownership,
    evidenceIds,
    targetCount: registry.verificationTargets.length,
    orchestrationId: orchestration.orchestrationReport.orchestrationId,
    blockedTargets: orchestration.blockedTargets,
    readyTargets: orchestration.orchestrationReport.readyTargets,
  });

  const draftReports: VerificationReport[] = [
    summaryReport,
    buildFailureReport({
      ownership,
      blockedTargets: orchestration.blockedTargets,
      blockedReasons: orchestration.orchestrationReport.blockedReasons,
      evidenceIds,
    }),
    buildEvidenceReport({ ownership, evidenceRecords, missingEvidence }),
    buildSessionReport({ ownership, sessions, evidenceIds }),
    buildFounderReport({ ownership, evidenceIds, summary: summaryReport }),
    buildWorld2Report({ ownership, evidenceIds }),
    buildCompletionReport({ ownership, evidenceIds }),
    buildUvlReport({ ownership, sessions, evidenceIds }),
  ];

  const registered = registerAllReports(draftReports);
  const history = listReportHistory();

  const historyReport = buildHistoryReport({ ownership, reports: registered, history });
  const trendReport = buildTrendReport({
    ownership,
    metrics: computeTrendMetrics({
      reportCount: registered.length,
      evidenceCount: evidenceIds.length,
      targetCount: registry.verificationTargets.length,
      blockedCount: orchestration.blockedTargets.length,
      historyCount: history.length,
    }),
    evidenceIds,
    history,
  });

  registerReport(historyReport);
  registerReport(trendReport);
  recordReportHistory(historyReport, 'CREATED');
  recordReportHistory(trendReport, 'CREATED');

  const allReports = listReports();
  const knownEvidence = new Set(evidenceIds);
  const integrity = validateReportIntegrity(allReports, knownEvidence);

  const gateReport = evaluateReportingGates({
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    ownershipValid: input.ownershipValid,
    world1Protected: input.world1Protected,
    reportCount: allReports.length,
  });

  const validation = validateVerificationReporting({ gateReport, validationResult: integrity });
  const blocked = gateReport.blockers.length > 0;
  const authorityState = deriveReportingAuthorityState(blocked, validation.valid);
  const authorityId = nextReportingAuthorityId();

  for (const report of allReports) {
    recordReportHistory(report, 'VALIDATED', authorityState);
  }

  const exports = buildReportExportBundle({
    reports: allReports,
    authorityId,
    sessions: sessions.map((s) => s.sessionId),
    history: listReportHistory(),
  });

  recordReportHistory(allReports[0]!, 'EXPORTED');

  publishVerificationReportingFeedStages(query, !blocked && validation.valid);

  updateVerificationReportingDiagnostics(
    query,
    authorityState,
    authorityId,
    allReports.length,
    new Set(allReports.map((r) => r.reportType)).size,
    listReportHistory().length,
    6,
    validation.issues.length,
  );

  return {
    reportingAuthorityId: authorityId,
    authorityState,
    diagnostics: getVerificationReportingDiagnostics(),
    reports: allReports,
    summaryReport: allReports.find((r) => r.reportType === 'VERIFICATION_SUMMARY_REPORT') ?? null,
    historyEntries: listReportHistory(),
    validationResult: validation,
    exports,
    responseText: composeVerificationReportingResponse(query, authorityId, authorityState, allReports),
  };
}

export function processVerificationReportingRequest(
  query: string,
): PrepareVerificationReportingResult {
  return prepareVerificationReporting(resolveInputFromQuery(query));
}

export function getVerificationReportingContext(
  query: string,
): PrepareVerificationReportingResult {
  return processVerificationReportingRequest(query);
}

export {
  resetVerificationReportStoreForTests,
  resetVerificationHistoryForTests,
};
