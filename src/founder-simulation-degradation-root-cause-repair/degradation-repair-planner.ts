/**
 * Phase 27.02 — Degradation repair planner (V1).
 * Diagnostic recommendations only — does not mutate simulation behavior.
 */

import type {
  FounderSimulationDegradationFinding,
  FounderSimulationDegradationRepairPlan,
  FounderSimulationAuthorityProfile,
  FounderSimulationSubstepProfile,
} from './founder-simulation-degradation-root-cause-types.js';

export function planDegradationRepair(input: {
  findings: readonly FounderSimulationDegradationFinding[];
  slowestAuthority: FounderSimulationAuthorityProfile | null;
  slowestSubstep: FounderSimulationSubstepProfile | null;
  warningCompletionAuthority: string | null;
  totalRuntimeMs: number;
}): FounderSimulationDegradationRepairPlan {
  const actions = input.findings.map(
    (finding) => `repair-${finding.rootCause.toLowerCase()}-${finding.authority.replace(/\s+/g, '-')}`,
  );

  if (input.slowestAuthority) {
    actions.push(`profile-${input.slowestAuthority.authorityName.replace(/\s+/g, '-')}-runtime-cache`);
  }

  if (input.warningCompletionAuthority) {
    actions.push(`trace-warning-path-${input.warningCompletionAuthority.replace(/\s+/g, '-')}`);
  }

  return {
    readOnly: true,
    actions: actions.length ? actions : ['no-degradation-repair-actions-required'],
    primaryBottleneckAuthority: input.slowestAuthority?.authorityName ?? null,
    primaryBottleneckSubstep: input.slowestSubstep?.substepLabel ?? null,
    warningCompletionAuthority: input.warningCompletionAuthority,
    totalSimulationRuntimeMs: input.totalRuntimeMs,
  };
}
