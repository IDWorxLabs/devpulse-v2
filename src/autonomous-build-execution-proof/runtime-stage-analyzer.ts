/**
 * Autonomous Build Execution Proof — RUNTIME stage analyzer.
 */

import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { StageEvidenceEntry, StageExecutionProof } from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeRuntimeStage(
  runtimeAssessment: ConnectedRuntimeActivationAssessment,
  buildManifestId: string,
): StageExecutionProof {
  const report = runtimeAssessment.report;
  const answers = report.questionAnswers;
  const state = report.runtimeState;
  const candidate = report.runtimeActivationCandidate;
  const manifestLinked = candidate.buildOutputManifestId === buildManifestId;

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (state === 'RUNTIME_READY' && answers.runtimeReadinessProven && manifestLinked) {
    proofLevel = 'PROVEN';
  } else if (
    state === 'RUNTIME_READY_WITH_WARNINGS' ||
    (answers.runtimeCandidateExists && manifestLinked)
  ) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Build manifest linkage',
      `${candidate.buildOutputManifestId} → ${buildManifestId}`,
      manifestLinked,
      'connected-runtime-activation-foundation',
    ),
    entry(
      'Runtime candidate',
      candidate.candidateId,
      answers.runtimeCandidateExists,
      'connected-runtime-activation-foundation',
    ),
    entry(
      'Startup path',
      candidate.startupPath ?? 'none',
      answers.startupPathExists,
      'connected-runtime-activation-foundation',
    ),
    entry(
      'Runtime activation traceable',
      String(answers.runtimeActivationTraceable),
      answers.runtimeActivationTraceable,
      'connected-runtime-activation-foundation',
    ),
    entry('Runtime state', state, state === 'RUNTIME_READY', 'connected-runtime-activation-foundation'),
  ];

  const missingEvidence: string[] = [];
  if (!manifestLinked) {
    missingEvidence.push(`Runtime not linked to build manifest (${candidate.buildOutputManifestId} ≠ ${buildManifestId})`);
  }
  if (!answers.runtimeReadinessProven) missingEvidence.push('Runtime readiness not proven');
  if (report.realRuntimeLaunchPerformed !== false) {
    missingEvidence.push('Real runtime launch must not be claimed without evidence');
  }

  let recommendedFix = 'Connect build output manifest to runtime activation with proven startup path.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Preserve runtime activation contract linkage to build manifest.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Resolve runtime warning gaps before claiming runtime proof.';
  }

  return {
    readOnly: true,
    stage: 'RUNTIME',
    proofLevel,
    score: report.runtimeReadinessScore,
    sourceAuthority: 'connected-runtime-activation-foundation',
    upstreamState: state,
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
