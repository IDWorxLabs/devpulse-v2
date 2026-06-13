/**
 * Preview Manifest Analyzer — verify preview evidence links to runtime.
 */

import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type {
  PreviewManifestAssessment,
  PreviewSessionAssessment,
  PreviewUrlAssessment,
} from './connected-preview-experience-proof-types.js';

export function analyzePreviewManifest(input: {
  runtimeActivationProof: RuntimeActivationProofReport | null;
  session: PreviewSessionAssessment;
  url: PreviewUrlAssessment;
}): PreviewManifestAssessment {
  const contractId =
    input.runtimeActivationProof?.buildMaterializationProven === true
      ? 'linked'
      : null;

  const runtimeLinked =
    input.session.runtimeLinked &&
    input.runtimeActivationProof?.process.runtimeSessionId !== null &&
    input.runtimeActivationProof?.runtimeProofLevel === 'PROVEN';

  const workspaceLinked = input.session.workspaceLinked;
  const previewLinked =
    input.session.sessionObserved && input.url.urlObserved && input.url.previewUrl !== null;

  const contractLinked = contractId !== null && input.runtimeActivationProof?.buildMaterializationProven === true;
  const manifestExists = contractLinked && workspaceLinked && previewLinked;

  const checks = [contractLinked, workspaceLinked, runtimeLinked, previewLinked];
  const passed = checks.filter(Boolean).length;
  const traceabilityScore = Math.round((passed / 4) * 100);

  return {
    readOnly: true,
    manifestExists,
    runtimeLinked,
    workspaceLinked,
    previewLinked,
    contractLinked,
    traceabilityScore,
  };
}
