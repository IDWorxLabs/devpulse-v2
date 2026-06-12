/**
 * Connected Autonomous Build Execution Foundation — core models.
 * Plan → Build Output bridge only — no file creation or execution.
 */

import type { ExecutionPlannerAssessment } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import type { World2ChangeSetAssessment } from '../world2-change-set-authority/world2-change-set-types.js';
import type { World2ChangeSetMaterializerAssessment } from '../world2-change-set-materializer/world2-change-set-materializer-types.js';
import type { World2DryRunExecutionComposerAssessment } from '../world2-dry-run-execution-composer/world2-dry-run-execution-composer-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { World2RepositorySnapshotAssessment } from '../world2-repository-snapshot/world2-repository-snapshot-types.js';
import type { WorkspacePopulationAssessment } from '../world2-workspace-population/world2-workspace-population-types.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';

export type BuildOutputState =
  | 'BUILD_OUTPUT_PROVEN'
  | 'BUILD_OUTPUT_PARTIALLY_PROVEN'
  | 'BUILD_OUTPUT_NOT_PROVEN'
  | 'BUILD_OUTPUT_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface BuildOutputManifestEntry {
  readOnly: true;
  path: string;
  sourceAuthority: string;
  purpose: string;
}

export interface BuildOutputArtifactEntry {
  readOnly: true;
  name: string;
  path: string | null;
  category: string;
  sourceAuthority: string;
}

export interface BuildOutputManifest {
  readOnly: true;
  manifestId: string;
  workspaceId: string;
  planId: string | null;
  filesToCreate: BuildOutputManifestEntry[];
  filesToModify: BuildOutputManifestEntry[];
  directoriesToCreate: BuildOutputManifestEntry[];
  expectedArtifacts: BuildOutputArtifactEntry[];
  verificationArtifacts: BuildOutputArtifactEntry[];
  rollbackArtifacts: BuildOutputArtifactEntry[];
  proofArtifacts: BuildOutputArtifactEntry[];
  realFileMutationPerformed: false;
}

export interface BuildOutputQuestionAnswers {
  executionPlanExists: boolean;
  validChangeSetExists: boolean;
  validWorkspaceBlueprintExists: boolean;
  validArtifactManifestExists: boolean;
  outputsTraceable: boolean;
  outputsVerifiable: boolean;
  outputsReproducible: boolean;
  founderInspectable: boolean;
  buildChainComplete: boolean;
  buildOutputProven: boolean;
}

export interface ConnectedBuildExecutionInputSnapshot {
  readOnly: true;
  repairLoopAssessment: AutonomousRepairLoopAssessment;
  executionPlannerAssessment: ExecutionPlannerAssessment;
  executionEngineAssessment: World2ExecutionEngineAssessment;
  changeSetAssessment: World2ChangeSetAssessment;
  workspacePopulationAssessment: WorkspacePopulationAssessment;
  workspaceMaterializationAssessment: World2WorkspaceMaterializationAssessment;
  repositorySnapshotAssessment: World2RepositorySnapshotAssessment;
  changeSetMaterializerAssessment: World2ChangeSetMaterializerAssessment;
  dryRunComposerAssessment: World2DryRunExecutionComposerAssessment;
  missingAuthorities: string[];
}

export interface ConnectedBuildExecutionReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  connectionId: string;
  generatedAt: string;
  buildOutputScore: number;
  buildOutputState: BuildOutputState;
  outputCompleteness: number;
  proofCompleteness: number;
  missingBuildComponents: string[];
  expectedGeneratedFiles: string[];
  expectedGeneratedArtifacts: string[];
  recommendedNextActions: string[];
  questionAnswers: BuildOutputQuestionAnswers;
  buildOutputManifest: BuildOutputManifest;
  inputSnapshot: ConnectedBuildExecutionInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedBuildExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'BUILD_OUTPUT_COMPLETE' | 'BUILD_OUTPUT_FAILED';
  report: ConnectedBuildExecutionReport;
}

export interface AssessConnectedBuildExecutionInput {
  rootDir?: string;
  repairLoopAssessment?: AutonomousRepairLoopAssessment;
  executionPlannerAssessment?: ExecutionPlannerAssessment;
  dryRunComposerAssessment?: World2DryRunExecutionComposerAssessment;
}

export interface ConnectedBuildExecutionHistoryEntry {
  timestamp: string;
  connectionId: string;
  buildOutputScore: number;
  buildOutputState: BuildOutputState;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedBuildExecutionHistorySummary {
  totalAssessments: number;
  provenOutputs: number;
  partiallyProvenOutputs: number;
  notProvenOutputs: number;
  blockedOutputs: number;
  insufficientEvidenceOutputs: number;
}

export interface ConnectedBuildExecutionArtifacts {
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  connectedBuildExecutionReportMarkdown: string;
}
