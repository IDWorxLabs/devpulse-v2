/**
 * Autonomous Build Execution Proof — VERIFY stage analyzer.
 * Consumes Connected Verification Execution Proof authority (Phase 26.11).
 */

import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
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
  verificationExecutionProof: VerificationExecutionProofReport | null,
): StageExecutionProof {
  if (!verificationExecutionProof) {
    return {
      readOnly: true,
      stage: 'VERIFY',
      proofLevel: 'NOT_PROVEN',
      score: 0,
      sourceAuthority: 'connected-verification-execution-proof',
      upstreamState: 'NO_ASSESSMENT',
      evidence: [
        entry(
          'Connected verification execution proof',
          'not assessed',
          false,
          'connected-verification-execution-proof',
        ),
      ],
      missingEvidence: ['Connected verification execution proof assessment not run'],
      recommendedFix: 'Run connected verification execution proof assessment.',
      downstreamBlocked: true,
    };
  }

  const report = verificationExecutionProof;
  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (
    report.verificationProofLevel === 'PROVEN' &&
    report.linkage.verificationLinkageConnected &&
    report.previewExperienceProven &&
    report.run.runObserved &&
    report.evidence.evidenceObserved
  ) {
    proofLevel = 'PROVEN';
  } else if (report.verificationProofLevel === 'PARTIAL' || report.run.runObserved) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Preview experience proven',
      String(report.previewExperienceProven),
      report.previewExperienceProven,
      'connected-verification-execution-proof',
    ),
    entry(
      'Verification run',
      report.run.runId ?? report.run.runState,
      report.run.runObserved,
      'connected-verification-execution-proof',
    ),
    entry(
      'Target linked',
      report.target.targetState,
      report.target.targetState === 'LINKED',
      'connected-verification-execution-proof',
    ),
    entry(
      'Results observed',
      report.results.resultState,
      report.results.resultsObserved,
      'connected-verification-execution-proof',
    ),
    entry(
      'Evidence artifacts',
      report.evidence.evidenceState,
      report.evidence.evidenceObserved,
      'connected-verification-execution-proof',
    ),
    entry(
      'Verification linkage',
      String(report.linkage.verificationLinkageConnected),
      report.linkage.verificationLinkageConnected,
      'connected-verification-execution-proof',
    ),
  ];

  const missingEvidence = [...report.missingEvidence];
  if (report.linkage.firstBrokenVerificationLink) {
    missingEvidence.unshift(
      `First broken verification link: ${report.linkage.firstBrokenVerificationLink}`,
    );
  }

  let recommendedFix = report.recommendedFix;
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Verification execution proven — proceed to LAUNCH readiness assessment.';
  }

  return {
    readOnly: true,
    stage: 'VERIFY',
    proofLevel,
    score: report.linkage.traceabilityScore,
    sourceAuthority: 'connected-verification-execution-proof',
    upstreamState: report.verificationState,
    evidence,
    missingEvidence: missingEvidence.slice(0, 10),
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
