/**
 * Live Preview Reality — analyzer level types (Phase 24A.2).
 */

export type PreviewInfrastructureLevel =
  | 'PREVIEW_INFRASTRUCTURE_PRESENT'
  | 'PREVIEW_INFRASTRUCTURE_PARTIAL'
  | 'PREVIEW_INFRASTRUCTURE_MISSING';

export type RuntimeEvidenceLevel = 'RUNTIME_CLAIMED' | 'RUNTIME_OBSERVED' | 'RUNTIME_PROVEN';

export type PreviewConnectivityLevel = 'PREVIEW_CONNECTED' | 'PREVIEW_PARTIAL' | 'PREVIEW_DISCONNECTED';

export type PreviewUsabilityLevel = 'PREVIEW_USABLE' | 'PREVIEW_LIMITED' | 'PREVIEW_UNPROVEN';

export type BuildToPreviewLevel =
  | 'BUILD_TO_PREVIEW_PROVEN'
  | 'BUILD_TO_PREVIEW_PARTIAL'
  | 'BUILD_TO_PREVIEW_MISSING';

export type PreviewEvidenceLevel = 'CLAIMED' | 'OBSERVED' | 'PROVEN';

export type FounderRealityBottleneck = 'BUILD' | 'PREVIEW' | 'NONE';
