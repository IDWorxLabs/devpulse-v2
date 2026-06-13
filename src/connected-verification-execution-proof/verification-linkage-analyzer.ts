/**
 * Verification Linkage Analyzer — verify preview→verification execution chain (Phase 26.76).
 */

import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type {
  VerificationEvidenceAssessment,
  VerificationLinkageAnalysis,
  VerificationResultAssessment,
  VerificationRunAssessment,
  VerificationTargetAssessment,
} from './connected-verification-execution-proof-types.js';
import { areResultsObserved } from './verification-result-analyzer.js';
import { isRunCompleted } from './verification-run-analyzer.js';

export function analyzeVerificationLinkage(input: {
  previewExperienceProof: PreviewExperienceProofReport | null;
  run: VerificationRunAssessment;
  target: VerificationTargetAssessment;
  results: VerificationResultAssessment;
  evidence: VerificationEvidenceAssessment;
  verificationSucceeded?: boolean;
  commandDetected?: boolean;
}): VerificationLinkageAnalysis {
  const previewProven = input.previewExperienceProof?.previewProofLevel === 'PROVEN';
  const commandExists =
    input.commandDetected === true ||
    (input.run.command !== null && input.run.command.length > 0);
  const executionObserved = isRunCompleted(input.run) && input.run.runObserved;
  const resultsCaptured = areResultsObserved(input.results);
  const successObserved = input.verificationSucceeded === true;

  const previewToCommand = previewProven && commandExists;
  const commandToExecution = previewToCommand && executionObserved;
  const executionToResults =
    commandToExecution && resultsCaptured && (input.results.passCount + input.results.failCount > 0);
  const resultsToSuccess = executionToResults && successObserved;

  const links = [
    { key: 'preview→command', ok: previewToCommand },
    { key: 'command→execution', ok: commandToExecution },
    { key: 'execution→results', ok: executionToResults },
    { key: 'results→success', ok: resultsToSuccess },
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
    if (firstBrokenVerificationLink === null) firstBrokenVerificationLink = 'preview→command';
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
    contractToWorkspace: previewProven && input.target.targetLinkedToBuild,
    workspaceToRuntime: previewProven && input.target.targetLinkedToRuntime,
    runtimeToPreview: previewProven && input.target.targetLinkedToPreview,
    previewToVerificationRun: previewToCommand,
    verificationRunToResults: executionToResults,
    resultsToEvidence: resultsToSuccess,
  };
}
