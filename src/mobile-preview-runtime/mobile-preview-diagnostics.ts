/**
 * Mobile Preview Runtime Foundation — diagnostics tracker.
 */

import {
  listStoredMobilePreviewSessions,
  listStoredMobilePreviewTrackedSessions,
} from './mobile-preview-store.js';
import { listPreviewLinks } from './mobile-preview-link-manager.js';
import { detectMobilePreviewCommandMismatch } from './mobile-preview-command-bridge.js';
import { detectMobilePreviewChatMismatch } from './mobile-preview-chat-bridge.js';
import { detectMobilePreviewCloudMismatch } from './mobile-preview-cloud-bridge.js';
import { detectMobilePreviewWorkspaceMismatch } from './mobile-preview-workspace-bridge.js';
import { detectMobilePreviewBuildMismatch } from './mobile-preview-build-bridge.js';
import { detectMobilePreviewVerificationMismatch } from './mobile-preview-verification-bridge.js';
import { detectMobilePreviewOperatorFeedMismatch } from './mobile-preview-operator-feed-bridge.js';
import {
  buildDuplicateMobilePreviewRiskContext,
  evaluateDuplicateMobilePreviewRisk,
  validateMobilePreviewState,
} from './mobile-preview-validator.js';
import type { MobilePreviewDiagnostics, MobilePreviewState } from './mobile-preview-types.js';

