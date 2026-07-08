/**
 * Autonomous Engineering Executive V1 — executive coordinator.
 * Orchestrates evidence normalization, decision, and runtime recording.
 */

import type { AeeDecision, AeeExecutiveDecisionInput, AeeExecutiveDecisionResult, AeeStage } from './aee-types.js';
import { AEE_CONTINUATION_OVERRIDE_MESSAGE, AEE_OVERRIDE_ASE_DENIAL_EVENT } from './aee-types.js';
import { evaluateAeeExecutiveDecision } from './aee-decision-engine.js';
import { aeeForbidsAbortAfterWorkspaceEvidence } from './aee-state-machine.js';
import { recordAeeRuntimeEvent } from './aee-runtime-recorder.js';

export function runAeeExecutiveCoordination(
  input: AeeExecutiveDecisionInput,
): AeeExecutiveDecisionResult {
  const decision = evaluateAeeExecutiveDecision(input);
  recordAeeRuntimeEvent({
    runId: input.projectId,
    projectId: input.projectId,
    stage: decision.furthestStageReached,
    decision: decision.decision,
    event: decision.overrideEvent,
    reasoning: decision.reasoning,
  });
  return decision;
}

export function formatAeeOverrideWarning(decision: AeeExecutiveDecisionResult): string {
  if (decision.overrideEvent === AEE_OVERRIDE_ASE_DENIAL_EVENT) {
    return `${AEE_CONTINUATION_OVERRIDE_MESSAGE} ${decision.reasoning}`;
  }
  return decision.reasoning;
}

export function aeeCanAbortBuild(input: {
  hasGeneratedSource: boolean;
  stage: AeeStage;
  proposedFailureLabel: string;
  executiveDecision: AeeDecision;
}): boolean {
  if (input.executiveDecision !== 'STOP') {
    return false;
  }
  if (
    input.hasGeneratedSource &&
    aeeForbidsAbortAfterWorkspaceEvidence(input.hasGeneratedSource, input.proposedFailureLabel)
  ) {
    return false;
  }
  return true;
}
