/**
 * World2 Real Instantiation V1 — types.
 */

import type { CloudExecutionMode, CloudExecutionJobResult } from '../cloud-execution-path-v1/cloud-execution-path-v1-types.js';

export type World2InstanceStatus =
  | 'CREATED'
  | 'MATERIALIZED'
  | 'BUILDING'
  | 'RUNNING'
  | 'VERIFYING'
  | 'REVIEWING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DESTROYED'
  | 'PROMOTED';

export type World2PromotionState = 'NOT_ELIGIBLE' | 'ELIGIBLE' | 'PROMOTED' | 'DENIED';

export type World2RuntimeState = 'IDLE' | 'ACTIVE' | 'ARCHIVED';

export interface World2Instance {
  readOnly: true;
  worldId: string;
  createdAt: string;
  status: World2InstanceStatus;
  executionMode: CloudExecutionMode;
  workspacePath: string;
  sourceProject: string;
  instantiatedBy: string;
  artifactDirectory: string;
  runtimeState: World2RuntimeState;
  promotionState: World2PromotionState;
  profile: string;
  productName: string;
  prompt: string;
  jobId: string;
  completedAt: string | null;
  destroyedAt: string | null;
  promotedAt: string | null;
  executionResult: CloudExecutionJobResult | null;
  world2VerificationProof: World2VerificationProof | null;
  world2ProductAssessment: World2ProductAssessment | null;
}

export interface World2VerificationProof {
  readOnly: true;
  profile: string;
  verificationCoveragePercent: number;
  verificationConfidenceScore: number;
  verified: boolean;
  source: 'UVL Verification Execution V1';
}

export interface World2ProductAssessment {
  readOnly: true;
  profile: string;
  productReadinessScore: number;
  reviewed: boolean;
  source: 'Product Architect Intelligence V1';
}

export interface WorldIsolationProof {
  readOnly: true;
  generatedAt: string;
  workspaceSeparation: boolean;
  artifactSeparation: boolean;
  buildSeparation: boolean;
  previewSeparation: boolean;
  executionSeparation: boolean;
  world1Protected: boolean;
  contaminationIncidents: number;
  violations: readonly string[];
  world1SentinelHashes: Record<string, string>;
}

export interface World2RegistrySnapshot {
  readOnly: true;
  generatedAt: string;
  activeWorlds: readonly World2Instance[];
  completedWorlds: readonly World2Instance[];
  destroyedWorlds: readonly World2Instance[];
  promotedWorlds: readonly World2Instance[];
  totalWorlds: number;
}

export interface World2PromotionProof {
  readOnly: true;
  worldId: string;
  promotedAt: string;
  operatorApproval: boolean;
  verificationProven: boolean;
  aflaVerdict: string | null;
  productionReadinessScore: number | null;
  productionReadinessVerdict: string | null;
  promotionExplicit: boolean;
}

export interface World2DestructionProof {
  readOnly: true;
  worldId: string;
  destroyedAt: string;
  workspaceRemoved: boolean;
  artifactsArchived: boolean;
  registryUpdated: boolean;
}

export interface World2MultiWorldResult {
  readOnly: true;
  worldId: string;
  profile: string;
  productName: string;
  executionMode: CloudExecutionMode;
  passed: boolean;
  buildProof: boolean;
  previewProof: boolean;
  verificationProof: boolean;
  isolationPassed: boolean;
}

export interface World2RealInstantiationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'World2 Real Instantiation V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  worldsInstantiated: number;
  worldsExecuted: number;
  worldsCompleted: number;
  worldsFailed: number;
  worldsPromoted: number;
  worldsDestroyed: number;
  contaminationIncidents: number;
  world1Protected: boolean;
  instantiationProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  registry: World2RegistrySnapshot;
  isolationProof: WorldIsolationProof;
  promotionProofs: readonly World2PromotionProof[];
  destructionProofs: readonly World2DestructionProof[];
  multiWorldResults: readonly World2MultiWorldResult[];
  executionSummary: {
    readOnly: true;
    materialization: number;
    build: number;
    preview: number;
    verification: number;
    productArchitect: number;
    afla: number;
    productionReadiness: number;
  };
}
