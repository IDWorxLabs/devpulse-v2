/**
 * Verification gap analyzer — identifies gaps without resolving them.
 */

import type { AutoFixPlan } from '../auto-fix-runtime/auto-fix-runtime-types.js';
import type { VerificationEvidence, VerificationGap } from './runtime-verification-types.js';

let gapCounter = 0;

function nextGapId(): string {
  gapCounter += 1;
  return `vgap-${gapCounter.toString().padStart(3, '0')}`;
}

export function resetVerificationGapCounterForTests(): void {
  gapCounter = 0;
}

export function analyzeVerificationGaps(
  autoFixPlan: AutoFixPlan,
  evidence: VerificationEvidence[],
): VerificationGap[] {
  const gaps: VerificationGap[] = [
    {
      gapId: nextGapId(),
      summary: 'Phase 14.6 forbids runtime execution — chain verified in simulation only',
      severity: 'CRITICAL',
      sourceSystem: 'runtime_verification_layer',
      verificationOnly: true,
    },
    {
      gapId: nextGapId(),
      summary: 'No real test execution — testing verification is plan-structure only',
      severity: 'HIGH',
      sourceSystem: 'testing_runtime',
      verificationOnly: true,
    },
    {
      gapId: nextGapId(),
      summary: 'No fix application — auto-fix verification is proposal-structure only',
      severity: 'HIGH',
      sourceSystem: 'auto_fix_runtime',
      verificationOnly: true,
    },
    {
      gapId: nextGapId(),
      summary: 'Future runtime execution requires founder approval and verification gates',
      severity: 'HIGH',
      sourceSystem: 'unified_decision_layer',
      verificationOnly: true,
    },
  ];

  for (const e of evidence.filter((x) => !x.satisfied)) {
    gaps.push({
      gapId: nextGapId(),
      summary: `Unsatisfied evidence: ${e.statement.slice(0, 80)}`,
      severity: 'CRITICAL',
      sourceSystem: e.sourceSystem,
      verificationOnly: true,
    });
  }

  if (autoFixPlan.executionPacket.readiness.executionAllowed) {
    gaps.push({
      gapId: nextGapId(),
      summary: 'Execution packet executionAllowed must remain false',
      severity: 'CRITICAL',
      sourceSystem: 'execution_runtime',
      verificationOnly: true,
    });
  }

  if (autoFixPlan.codeGenerationPlan.changeProposals.some((c) => c.applied)) {
    gaps.push({
      gapId: nextGapId(),
      summary: 'Code generation change proposals must remain applied: false',
      severity: 'CRITICAL',
      sourceSystem: 'code_generation_runtime',
      verificationOnly: true,
    });
  }

  if (!autoFixPlan.buildTaskPlan.blocked) {
    gaps.push({
      gapId: nextGapId(),
      summary: 'Build task plan should remain blocked in Phase 14',
      severity: 'HIGH',
      sourceSystem: 'build_task_runtime',
      verificationOnly: true,
    });
  }

  return gaps;
}
