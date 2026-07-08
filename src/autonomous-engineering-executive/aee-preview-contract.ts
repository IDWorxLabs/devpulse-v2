/**
 * AEE Preview Unlock and Degraded Preview Contract V1.
 * Separates build spine success from preview unlock/degraded/unavailable outcomes.
 */

import { get as httpGet } from 'node:http';
import {
  isAuthoritativePreviewUnlocked,
  isLimitedPreviewReviewOnly,
  resolveAuthoritativePreviewUrls,
} from '../aep-preview-gate-authority/index.js';
import type { LivePreviewEvidenceSourceId } from '../live-preview-gate/live-preview-gate-types.js';
import type { LivePreviewGateResult } from '../live-preview-gate/live-preview-gate-types.js';
import { AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS } from './aee-preview-recovery-loop-types.js';
import { resolveAeeBuildOutcome } from './aee-decision-engine.js';
import type {
  AeePreviewContractInput,
  AeePreviewContractResult,
  AeePreviewContractStatus,
  AeePreviewRouteProbeResult,
} from './aee-preview-contract-types.js';
import { AEE_PREVIEW_CONTRACT_EVENT } from './aee-preview-contract-types.js';

export {
  AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN,
  AEE_PREVIEW_CONTRACT_EVENT,
} from './aee-preview-contract-types.js';

export type {
  AeePreviewContractInput,
  AeePreviewContractResult,
  AeePreviewContractStatus,
  AeePreviewRouteProbeResult,
  AeeBuildSpineStatus,
} from './aee-preview-contract-types.js';

const PREVIEW_PROBE_TIMEOUT_MS = 8_000;

const INTERACTION_VISUAL_BLOCKERS: readonly LivePreviewEvidenceSourceId[] = [
  'BEHAVIOR_SIMULATION',
  'VIRTUAL_USER',
  'VIRTUAL_DEVICE',
  'INTERACTION_PROOF',
  'AUTONOMOUS_DEBUGGING',
  'CONTINUOUS_IMPROVEMENT',
];

const HARD_PREVIEW_BLOCKERS: readonly LivePreviewEvidenceSourceId[] = [
  'PROMPT_FAITHFULNESS',
  'CAPABILITY_PLANNING',
  'MISSING_CAPABILITY_EVOLUTION',
  'INCREMENTAL_BUILD',
];

export function isInteractionOrVisualGateBlocker(
  gate: LivePreviewGateResult | null | undefined,
): boolean {
  if (!gate?.blockedBy) return false;
  return INTERACTION_VISUAL_BLOCKERS.includes(gate.blockedBy);
}

export function isHardPreviewGateBlocker(gate: LivePreviewGateResult | null | undefined): boolean {
  if (!gate?.blockedBy) return false;
  return HARD_PREVIEW_BLOCKERS.includes(gate.blockedBy);
}

export async function probePreviewDevServerRoute(
  previewUrl: string | null,
): Promise<AeePreviewRouteProbeResult> {
  if (!previewUrl) {
    return {
      readOnly: true,
      attempted: false,
      ok: false,
      statusCode: 0,
      url: null,
      detail: 'No preview URL to probe.',
    };
  }

  return new Promise((resolve) => {
    const req = httpGet(previewUrl, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const statusCode = res.statusCode ?? 0;
        const ok = statusCode >= 200 && statusCode < 400 && body.length > 20;
        resolve({
          readOnly: true,
          attempted: true,
          ok,
          statusCode,
          url: previewUrl,
          detail: ok
            ? `Route responded HTTP ${statusCode}.`
            : `Route probe failed HTTP ${statusCode}.`,
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        readOnly: true,
        attempted: true,
        ok: false,
        statusCode: 0,
        url: previewUrl,
        detail: err instanceof Error ? err.message : String(err),
      });
    });
    req.setTimeout(PREVIEW_PROBE_TIMEOUT_MS, () => {
      req.destroy();
      resolve({
        readOnly: true,
        attempted: true,
        ok: false,
        statusCode: 0,
        url: previewUrl,
        detail: 'Preview route probe timed out.',
      });
    });
  });
}

function synthesizeGateForUnlock(input: {
  gate: LivePreviewGateResult;
  devServerUrl: string | null;
}): LivePreviewGateResult {
  return {
    ...input.gate,
    state: 'UNLOCKED_PREVIEW_READY',
    unlockVerdict: 'PREVIEW_UNLOCKED',
    previewUrl: input.devServerUrl ?? input.gate.previewUrl,
    isPreviewAvailable: true,
    isLimitedPreview: false,
  };
}

