/**
 * Live Preview Gate — blocker explanation.
 */

import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type {
  LivePreviewBlockerExplanation,
  LivePreviewEvidenceCollectionResult,
  LivePreviewGateEvaluationResult,
  LivePreviewLockState,
  LivePreviewUnlockVerdict,
} from './live-preview-gate-types.js';
import { gateLabel } from './live-preview-lock-state.js';

export function explainLivePreviewBlocker(input: {
  lockState: LivePreviewLockState;
  unlockVerdict: LivePreviewUnlockVerdict;
  evaluation: LivePreviewGateEvaluationResult;
  evidence: LivePreviewEvidenceCollectionResult;
  launchReadiness: LaunchReadinessPipelineResult;
}): LivePreviewBlockerExplanation {
  const blockingItem = input.evidence.items.find((i) => i.source === input.evaluation.primaryBlockingGate);
  const launchExplanation = input.launchReadiness.explanation;
  const blockingSection = launchExplanation.blockingSections[0];

  const reason =
    input.evaluation.blockingEvidence[0] ??
    input.launchReadiness.verdict.primaryReason ??
    'Required engineering evidence has not passed.';

  const affectedWorkflow =
    blockingItem?.source === 'BEHAVIOR_SIMULATION'
      ? blockingItem.blockers.find((b) => /workflow|expense|emergency/i.test(b)) ?? 'Affected workflow blocked'
      : blockingSection?.lines.find((l) => /workflow|journey/i.test(l)) ?? null;

  const affectedInteraction =
    blockingItem?.source === 'INTERACTION_PROOF'
      ? blockingItem.blockers[0] ?? null
      : launchExplanation.blockingSections.find((s) => s.heading.includes('Interaction'))?.lines[0] ?? null;

  const repairStatus =
    input.lockState === 'LOCKED_AUTONOMOUS_REPAIR'
      ? input.launchReadiness.evidence.sources
          .find((s) => s.sourceId === 'AUTONOMOUS_DEBUGGING')
          ?.supportingArtifacts.find((a) => /unresolved|attempt/i.test(a)) ??
        'Autonomous Debugging is preparing a targeted repair.'
      : input.lockState === 'LOCKED_CAPABILITY_EVOLUTION'
        ? 'Missing Capability Evolution is validating safe capability installation.'
        : null;

  const nextSystemAction = input.launchReadiness.verdict.requiredNextStep;
  const humanActionRequired =
    input.unlockVerdict === 'PREVIEW_LOCKED_HUMAN_REVIEW'
      ? input.launchReadiness.verdict.primaryReason
      : null;

  let summary: string;
  if (input.unlockVerdict === 'PREVIEW_UNLOCKED') {
    summary = 'Live Preview unlocked — all Era 3 gates passed and Launch Readiness Authority issued LAUNCH_READY.';
  } else if (affectedInteraction && /unreachable|button|portrait/i.test(affectedInteraction)) {
    summary = `Live Preview is locked because ${affectedInteraction.toLowerCase()}. ${repairStatus ?? nextSystemAction}`;
  } else if (affectedWorkflow) {
    summary = `Live Preview is locked because ${affectedWorkflow}. ${repairStatus ?? nextSystemAction}`;
  } else {
    summary = `Live Preview is locked because ${reason}. ${nextSystemAction}`;
  }

  return {
    readOnly: true,
    currentStage: input.lockState.replace(/^LOCKED_/, '').replace(/_/g, ' ').toLowerCase(),
    blockingGate: gateLabel(input.evaluation.primaryBlockingGate),
    reason,
    affectedFeature: blockingSection?.lines.find((l) => /feature|slice/i.test(l)) ?? null,
    affectedWorkflow,
    affectedUser:
      launchExplanation.blockingSections.find((s) => s.heading.includes('Virtual User'))?.lines[0] ?? null,
    affectedDevice:
      launchExplanation.blockingSections.find((s) => s.heading.includes('Virtual Device'))?.lines[0] ?? null,
    affectedInteraction,
    repairStatus,
    nextSystemAction,
    humanActionRequired,
    summary,
  };
}
