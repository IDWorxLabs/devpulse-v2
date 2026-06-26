/**
 * Prompt Faithfulness Engine V2 — continuous regression monitor.
 */

import type {
  ContinuousMonitoringResult,
  DriftDetectionResult,
  PromptFaithfulnessScore,
} from './prompt-faithfulness-v2-types.js';
import { detectPromptDrift } from './prompt-drift-detector.js';
import type { PromptEvidenceContract, PromptRequirement } from './prompt-faithfulness-v2-types.js';
import { calculatePromptFaithfulnessScore } from './prompt-faithfulness-scorer.js';
import { DEFAULT_DRIFT_THRESHOLD } from './prompt-faithfulness-registry.js';

let monitorCounter = 0;

export function resetPromptRegressionMonitorForTests(): void {
  monitorCounter = 0;
}

export function runContinuousFaithfulnessMonitoring(input: {
  trigger: string;
  contract: PromptEvidenceContract;
  requirements: readonly PromptRequirement[];
  currentModules: readonly string[];
  previousScore: PromptFaithfulnessScore;
  traceabilityLinkCount: number;
}): ContinuousMonitoringResult {
  monitorCounter += 1;

  const updatedScore = calculatePromptFaithfulnessScore(
    input.contract,
    input.requirements,
    Array.from({ length: input.traceabilityLinkCount }, (_, i) => ({
      readOnly: true as const,
      linkId: `mon-${i}`,
      artifactPath: `artifact-${i}`,
      artifactType: 'FILE' as const,
      requirementIds: [],
      evidenceIds: [],
    })),
  );

  const driftResult: DriftDetectionResult = detectPromptDrift({
    contract: input.contract,
    requirements: input.requirements,
    currentModules: input.currentModules,
    currentFaithfulnessScore: updatedScore,
    previousFaithfulnessScore: input.previousScore,
  });

  const scoreDrop = input.previousScore.overallScore - updatedScore.overallScore;
  const changeAccepted = !driftResult.detected || scoreDrop <= DEFAULT_DRIFT_THRESHOLD;
  const rollbackRecommended = driftResult.blocksLaunchApproval || scoreDrop > DEFAULT_DRIFT_THRESHOLD * 2;

  return {
    readOnly: true,
    monitoringId: `monitor-${monitorCounter}`,
    trigger: input.trigger,
    driftResult,
    updatedScore,
    changeAccepted,
    rollbackRecommended,
  };
}
