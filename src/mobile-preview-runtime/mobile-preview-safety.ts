/**
 * Mobile Preview Runtime Foundation — safety metadata (no preview execution).
 */

import { getStoredMobilePreviewSession, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import type {
  MobilePreviewSafety,
  MobilePreviewSafetyResult,
  MobilePreviewSafetyRiskLevel,
} from './mobile-preview-types.js';

let safetyCounter = 0;

export function resetMobilePreviewSafetyCounterForTests(): void {
  safetyCounter = 0;
}

function nextMobilePreviewSafetyId(): string {
  safetyCounter += 1;
  return `mpvsafe-${safetyCounter.toString().padStart(4, '0')}`;
}

function resolveSafetyRiskLevel(reasons: string[]): MobilePreviewSafetyRiskLevel {
  if (reasons.length >= 3) return 'CRITICAL';
  if (reasons.length === 2) return 'HIGH';
  if (reasons.length === 1) return 'MODERATE';
  return 'LOW';
}

export function buildDefaultMobilePreviewSafety(mobilePreviewId: string): MobilePreviewSafety {
  return {
    safetyId: nextMobilePreviewSafetyId(),
    mobilePreviewId,
    result: 'SAFE',
    reason: 'Default safety posture — metadata-only preview authority',
    evaluatedAt: Date.now(),
    safeToPreviewOnMobile: true,
    safetyRiskLevel: 'LOW',
    safetyReasons: [],
    largeSystemRisk: false,
    resourcePressureRisk: false,
    sensitivePreviewRisk: false,
    unstableRuntimeRisk: false,
    requiresFounderApproval: false,
    mobileSafe: true,
    desktopRequired: false,
    securityWarnings: [],
    governanceWarnings: [],
  };
}

export function evaluateMobilePreviewSafety(mobilePreviewId: string): MobilePreviewSafety | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  const owner = session.mobilePreviewOwner;
  const runtime = getRuntime(owner.runtimeId);
  const build = getPersistentBuild(owner.persistentBuildId);
  const eligibility = session.mobilePreviewEligibility;

  const safetyReasons: string[] = [];
  const securityWarnings: string[] = [];
  const governanceWarnings: string[] = [];

  const largeSystemRisk =
    eligibility?.projectSizeCategory === 'LARGE' ||
    eligibility?.projectSizeCategory === 'ENTERPRISE' ||
    session.mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW' ||
    session.mobilePreviewType === 'AUTONOMOUS_MOBILE_PREVIEW';

  const resourcePressureRisk =
    eligibility?.estimatedDeviceLoad === 'HEAVY' || eligibility?.estimatedDeviceLoad === 'EXCESSIVE';

  const sensitivePreviewRisk =
    session.mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW' ||
    session.mobilePreviewVisibility === 'FOUNDER' ||
    session.mobilePreviewType === 'VERIFICATION_MOBILE_PREVIEW';

  const unstableRuntimeRisk =
    runtime?.runtimeState === 'FAILED' ||
    runtime?.runtimeStatus === 'DEGRADED' ||
    runtime?.runtimeStatus === 'BLOCKED' ||
    build?.buildState === 'FAILED';

  if (largeSystemRisk) safetyReasons.push('Large system preview scope increases mobile risk');
  if (resourcePressureRisk) safetyReasons.push('Estimated device load exceeds mobile-safe threshold');
  if (sensitivePreviewRisk) {
    safetyReasons.push('Sensitive preview surface requires elevated governance');
    governanceWarnings.push('Founder or verification preview metadata flagged');
  }
  if (unstableRuntimeRisk) {
    safetyReasons.push('Upstream runtime or build state unstable');
    securityWarnings.push('Cloud runtime or persistent build not healthy');
  }
  if (eligibility && !eligibility.mobilePreviewAllowed) {
    safetyReasons.push(eligibility.mobilePreviewBlockedReason ?? 'Eligibility blocked mobile preview');
  }

  const safetyRiskLevel = resolveSafetyRiskLevel(safetyReasons);
  const requiresFounderApproval =
    sensitivePreviewRisk || session.mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW';
  const desktopRequired =
    largeSystemRisk || resourcePressureRisk || unstableRuntimeRisk || eligibility?.requiresDesktop === true;
  const safeToPreviewOnMobile =
    safetyReasons.length === 0 ||
    (safetyRiskLevel === 'MODERATE' && !unstableRuntimeRisk && !requiresFounderApproval);

  let result: MobilePreviewSafetyResult = 'SAFE';
  if (!safeToPreviewOnMobile && requiresFounderApproval) result = 'BLOCKED';
  else if (!safeToPreviewOnMobile && desktopRequired) result = 'REQUIRES_DESKTOP';
  else if (!safeToPreviewOnMobile) result = 'UNSAFE';

  const reason =
    safetyReasons.length === 0
      ? 'Safety evaluation passed — metadata-only mobile preview posture'
      : safetyReasons.join('; ');

  const safety: MobilePreviewSafety = {
    safetyId: nextMobilePreviewSafetyId(),
    mobilePreviewId,
    result,
    reason,
    evaluatedAt: Date.now(),
    safeToPreviewOnMobile,
    safetyRiskLevel,
    safetyReasons,
    largeSystemRisk,
    resourcePressureRisk,
    sensitivePreviewRisk,
    unstableRuntimeRisk,
    requiresFounderApproval,
    mobileSafe: safeToPreviewOnMobile,
    desktopRequired,
    securityWarnings,
    governanceWarnings,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewSafety: safety,
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'SAFETY',
    summary: `Safety evaluated: ${result} — ${reason}`,
    scopeUsed: safety.safetyId,
  });

  return safety;
}

export function validateMobilePreviewSafety(safety: MobilePreviewSafety): string[] {
  const issues: string[] = [];
  if (!safety.reason?.trim()) issues.push('Safety evaluation missing reason');
  if (safety.safeToPreviewOnMobile !== safety.mobileSafe) {
    issues.push('safeToPreviewOnMobile inconsistent with mobileSafe');
  }
  if (safety.safetyRiskLevel === 'CRITICAL' && safety.safeToPreviewOnMobile) {
    issues.push('Critical risk level cannot be mobile-safe');
  }
  if (safety.requiresFounderApproval && safety.safeToPreviewOnMobile && safety.safetyRiskLevel !== 'LOW') {
    issues.push('Founder approval required for elevated-risk preview');
  }
  if (safety.safetyReasons.length > 0 && safety.safetyRiskLevel === 'LOW' && !safety.safeToPreviewOnMobile) {
    issues.push('Safety reasons present but risk level marked low');
  }
  return issues;
}
