/**
 * Live Preview Reality — founder-facing preview state model.
 * Reality over optimism: URL/container existence ≠ usable preview.
 */

export const LIVE_PREVIEW_REALITY_PASS_TOKEN = 'LIVE_PREVIEW_REALITY_PASS';
export const LIVE_PREVIEW_REALITY_OWNER_MODULE = 'aidevengine_live_preview_reality';

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
