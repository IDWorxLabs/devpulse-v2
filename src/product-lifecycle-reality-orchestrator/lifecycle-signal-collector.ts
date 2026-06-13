/**
 * Lifecycle signal collector — gathers evidence from Phase 26 proof chain.
 */

import type {
  LifecycleAuthoritySignal,
  LifecycleSignalCollection,
} from './product-lifecycle-reality-types.js';

export interface CollectLifecycleSignalsInput {
  readOnly: true;
  rawPrompt?: string;
  liveExecutionRunner: import('../live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.js').LiveIdeaToLaunchExecutionRunnerReport | null;
  founderLaunchDecision: import('../founder-launch-decision-authority/founder-launch-decision-authority-types.js').FounderLaunchDecisionReport | null;
  postLaunchReality: import('../post-launch-reality-authority/post-launch-reality-types.js').PostLaunchRealityReport | null;
  adoptionReality: import('../adoption-reality-authority/adoption-reality-types.js').AdoptionRealityReport | null;
  revenueReality: import('../revenue-reality-authority/revenue-reality-types.js').RevenueRealityReport | null;
  productEvolutionReality: import('../product-evolution-reality-authority/product-evolution-reality-types.js').ProductEvolutionRealityReport | null;
  requirementsToPlanContract: import('../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js').RequirementsToPlanContractReport | null;
  planningOnlyFixture?: boolean;
  buildOnlyFixture?: boolean;
  runtimeOnlyFixture?: boolean;
  launchReadinessOnlyFixture?: boolean;
  adoptionOnlyFixture?: boolean;
  revenueOnlyFixture?: boolean;
}

function signalStrength(present: boolean, strong: boolean): LifecycleAuthoritySignal['strength'] {
  if (!present) return 'ABSENT';
  return strong ? 'STRONG' : 'MODERATE';
}

