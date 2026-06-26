/**
 * Behavior Simulation Engine Era 3 Phase 5 — types.
 */

import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';

export const BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN = 'BEHAVIOR_SIMULATION_ENGINE_V1_PASS';
export const BEHAVIOR_SIMULATION_ENGINE_OWNER_MODULE = 'devpulse_v2_behavior_simulation_engine';
export const DEFAULT_MAX_BEHAVIOR_SIMULATION_HISTORY = 128;
export const DEFAULT_SIMULATION_TIMEOUT_MS = 5000;
export const DEFAULT_SIMULATION_RETRY_BUDGET = 2;

export type BehaviorFailureCategory =
  | 'TARGET_MISSING'
  | 'TARGET_NOT_CLICKABLE'
  | 'HANDLER_NOT_CONNECTED'
  | 'STATE_NOT_UPDATED'
  | 'SERVICE_NOT_EXECUTED'
  | 'DATA_NOT_UPDATED'
  | 'UI_NOT_UPDATED'
  | 'ACCESSIBILITY_TARGET_MISSING'
  | 'ROUTE_NOT_REACHED'
  | 'VALIDATION_RULE_FAILED'
  | 'TIMEOUT'
  | 'UNEXPECTED_ERROR'
  | 'PROMPT_DRIFT'
  | 'CAPABILITY_GAP';

export type BehaviorSimulationVerdict =
  | 'READY_FOR_PREVIEW'
  | 'NEEDS_REPAIR'
  | 'BLOCKED'
  | 'IN_PROGRESS';

export type InteractionTargetType =
  | 'BUTTON'
  | 'INPUT'
  | 'FORM'
  | 'MENU'
  | 'DIALOG'
  | 'TAB'
  | 'ROUTE'
  | 'LINK'
  | 'BOTTOM_NAV'
  | 'SIDEBAR'
  | 'TOGGLE'
  | 'SLIDER'
  | 'KEYBOARD'
  | 'GESTURE'
  | 'ACCESSIBLE_CONTROL';

