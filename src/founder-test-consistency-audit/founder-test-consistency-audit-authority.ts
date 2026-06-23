/**
 * Phase 26.70 — Founder Test Consistency Audit authority orchestrator (V1).
 * Read-only cross-authority truth reconciliation.
 */

import { createHash } from 'node:crypto';
import { collectConsistencyAuditEvidence } from './claim-evidence-collector.js';
import {
  analyzeAllConsistencyClaims,
  buildConsistencyAuditSections,
  buildFounderAnswerSummary,
  buildFounderTruthMatrix,
} from './consistency-analyzers.js';
import { recordFounderTestConsistencyAuditAssessment, resetFounderTestConsistencyAuditHistoryForTests } from './founder-test-consistency-audit-history.js';
import { buildFounderTestConsistencyAuditReportMarkdown } from './founder-test-consistency-audit-report-builder.js';
import {
  FOUNDER_TEST_CONSISTENCY_AUDIT_CACHE_KEY_PREFIX,
  FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION,
} from './founder-test-consistency-audit-registry.js';
import type {
  AssessFounderTestConsistencyAuditInput,
  FounderTestConsistencyAuditAssessment,
} from './founder-test-consistency-audit-types.js';

let auditCounter = 0;

export function resetFounderTestConsistencyAuditCounterForTests(): void {
  auditCounter = 0;
}

export function resetFounderTestConsistencyAuditModuleForTests(): void {
  resetFounderTestConsistencyAuditCounterForTests();
  resetFounderTestConsistencyAuditHistoryForTests();
}

function nextAuditId(): string {
  auditCounter += 1;
  return `founder-test-consistency-audit-${auditCounter}-${Date.now()}`;
}

function buildCacheKey(auditId: string, contradictionCount: number, overallConfidence: number): string {
  const digest = createHash('sha256')
    .update([auditId, String(contradictionCount), String(overallConfidence)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_TEST_CONSISTENCY_AUDIT_CACHE_KEY_PREFIX}:${digest}`;
}

export async function assessFounderTestConsistencyAudit(
  input: AssessFounderTestConsistencyAuditInput = {},
): Promise<FounderTestConsistencyAuditAssessment> {
  const evidence = await collectConsistencyAuditEvidence(input);
  const claimAudits = analyzeAllConsistencyClaims(evidence);
  const truthMatrix = buildFounderTruthMatrix(claimAudits);
  const sections = buildConsistencyAuditSections(claimAudits);
  const founderAnswerSummary = buildFounderAnswerSummary(claimAudits);

  const contradictionCount = claimAudits.filter((a) => a.contradictionDetected).length;
  const scoringDefectCount = claimAudits.filter((a) => a.rootCause === 'SCORING_DEFECT').length;
  const propagationFailureCount = claimAudits.filter((a) => a.rootCause === 'EVIDENCE_PROPAGATION_FAILURE').length;
  const authorityDisagreementCount = claimAudits.filter((a) => a.rootCause === 'AUTHORITY_DISAGREEMENT').length;
  const realProductGapCount = claimAudits.filter((a) => a.rootCause === 'REAL_PRODUCT_GAP').length;
  const overallConfidence =
    claimAudits.length > 0
      ? Math.round(claimAudits.reduce((sum, audit) => sum + audit.confidence, 0) / claimAudits.length)
      : 0;

  const auditId = nextAuditId();
  const report = {
    readOnly: true as const,
    advisoryOnly: true as const,
    auditId,
    generatedAt: new Date().toISOString(),
    coreQuestion: FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION,
    claimAudits,
    truthMatrix,
    sections,
    contradictionCount,
    scoringDefectCount,
    propagationFailureCount,
    authorityDisagreementCount,
    realProductGapCount,
    overallConfidence,
    founderAnswerSummary,
  };

  const cacheKey = buildCacheKey(auditId, contradictionCount, overallConfidence);
  const assessment: FounderTestConsistencyAuditAssessment = {
    readOnly: true,
    advisoryOnly: true,
    report,
    cacheKey,
  };

  recordFounderTestConsistencyAuditAssessment(assessment);
  return assessment;
}

export function buildFounderTestConsistencyAuditArtifacts(
  assessment: FounderTestConsistencyAuditAssessment,
): {
  readOnly: true;
  reportMarkdown: string;
  truthMatrix: typeof assessment.report.truthMatrix;
} {
  return {
    readOnly: true,
    reportMarkdown: buildFounderTestConsistencyAuditReportMarkdown(assessment.report),
    truthMatrix: assessment.report.truthMatrix,
  };
}
