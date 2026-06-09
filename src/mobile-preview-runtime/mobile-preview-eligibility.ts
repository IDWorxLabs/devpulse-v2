/**
 * Mobile Preview Runtime Foundation — eligibility metadata (no preview execution).
 */

import { getStoredMobilePreviewSession, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getCloudVerification } from '../cloud-verification/index.js';
import type {
  MobilePreviewCategory,
  MobilePreviewEligibility,
  MobilePreviewEligibilityResult,
  MobilePreviewEstimatedDeviceLoad,
  MobilePreviewProjectSizeCategory,
  MobilePreviewTargetComplexity,
} from './mobile-preview-types.js';

let eligibilityCounter = 0;

export function resetMobilePreviewEligibilityCounterForTests(): void {
  eligibilityCounter = 0;
}

function nextMobilePreviewEligibilityId(): string {
  eligibilityCounter += 1;
  return `mpvelig-${eligibilityCounter.toString().padStart(4, '0')}`;
}

function resolveProjectSizeCategory(mobilePreviewType: MobilePreviewCategory): MobilePreviewProjectSizeCategory {
  if (mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW' || mobilePreviewType === 'AUTONOMOUS_MOBILE_PREVIEW') {
    return 'ENTERPRISE';
  }
  if (mobilePreviewType === 'BUILD_MOBILE_PREVIEW' || mobilePreviewType === 'LIVE_PREVIEW_MOBILE_PREVIEW') {
    return 'LARGE';
  }
  if (mobilePreviewType === 'VERIFICATION_MOBILE_PREVIEW' || mobilePreviewType === 'AIDEV_MOBILE_PREVIEW') {
    return 'MEDIUM';
  }
  return 'SMALL';
}

function resolveTargetComplexity(mobilePreviewType: MobilePreviewCategory): MobilePreviewTargetComplexity {
  if (mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW' || mobilePreviewType === 'AUTONOMOUS_MOBILE_PREVIEW') {
    return 'EXTREME';
  }
  if (mobilePreviewType === 'BUILD_MOBILE_PREVIEW' || mobilePreviewType === 'LIVE_PREVIEW_MOBILE_PREVIEW') {
    return 'HIGH';
  }
  if (mobilePreviewType === 'VERIFICATION_MOBILE_PREVIEW' || mobilePreviewType === 'WORLD2_MOBILE_PREVIEW') {
    return 'MODERATE';
  }
  return 'LOW';
}

function resolveEstimatedDeviceLoad(
  projectSizeCategory: MobilePreviewProjectSizeCategory,
  targetComplexity: MobilePreviewTargetComplexity,
): MobilePreviewEstimatedDeviceLoad {
  if (projectSizeCategory === 'ENTERPRISE' || targetComplexity === 'EXTREME') return 'EXCESSIVE';
  if (projectSizeCategory === 'LARGE' || targetComplexity === 'HIGH') return 'HEAVY';
  if (projectSizeCategory === 'MEDIUM' || targetComplexity === 'MODERATE') return 'MODERATE';
  return 'LIGHT';
}

export function buildDefaultMobilePreviewEligibility(
  mobilePreviewId: string,
  mobilePreviewType: MobilePreviewCategory = 'GENERAL_MOBILE_PREVIEW',
): MobilePreviewEligibility {
  const projectSizeCategory = resolveProjectSizeCategory(mobilePreviewType);
  const targetComplexity = resolveTargetComplexity(mobilePreviewType);
  const estimatedDeviceLoad = resolveEstimatedDeviceLoad(projectSizeCategory, targetComplexity);
  const founderOnly = mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW';
  const desktopRecommended =
    projectSizeCategory === 'LARGE' ||
    projectSizeCategory === 'ENTERPRISE' ||
    targetComplexity === 'HIGH' ||
    targetComplexity === 'EXTREME';
  const requiresDesktop = founderOnly || projectSizeCategory === 'ENTERPRISE';
  const mobilePreviewAllowed = !founderOnly && !requiresDesktop;
  const mobilePreviewBlockedReason = founderOnly
    ? 'Founder-only preview surface'
    : requiresDesktop
      ? 'Desktop required for enterprise preview scope'
      : null;
  const eligibleForMobilePreview = mobilePreviewAllowed;
  const eligibilityReason = mobilePreviewAllowed
    ? 'Default eligibility — metadata-only mobile preview permitted'
    : (mobilePreviewBlockedReason ?? 'Mobile preview blocked by default policy');

  return {
    eligibilityId: nextMobilePreviewEligibilityId(),
    mobilePreviewId,
    result: eligibleForMobilePreview ? 'ELIGIBLE' : founderOnly ? 'FOUNDER_ONLY' : 'INELIGIBLE',
    reason: eligibilityReason,
    evaluatedAt: Date.now(),
    eligibleForMobilePreview,
    eligibilityReason,
    projectSizeCategory,
    targetComplexity,
    estimatedDeviceLoad,
    requiresDesktop,
    desktopRecommended,
    mobilePreviewAllowed,
    mobilePreviewBlockedReason,
    projectContextPresent: false,
    commandSessionPresent: false,
    chatSessionPresent: false,
    runtimePresent: false,
    workspacePresent: false,
    buildPresent: false,
    verificationPresent: false,
  };
}

