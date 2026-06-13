/**
 * Lifecycle gap analyzer — missing, weak, and broken proof links.
 */

import type {
  LifecycleGapAnalysis,
  LifecycleSignalCollection,
  LifecycleStageClassification,
  ProductLifecycleInputSnapshot,
} from './product-lifecycle-reality-types.js';

export function analyzeLifecycleGaps(input: {
  signals: LifecycleSignalCollection;
  stageClassification: LifecycleStageClassification;
  inputSnapshot: ProductLifecycleInputSnapshot;
}): LifecycleGapAnalysis {
  const missingEvidence = [...input.signals.missingEvidence];
  const weakEvidence: string[] = [];
  const brokenProofLinks: string[] = [];
  const lifecycleBlockers: string[] = [];
  const stageRegressionRisks: string[] = [];
  const staleEvidence: string[] = [];
  const contradictoryEvidence: string[] = [];

  const founder = input.inputSnapshot.founderLaunchDecision;
  const runner = input.inputSnapshot.liveExecutionRunner;

  if (input.signals.launchReadinessEvidencePresent && !input.signals.launchDecisionSupportPresent) {
    weakEvidence.push('Launch readiness proven but founder decision does not support launch');
  }

  if (input.signals.runtimeEvidencePresent && !input.signals.validationEvidencePresent) {
    brokenProofLinks.push('Runtime proven without validation proof — broken proof chain');
  }

  if (input.signals.buildEvidencePresent && !input.signals.planEvidencePresent) {
    brokenProofLinks.push('Build proven without plan evidence — broken proof chain');
  }

  if (founder?.blockingIssues?.length) {
    lifecycleBlockers.push(...founder.blockingIssues.slice(0, 4));
  }

  if (runner?.chain.firstBrokenStage) {
    brokenProofLinks.push(`Execution chain broken at ${runner.chain.firstBrokenStage}`);
  }

  if (input.signals.revenueEvidencePresent && !input.signals.adoptionEvidencePresent) {
    contradictoryEvidence.push('Revenue claimed without adoption evidence');
  }

  if (input.signals.adoptionEvidencePresent && !input.signals.postLaunchActivityPresent) {
    contradictoryEvidence.push('Adoption claimed without post-launch activity');
  }

  if (input.signals.postLaunchActivityPresent && !input.signals.launchReadinessEvidencePresent) {
    stageRegressionRisks.push('Post-launch activity without launch readiness proof');
  }

  const nextProofGap =
    missingEvidence[0] ??
    weakEvidence[0] ??
    brokenProofLinks[0] ??
    'Continue collecting lifecycle evidence for next stage';

  return {
    readOnly: true,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 8),
    brokenProofLinks: [...new Set(brokenProofLinks)].slice(0, 8),
    lifecycleBlockers: [...new Set(lifecycleBlockers)].slice(0, 8),
    stageRegressionRisks: [...new Set(stageRegressionRisks)].slice(0, 6),
    staleEvidence: [...new Set(staleEvidence)].slice(0, 6),
    contradictoryEvidence: [...new Set(contradictoryEvidence)].slice(0, 6),
    nextProofGap,
  };
}
