/**
 * Autonomous Engineering Orchestrator V1 — shared types.
 *
 * AEO V1 is the orchestration layer that connects existing diagnosis, AutoFix, repair, and
 * missing-capability systems into the real one-prompt build path. It does not reimplement any of
 * those systems and does not add application-specific logic — every type here is generic.
 */

import type { AeoBuildStage, AeoFailureClass, AeoFailureSeverity } from './failure-taxonomy.js';
import type {
  EiaaActivationReport,
  EiaaRuntimeInvocationRequest,
} from '../engineering-intelligence-activation-authority-v1/engineering-intelligence-activation-types.js';

export const AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_CONTRACT =
  'AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1' as const;

export const AEO_DEFAULT_MAX_CYCLES = 3 as const;

/** A single piece of evidence a classification is based on — always traceable to a real signal. */
export interface AeoEvidenceCitation {
  readOnly: true;
  /** Name of the upstream system/report this evidence came from (e.g. "product-faithfulness-v2"). */
  source: string;
  detail: string;
}

export interface AeoFailureClassification {
  readOnly: true;
  failureClass: AeoFailureClass;
  severity: AeoFailureSeverity;
  /** 0-100 deterministic confidence that this classification is correct given the evidence seen. */
  confidence: number;
  evidence: AeoEvidenceCitation[];
  affectedStages: AeoBuildStage[];
  likelyOwnerSystem: string;
  repairMayBeAttempted: boolean;
  missingCapabilityPlanningMayBeNeeded: boolean;
}

export type AeoRepairWiringStatus =
  | 'PRODUCTION_WIRED'
  | 'PLANNING_ONLY'
  | 'VALIDATOR_ONLY'
  | 'GOVERNANCE_ONLY'
  | 'SIMULATED';

export interface AeoRepairCapabilityDefinition {
  readOnly: true;
  capabilityId: string;
  displayName: string;
  failureClassesHandled: AeoFailureClass[];
  /** Plain description of the evidence this capability needs as input (not a type, a description). */
  inputEvidenceRequired: string[];
  safeToRunAutomatically: boolean;
  maxAttempts: number;
  affectedStages: AeoBuildStage[];
  /** "module/function" string, or null when nothing is wired to call. */
  existingModuleFunction: string | null;
  wiringStatus: AeoRepairWiringStatus;
  /** True when applying this repair could alter what the generated product looks/behaves like. */
  mayChangeProductIdentity: boolean;
  limitations: string[];
  /** 0-100 deterministic confidence this capability, when matched, will actually resolve the failure. */
  confidence: number;
}

export type AeoRepairPlanDecision =
  | 'RUN_TARGETED_REPAIR'
  | 'REFUSE_NO_SAFE_REPAIR'
  | 'REFUSE_MAX_ATTEMPTS_EXCEEDED'
  | 'REFUSE_UNKNOWN_FAILURE'
  | 'REFUSE_NOT_PRODUCTION_WIRED'
  | 'REFUSE_PLANNING_ONLY'
  | 'REFUSE_SIMULATED_ONLY'
  | 'REFUSE_MAY_CHANGE_PRODUCT_IDENTITY';

export type AeoRetryScope = 'SINGLE_STAGE' | 'FULL_REBUILD' | 'NONE';

export interface AeoRepairPlan {
  readOnly: true;
  decision: AeoRepairPlanDecision;
  matchedCapability: AeoRepairCapabilityDefinition | null;
  /** Every capability that handles this failure class, in the order they were considered. */
  consideredCapabilities: AeoRepairCapabilityDefinition[];
  retryScope: AeoRetryScope;
  targetStage: AeoBuildStage | null;
  reason: string;
  requiresConfirmation: boolean;
}

export interface AeoRepairAttemptRecord {
  readOnly: true;
  cycle: number;
  failureClass: AeoFailureClass;
  capabilityId: string | null;
  decision: AeoRepairPlanDecision;
  applied: boolean;
  succeeded: boolean;
  detail: string;
  atMs: number;
}

