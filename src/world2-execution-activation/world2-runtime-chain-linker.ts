/**
 * World 2 runtime chain linker — links Phase 14 runtimes without executing them.
 */

import type { RuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-types.js';
import type { World2RuntimeChainLink } from './world2-execution-activation-types.js';

let linkCounter = 0;

function nextLinkId(): string {
  linkCounter += 1;
  return `w2link-${linkCounter.toString().padStart(4, '0')}`;
}

export function resetWorld2RuntimeChainLinkCounterForTests(): void {
  linkCounter = 0;
}

export function linkWorld2RuntimeChain(verification: RuntimeVerificationReport): World2RuntimeChainLink {
  const exec = verification.executionPacket;
  const build = verification.buildTaskPlan;
  const gen = verification.codeGenerationPlan;
  const test = verification.testingPlan;
  const fix = verification.autoFixPlan;

  return {
    linkId: nextLinkId(),
    executionRuntimeId: exec.executionId,
    buildTaskRuntimeId: build.taskId,
    codeGenerationRuntimeId: gen.generationId,
    testingRuntimeId: test.testingId,
    autoFixRuntimeId: fix.fixId,
    verificationLayerId: verification.verificationId,
    executionAllowed: false,
    generationProposalOnly: true,
    testingSimulationOnly: true,
    autoFixSimulationOnly: true,
    simulationOnly: true,
  };
}
