/**
 * Launch Readiness Authority V2 — Live Preview gate.
 * Unlocks only when all Era 3 gates pass and verdict is LAUNCH_READY.
 */

import type {
  LaunchReadinessPipelineResult,
  LivePreviewLaunchReadinessGateResult,
} from './launch-readiness-types.js';

const REQUIRED_ERA3_GATES = [
  'INTENT_UNDERSTANDING',
  'PROMPT_FAITHFULNESS',
  'CAPABILITY_PLANNING',
  'MISSING_CAPABILITY_EVOLUTION',
  'INCREMENTAL_BUILD',
  'BEHAVIOR_SIMULATION',
  'VIRTUAL_USER',
  'VIRTUAL_DEVICE',
  'INTERACTION_PROOF',
  'AUTONOMOUS_DEBUGGING',
  'CONTINUOUS_IMPROVEMENT',
] as const;

export function evaluateLivePreviewLaunchReadinessGate(
  result: LaunchReadinessPipelineResult,
): LivePreviewLaunchReadinessGateResult {
  const requiredGates = REQUIRED_ERA3_GATES.map((gate) => {
    const source = result.evidence.sources.find((s) => s.sourceId === gate);
    const passed = source?.status === 'PASS' || source?.status === 'WARNING';
    return {
      gate,
      passed: Boolean(passed),
      evidenceId: source?.evidenceId ?? null,
    };
  });

  const allEra3Passed = requiredGates.every((g) => g.passed);
  const launchReady = result.verdict.verdict === 'LAUNCH_READY';
  const evidenceValid = result.evidenceValidation.valid;
  const unlocked = allEra3Passed && launchReady && evidenceValid && result.blockers.length === 0;

  let blockedReason: string | null = null;
  if (!evidenceValid) {
    blockedReason = result.evidenceValidation.primaryBlockReason ?? 'EVIDENCE_INCOMPLETE';
  } else if (!allEra3Passed) {
    const failed = requiredGates.filter((g) => !g.passed).map((g) => g.gate);
    blockedReason = `Era 3 gate(s) not passed: ${failed.join(', ')}`;
  } else if (!launchReady) {
    blockedReason = result.verdict.primaryReason;
  }

  return {
    readOnly: true,
    unlocked,
    blockedReason,
    verdict: result.verdict.verdict,
    gateStatus: unlocked ? 'LAUNCH_READINESS_AUTHORITY_V2_PASS' : 'LIVE_PREVIEW_LOCKED',
    requiredGates,
  };
}

export function isLivePreviewUnlockedByLaunchAuthority(result: LaunchReadinessPipelineResult): boolean {
  return evaluateLivePreviewLaunchReadinessGate(result).unlocked;
}
