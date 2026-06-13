/**
 * Lifecycle stage classifier — evidence-backed highest proven stage.
 */

import { LIFECYCLE_STATE_ORDER } from './product-lifecycle-reality-registry.js';
import type {
  LifecycleSignalCollection,
  LifecycleStageClassification,
  ProductLifecycleRealityState,
} from './product-lifecycle-reality-types.js';

function emptyStageScores(): Record<ProductLifecycleRealityState, number> {
  return {
    IDEA_ONLY: 0,
    PLANNED: 0,
    BUILT: 0,
    VALIDATED: 0,
    RUNTIME_READY: 0,
    LAUNCH_READY: 0,
    LAUNCHED: 0,
    ADOPTED: 0,
    REVENUE_GENERATING: 0,
    EVOLVING_PRODUCT: 0,
    SCALING_PRODUCT: 0,
  };
}

export function classifyLifecycleStage(
  signals: LifecycleSignalCollection,
): LifecycleStageClassification {
  const stageScores = emptyStageScores();
  const provenStages: ProductLifecycleRealityState[] = [];
  let highestProvenStage: ProductLifecycleRealityState = 'IDEA_ONLY';
  let classificationReason = 'No lifecycle evidence — default IDEA_ONLY';

  if (signals.ideaEvidencePresent) {
    stageScores.IDEA_ONLY = 100;
    provenStages.push('IDEA_ONLY');
    highestProvenStage = 'IDEA_ONLY';
    classificationReason = 'Idea evidence exists without higher proof';
  }

  if (signals.planEvidencePresent) {
    stageScores.PLANNED = 100;
    provenStages.push('PLANNED');
    highestProvenStage = 'PLANNED';
    classificationReason = 'Requirements and plan evidence confirmed';
  }

  if (signals.buildEvidencePresent) {
    stageScores.BUILT = 100;
    provenStages.push('BUILT');
    highestProvenStage = 'BUILT';
    classificationReason = 'Build materialization proof confirmed';
  }

  if (signals.validationEvidencePresent) {
    stageScores.VALIDATED = 100;
    provenStages.push('VALIDATED');
    highestProvenStage = 'VALIDATED';
    classificationReason = 'Validation proof confirmed';
  }

  if (signals.runtimeEvidencePresent) {
    stageScores.RUNTIME_READY = 100;
    provenStages.push('RUNTIME_READY');
    highestProvenStage = 'RUNTIME_READY';
    classificationReason = 'Runtime activation proof confirmed';
  }

  if (signals.launchReadinessEvidencePresent && signals.launchDecisionSupportPresent) {
    stageScores.LAUNCH_READY = 100;
    provenStages.push('LAUNCH_READY');
    highestProvenStage = 'LAUNCH_READY';
    classificationReason = 'Launch readiness and founder launch decision support confirmed';
  } else if (signals.launchReadinessEvidencePresent) {
    stageScores.LAUNCH_READY = 60;
    classificationReason = 'Launch readiness proven but founder decision does not support launch yet';
  }

  if (signals.postLaunchActivityPresent) {
    stageScores.LAUNCHED = 100;
    provenStages.push('LAUNCHED');
    highestProvenStage = 'LAUNCHED';
    classificationReason = 'Post-launch activity observed';
  }

  if (signals.adoptionEvidencePresent) {
    stageScores.ADOPTED = 100;
    provenStages.push('ADOPTED');
    highestProvenStage = 'ADOPTED';
    classificationReason = 'Adoption evidence observed';
  }

  if (signals.revenueEvidencePresent) {
    stageScores.REVENUE_GENERATING = 100;
    provenStages.push('REVENUE_GENERATING');
    highestProvenStage = 'REVENUE_GENERATING';
    classificationReason = 'Revenue evidence observed';
  }

  if (signals.evolutionEvidencePresent) {
    stageScores.EVOLVING_PRODUCT = 100;
    provenStages.push('EVOLVING_PRODUCT');
    highestProvenStage = 'EVOLVING_PRODUCT';
    classificationReason = 'Product evolution learning evidence observed';
  }

  if (signals.scalingSignalsPresent) {
    stageScores.SCALING_PRODUCT = 100;
    provenStages.push('SCALING_PRODUCT');
    highestProvenStage = 'SCALING_PRODUCT';
    classificationReason = 'Strong revenue, adoption, and evolution signals with low risk';
  }

  const unprovenStages = LIFECYCLE_STATE_ORDER.filter((s) => !provenStages.includes(s));

  return {
    readOnly: true,
    productLifecycleRealityState: highestProvenStage,
    highestProvenStage,
    stageScores,
    provenStages,
    unprovenStages,
    classificationReason,
  };
}
