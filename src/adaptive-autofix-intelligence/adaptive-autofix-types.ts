/**
 * Adaptive AutoFix Intelligence — assessment types.
 */

export type FailureCategory =
  | 'BUILD_FAILURE'
  | 'TYPECHECK_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'UI_FAILURE'
  | 'LAUNCH_FAILURE'
  | 'CHAT_FAILURE'
  | 'MEMORY_FAILURE'
  | 'PLANNING_FAILURE'
  | 'AUTONOMY_FAILURE'
  | 'VERIFICATION_FAILURE'
  | 'UNKNOWN_FAILURE';

export type CapabilityGapCategory =
  | 'MISSING_DIAGNOSTIC'
  | 'MISSING_VALIDATOR'
  | 'MISSING_AUTHORITY'
  | 'MISSING_RUNTIME_TOOL'
  | 'MISSING_PLANNING_LAYER'
  | 'MISSING_MEMORY_LAYER'
  | 'MISSING_CONTEXT_LAYER'
  | 'MISSING_VERIFICATION_LAYER'
  | 'MISSING_BRIDGE'
  | 'MISSING_USER_SIGNAL'
  | 'MISSING_LAUNCH_SIGNAL'
  | 'MISSING_INTELLIGENCE_LAYER';

export type EvolutionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AdaptiveAutofixReadinessState =
  | 'AUTOFIX_READY'
  | 'LIMITED_AUTOFIX'
  | 'EVOLUTION_REQUIRED'
  | 'BLOCKED';

export type FailureOutcome = 'FAIL' | 'PARTIAL' | 'UNKNOWN';

export interface FailureRecord {
  failureCategory: FailureCategory;
  subsystem: string;
  rootCause: string;
  attemptedFixes: string[];
  repeatedFailureCount: number;
  lastFailureTimestamp: number;
  outcome: FailureOutcome;
}

export interface CapabilityGap {
  gapCategory: CapabilityGapCategory;
  missingCapability: string;
  failureCategory: FailureCategory;
  evidence: string[];
}

export interface EvolutionRecommendation {
  missingCapability: string;
  whyCurrentSystemFailed: string;
  expectedBenefit: string;
  implementationPriority: EvolutionPriority;
  estimatedFailureReduction: number;
  recommendedAuthority: string;
  recommendedValidator: string;
  recommendedIntegrationPoints: string[];
}

export interface AdaptiveAutoFixAssessment {
  readOnly: true;
  advisoryOnly: true;
  adaptiveAutoFixScore: number;
  repeatedFailureCount: number;
  capabilityGapCount: number;
  evolutionRequiredCount: number;
  estimatedFailureReduction: number;
  autofixReadiness: AdaptiveAutofixReadinessState;
  missingCapabilities: string[];
  recommendations: EvolutionRecommendation[];
  blocksLaunchReadiness: boolean;
  triggeredAdaptiveAutofix: boolean;
  failureCategories: FailureCategory[];
  failureRecords: FailureRecord[];
  capabilityGaps: CapabilityGap[];
  cacheKey: string;
}
