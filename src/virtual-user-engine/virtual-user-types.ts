/**
 * Virtual User Engine Era 3 Phase 6 — types.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';

export const VIRTUAL_USER_ENGINE_PASS_TOKEN = 'VIRTUAL_USER_ENGINE_V1_PASS';
export const VIRTUAL_USER_ENGINE_OWNER_MODULE = 'devpulse_v2_virtual_user_engine';
export const DEFAULT_MAX_VIRTUAL_USER_HISTORY = 128;
export const DEFAULT_JOURNEY_STEP_BUDGET = 12;
export const DEFAULT_JOURNEY_TIME_BUDGET_MS = 30_000;

export type VirtualUserGoalStatus =
  | 'COMPLETED'
  | 'COMPLETED_WITH_FRICTION'
  | 'FAILED'
  | 'BLOCKED'
  | 'SKIPPED_WITH_JUSTIFICATION';

export type VirtualUserVerdict = 'READY_FOR_PREVIEW' | 'NEEDS_REPAIR' | 'BLOCKED' | 'IN_PROGRESS';

export type FrictionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';

export type VirtualUserFailureCategory =
  | 'GOAL_NOT_REACHED'
  | 'JOURNEY_BLOCKED'
  | 'REQUIRED_STEP_MISSING'
  | 'BEHAVIOR_FAILED'
  | 'ACCESSIBILITY_BLOCKER'
  | 'TOO_MANY_STEPS'
  | 'NO_CONFIRMATION'
  | 'STATE_LOST'
  | 'DATA_LOST'
  | 'SERVICE_FAILED'
  | 'NAVIGATION_DEAD_END'
  | 'ERROR_RECOVERY_MISSING'
  | 'PROMPT_DRIFT'
  | 'CAPABILITY_GAP';

export interface VirtualUserProfile {
  readOnly: true;
  userId: string;
  role: string;
  description: string;
  sourceRequirementIds: readonly string[];
  productGoals: readonly string[];
  primaryWorkflows: readonly string[];
  accessibilityNeeds: readonly string[];
  deviceContext: string;
  skillLevel: 'NOVICE' | 'INTERMEDIATE' | 'EXPERT';
  constraints: readonly string[];
  successCriteria: readonly string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VirtualUserPersona {
  readOnly: true;
  personaId: string;
  userId: string;
  abilities: readonly string[];
  limitations: readonly string[];
  preferences: readonly string[];
  requiredInputModes: readonly string[];
  attentionBudget: number;
  errorTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  accessibilityRequirements: readonly string[];
  deviceAssumptions: readonly string[];
  workflowPriority: readonly string[];
  completionThresholds: readonly string[];
}

export interface VirtualUserGoal {
  readOnly: true;
  goalId: string;
  userId: string;
  description: string;
  sourceRequirements: readonly string[];
  requiredFeatureSliceIds: readonly string[];
  requiredBehaviorScenarioIds: readonly string[];
  preconditions: readonly string[];
  completionCriteria: readonly string[];
  failureCriteria: readonly string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VirtualUserJourney {
  readOnly: true;
  journeyId: string;
  userId: string;
  goalId: string;
  steps: readonly string[];
  decisionPoints: readonly string[];
  expectedUiStates: readonly string[];
  expectedDataStates: readonly string[];
  expectedServiceEffects: readonly string[];
  accessibilityExpectations: readonly string[];
  maximumStepBudget: number;
  maximumTimeBudgetMs: number;
  recoveryRules: readonly string[];
  completionCriteria: readonly string[];
}

export interface VirtualUserStepResult {
  readOnly: true;
  stepIndex: number;
  step: string;
  passed: boolean;
  behaviorScenarioId: string | null;
  detail: string;
}

export interface FrictionEvent {
  readOnly: true;
  eventId: string;
  journeyId: string;
  description: string;
  severity: FrictionSeverity;
  category: string;
}

export interface VirtualUserJourneyResult {
  readOnly: true;
  journeyId: string;
  userId: string;
  goalId: string;
  stepResults: readonly VirtualUserStepResult[];
  frictionEvents: readonly FrictionEvent[];
  accessibilityEvents: readonly string[];
  completionStatus: VirtualUserGoalStatus;
  durationMs: number;
  stepCount: number;
  failure: VirtualUserFailureReport | null;
  repairRecommendation: VirtualUserRepairRecommendation | null;
  skipJustification: string | null;
}

export interface VirtualUserFailureReport {
  readOnly: true;
  failureId: string;
  userId: string;
  goalId: string;
  journeyId: string;
  failedStep: string;
  expectedOutcome: string;
  observedOutcome: string;
  category: VirtualUserFailureCategory;
  affectedRequirementIds: readonly string[];
  affectedFeatureSliceIds: readonly string[];
  affectedBehaviorScenarioIds: readonly string[];
  likelyCause: string;
  repairRecommendation: string;
}

export interface VirtualUserRepairRecommendation {
  readOnly: true;
  recommendationId: string;
  failureId: string;
  suggestedRepairScope: string;
  responsibleFeatureSliceId: string;
  responsibleBehaviorScenarioId: string;
  responsibleCapabilityId: string;
  responsibleFiles: readonly string[];
  promptRequirementLinks: readonly string[];
  accessibilityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  validationRequiredAfterRepair: readonly string[];
}

export interface WholeAppVirtualUserSweepResult {
  readOnly: true;
  sweepId: string;
  passed: boolean;
  checks: readonly { check: string; passed: boolean; detail: string }[];
  blockedReason: string | null;
}

export interface VirtualUserPipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  simulateAccessibilityBlocker?: boolean;
  simulateTooManySteps?: boolean;
  simulateMissingConfirmation?: boolean;
  sliceIdFilter?: string | null;
}

export interface VirtualUserPipelineResult {
  readOnly: true;
  pipelineId: string;
  profiles: readonly VirtualUserProfile[];
  personas: readonly VirtualUserPersona[];
  goals: readonly VirtualUserGoal[];
  journeys: readonly VirtualUserJourney[];
  journeyResults: readonly VirtualUserJourneyResult[];
  wholeAppSweep: WholeAppVirtualUserSweepResult;
  permissionVerdict: VirtualUserVerdict;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchVirtualUserEvidence {
  readOnly: true;
  userCount: number;
  goalCount: number;
  journeyCount: number;
  completedCount: number;
  failedCount: number;
  frictionCount: number;
  skippedWithJustificationCount: number;
  wholeAppSweepPassed: boolean;
  permissionVerdict: VirtualUserVerdict;
  blockers: readonly string[];
}

export interface VirtualUserReadinessResult {
  readOnly: true;
  ready: boolean;
  userCount: number;
  goalCount: number;
  blockedReason: string | null;
}

export interface LivePreviewVirtualUserGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  affectedUser: string | null;
  failedGoal: string | null;
  blockedStep: string | null;
  failureCategory: string | null;
  responsibleFeature: string | null;
  repairPlan: string | null;
  gateStatus: string;
}
