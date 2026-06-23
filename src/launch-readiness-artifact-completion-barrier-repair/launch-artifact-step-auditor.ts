/**
 * Phase 26.98 — Launch artifact step auditor (V1).
 */

import { getChatStressCompletionSnapshot } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import { isProductReadinessRule1Satisfied } from '../product-readiness-completion-boundary-repair/chat-stress-settlement-auditor.js';
import {
  getActiveArtifactBuildSubstep,
  type ActiveArtifactBuildSubstep,
} from '../founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import type { LaunchArtifactStepAudit } from './launch-readiness-artifact-completion-barrier-repair-types.js';

const CHAT_STRESS_ARTIFACT_SUBSTEP_ID = 'product-readiness-chat-stress-started';

export function isChatStressArtifactSubstepActive(
  substep: ActiveArtifactBuildSubstep | null = getActiveArtifactBuildSubstep(),
): boolean {
  return substep?.operationId === CHAT_STRESS_ARTIFACT_SUBSTEP_ID;
}

export function auditLaunchArtifactStep(
  input: {
    chatStressStarted?: number;
    chatStressSettled?: number;
    chatStressPending?: number;
    activeArtifactSubstep?: ActiveArtifactBuildSubstep | null;
  } = {},
  nowMs = Date.now(),
): LaunchArtifactStepAudit {
  const snap = getChatStressCompletionSnapshot(nowMs);
  const started = input.chatStressStarted ?? snap.startedCount;
  const settled = input.chatStressSettled ?? snap.settledCount;
  const pending = input.chatStressPending ?? snap.pendingCount;
  const activeArtifactSubstep =
    input.activeArtifactSubstep !== undefined
      ? input.activeArtifactSubstep
      : getActiveArtifactBuildSubstep();

  const rule1Satisfied = isProductReadinessRule1Satisfied({
    startedCount: started,
    settledCount: settled,
    pendingCount: pending,
  });

  const chatSettledButArtifactActive =
    rule1Satisfied && isChatStressArtifactSubstepActive(activeArtifactSubstep);

  let reason: string | null = null;
  if (chatSettledButArtifactActive) {
    reason = `Rule 1 satisfied (started=${started} settled=${settled} pending=${pending}) but artifact sub-step still active: ${activeArtifactSubstep?.operationLabel ?? CHAT_STRESS_ARTIFACT_SUBSTEP_ID}`;
  } else if (rule1Satisfied) {
    reason = `Rule 1 satisfied: started=${started} settled=${settled} pending=${pending}`;
  } else if (pending > 0) {
    reason = `${pending} chat stress scenario(s) still pending`;
  }

  return {
    readOnly: true,
    chatStressStarted: started,
    chatStressSettled: settled,
    chatStressPending: pending,
    rule1Satisfied,
    activeArtifactSubstep,
    chatSettledButArtifactActive,
    reason,
  };
}