export interface AeoMissingCapabilityRecommendation {
  readOnly: true;
  missingCapabilityId: string;
  missingCapabilityName: string;
  failureClassRequiringIt: AeoFailureClass;
  whyExistingCapabilitiesAreInsufficient: string[];
  requiredInputs: string[];
  expectedOutputs: string[];
  targetIntegrationPoint: string;
  validationNeeded: string[];
  recommendedNextMilestonePromptSummary: string;
}

export type AeoOrchestratorState =
  | 'OBSERVE_BUILD_RESULT'
  | 'DIAGNOSE_FAILURE'
  | 'MATCH_REPAIR_CAPABILITY'
  | 'PLAN_REPAIR'
  | 'APPLY_REPAIR'
  | 'REVALIDATE_REPAIR'
  | 'RETRY_AFFECTED_STAGE'
  | 'ROUTE_MISSING_CAPABILITY'
  | 'ACTIVATE_ENGINEERING_INTELLIGENCE'
  | 'ENGINEERING_INTELLIGENCE_RUNTIME_INVOKED'
  | 'STOP_SAFE'
  | 'BUILD_RECOVERED'
  | 'HUMAN_REVIEW_REQUIRED';

/**
 * Optional execution host the real build orchestrator may provide. AEO V1 never mutates files or
 * runs processes itself — it only ever calls back into a host the caller wires to a real,
 * already-existing repair capability. When no host (or no matching callback) is provided, AEO
 * honestly stops instead of pretending a repair ran.
 */
export interface AeoExecutionHost {
  /** Apply the matched, production-wired, safe repair. Must return real evidence, never a guess. */
  applyRepair?: (plan: AeoRepairPlan) => Promise<{ applied: boolean; detail: string; evidence?: string[] }>;
  /** Re-check whether the build is healthy after a repair was applied. */
  revalidate?: () => Promise<{ passed: boolean; detail: string }>;
  /**
   * Invoke the Engineering Intelligence Runtime with the structured request EIAA produced. AEO
   * only ever calls this after EIAA has returned ALLOW_ENGINEERING_INTELLIGENCE. This never
   * installs generated output automatically — the host is expected to keep generation separately
   * validated, per EIAA's policy.
   */
  invokeEngineeringIntelligenceRuntime?: (
    request: EiaaRuntimeInvocationRequest,
  ) => Promise<{ invoked: boolean; detail: string }>;
}

export interface AeoOrchestratorCycleRecord {
  readOnly: true;
  cycle: number;
  statesVisited: AeoOrchestratorState[];
  classification: AeoFailureClassification;
  repairPlan: AeoRepairPlan;
  applied: boolean;
  applyDetail: string | null;
  revalidatePassed: boolean | null;
}

export interface AeoOrchestratorReport {
  readOnly: true;
  contractVersion: typeof AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_CONTRACT;
  finalState: AeoOrchestratorState;
  cycles: AeoOrchestratorCycleRecord[];
  classification: AeoFailureClassification;
  matchedCapabilityId: string | null;
  repairWasProductionWired: boolean;
  repairWasSafeToAutoRun: boolean;
  repairPlan: AeoRepairPlan | null;
  repairAttemptHistory: AeoRepairAttemptRecord[];
  retryStage: AeoBuildStage | null;
  repairResult: 'REPAIRED' | 'NOT_APPLIED' | 'FAILED' | null;
  missingCapability: AeoMissingCapabilityRecommendation | null;
  recommendedNextMilestone: string | null;
  /** EIAA's decision report — set only when a missing capability was routed and EIAA was consulted. */
  engineeringIntelligenceActivation: EiaaActivationReport | null;
  /** True only when the host actually invoked the Engineering Intelligence Runtime (never assumed). */
  engineeringIntelligenceInvoked: boolean;
  engineeringIntelligenceInvocationDetail: string | null;
  humanReviewReason: string | null;
  buildRecovered: boolean;
  /** "Build failed because X. AiDevEngine checked existing repair capability Y. ..." */
  plainEnglishSummary: string;
  generatedAt: string;
}
