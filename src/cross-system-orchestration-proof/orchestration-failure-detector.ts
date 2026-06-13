/**
 * Orchestration Failure Detector — aggregates chain failures (V1).
 */

import type {
  AuthorityId,
  DriftFinding,
  DriftType,
  InformationLossItem,
  OrchestrationFailureItem,
  PropagationIssueItem,
  PropagationIssueType,
} from './orchestration-proof-types.js';

let failureCounter = 0;

export function resetOrchestrationFailureCounterForTests(): void {
  failureCounter = 0;
}

function pushFailure(input: {
  failingAuthority: AuthorityId;
  issueType: PropagationIssueType | DriftType;
  lostEvidence: string[];
  severity: OrchestrationFailureItem['severity'];
  launchImpact: string;
  recommendedRepair: string;
  evidence: string[];
}): OrchestrationFailureItem {
  failureCounter += 1;
  return {
    readOnly: true,
    failureId: `orch-failure-${failureCounter}`,
    failingAuthority: input.failingAuthority,
    issueType: input.issueType,
    lostEvidence: input.lostEvidence,
    severity: input.severity,
    launchImpact: input.launchImpact,
    recommendedRepair: input.recommendedRepair,
    evidence: input.evidence,
  };
}

export function detectOrchestrationFailures(input: {
  informationLosses: readonly InformationLossItem[];
  driftFindings: readonly DriftFinding[];
  confidenceIssues: readonly PropagationIssueItem[];
  readinessIssues: readonly PropagationIssueItem[];
  evidenceIssues: readonly PropagationIssueItem[];
}): OrchestrationFailureItem[] {
  const failures: OrchestrationFailureItem[] = [];

  for (const loss of input.informationLosses) {
    failures.push(
      pushFailure({
        failingAuthority: loss.downstreamAuthority,
        issueType: 'LOSS_OF_INFORMATION',
        lostEvidence: [...loss.lostItems],
        severity: loss.severity,
        launchImpact: `${loss.lostItems.length} ${loss.field} item(s) lost between ${loss.upstreamAuthority} and ${loss.downstreamAuthority}.`,
        recommendedRepair: `Ensure ${loss.field} from unified intake propagate to ${loss.downstreamAuthority}.`,
        evidence: [...loss.evidence, ...loss.lostItems],
      }),
    );
  }

  for (const drift of input.driftFindings) {
    failures.push(
      pushFailure({
        failingAuthority: drift.downstreamAuthority,
        issueType: drift.driftType,
        lostEvidence: [...drift.unexpectedItems],
        severity: drift.severity,
        launchImpact: drift.description,
        recommendedRepair: `Reconcile ${drift.driftType.replace(/_/g, ' ').toLowerCase()} at ${drift.downstreamAuthority} with upstream evidence.`,
        evidence: [...drift.evidence],
      }),
    );
  }

  for (const issue of [...input.confidenceIssues, ...input.readinessIssues, ...input.evidenceIssues]) {
    failures.push(
      pushFailure({
        failingAuthority: issue.authorityId,
        issueType: issue.issueType,
        lostEvidence: [...issue.evidence],
        severity: issue.severity,
        launchImpact: issue.description,
        recommendedRepair: repairForIssue(issue),
        evidence: [...issue.evidence],
      }),
    );
  }

  return failures;
}

function repairForIssue(issue: PropagationIssueItem): string {
  switch (issue.issueType) {
    case 'CONFIDENCE_COLLAPSE':
      return 'Investigate why confidence dropped sharply; ensure downstream authorities inherit upstream certainty.';
    case 'READINESS_INFLATION':
      return 'Align readiness labels with planning gate decisions; do not skip clarification states.';
    case 'READINESS_ESCALATION':
      return 'Cap downstream readiness to planning gate permission matrix; gate is authoritative for planning readiness.';
    case 'EVIDENCE_INVENTED':
      return 'Remove or trace invented evidence sources to upstream intake artifacts.';
    case 'EVIDENCE_LOST':
      return 'Propagate all upstream evidence sources through the chain.';
    default:
      return 'Review authority chain integration and re-run orchestration proof.';
  }
}

export function deriveFailingAuthorities(failures: readonly OrchestrationFailureItem[]): AuthorityId[] {
  return [...new Set(failures.map((f) => f.failingAuthority))];
}

export function deriveStrongestAuthorities(input: {
  snapshots: readonly import('./orchestration-proof-types.js').AuthorityProjectSnapshot[];
  failures: readonly OrchestrationFailureItem[];
}): AuthorityId[] {
  const failureCounts = new Map<AuthorityId, number>();
  for (const f of input.failures) {
    failureCounts.set(f.failingAuthority, (failureCounts.get(f.failingAuthority) ?? 0) + 1);
  }

  const seen = new Set<AuthorityId>();
  const ranked: AuthorityId[] = [];
  for (const s of input.snapshots.filter((snap) => snap.reached)) {
    if (seen.has(s.authorityId)) continue;
    seen.add(s.authorityId);
    ranked.push(s.authorityId);
  }

  return ranked
    .map((id) => ({
      id,
      failures: failureCounts.get(id) ?? 0,
      confidence: input.snapshots.find((s) => s.authorityId === id)?.confidence ?? 0,
    }))
    .sort((a, b) => a.failures - b.failures || b.confidence - a.confidence)
    .slice(0, 3)
    .map((s) => s.id);
}

export function buildRepairRecommendations(failures: readonly OrchestrationFailureItem[]): string[] {
  const recs = new Set<string>();
  for (const failure of failures) {
    recs.add(failure.recommendedRepair);
  }
  if (failures.length === 0) {
    recs.add('Chain consistency verified — no repair required.');
  }
  if (failures.some((f) => f.severity === 'CRITICAL')) {
    recs.add('Critical chain failures detected — do not proceed to execution until resolved.');
  }
  return [...recs].slice(0, 8);
}
