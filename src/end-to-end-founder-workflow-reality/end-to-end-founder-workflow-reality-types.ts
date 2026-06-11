/**
 * End-to-End Founder Workflow Reality — types (Phase 24A.4).
 */

import type {
  FounderExperienceLevel,
  FounderWorkflowStageId,
  LaunchReadinessRealityLevel,
  StageEvidenceLevel,
  WorkflowContinuityLevel,
  WorkflowEvidenceLevel,
  WorkflowTransitionResult,
  WorkflowTruthMapLabel,
} from './end-to-end-founder-workflow-reality-analyzer-types.js';

export {
  END_TO_END_FOUNDER_WORKFLOW_REALITY_PASS_TOKEN,
  END_TO_END_FOUNDER_WORKFLOW_REALITY_OWNER_MODULE,
} from './end-to-end-founder-workflow-reality-bounds.js';

export type {
  FounderExperienceLevel,
  FounderWorkflowStageId,
  LaunchReadinessRealityLevel,
  StageEvidenceLevel,
  WorkflowContinuityLevel,
  WorkflowEvidenceLevel,
  WorkflowTransitionResult,
  WorkflowTruthMapLabel,
} from './end-to-end-founder-workflow-reality-analyzer-types.js';

export interface FounderWorkflowEvidence {
  id: string;
  level: WorkflowEvidenceLevel;
  description: string;
  source: string;
}

export interface FounderWorkflowStage {
  stage: FounderWorkflowStageId;
  status: StageEvidenceLevel;
  truthLabel: WorkflowTruthMapLabel;
  detail: string;
}

export interface FounderWorkflowBlocker {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactRank: number;
  stage: FounderWorkflowStageId;
  explanation: string;
  recommendation: string;
}

export interface FounderWorkflowMatrixRow {
  stage: FounderWorkflowStageId;
  claimed: WorkflowEvidenceLevel | 'NONE';
  observed: WorkflowEvidenceLevel | 'NONE';
  proven: WorkflowEvidenceLevel | 'NONE';
}

export interface WorkflowContinuityTransition {
  from: FounderWorkflowStageId;
  to: FounderWorkflowStageId;
  result: WorkflowTransitionResult;
  detail: string;
}

export interface FounderWorkflowSubscores {
  ideaCapture: number;
  planning: number;
  architecture: number;
  taskBreakdown: number;
  build: number;
  runtime: number;
  preview: number;
  verification: number;
  launchReadiness: number;
}

export interface FounderBottleneckAnalysis {
  primary: FounderWorkflowStageId;
  secondary: FounderWorkflowStageId;
  future: FounderWorkflowStageId;
  continuityBreakPoint: FounderWorkflowStageId;
}

export interface FounderExperienceAnalysis {
  level: FounderExperienceLevel;
  firstBlocker: FounderWorkflowStageId;
  highestImpactBlocker: FounderWorkflowStageId;
  finalReachableStage: FounderWorkflowStageId;
}

export interface FounderWorkflowAnalyzerResults {
  stages: FounderWorkflowStage[];
  stageMatrix: FounderWorkflowMatrixRow[];
  continuity: WorkflowContinuityLevel;
  continuityBreakPoint: FounderWorkflowStageId;
  continuityTransitions: WorkflowContinuityTransition[];
  founderExperience: FounderExperienceAnalysis;
  launchReadiness: LaunchReadinessRealityLevel;
  bottlenecks: FounderBottleneckAnalysis;
}

export interface UpstreamRealityBundle {
  builderScore: number;
  builderExecutionConnected: boolean;
  builderStopPoint: string | null;
  builderPlanning: string;
  builderBuildCapability: string;
  previewScore: number;
  previewBottleneck: string;
  previewRuntimeLevel: string;
  verificationScore: number;
  verificationStatus: string;
  verificationChainBreak: string;
}

export interface AssessFounderWorkflowRealityInput {
  rootDir: string;
  upstream: UpstreamRealityBundle;
  workflowModuleEvidence: WorkflowModulePresenceEvidence;
}

export interface WorkflowModulePresenceEvidence {
  hasCommandCenterBrain: boolean;
  hasRequirementExtractor: boolean;
  hasCapabilityPlanning: boolean;
  hasBuildPackageGenerator: boolean;
  hasBuildTaskRuntime: boolean;
  hasFounderRealityUi: boolean;
  hasIdeaCaptureSignals: boolean;
  hasAutonomousBuilderReality: boolean;
  hasLivePreviewReality: boolean;
  hasVerificationReality: boolean;
  hasControlledBuilderExecutionEngine: boolean;
  hasMobileRuntimeExperienceReality: boolean;
  hasRealFileWorkspaceExecution: boolean;
}

export interface FounderWorkflowReport {
  executiveSummary: string;
  founderWorkflowTruthMap: string;
  workflowContinuityMap: string;
  evidenceFound: string[];
  missingEvidence: string[];
  founderBlockers: string[];
  founderConclusion: string;
  lastProvenStage: FounderWorkflowStageId;
  currentBottleneck: FounderWorkflowStageId;
  nextRequiredCapability: string;
  launchReadinessStatus: LaunchReadinessRealityLevel;
  markdown: string;
}

export interface FounderWorkflowRealityAssessment {
  assessmentId: string;
  founderWorkflowRealityScore: number;
  portfolioSubscores: FounderWorkflowSubscores;
  analyzers: FounderWorkflowAnalyzerResults;
  evidence: FounderWorkflowEvidence[];
  blockers: FounderWorkflowBlocker[];
  evidenceFound: string[];
  missingEvidence: string[];
  founderBlockers: string[];
  founderConclusion: string;
  lastProvenStage: FounderWorkflowStageId;
  currentBottleneck: FounderWorkflowStageId;
  nextRequiredCapability: string;
  launchReadinessStatus: LaunchReadinessRealityLevel;
  founderWorkflowSummary: string;
  upstream: UpstreamRealityBundle;
  assessedAt: number;
  report: FounderWorkflowReport;
}
