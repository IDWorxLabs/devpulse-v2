/**
 * Verification Intelligence — plan types and models.
 * Planning only — no validator execution.
 */

import type {
  VerificationExecutionMode,
  VerificationStrategy,
} from '../verification-strategy-core/verification-strategy-types.js';

export const VERIFICATION_INTELLIGENCE_PASS_TOKEN = 'VERIFICATION_INTELLIGENCE_V1_PASS';
export const VERIFICATION_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_verification_intelligence';

export type VerificationPlanType =
  | 'QUICK'
  | 'STANDARD'
  | 'DEEP'
  | 'RELEASE'
  | 'CLOUD'
  | 'WORLD2'
  | 'TRUST_RECOVERY'
  | 'RISK_ESCALATED';

export interface VerificationPlan {
  id: string;
  type: VerificationPlanType;
  strategy: VerificationStrategy;
  confidence: number;
  riskScore: number;
  estimatedCost: number;
  estimatedDurationMs: number;
  requiredValidators: string[];
  optionalValidators: string[];
  executionOrder: string[];
  reasoning: string[];
  generatedAt: number;
}

export interface VerificationPlanInput {
  projectContext?: string;
  strategy: VerificationStrategy;
  strategyConfidence: number;
  trustScore: number;
  executionMode: VerificationExecutionMode;
  requiredValidators: string[];
  optionalValidators: string[];
  subsystemCriticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  changeSize?: 'small' | 'medium' | 'large';
  blastRadius?: 'LOCAL' | 'MODULE' | 'SYSTEM' | 'PLATFORM';
  historicalFailures?: number;
  validationHistoryPassRate?: number;
  criticalSubsystemModified?: boolean;
  repeatFailuresDetected?: boolean;
  verificationDisagreement?: boolean;
  releaseReady?: boolean;
  world2ExecutionActive?: boolean;
  cloudRuntimeTouched?: boolean;
  brainChanged?: boolean;
  routingChanged?: boolean;
}

export interface VerificationRiskAnalysis {
  riskScore: number;
  factors: string[];
}

export interface VerificationCostAnalysis {
  estimatedCost: number;
  estimatedDurationMs: number;
  validatorCount: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VerificationConfidenceAnalysis {
  confidence: number;
  projection: string;
  factors: string[];
}

export interface VerificationPlanRuntimeReport {
  cacheHits: number;
  cacheMisses: number;
  optimizerReductions: number;
  estimatedRuntimeMs: number;
  estimatedValidatorCount: number;
  bootstrapReuseCount: number;
  recursionDepth: number;
}

export const VERIFICATION_INTELLIGENCE_QUESTION_SIGNALS = [
  'verification plan',
  'verification intelligence',
  'smartest verification',
  'verification execution order',
  'optimize verification',
] as const;

export function isVerificationIntelligenceQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return VERIFICATION_INTELLIGENCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
