/**
 * Live Preview Gate — lock state model.
 */

import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';
import type {
  LivePreviewEvidenceSourceId,
  LivePreviewGateEvaluationResult,
  LivePreviewLockState,
  LivePreviewUnlockVerdict,
} from './live-preview-gate-types.js';

export function resolveLivePreviewLockState(input: {
  generationComplete: boolean;
  evaluation: LivePreviewGateEvaluationResult;
  launchReadiness: LaunchReadinessPipelineResult;
  unlockVerdict: LivePreviewUnlockVerdict;
  previousLockState: LivePreviewLockState | null;
  isRegressionRelock: boolean;
}): LivePreviewLockState {
  if (input.unlockVerdict === 'PREVIEW_UNLOCKED') {
    return 'UNLOCKED_PREVIEW_READY';
  }

  if (input.isRegressionRelock && input.previousLockState === 'UNLOCKED_PREVIEW_READY') {
    return 'LOCKED_AUTONOMOUS_REPAIR';
  }

  if (!input.generationComplete) {
    return 'LOCKED_PENDING_GENERATION';
  }

  const launchVerdict = input.launchReadiness.verdict.verdict;

  if (launchVerdict === 'BLOCKED' || input.unlockVerdict === 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE') {
    return 'LOCKED_LAUNCH_REVIEW';
  }

  if (launchVerdict === 'NEEDS_HUMAN_REVIEW' || input.unlockVerdict === 'PREVIEW_LOCKED_HUMAN_REVIEW') {
    return 'LOCKED_HUMAN_REVIEW_REQUIRED';
  }

  if (launchVerdict === 'NEEDS_CAPABILITY_EVOLUTION' || input.unlockVerdict === 'PREVIEW_LOCKED_CAPABILITY_EVOLUTION') {
    return 'LOCKED_CAPABILITY_EVOLUTION';
  }

  const gate = input.evaluation.primaryBlockingGate;
  if (gate === 'CONTINUOUS_IMPROVEMENT') {
    return 'LOCKED_CONTINUOUS_IMPROVEMENT';
  }

  if (
    gate === 'BEHAVIOR_SIMULATION' ||
    gate === 'VIRTUAL_USER' ||
    gate === 'INTERACTION_PROOF' ||
    gate === 'AUTONOMOUS_DEBUGGING' ||
    launchVerdict === 'NEEDS_AUTONOMOUS_REPAIR' ||
    input.unlockVerdict === 'PREVIEW_LOCKED_AUTONOMOUS_REPAIR'
  ) {
    return 'LOCKED_AUTONOMOUS_REPAIR';
  }

  if (gate === 'MISSING_CAPABILITY_EVOLUTION' || gate === 'CAPABILITY_PLANNING') {
    return 'LOCKED_CAPABILITY_EVOLUTION';
  }

  return 'LOCKED_VALIDATING';
}

export function mapUnlockVerdict(input: {
  evaluation: LivePreviewGateEvaluationResult;
  launchReadiness: LaunchReadinessPipelineResult;
  evidenceIncomplete: boolean;
}): LivePreviewUnlockVerdict {
  if (input.evidenceIncomplete || !input.launchReadiness.evidenceValidation.valid) {
    return 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE';
  }

  const launchVerdict = input.launchReadiness.verdict.verdict;
  if (launchVerdict === 'LAUNCH_READY' && input.evaluation.allRequiredPassed) {
    return 'PREVIEW_UNLOCKED';
  }

  if (launchVerdict === 'NEEDS_HUMAN_REVIEW') {
    return 'PREVIEW_LOCKED_HUMAN_REVIEW';
  }

  if (launchVerdict === 'NEEDS_CAPABILITY_EVOLUTION') {
    return 'PREVIEW_LOCKED_CAPABILITY_EVOLUTION';
  }

  if (launchVerdict === 'NEEDS_AUTONOMOUS_REPAIR') {
    return 'PREVIEW_LOCKED_AUTONOMOUS_REPAIR';
  }

  const gate = input.evaluation.primaryBlockingGate;
  if (gate === 'CAPABILITY_PLANNING' || gate === 'MISSING_CAPABILITY_EVOLUTION') {
    return 'PREVIEW_LOCKED_CAPABILITY_EVOLUTION';
  }

  if (
    gate === 'BEHAVIOR_SIMULATION' ||
    gate === 'VIRTUAL_USER' ||
    gate === 'INTERACTION_PROOF' ||
    gate === 'AUTONOMOUS_DEBUGGING'
  ) {
    return 'PREVIEW_LOCKED_AUTONOMOUS_REPAIR';
  }

  return 'PREVIEW_LOCKED';
}

export function gateLabel(source: LivePreviewEvidenceSourceId | null): string {
  if (!source) return 'Live Preview Gate';
  const labels: Partial<Record<LivePreviewEvidenceSourceId, string>> = {
    BEHAVIOR_SIMULATION: 'Behavior Simulation',
    CAPABILITY_PLANNING: 'Capability Planning',
    MISSING_CAPABILITY_EVOLUTION: 'Missing Capability Evolution',
    LAUNCH_READINESS_AUTHORITY_V2: 'Launch Readiness Authority V2',
    INTERACTION_PROOF: 'Interaction Proof',
    EXECUTION_TRACE: 'Execution Trace',
  };
  return labels[source] ?? source.replace(/_/g, ' ');
}
