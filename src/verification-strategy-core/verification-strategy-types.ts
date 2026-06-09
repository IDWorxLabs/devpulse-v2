/**
 * Verification Strategy Core — types and models.
 * Decision-making only — no validator execution.
 */

export const VERIFICATION_STRATEGY_CORE_PASS_TOKEN = 'VERIFICATION_STRATEGY_CORE_V1_PASS';
export const VERIFICATION_STRATEGY_CORE_OWNER_MODULE = 'devpulse_v2_verification_strategy_core';

export type VerificationStrategy =
  | 'MINIMAL'
  | 'STANDARD'
  | 'DEEP'
  | 'RELEASE'
  | 'CLOUD'
  | 'WORLD2'
  | 'TRUST_RECOVERY';

export type VerificationTaskType =
  | 'READ_ONLY'
  | 'DOCUMENTATION'
  | 'PLANNING'
  | 'SUMMARY'
  | 'FEATURE'
  | 'CODE_CHANGE'
  | 'UI_CHANGE'
  | 'ARCHITECTURE'
  | 'INFRASTRUCTURE'
  | 'BRAIN'
  | 'ROUTING'
  | 'DATA_MODEL'
  | 'RELEASE'
  | 'CLOUD'
  | 'WORLD2'
  | 'AUTONOMOUS'
  | 'BUILDER'
  | 'UNKNOWN';

export type VerificationRiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VerificationChangeScope = 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'MAJOR';

export type VerificationExecutionMode =
  | 'LOCAL'
  | 'CLOUD'
  | 'WORLD2'
  | 'REMOTE'
  | 'API'
  | 'AUTONOMOUS'
  | 'DRY_RUN'
  | 'NONE';

export interface VerificationStrategyDecision {
  strategy: VerificationStrategy;
  confidence: number;
  escalationRequired: boolean;
  reason: string[];
  requiredValidators: string[];
  optionalValidators: string[];
  generatedAt: number;
}

export interface VerificationStrategyInput {
  projectContext?: string;
  taskType: VerificationTaskType;
  riskLevel: VerificationRiskLevel;
  trustScore: number;
  changeScope: VerificationChangeScope;
  executionMode: VerificationExecutionMode;
  historicalFailures?: number;
  changeSize?: 'small' | 'medium' | 'large';
  validationHistoryPassRate?: number;
  criticalSubsystemModified?: boolean;
  repeatFailuresDetected?: boolean;
  world2ExecutionActive?: boolean;
  verificationDisagreement?: boolean;
  releaseReady?: boolean;
  brainChanged?: boolean;
  routingChanged?: boolean;
  cloudRuntimeTouched?: boolean;
  dataModelChanged?: boolean;
}

export interface VerificationRequirementResult {
  requiredValidators: string[];
  optionalValidators: string[];
  reasons: string[];
}

export interface VerificationStrategyRegistryEntry {
  strategyId: VerificationStrategy;
  description: string;
  riskLevel: VerificationRiskLevel;
  expectedValidators: string[];
  minimumConfidence: number;
}

export interface VerificationStrategyRuntimeReport {
  routingCacheHits: number;
  routingCacheMisses: number;
  bootstrapReuseCount: number;
  validatorExecutionTimeMs: number;
  slowValidationGroups: string[];
  timeoutEvents: number;
  skippedValidatorReasons: string[];
  recursionDepth: number;
  duplicatePreventionHits: number;
}

export const VERIFICATION_STRATEGY_QUESTION_SIGNALS = [
  'verification strategy',
  'how much verification',
  'verification required',
  'verification path',
  'verification escalate',
  'trust recovery verification',
] as const;

export function isVerificationStrategyCoreQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return VERIFICATION_STRATEGY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
