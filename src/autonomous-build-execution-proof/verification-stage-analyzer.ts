/**
 * Autonomous Build Execution Proof — VERIFY stage analyzer.
 */

import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import type { StageEvidenceEntry, StageExecutionProof } from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeVerificationStage(
  verificationAssessment: ConnectedVerificationAssessment,
  previewContractId: string,
): StageExecutionProof {
  const report = verificationAssessment.report;
  const answers = report.questionAnswers;
  const state = report.verificationState;
  const candidate = report.verificationCandidate;
  const contractLinked = candidate.previewReadinessContractId === previewContractId;

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (state === 'VERIFICATION_READY' && answers.verificationReadinessProven && contractLinked) {
    proofLevel = 'PROVEN';
  } else if (
    state === 'VERIFICATION_READY_WITH_WARNINGS' ||
    (answers.verificationCandidateExists && contractLinked)
  ) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Preview contract linkage',
      `${candidate.previewReadinessContractId} → ${previewContractId}`,
      contractLinked,
      'connected-verification-foundation',
    ),
    entry(
      'Verification candidate',
      candidate.candidateId,
      answers.verificationCandidateExists,
      'connected-verification-foundation',
    ),
    entry(
      'Verification path',
      candidate.verificationPath ?? 'none',
      answers.verificationPathExists,
      'connected-verification-foundation',
    ),
    entry(
      'Verification traceable',
      String(answers.verificationTraceable),
      answers.verificationTraceable,
      'connected-verification-foundation',
    ),
    entry(
      'Verification state',
      state,
      state === 'VERIFICATION_READY',
      'connected-verification-foundation',
    ),
  ];

  const missingEvidence: string[] = [];
  if (!contractLinked) {
    missingEvidence.push(
      `Verification not linked to preview contract (${candidate.previewReadinessContractId} ≠ ${previewContractId})`,
    );
  }
  if (!answers.verificationReadinessProven) {
    missingEvidence.push('Verification readiness not proven — users cannot trust pass/fail/next steps');
  }
  if (candidate.realVerificationExecutionPerformed !== false) {
    missingEvidence.push('Real verification execution must not be claimed without evidence');
  }

  let recommendedFix =
    'Connect preview readiness contract to verification with founder-readable pass/fail/next-step evidence.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Maintain verification contract linkage and UVL-readable outcomes.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Resolve verification warning gaps before launch claims.';
  }

  return {
    readOnly: true,
    stage: 'VERIFY',
    proofLevel,
    score: report.verificationReadinessScore,
    sourceAuthority: 'connected-verification-foundation',
    upstreamState: state,
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
