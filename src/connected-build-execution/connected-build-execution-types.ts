/**
 * Connected Build Execution — materialization proof models.
 * Read-only — real artifact evidence only; no synthetic execution claims.
 */

import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export type MaterializationState = 'NOT_STARTED' | 'PARTIAL' | 'MATERIALIZED';

export type BuildExecutionProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export type ArtifactEvidenceLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export interface ExpectedArtifactEntry {
  readOnly: true;
  artifactId: string;
  buildUnitId: string;
  contractId: string;
  category: 'frontend' | 'backend' | 'database' | 'configuration' | 'documentation' | 'verification' | 'auth' | 'api';
  expectedPath: string;
  layer: string;
}

export interface BuildMaterializationAssessment {
  readOnly: true;
  contractId: string;
  buildUnits: string[];
  expectedArtifacts: ExpectedArtifactEntry[];
  expectedFiles: string[];
  workspaceTargets: string[];
  executionOrder: string[];
  materializationState: MaterializationState;
}

export interface GeneratedFileEvidence {
  readOnly: true;
  proofLevel: ArtifactEvidenceLevel;
  fileCount: number;
  artifactCount: number;
  generatedPaths: string[];
  missingPaths: string[];
  confidence: number;
  byCategory: Record<string, number>;
}

export interface BuildManifestAssessment {
  readOnly: true;
  manifestExists: boolean;
  linkedArtifacts: ExpectedArtifactEntry[];
  orphanArtifacts: string[];
  missingArtifacts: string[];
  traceabilityScore: number;
}

export interface ArtifactEvidenceAssessment {
  readOnly: true;
  artifactEvidenceLevel: ArtifactEvidenceLevel;
  filesObserved: number;
  directoriesObserved: number;
  buildManifestObserved: boolean;
  workspaceEvidenceObserved: boolean;
  evidenceSummary: string;
}

export interface WorkspaceMaterializationAssessment {
  readOnly: true;
  workspaceExists: boolean;
  workspaceStructureValid: boolean;
  artifactCoverage: number;
  missingAreas: string[];
  workspacePath: string | null;
}

export interface BuildOutputLinkageAnalysis {
  readOnly: true;
  linkageConnected: boolean;
  firstBrokenLink: string | null;
  missingLinks: string[];
  traceabilityScore: number;
  contractToBuildUnits: boolean;
  buildUnitsToArtifacts: boolean;
  artifactsToFiles: boolean;
  filesToWorkspace: boolean;
}

export interface ConnectedBuildExecutionReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  proofLevel: BuildExecutionProofLevel;
  buildMaterialization: BuildMaterializationAssessment;
  generatedFileEvidence: GeneratedFileEvidence;
  buildManifest: BuildManifestAssessment;
  artifactEvidence: ArtifactEvidenceAssessment;
  workspaceMaterialization: WorkspaceMaterializationAssessment;
  linkageAnalysis: BuildOutputLinkageAnalysis;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  founderQuestions: ConnectedBuildFounderQuestions;
  cacheKey: string;
}

export interface ConnectedBuildFounderQuestions {
  readOnly: true;
  canProveGeneratedArtifacts: boolean;
  canProveWorkspaceCreation: boolean;
  canProveBuildMaterialization: boolean;
  exactMissingBuildEvidence: string[];
  whatShouldBeBuiltNext: string[];
}

export interface ConnectedBuildExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'BUILD_EXECUTION_COMPLETE' | 'BUILD_EXECUTION_FAILED';
  report: ConnectedBuildExecutionReport;
}

export interface ObservedFileEvidence {
  paths: string[];
  directories: string[];
}

export interface AssessConnectedBuildExecutionInput {
  rootDir?: string;
  buildReadyContract?: BuildReadyExecutionContract | null;
  /** Inject observed paths for bounded validation fixtures. */
  observedEvidence?: ObservedFileEvidence;
}

export interface ConnectedBuildExecutionHistoryEntry {
  timestamp: string;
  assessmentId: string;
  proofLevel: BuildExecutionProofLevel;
  linkageConnected: boolean;
  materializationState: MaterializationState;
}

export interface ConnectedBuildExecutionHistorySummary {
  totalAssessments: number;
  provenBuilds: number;
  partialBuilds: number;
  notProvenBuilds: number;
}

export interface ConnectedBuildExecutionArtifacts {
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  connectedBuildExecutionReportMarkdown: string;
}
