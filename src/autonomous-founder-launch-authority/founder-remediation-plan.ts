/**
 * Autonomous Founder Launch Authority V1 — remediation plan for NEEDS_AUTOFIX verdicts.
 */

import type {
  FounderEvidenceSnapshot,
  FounderRemediationIssue,
  FounderRemediationPlan,
  FounderReviewerAssessment,
} from './autonomous-founder-launch-authority-types.js';
import { DEFAULT_AUTOFIX_MAX_RETRIES } from './autonomous-founder-launch-authority-registry.js';

let planCounter = 0;

function nextPlanId(): string {
  planCounter += 1;
  return `founder-remediation-${Date.now()}-${planCounter}`;
}

export function resetFounderRemediationPlanCounterForTests(): void {
  planCounter = 0;
}

function inferSeverity(text: string): FounderRemediationIssue['severity'] {
  if (/critical|security|block|fail/i.test(text)) return 'CRITICAL';
  if (/high|missing|broken/i.test(text)) return 'HIGH';
  if (/warning|gap|partial/i.test(text)) return 'MEDIUM';
  return 'LOW';
}

function isAutofixEligible(sourceId: string, severity: FounderRemediationIssue['severity']): boolean {
  if (severity === 'LOW') return false;
  return [
    'build-reality',
    'blueprint-structure',
    'blueprint-visual',
    'feature-reality',
    'universal-feature-contract',
    'engineering-reality',
  ].includes(sourceId);
}

function issuesFromEvidence(evidence: FounderEvidenceSnapshot): FounderRemediationIssue[] {
  const sources = [
    evidence.buildReality,
    evidence.blueprintStructure,
    evidence.blueprintVisual,
    evidence.featureReality,
    evidence.universalFeatureContract,
    evidence.engineeringReality,
  ];

  const issues: FounderRemediationIssue[] = [];
  for (const source of sources) {
    if (source.passed) continue;
    for (const blocker of source.blockers.slice(0, 3)) {
      const severity = inferSeverity(blocker);
      issues.push({
        readOnly: true,
        issueId: `${source.sourceId}-${issues.length + 1}`,
        sourceReviewer: source.sourceId.includes('feature') ? 'qa' : 'senior-engineer',
        severity,
        summary: blocker,
        evidenceSource: source.sourceName,
        recommendedFix: `Resolve ${source.sourceName} blocker and re-run evidence pipeline.`,
        autofixEligible: isAutofixEligible(source.sourceId, severity),
      });
    }
  }
  return issues;
}

function issuesFromReviewers(reviewers: FounderReviewerAssessment[]): FounderRemediationIssue[] {
  const issues: FounderRemediationIssue[] = [];
  for (const reviewer of reviewers) {
    for (const risk of reviewer.risks.slice(0, 2)) {
      if (!risk.trim()) continue;
      const severity = inferSeverity(risk);
      issues.push({
        readOnly: true,
        issueId: `${reviewer.role}-${issues.length + 1}`,
        sourceReviewer: reviewer.role,
        severity,
        summary: risk,
        evidenceSource: reviewer.reviewerName,
        recommendedFix: `Address ${reviewer.reviewerName} risk and re-run Founder Authority.`,
        autofixEligible: severity !== 'LOW' && reviewer.role !== 'founder',
      });
    }
  }
  return issues;
}

export function buildFounderRemediationPlan(input: {
  evidence: FounderEvidenceSnapshot;
  reviewers: FounderReviewerAssessment[];
  maxRetries?: number;
  retryAttempt?: number;
}): FounderRemediationPlan | null {
  const issues = [...issuesFromEvidence(input.evidence), ...issuesFromReviewers(input.reviewers)].slice(
    0,
    12,
  );
  if (issues.length === 0) return null;

  return {
    readOnly: true,
    planId: nextPlanId(),
    generatedAt: new Date().toISOString(),
    verdict: 'NEEDS_AUTOFIX',
    issues,
    autofixPipelineTarget: 'AutoFix Pipeline',
    maxRetries: input.maxRetries ?? DEFAULT_AUTOFIX_MAX_RETRIES,
    retryAttempt: input.retryAttempt ?? 0,
  };
}
