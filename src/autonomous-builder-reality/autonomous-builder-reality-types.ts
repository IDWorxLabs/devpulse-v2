/**
 * Autonomous Builder Reality — types.
 */

export type PlanningRealityLevel = 'PLANNING_AVAILABLE' | 'PLANNING_PARTIAL' | 'PLANNING_MISSING';

export type FileGenerationRealityLevel =
  | 'FILE_GENERATION_PROVEN'
  | 'FILE_GENERATION_PARTIAL'
  | 'FILE_GENERATION_UNPROVEN';

export type BuildCapabilityLevel =
  | 'BUILD_CAPABILITY_CLAIMED'
  | 'BUILD_CAPABILITY_OBSERVED'
  | 'BUILD_CAPABILITY_PROVEN';

export type ValidationRealityLevel = 'VALIDATION_PROVEN' | 'VALIDATION_PARTIAL' | 'VALIDATION_MISSING';

export type AutonomousCompletionLevel = 'AUTONOMOUS_COMPLETE' | 'AUTONOMOUS_PARTIAL' | 'AUTONOMOUS_BLOCKED';

export type EvidenceLevel = 'CLAIMED' | 'OBSERVED' | 'PROVEN';

export interface BuilderExecutionEvidence {
  id: string;
  category: string;
  description: string;
  level: EvidenceLevel;
  source: string;
}

export interface BuilderExecutionStage {
  stage: 'REQUIREMENT' | 'PLAN' | 'BUILD' | 'VALIDATE';
  status: 'COMPLETE' | 'PARTIAL' | 'BLOCKED' | 'NOT_STARTED';
  detail: string;
}

export interface BuilderExecutionBlocker {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactRank: number;
  explanation: string;
  recommendation: string;
}

export interface CapabilityMatrixRow {
  capability: string;
  claimed: EvidenceLevel | 'NONE';
  observed: EvidenceLevel | 'NONE';
  proven: EvidenceLevel | 'NONE';
}

export interface BuilderRealitySubscores {
  planning: number;
  fileCreation: number;
  codeGeneration: number;
  buildExecution: number;
  validation: number;
  completion: number;
}

export interface BuilderAnalyzerResults {
  planningReality: PlanningRealityLevel;
  fileGenerationReality: FileGenerationRealityLevel;
  buildCapabilityLevel: BuildCapabilityLevel;
  validationReality: ValidationRealityLevel;
  autonomousCompletion: AutonomousCompletionLevel;
  executionStages: BuilderExecutionStage[];
  stopPoint: string | null;
}

export interface BuilderExecutionReport {
  executiveSummary: string;
  capabilityMatrix: CapabilityMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  builderBottlenecks: string[];
  founderConclusion: string;
  markdown: string;
}

export interface AutonomousBuilderRealityAssessment {
  builderRealityScore: number;
  portfolioSubscores: BuilderRealitySubscores;
  analyzers: BuilderAnalyzerResults;
  evidence: BuilderExecutionEvidence[];
  blockers: BuilderExecutionBlocker[];
  capabilityMatrix: CapabilityMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  builderBottlenecks: string[];
  founderConclusion: string;
  builderRealitySummary: string;
  autonomousBuilderRealityPass: boolean;
  report: BuilderExecutionReport;
  assessedAt: number;
}

export interface ModulePresenceEvidence {
  hasRequirementExtractor: boolean;
  hasCapabilityPlanning: boolean;
  hasBuildPackageGenerator: boolean;
  hasBuildTaskRuntime: boolean;
  hasCodeGenerationRuntime: boolean;
  hasWorld2ControlledApply: boolean;
  hasAutonomousBuilderFoundation: boolean;
  hasExecutionRuntime: boolean;
  hasControlledBuilderExecutionEngine: boolean;
  validatorScriptCount: number;
}

export interface WorkspaceBuilderSignals {
  world2FoundationComplete: boolean;
  executionConnected: boolean;
  readiness: 'foundation' | 'partial' | 'active';
  readinessLabel: string;
  livePreviewConnected: boolean;
}

export interface AssessAutonomousBuilderRealityInput {
  workspace: WorkspaceBuilderSignals;
  moduleEvidence: ModulePresenceEvidence;
}

export interface BuilderRealityRegistryEntry {
  assessmentId: string;
  builderRealityScore: number;
  autonomousCompletion: AutonomousCompletionLevel;
  assessedAt: number;
}

export interface BuilderRealityHistoryEntry {
  historyId: string;
  assessmentId: string;
  builderRealityScore: number;
  summary: string;
  recordedAt: number;
}
