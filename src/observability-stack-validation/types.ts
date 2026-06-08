/** DevPulse V2 Observability Stack Reality Validation — types. */

export type Phase6Readiness = 'READY' | 'NOT_READY';

export type ObservabilityHandoffId =
  | 'observation_to_replay'
  | 'replay_to_session'
  | 'session_to_prediction'
  | 'prediction_to_attribution';

export interface ObservabilityHandoff {
  handoffId: string;
  sourceSystem: string;
  targetSystem: string;
  sourceProducedOutput: boolean;
  targetConsumedOutput: boolean;
  ownershipPreserved: boolean;
  detail?: string;
}

export interface OwnershipIntegrityCheck {
  domain: string;
  expectedOwner: string;
  actualOwner: string;
  preserved: boolean;
}

export interface DuplicateDetectionStatus {
  systemId: string;
  noDuplicateClaim: boolean;
  ownershipPreserved: boolean;
  active: boolean;
}

export interface ObservabilityValidationResult {
  validationId: string;
  createdAt: number;
  handoffs: ObservabilityHandoff[];
  ownershipChecks: OwnershipIntegrityCheck[];
  duplicateDetection: DuplicateDetectionStatus[];
  evidencePropagationValid: boolean;
  timelinePropagationValid: boolean;
  brainVisibilityValid: boolean;
  warnings: string[];
  errors: string[];
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  phase6Readiness: Phase6Readiness;
}

export interface ObservabilityValidationState {
  validatorId: string;
  runCount: number;
  warnings: string[];
  errors: string[];
}

export interface ObservabilityStackValidationReport {
  validationId: string;
  handoffCount: number;
  successfulHandoffs: number;
  ownershipIntegrity: boolean;
  evidencePropagation: boolean;
  duplicateDetectionStatus: DuplicateDetectionStatus[];
  centralBrainVisibility: boolean;
  timelinePropagation: boolean;
  phase6Readiness: Phase6Readiness;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const VALIDATION_OWNER_MODULE = 'devpulse_v2_observability_stack_validation_authority';
export const VALIDATION_PASS_TOKEN = 'DEVPULSE_V2_OBSERVABILITY_STACK_REALITY_VALIDATION_V1_PASS';
export const PHASE_6_READY: Phase6Readiness = 'READY';

export const OBSERVABILITY_STACK_VALIDATION_HTML =
  '<div id="shell-root"><div id="expense-panel"><button id="expense-submit" type="button">Submit</button></div></div>';

export const OBSERVABILITY_SYSTEMS = [
  'self_vision',
  'reality_replay',
  'session_replay',
  'failure_prediction',
  'root_cause_attribution',
] as const;
