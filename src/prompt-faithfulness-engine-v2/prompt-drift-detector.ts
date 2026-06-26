/**
 * Prompt Faithfulness Engine V2 — drift detection.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type {
  DriftDetectionResult,
  PromptEvidenceContract,
  PromptFaithfulnessScore,
  PromptRequirement,
} from './prompt-faithfulness-v2-types.js';
import { DEFAULT_DRIFT_THRESHOLD } from './prompt-faithfulness-registry.js';

let driftCounter = 0;

export function resetPromptDriftDetectorForTests(): void {
  driftCounter = 0;
}

export function detectPromptDrift(input: {
  contract: PromptEvidenceContract;
  requirements: readonly PromptRequirement[];
  currentModules: readonly string[];
  currentFaithfulnessScore: PromptFaithfulnessScore;
  previousFaithfulnessScore?: PromptFaithfulnessScore;
}): DriftDetectionResult {
  driftCounter += 1;
  const extraction = extractPromptFeatures(input.contract.rawPrompt);
  const expectedModules = extraction.requiredModules.filter((m) => m !== 'auth');
  const removedFeatures = expectedModules.filter(
    (expected) => !input.currentModules.some((m) => m.includes(expected) || expected.includes(m)),
  );

  const unsupportedFeatures: string[] = [];
  const bannedPatterns = [/projects/, /tasks/, /team/, /deals/, /leads/];
  if (extraction.isCustomDomainPrompt) {
    for (const mod of input.currentModules) {
      if (bannedPatterns.some((p) => p.test(mod)) && !expectedModules.includes(mod)) {
        unsupportedFeatures.push(mod);
      }
    }
  }

  const missingAccessibility = input.contract.accessibilityRequirements
    .filter((r) => r.priority === 'MANDATORY')
    .map((r) => r.normalizedRequirement)
    .filter((req) => !input.requirements.some((r) => r.description.includes(req.slice(0, 20))));

  const missingConstraints = input.contract.constraints
    .map((c) => c.normalizedRequirement)
    .filter((c) => c.length > 10)
    .slice(0, 3);

  const scoreBefore = input.previousFaithfulnessScore?.overallScore ?? input.currentFaithfulnessScore.overallScore;
  const scoreAfter = input.currentFaithfulnessScore.overallScore;
  const scoreDrop = scoreBefore - scoreAfter;

  const driftTypes: string[] = [];
  if (removedFeatures.length) driftTypes.push('REMOVED_FEATURES');
  if (unsupportedFeatures.length) driftTypes.push('UNSUPPORTED_FEATURES');
  if (missingAccessibility.length) driftTypes.push('MISSING_ACCESSIBILITY');
  if (missingConstraints.length) driftTypes.push('MISSING_CONSTRAINTS');
  if (scoreDrop > DEFAULT_DRIFT_THRESHOLD) driftTypes.push('FAITHFULNESS_SCORE_DROP');

  const detected = driftTypes.length > 0;

  return {
    readOnly: true,
    driftId: `drift-${driftCounter}`,
    detected,
    driftTypes,
    removedFeatures,
    changedWorkflows: [],
    missingAccessibility,
    missingConstraints,
    architectureDivergence: unsupportedFeatures.length ? ['Fallback profile modules detected'] : [],
    unsupportedFeatures,
    faithfulnessScoreBefore: scoreBefore,
    faithfulnessScoreAfter: scoreAfter,
    blocksLaunchApproval: detected && (removedFeatures.length > 0 || unsupportedFeatures.length > 0 || scoreDrop > DEFAULT_DRIFT_THRESHOLD),
  };
}
