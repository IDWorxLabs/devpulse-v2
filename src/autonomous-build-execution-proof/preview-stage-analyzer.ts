/**
 * Autonomous Build Execution Proof — PREVIEW stage analyzer.
 */

import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { StageEvidenceEntry, StageExecutionProof } from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzePreviewStage(
  previewAssessment: ConnectedLivePreviewAssessment,
  runtimeContractId: string,
): StageExecutionProof {
  const report = previewAssessment.report;
  const answers = report.questionAnswers;
  const state = report.previewState;
  const candidate = report.previewCandidate;
  const contractLinked = candidate.runtimeActivationContractId === runtimeContractId;

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (state === 'PREVIEW_READY' && answers.previewReadinessProven && contractLinked) {
    proofLevel = 'PROVEN';
  } else if (
    state === 'PREVIEW_READY_WITH_WARNINGS' ||
    (answers.previewCandidateExists && contractLinked)
  ) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Runtime contract linkage',
      `${candidate.runtimeActivationContractId} → ${runtimeContractId}`,
      contractLinked,
      'connected-live-preview-foundation',
    ),
    entry(
      'Preview candidate',
      candidate.candidateId,
      answers.previewCandidateExists,
      'connected-live-preview-foundation',
    ),
    entry(
      'Preview activation path',
      candidate.previewActivationPath ?? 'none',
      answers.previewActivationPathExists,
      'connected-live-preview-foundation',
    ),
    entry(
      'Preview readiness traceable',
      String(answers.previewReadinessTraceable),
      answers.previewReadinessTraceable,
      'connected-live-preview-foundation',
    ),
    entry('Preview state', state, state === 'PREVIEW_READY', 'connected-live-preview-foundation'),
  ];

  const missingEvidence: string[] = [];
  if (!contractLinked) {
    missingEvidence.push(
      `Preview not linked to runtime contract (${candidate.runtimeActivationContractId} ≠ ${runtimeContractId})`,
    );
  }
  if (!answers.previewReadinessProven) missingEvidence.push('Preview readiness not proven');
  if (candidate.realPreviewLaunchPerformed !== false) {
    missingEvidence.push('Real preview launch must not be claimed without evidence');
  }

  let recommendedFix = 'Connect runtime activation contract to preview readiness with traceable activation path.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Maintain preview contract linkage to runtime activation.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Resolve preview warning gaps before claiming preview proof.';
  }

  return {
    readOnly: true,
    stage: 'PREVIEW',
    proofLevel,
    score: report.previewReadinessScore,
    sourceAuthority: 'connected-live-preview-foundation',
    upstreamState: state,
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
