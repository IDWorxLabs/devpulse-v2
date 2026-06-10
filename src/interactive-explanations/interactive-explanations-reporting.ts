/**
 * Interactive Explanations — reporting.
 */

import type {
  InteractiveExplanationRecord,
  InteractiveExplanationsEvaluation,
  InteractiveExplanationsReport,
  NextStepGuidanceAnalysis,
  ReasoningExplanationAnalysis,
  ReportInterpretationAnalysis,
  SystemExplanationAnalysis,
  WorkflowExplanationAnalysis,
} from './interactive-explanations-types.js';
import { getInteractiveExplanationsCacheStats } from './interactive-explanations-cache.js';
import { getInteractiveExplanationsHistorySize } from './interactive-explanations-history.js';

let reportCount = 0;

export function generateInteractiveExplanationsReport(
  record: InteractiveExplanationRecord,
  evaluation: InteractiveExplanationsEvaluation,
  system: SystemExplanationAnalysis,
  workflow: WorkflowExplanationAnalysis,
  reasoning: ReasoningExplanationAnalysis,
  report: ReportInterpretationAnalysis,
  guidance: NextStepGuidanceAnalysis,
  missingSignals: string[],
): InteractiveExplanationsReport {
  reportCount += 1;
  const cache = getInteractiveExplanationsCacheStats();
  const recommendations: string[] = [];

  if (system.undocumentedSystems.length > 0) {
    recommendations.push('Explain systems, capabilities, domains, and phase introductions');
  }
  if (workflow.undocumentedWorkflows.length > 0) {
    recommendations.push('Explain project, verification, trust, and launch workflows');
  }
  if (reasoning.undocumentedReasoningAreas.length > 0) {
    recommendations.push('Explain trust, verification, and governance decision reasoning');
  }
  if (report.undocumentedReportAreas.length > 0) {
    recommendations.push('Explain trust, verification, hardening, and checkpoint reports');
  }
  if (guidance.undocumentedGuidanceAreas.length > 0) {
    recommendations.push('Provide next phase, checkpoint, and action guidance');
  }
  if (missingSignals.length > 0) {
    recommendations.push('Collect missing explanation signals before user-facing rollout');
  }
  if (evaluation.state === 'READY' || evaluation.state === 'PARTIAL') {
    recommendations.push('Continue interactive explanation coverage monitoring');
  } else {
    recommendations.push('Require explanation review before conversational guidance');
  }

  return {
    explanationCoverageScore: record.explanationCoverageScore,
    workflowCoverageScore: record.workflowCoverageScore,
    reasoningCoverageScore: record.reasoningCoverageScore,
    reportCoverageScore: evaluation.reportCoverageScore,
    guidanceCoverageScore: evaluation.guidanceCoverageScore,
    coverageLevel: record.coverageLevel,
    state: record.state,
    confidence: record.confidence,
    systemExplanationCoverage: [
      'Systems expose purpose and boundaries',
      'Capabilities explain what users can discover',
      ...system.systemWarnings,
    ],
    workflowExplanationCoverage: [
      'Workflows explain how tasks progress',
      'Verification workflows explain pass and fail outcomes',
      ...workflow.workflowWarnings,
    ],
    reasoningCoverage: [
      'Trust decisions explain score changes',
      'Verification decisions explain failure causes',
      ...reasoning.reasoningWarnings,
    ],
    reportCoverage: [
      'Trust reports explain confidence levels',
      'Checkpoint reports explain readiness gates',
      ...report.reportWarnings,
    ],
    guidanceCoverage: [
      'Next phase guidance explains roadmap progression',
      'Next action guidance explains immediate steps',
      ...guidance.guidanceWarnings,
    ],
    undocumentedSystems: [...system.undocumentedSystems],
    undocumentedWorkflows: [...workflow.undocumentedWorkflows],
    undocumentedReasoningAreas: [...reasoning.undocumentedReasoningAreas],
    undocumentedReportAreas: [...report.undocumentedReportAreas],
    undocumentedGuidanceAreas: [...guidance.undocumentedGuidanceAreas],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getInteractiveExplanationsHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetInteractiveExplanationsReportingForTests(): void {
  reportCount = 0;
}
