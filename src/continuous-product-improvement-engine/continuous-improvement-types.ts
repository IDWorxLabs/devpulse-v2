/**
 * Continuous Product Improvement Engine Era 3 Phase 11 — types.
 */

import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';

export const CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN =
  'CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_V1_PASS';
export const CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_OWNER_MODULE =
  'devpulse_v2_continuous_product_improvement_engine';
export const DEFAULT_MAX_IMPROVEMENT_HISTORY = 128;
export const DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS = 3;
export const DEFAULT_IMPROVEMENT_MAX_TOUCHED_FILES = 6;

export type ImprovementVerdict =
  | 'READY_FOR_PREVIEW'
  | 'NEEDS_IMPROVEMENT'
  | 'BLOCKED'
  | 'IN_PROGRESS'
  | 'DEFERRED_ACCEPTABLE';

export type ImprovementSignalSource =
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'AUTONOMOUS_DEBUGGING'
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'LAUNCH_AUTHORITY'
  | 'PERFORMANCE_VALIDATOR'
  | 'ACCESSIBILITY_VALIDATOR'
  | 'SECURITY_VALIDATOR'
  | 'WORKSPACE_REALITY'
  | 'EXECUTION_TRACE'
  | 'FOUNDER_TEST'
  | 'UVL';

export type ImprovementSignalKind =
  | 'WARNING'
  | 'NON_BLOCKING_FAILURE'
  | 'FRICTION'
  | 'PERFORMANCE_DEGRADATION'
  | 'ACCESSIBILITY_WARNING'
  | 'DEVICE_WARNING'
  | 'SECURITY_CONCERN'
  | 'RELIABILITY_RISK'
  | 'UX_FRICTION'
  | 'EDGE_CASE_GAP'
  | 'STRESS_WARNING'
  | 'MAINTAINABILITY_CONCERN'
  | 'QUALITY_GAP'
  | 'SCALABILITY_LIMIT';

export type ImprovementOpportunityCategory =
  | 'STRESS_RESILIENCE'
  | 'EDGE_CASE_HANDLING'
  | 'ACCESSIBILITY_IMPROVEMENT'
  | 'PERFORMANCE_OPTIMIZATION'
  | 'MEMORY_OPTIMIZATION'
  | 'SECURITY_HARDENING'
  | 'RELIABILITY_IMPROVEMENT'
  | 'USABILITY_IMPROVEMENT'
  | 'ERROR_HANDLING_IMPROVEMENT'
  | 'RESPONSIVE_LAYOUT_IMPROVEMENT'
  | 'INTERACTION_CLARITY'
  | 'DATA_INTEGRITY_IMPROVEMENT'
  | 'STATE_MANAGEMENT_IMPROVEMENT'
  | 'NAVIGATION_IMPROVEMENT'
  | 'QUALITY_REFACTOR'
  | 'SCALABILITY_IMPROVEMENT';

export type ImprovementPriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'DEFERRED';

export type ImprovementStrategy =
  | 'ADD_EDGE_CASE_HANDLING'
  | 'IMPROVE_ERROR_MESSAGE'
  | 'REDUCE_STEPS'
  | 'IMPROVE_ACCESSIBLE_LABEL'
  | 'IMPROVE_TOUCH_TARGET'
  | 'OPTIMIZE_RENDER_PATH'
  | 'REDUCE_RE_RENDER'
  | 'IMPROVE_EMPTY_STATE'
  | 'IMPROVE_LOADING_STATE'
  | 'IMPROVE_FORM_VALIDATION'
  | 'IMPROVE_RESPONSIVE_LAYOUT'
  | 'ADD_RETRY_HANDLING'
  | 'IMPROVE_DATA_GUARD'
  | 'IMPROVE_NAVIGATION_CLARITY'
  | 'ADD_PERFORMANCE_GUARD'
  | 'REFINE_COPY';

export type ImprovementOutcome =
  | 'APPLIED'
  | 'DEFERRED'
  | 'BLOCKED'
  | 'ROLLED_BACK'
  | 'FAILED'
  | 'IN_PROGRESS';

export interface ImprovementSignalRecord {
  readOnly: true;
  signalId: string;
  source: ImprovementSignalSource;
  kind: ImprovementSignalKind;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  featureSliceIds: readonly string[];
  behaviorScenarioIds: readonly string[];
  virtualUserIds: readonly string[];
  deviceProfileIds: readonly string[];
  interactionIds: readonly string[];
  observedResult: string;
  expectedResult: string;
  evidence: string;
  traceability: readonly string[];
  timestamp: number;
}

export interface ImprovementOpportunity {
  readOnly: true;
  opportunityId: string;
  category: ImprovementOpportunityCategory;
  evidenceSource: ImprovementSignalSource;
  signalIds: readonly string[];
  affectedRequirements: readonly string[];
  affectedFeatures: readonly string[];
  affectedCapabilities: readonly string[];
  affectedBehaviors: readonly string[];
  affectedVirtualUsers: readonly string[];
  affectedDevices: readonly string[];
  affectedInteractions: readonly string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  promptFaithfulnessRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedBenefit: string;
  summary: string;
}

export interface RankedImprovementOpportunity extends ImprovementOpportunity {
  readOnly: true;
  priority: ImprovementPriorityLevel;
  priorityScore: number;
  priorityFactors: readonly string[];
}

