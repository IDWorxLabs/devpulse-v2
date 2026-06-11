/** DevPulse V2 Planning Stack Reality Validation — types. */

export type Phase5Readiness = 'PHASE_5_READY' | 'PHASE_5_NOT_READY';

export type HandoffId =
  | 'aidev_to_requirements'
  | 'requirements_to_architect'
  | 'architect_to_packages'
  | 'packages_to_strategy'
  | 'strategy_to_code_plan'
  | 'code_plan_to_recovery';

export interface HandoffValidation {
  handoffId: HandoffId;
  sourceSystem: string;
  targetSystem: string;
  sourceProducedOutput: boolean;
  targetConsumedOutput: boolean;
  ownershipPreserved: boolean;
  detail: string;
}

export interface OwnershipIntegrityCheck {
  domain: string;
  expectedOwner: string;
  actualOwner: string;
  preserved: boolean;
}

export interface DuplicateDetectionStatus {
  systemId: string;
  hasDetectExistingCapabilities: boolean;
  hasDetectPotentialDuplicates: boolean;
  active: boolean;
}

export interface PlanningStackValidationResult {
  validationId: string;
  createdAt: number;
  requestText: string;
  handoffs: HandoffValidation[];
  ownershipChecks: OwnershipIntegrityCheck[];
  duplicateDetection: DuplicateDetectionStatus[];
  duplicateRiskPropagated: boolean;
  duplicateRiskCount: number;
  phase5Readiness: Phase5Readiness;
  overallStatus: 'PASS' | 'FAIL';
  warnings: string[];
  errors: string[];
}

export interface PlanningStackValidationState {
  validatorId: string;
  runCount: number;
  warnings: string[];
  errors: string[];
}

export interface PlanningStackValidationReport {
  validationId: string;
  systemsValidated: string[];
  handoffsValidated: number;
  successfulHandoffs: number;
  failedHandoffs: number;
  ownershipViolations: number;
  duplicateDetectionStatus: DuplicateDetectionStatus[];
  duplicateRiskPropagated: boolean;
  overallStatus: 'PASS' | 'FAIL';
  phase5Readiness: Phase5Readiness;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const VALIDATION_OWNER_MODULE = 'devpulse_v2_planning_stack_validation_authority';
export const VALIDATION_PASS_TOKEN = 'DEVPULSE_V2_PLANNING_STACK_REALITY_VALIDATION_V1_PASS';
export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';

export const PLANNING_STACK_VALIDATION_REQUEST =
  'Build an Android expense tracker app with offline support for students. Single-user email/password login. No payments. Sync failures retry with user notification. Public MVP launch. Dark theme with green accents. Encrypted local storage. Success means students can track expenses reliably offline.';

export const PLANNING_SYSTEMS = [
  'aidev_engine',
  'requirement_extractor',
  'product_architect',
  'build_package_generator',
  'implementation_strategy_engine',
  'code_generation_planner',
  'recovery_strategy_planner',
] as const;
