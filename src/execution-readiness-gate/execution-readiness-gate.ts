/**
 * Execution Readiness Gate — read-only execution checkpoint orchestrator (V1).
 */

import { analyzeExecutionBlockers, resetExecutionBlockerCounterForTests } from './execution-blocker-analyzer.js';
import {
  composeExecutionReadinessAnalysis,
  resetExecutionDecisionCounterForTests,
} from './execution-decision-engine.js';
import {
  consolidateExecutionEvidence,
  hasMinimumExecutionEvidence,
} from './execution-evidence-consolidator.js';
import {
  getExecutionReadinessAnalyses,
  getExecutionReadinessHistory,
  recordExecutionReadinessAnalysis,
  resetExecutionReadinessHistoryForTests,
} from './execution-history.js';
import { detectExecutionRisks, resetExecutionRiskCounterForTests } from './execution-risk-detector.js';
import { scoreExecutionReadiness } from './execution-readiness-scorer.js';
import {
  buildExecutionReadinessGateReport,
  buildExecutionReadinessGateReportMarkdown,
} from './execution-report-builder.js';
import type {
  AssessExecutionReadinessInput,
  ExecutionReadinessAnalysis,
  ExecutionReadinessAssessment,
  ExecutionReadinessGateReport,
} from './execution-readiness-types.js';

let analysisCounter = 0;

export function resetExecutionReadinessGateCounterForTests(): void {
  analysisCounter = 0;
}

export function resetExecutionReadinessGateModuleForTests(): void {
  resetExecutionReadinessGateCounterForTests();
  resetExecutionRiskCounterForTests();
  resetExecutionBlockerCounterForTests();
  resetExecutionDecisionCounterForTests();
  resetExecutionReadinessHistoryForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `execution-readiness-${analysisCounter}`;
}

export function assessExecutionReadiness(
  input: AssessExecutionReadinessInput,
): ExecutionReadinessAnalysis | null {
  if (!hasMinimumExecutionEvidence(input)) return null;

  const snapshot = consolidateExecutionEvidence(input);
  const riskAnalysis = detectExecutionRisks(snapshot);
  const blockerSummary = analyzeExecutionBlockers(input);
  const readinessScore = scoreExecutionReadiness({ snapshot, riskAnalysis, blockerSummary });

  const analysis = composeExecutionReadinessAnalysis({
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    gateInput: input,
    snapshot,
    riskAnalysis,
    blockerSummary,
    readinessScore,
  });

  if (!input.skipHistoryRecording) {
    recordExecutionReadinessAnalysis(analysis);
  }

  return analysis;
}

export function runExecutionReadinessGate(
  input: AssessExecutionReadinessInput = {},
): ExecutionReadinessAssessment {
  const analysis = assessExecutionReadiness(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'EXECUTION_READINESS_GATE_COMPLETE' : 'EXECUTION_READINESS_GATE_FAILED',
    analysis,
    failureReason: analysis ? null : 'INSUFFICIENT_UPSTREAM_EVIDENCE',
  };
}

export function buildExecutionReadinessGateArtifacts(input: {
  analyses?: readonly ExecutionReadinessAnalysis[];
} = {}): {
  report: ExecutionReadinessGateReport;
  markdown: string;
} {
  const history = getExecutionReadinessHistory();
  const storedAnalyses = input.analyses ?? getExecutionReadinessAnalyses();
  const report = buildExecutionReadinessGateReport({ analyses: storedAnalyses, history });

  const latestAnalyses =
    storedAnalyses.length > 0
      ? storedAnalyses
      : report.latestAnalysis
        ? [report.latestAnalysis]
        : [];

  return {
    report,
    markdown: buildExecutionReadinessGateReportMarkdown(report, latestAnalyses),
  };
}
