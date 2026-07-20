/**
 * Production Surface Integration Cleanup V1 — types.
 *
 * Integration-only milestone: every production UI/report surface declares exactly one canonical
 * authority source. No new constitutional authority — this layer wires existing authorities.
 */

import type { BuildContext, BuildOutcome, BuildStatusProjection } from '../build-context-integrity/build-context-types.js';

export const PRODUCTION_SURFACE_INTEGRATION_VERSION = '1.0.0' as const;
export const PRODUCTION_SURFACE_INTEGRATION_SOURCE = 'PRODUCTION_SURFACE_INTEGRATION_CLEANUP_V1' as const;

export type ProductionSurfaceOwnerAuthority =
  | 'BUILD_CONTEXT'
  | 'CBGA'
  | 'CONTRACT_TO_MODULE_TRACEABILITY'
  | 'BUILD_OUTCOME'
  | 'APPROVED_PRODUCTION_BUILD_ENVELOPE';

export type ProductionSurfaceCanonicalSource =
  | 'BuildContext.projectId'
  | 'Canonical Product Contract'
  | 'CBGA Approved Navigation Plan'
  | 'ApprovedProductionBuildEnvelope'
  | 'Contract-to-Module Traceability findings'
  | 'Canonical BuildOutcome'
  | 'Current BuildContext';

export interface ProductionSurfaceDeclaration {
  readonly surfaceId: string;
  readonly ownerAuthority: ProductionSurfaceOwnerAuthority;
  readonly canonicalSource: ProductionSurfaceCanonicalSource;
  readonly fingerprint: string;
  readonly allowedInputs: readonly string[];
  readonly buildContextOwned: boolean;
}

export interface ProjectIdentitySurface {
  readonly readOnly: true;
  readonly projectId: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly buildContextId: string;
  readonly source: 'BuildContext.projectId' | 'Canonical Product Contract';
  readonly fingerprint: string;
}

export interface NavigationSurfaceEntry {
  readonly navigationId: string;
  readonly label: string;
  readonly route: string;
  readonly moduleId: string | null;
  readonly source: 'CBGA_APPROVED' | 'INFRASTRUCTURE_APPROVED' | 'CAPABILITY_PACK_APPROVED';
  readonly fingerprint: string;
}

export interface NavigationSurface {
  readonly readOnly: true;
  readonly entries: readonly NavigationSurfaceEntry[];
  readonly rejectedTemplateLabels: readonly string[];
  readonly fingerprint: string;
}

export interface CanonicalProductFaithfulnessFinding {
  readonly readOnly: true;
  readonly concept: string;
  readonly firstBrokenBoundary: string;
  readonly repairEligibility: string;
  readonly regenerationStage: string | null;
  readonly requiredAction: string;
  readonly fingerprint: string;
}

export interface ProductFaithfulnessSurface {
  readonly readOnly: true;
  readonly findings: readonly CanonicalProductFaithfulnessFinding[];
  readonly source: 'Contract-to-Module Traceability findings';
  readonly duplicateStageReportsEliminated: true;
  readonly fingerprint: string;
}

export interface PreviewSurface {
  readonly readOnly: true;
  readonly buildOutcome: BuildOutcome;
  readonly buildContextId: string;
  readonly previewAvailable: boolean;
  readonly previewSummary: string;
  readonly blockedReason: string | null;
  readonly fingerprint: string;
}

export interface ProductionSurfaceIntegrationFinding {
  readonly findingId: string;
  readonly diagnosticCode: string;
  readonly severity: 'INFO' | 'WARNING' | 'BLOCKER';
  readonly surfaceId: string;
  readonly message: string;
  readonly fingerprint: string;
}

export interface ProductionSurfaceIntegrationReport {
  readonly readOnly: true;
  readonly reportId: string;
  readonly buildContext: BuildContext;
  readonly buildOutcome: BuildOutcome;
  readonly statusProjection: BuildStatusProjection;
  readonly projectIdentity: ProjectIdentitySurface;
  readonly navigation: NavigationSurface;
  readonly productFaithfulness: ProductFaithfulnessSurface;
  readonly preview: PreviewSurface;
  readonly surfaceCount: number;
  readonly findings: readonly ProductionSurfaceIntegrationFinding[];
  readonly complianceOutcome: 'SURFACE_INTEGRATION_COMPLIANT' | 'SURFACE_INTEGRATION_BLOCKED';
  readonly fingerprint: string;
}

export interface LegacySurfaceProviderHit {
  readonly providerId: string;
  readonly surfaceKind: string;
  readonly filePath: string;
  readonly pattern: string;
}
