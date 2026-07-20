/**
 * Universal Production Readiness Verification V1 — engineering diagnostics and AEO integration.
 */

import type { ReadinessFinding, ReadinessVerdict, ReleaseDecision } from './universal-production-readiness-types.js';
import { BLOCKED_CAPABILITY_DIAGNOSTIC_MAP } from './production-readiness-policy.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';

export function diagnoseProductionReadiness(input: {
  verdict: ReadinessVerdict;
  releaseDecision: ReleaseDecision;
  blockers: readonly ReadinessFinding[];
  warnings: readonly ReadinessFinding[];
  readinessInput: ProductionReadinessInput;
}): { code: string; detail: string; priority: string; repairCategory: string }[] {
  const diagnoses: { code: string; detail: string; priority: string; repairCategory: string }[] = [];

  for (const blocker of input.blockers) {
    diagnoses.push({
      code: blocker.code,
      detail: blocker.observedEvidence.join('; ') || blocker.findingId,
      priority: blocker.severity === 'BLOCKER' ? 'P0' : 'P1',
      repairCategory: blocker.repairCategory,
    });
  }

  const plan = input.readinessInput.compositionPlan;
  if (plan) {
    for (const reqId of plan.blockedRequirements) {
      const req = plan.capabilityRequirements.find((r) => r.requirementId === reqId);
      const code = req ? BLOCKED_CAPABILITY_DIAGNOSTIC_MAP[req.capabilityKey] ?? 'required_capability_blocked' : 'required_capability_blocked';
      diagnoses.push({ code, detail: reqId, priority: 'P0', repairCategory: 'capability_implementation' });
    }
  }

  if (input.verdict === 'PRODUCTION_READY' && input.blockers.length > 0) {
    diagnoses.push({ code: 'false_production_readiness', detail: 'blockers with ready verdict', priority: 'P0', repairCategory: 'engineering_repair' });
  }

  return diagnoses.sort((a, b) => a.code.localeCompare(b.code));
}

export function detectFalseProductionClaims(input: {
  verdict: ReadinessVerdict;
  blockers: readonly ReadinessFinding[];
  behaviorReportPresent: boolean;
  compositionBlocked: boolean;
}): string[] {
  const claims: string[] = [];
  if (input.verdict === 'PRODUCTION_READY' && input.compositionBlocked) {
    claims.push('false_production_readiness');
  }
  if (input.verdict === 'PRODUCTION_READY' && !input.behaviorReportPresent) {
    claims.push('false_production_readiness');
  }
  if (input.verdict === 'PRODUCTION_READY' && input.blockers.length > 0) {
    claims.push('false_production_readiness');
  }
  return claims;
}

export function detectStaticProductionShell(workspaceContent: string): string[] {
  const patterns = [
    { re: /TODO/i, code: 'static_behavior_shell' },
    { re: /placeholder/i, code: 'static_behavior_shell' },
    { re: /fake login/i, code: 'static_behavior_shell' },
    { re: /coming soon/i, code: 'static_behavior_shell' },
  ];
  return patterns.filter((p) => p.re.test(workspaceContent)).map((p) => p.code);
}
