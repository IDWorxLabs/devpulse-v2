/**
 * Validation Runtime Governance V1 — types.
 */

import type { RuntimeCostTier, ValidatorCategory, ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/validation-runtime-audit-types.js';

export type ValidationTier = 'FAST' | 'STANDARD' | 'FULL' | 'LAUNCH';

export type RuntimeBudgetCategory = RuntimeCostTier;

export type ReuseEvidenceType =
  | 'EXECUTION_PROOF'
  | 'VERIFICATION_PROOF'
  | 'BUILD_PROOF'
  | 'BLUEPRINT_PROOF'
  | 'AFLA_ASSESSMENT';

export type DuplicationKind =
  | 'NPM_INSTALL'
  | 'NPM_BUILD'
  | 'PREVIEW_STARTUP'
  | 'UVL_EXECUTION'
  | 'AFLA_EXECUTION'
  | 'PLAYWRIGHT_EXECUTION';

export interface GovernanceRule {
  ruleId: number;
  name: string;
  summary: string;
  enforcement: 'ACTIVE';
}

export interface GovernancePolicy {
  version: 'V1';
  generatedAt: string;
  active: true;
  principle: string;
  rules: readonly GovernanceRule[];
  tierTargets: Record<ValidationTier, { targetRuntimeSeconds: number | null; description: string }>;
}

export interface TierRegistryEntry {
  validatorName: string;
  category: ValidatorCategory;
  costTier: RuntimeCostTier;
  minimumTier: ValidationTier;
  allowedTiers: readonly ValidationTier[];
  forbiddenInFast: boolean;
  aflaGated: boolean;
}

export interface TierRegistry {
  generatedAt: string;
  entries: readonly TierRegistryEntry[];
  tierCounts: Record<ValidationTier, number>;
}

export interface CapabilityImpactNode {
  capabilityId: string;
  capabilityName: string;
  filePatterns: readonly string[];
  validators: readonly string[];
  categories: readonly ValidatorCategory[];
}

export interface CapabilityImpactGraph {
  generatedAt: string;
  nodes: readonly CapabilityImpactNode[];
  filePatternIndex: Record<string, string>;
}

export interface RuntimeBudgetEntry {
  validatorName: string;
  budgetCategory: RuntimeBudgetCategory;
  budgetSeconds: number;
  runtimeSeconds: number;
  withinBudget: boolean;
  breachSeverity: 'NONE' | 'WARNING' | 'CRITICAL';
}

export interface RuntimeBudgetRegistry {
  generatedAt: string;
  entries: readonly RuntimeBudgetEntry[];
  breachCount: number;
}

export interface ReuseStrategyRule {
  resource: string;
  strategy: 'SHARED' | 'CACHED' | 'ARTIFACT_REUSE';
  requirement: string;
  estimatedSavingsMinutes: number;
  affectedValidatorCount: number;
}

export interface ReuseStrategy {
  generatedAt: string;
  active: true;
  rules: readonly ReuseStrategyRule[];
  artifactTypes: readonly ReuseEvidenceType[];
  totalEstimatedSavingsMinutes: number;
}

export interface GovernanceMetrics {
  generatedAt: string;
  baseline: {
    validationOverheadPercent: number;
    duplicateWorkPercent: number;
    validatorCount: number;
    registeredValidatorCount: number;
  };
  governed: {
    validationOverheadPercent: number;
    duplicateWorkPercent: number;
    cacheHitPercent: number;
    previewReusePercent: number;
    buildReusePercent: number;
    fastTierRuntimeSeconds: number;
    standardTierRuntimeSeconds: number;
    fullTierRuntimeSeconds: number;
  };
  targetsMet: {
    validationOverhead: boolean;
    duplicateWork: boolean;
  };
  governanceActive: true;
}

export interface ValidationPlanEntry {
  validatorName: string;
  reason: string;
  tier: ValidationTier;
  runtimeSeconds: number;
}

export interface ValidationGovernancePlan {
  tier: ValidationTier;
  changedFiles: readonly string[];
  launchCandidate: boolean;
  validatorsToRun: readonly ValidationPlanEntry[];
  validatorsSkipped: readonly { validatorName: string; reason: string }[];
  evidenceReused: readonly { evidenceType: ReuseEvidenceType; source: string; stillValid: boolean }[];
  projectedRuntimeSeconds: number;
  confidencePreserved: boolean;
  answers: {
    whatShouldRun: string;
    whyShouldRun: string;
    canEvidenceBeReused: string;
    canRuntimeBeReduced: string;
  };
}

export interface ValidationRuntimeGovernanceAssessment {
  version: 'V1';
  generatedAt: string;
  passToken: string;
  governanceActive: true;
  auditBaselinePassToken: string;
  policy: GovernancePolicy;
  tierRegistry: TierRegistry;
  capabilityImpactGraph: CapabilityImpactGraph;
  runtimeBudgetRegistry: RuntimeBudgetRegistry;
  reuseStrategy: ReuseStrategy;
  metrics: GovernanceMetrics;
  samplePlans: {
    fastImplementation: ValidationGovernancePlan;
    standardFeatureComplete: ValidationGovernancePlan;
    fullMilestone: ValidationGovernancePlan;
    launchCandidate: ValidationGovernancePlan;
  };
  sourceMetrics: readonly ValidatorRuntimeMetric[];
}
