/**
 * Completion evidence engine — records evidence without creating artifacts.
 */

import type { CompletionEvidence, PrepareCompletionPlanInput } from './types.js';

let evidenceCounter = 0;

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `cmevd-${evidenceCounter.toString().padStart(4, '0')}`;
}

export function resetCompletionEvidenceCounterForTests(): void {
  evidenceCounter = 0;
}

export function buildCompletionEvidence(input: PrepareCompletionPlanInput): CompletionEvidence[] {
  const records: CompletionEvidence[] = [];

  if (input.projectContext) {
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'PROJECT_EVIDENCE',
      summary: `Project context: ${input.projectContext.projectName} — ${input.projectContext.goalSummary}`,
      sourceSystem: 'project_understanding',
      satisfied: input.evidenceProvided,
    });
  }

  if (input.applyPlan) {
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'FEATURE_EVIDENCE',
      summary: `Apply plan ${input.applyPlan.applyPlanId} — ${input.applyPlan.applySteps.length} proposed steps`,
      sourceSystem: 'world2_controlled_apply_runtime',
      satisfied: input.applyPlan.applySteps.length > 0,
    });
  }

  if (input.runtimeVerificationPassed) {
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'VERIFICATION_EVIDENCE',
      summary: 'Runtime verification linkage recorded',
      sourceSystem: 'runtime_verification_layer',
      satisfied: input.verificationRequirementsMet,
    });
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'TEST_EVIDENCE',
      summary: 'Test baseline evidence requirement recorded',
      sourceSystem: 'testing_runtime',
      satisfied: input.verificationRequirementsMet,
    });
  }

  if (input.founderApprovalRecorded) {
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'APPROVAL_EVIDENCE',
      summary: 'Founder approval requirement recorded',
      sourceSystem: 'founder_approval_execution_gate',
      satisfied: true,
    });
  }

  if (input.rollbackPlan) {
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'ROLLBACK_EVIDENCE',
      summary: `Rollback plan ${input.rollbackPlan.rollbackPlanId} prepared`,
      sourceSystem: 'world2_rollback_runtime',
      satisfied: true,
    });
  }

  if (input.recoveryPlan) {
    records.push({
      evidenceId: nextEvidenceId(),
      evidenceType: 'RECOVERY_EVIDENCE',
      summary: `Recovery plan ${input.recoveryPlan.recoveryPlanId} prepared`,
      sourceSystem: 'world2_recovery_runtime',
      satisfied: true,
    });
  }

  records.push({
    evidenceId: nextEvidenceId(),
    evidenceType: 'RUNTIME_EVIDENCE',
    summary: 'World 2 runtime chain evidence recorded',
    sourceSystem: 'world2_completion_runtime',
    satisfied: input.evidenceProvided && input.executionPacket !== null,
  });

  return records;
}

export function evidenceSufficient(evidence: CompletionEvidence[]): boolean {
  return evidence.length >= 3 && evidence.filter((e) => e.satisfied).length >= 2;
}
