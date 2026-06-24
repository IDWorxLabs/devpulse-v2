/**
 * Validation Runtime Governance V1 — validation run planner.
 */

import type {
  ValidationRunPlan,
  ValidationTier,
  ValidatorTierAssignment,
} from './validation-runtime-governance-v1-types.js';
import type { CapabilityImpactGraph } from './validation-runtime-governance-v1-types.js';
import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/index.js';
import { isValidatorAllowedInTier } from './tier-registry.js';
import { AFLA_FORBIDDEN_TIERS } from './validation-runtime-governance-v1-bounds.js';

export function planValidationRun(input: {
  tier: ValidationTier;
  changedFiles?: readonly string[];
  capabilityImpactGraph: CapabilityImpactGraph;
  tierAssignments: readonly ValidatorTierAssignment[];
  metrics: readonly ValidatorRuntimeMetric[];
  explicitValidators?: readonly string[];
}): ValidationRunPlan {
  const byName = new Map(input.metrics.map((m) => [m.validatorName, m]));
  const toRun = new Set<string>();
  const skipped: string[] = [];
  const reusableEvidence: string[] = [];

  if (input.explicitValidators?.length) {
    for (const v of input.explicitValidators) {
      if (isAllowed(v, input.tier, input.tierAssignments, byName)) {
        toRun.add(v);
      } else {
        skipped.push(v);
      }
    }
  } else if (input.changedFiles?.length) {
    const affected = input.capabilityImpactGraph.resolveValidatorsForChangedFiles(input.changedFiles);
    for (const v of affected) {
      if (isAllowed(v, input.tier, input.tierAssignments, byName)) {
        toRun.add(v);
      } else {
        skipped.push(v);
      }
    }
  } else {
    for (const assignment of input.tierAssignments) {
      if (assignment.tier === input.tier) {
        toRun.add(assignment.validatorName);
      }
    }
  }

  for (const v of [...toRun]) {
    const metric = byName.get(v);
    if (!metric) continue;
    if (
      (AFLA_FORBIDDEN_TIERS as readonly string[]).includes(input.tier) &&
      (metric.category === 'AFLA' || v.includes('afla'))
    ) {
      toRun.delete(v);
      skipped.push(v);
    }
  }

  if (input.tier === 'FAST' && toRun.size > 0) {
    const candidates = [...toRun]
      .map((v) => ({ v, metric: byName.get(v), score: specificityScore(v, input.changedFiles) }))
      .filter((c) => c.metric)
      .sort((a, b) => b.score - a.score || (a.metric!.runtimeSeconds - b.metric!.runtimeSeconds));
    const primary = candidates[0]?.v;
    for (const v of toRun) {
      if (v !== primary) {
        toRun.delete(v);
        skipped.push(v);
      }
    }
  }

  let estimatedRuntimeSeconds = 0;
  for (const v of toRun) {
    estimatedRuntimeSeconds += byName.get(v)?.runtimeSeconds ?? 0;
  }

  const rationale =
    input.changedFiles?.length
      ? `Affected capability validation for ${input.changedFiles.length} changed file(s) at tier ${input.tier}`
      : `Full tier ${input.tier} validation plan`;

  return {
    tier: input.tier,
    validatorsToRun: [...toRun].sort(),
    validatorsSkipped: skipped,
    reusableEvidence,
    estimatedRuntimeSeconds: Math.round(estimatedRuntimeSeconds * 10) / 10,
    rationale,
  };
}

function specificityScore(validatorName: string, changedFiles?: readonly string[]): number {
  const base = validatorName.replace('validate:', '');
  if (!changedFiles?.length) return base.length;
  let score = base.length;
  for (const file of changedFiles) {
    const normalized = file.replace(/\\/g, '/').toLowerCase();
    const segments = base.split('-');
    for (const seg of segments) {
      if (seg.length > 3 && normalized.includes(seg)) score += 10;
    }
  }
  return score;
}

function isAllowed(
  validatorName: string,
  tier: ValidationTier,
  assignments: readonly ValidatorTierAssignment[],
  byName: Map<string, ValidatorRuntimeMetric>,
): boolean {
  const metric = byName.get(validatorName);
  if (!metric) return false;
  return isValidatorAllowedInTier(validatorName, metric.category, tier);
}

export function explainValidationDecision(input: {
  tier: ValidationTier;
  validatorName: string;
  changedFiles?: readonly string[];
}): { shouldRun: boolean; why: string; canReuseEvidence: boolean } {
  const aflaBlocked =
    (AFLA_FORBIDDEN_TIERS as readonly string[]).includes(input.tier) &&
    input.validatorName.includes('afla');

  if (aflaBlocked) {
    return {
      shouldRun: false,
      why: `AFLA blocked in tier ${input.tier} — only FULL and LAUNCH`,
      canReuseEvidence: true,
    };
  }

  if (input.changedFiles?.length) {
    return {
      shouldRun: true,
      why: `Changed files map to capability requiring ${input.validatorName}`,
      canReuseEvidence: false,
    };
  }

  return {
    shouldRun: input.tier === 'LAUNCH' || input.tier === 'FULL',
    why: `Tier ${input.tier} policy`,
    canReuseEvidence: input.tier !== 'LAUNCH',
  };
}
