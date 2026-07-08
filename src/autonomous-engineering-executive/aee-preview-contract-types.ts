/**
 * AEE Preview Unlock and Degraded Preview Contract V1 — types.
 */

import type { LivePreviewGateResult } from '../live-preview-gate/live-preview-gate-types.js';
import type { AuthoritativePreviewResolution } from '../aep-preview-gate-authority/aep-preview-gate-authority-types.js';
import type { AeeBuildOutcome } from './aee-types.js';

export const AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN = 'AEE_PREVIEW_CONTRACT_V1_PASS' as const;

export const AEE_PREVIEW_CONTRACT_EVENT = 'AEE_PREVIEW_CONTRACT_V1' as const;

export type AeePreviewContractStatus = 'UNLOCKED' | 'DEGRADED' | 'UNAVAILABLE';

export type AeeBuildSpineStatus = 'PASS' | 'FAIL' | 'PENDING';

export interface AeePreviewRouteProbeResult {
  readOnly: true;
  attempted: boolean;
  ok: boolean;
  statusCode: number;
  url: string | null;
  detail: string;
}

export interface AeePreviewContractResult {
  readOnly: true;
  buildStatus: AeeBuildSpineStatus;
  previewStatus: AeePreviewContractStatus;
  finalOutcome: AeeBuildOutcome | null;
  livePreviewAvailable: boolean;
  previewDegraded: boolean;
  previewUrl: string | null;
  diagnosticPreviewUrl: string | null;
  limitedPreviewUrl: string | null;
  devServerRunning: boolean;
  gateLocked: boolean;
  gateBlocker: string | null;
  routeProbe: AeePreviewRouteProbeResult;
  previewRecoveryExhausted: boolean;
  interactionVerificationFailed: boolean;
  summary: string;
  authoritativePreview: AuthoritativePreviewResolution;
  gate: LivePreviewGateResult;
}

export interface AeePreviewContractInput {
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  devServerRunning: boolean;
  devServerUrl: string | null;
  gate: LivePreviewGateResult;
  gateBlocker: string | null;
  previewRecoveryAttempts: number;
  previewRecoveryExhausted?: boolean;
  routeProbe?: AeePreviewRouteProbeResult | null;
}
