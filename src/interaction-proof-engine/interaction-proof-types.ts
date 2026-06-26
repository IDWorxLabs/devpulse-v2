/**
 * Interaction Proof Engine Era 3 Phase 8 — types.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';

export const INTERACTION_PROOF_ENGINE_PASS_TOKEN = 'INTERACTION_PROOF_ENGINE_V1_PASS';
export const INTERACTION_PROOF_ENGINE_OWNER_MODULE = 'devpulse_v2_interaction_proof_engine';
export const DEFAULT_MAX_INTERACTION_PROOF_HISTORY = 128;

export type InteractionClassification =
  | 'REQUIRED_INTERACTION'
  | 'OPTIONAL_INTERACTION'
  | 'DECORATIVE_NON_INTERACTION'
  | 'UNSUPPORTED_INTERACTION'
  | 'UNKNOWN_INTERACTION';

export type InteractionProofStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED_WITH_JUSTIFICATION';

export type InteractionProofVerdict = 'READY_FOR_PREVIEW' | 'NEEDS_REPAIR' | 'BLOCKED' | 'IN_PROGRESS';

export type InteractionFailureCategory =
  | 'INTERACTION_MISSING'
  | 'UNMAPPED_INTERACTION_INTENT'
  | 'NOT_REACHABLE'
  | 'NOT_VISIBLE'
  | 'CLIPPED_OR_COVERED'
  | 'ACCESSIBLE_NAME_MISSING'
  | 'ROLE_INCORRECT'
  | 'EVENT_NOT_FIRED'
  | 'HANDLER_MISSING'
  | 'HANDLER_NOT_BOUND'
  | 'HANDLER_NOT_EXECUTED'
  | 'HANDLER_ERROR'
  | 'STATE_NOT_CHANGED'
  | 'DATA_NOT_CHANGED'
  | 'UI_NOT_CHANGED'
  | 'DEVICE_SPECIFIC_FAILURE'
  | 'VIRTUAL_USER_BLOCKED'
  | 'PROMPT_DRIFT'
  | 'CAPABILITY_GAP';

export interface InteractionSurface {
  readOnly: true;
  interactionId: string;
  elementType: string;
  label: string;
  accessibleName: string;
  role: string;
  selectorStrategy: string;
  route: string;
  featureSliceId: string;
  eventType: string;
  expectedHandler: string;
  classification: InteractionClassification;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface InteractionInventoryRecord {
  readOnly: true;
  interactionId: string;
  elementType: string;
  label: string;
  accessibleName: string;
  role: string;
  selectorStrategy: string;
  route: string;
  featureSliceId: string;
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  behaviorScenarioIds: readonly string[];
  virtualUserJourneyIds: readonly string[];
  deviceProfileIds: readonly string[];
  expectedHandler: string;
  expectedEvent: string;
  expectedStateEffect: string;
  expectedDataEffect: string;
  expectedUiEffect: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  classification: InteractionClassification;
  proofStatus: InteractionProofStatus;
}

export interface InteractionIntentMapping {
  readOnly: true;
  interactionId: string;
  purpose: string;
  behaviorScenarioIds: readonly string[];
  capabilityIds: readonly string[];
  mapped: boolean;
  unmappedReason: string | null;
}

export interface InteractionEventProof {
  readOnly: true;
  interactionId: string;
  eventType: string;
  executionAttempted: boolean;
  executionResult: boolean;
  observedBeforeState: string;
  observedAfterState: string;
  observedErrors: readonly string[];
  durationMs: number;
}

export interface InteractionHandlerProof {
  readOnly: true;
  interactionId: string;
  handlerExists: boolean;
  handlerBound: boolean;
  handlerExecuted: boolean;
  argumentsMatched: boolean;
  completedWithoutError: boolean;
}

export interface InteractionEffectProof {
  readOnly: true;
  interactionId: string;
  stateMatched: boolean;
  dataMatched: boolean;
  uiMatched: boolean;
  detail: string;
}

export interface InteractionAccessibilityProof {
  readOnly: true;
  interactionId: string;
  accessibleNameExists: boolean;
  roleCorrect: boolean;
  labelAssociated: boolean;
  focusLogical: boolean;
  passed: boolean;
}

export interface InteractionDeviceCoverageProof {
  readOnly: true;
  interactionId: string;
  deviceProfileId: string;
  reachable: boolean;
  passed: boolean;
}

export interface InteractionProofResult {
  readOnly: true;
  interactionId: string;
  label: string;
  classification: InteractionClassification;
  intentMapping: InteractionIntentMapping;
  reachabilityPassed: boolean;
  accessibilityProof: InteractionAccessibilityProof;
  eventProof: InteractionEventProof;
  handlerProof: InteractionHandlerProof;
  effectProof: InteractionEffectProof;
  deviceCoverage: readonly InteractionDeviceCoverageProof[];
  passed: boolean;
  failure: InteractionFailureReport | null;
  repairRecommendation: InteractionRepairRecommendation | null;
  skipJustification: string | null;
}

export interface InteractionFailureReport {
  readOnly: true;
  failureId: string;
  interactionId: string;
  interactionLabel: string;
  featureSliceId: string;
  requirementIds: readonly string[];
  capabilityIds: readonly string[];
  behaviorScenarioIds: readonly string[];
  virtualUserJourneyIds: readonly string[];
  deviceProfiles: readonly string[];
  expectedResult: string;
  observedResult: string;
  category: InteractionFailureCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  likelyCause: string;
  responsibleArtifact: string;
  repairRecommendation: string;
}

export interface InteractionRepairRecommendation {
  readOnly: true;
  recommendationId: string;
  failureId: string;
  suggestedRepairScope: string;
  responsibleFeatureSliceId: string;
  responsibleComponent: string;
  responsibleHandler: string;
  responsibleService: string;
  affectedStateOwner: string;
  affectedDataStore: string;
  affectedDeviceProfiles: readonly string[];
  affectedVirtualUsers: readonly string[];
  promptRequirementLinks: readonly string[];
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  validationRequiredAfterRepair: readonly string[];
}

export interface WholeAppInteractionSweepResult {
  readOnly: true;
  sweepId: string;
  passed: boolean;
  checks: readonly { check: string; passed: boolean; detail: string }[];
  blockedReason: string | null;
  unknownInteractionCount: number;
}

export interface InteractionProofPipelineInput {
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  promptFaithfulness: PromptFaithfulnessV2Result;
  capabilityPlanning: CapabilityPlanningPipelineResult;
  incrementalBuild: IncrementalBuildPipelineResult;
  behaviorSimulation: BehaviorSimulationPipelineResult;
  virtualUserSimulation: VirtualUserPipelineResult;
  virtualDeviceLaboratory: VirtualDevicePipelineResult;
  sliceIdFilter?: string | null;
  sliceNameFilter?: string | null;
  simulateDeadButton?: boolean;
  simulateMissingAccessibleName?: boolean;
  simulateDeviceSpecificFailure?: boolean;
  simulateUnknownInteraction?: boolean;
}

export interface InteractionProofPipelineResult {
  readOnly: true;
  pipelineId: string;
  surfaces: readonly InteractionSurface[];
  inventory: readonly InteractionInventoryRecord[];
  intentMappings: readonly InteractionIntentMapping[];
  proofResults: readonly InteractionProofResult[];
  wholeAppSweep: WholeAppInteractionSweepResult;
  permissionVerdict: InteractionProofVerdict;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface LaunchInteractionProofEvidence {
  readOnly: true;
  totalInteractions: number;
  requiredCount: number;
  optionalCount: number;
  unknownCount: number;
  passedCount: number;
  failedCount: number;
  skippedWithJustificationCount: number;
  wholeAppSweepPassed: boolean;
  permissionVerdict: InteractionProofVerdict;
  blockers: readonly string[];
}

export interface InteractionProofReadinessResult {
  readOnly: true;
  ready: boolean;
  interactionCount: number;
  requiredCount: number;
  blockedReason: string | null;
}

export interface LivePreviewInteractionProofGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  affectedInteraction: string | null;
  affectedFeature: string | null;
  failureCategory: string | null;
  expectedBehavior: string | null;
  observedBehavior: string | null;
  responsibleComponent: string | null;
  repairPlan: string | null;
  gateStatus: string;
}
