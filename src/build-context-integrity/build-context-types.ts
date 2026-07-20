/**
 * Production Build Context and Surface Integrity Authority V1 — types.
 */

export const PRODUCTION_BUILD_CONTEXT_INTEGRITY_VERSION = '1.0.0' as const;
export const PRODUCTION_BUILD_CONTEXT_INTEGRITY_SOURCE = 'PRODUCTION_BUILD_CONTEXT_AND_SURFACE_INTEGRITY_AUTHORITY_V1' as const;

export type BuildOutcome =
  | 'BUILD_SUCCEEDED'
  | 'BUILD_BLOCKED_TRACEABILITY'
  | 'BUILD_BLOCKED_GPCA'
  | 'BUILD_BLOCKED_PRODUCT_FAITHFULNESS'
  | 'BUILD_BLOCKED_RUNTIME'
  | 'BUILD_BLOCKED_PREVIEW'
  | 'BUILD_REQUIRES_REGENERATION'
  | 'BUILD_REQUIRES_NEW_CAPABILITY'
  | 'BUILD_REQUIRES_HUMAN_DECISION'
  | 'BUILD_FAILED';

export interface BuildContext {
  readonly buildContextId: string;
  readonly buildId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly canonicalProductContractFingerprint: string;
  readonly approvedEnvelopeFingerprint: string;
  readonly cbgaFingerprint: string;
  readonly compositionFingerprint: string;
  readonly materializationFingerprint: string;
  readonly runtimeFingerprint: string;
  readonly previewFingerprint: string;
  readonly traceabilityFingerprint: string;
  readonly engineeringFingerprint: string;
  readonly createdAt: string;
  readonly fingerprint: string;
  readonly immutable: true;
}

export type BuildContextArtifactKind =
  | 'PROJECT_IDENTITY'
  | 'WORKSPACE_MANIFEST'
  | 'NAVIGATION_ENTRY'
  | 'ROUTE'
  | 'RUNTIME_REGISTRATION'
  | 'PREVIEW_DOM'
  | 'ENGINEERING_REPORT'
  | 'PRODUCT_FAITHFULNESS_EVIDENCE'
  | 'TRACEABILITY_EVIDENCE'
  | 'GENERATED_FILE';

export interface BuildContextArtifact {
  readonly artifactId: string;
  readonly artifactKind: BuildContextArtifactKind;
  readonly displayName?: string | null;
  readonly route?: string | null;
  readonly buildContextId: string;
  readonly approvedEnvelopeFingerprint: string;
  readonly sourceAuthority: string;
  readonly fingerprint: string;
}

export interface InfrastructureNavigationRegistration {
  readonly navigationId: string;
  readonly label: string;
  readonly ownerAuthority: string;
  readonly purpose: string;
  readonly allowedVisibility: 'INFRASTRUCTURE_ONLY' | 'SUPPORT_SURFACE';
  readonly approvedCapability: string;
  readonly fingerprint: string;
}

export interface BuildContextNavigationEntry {
  readonly navigationId: string;
  readonly label: string;
  readonly route: string;
  readonly moduleId: string | null;
  readonly source: 'CBGA_APPROVED' | 'INFRASTRUCTURE_APPROVED' | 'CAPABILITY_PACK_APPROVED' | 'UNAPPROVED';
  readonly buildContextId: string;
  readonly fingerprint: string;
}

export type BuildContextFindingSeverity = 'INFO' | 'WARNING' | 'BLOCKER';

export interface BuildContextIntegrityFinding {
  readonly findingId: string;
  readonly diagnosticCode: string;
  readonly severity: BuildContextFindingSeverity;
  readonly expectedBuildContextId: string;
  readonly observedBuildContextIds: readonly string[];
  readonly artifactIds: readonly string[];
  readonly message: string;
  readonly fingerprint: string;
}

export interface BuildContextIntegrityReport {
  readonly reportId: string;
  readonly buildContext: BuildContext;
  readonly findings: readonly BuildContextIntegrityFinding[];
  readonly navigationEntries: readonly BuildContextNavigationEntry[];
  readonly artifactCount: number;
  readonly complianceOutcome: 'BUILD_CONTEXT_COMPLIANT' | 'BUILD_CONTEXT_BLOCKED';
  readonly buildOutcome: BuildOutcome;
  readonly fingerprint: string;
  readonly readOnly: true;
}

export interface BuildStatusProjection {
  readonly buildOutcome: BuildOutcome;
  readonly executionStatus: 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'IN_PROGRESS';
  readonly currentStage: string;
  readonly heartbeat: string;
  readonly nextStep: string;
  readonly previewAvailable: boolean;
  readonly completionWording: string;
  readonly retryWording: string;
  readonly successBanner: string | null;
  readonly engineeringSummary: string;
}
