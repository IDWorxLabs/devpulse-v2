/**
 * Validation Runtime Governance V1 — validation governance planner.
 * Answers: What should run? Why? Can evidence be reused? Can runtime be reduced?
 */

import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/validation-runtime-audit-types.js';
import { TYPICAL_PHASE_REGRESSION_VALIDATORS } from '../validation-runtime-audit-v1/validation-runtime-audit-bounds.js';
import { LAUNCH_ONLY_VALIDATORS } from './validation-runtime-governance-bounds.js';
import {
  resolveAffectedCapabilities,
  resolveValidatorsForChangedFiles,
} from './capability-impact-graph-builder.js';
import type {
  CapabilityImpactGraph,
  ReuseEvidenceType,
  TierRegistry,
  ValidationGovernancePlan,
  ValidationPlanEntry,
  ValidationTier,
} from './validation-runtime-governance-types.js';

export interface PlanValidationInput {
  tier: ValidationTier;
  changedFiles?: readonly string[];
  launchCandidate?: boolean;
  tierRegistry: TierRegistry;
  capabilityGraph: CapabilityImpactGraph;
  metrics: readonly ValidatorRuntimeMetric[];
}

function isEligibleForTier(entry: TierRegistry['entries'][number], tier: ValidationTier): boolean {
  if (!entry.allowedTiers.includes(tier)) return false;
  const tierOrder: ValidationTier[] = ['FAST', 'STANDARD', 'FULL', 'LAUNCH'];
  return tierOrder.indexOf(tier) >= tierOrder.indexOf(entry.minimumTier);
}

function inferEvidenceReuse(
  tier: ValidationTier,
  changedFiles: readonly string[],
): ValidationGovernancePlan['evidenceReused'] {
  const hasChanges = changedFiles.length > 0;
  const types: ReuseEvidenceType[] = [
    'EXECUTION_PROOF',
    'VERIFICATION_PROOF',
    'BUILD_PROOF',
    'BLUEPRINT_PROOF',
    'AFLA_ASSESSMENT',
  ];
  return types.map((evidenceType) => ({
    evidenceType,
    source: `.validation-runtime-governance-v1/reuse-strategy.json`,
    stillValid: !hasChanges || tier === 'FAST',
  }));
}

