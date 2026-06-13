/**
 * Verification Linkage Analyzer — verify full build-to-verification evidence chain.
 */

import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type {
  VerificationEvidenceAssessment,
  VerificationLinkageAnalysis,
  VerificationResultAssessment,
  VerificationRunAssessment,
  VerificationTargetAssessment,
} from './connected-verification-execution-proof-types.js';
import { isEvidenceSufficient } from './verification-evidence-analyzer.js';
import { areResultsObserved } from './verification-result-analyzer.js';
import { isRunCompleted } from './verification-run-analyzer.js';
import { isTargetLinked } from './verification-target-analyzer.js';

export function analyzeVerificationLinkage(input: {
  previewExperienceProof: PreviewExperienceProofReport | null;
  run: VerificationRunAssessment;
  target: VerificationTargetAssessment;
  results: VerificationResultAssessment;
  evidence: VerificationEvidenceAssessment;
}): VerificationLinkageAnalysis {
  const previewProven = input.previewExperienceProof?.previewProofLevel === 'PROVEN';

  const contractToWorkspace = previewProven === true && input.target.targetLinkedToBuild;
  const workspaceToRuntime =
    contractToWorkspace && input.target.targetLinkedToRuntime && input.previewExperienceProof?.session.runtimeLinked === true;
  const runtimeToPreview =
    workspaceToRuntime && input.target.targetLinkedToPreview && input.previewExperienceProof?.session.sessionObserved === true;
  const previewToVerificationRun =
    runtimeToPreview && isRunCompleted(input.run) && input.run.runObserved;
  const verificationRunToResults =
    previewToVerificationRun && areResultsObserved(input.results);
  const resultsToEvidence =
    verificationRunToResults && isEvidenceSufficient(input.evidence);

  const links = [
    { key: 'contract→workspace', ok: contractToWorkspace },
    { key: 'workspace→runtime', ok: workspaceToRuntime },
    { key: 'runtime→preview', ok: runtimeToPreview },
    { key: 'preview→verificationRun', ok: previewToVerificationRun },
    { key: 'verificationRun→results', ok: verificationRunToResults },
    { key: 'results→evidence', ok: resultsToEvidence },
  ];

  const missingLinks: string[] = [];
  let firstBrokenVerificationLink: string | null = null;
  for (const link of links) {
    if (!link.ok) {
      missingLinks.push(`Broken link: ${link.key}`);
      if (firstBrokenVerificationLink === null) firstBrokenVerificationLink = link.key;
    }
  }

  if (!previewProven) {
    missingLinks.unshift('Preview experience not PROVEN — verification chain cannot start');
    if (firstBrokenVerificationLink === null) firstBrokenVerificationLink = 'contract→workspace';
  }

  const passed = links.filter((l) => l.ok).length;
  const traceabilityScore = Math.round((passed / links.length) * 100);
  const verificationLinkageConnected = links.every((l) => l.ok) && previewProven === true;

  return {
    readOnly: true,
    verificationLinkageConnected,
    firstBrokenVerificationLink,
    missingLinks,
    traceabilityScore,
    contractToWorkspace,
    workspaceToRuntime,
    runtimeToPreview,
    previewToVerificationRun,
    verificationRunToResults,
    resultsToEvidence,
  };
}
