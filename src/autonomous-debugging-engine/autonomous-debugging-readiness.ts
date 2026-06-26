/**
 * Autonomous Debugging Engine — lightweight readiness gate.
 */

import type { AutonomousDebuggingReadinessResult } from './autonomous-debugging-types.js';

export function assessAutonomousDebuggingReadiness(input: {
  interactionProofReady: boolean;
  interactionProofBlockedReason?: string | null;
  pendingFailureCount?: number;
}): AutonomousDebuggingReadinessResult {
  if (!input.interactionProofReady) {
    return {
      readOnly: true,
      ready: false,
      pendingFailureCount: input.pendingFailureCount ?? 0,
      blockedReason: input.interactionProofBlockedReason ?? 'Interaction proof not ready for autonomous debugging.',
    };
  }

  return {
    readOnly: true,
    ready: true,
    pendingFailureCount: input.pendingFailureCount ?? 0,
    blockedReason: null,
  };
}