let diagnostics: MobilePreviewDiagnostics = {
  mobilePreviewAuthorityActive: false,
  registeredMobilePreviewCount: 0,
  registeredPreviewLinkCount: 0,
  activeSessionCount: 0,
  eligibilityCheckedCount: 0,
  safetyCheckedCount: 0,
  previewAllowedCount: 0,
  previewBlockedCount: 0,
  desktopRecommendedCount: 0,
  previewReadyCount: 0,
  duplicateRiskCount: 0,
  commandMismatchCount: 0,
  chatMismatchCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  verificationMismatchCount: 0,
  livePreviewMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getMobilePreviewDiagnostics(): MobilePreviewDiagnostics {
  return { ...diagnostics };
}

export function updateMobilePreviewDiagnostics(
  query: string,
  finalState: MobilePreviewState | null = null,
  duplicateRiskCount = 0,
): MobilePreviewDiagnostics {
  const sessions = listStoredMobilePreviewSessions();
  const tracked = listStoredMobilePreviewTrackedSessions();
  const links = listPreviewLinks();

  let commandMismatchCount = 0;
  let chatMismatchCount = 0;
  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let verificationMismatchCount = 0;
  let livePreviewMismatchCount = 0;

  for (const s of sessions) {
    if (detectMobilePreviewCommandMismatch(s.mobilePreviewId)) commandMismatchCount += 1;
    if (detectMobilePreviewChatMismatch(s.mobilePreviewId)) chatMismatchCount += 1;
    if (detectMobilePreviewCloudMismatch(s.mobilePreviewId)) runtimeMismatchCount += 1;
    if (detectMobilePreviewWorkspaceMismatch(s.mobilePreviewId)) workspaceMismatchCount += 1;
    if (detectMobilePreviewBuildMismatch(s.mobilePreviewId)) buildMismatchCount += 1;
    if (detectMobilePreviewVerificationMismatch(s.mobilePreviewId)) verificationMismatchCount += 1;
    if (s.mobilePreviewLivePreviewLink.mismatchDetected) livePreviewMismatchCount += 1;
    if (detectMobilePreviewOperatorFeedMismatch(s.mobilePreviewId)) {
      // operator feed mismatch tracked via link flag only
    }
  }

  diagnostics = {
    mobilePreviewAuthorityActive: sessions.length > 0,
    registeredMobilePreviewCount: sessions.length,
    registeredPreviewLinkCount: links.length,
    activeSessionCount: tracked.length,
    eligibilityCheckedCount: sessions.filter((s) => s.mobilePreviewEligibility !== null).length,
    safetyCheckedCount: sessions.filter((s) => s.mobilePreviewSafety !== null).length,
    previewAllowedCount: sessions.filter((s) => s.mobilePreviewState === 'MOBILE_PREVIEW_ALLOWED').length,
    previewBlockedCount: sessions.filter((s) => s.mobilePreviewState === 'MOBILE_PREVIEW_BLOCKED').length,
    desktopRecommendedCount: sessions.filter((s) => s.mobilePreviewState === 'DESKTOP_RECOMMENDED').length,
    previewReadyCount: sessions.filter((s) => s.mobilePreviewState === 'PREVIEW_READY').length,
    duplicateRiskCount,
    commandMismatchCount,
    chatMismatchCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    verificationMismatchCount,
    livePreviewMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getMobilePreviewDiagnostics();
}

export function resetMobilePreviewDiagnosticsForTests(): void {
  diagnostics = {
    mobilePreviewAuthorityActive: false,
    registeredMobilePreviewCount: 0,
    registeredPreviewLinkCount: 0,
    activeSessionCount: 0,
    eligibilityCheckedCount: 0,
    safetyCheckedCount: 0,
    previewAllowedCount: 0,
    previewBlockedCount: 0,
    desktopRecommendedCount: 0,
    previewReadyCount: 0,
    duplicateRiskCount: 0,
    commandMismatchCount: 0,
    chatMismatchCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    verificationMismatchCount: 0,
    livePreviewMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runMobilePreviewDiagnosticsScan(): string[] {
  const findings: string[] = [];
  const previewIds = listStoredMobilePreviewSessions().map((s) => s.mobilePreviewId);
  if (new Set(previewIds).size !== previewIds.length) {
    findings.push('Duplicate mobile preview ids detected');
  }

  const parallelRisks = evaluateDuplicateMobilePreviewRisk(
    buildDuplicateMobilePreviewRiskContext('diagnostics-scan'),
  );
  if (parallelRisks.length > 0) {
    findings.push(`Parallel authority risk: ${parallelRisks[0]}`);
  }

  for (const s of listStoredMobilePreviewSessions()) {
    if (!s.mobilePreviewOwner.projectId) findings.push(`${s.mobilePreviewId}: missing project`);
    if (!s.mobilePreviewOwner.mobileCommandSessionId) findings.push(`${s.mobilePreviewId}: missing command link`);
    if (!s.mobilePreviewOwner.mobileChatSessionId) findings.push(`${s.mobilePreviewId}: missing chat link`);
    if (!s.mobilePreviewCloudLink.runtimeId) findings.push(`${s.mobilePreviewId}: missing runtime link`);
    if (!s.mobilePreviewWorkspaceLink.workspaceId) findings.push(`${s.mobilePreviewId}: missing workspace link`);
    if (!s.mobilePreviewBuildLink.persistentBuildId) findings.push(`${s.mobilePreviewId}: missing build link`);
    if (!s.mobilePreviewVerificationLink.verificationId) {
      findings.push(`${s.mobilePreviewId}: missing verification link`);
    }

    if (!validateMobilePreviewState(s.mobilePreviewState)) {
      findings.push(`${s.mobilePreviewId}: invalid state ${s.mobilePreviewState}`);
    }

    if (s.mobilePreviewEligibility && !s.mobilePreviewEligibility.mobilePreviewAllowed) {
      if (!s.mobilePreviewEligibility.mobilePreviewBlockedReason?.trim()) {
        findings.push(`${s.mobilePreviewId}: blocked without reason`);
      }
    }

    if (s.mobilePreviewSafety && !s.mobilePreviewSafety.safeToPreviewOnMobile && s.mobilePreviewState === 'MOBILE_PREVIEW_ALLOWED') {
      findings.push(`${s.mobilePreviewId}: unsafe allowed`);
    }

    if (s.mobilePreviewState === 'DESKTOP_RECOMMENDED') {
      const hasReason =
        s.mobilePreviewDesktopRecommendations.some((r) => r.reason?.trim()) ||
        s.mobilePreviewEligibility?.desktopRecommended;
      if (!hasReason) findings.push(`${s.mobilePreviewId}: desktop recommended without reason`);
    }

    if (s.mobilePreviewDevicePolicy && !s.mobilePreviewDevicePolicy.mobilePreviewAllowed) {
      if (!s.mobilePreviewDevicePolicy.mobilePreviewBlockedReason?.trim()) {
        findings.push(`${s.mobilePreviewId}: device policy blocked without reason`);
      }
    }
  }

  return findings;
}
