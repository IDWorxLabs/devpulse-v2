/**
 * Confidence Propagation Analyzer — detects confidence collapse across chain (V1).
 */

import type {
  AuthorityProjectSnapshot,
  ConfidencePropagationAnalysis,
  PropagationIssueItem,
} from './orchestration-proof-types.js';

const COLLAPSE_THRESHOLD = 25;

let issueCounter = 0;

export function resetConfidencePropagationCountersForTests(): void {
  issueCounter = 0;
}

export function analyzeConfidencePropagation(
  snapshots: readonly AuthorityProjectSnapshot[],
): ConfidencePropagationAnalysis {
  const issues: PropagationIssueItem[] = [];
  const steps: import('./orchestration-proof-types.js').ConfidencePropagationStep[] = [];

  let previous: number | null = null;
  let maxDrop = 0;
  let collapseAuthority: import('./orchestration-proof-types.js').AuthorityId | null = null;

  for (const snap of snapshots) {
    if (!snap.reached || snap.confidence == null) continue;

    const delta = previous != null ? snap.confidence - previous : null;
    steps.push({
      readOnly: true,
      authorityId: snap.authorityId,
      confidence: snap.confidence,
      deltaFromPrevious: delta,
    });

    if (delta != null && delta < -COLLAPSE_THRESHOLD) {
      const drop = Math.abs(delta);
      if (drop > maxDrop) {
        maxDrop = drop;
        collapseAuthority = snap.authorityId;
      }
      issueCounter += 1;
      issues.push({
        readOnly: true,
        issueId: `confidence-issue-${issueCounter}`,
        issueType: 'CONFIDENCE_COLLAPSE',
        authorityId: snap.authorityId,
        description: `Confidence collapsed by ${drop} points at ${snap.authorityId} (${previous} → ${snap.confidence}).`,
        severity: drop >= 40 ? 'CRITICAL' : 'HIGH',
        evidence: [`PREVIOUS_${previous}`, `CURRENT_${snap.confidence}`, `DROP_${drop}`],
      });
    }

    previous = snap.confidence;
  }

  return {
    readOnly: true,
    steps,
    collapseDetected: collapseAuthority != null,
    collapseAuthority,
    maxDrop,
    issues,
  };
}