export function collectLifecycleSignals(input: CollectLifecycleSignalsInput): LifecycleSignalCollection {
  const runner = input.liveExecutionRunner;
  const founder = input.founderLaunchDecision;
  const postLaunch = input.postLaunchReality;
  const adoption = input.adoptionReality;
  const revenue = input.revenueReality;
  const evolution = input.productEvolutionReality;
  const contract = input.requirementsToPlanContract ?? runner?.inputSnapshot.requirementsToPlanContract ?? null;

  const ideaConfirmed =
    Boolean(input.rawPrompt?.trim()) ||
    runner?.idea.confirmed === true ||
    runner?.executionState === 'IDEA_CONFIRMED';
  const planConfirmed =
    !input.planningOnlyFixture &&
    (contract?.buildReadyContract != null ||
      runner?.planning.confirmed === true ||
      runner?.executionState === 'PLANNING_CONFIRMED' ||
      (runner?.executionState !== 'NOT_STARTED' && runner?.planning.evidenceLevel === 'CONFIRMED'));
  const buildConfirmed =
    !input.planningOnlyFixture &&
    (founder?.proofSignals.buildMaterializationProven === true ||
      runner?.build.confirmed === true ||
      runner?.executionState === 'BUILD_CONFIRMED' ||
      runner?.build.evidenceLevel === 'CONFIRMED');
  const validationConfirmed =
    !input.planningOnlyFixture &&
    (founder?.proofSignals.validationProven === true ||
      runner?.validation.confirmed === true ||
      runner?.executionState === 'VALIDATION_CONFIRMED' ||
      runner?.validation.evidenceLevel === 'CONFIRMED');
  const runtimeConfirmed =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    (founder?.proofSignals.runtimeProven === true ||
      runner?.runtime.confirmed === true ||
      runner?.executionState === 'RUNTIME_CONFIRMED' ||
      runner?.runtime.evidenceLevel === 'CONFIRMED');
  const launchReadinessConfirmed =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    (founder?.proofSignals.launchReadinessProven === true ||
      runner?.launch.confirmed === true ||
      runner?.executionState === 'LAUNCH_READY' ||
      runner?.launch.evidenceLevel === 'CONFIRMED');
  const launchDecisionSupport =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    (founder?.canLaunchNow === true || founder?.founderLaunchDecision === 'LAUNCH');
  const postLaunchActivity =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    !input.launchReadinessOnlyFixture &&
    Boolean(postLaunch?.activityObserved);
  const adoptionObserved =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    !input.launchReadinessOnlyFixture &&
    Boolean(adoption?.repeatUsageObserved);
  const revenueObserved =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    !input.launchReadinessOnlyFixture &&
    !input.adoptionOnlyFixture &&
    Boolean(revenue?.revenueObserved);
  const evolutionObserved =
    !input.planningOnlyFixture &&
    !input.buildOnlyFixture &&
    !input.runtimeOnlyFixture &&
    !input.launchReadinessOnlyFixture &&
    !input.adoptionOnlyFixture &&
    !input.revenueOnlyFixture &&
    Boolean(
      evolution?.feedbackLearningObserved ||
        evolution?.failureLearningObserved ||
        evolution?.usageLearningObserved ||
        evolution?.revenueLearningObserved,
    );
  const scalingSignals =
    revenueObserved &&
    adoptionObserved &&
    evolutionObserved &&
    !input.revenueOnlyFixture &&
    (revenue?.overallRevenueScore ?? 0) >= 75 &&
    (adoption?.overallAdoptionScore ?? 0) >= 75 &&
    (evolution?.overallEvolutionScore ?? 0) >= 75 &&
    (evolution?.evolutionRiskScore ?? 100) <= 30;

  const signals: LifecycleAuthoritySignal[] = [
    {
      readOnly: true,
      signalId: 'idea-evidence',
      sourceAuthority: 'live-idea-to-launch-execution-runner',
      label: 'Idea evidence',
      present: ideaConfirmed,
      strength: signalStrength(ideaConfirmed, Boolean(input.rawPrompt?.trim())),
      detail: ideaConfirmed ? 'Idea or prompt evidence present' : 'No idea evidence',
    },
    {
      readOnly: true,
      signalId: 'plan-evidence',
      sourceAuthority: 'requirements-to-plan-execution-contract',
      label: 'Requirements and plan evidence',
      present: planConfirmed,
      strength: signalStrength(planConfirmed, contract?.buildReadyContract != null),
      detail: planConfirmed ? 'Plan and requirements evidence confirmed' : 'No plan evidence',
    },
    {
      readOnly: true,
      signalId: 'build-evidence',
      sourceAuthority: 'connected-build-execution',
      label: 'Build materialization proof',
      present: buildConfirmed,
      strength: signalStrength(buildConfirmed, founder?.proofSignals.buildMaterializationProven === true),
      detail: buildConfirmed ? 'Build materialization proven' : 'Build not proven',
    },
    {
      readOnly: true,
      signalId: 'validation-evidence',
      sourceAuthority: 'connected-verification-execution-proof',
      label: 'Validation proof',
      present: validationConfirmed,
      strength: signalStrength(validationConfirmed, founder?.proofSignals.validationProven === true),
      detail: validationConfirmed ? 'Validation proof confirmed' : 'Validation not proven',
    },
    {
      readOnly: true,
      signalId: 'runtime-evidence',
      sourceAuthority: 'connected-runtime-activation-proof',
      label: 'Runtime activation proof',
      present: runtimeConfirmed,
      strength: signalStrength(runtimeConfirmed, founder?.proofSignals.runtimeProven === true),
      detail: runtimeConfirmed ? 'Runtime activation proven' : 'Runtime not proven',
    },
    {
      readOnly: true,
      signalId: 'launch-readiness',
      sourceAuthority: 'connected-launch-readiness-proof',
      label: 'Launch readiness proof',
      present: launchReadinessConfirmed,
      strength: signalStrength(launchReadinessConfirmed, founder?.proofSignals.launchReadinessProven === true),
      detail: launchReadinessConfirmed ? 'Launch readiness proven' : 'Launch readiness not proven',
    },
    {
      readOnly: true,
      signalId: 'launch-decision',
      sourceAuthority: 'founder-launch-decision-authority',
      label: 'Founder launch decision support',
      present: launchDecisionSupport,
      strength: signalStrength(launchDecisionSupport, founder?.canLaunchNow === true),
      detail: launchDecisionSupport ? 'Launch decision supports launch' : 'Launch not supported by decision',
    },
    {
      readOnly: true,
      signalId: 'post-launch-activity',
      sourceAuthority: 'post-launch-reality-authority',
      label: 'Post-launch activity',
      present: postLaunchActivity,
      strength: signalStrength(postLaunchActivity, postLaunch?.postLaunchRealityState === 'ESTABLISHED_PRODUCT'),
      detail: postLaunchActivity ? 'Post-launch activity observed' : 'No post-launch activity',
    },
    {
      readOnly: true,
      signalId: 'adoption-evidence',
      sourceAuthority: 'adoption-reality-authority',
      label: 'Adoption evidence',
      present: adoptionObserved,
      strength: signalStrength(adoptionObserved, adoption?.repeatUsageObserved === true),
      detail: adoptionObserved ? 'Adoption evidence observed' : 'No adoption evidence',
    },
    {
      readOnly: true,
      signalId: 'revenue-evidence',
      sourceAuthority: 'revenue-reality-authority',
      label: 'Revenue evidence',
      present: revenueObserved,
      strength: signalStrength(revenueObserved, revenue?.revenueObserved === true),
      detail: revenueObserved ? 'Revenue evidence observed' : 'No revenue evidence',
    },
    {
      readOnly: true,
      signalId: 'evolution-evidence',
      sourceAuthority: 'product-evolution-reality-authority',
      label: 'Product evolution evidence',
      present: evolutionObserved,
      strength: signalStrength(
        evolutionObserved,
        evolution?.productEvolutionState === 'EVOLVING_PRODUCT' ||
          evolution?.productEvolutionState === 'ADAPTIVE_PRODUCT',
      ),
      detail: evolutionObserved ? 'Evolution learning observed' : 'No evolution evidence',
    },
    {
      readOnly: true,
      signalId: 'scaling-signals',
      sourceAuthority: 'product-lifecycle-reality-orchestrator',
      label: 'Scaling signals',
      present: scalingSignals,
      strength: signalStrength(scalingSignals, scalingSignals),
      detail: scalingSignals ? 'Strong revenue, adoption, and evolution with low risk' : 'Scaling not proven',
    },
  ];

  const missingEvidence: string[] = [];
  if (!ideaConfirmed) missingEvidence.push('Idea or prompt evidence');
  if (!planConfirmed) missingEvidence.push('Requirements and plan evidence');
  if (!buildConfirmed) missingEvidence.push('Build materialization proof');
  if (!validationConfirmed) missingEvidence.push('Validation proof');
  if (!runtimeConfirmed) missingEvidence.push('Runtime activation proof');
  if (!launchReadinessConfirmed) missingEvidence.push('Launch readiness proof');
  if (!postLaunchActivity) missingEvidence.push('Post-launch activity evidence');
  if (!adoptionObserved) missingEvidence.push('Adoption evidence');
  if (!revenueObserved) missingEvidence.push('Revenue evidence');
  if (!evolutionObserved) missingEvidence.push('Product evolution learning evidence');

  return {
    readOnly: true,
    signals,
    ideaEvidencePresent: ideaConfirmed,
    planEvidencePresent: planConfirmed,
    buildEvidencePresent: buildConfirmed,
    validationEvidencePresent: validationConfirmed,
    runtimeEvidencePresent: runtimeConfirmed,
    launchReadinessEvidencePresent: launchReadinessConfirmed,
    launchDecisionSupportPresent: launchDecisionSupport,
    postLaunchActivityPresent: postLaunchActivity,
    adoptionEvidencePresent: adoptionObserved,
    revenueEvidencePresent: revenueObserved,
    evolutionEvidencePresent: evolutionObserved,
    scalingSignalsPresent: scalingSignals,
    missingEvidence,
  };
}
