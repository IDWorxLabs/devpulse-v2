/**
 * Engineering Intelligence Activation Authority V1 — shared types.
 *
 * EIAA is the constitutional authority that decides whether AiDevEngine may invoke the
 * Engineering Intelligence Runtime to generate a missing capability. It never generates anything
 * itself — it only evaluates evidence (already produced by the Autonomous Engineering
 * Orchestrator) against a fixed policy and returns ALLOW / DENY / REQUIRE_HUMAN_REVIEW plus a
 * structured, generic runtime-invocation request when it allows activation.
 */

export const ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1_CONTRACT =
  'ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1' as const;

export type EiaaActivationDecision =
  | 'ALLOW_ENGINEERING_INTELLIGENCE'
  | 'DENY_ENGINEERING_INTELLIGENCE'
  | 'REQUIRE_HUMAN_REVIEW';

export type EiaaRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** The eight policy checks every activation must satisfy — see activation-policy.ts. */
export type EiaaPolicyCheckId =
  | 'MISSING_CAPABILITY_POSITIVELY_IDENTIFIED'
  | 'EXISTING_REPAIR_CAPABILITIES_INSUFFICIENT'
  | 'FAILURE_CONFIDENCE_ABOVE_THRESHOLD'
  | 'FAILURE_IS_DETERMINISTIC'
  | 'RETRY_ATTEMPTS_EXHAUSTED'
  | 'CAPABILITY_REQUEST_WELL_DEFINED'
  | 'TARGET_INTEGRATION_POINT_KNOWN'
  | 'VALIDATION_STRATEGY_EXISTS';

export const EIAA_POLICY_CHECK_IDS: readonly EiaaPolicyCheckId[] = [
  'MISSING_CAPABILITY_POSITIVELY_IDENTIFIED',
  'EXISTING_REPAIR_CAPABILITIES_INSUFFICIENT',
  'FAILURE_CONFIDENCE_ABOVE_THRESHOLD',
  'FAILURE_IS_DETERMINISTIC',
  'RETRY_ATTEMPTS_EXHAUSTED',
  'CAPABILITY_REQUEST_WELL_DEFINED',
  'TARGET_INTEGRATION_POINT_KNOWN',
  'VALIDATION_STRATEGY_EXISTS',
];

export interface EiaaPolicyCheckResult {
  readOnly: true;
  checkId: EiaaPolicyCheckId;
  passed: boolean;
  detail: string;
}

export interface EiaaActivationPolicyConfig {
  readOnly: true;
  /** 0-100 — minimum classification confidence required before activation may even be considered. */
  confidenceThreshold: number;
}

export const EIAA_DEFAULT_POLICY_CONFIG: EiaaActivationPolicyConfig = {
  readOnly: true,
  confidenceThreshold: 70,
};

/**
 * Plain, structural evidence input — deliberately decoupled from AEO's internal types so EIAA can
 * be evaluated (and unit-tested) on its own. activation-evidence.ts provides a bridge that builds
 * this from real AEO diagnosis/repair-plan/missing-capability/history objects.
 */
export interface EiaaActivationEvidence {
  readOnly: true;
  failureClasses: string[];
  /** 0-100, the diagnosed failure classification's confidence. */
  confidence: number;
  repairAttempts: number;
  /** True when existing repair capabilities have nothing left to safely try automatically. */
  repairsExhausted: boolean;
  existingCapabilitiesEvaluated: string[];
  capabilitiesRejected: Array<{ capabilityId: string; reason: string }>;
  missingCapabilityId: string | null;
  missingCapabilityName: string | null;
  reasonGenerationIsNeeded: string;
  expectedIntegrationPoint: string | null;
  validationPlan: string[];
  requiredInputs: string[];
  requiredOutputs: string[];
  riskLevel: EiaaRiskLevel;
  /** Whether the same failure class reproduces the same evidence every time (never inferred from randomness/timing). */
  isDeterministicFailure: boolean;
  isUnknownFailure: boolean;
  /** True when two or more classifications with materially different remedies were both plausible. */
  hasConflictingDiagnoses: boolean;
  /** True when the only candidate repair capability would be unsafe to run automatically. */
  unsafeRepairDetected: boolean;
  /** True when repair/retry history shows the same failure+capability pair looping without new evidence. */
  infiniteRetryDetected: boolean;
}

/**
 * A generic, product-agnostic request that becomes the Engineering Intelligence Runtime's input
 * when (and only when) EIAA allows activation. EIAA builds this — it never calls the runtime
 * itself.
 */
export interface EiaaRuntimeInvocationRequest {
  readOnly: true;
  missingCapabilityId: string;
  missingCapabilityName: string;
  failureTaxonomyClass: string;
  requiredInputs: string[];
  requiredOutputs: string[];
  integrationPoint: string;
  validationStrategy: string[];
  /** Free-text specification describing what the generated capability must do — no product logic. */
  capabilitySpecification: string;
}

export interface EiaaActivationReport {
  readOnly: true;
  contractVersion: typeof ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1_CONTRACT;
  decision: EiaaActivationDecision;
  /** 0-100 — confidence in the decision itself (based on how decisively checks passed/failed). */
  confidence: number;
  reason: string;
  satisfiedChecks: EiaaPolicyCheckResult[];
  failedChecks: EiaaPolicyCheckResult[];
  rejectedActivationReasons: string[];
  recommendedAction: string;
  evidence: EiaaActivationEvidence;
  runtimeRequest: EiaaRuntimeInvocationRequest | null;
  generatedAt: string;
}