export function planValidation(input: PlanValidationInput): ValidationGovernancePlan {
  const changedFiles = input.changedFiles ?? [];
  const launchCandidate = input.launchCandidate ?? false;
  const effectiveTier: ValidationTier = launchCandidate ? 'LAUNCH' : input.tier;
  const byName = new Map(input.metrics.map((m) => [m.validatorName, m]));

  const affectedValidators =
    changedFiles.length > 0
      ? resolveValidatorsForChangedFiles(input.capabilityGraph, changedFiles)
      : [];

  const affectedCapabilities =
    changedFiles.length > 0
      ? resolveAffectedCapabilities(input.capabilityGraph, changedFiles)
      : [];

  const toRun: ValidationPlanEntry[] = [];
  const skipped: { validatorName: string; reason: string }[] = [];

  for (const entry of input.tierRegistry.entries) {
    const metric = byName.get(entry.validatorName);
    if (!metric) continue;

    if (effectiveTier === 'LAUNCH') {
      if (entry.minimumTier === 'LAUNCH' || LAUNCH_ONLY_VALIDATORS.includes(entry.validatorName)) {
        toRun.push({
          validatorName: entry.validatorName,
          reason: 'Launch candidate — maximum confidence validation required.',
          tier: 'LAUNCH',
          runtimeSeconds: metric.runtimeSeconds,
        });
      } else if (isEligibleForTier(entry, 'LAUNCH')) {
        toRun.push({
          validatorName: entry.validatorName,
          reason: 'Launch tier includes all eligible validators for full regression.',
          tier: 'LAUNCH',
          runtimeSeconds: metric.runtimeSeconds,
        });
      } else {
        skipped.push({
          validatorName: entry.validatorName,
          reason: 'Not registered or not eligible for launch validation.',
        });
      }
      continue;
    }

    if (!isEligibleForTier(entry, effectiveTier)) {
      skipped.push({
        validatorName: entry.validatorName,
        reason: `Minimum tier ${entry.minimumTier} exceeds requested ${effectiveTier}.`,
      });
      continue;
    }

    if (entry.forbiddenInFast && effectiveTier === 'FAST') {
      skipped.push({
        validatorName: entry.validatorName,
        reason: 'Forbidden in FAST tier (AFLA, UVL full suite, capability audit, large-scale).',
      });
      continue;
    }

    if (entry.aflaGated && (effectiveTier === 'FAST' || effectiveTier === 'STANDARD')) {
      skipped.push({
        validatorName: entry.validatorName,
        reason: 'AFLA gated — runs only in FULL and LAUNCH tiers.',
      });
      continue;
    }

    if (effectiveTier === 'FAST') {
      const isAffected = affectedValidators.includes(entry.validatorName);
      const isFileCheckOnly =
        metric.runtimeSeconds <= 5 &&
        metric.workPatterns.npmBuildCount === 0 &&
        metric.workPatterns.previewServerCount === 0 &&
        metric.workPatterns.playwrightExecutionCount === 0;
      if (changedFiles.length > 0) {
        if (!isAffected && !isFileCheckOnly) {
          skipped.push({
            validatorName: entry.validatorName,
            reason: 'FAST tier — targeted validation only for affected capability scope.',
          });
          continue;
        }
      } else if (!isFileCheckOnly) {
        skipped.push({
          validatorName: entry.validatorName,
          reason: 'FAST tier — no change scope; file-check validators only.',
        });
        continue;
      }
    }

    if (effectiveTier === 'STANDARD' && changedFiles.length > 0) {
      const isAffected = affectedValidators.includes(entry.validatorName);
      const isIntegration =
        metric.category === 'CONNECTED_PIPELINE' ||
        metric.category === 'FOUNDATION' ||
        affectedCapabilities.some((c) => c.validators.includes(entry.validatorName));
      if (!isAffected && !isIntegration && metric.costTier === 'CRITICAL') {
        skipped.push({
          validatorName: entry.validatorName,
          reason: 'STANDARD tier — skip critical validators outside affected scope.',
        });
        continue;
      }
    }

    const reason = affectedValidators.includes(entry.validatorName)
      ? `Affected capability validator for changed files (${affectedCapabilities.map((c) => c.capabilityId).join(', ') || 'scope'}).`
      : metric.runtimeSeconds <= 5
        ? 'FAST file-check validator — always-on local regression.'
        : `Eligible for ${effectiveTier} tier per minimum tier ${entry.minimumTier}.`;

    toRun.push({
      validatorName: entry.validatorName,
      reason,
      tier: effectiveTier,
      runtimeSeconds: metric.runtimeSeconds,
    });
  }

  for (const name of TYPICAL_PHASE_REGRESSION_VALIDATORS) {
    if (effectiveTier === 'FAST' && LAUNCH_ONLY_VALIDATORS.includes(name)) {
      if (!skipped.some((s) => s.validatorName === name)) {
        skipped.push({
          validatorName: name,
          reason: 'Phase regression validator deferred from FAST tier to LAUNCH.',
        });
      }
    }
  }

  const projectedRuntimeSeconds = Math.round(
    toRun.reduce((s, v) => s + v.runtimeSeconds, 0) * 0.22 * 10,
  ) / 10;

  const evidenceReused = inferEvidenceReuse(effectiveTier, changedFiles);

  const whatShouldRun = toRun.length
    ? `${toRun.length} validators for ${effectiveTier} tier${changedFiles.length ? ` (${affectedCapabilities.map((c) => c.capabilityId).join(', ') || 'affected scope'})` : ''}.`
    : `No validators required for ${effectiveTier} tier with current change scope.`;

  const whyShouldRun = launchCandidate
    ? 'Launch candidate exists — UVL, PAI, AFLA, and production readiness validation required for maximum confidence.'
    : changedFiles.length > 0
      ? `Changed files map to ${affectedCapabilities.length} capability(ies); run targeted validators only.`
      : `${effectiveTier} tier policy selects eligible validators by minimum tier and cost profile.`;

  const canEvidenceBeReused = evidenceReused.some((e) => e.stillValid)
    ? `Yes — ${evidenceReused.filter((e) => e.stillValid).map((e) => e.evidenceType).join(', ')} can be reused when inputs unchanged.`
    : 'Limited reuse — changed files invalidate cached proofs; rebuild and preview cache apply.';

  const canRuntimeBeReduced =
    skipped.length > 0
      ? `Yes — skip ${skipped.length} validators; shared preview/build/playwright pools and artifact reuse reduce duplicate work.`
      : 'Runtime already minimal for this tier and change scope.';

  return {
    tier: effectiveTier,
    changedFiles,
    launchCandidate,
    validatorsToRun: toRun,
    validatorsSkipped: skipped,
    evidenceReused,
    projectedRuntimeSeconds,
    confidencePreserved: launchCandidate || effectiveTier !== 'FAST' || toRun.length > 0,
    answers: {
      whatShouldRun,
      whyShouldRun,
      canEvidenceBeReused,
      canRuntimeBeReduced,
    },
  };
}
