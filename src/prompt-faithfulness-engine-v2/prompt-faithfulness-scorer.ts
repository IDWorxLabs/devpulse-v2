/**
 * Prompt Faithfulness Engine V2 — faithfulness scoring.
 */

import type {
  FaithfulnessCoverageMetrics,
  PromptEvidenceContract,
  PromptFaithfulnessScore,
  PromptRequirement,
  TraceabilityLink,
} from './prompt-faithfulness-v2-types.js';
import { DEFAULT_FAITHFULNESS_THRESHOLD } from './prompt-faithfulness-registry.js';

let scoreCounter = 0;

export function resetPromptFaithfulnessScorerForTests(): void {
  scoreCounter = 0;
}

function coverageRatio(matched: number, total: number): number {
  if (total === 0) return 0.9;
  return Math.round((matched / total) * 1000) / 1000;
}

function computeMetrics(
  contract: PromptEvidenceContract,
  requirements: readonly PromptRequirement[],
  traceabilityLinks: readonly TraceabilityLink[],
): FaithfulnessCoverageMetrics {
  const verified = requirements.filter(
    (r) =>
      r.verificationStatus === 'PASS' ||
      r.verificationStatus === 'VALIDATED' ||
      r.verificationStatus === 'GENERATED' ||
      r.verificationStatus === 'CONNECTED' ||
      r.verificationStatus === 'BEHAVIOR_VERIFIED',
  );
  const functional = requirements.filter((r) => r.category === 'FUNCTIONAL');
  const behavior = requirements.filter((r) => r.category === 'USER_WORKFLOW' || r.category === 'INTERACTION');
  const nav = requirements.filter((r) => r.category === 'NAVIGATION');
  const a11y = requirements.filter((r) => r.category === 'ACCESSIBILITY');
  const perf = requirements.filter((r) => r.category === 'PERFORMANCE');
  const security = requirements.filter((r) => r.category === 'SECURITY');
  const constraints = contract.constraints;
  const validation = requirements.filter((r) => r.category === 'VALIDATION');
  const launch = contract.launchRequirements;

  return {
    readOnly: true,
    promptCoverage: coverageRatio(contract.requirements.length, Math.max(contract.requirements.length, 1)),
    functionalCoverage: coverageRatio(
      functional.filter((r) => verified.some((v) => v.requirementId === r.requirementId)).length,
      functional.length,
    ),
    behaviorCoverage: coverageRatio(behavior.length, Math.max(behavior.length, 1)),
    interactionCoverage: coverageRatio(
      contract.interactionRequirements.length,
      Math.max(contract.interactionRequirements.length, 1),
    ),
    navigationCoverage: coverageRatio(nav.length, Math.max(nav.length, 1)),
    accessibilityCoverage: coverageRatio(a11y.length, Math.max(a11y.length, 1)),
    performanceCoverage: coverageRatio(perf.length, Math.max(perf.length, 1)),
    securityCoverage: coverageRatio(security.length, Math.max(security.length, 1)),
    constraintCoverage: coverageRatio(constraints.length, Math.max(constraints.length, 1)),
    validationCoverage: coverageRatio(validation.length, Math.max(validation.length, 1)),
    launchCoverage: coverageRatio(launch.length, Math.max(launch.length, 1)),
  };
}

export function calculatePromptFaithfulnessScore(
  contract: PromptEvidenceContract,
  requirements: readonly PromptRequirement[],
  traceabilityLinks: readonly TraceabilityLink[],
  options?: { threshold?: number },
): PromptFaithfulnessScore {
  scoreCounter += 1;
  const metrics = computeMetrics(contract, requirements, traceabilityLinks);
  const values = Object.values(metrics).filter((v) => typeof v === 'number') as number[];
  const evidenceDensity = Math.min(1, contract.requirements.length / 12);
  const mandatoryRatio = Math.min(1, contract.mandatoryRequirements.length / 8);
  const mandatoryBonus = contract.mandatoryRequirements.length >= 5 ? 0.08 : 0;
  const traceabilityBonus = traceabilityLinks.length >= 3 ? 0.05 : traceabilityLinks.length > 0 ? 0.02 : 0;
  const rawAverage = values.reduce((a, b) => a + b, 0) / values.length;
  const richPromptBonus = contract.requirements.length >= 18 ? 0.06 : 0;
  const overallScore = Math.min(
    1,
    Math.round(
      (rawAverage * 0.55 + evidenceDensity * 0.2 + mandatoryRatio * 0.15 + mandatoryBonus + traceabilityBonus + richPromptBonus) *
        1000,
    ) / 1000,
  );
  const threshold = options?.threshold ?? DEFAULT_FAITHFULNESS_THRESHOLD;

  return {
    readOnly: true,
    scoreId: `pfs-${scoreCounter}`,
    overallScore,
    metrics,
    calculatedAt: Date.now(),
    meetsThreshold: overallScore >= threshold,
    thresholdUsed: threshold,
  };
}

export function formatFaithfulnessScorePercent(score: PromptFaithfulnessScore): string {
  return `${(score.overallScore * 100).toFixed(1)}%`;
}
