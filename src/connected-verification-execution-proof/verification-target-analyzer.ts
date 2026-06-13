/**
 * Verification Target Analyzer — verify what was tested and linkage to runtime/preview/build.
 */

import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import type {
  VerificationEvidenceFixture,
  VerificationTargetAssessment,
  VerificationTargetState,
} from './connected-verification-execution-proof-types.js';

export function analyzeVerificationTarget(input: {
  previewExperienceProof: PreviewExperienceProofReport | null;
  fixture?: VerificationEvidenceFixture;
}): VerificationTargetAssessment {
  const f = input.fixture;
  const preview = input.previewExperienceProof;

  if (!f?.previewSessionId && !f?.previewUrl && !f?.workspaceId) {
    return {
      readOnly: true,
      targetState: 'NOT_OBSERVED',
      targetObserved: false,
      targetType: null,
      targetLinkedToRuntime: false,
      targetLinkedToPreview: false,
      targetLinkedToBuild: false,
      targetUrl: null,
      targetWorkspace: null,
      artifactIds: [],
      confidence: 0,
    };
  }

  const previewSessionId = preview?.session.sessionId ?? null;
  const previewUrl = preview?.url.previewUrl ?? null;
  const workspacePath = preview?.session.workspaceLinked
    ? f.workspaceId ?? preview.session.previewSource
    : f.workspaceId ?? null;

  const targetLinkedToRuntime =
    f.targetLinkedToPreview === false
      ? false
      : (f.targetLinkedToRuntime ??
        (Boolean(f.runtimeSessionId) && preview?.session.runtimeLinked === true));

  const targetLinkedToPreview =
    f.targetLinkedToPreview ??
    (f.previewSessionId !== undefined &&
      previewSessionId !== null &&
      f.previewSessionId === previewSessionId);

  const targetLinkedToBuild =
    f.targetLinkedToBuild ??
    (preview?.runtimeActivationProven === true && Boolean(f.workspaceId ?? workspacePath));

  let targetState: VerificationTargetState = 'PARTIAL';
  if (targetLinkedToPreview && targetLinkedToRuntime && targetLinkedToBuild) {
    targetState = 'LINKED';
  }

  return {
    readOnly: true,
    targetState,
    targetObserved: true,
    targetType: 'GENERATED_APP_PREVIEW',
    targetLinkedToRuntime,
    targetLinkedToPreview,
    targetLinkedToBuild,
    targetUrl: f.previewUrl ?? previewUrl,
    targetWorkspace: workspacePath ?? f.workspaceId ?? null,
    artifactIds: f.artifactIds ?? [],
    confidence: targetState === 'LINKED' ? 90 : 60,
  };
}

export function isTargetLinked(assessment: VerificationTargetAssessment): boolean {
  return assessment.targetState === 'LINKED';
}
