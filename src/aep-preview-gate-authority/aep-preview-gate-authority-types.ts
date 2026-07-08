/**
 * AEP Preview Gate Authority V1 — types and pass token.
 * Live Preview unlock is governed solely by the Live Preview Gate.
 */

import type { LivePreviewGateResult, LivePreviewLockState } from '../live-preview-gate/live-preview-gate-types.js';

export const AEP_PREVIEW_GATE_AUTHORITY_V1_PASS_TOKEN = 'AEP_PREVIEW_GATE_AUTHORITY_V1_PASS' as const;

export type AuthoritativePreviewResolution = {
  readOnly: true;
  livePreviewAvailable: boolean;
  previewUrl: string | null;
  diagnosticPreviewUrl: string | null;
  limitedPreviewUrl: string | null;
  devServerRunning: boolean;
  lockState: LivePreviewLockState | null;
  unlockVerdict: LivePreviewGateResult['unlockVerdict'] | null;
  limitedPreviewReviewOnly: boolean;
};

export function isAuthoritativePreviewUnlocked(gate: LivePreviewGateResult): boolean {
  return (
    gate.unlockVerdict === 'PREVIEW_UNLOCKED' && gate.state === 'UNLOCKED_PREVIEW_READY'
  );
}

export function isLimitedPreviewReviewOnly(gate: LivePreviewGateResult): boolean {
  return gate.isLimitedPreview && gate.state === 'LIMITED_PREVIEW_REVIEW_ONLY';
}

/**
 * Resolves public preview URLs from gate authority + optional dev server diagnostic URL.
 * Dev server URL alone never becomes previewUrl.
 */
export function resolveAuthoritativePreviewUrls(input: {
  gate: LivePreviewGateResult;
  devServerUrl: string | null;
  devServerRunning: boolean;
}): AuthoritativePreviewResolution {
  const unlocked = isAuthoritativePreviewUnlocked(input.gate);
  const limited = isLimitedPreviewReviewOnly(input.gate);

  const authoritativeUrl = input.gate.previewUrl ?? input.devServerUrl;
  const previewUrl = unlocked ? authoritativeUrl : null;
  const limitedPreviewUrl = limited && !unlocked ? authoritativeUrl : null;
  const diagnosticPreviewUrl =
    !unlocked && !limited && input.devServerRunning && input.devServerUrl
      ? input.devServerUrl
      : null;

  return {
    readOnly: true,
    livePreviewAvailable: unlocked,
    previewUrl,
    diagnosticPreviewUrl,
    limitedPreviewUrl,
    devServerRunning: input.devServerRunning,
    lockState: input.gate.state,
    unlockVerdict: input.gate.unlockVerdict,
    limitedPreviewReviewOnly: limited && !unlocked,
  };
}
