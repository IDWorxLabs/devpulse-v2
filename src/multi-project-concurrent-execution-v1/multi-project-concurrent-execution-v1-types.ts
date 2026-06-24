/**
 * Multi-Project Concurrent Execution V1 — types.
 */

import type { CloudExecutionJobResult } from '../cloud-execution-path-v1/cloud-execution-path-v1-types.js';
import type { World2Instance } from '../world2-real-instantiation-v1/world2-real-instantiation-v1-types.js';

export type ConcurrentJobStatus =
  | 'QUEUED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ConcurrentFailureClass =
  | 'Build Failure'
  | 'Preview Failure'
  | 'Verification Failure'
  | 'Queue Failure'
  | 'Resource Failure'
  | 'Isolation Failure'
  | 'Authority Failure';

export interface ConcurrentExecutionJob {
  readOnly: true;
  jobId: string;
  projectId: string;
  profile: string;
  productName: string;
  worldId: string;
  status: ConcurrentJobStatus;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  workerId: string | null;
}

export interface ConcurrentQueueSnapshot {
  readOnly: true;
  queued: number;
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
  jobs: readonly ConcurrentExecutionJob[];
}

export interface ResourceAllocationRecord {
  readOnly: true;
  workerId: string;
  projectId: string;
  cpuBudgetPercent: number;
  memoryBudgetMb: number;
  previewSlot: boolean;
  worldSlot: boolean;
  allocatedAt: string;
}

export interface ResourceAllocationSnapshot {
  readOnly: true;
  generatedAt: string;
  totalWorkers: number;
  allocations: readonly ResourceAllocationRecord[];
  noStarvation: boolean;
  noDeadlocks: boolean;
  noOrphanJobs: boolean;
}

export interface ConcurrentBuildProofEntry {
  readOnly: true;
  projectId: string;
  profile: string;
  productName: string;
  buildStartedAt: string;
  buildCompletedAt: string;
  previewStartedAt: string;
  previewCompletedAt: string;
  verificationCompletedAt: string;
  buildProof: boolean;
  previewProof: boolean;
  verificationProof: boolean;
}

export interface ConcurrentBuildProof {
  readOnly: true;
  generatedAt: string;
  entries: readonly ConcurrentBuildProofEntry[];
  allBuildProofComplete: boolean;
}

export interface ConcurrentContaminationAssessment {
  readOnly: true;
  generatedAt: string;
  workspaceOverlap: boolean;
  artifactOverwrite: boolean;
  sharedBuildOutput: boolean;
  crossProjectProofLeakage: boolean;
  queueCorruption: boolean;
  authorityContamination: boolean;
  contaminationIncidents: number;
  violations: readonly string[];
  passed: boolean;
}

export interface ConcurrentFailureRecord {
  readOnly: true;
  projectId: string;
  profile: string;
  failureClass: ConcurrentFailureClass;
  detail: string;
}

export interface ConcurrentFailureClassification {
  readOnly: true;
  generatedAt: string;
  failures: readonly ConcurrentFailureRecord[];
  totalFailures: number;
}

export interface ConcurrentVerificationAssessment {
  readOnly: true;
  generatedAt: string;
  projectsTotal: number;
  buildSuccessRate: number;
  previewSuccessRate: number;
  verificationSuccessRate: number;
  productionReadinessRate: number;
  concurrentPassRate: number;
}

export interface ConcurrentProjectResult {
  readOnly: true;
  projectId: string;
  profile: string;
  productName: string;
  worldId: string;
  passed: boolean;
  buildProof: boolean;
  previewProof: boolean;
  verificationProof: boolean;
  productionReadinessScore: number | null;
  contaminationCheckPassed: boolean;
  executionResult: CloudExecutionJobResult | null;
  world: World2Instance;
}

export interface World2ConcurrentResult {
  readOnly: true;
  worldId: string;
  profile: string;
  productName: string;
  passed: boolean;
  isolationPassed: boolean;
}

export interface ConcurrentEvolutionBoundary {
  readOnly: true;
  selfEvolutionObservedOnly: true;
  runningProjectsModified: false;
  boundaryEnforced: boolean;
  detail: string;
}

export interface MultiProjectConcurrentExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Multi-Project Concurrent Execution V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  concurrentProjectsProven: number;
  concurrentPassRate: number;
  contaminationIncidents: number;
  concurrentWorld2Executions: number;
  concurrentProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  queueSnapshot: ConcurrentQueueSnapshot;
  resourceAllocation: ResourceAllocationSnapshot;
  contaminationAssessment: ConcurrentContaminationAssessment;
  buildProof: ConcurrentBuildProof;
  verificationAssessment: ConcurrentVerificationAssessment;
  failureClassification: ConcurrentFailureClassification;
  world2ConcurrentResults: readonly World2ConcurrentResult[];
  projectResults: readonly ConcurrentProjectResult[];
  evolutionBoundary: ConcurrentEvolutionBoundary;
}