export interface ImprovementSafetyAssessment {
  readOnly: true;
  opportunityId: string;
  safe: boolean;
  promptFaithfulnessRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  securityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  dataLossRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  accessibilityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  behaviorDriftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  capabilityDriftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  architectureDriftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  performanceRegressionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  userSafetyRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  blockedReason: string | null;
}

export interface ImprovementPlan {
  readOnly: true;
  improvementId: string;
  opportunityIds: readonly string[];
  targetOutcome: string;
  affectedScope: readonly string[];
  allowedFiles: readonly string[];
  forbiddenFiles: readonly string[];
  patchStrategy: ImprovementStrategy;
  validationPlan: readonly string[];
  regressionPlan: readonly string[];
  rollbackPlan: string;
  safetyConstraints: readonly string[];
  expectedQualityDelta: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ImprovementPatchScope {
  readOnly: true;
  improvementId: string;
  targetFeatureSlices: readonly string[];
  targetComponents: readonly string[];
  targetServices: readonly string[];
  targetStyles: readonly string[];
  targetValidators: readonly string[];
  targetTests: readonly string[];
  doNotTouchAreas: readonly string[];
  regressionSensitiveAreas: readonly string[];
}

export interface ImprovementApplicationPlan {
  readOnly: true;
  patchId: string;
  improvementPlanId: string;
  filesToModify: readonly string[];
  expectedDiffSummary: string;
  atomicityRequirements: readonly string[];
  rollbackSnapshot: string;
  postPatchValidators: readonly string[];
  affectedEvidenceSources: readonly ImprovementSignalSource[];
}

export interface ImprovementValidationPlan {
  readOnly: true;
  improvementId: string;
  validators: readonly string[];
}

export interface ImprovementRegressionPlan {
  readOnly: true;
  improvementId: string;
  checks: readonly string[];
}

export interface ImprovementAttemptRecord {
  readOnly: true;
  improvementId: string;
  opportunityId: string;
  patchScope: string;
  filesModified: readonly string[];
  targetedValidationPassed: boolean;
  regressionValidationPassed: boolean;
  faithfulnessDelta: string;
  qualityDelta: number;
  attemptNumber: number;
  outcome: ImprovementOutcome;
  rollbackSnapshot: string;
  deferredReason: string | null;
  timestamp: number;
}

export interface ImprovementLoopResult {
  readOnly: true;
  loopId: string;
  opportunityIds: readonly string[];
  attempts: readonly ImprovementAttemptRecord[];
  resolved: boolean;
  deferred: boolean;
  blocked: boolean;
  blockedReason: string | null;
  deferredReason: string | null;
}

export interface ProductQualityScore {
  readOnly: true;
  overallScore: number;
  behaviorQuality: number;
  virtualUserCompletion: number;
  usabilityFriction: number;
  deviceReadiness: number;
  accessibilityQuality: number;
  performanceQuality: number;
  securityQuality: number;
  reliabilityQuality: number;
  errorHandlingQuality: number;
  edgeCaseCoverage: number;
  interactionQuality: number;
  maintainability: number;
  scalabilityReadiness: number;
  launchBlockingIssues: readonly string[];
  safeImprovementsApplied: number;
  deferredImprovements: number;
  residualRisk: readonly string[];
}

export interface ContinuousImprovementPipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  interactionProof: InteractionProofPipelineResult;
  autonomousDebugging: AutonomousDebuggingPipelineResult;
  simulateHighFrictionEmergency?: boolean;
  simulateLowEndPerformanceWarning?: boolean;
  simulateAccessibilityLabelWarning?: boolean;
  simulateUnsafeImprovement?: boolean;
  simulateRegressionAfterImprovement?: boolean;
  simulateMinorCopyImprovement?: boolean;
  simulateImprovementExhaustion?: boolean;
}

export interface ContinuousImprovementPipelineResult {
  readOnly: true;
  pipelineId: string;
  signals: readonly ImprovementSignalRecord[];
  opportunities: readonly ImprovementOpportunity[];
  rankedOpportunities: readonly RankedImprovementOpportunity[];
  safetyAssessments: readonly ImprovementSafetyAssessment[];
  improvementPlans: readonly ImprovementPlan[];
  improvementLoops: readonly ImprovementLoopResult[];
  improvementAttempts: readonly ImprovementAttemptRecord[];
  deferredOpportunities: readonly { opportunityId: string; reason: string }[];
  blockedOpportunities: readonly { opportunityId: string; reason: string }[];
  qualityScore: ProductQualityScore;
  permissionVerdict: ImprovementVerdict;
  blockedReason: string | null;
  highestPriorityOpportunity: RankedImprovementOpportunity | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchContinuousImprovementEvidence {
  readOnly: true;
  signalCount: number;
  opportunityCount: number;
  appliedCount: number;
  deferredCount: number;
  blockedCount: number;
  unresolvedCriticalOrHigh: number;
  regressionIntroduced: boolean;
  promptFaithfulnessIntact: boolean;
  qualityScore: number;
  residualRisks: readonly string[];
  permissionVerdict: ImprovementVerdict;
  blockers: readonly string[];
}

export interface ContinuousImprovementReadinessResult {
  readOnly: true;
  ready: boolean;
  pendingSignalCount: number;
  blockedReason: string | null;
}

export interface LivePreviewContinuousImprovementGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  improvementSignals: string | null;
  highestPriorityOpportunity: string | null;
  safetyVerdict: string | null;
  attemptedImprovements: string | null;
  deferredImprovements: string | null;
  residualRisk: string | null;
  gateStatus: string;
}
