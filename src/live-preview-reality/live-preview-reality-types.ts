/**
 * Live Preview Reality — founder-facing preview state model.
 * Reality over optimism: URL/container existence ≠ usable preview.
 */

import type {
  PreviewInfrastructureLevel,
  PreviewConnectivityLevel,
  PreviewUsabilityLevel,
  BuildToPreviewLevel,
  RuntimeEvidenceLevel,
  FounderRealityBottleneck,
} from './live-preview-reality-analyzer-types.js';

export {
  LIVE_PREVIEW_REALITY_PASS_TOKEN,
  LIVE_PREVIEW_REALITY_OWNER_MODULE,
} from './live-preview-reality-bounds.js';

export type LivePreviewRealityState =
  | 'NO_PREVIEW'
  | 'PREVIEW_STARTING'
  | 'PREVIEW_LOADING'
  | 'PREVIEW_VISIBLE'
  | 'PREVIEW_INTERACTIVE'
  | 'PREVIEW_STALE'
  | 'PREVIEW_DEGRADED'
  | 'PREVIEW_READY';

export interface LivePreviewSessionSignal {
  previewSessionId: string;
  projectId: string;
  previewState: string;
  previewUrl: string | null;
  previewCapabilities?: string[];
  warnings?: string[];
  blockedReasons?: string[];
  createdAt?: number;
  previewTargetName?: string;
}

export interface LivePreviewRealityInput {
  uiSurfacePresent: boolean;
  connected: boolean;
  previewUrl: string | null;
  activeSession: LivePreviewSessionSignal | null;
  sessions: LivePreviewSessionSignal[];
  diagnostics: {
    previewRuntimeActive: boolean;
    previewSessionCount: number;
    registeredTargetCount: number;
    readyPreviewCount: number;
    blockedPreviewCount: number;
  };
  latestProjectId: string | null;
  projectCount: number;
  generatedAt: number;
  clientLoaded?: boolean;
  clientLoadError?: boolean;
}

export interface LivePreviewDimensionResult {
  passed: boolean;
  reason: string;
}

export interface LivePreviewFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface LivePreviewRealityAssessment {
  state: LivePreviewRealityState;
  displayLabel: string;
  summaryLines: string[];
  problems: string[];
  recommendedActions: string[];
  availability: LivePreviewDimensionResult;
  loadReality: LivePreviewDimensionResult;
  interactivity: LivePreviewDimensionResult;
  freshness: LivePreviewDimensionResult;
  validationReady: boolean;
  validationReadyReason: string;
  operatorFeedEvents: LivePreviewFeedEvent[];
  falsePositiveReadiness: boolean;
}

export type { PreviewEvidenceLevel, FounderRealityBottleneck } from './live-preview-reality-analyzer-types.js';

export interface LivePreviewEvidence {
  id: string;
  level: 'CLAIMED' | 'OBSERVED' | 'PROVEN';
  description: string;
  source: string;
}

export interface LivePreviewStage {
  stage: 'INFRASTRUCTURE' | 'RUNTIME' | 'CONNECTIVITY' | 'USABILITY' | 'BUILDER_LINK';
  status: 'COMPLETE' | 'PARTIAL' | 'BLOCKED' | 'NOT_STARTED';
  detail: string;
}

export interface LivePreviewBlocker {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactRank: number;
  explanation: string;
  recommendation: string;
}

export interface PreviewRealityMatrixRow {
  area: string;
  claimed: 'CLAIMED' | 'OBSERVED' | 'PROVEN' | 'NONE';
  observed: 'CLAIMED' | 'OBSERVED' | 'PROVEN' | 'NONE';
  proven: 'CLAIMED' | 'OBSERVED' | 'PROVEN' | 'NONE';
}

export interface LivePreviewRealitySubscores {
  infrastructure: number;
  runtime: number;
  connectivity: number;
  usability: number;
  builderIntegration: number;
}

export interface LivePreviewAnalyzerResults {
  previewInfrastructure: PreviewInfrastructureLevel;
  runtimeEvidence: RuntimeEvidenceLevel;
  previewConnectivity: PreviewConnectivityLevel;
  previewUsability: PreviewUsabilityLevel;
  buildToPreview: BuildToPreviewLevel;
}

export interface PreviewModulePresenceEvidence {
  hasLivePreviewRuntime: boolean;
  hasPreviewGatekeeper: boolean;
  hasPreviewRealityModule: boolean;
  hasFounderRealityUi: boolean;
  hasWorkspaceSnapshot: boolean;
}

export interface PreviewWorkspaceSignals {
  executionConnected: boolean;
  connected: boolean;
  previewRuntimeActive: boolean;
  readyPreviewCount: number;
  previewSessionCount: number;
  registeredTargetCount: number;
  blockedPreviewCount: number;
  previewUrl: string | null;
  activeSessionReady: boolean;
  activeSessionProjectMatch: boolean;
  validationReady: boolean;
  loadRealityPassed: boolean;
  interactivityPassed: boolean;
  clientLoadConfirmed: boolean;
  realityState: LivePreviewRealityState;
}

export interface AssessLivePreviewRealityAuthorityInput {
  workspace: PreviewWorkspaceSignals;
  moduleEvidence: PreviewModulePresenceEvidence;
  legacyInput: LivePreviewRealityInput;
}

export interface LivePreviewReport {
  executiveSummary: string;
  previewRealityMatrix: PreviewRealityMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  previewBlockers: string[];
  founderConclusion: string;
  founderBottleneck: FounderRealityBottleneck;
  markdown: string;
}

export interface LivePreviewRealityAuthorityAssessment {
  assessmentId: string;
  livePreviewRealityScore: number;
  portfolioSubscores: LivePreviewRealitySubscores;
  analyzers: LivePreviewAnalyzerResults;
  stages: LivePreviewStage[];
  evidence: LivePreviewEvidence[];
  blockers: LivePreviewBlocker[];
  previewRealityMatrix: PreviewRealityMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  previewBlockers: string[];
  founderConclusion: string;
  founderBottleneck: FounderRealityBottleneck;
  livePreviewRealitySummary: string;
  legacyAssessment: LivePreviewRealityAssessment;
  assessedAt: number;
  report: LivePreviewReport;
}
