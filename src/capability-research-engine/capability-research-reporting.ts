/**
 * Capability Research Engine — report generation.
 */

import type {
  CapabilityEvidenceResult,
  CapabilityGapResearchResult,
  CapabilityResearchRecord,
  CapabilityResearchReport,
  CapabilityRootCauseResearchResult,
  CapabilitySimilarityResult,
  DomainClassificationResult,
} from './capability-research-types.js';

let reportCounter = 0;

const DECISION_ACTIONS: Record<string, string> = {
  NO_GAP_FOUND: 'Continue monitoring; no new capability required',
  EXISTING_CAPABILITY_INSUFFICIENT: 'Enhance or extend existing capability before creating new one',
  NEW_CAPABILITY_REQUIRED: 'Proceed to capability design phase (not execution)',
  DIAGNOSTIC_REQUIRED: 'Add diagnostic instrumentation to existing subsystem',
  OPTIMIZATION_REQUIRED: 'Optimize existing capability performance',
  RESEARCH_INCONCLUSIVE: 'Gather additional evidence before deciding',
};

export function generateCapabilityResearchReport(
  record: CapabilityResearchRecord,
  context: {
    domain: DomainClassificationResult;
    evidence: CapabilityEvidenceResult;
    gapResearch: CapabilityGapResearchResult;
    similarity: CapabilitySimilarityResult;
    rootCause: CapabilityRootCauseResearchResult;
  },
): CapabilityResearchReport {
  reportCounter += 1;

  return {
    reportId: `research-report-${reportCounter}`,
    researchId: record.researchId,
    domain: context.domain.domain,
    decision: record.decision,
    confidence: record.confidence,
    evidence: context.evidence,
    rootCause: context.rootCause,
    duplicateRisk: context.similarity.duplicateRisk,
    similarityScore: context.similarity.similarityScore,
    existingCandidates: context.similarity.existingCandidates,
    gapFindings: context.gapResearch.findings,
    recommendedAction: DECISION_ACTIONS[record.decision] ?? 'Review research findings',
    generatedAt: Date.now(),
  };
}

export function resetCapabilityResearchReportCounterForTests(): void {
  reportCounter = 0;
}
