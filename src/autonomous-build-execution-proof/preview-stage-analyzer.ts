/**
 * Autonomous Build Execution Proof — PREVIEW stage analyzer.
 * Consumes Connected Preview Experience Proof authority (Phase 26.10).
 */

import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
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
  previewExperienceProof: PreviewExperienceProofReport | null,
): StageExecutionProof {
  if (!previewExperienceProof) {
    return {
      readOnly: true,
      stage: 'PREVIEW',
      proofLevel: 'NOT_PROVEN',
      score: 0,
      sourceAuthority: 'connected-preview-experience-proof',
      upstreamState: 'NO_ASSESSMENT',
      evidence: [
        entry('Connected preview experience proof', 'not assessed', false, 'connected-preview-experience-proof'),
      ],
      missingEvidence: ['Connected preview experience proof assessment not run'],
      recommendedFix: 'Run connected preview experience proof assessment.',
      downstreamBlocked: true,
    };
  }

  const report = previewExperienceProof;
  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (
    report.previewProofLevel === 'PROVEN' &&
    report.runtimeActivationProven &&
    report.url.urlReachable &&
    report.render.applicationRendered &&
    report.linkage.previewLinkageConnected
  ) {
    proofLevel = 'PROVEN';
  } else if (report.previewProofLevel === 'PARTIAL' || report.url.urlObserved) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Runtime activation proven',
      String(report.runtimeActivationProven),
      report.runtimeActivationProven,
      'connected-preview-experience-proof',
    ),
    entry(
      'Preview session',
      report.session.sessionId ?? 'none',
      report.session.sessionObserved,
      'connected-preview-experience-proof',
    ),
    entry(
      'Preview URL reachable',
      report.url.previewUrl ?? 'none',
      report.url.urlReachable,
      'connected-preview-experience-proof',
    ),
    entry(
      'Application rendered',
      report.render.renderState,
      report.render.applicationRendered,
      'connected-preview-experience-proof',
    ),
    entry(
      'Interaction evidence',
      report.interaction.interactionState,
      report.interaction.interactionObserved,
      'connected-preview-experience-proof',
    ),
    entry(
      'Preview linkage',
      String(report.linkage.previewLinkageConnected),
      report.linkage.previewLinkageConnected,
      'connected-preview-experience-proof',
    ),
  ];

  const missingEvidence = [...report.missingEvidence];
  if (report.linkage.firstBrokenPreviewLink) {
    missingEvidence.unshift(`First broken preview link: ${report.linkage.firstBrokenPreviewLink}`);
  }

  let recommendedFix = report.recommendedFix;
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Preview experience proven — proceed to VERIFY execution proof.';
  }

  return {
    readOnly: true,
    stage: 'PREVIEW',
    proofLevel,
    score: report.linkage.traceabilityScore,
    sourceAuthority: 'connected-preview-experience-proof',
    upstreamState: report.previewState,
    evidence,
    missingEvidence: missingEvidence.slice(0, 10),
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
