/**
 * ASE Enforcement Engine V1 — types and pass token.
 */

import type { AutonomousSoftwareEngineeringPipelineResult } from '../autonomous-software-engineering-engine/ase-types.js';

export const ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN = 'ASE_ENFORCEMENT_ENGINE_V1_PASS' as const;
export const ASE_ENFORCEMENT_ENGINE_OWNER_MODULE = 'devpulse_v2_ase_enforcement_engine' as const;

export type EngineeringState =
  | 'NOT_STARTED'
  | 'UNDERSTANDING_PRODUCT'
  | 'PLANNING'
  | 'GENERATING'
  | 'VALIDATING'
  | 'REPAIRING'
  | 'EVOLVING_CAPABILITIES'
  | 'CONTINUOUS_IMPROVEMENT'
  | 'READY_FOR_LAUNCH'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'FAILED'
  | 'UNKNOWN';

export type EngineeringGoal =
  | 'UNDERSTAND_PRODUCT_INTENT'
  | 'PLAN_CAPABILITIES'
  | 'GENERATE_APPLICATION'
  | 'VALIDATE_BEHAVIOR'
  | 'PROVE_INTERACTIONS'
  | 'REPAIR_ENGINEERING_FAILURES'
  | 'EVOLVE_MISSING_CAPABILITIES'
  | 'IMPROVE_PRODUCT_QUALITY'
  | 'COMPLETE_LAUNCH_EVIDENCE'
  | 'ESCALATE_UNSAFE_REQUEST';

export type EngineeringDecisionType =
  | 'CONTINUE_BUILD'
  | 'RUN_VALIDATION'
  | 'RUN_BEHAVIOR_SIMULATION'
  | 'RUN_VIRTUAL_USERS'
  | 'RUN_VIRTUAL_DEVICES'
  | 'RUN_INTERACTION_PROOF'
  | 'RUN_AUTONOMOUS_DEBUGGING'
  | 'RUN_CAPABILITY_EVOLUTION'
  | 'RUN_CONTINUOUS_IMPROVEMENT'
  | 'RETRY_LAST_STEP'
  | 'ROLLBACK_TO_LAST_STABLE_STATE'
  | 'ESCALATE_TO_HUMAN_REVIEW'
  | 'READY_FOR_LAUNCH'
  | 'STOP_ENGINEERING';

export type EngineeringActionType =
  | 'INTENT_UNDERSTANDING'
  | 'PROMPT_FAITHFULNESS'
  | 'CAPABILITY_PLANNING'
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'INCREMENTAL_BUILD'
  | 'MATERIALIZATION'
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'AUTONOMOUS_DEBUGGING'
  | 'CONTINUOUS_IMPROVEMENT'
  | 'LAUNCH_READINESS'
  | 'LIVE_PREVIEW_GATE'
  | 'REPAIR'
  | 'RETRY'
  | 'ROLLBACK'
  | 'HUMAN_REVIEW';

export type EngineeringExecutionStatus =
  | 'STARTED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELLED'
  | 'RECOVERED'
  | 'RETRYING';

export interface EngineeringEvidenceBundle {
  readOnly: true;
  sources: readonly string[];
  blockers: readonly string[];
  warnings: readonly string[];
  confidence: number;
  readyForGeneration: boolean;
  readyForMaterialization: boolean;
  readyForLaunch: boolean;
  humanReviewRequired: boolean;
}

export interface EngineeringDecision {
  readOnly: true;
  decision: EngineeringDecisionType;
  goal: EngineeringGoal;
  reason: string;
  authorized: boolean;
  recoveryRoute: EngineeringActionType | null;
}

export interface EngineeringActionRecord {
  readOnly: true;
  actionId: string;
  actionType: EngineeringActionType;
  status: EngineeringExecutionStatus;
  startedAt: number;
  completedAt: number | null;
  detail: string;
}

export interface EngineeringRecoveryPlan {
  readOnly: true;
  route: 'AUTONOMOUS_DEBUGGING' | 'CAPABILITY_EVOLUTION' | 'RETRY' | 'ROLLBACK' | 'VALIDATION_REPLAY' | 'HUMAN_REVIEW';
  reason: string;
  retryAuthorized: boolean;
}

export interface MaterializationHostResult {
  ok: boolean;
  failureReason: string | null;
}

export interface AutonomousEngineeringHost {
  executeMaterialization?: () => MaterializationHostResult | Promise<MaterializationHostResult>;
}

export interface AutonomousEngineeringInput {
  readOnly?: true;
  rawPrompt: string;
  projectId: string;
  projectRootDir: string;
  workspaceDir: string;
  previewUrl?: string | null;
  productIntelligenceModel?: import('../intent-understanding-engine/intent-understanding-types.js').ProductIntelligenceModel;
  promptFaithfulness?: import('../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js').PromptFaithfulnessV2Result;
  capabilityPlanning?: import('../capability-planning-engine/capability-planning-types.js').CapabilityPlanningPipelineResult;
  simulateHumanReviewPayment?: boolean;
  simulateUnresolvedCapability?: boolean;
  simulateDeadButton?: boolean;
  /** Validator-only: force materialization denial after ASE pre-pipeline evaluation */
  simulateAseMaterializationDenial?: boolean;
  host?: AutonomousEngineeringHost;
}

export interface AutonomousEngineeringResult {
  readOnly: true;
  runId: string;
  projectId: string;
  engineeringState: EngineeringState;
  engineeringGoal: EngineeringGoal;
  engineeringComplete: boolean;
  materializationAuthorized: boolean;
  materializationExecuted: boolean;
  awaitingPreviewUrl: boolean;
  decisions: readonly EngineeringDecision[];
  actions: readonly EngineeringActionRecord[];
  evidence: EngineeringEvidenceBundle;
  asePipeline: AutonomousSoftwareEngineeringPipelineResult;
  preMaterializationPipeline: AutonomousSoftwareEngineeringPipelineResult | null;
}
