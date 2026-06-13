/**
 * Preview URL Analyzer — verify preview URL exists and is reachable.
 */

import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type {
  PreviewSessionAssessment,
  PreviewSessionEvidence,
  PreviewUrlAssessment,
  PreviewUrlState,
} from './connected-preview-experience-proof-types.js';

export function analyzePreviewUrl(input: {
  runtimeActivationProof: RuntimeActivationProofReport | null;
  session: PreviewSessionAssessment;
  sessionEvidence?: PreviewSessionEvidence;
}): PreviewUrlAssessment {
  const injected = input.sessionEvidence;
  const runtimeUrl = input.runtimeActivationProof?.port.url ?? null;

  if (!input.session.sessionObserved && !injected?.previewUrl && !runtimeUrl) {
    return {
      readOnly: true,
      urlState: 'NOT_OBSERVED',
      urlObserved: false,
      urlReachable: false,
      previewUrl: null,
      host: null,
      port: null,
      protocol: null,
      confidence: 0,
    };
  }

  const previewUrl =
    injected?.previewUrl ??
    (injected?.host && injected?.port !== undefined
      ? `${injected.protocol ?? 'http'}://${injected.host}:${injected.port}`
      : runtimeUrl);

  if (!previewUrl) {
    return {
      readOnly: true,
      urlState: 'NOT_OBSERVED',
      urlObserved: false,
      urlReachable: false,
      previewUrl: null,
      host: null,
      port: null,
      protocol: null,
      confidence: 0,
    };
  }

  const reachable =
    injected?.urlReachable ??
    (input.runtimeActivationProof?.port.reachable === true && previewUrl === runtimeUrl);

  let urlState: PreviewUrlState = 'OBSERVED';
  if (reachable) urlState = 'REACHABLE';

  return {
    readOnly: true,
    urlState,
    urlObserved: true,
    urlReachable: reachable,
    previewUrl,
    host: injected?.host ?? input.runtimeActivationProof?.port.host ?? null,
    port: injected?.port ?? input.runtimeActivationProof?.port.port ?? null,
    protocol: injected?.protocol ?? input.runtimeActivationProof?.port.protocol ?? 'http',
    confidence: reachable ? 90 : 60,
  };
}

export function isPreviewUrlReachable(assessment: PreviewUrlAssessment): boolean {
  return assessment.urlState === 'REACHABLE' && assessment.urlReachable;
}
