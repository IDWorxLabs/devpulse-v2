/**
 * Lifecycle next action engine — evidence-backed next required action.
 */

import type {
  LifecycleGapAnalysis,
  LifecycleNextAction,
  LifecycleNextActionResult,
  LifecycleRiskAnalysis,
  LifecycleSignalCollection,
  LifecycleStageClassification,
  ProductLifecycleInputSnapshot,
} from './product-lifecycle-reality-types.js';

export function determineLifecycleNextAction(input: {
  signals: LifecycleSignalCollection;
  stageClassification: LifecycleStageClassification;
  gapAnalysis: LifecycleGapAnalysis;
  riskAnalysis: LifecycleRiskAnalysis;
  inputSnapshot: ProductLifecycleInputSnapshot;
}): LifecycleNextActionResult {
  const founder = input.inputSnapshot.founderLaunchDecision;
  const supportingEvidence: string[] = [];
  let nextRequiredAction: LifecycleNextAction = 'CAPTURE_REQUIREMENTS';
  let actionReason = 'No lifecycle evidence — capture requirements first';
  let evidenceBacked = true;

  if ((founder?.blockingIssues?.length ?? 0) > 0 || founder?.founderLaunchDecision === 'FIX_BLOCKERS') {
    nextRequiredAction = 'FIX_BLOCKERS';
    actionReason = 'Founder launch decision identifies blockers requiring resolution';
    supportingEvidence.push(...(founder?.blockingIssues ?? []).slice(0, 2));
  } else if (founder?.founderLaunchDecision === 'RUN_MORE_PROOF') {
    nextRequiredAction = 'RUN_MORE_PROOF';
    actionReason = 'Founder launch decision requires additional proof before progression';
    supportingEvidence.push('Founder launch decision: RUN_MORE_PROOF');
  } else if (!input.signals.ideaEvidencePresent) {
    nextRequiredAction = 'CAPTURE_REQUIREMENTS';
    actionReason = 'No idea or requirements evidence — capture product intent first';
    supportingEvidence.push('Missing idea evidence');
  } else if (!input.signals.planEvidencePresent) {
    nextRequiredAction = 'CAPTURE_REQUIREMENTS';
    actionReason = 'Idea present but plan evidence missing — complete requirements-to-plan contract';
    supportingEvidence.push('Idea evidence present', 'Plan evidence absent');
  } else if (!input.signals.buildEvidencePresent) {
    nextRequiredAction = 'COMPLETE_BUILD';
    actionReason = 'Plan confirmed but build materialization not proven';
    supportingEvidence.push('Plan evidence confirmed', 'Build proof absent');
  } else if (!input.signals.validationEvidencePresent) {
    nextRequiredAction = 'RUN_VALIDATION';
    actionReason = 'Build confirmed but validation proof missing';
    supportingEvidence.push('Build materialization proven', 'Validation proof absent');
  } else if (!input.signals.runtimeEvidencePresent) {
    nextRequiredAction = 'PROVE_RUNTIME';
    actionReason = 'Validation confirmed but runtime activation not proven';
    supportingEvidence.push('Validation proof confirmed', 'Runtime activation absent');
  } else if (!input.signals.launchReadinessEvidencePresent || !input.signals.launchDecisionSupportPresent) {
    nextRequiredAction = 'DECIDE_LAUNCH';
    actionReason = 'Runtime ready — obtain launch readiness proof and founder launch decision';
    supportingEvidence.push('Runtime activation proven');
    if (!input.signals.launchReadinessEvidencePresent) supportingEvidence.push('Launch readiness absent');
    if (!input.signals.launchDecisionSupportPresent) supportingEvidence.push('Launch decision not supportive');
  } else if (!input.signals.postLaunchActivityPresent) {
    nextRequiredAction = 'OBSERVE_POST_LAUNCH';
    actionReason = 'Launch ready — observe post-launch activity before claiming adoption or revenue';
    supportingEvidence.push('Launch readiness and decision support confirmed', 'Post-launch activity absent');
  } else if (!input.signals.adoptionEvidencePresent) {
    nextRequiredAction = 'IMPROVE_ADOPTION';
    actionReason = 'Product launched but adoption evidence not observed';
    supportingEvidence.push('Post-launch activity observed', 'Adoption evidence absent');
  } else if (!input.signals.revenueEvidencePresent) {
    nextRequiredAction = 'PROVE_REVENUE';
    actionReason = 'Adoption observed but revenue evidence not proven';
    supportingEvidence.push('Adoption evidence observed', 'Revenue evidence absent');
  } else if (!input.signals.evolutionEvidencePresent) {
    nextRequiredAction = 'EVOLVE_PRODUCT';
    actionReason = 'Revenue generating but product evolution learning not observed';
    supportingEvidence.push('Revenue evidence observed', 'Evolution learning absent');
  } else if (!input.signals.scalingSignalsPresent) {
    nextRequiredAction = 'SCALE_PRODUCT';
    actionReason = 'Evolution observed — strengthen revenue, adoption, and evolution signals for scaling';
    supportingEvidence.push('Evolution learning observed', 'Scaling signals not yet proven');
  } else {
    nextRequiredAction = 'SCALE_PRODUCT';
    actionReason = 'Scaling signals proven — continue evidence-backed growth with low lifecycle risk';
    supportingEvidence.push('Revenue, adoption, and evolution signals strong');
  }

  if (input.gapAnalysis.brokenProofLinks.length > 0 && nextRequiredAction !== 'FIX_BLOCKERS') {
    nextRequiredAction = 'RUN_MORE_PROOF';
    actionReason = `Broken proof chain: ${input.gapAnalysis.brokenProofLinks[0]}`;
    supportingEvidence.push(...input.gapAnalysis.brokenProofLinks.slice(0, 2));
  }

  return {
    readOnly: true,
    nextRequiredAction,
    actionReason,
    evidenceBacked: evidenceBacked && supportingEvidence.length > 0,
    supportingEvidence: supportingEvidence.slice(0, 6),
  };
}
