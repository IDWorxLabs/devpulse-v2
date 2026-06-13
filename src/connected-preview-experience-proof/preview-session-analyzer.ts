/**
 * Preview Session Analyzer — verify preview session existence and linkage.
 */

import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type {
  PreviewSessionAssessment,
  PreviewSessionEvidence,
  PreviewSessionState,
} from './connected-preview-experience-proof-types.js';

export function analyzePreviewSession(input: {
  runtimeActivationProof: RuntimeActivationProofReport | null;
  sessionEvidence?: PreviewSessionEvidence;
}): PreviewSessionAssessment {
  const injected = input.sessionEvidence;
  const runtimeSessionId =
    injected?.runtimeSessionId ??
    input.runtimeActivationProof?.process.runtimeSessionId ??
    null;
  const workspaceId =
    injected?.workspaceId ??
    input.runtimeActivationProof?.command.workingDirectory ??
    null;

  if (injected?.previewSessionId || (injected?.previewUrl && injected?.workspaceId)) {
    const workspaceLinked = workspaceId !== null;
    const runtimeLinked =
      runtimeSessionId !== null &&
      (injected.runtimeSessionId === undefined || injected.runtimeSessionId === runtimeSessionId);

    let sessionState: PreviewSessionState = 'OBSERVED';
    if (!workspaceLinked || !runtimeLinked) sessionState = 'PARTIAL';

    return {
      readOnly: true,
      sessionState,
      sessionObserved: true,
      sessionId: injected.previewSessionId ?? `preview-${workspaceId ?? 'session'}`,
      workspaceLinked,
      runtimeLinked,
      previewTimestamp: injected.previewTimestamp ?? injected.generatedAt ?? null,
      previewSource: injected.previewSource ?? 'preview-proof-gap-activator',
      confidence: sessionState === 'OBSERVED' ? 90 : 65,
    };
  }

  return {
    readOnly: true,
    sessionState: 'NOT_OBSERVED',
    sessionObserved: false,
    sessionId: null,
    workspaceLinked: false,
    runtimeLinked: false,
    previewTimestamp: null,
    previewSource: null,
    confidence: 0,
  };
}

export function isSessionObserved(assessment: PreviewSessionAssessment): boolean {
  return assessment.sessionObserved && assessment.sessionState !== 'NOT_OBSERVED';
}
