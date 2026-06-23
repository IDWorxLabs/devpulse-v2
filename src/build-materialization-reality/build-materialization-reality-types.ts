/**
 * Build Materialization Reality — core models (Phase 26.74).
 */

import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

export type BuildMaterializationVerdict =
  | 'ARTIFACTS_NOT_GENERATED'
  | 'ARTIFACTS_GENERATED_NOT_LINKED'
  | 'WORKSPACE_NOT_LINKED'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'BUILD_MATERIALIZATION_PROVEN';

export type MaterializationGapKind = 'PRODUCT_GAP' | 'PROOF_GAP' | 'NONE';

export interface MaterializationChainStep {
  readOnly: true;
  stage: string;
  proven: boolean;
  evidence: string[];
  missingEvidence: string[];
  firstBrokenLink?: string;
}

export interface ArtifactFileReality {
  readOnly: true;
  relativePath: string;
  absolutePath: string;
  exists: boolean;
  expected: boolean;
  generated: boolean;
  linked: boolean;
  counted: boolean;
  propagated: boolean;
  sizeBytes: number;
}

export interface WorkspaceReality {
  readOnly: true;
  workspaceId: string;
  workspacePath: string;
  workspaceExists: boolean;
  workspacePopulated: boolean;
  fileCount: number;
  linkedToManifest: boolean;
  linkedToExecutionProof: boolean;
  linkedToRuntimeProof: boolean;
  structureMarkersFound: string[];
  structureMarkersMissing: string[];
  artifactFiles: readonly ArtifactFileReality[];
}

export interface ArtifactRealityScanSummary {
  readOnly: true;
  workspaceRootExists: boolean;
  workspaceCount: number;
  totalFilesObserved: number;
  totalExpectedArtifacts: number;
  totalExistingArtifacts: number;
  totalMissingArtifacts: number;
  totalLinkedArtifacts: number;
  totalPropagatedArtifacts: number;
  workspaces: readonly WorkspaceReality[];
}

export interface MaterializationVerdictAnalysis {
  readOnly: true;
  primaryVerdict: BuildMaterializationVerdict;
  gapKind: MaterializationGapKind;
  firstBrokenLink: string | null;
  firstBrokenFile: string | null;
  lostEvidenceAuthority: string | null;
  verdictReason: string;
  supportingVerdicts: BuildMaterializationVerdict[];
}

export interface BuildMaterializationFounderAnswers {
  readOnly: true;
  didGenerateBuildFiles: boolean;
  didCreateWorkspaceFiles: boolean;
  firstBrokenLink: string | null;
  firstBrokenFile: string | null;
  lostEvidenceAuthority: string | null;
  gapKind: MaterializationGapKind;
  whatMustBeFixedNext: string[];
}

export interface BuildMaterializationRealityReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  coreQuestion: string;
  contractId: string | null;
  primaryVerdict: BuildMaterializationVerdict;
  gapKind: MaterializationGapKind;
  materializationChain: readonly MaterializationChainStep[];
  artifactScan: ArtifactRealityScanSummary;
  verdictAnalysis: MaterializationVerdictAnalysis;
  connectedBuildProofLevel: string | null;
  evidencePropagationAligned: boolean;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  founderAnswers: BuildMaterializationFounderAnswers;
  cacheKey: string;
}

export interface BuildMaterializationRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'MATERIALIZATION_REALITY_COMPLETE';
  report: BuildMaterializationRealityReport;
  cacheKey: string;
}

export interface AssessBuildMaterializationRealityInput {
  rootDir?: string;
  buildReadyContract?: BuildReadyExecutionContract | null;
  connectedBuildExecutionReport?: ConnectedBuildExecutionReport | null;
  skipConnectedBuildComparison?: boolean;
  skipHistoryRecording?: boolean;
}

export interface BuildMaterializationRealityHistoryEntry {
  readOnly: true;
  assessmentId: string;
  generatedAt: string;
  primaryVerdict: BuildMaterializationVerdict;
  gapKind: MaterializationGapKind;
  firstBrokenLink: string | null;
  cacheKey: string;
}