export function evaluateMobilePreviewEligibility(mobilePreviewId: string): MobilePreviewEligibility | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  const owner = session.mobilePreviewOwner;
  const command = getMobileCommandSession(owner.mobileCommandSessionId);
  const chat = getMobileChatSession(owner.mobileChatSessionId);
  const runtime = getRuntime(owner.runtimeId);
  const workspace = getWorkspace(owner.workspaceId);
  const build = getPersistentBuild(owner.persistentBuildId);
  const verification = getCloudVerification(owner.verificationId);

  const projectContextPresent = Boolean(owner.projectId?.trim());
  const commandSessionPresent = command !== null;
  const chatSessionPresent = chat !== null;
  const runtimePresent = runtime !== null;
  const workspacePresent = workspace !== null;
  const buildPresent = build !== null;
  const verificationPresent = verification !== null;

  const base = buildDefaultMobilePreviewEligibility(mobilePreviewId, session.mobilePreviewType);
  const contextMissing =
    !projectContextPresent ||
    !commandSessionPresent ||
    !chatSessionPresent ||
    !runtimePresent ||
    !workspacePresent ||
    !buildPresent ||
    !verificationPresent;

  let result: MobilePreviewEligibilityResult = base.result;
  let eligibleForMobilePreview = base.eligibleForMobilePreview;
  let mobilePreviewAllowed = base.mobilePreviewAllowed;
  let mobilePreviewBlockedReason = base.mobilePreviewBlockedReason;
  let requiresDesktop = base.requiresDesktop;
  let desktopRecommended = base.desktopRecommended;
  let eligibilityReason = base.eligibilityReason;

  if (contextMissing) {
    result = 'CONTEXT_REQUIRED';
    eligibleForMobilePreview = false;
    mobilePreviewAllowed = false;
    mobilePreviewBlockedReason = 'Upstream mobile preview context incomplete';
    eligibilityReason = 'Eligibility blocked — required command, chat, or cloud metadata missing';
  } else if (command && !command.mobileCommandPermissions.mobilePreviewAllowed) {
    result = 'INELIGIBLE';
    eligibleForMobilePreview = false;
    mobilePreviewAllowed = false;
    mobilePreviewBlockedReason =
      command.mobileCommandPermissions.mobilePreviewBlockedReason ?? 'Mobile command blocked preview';
    eligibilityReason = mobilePreviewBlockedReason;
  } else if (chat && !chat.mobileChatPermissions.mobilePreviewAllowed) {
    result = 'INELIGIBLE';
    eligibleForMobilePreview = false;
    mobilePreviewAllowed = false;
    mobilePreviewBlockedReason =
      chat.mobileChatPermissions.mobilePreviewBlockedReason ?? 'Mobile chat blocked preview';
    eligibilityReason = mobilePreviewBlockedReason;
  } else if (base.desktopRecommended && base.mobilePreviewAllowed) {
    result = 'DESKTOP_RECOMMENDED';
    desktopRecommended = true;
    eligibilityReason = 'Mobile preview eligible with desktop recommendation for large target scope';
  }

  if (session.mobilePreviewState === 'FAILED' || session.mobilePreviewState === 'ARCHIVED') {
    eligibleForMobilePreview = false;
    mobilePreviewAllowed = false;
    mobilePreviewBlockedReason = `Preview session state ${session.mobilePreviewState}`;
    eligibilityReason = mobilePreviewBlockedReason;
    result = 'INELIGIBLE';
  }

  const eligibility: MobilePreviewEligibility = {
    ...base,
    result,
    reason: eligibilityReason,
    evaluatedAt: Date.now(),
    eligibleForMobilePreview,
    eligibilityReason,
    requiresDesktop,
    desktopRecommended,
    mobilePreviewAllowed,
    mobilePreviewBlockedReason,
    projectContextPresent,
    commandSessionPresent,
    chatSessionPresent,
    runtimePresent,
    workspacePresent,
    buildPresent,
    verificationPresent,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewEligibility: eligibility,
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'ELIGIBILITY',
    summary: `Eligibility evaluated: ${result} — ${eligibilityReason}`,
    scopeUsed: eligibility.eligibilityId,
  });

  return eligibility;
}

export function validateMobilePreviewEligibility(eligibility: MobilePreviewEligibility): string[] {
  const issues: string[] = [];
  if (!eligibility.eligibilityReason?.trim()) issues.push('Eligibility missing reason');
  if (!eligibility.mobilePreviewAllowed && !eligibility.mobilePreviewBlockedReason?.trim()) {
    issues.push('Mobile preview blocked without reason');
  }
  if (eligibility.desktopRecommended && !eligibility.requiresDesktop && eligibility.eligibleForMobilePreview) {
    if (eligibility.projectSizeCategory === 'SMALL' && eligibility.targetComplexity === 'LOW') {
      issues.push('Desktop recommendation inconsistent with small low-complexity preview');
    }
  }
  if (eligibility.eligibleForMobilePreview !== eligibility.mobilePreviewAllowed) {
    issues.push('Eligible flag inconsistent with mobilePreviewAllowed');
  }
  return issues;
}
