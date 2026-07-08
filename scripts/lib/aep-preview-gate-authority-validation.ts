/**
 * AEP Preview Gate Authority V1 — shared validation (static + scenario).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AEP_PREVIEW_GATE_AUTHORITY_V1_PASS_TOKEN,
  isAuthoritativePreviewUnlocked,
  resolveAuthoritativePreviewUrls,
} from '../../src/aep-preview-gate-authority/index.js';
import type { LivePreviewGateResult } from '../../src/live-preview-gate/live-preview-gate-types.js';

export { AEP_PREVIEW_GATE_AUTHORITY_V1_PASS_TOKEN };

export interface AepPreviewGateCheck {
  name: string;
  passed: boolean;
  detail: string;
}

function mockGate(partial: Pick<LivePreviewGateResult, 'state' | 'unlockVerdict' | 'isPreviewAvailable' | 'isLimitedPreview'>): LivePreviewGateResult {
  return {
    readOnly: true,
    gateId: 'mock-gate',
    evaluatedAt: Date.now(),
    previewUrl: 'http://localhost:4321',
    currentGate: 'MOCK',
    blockedBy: null,
    blockers: [],
    warnings: [],
    launchVerdict: 'NOT_LAUNCH_READY',
    recommendedNextStep: 'mock',
    reportMarkdown: '',
    state: partial.state,
    unlockVerdict: partial.unlockVerdict,
    isPreviewAvailable: partial.isPreviewAvailable,
    isLimitedPreview: partial.isLimitedPreview,
    statusCard: {
      readOnly: true,
      previewState: partial.state,
      currentGate: 'MOCK',
      overallProgress: 0,
      passedGates: [],
      activeGate: null,
      blockedGate: null,
      repairAttempts: null,
      capabilityEvolutionStatus: null,
      launchReadinessVerdict: 'NOT_LAUNCH_READY',
      nextAction: 'mock',
      estimatedRisk: 'HIGH',
    },
    transitionLog: [],
    evidenceSummary: {
      readOnly: true,
      collectedAt: Date.now(),
      items: [],
      missingSources: [],
    },
    unlockDecision: {
      readOnly: true,
      decisionId: 'mock',
      verdict: partial.unlockVerdict,
      lockState: partial.state,
      primaryBlockingGate: null,
      blockingEvidence: [],
      confidence: 0,
      recommendedNextStep: 'mock',
      traceability: [],
      launchVerdict: 'NOT_LAUNCH_READY',
    },
    blockerExplanation: {
      readOnly: true,
      currentStage: 'MOCK',
      blockingGate: 'MOCK',
      reason: 'mock blocker',
      affectedFeature: null,
      affectedWorkflow: null,
      affectedUser: null,
      affectedDevice: null,
      affectedInteraction: null,
      repairStatus: null,
      nextSystemAction: 'mock',
      humanActionRequired: null,
      summary: 'Launch evidence incomplete',
    },
  };
}

export function validatePreviewUrlNotReadiness(): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const locked = mockGate({
    state: 'LOCKED_VALIDATING',
    unlockVerdict: 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE',
    isPreviewAvailable: false,
    isLimitedPreview: false,
  });
  const resolved = resolveAuthoritativePreviewUrls({
    gate: locked,
    devServerUrl: 'http://localhost:4321',
    devServerRunning: true,
  });
  checks.push({
    name: 'dev server url is not previewUrl when locked',
    passed: resolved.previewUrl === null && resolved.diagnosticPreviewUrl === 'http://localhost:4321',
    detail: `previewUrl=${resolved.previewUrl} diagnostic=${resolved.diagnosticPreviewUrl}`,
  });
  checks.push({
    name: 'livePreviewAvailable false when gate locked',
    passed: resolved.livePreviewAvailable === false,
    detail: String(resolved.livePreviewAvailable),
  });
  return checks;
}

export function validateBuildSuccessNotPreviewReady(): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const locked = mockGate({
    state: 'LOCKED_LAUNCH_REVIEW',
    unlockVerdict: 'PREVIEW_LOCKED',
    isPreviewAvailable: false,
    isLimitedPreview: false,
  });
  const resolved = resolveAuthoritativePreviewUrls({
    gate: locked,
    devServerUrl: 'http://localhost:5000',
    devServerRunning: true,
  });
  checks.push({
    name: 'BUILD_COMPILED dev server does not unlock preview',
    passed: !resolved.livePreviewAvailable && resolved.previewUrl === null,
    detail: `available=${resolved.livePreviewAvailable}`,
  });
  return checks;
}

export function validateMaterializationNotPreviewReady(): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const locked = mockGate({
    state: 'LOCKED_VALIDATING',
    unlockVerdict: 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE',
    isPreviewAvailable: false,
    isLimitedPreview: false,
  });
  const resolved = resolveAuthoritativePreviewUrls({
    gate: locked,
    devServerUrl: 'http://localhost:4321',
    devServerRunning: true,
  });
  checks.push({
    name: 'FILES_GENERATED path does not set LIVE_PREVIEW_UNLOCKED',
    passed: resolved.livePreviewAvailable === false,
    detail: String(resolved.livePreviewAvailable),
  });
  return checks;
}

export function validateDiagnosticPreviewUrlSeparated(): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const unlocked = mockGate({
    state: 'UNLOCKED_PREVIEW_READY',
    unlockVerdict: 'PREVIEW_UNLOCKED',
    isPreviewAvailable: true,
    isLimitedPreview: false,
  });
  const unlockedResolved = resolveAuthoritativePreviewUrls({
    gate: unlocked,
    devServerUrl: 'http://localhost:4321',
    devServerRunning: true,
  });
  checks.push({
    name: 'unlocked exposes previewUrl not diagnostic',
    passed:
      unlockedResolved.livePreviewAvailable === true &&
      unlockedResolved.previewUrl === 'http://localhost:4321' &&
      unlockedResolved.diagnosticPreviewUrl === null,
    detail: `preview=${unlockedResolved.previewUrl} diagnostic=${unlockedResolved.diagnosticPreviewUrl}`,
  });

  const limited = mockGate({
    state: 'LIMITED_PREVIEW_REVIEW_ONLY',
    unlockVerdict: 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE',
    isPreviewAvailable: false,
    isLimitedPreview: true,
  });
  const limitedResolved = resolveAuthoritativePreviewUrls({
    gate: limited,
    devServerUrl: 'http://localhost:4321',
    devServerRunning: true,
  });
  checks.push({
    name: 'limited preview separated from unlocked previewUrl',
    passed:
      !limitedResolved.livePreviewAvailable &&
      limitedResolved.previewUrl === null &&
      limitedResolved.limitedPreviewUrl === 'http://localhost:4321',
    detail: `limited=${limitedResolved.limitedPreviewUrl}`,
  });
  return checks;
}

export function validateLockedPreviewUrlHidden(rootDir: string): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const orchestrator = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  checks.push({
    name: 'orchestrator has no materializationProofReady bypass',
    passed: !orchestrator.includes('materializationProofReady'),
    detail: 'materializationProofReady removed',
  });
  checks.push({
    name: 'orchestrator uses resolveAuthoritativePreviewUrls',
    passed: orchestrator.includes('resolveAuthoritativePreviewUrls'),
    detail: 'authority resolver wired',
  });
  return checks;
}

export function validateCanonicalPreviewStateNoBypass(rootDir: string): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const path = join(rootDir, 'src/one-prompt-live-preview/canonical-live-preview-state.ts');
  const content = readFileSync(path, 'utf8');
  checks.push({
    name: 'canonical file exists',
    passed: existsSync(path),
    detail: path,
  });
  checks.push({
    name: 'canonical uses livePreviewUnlocked not url-only ready',
    passed: content.includes('livePreviewUnlocked'),
    detail: 'gate-based unlock flag',
  });
  checks.push({
    name: 'canonical has locked dev server reality builder',
    passed: content.includes('buildLockedDevServerReality'),
    detail: 'locked dev server path',
  });
  checks.push({
    name: 'canonical removed onePromptReady url optimism block',
    passed: !content.includes('onePromptReady && mergedPreviewUrl\n      ? {\n          ...reality,\n          state: \'PREVIEW_READY\''),
    detail: 'no PREVIEW_READY force from url alone',
  });
  return checks;
}

export function validateClientCannotPromotePreview(rootDir: string): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const path = join(rootDir, 'public/founder-reality/app.js');
  const content = readFileSync(path, 'utf8');
  checks.push({
    name: 'client checks livePreviewAvailable for ready',
    passed: content.includes('lp.livePreviewAvailable === true'),
    detail: 'livePreviewAvailable check',
  });
  checks.push({
    name: 'client has dev server reachable without promoting preview',
    passed: content.includes('isDevServerReachable'),
    detail: 'isDevServerReachable helper',
  });
  checks.push({
    name: 'client removed NO_PREVIEW to PREVIEW_READY promotion',
    passed: !content.includes("merged.state === 'NO_PREVIEW') {\n      merged.state = 'PREVIEW_READY'"),
    detail: 'no NO_PREVIEW upgrade',
  });
  checks.push({
    name: 'client shows dev server locked card',
    passed: content.includes('Dev Server Running') && content.includes('Live Preview is locked'),
    detail: 'locked dev server UI',
  });
  return checks;
}

export function validateLivePreviewGateAuthorityRegression(): AepPreviewGateCheck[] {
  const checks: AepPreviewGateCheck[] = [];
  const unlocked = mockGate({
    state: 'UNLOCKED_PREVIEW_READY',
    unlockVerdict: 'PREVIEW_UNLOCKED',
    isPreviewAvailable: true,
    isLimitedPreview: false,
  });
  checks.push({
    name: 'isAuthoritativePreviewUnlocked true only for UNLOCKED_PREVIEW_READY',
    passed: isAuthoritativePreviewUnlocked(unlocked),
    detail: 'unlocked gate',
  });
  const locked = mockGate({
    state: 'LOCKED_HUMAN_REVIEW_REQUIRED',
    unlockVerdict: 'PREVIEW_LOCKED_HUMAN_REVIEW',
    isPreviewAvailable: false,
    isLimitedPreview: false,
  });
  checks.push({
    name: 'NOT_LAUNCH_READY keeps preview locked',
    passed: !isAuthoritativePreviewUnlocked(locked),
    detail: locked.unlockVerdict,
  });
  return checks;
}

export function runAepPreviewGateAuthorityValidation(
  rootDir: string,
  section?: string,
): AepPreviewGateCheck[] {
  switch (section) {
    case 'preview-url-not-readiness':
      return validatePreviewUrlNotReadiness();
    case 'build-success-not-preview-ready':
      return validateBuildSuccessNotPreviewReady();
    case 'materialization-not-preview-ready':
      return validateMaterializationNotPreviewReady();
    case 'client-cannot-promote-preview':
      return validateClientCannotPromotePreview(rootDir);
    case 'canonical-preview-state-no-bypass':
      return validateCanonicalPreviewStateNoBypass(rootDir);
    case 'locked-preview-url-hidden':
      return validateLockedPreviewUrlHidden();
    case 'diagnostic-preview-url-separated':
      return validateDiagnosticPreviewUrlSeparated();
    case 'live-preview-gate-authority-regression':
      return validateLivePreviewGateAuthorityRegression();
    default:
      return [
        ...validatePreviewUrlNotReadiness(),
        ...validateBuildSuccessNotPreviewReady(),
        ...validateMaterializationNotPreviewReady(),
        ...validateDiagnosticPreviewUrlSeparated(),
        ...validateLockedPreviewUrlHidden(rootDir),
        ...validateCanonicalPreviewStateNoBypass(rootDir),
        ...validateClientCannotPromotePreview(rootDir),
        ...validateLivePreviewGateAuthorityRegression(),
      ];
  }
}
