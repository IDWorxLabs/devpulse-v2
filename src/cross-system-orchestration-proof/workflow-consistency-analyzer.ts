/**
 * Workflow Consistency Analyzer — workflow continuity and drift (V1).
 */

import type { AuthorityProjectSnapshot, DriftFinding } from './orchestration-proof-types.js';
import { normalizeToken } from './project-consistency-tracker.js';

let driftCounter = 0;

export function resetWorkflowDriftCounterForTests(): void {
  driftCounter = 0;
}

function matchesAny(item: string, candidates: readonly string[]): boolean {
  return candidates.some((c) => c === item || c.includes(item) || item.includes(c));
}

export function analyzeWorkflowConsistency(snapshots: readonly AuthorityProjectSnapshot[]): DriftFinding[] {
  const findings: DriftFinding[] = [];
  if (snapshots.length < 2) return findings;

  const baseline = snapshots[0].workflows;
  if (baseline.length === 0) return findings;

  for (let i = 1; i < snapshots.length; i += 1) {
    const downstream = snapshots[i];
    if (!downstream.reached || downstream.workflows.length === 0) continue;

    const unexpected = downstream.workflows.filter(
      (w) => !matchesAny(w, baseline) && !isLikelyWorkflowExpansion(w, baseline),
    );

    const lost = baseline.filter((w) => !matchesAny(w, downstream.workflows));

    if (unexpected.length >= 2) {
      driftCounter += 1;
      findings.push({
        readOnly: true,
        driftId: `workflow-drift-${driftCounter}`,
        driftType: 'WORKFLOW_DRIFT',
        upstreamAuthority: snapshots[0].authorityId,
        downstreamAuthority: downstream.authorityId,
        unexpectedItems: unexpected,
        description: `Unexpected workflows appeared at ${downstream.authorityId} without upstream basis.`,
        severity: unexpected.length >= 3 ? 'HIGH' : 'MEDIUM',
        evidence: unexpected,
      });
    }

    if (lost.length >= 2 && lost.length / baseline.length >= 0.4) {
      driftCounter += 1;
      findings.push({
        readOnly: true,
        driftId: `workflow-drift-${driftCounter}`,
        driftType: 'WORKFLOW_DRIFT',
        upstreamAuthority: snapshots[0].authorityId,
        downstreamAuthority: downstream.authorityId,
        unexpectedItems: lost,
        description: `Workflow continuity broken: ${lost.length} upstream workflow(s) missing at ${downstream.authorityId}.`,
        severity: lost.length / baseline.length >= 0.6 ? 'CRITICAL' : 'HIGH',
        evidence: lost,
      });
    }
  }

  return findings;
}

function isLikelyWorkflowExpansion(item: string, baseline: readonly string[]): boolean {
  const expansionTerms = ['phase', 'milestone', 'foundation', 'setup', 'core', 'launch'];
  if (expansionTerms.some((t) => item.includes(t))) return true;
  return baseline.some((b) => item.includes(b) || b.includes(item));
}