export function resolveAeePreviewContractSync(input: {
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  devServerRunning: boolean;
  devServerUrl: string | null;
  gate: LivePreviewGateResult;
  gateBlocker: string | null;
  previewRecoveryAttempts: number;
  previewRecoveryExhausted?: boolean;
  routeProbe: AeePreviewRouteProbeResult;
}): AeePreviewContractResult {
  const buildStatus = input.npmInstallOk && input.npmBuildOk ? 'PASS' : input.npmBuildOk ? 'FAIL' : 'PENDING';
  const gateUnlocked = isAuthoritativePreviewUnlocked(input.gate);
  const limitedPreview = isLimitedPreviewReviewOnly(input.gate);
  const interactionVerificationFailed = isInteractionOrVisualGateBlocker(input.gate);
  const previewRecoveryExhausted =
    input.previewRecoveryExhausted ??
    (input.previewRecoveryAttempts >= AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS &&
      !gateUnlocked &&
      input.npmBuildOk);

  let previewStatus: AeePreviewContractStatus = 'UNAVAILABLE';
  let livePreviewAvailable = gateUnlocked;
  let effectiveGate = input.gate;

  if (!input.npmBuildOk) {
    previewStatus = 'UNAVAILABLE';
  } else if (gateUnlocked) {
    previewStatus = 'UNLOCKED';
  } else if (input.routeProbe.ok) {
    livePreviewAvailable = true;
    if (interactionVerificationFailed) {
      previewStatus = 'DEGRADED';
    } else {
      previewStatus = 'UNLOCKED';
      effectiveGate = synthesizeGateForUnlock({
        gate: input.gate,
        devServerUrl: input.devServerUrl,
      });
    }
  } else if (input.devServerRunning || limitedPreview) {
    previewStatus = 'DEGRADED';
  } else if (previewRecoveryExhausted) {
    previewStatus = 'DEGRADED';
  }

  const previewDegraded = previewStatus === 'DEGRADED';
  const authoritativePreview = resolveAuthoritativePreviewUrls({
    gate: effectiveGate,
    devServerUrl: input.devServerUrl,
    devServerRunning: input.devServerRunning,
  });

  let previewUrl = authoritativePreview.previewUrl;
  let diagnosticPreviewUrl = authoritativePreview.diagnosticPreviewUrl;
  let limitedPreviewUrl = authoritativePreview.limitedPreviewUrl;

  if (previewStatus === 'UNLOCKED' && !previewUrl && input.devServerUrl && input.routeProbe.ok) {
    previewUrl = input.devServerUrl;
    diagnosticPreviewUrl = null;
  }

  if (previewStatus === 'DEGRADED' && input.devServerUrl) {
    if (input.routeProbe.ok) {
      livePreviewAvailable = true;
      previewUrl = previewUrl ?? input.devServerUrl;
      diagnosticPreviewUrl = null;
    } else {
      diagnosticPreviewUrl = diagnosticPreviewUrl ?? input.devServerUrl;
      if (limitedPreview) {
        limitedPreviewUrl = limitedPreviewUrl ?? input.devServerUrl;
      }
    }
  }

  const finalOutcome =
    buildStatus === 'PASS'
      ? resolveAeeBuildOutcome({
          workspaceExists: true,
          materialized: true,
          npmInstallOk: input.npmInstallOk,
          npmBuildOk: input.npmBuildOk,
          previewOk: livePreviewAvailable,
          previewDegraded,
          repairAttempts: input.previewRecoveryAttempts,
          concreteBlocker: false,
        })
      : null;

  const summary =
    previewStatus === 'UNLOCKED'
      ? `${AEE_PREVIEW_CONTRACT_EVENT}: build PASS — live preview unlocked.`
      : previewStatus === 'DEGRADED'
        ? input.routeProbe.ok
          ? `${AEE_PREVIEW_CONTRACT_EVENT}: build PASS — preview available with DEGRADED interaction proof (${input.gateBlocker ?? 'interaction verification incomplete'}).`
          : `${AEE_PREVIEW_CONTRACT_EVENT}: build PASS — preview DEGRADED (${input.gateBlocker ?? 'gate locked'}).`
        : `${AEE_PREVIEW_CONTRACT_EVENT}: build ${buildStatus} — preview unavailable.`;

  return {
    readOnly: true,
    buildStatus,
    previewStatus,
    finalOutcome,
    livePreviewAvailable,
    previewDegraded,
    previewUrl,
    diagnosticPreviewUrl,
    limitedPreviewUrl,
    devServerRunning: input.devServerRunning,
    gateLocked: !gateUnlocked && !livePreviewAvailable,
    gateBlocker: input.gateBlocker,
    routeProbe: input.routeProbe,
    previewRecoveryExhausted,
    interactionVerificationFailed,
    summary,
    authoritativePreview: {
      ...authoritativePreview,
      livePreviewAvailable,
      previewUrl,
      diagnosticPreviewUrl,
      limitedPreviewUrl,
    },
    gate: effectiveGate,
  };
}

export async function resolveAeePreviewContract(
  input: AeePreviewContractInput,
): Promise<AeePreviewContractResult> {
  const routeProbe =
    input.routeProbe ??
    (input.devServerUrl && input.npmBuildOk
      ? await probePreviewDevServerRoute(input.devServerUrl)
      : {
          readOnly: true as const,
          attempted: false,
          ok: false,
          statusCode: 0,
          url: input.devServerUrl,
          detail: 'Route probe skipped.',
        });

  return resolveAeePreviewContractSync({
    npmInstallOk: input.npmInstallOk,
    npmBuildOk: input.npmBuildOk,
    devServerRunning: input.devServerRunning,
    devServerUrl: input.devServerUrl,
    gate: input.gate,
    gateBlocker: input.gateBlocker,
    previewRecoveryAttempts: input.previewRecoveryAttempts,
    previewRecoveryExhausted: input.previewRecoveryExhausted,
    routeProbe,
  });
}

export function previewContractExhaustedRecoveryIsDegraded(
  contract: AeePreviewContractResult,
): boolean {
  return (
    contract.buildStatus === 'PASS' &&
    contract.previewRecoveryExhausted &&
    contract.previewStatus === 'DEGRADED' &&
    contract.finalOutcome === 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW'
  );
}

export function buildStatusSeparateFromPreview(result: {
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewStatus?: AeePreviewContractStatus | string | null;
  livePreviewAvailable?: boolean;
}): { buildStatus: 'PASS' | 'FAIL'; previewStatus: string } {
  return {
    buildStatus: result.npmInstallOk && result.npmBuildOk ? 'PASS' : 'FAIL',
    previewStatus:
      result.previewStatus ??
      (result.livePreviewAvailable ? 'UNLOCKED' : result.npmBuildOk ? 'DEGRADED' : 'UNAVAILABLE'),
  };
}
