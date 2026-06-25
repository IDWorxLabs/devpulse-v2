/**
 * Mobile Runtime Preview V2 — reality bridge with Android launch evidence.
 */

import { assessMobileRuntimeExperienceReality } from '../mobile-runtime-experience-reality/index.js';
import type { MobileRuntimeRealityBridgeResult, MobileRuntimeVerificationRecord } from '../mobile-runtime-preview-v1/mobile-runtime-preview-types.js';
import type { AndroidEmulatorLaunchEvidence } from './mobile-runtime-preview-v2-types.js';

export function buildV2WorkspaceSignals(
  records: MobileRuntimeVerificationRecord[],
  androidEvidence: AndroidEmulatorLaunchEvidence,
): MobileRuntimeRealityBridgeResult['workspaceSignals'] {
  const byId = new Map(records.map((r) => [r.runtimeId, r]));
  const browser = byId.get('BROWSER');
  const mobileWeb = byId.get('MOBILE_WEB');
  const android = byId.get('ANDROID');

  const browserVerified = Boolean(browser?.verificationSuccessful);
  const mobileWebVerified = Boolean(mobileWeb?.verificationSuccessful);
  const androidVerified = androidEvidence.verificationVerdict === 'VERIFIED';
  const androidLaunchProven = androidVerified || Boolean(android?.launchSuccessful && androidEvidence.bootCompleted);

  return {
    deviceFramePreviewActive: mobileWebVerified,
    touchSimulationEvidence: mobileWebVerified,
    mobilePreviewLaunchEvidence: browserVerified || mobileWebVerified || androidLaunchProven,
    androidRuntimeLaunchEvidence: androidVerified,
    iosRuntimeLaunchEvidence: Boolean(byId.get('IOS')?.launchSuccessful && byId.get('IOS')?.verificationSuccessful),
    expoRuntimeLaunchEvidence: Boolean(byId.get('EXPO')?.launchSuccessful && byId.get('EXPO')?.verificationSuccessful),
    mobileRuntimeVerificationEvidence:
      records.some((r) => r.verificationSuccessful) || androidVerified,
  };
}

export function assessMobileRuntimeRealityWithV2Evidence(
  rootDir: string,
  records: MobileRuntimeVerificationRecord[],
  androidEvidence: AndroidEmulatorLaunchEvidence,
): MobileRuntimeRealityBridgeResult {
  const workspaceSignals = buildV2WorkspaceSignals(records, androidEvidence);

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
