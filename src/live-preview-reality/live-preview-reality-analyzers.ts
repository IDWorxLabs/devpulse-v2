/**
 * Live Preview Reality — read-only analyzers (Phase 24A.2).
 * URL / route / panel / HTML alone are never proof.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AssessLivePreviewRealityAuthorityInput,
  LivePreviewAnalyzerResults,
  LivePreviewEvidence,
  LivePreviewRealityInput,
  PreviewModulePresenceEvidence,
} from './live-preview-reality-types.js';
import type {
  BuildToPreviewLevel,
  PreviewConnectivityLevel,
  PreviewInfrastructureLevel,
  PreviewUsabilityLevel,
  RuntimeEvidenceLevel,
} from './live-preview-reality-analyzer-types.js';

export function detectPreviewModulePresenceEvidence(rootDir: string): PreviewModulePresenceEvidence {
  const pathExists = (rel: string) => existsSync(join(rootDir, rel));
  return {
    hasLivePreviewRuntime: pathExists('src/live-preview-runtime/index.ts'),
    hasPreviewGatekeeper: pathExists('src/product-reality-verification/live-preview-gatekeeper/index.ts'),
    hasPreviewRealityModule: pathExists('src/live-preview-reality/index.ts'),
    hasFounderRealityUi: pathExists('public/founder-reality/app.js'),
    hasWorkspaceSnapshot: pathExists('server/product-workspace-snapshot.ts'),
  };
}

export function analyzePreviewInfrastructure(
  input: AssessLivePreviewRealityAuthorityInput,
): PreviewInfrastructureLevel {
  const { moduleEvidence } = input;
  const infraSignals = [
    moduleEvidence.hasLivePreviewRuntime,
    moduleEvidence.hasPreviewGatekeeper,
    moduleEvidence.hasPreviewRealityModule,
    moduleEvidence.hasWorkspaceSnapshot,
  ];
  const count = infraSignals.filter(Boolean).length;
  if (count >= 4 && moduleEvidence.hasFounderRealityUi) return 'PREVIEW_INFRASTRUCTURE_PRESENT';
  if (count >= 2) return 'PREVIEW_INFRASTRUCTURE_PARTIAL';
  return 'PREVIEW_INFRASTRUCTURE_MISSING';
}

export function analyzeRuntimeEvidence(input: AssessLivePreviewRealityAuthorityInput): RuntimeEvidenceLevel {
  const { workspace, legacyInput } = input;
  const runtimeProven =
    workspace.previewRuntimeActive &&
    workspace.readyPreviewCount > 0 &&
    workspace.validationReady &&
    workspace.loadRealityPassed &&
    workspace.interactivityPassed &&
    !legacyInput.clientLoadError;

  if (runtimeProven) return 'RUNTIME_PROVEN';

  const runtimeObserved =
    workspace.previewRuntimeActive ||
    workspace.readyPreviewCount > 0 ||
    workspace.connected ||
    legacyInput.diagnostics.registeredTargetCount > 0;

  if (runtimeObserved) return 'RUNTIME_OBSERVED';

  return 'RUNTIME_CLAIMED';
}

export function analyzePreviewConnectivity(input: AssessLivePreviewRealityAuthorityInput): PreviewConnectivityLevel {
  const { workspace, legacyInput } = input;
  const urlOnly = Boolean(workspace.previewUrl) && !workspace.activeSessionReady;
  if (urlOnly) return 'PREVIEW_PARTIAL';

  const connected =
    workspace.activeSessionReady &&
    workspace.activeSessionProjectMatch &&
    workspace.connected &&
    workspace.loadRealityPassed &&
    !legacyInput.clientLoadError;

  if (connected) return 'PREVIEW_CONNECTED';

  if (
    workspace.connected ||
    workspace.previewSessionCount > 0 ||
    Boolean(workspace.previewUrl) ||
    legacyInput.sessions.length > 0
  ) {
    return 'PREVIEW_PARTIAL';
  }

  return 'PREVIEW_DISCONNECTED';
}

export function analyzePreviewUsability(input: AssessLivePreviewRealityAuthorityInput): PreviewUsabilityLevel {
  const { workspace, legacyInput } = input;

  if (
    workspace.validationReady &&
    workspace.loadRealityPassed &&
    workspace.interactivityPassed &&
    workspace.activeSessionProjectMatch &&
    !legacyInput.clientLoadError
  ) {
    return 'PREVIEW_USABLE';
  }

  if (workspace.loadRealityPassed || workspace.interactivityPassed || workspace.realityState === 'PREVIEW_VISIBLE') {
    return 'PREVIEW_LIMITED';
  }

  return 'PREVIEW_UNPROVEN';
}

export function analyzeBuildToPreview(input: AssessLivePreviewRealityAuthorityInput): BuildToPreviewLevel {
  const runtime = analyzeRuntimeEvidence(input);
  const { workspace } = input;

  if (workspace.executionConnected && runtime === 'RUNTIME_PROVEN' && workspace.activeSessionProjectMatch) {
    return 'BUILD_TO_PREVIEW_PROVEN';
  }

  if (runtime === 'RUNTIME_OBSERVED' || workspace.connected || workspace.readyPreviewCount > 0) {
    return 'BUILD_TO_PREVIEW_PARTIAL';
  }

  return 'BUILD_TO_PREVIEW_MISSING';
}

export function runAllLivePreviewRealityAnalyzers(
  input: AssessLivePreviewRealityAuthorityInput,
): LivePreviewAnalyzerResults {
  return {
    previewInfrastructure: analyzePreviewInfrastructure(input),
    runtimeEvidence: analyzeRuntimeEvidence(input),
    previewConnectivity: analyzePreviewConnectivity(input),
    previewUsability: analyzePreviewUsability(input),
    buildToPreview: analyzeBuildToPreview(input),
  };
}

export function collectLivePreviewEvidence(input: AssessLivePreviewRealityAuthorityInput): LivePreviewEvidence[] {
  const { workspace, moduleEvidence, legacyInput } = input;
  const evidence: LivePreviewEvidence[] = [];
  let counter = 0;

  const push = (level: LivePreviewEvidence['level'], description: string, source: string) => {
    counter += 1;
    evidence.push({ id: `preview-evidence-${counter}`, level, description, source });
  };

  if (moduleEvidence.hasLivePreviewRuntime) {
    push('OBSERVED', 'Live preview runtime module present', 'src/live-preview-runtime');
  }
  if (moduleEvidence.hasPreviewGatekeeper) {
    push('OBSERVED', 'Preview gatekeeper module present', 'live-preview-gatekeeper');
  }
  if (workspace.previewRuntimeActive) {
    push('OBSERVED', 'Preview runtime active signal in workspace diagnostics', 'workspace.diagnostics');
  }
  if (workspace.readyPreviewCount > 0) {
    push('OBSERVED', `Ready preview sessions reported (${workspace.readyPreviewCount})`, 'workspace.diagnostics');
  }
  if (workspace.connected) {
    push('OBSERVED', 'Preview runtime connection signal', 'workspace.livePreview.connected');
  }
  if (legacyInput.uiSurfacePresent) {
    push('CLAIMED', 'Live Preview UI surface exists — not proof of running application', 'founder-reality-ui');
  }
  if (workspace.previewUrl) {
    push('CLAIMED', 'Preview URL assigned — URL alone is not proof of running application', 'workspace.previewUrl');
  }
  if (workspace.validationReady && workspace.loadRealityPassed && workspace.interactivityPassed) {
    push('PROVEN', 'Validation-ready preview with load and interactivity evidence', 'live-preview-reality-authority');
  }
  if (workspace.executionConnected) {
    push('OBSERVED', 'Builder execution connected signal', 'workspace.autonomousBuilder');
  }
  if (workspace.clientLoadConfirmed && !legacyInput.clientLoadError) {
    push('OBSERVED', 'Client iframe load confirmation signal', 'previewClientReality');
  }

  return evidence;
}

export function buildPreviewWorkspaceSignalsFromLegacy(
  legacyInput: LivePreviewRealityInput,
  executionConnected: boolean,
  legacyAssessment: { validationReady: boolean; loadReality: { passed: boolean }; interactivity: { passed: boolean }; state: string },
): AssessLivePreviewRealityAuthorityInput['workspace'] {
  const active = legacyInput.activeSession;
  const activeSessionReady = active?.previewState === 'PREVIEW_READY';
  const activeSessionProjectMatch =
    !legacyInput.latestProjectId || !active?.projectId || active.projectId === legacyInput.latestProjectId;

  return {
    executionConnected,
    connected: legacyInput.connected,
    previewRuntimeActive: legacyInput.diagnostics.previewRuntimeActive,
    readyPreviewCount: legacyInput.diagnostics.readyPreviewCount,
    previewSessionCount: legacyInput.diagnostics.previewSessionCount,
    registeredTargetCount: legacyInput.diagnostics.registeredTargetCount,
    blockedPreviewCount: legacyInput.diagnostics.blockedPreviewCount,
    previewUrl: legacyInput.previewUrl,
    activeSessionReady,
    activeSessionProjectMatch,
    validationReady: legacyAssessment.validationReady,
    loadRealityPassed: legacyAssessment.loadReality.passed,
    interactivityPassed: legacyAssessment.interactivity.passed,
    clientLoadConfirmed: legacyInput.clientLoaded === true,
    realityState: legacyAssessment.state as AssessLivePreviewRealityAuthorityInput['workspace']['realityState'],
  };
}

export function readRealityRulesFromAuthoritySource(rootDir: string): string {
  const authorityPath = join(rootDir, 'src/live-preview-reality/live-preview-reality-evidence-authority.ts');
  if (!existsSync(authorityPath)) return '';
  return readFileSync(authorityPath, 'utf8');
}
