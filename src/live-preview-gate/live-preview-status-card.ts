/**
 * Live Preview Gate — unified status card.
 */

import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type {
  LivePreviewGateEvaluationResult,
  LivePreviewLockState,
  LivePreviewStatusCard,
  LivePreviewUnlockVerdict,
} from './live-preview-gate-types.js';
import { gateLabel } from './live-preview-lock-state.js';

const TOTAL_GATES = 12;

export function buildLivePreviewStatusCard(input: {
  lockState: LivePreviewLockState;
  unlockVerdict: LivePreviewUnlockVerdict;
  evaluation: LivePreviewGateEvaluationResult;
  launchReadiness: LaunchReadinessPipelineResult;
  recommendedNextStep: string;
}): LivePreviewStatusCard {
  const passedCount = input.evaluation.passedGates.length;
  const overallProgress = Math.round((passedCount / TOTAL_GATES) * 100);

  const adEvidence = input.launchReadiness.evidence.sources.find((s) => s.sourceId === 'AUTONOMOUS_DEBUGGING');
  const mceEvidence = input.launchReadiness.evidence.sources.find(
    (s) => s.sourceId === 'MISSING_CAPABILITY_EVOLUTION',
  );

  const estimatedRisk: LivePreviewStatusCard['estimatedRisk'] =
    input.unlockVerdict === 'PREVIEW_UNLOCKED'
      ? 'LOW'
      : input.launchReadiness.blockers.some((b) => b.severity === 'CRITICAL')
        ? 'CRITICAL'
        : input.launchReadiness.risks.some((r) => r.residualRisk === 'HIGH')
          ? 'HIGH'
          : 'MEDIUM';

  return {
    readOnly: true,
    previewState: input.lockState,
    currentGate: gateLabel(input.evaluation.primaryBlockingGate),
    overallProgress,
    passedGates: input.evaluation.passedGates,
    activeGate:
      input.unlockVerdict === 'PREVIEW_UNLOCKED'
        ? null
        : gateLabel(input.evaluation.primaryBlockingGate),
    blockedGate:
      input.unlockVerdict === 'PREVIEW_UNLOCKED'
        ? null
        : gateLabel(input.evaluation.primaryBlockingGate),
    repairAttempts: adEvidence?.supportingArtifacts.find((a) => /unresolved/i.test(a)) ?? null,
    capabilityEvolutionStatus: mceEvidence?.supportingArtifacts[0] ?? null,
    launchReadinessVerdict: input.launchReadiness.verdict.verdict,
    nextAction: input.recommendedNextStep,
    estimatedRisk,
  };
}