export interface BehaviorScenario {
  readOnly: true;
  scenarioId: string;
  name: string;
  sourceRequirementIds: readonly string[];
  featureSliceIds: readonly string[];
  capabilityIds: readonly string[];
  userGoal: string;
  preconditions: readonly string[];
  actionSteps: readonly string[];
  expectedStateChanges: readonly string[];
  expectedServiceEffects: readonly string[];
  expectedDataUpdates: readonly string[];
  expectedUiResults: readonly string[];
  validationPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BehaviorModelState {
  readOnly: true;
  stateId: string;
  label: string;
  description: string;
}

export interface BehaviorModelTransition {
  readOnly: true;
  transitionId: string;
  fromStateId: string;
  action: string;
  toStateId: string;
  expectedUi: readonly string[];
  requirementIds: readonly string[];
}

export interface BehaviorModel {
  readOnly: true;
  modelId: string;
  productLabel: string;
  states: readonly BehaviorModelState[];
  transitions: readonly BehaviorModelTransition[];
  traceableToPrompt: boolean;
}

export interface InteractionTarget {
  readOnly: true;
  targetId: string;
  targetType: InteractionTargetType;
  accessibleName: string;
  selectorStrategy: 'role' | 'accessible-name' | 'data-testid' | 'label' | 'placeholder' | 'route';
  selectorValue: string;
  requiredRole: string;
  expectedHandler: string;
  expectedStateOwner: string;
  expectedFeatureSliceId: string;
  traceabilityLinks: readonly string[];
}

export interface SimulationActionPlan {
  readOnly: true;
  planId: string;
  scenarioId: string;
  initialState: string;
  navigationSteps: readonly string[];
  interactionSteps: readonly string[];
  inputValues: Readonly<Record<string, string>>;
  expectedIntermediateStates: readonly string[];
  expectedFinalState: string;
  expectedServiceEffects: readonly string[];
  expectedDataEffects: readonly string[];
  expectedUiEffects: readonly string[];
  timeoutBudgetMs: number;
  retryPolicy: string;
  failureClassificationRules: readonly string[];
}

export interface SimulatedActionRecord {
  readOnly: true;
  actionId: string;
  targetId: string;
  actionType: string;
  timestamp: number;
  result: 'PASS' | 'FAIL';
  observedStateBefore: string;
  observedStateAfter: string;
  observedUiBefore: string;
  observedUiAfter: string;
  errors: readonly string[];
  durationMs: number;
}

export interface StateTransitionVerification {
  readOnly: true;
  scenarioId: string;
  expected: string;
  observed: string;
  matched: boolean;
}

export interface ServiceEffectVerification {
  readOnly: true;
  scenarioId: string;
  serviceName: string;
  expectedCall: boolean;
  observedCall: boolean;
  argumentsMatch: boolean;
  errorState: string | null;
  matched: boolean;
}

export interface DataUpdateVerification {
  readOnly: true;
  scenarioId: string;
  dataStore: string;
  expectedMutation: string;
  observedMutation: string;
  persistenceStatus: 'PERSISTED' | 'NOT_PERSISTED' | 'UNKNOWN';
  matched: boolean;
}

export interface UiResultVerification {
  readOnly: true;
  scenarioId: string;
  expectedText: string;
  observedText: string;
  visibilityMatch: boolean;
  routeMatch: boolean;
  matched: boolean;
}

export interface BehaviorFailureReport {
  readOnly: true;
  failureId: string;
  scenarioId: string;
  step: string;
  targetId: string;
  category: BehaviorFailureCategory;
  expectedResult: string;
  observedResult: string;
  likelyCause: string;
  responsibleFeatureSliceId: string;
  responsibleCapabilityId: string;
  responsibleArtifact: string;
  repairRecommendation: string;
}

export interface BehaviorRepairRecommendation {
  readOnly: true;
  recommendationId: string;
  failureId: string;
  classification: BehaviorFailureCategory;
  affectedRequirementIds: readonly string[];
  affectedFeatureSliceIds: readonly string[];
  affectedCapabilityIds: readonly string[];
  responsibleFiles: readonly string[];
  suggestedRepairScope: string;
  validationNeededAfterRepair: readonly string[];
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BehaviorScenarioResult {
  readOnly: true;
  scenarioId: string;
  passed: boolean;
  actionRecords: readonly SimulatedActionRecord[];
  stateVerification: StateTransitionVerification;
  serviceVerification: ServiceEffectVerification;
  dataVerification: DataUpdateVerification;
  uiVerification: UiResultVerification;
  failure: BehaviorFailureReport | null;
  repairRecommendation: BehaviorRepairRecommendation | null;
  skipJustification: string | null;
}

export interface WholeAppBehaviorSweepResult {
  readOnly: true;
  sweepId: string;
  passed: boolean;
  crossFeatureChecks: readonly { check: string; passed: boolean; detail: string }[];
  blockedReason: string | null;
}

export interface BehaviorSimulationPipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  simulateBrokenHandler?: boolean;
  simulateUiWithoutData?: boolean;
  sliceIdFilter?: string | null;
}

export interface BehaviorSimulationPipelineResult {
  readOnly: true;
  pipelineId: string;
  scenarios: readonly BehaviorScenario[];
  behaviorModel: BehaviorModel;
  interactionTargets: readonly InteractionTarget[];
  actionPlans: readonly SimulationActionPlan[];
  scenarioResults: readonly BehaviorScenarioResult[];
  wholeAppSweep: WholeAppBehaviorSweepResult;
  permissionVerdict: BehaviorSimulationVerdict;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchBehaviorSimulationEvidence {
  readOnly: true;
  requiredCount: number;
  executedCount: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  skippedWithJustificationCount: number;
  wholeAppSweepPassed: boolean;
  permissionVerdict: BehaviorSimulationVerdict;
  blockers: readonly string[];
}

export interface BehaviorSimulationReadinessResult {
  readOnly: true;
  ready: boolean;
  scenarioCount: number;
  blockedReason: string | null;
}

export interface LivePreviewBehaviorGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  failureSummary: string | null;
  affectedWorkflow: string | null;
  responsibleFeature: string | null;
  repairPlan: string | null;
}
