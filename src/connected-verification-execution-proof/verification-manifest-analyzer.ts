/**
 * Verification Manifest Analyzer — verify verification links to preview/runtime/build.
 */

import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type {
  VerificationManifestAssessment,
  VerificationRunAssessment,
  VerificationTargetAssessment,
} from './connected-verification-execution-proof-types.js';
import { isRunCompleted } from './verification-run-analyzer.js';

export function analyzeVerificationManifest(input: {
  previewExperienceProof: PreviewExperienceProofReport | null;
  run: VerificationRunAssessment;
  target: VerificationTargetAssessment;
}): VerificationManifestAssessment {
  const previewProven = input.previewExperienceProof?.previewProofLevel === 'PROVEN';
  const contractLinked = previewProven === true;
  const buildLinked = input.target.targetLinkedToBuild;
  const runtimeLinked = input.target.targetLinkedToRuntime;
  const previewLinked = input.target.targetLinkedToPreview;
  const verificationLinked =
    input.run.runObserved && isRunCompleted(input.run) && input.target.targetObserved;

  const manifestExists =
    contractLinked && buildLinked && previewLinked && verificationLinked;

  const checks = [contractLinked, buildLinked, runtimeLinked, previewLinked, verificationLinked];
  const passed = checks.filter(Boolean).length;
  const traceabilityScore = Math.round((passed / checks.length) * 100);

  return {
    readOnly: true,
    manifestExists,
    contractLinked,
    buildLinked,
    runtimeLinked,
    previewLinked,
    verificationLinked,
    traceabilityScore,
  };
}
