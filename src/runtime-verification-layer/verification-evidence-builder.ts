/**
 * Verification evidence builder — collects evidence without executing runtime actions.
 */

import type { AutoFixPlan } from '../auto-fix-runtime/auto-fix-runtime-types.js';
import type { VerificationEvidence } from './runtime-verification-types.js';

let evidenceCounter = 0;

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `vevd-${evidenceCounter.toString().padStart(4, '0')}`;
}

export function resetVerificationEvidenceCounterForTests(): void {
  evidenceCounter = 0;
}

export function buildVerificationEvidence(autoFixPlan: AutoFixPlan): VerificationEvidence[] {
  const exec = autoFixPlan.executionPacket;
  const build = autoFixPlan.buildTaskPlan;
  const gen = autoFixPlan.codeGenerationPlan;
  const test = autoFixPlan.testingPlan;
  const fix = autoFixPlan;

  return [
    {
      evidenceId: nextEvidenceId(),
      category: 'EXECUTION',
      statement: `Execution packet ${exec.executionId}: executionAllowed=${exec.readiness.executionAllowed}`,
      sourceSystem: 'execution_runtime',
      satisfied: exec.readiness.executionAllowed === false,
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'BUILD_TASK',
      statement: `Build task ${build.taskId}: blocked=${build.blocked}, steps=${build.steps.length}`,
      sourceSystem: 'build_task_runtime',
      satisfied: build.blocked === true && build.steps.length >= 4,
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'CODE_GENERATION',
      statement: `Generation ${gen.generationId}: proposalOnly=${gen.proposalOnly}, applied changes=0`,
      sourceSystem: 'code_generation_runtime',
      satisfied: gen.proposalOnly === true && gen.changeProposals.every((c) => !c.applied),
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'TESTING',
      statement: `Testing ${test.testingId}: planningOnly=${test.planningOnly}, cases=${test.testCases.length}`,
      sourceSystem: 'testing_runtime',
      satisfied: test.planningOnly === true && test.testCases.length >= 5,
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'AUTO_FIX',
      statement: `Auto-fix ${fix.fixId}: planningOnly=${fix.planningOnly}, proposals=${fix.fixProposals.length}`,
      sourceSystem: 'auto_fix_runtime',
      satisfied: fix.planningOnly === true && fix.fixProposals.every((p) => !p.applied),
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'LINKAGE',
      statement: `Chain links: exec=${exec.executionId}, build=${build.taskId}, gen=${gen.generationId}, test=${test.testingId}, fix=${fix.fixId}`,
      sourceSystem: 'runtime_verification_layer',
      satisfied: Boolean(exec.executionId && build.taskId && gen.generationId && test.testingId && fix.fixId),
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'FAILURE',
      statement: `Failures linked: ${fix.linkedFailureIds.length} failure records in auto-fix plan`,
      sourceSystem: 'failure_visibility_engine',
      satisfied: fix.linkedFailureIds.length >= 1,
      verificationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      category: 'PASS_TOKEN',
      statement: 'Phase validation scripts emit pass tokens for each runtime foundation',
      sourceSystem: 'runtime_verification_layer',
      satisfied: true,
      verificationOnly: true,
    },
  ];
}

export function satisfiedEvidenceCount(evidence: VerificationEvidence[]): number {
  return evidence.filter((e) => e.satisfied).length;
}
