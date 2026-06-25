/**
 * Mobile Runtime Preview V1 — bridge to mobile-runtime-experience-reality.
 * Feeds real launch/verification evidence only — no fake proof.
 */

import { assessMobileRuntimeExperienceReality } from '../mobile-runtime-experience-reality/index.js';
import type {
  MobileRuntimeRealityBridgeResult,
  MobileRuntimeVerificationRecord,
} from './mobile-runtime-preview-types.js';

export function buildWorkspaceSignalsFromVerification(
  records: MobileRuntimeVerificationRecord[],
): MobileRuntimeRealityBridgeResult['workspaceSignals'] {
  const byId = new Map(records.map((r) => [r.runtimeId, r]));

  const browser = byId.get('BROWSER');
  const mobileWeb = byId.get('MOBILE_WEB');
  const android = byId.get('ANDROID');
  const ios = byId.get('IOS');
  const expo = byId.get('EXPO');

  const browserVerified = Boolean(browser?.verificationSuccessful);
  const mobileWebVerified = Boolean(mobileWeb?.verificationSuccessful);

  return {
    deviceFramePreviewActive: mobileWebVerified,
    touchSimulationEvidence: mobileWebVerified,
    mobilePreviewLaunchEvidence: browserVerified || mobileWebVerified,
    androidRuntimeLaunchEvidence: Boolean(android?.launchSuccessful && android?.verificationSuccessful),
    iosRuntimeLaunchEvidence: Boolean(ios?.launchSuccessful && ios?.verificationSuccessful),
    expoRuntimeLaunchEvidence: Boolean(expo?.launchSuccessful && expo?.verificationSuccessful),
    mobileRuntimeVerificationEvidence: records.some((r) => r.verificationSuccessful),
  };
}

export function assessMobileRuntimeRealityWithPreviewEvidence(
  rootDir: string,
  records: MobileRuntimeVerificationRecord[],
): MobileRuntimeRealityBridgeResult {
  const workspaceSignals = buildWorkspaceSignalsFromVerification(records);

  const assessment = assessMobileRuntimeExperienceReality(rootDir, {
    deviceFramePreviewActive: workspaceSignals.deviceFramePreviewActive,
    touchSimulationEvidence: workspaceSignals.touchSimulationEvidence,
    mobilePreviewLaunchEvidence: workspaceSignals.mobilePreviewLaunchEvidence,
    androidRuntimeLaunchEvidence: workspaceSignals.androidRuntimeLaunchEvidence,
    iosRuntimeLaunchEvidence: workspaceSignals.iosRuntimeLaunchEvidence,
    expoRuntimeLaunchEvidence: workspaceSignals.expoRuntimeLaunchEvidence,
    executionConnected: workspaceSignals.mobileRuntimeVerificationEvidence,
  });

  return {
    workspaceSignals,
    realityAssessmentScore: assessment.mobileRuntimeExperienceScore,
    realityAssessmentId: assessment.assessmentId,
  };
}
