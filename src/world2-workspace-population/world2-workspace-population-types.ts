/**
 * World 2 Workspace Population — core models.
 * Population requirements only — no workspace creation or file copy.
 */

import type { ExecutionPlan } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type {
  AssessWorld2ChangeSetAuthorityInput,
  World2ChangeSetAssessment,
} from '../world2-change-set-authority/world2-change-set-types.js';
import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';

export type World2PopulationCategory =
  | 'PROJECT_STRUCTURE'
  | 'PROJECT_FILES'
  | 'REQUIREMENTS'
  | 'ARCHITECTURE'
  | 'EXECUTION_CONTEXT'
  | 'VALIDATION_CONTEXT'
  | 'ROLLBACK_CONTEXT';

export type World2PopulationReadinessState =
  | 'READY'
  | 'READY_WITH_WARNINGS'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface World2PopulationArtifact {
  readOnly: true;
  artifactId: string;
  category: World2PopulationCategory;
  name: string;
  path: string | null;
  required: boolean;
  present: boolean;
}

export interface World2WorkspacePopulationContract {
  readOnly: true;
  contractId: string;
  workspaceId: string;
  requiredArtifacts: string[];
  requiredDirectories: string[];
  requiredFiles: string[];
  requiredValidationAssets: string[];
  requiredRollbackAssets: string[];
  requiredMetadata: string[];
}

export interface World2PopulationInputSnapshot {
  disposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  changeSetAssessment: World2ChangeSetAssessment;
  founderTestAssessment: FounderTestAssessment | null;
  plan: ExecutionPlan | null;
  missingAuthorities: string[];
}

export interface WorkspacePopulationAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  populationId: string;
  workspaceId: string;
  readinessState: World2PopulationReadinessState;
  inputSnapshot: World2PopulationInputSnapshot;
  requiredArtifacts: World2PopulationArtifact[];
  requiredDirectories: string[];
  requiredFiles: string[];
  requiredRequirements: string[];
  requiredValidationAssets: string[];
  requiredRollbackAssets: string[];
  missingArtifacts: World2PopulationArtifact[];
  populationReadiness: number;
  populationContract: World2WorkspacePopulationContract | null;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2WorkspacePopulationReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: WorkspacePopulationAssessment;
  passToken: string;
}

export interface AssessWorld2WorkspacePopulationInput extends AssessWorld2ChangeSetAuthorityInput {
  changeSetAssessment?: World2ChangeSetAssessment;
  founderTestAssessment?: FounderTestAssessment;
}

export interface World2WorkspacePopulationHistorySummary {
  totalAssessments: number;
  readyPopulations: number;
  warningPopulations: number;
  blockedPopulations: number;
  insufficientEvidencePopulations: number;
}
