/**
 * Planning Gate Authority — read-only planning checkpoint orchestrator (V1).
 */

import { evaluateEvidenceSufficiency } from './evidence-sufficiency-evaluator.js';
import { composePlanningGateAnalysis } from './gate-decision-engine.js';
import {
  buildPlanningGateEvidenceSnapshot,
  hasMinimumPlanningGateEvidence,
} from './planning-gate-evidence-snapshot.js';
import {
  getPlanningGateAnalyses,
  getPlanningGateHistory,
  recordPlanningGateAnalysis,
  resetPlanningGateHistoryForTests,
} from './planning-gate-history.js';
import { analyzePlanningReadiness } from './planning-readiness-analyzer.js';
import {
  buildPlanningGateAuthorityReport,
  buildPlanningGateAuthorityReportMarkdown,
} from './planning-gate-report-builder.js';
import { detectPlanningRisks, resetPlanningRiskCounterForTests } from './planning-risk-detector.js';
import type {
  AssessPlanningGateInput,
  PlanningGateAnalysis,
  PlanningGateAssessment,
  PlanningGateAuthorityReport,
} from './planning-gate-types.js';

let analysisCounter = 0;

export function resetPlanningGateCounterForTests(): void {
  analysisCounter = 0;
}

export function resetPlanningGateAuthorityModuleForTests(): void {
  resetPlanningGateCounterForTests();
  resetPlanningRiskCounterForTests();
  resetPlanningGateHistoryForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `planning-gate-${analysisCounter}`;
}

export function assessPlanningGate(input: AssessPlanningGateInput): PlanningGateAnalysis | null {
  const snapshot = buildPlanningGateEvidenceSnapshot(input);
  if (!snapshot || !hasMinimumPlanningGateEvidence(snapshot)) return null;

  const evidenceSufficiency = evaluateEvidenceSufficiency(snapshot);
  const planningRiskAnalysis = detectPlanningRisks({ snapshot, gateInput: input });
  const planningReadiness = analyzePlanningReadiness({
    snapshot,
    evidenceSufficiency,
    planningRiskAnalysis,
  });

  const analysis = composePlanningGateAnalysis({
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    snapshot,
    evidenceSufficiency,
    planningRiskAnalysis,
    planningReadiness,
    gateInput: input,
  });

  if (!input.skipHistoryRecording) {
    recordPlanningGateAnalysis(analysis);
  }

  return analysis;
}

export function runPlanningGateAuthority(input: AssessPlanningGateInput = {}): PlanningGateAssessment {
  const analysis = assessPlanningGate(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'PLANNING_GATE_AUTHORITY_COMPLETE' : 'PLANNING_GATE_AUTHORITY_FAILED',
    analysis,
    failureReason: analysis ? null : 'MISSING_UNIFIED_INTAKE_EVIDENCE',
  };
}

export function buildPlanningGateAuthorityArtifacts(input: {
  analyses?: readonly PlanningGateAnalysis[];
} = {}): {
  report: PlanningGateAuthorityReport;
  markdown: string;
} {
  const history = getPlanningGateHistory();
  const storedAnalyses = input.analyses ?? getPlanningGateAnalyses();
  const report = buildPlanningGateAuthorityReport({
    analyses: storedAnalyses,
    history,
  });

  const latestAnalyses =
    storedAnalyses.length > 0
      ? storedAnalyses
      : report.latestAnalysis
        ? [report.latestAnalysis]
        : [];

  return {
    report,
    markdown: buildPlanningGateAuthorityReportMarkdown(report, latestAnalyses),
  };
}
