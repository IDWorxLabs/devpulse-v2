/**
 * Validation Runtime Governance V1 — types.
 */

import type { RuntimeCostTier, ValidatorCategory } from '../validation-runtime-audit-v1/index.js';

export type ValidationTier = 'FAST' | 'STANDARD' | 'FULL' | 'LAUNCH';

export type GovernanceAction = 'CACHE' | 'MERGE' | 'REMOVE' | 'REUSE' | 'TIER' | 'KEEP' | 'BLOCK_DUPLICATE';

export type RuntimeBudgetCategory = RuntimeCostTier;

export interface TierDefinition {
  tier: ValidationTier;
  targetRuntimeSeconds: number;
  description: string;
  allowedCategories: readonly ValidatorCategory[];
  forbiddenCategories: readonly ValidatorCategory[];
  forbiddenValidatorPatterns: readonly string[];
  explicitValidators: readonly string[];
}

export interface ValidatorTierAssignment {
  validatorName: string;
  tier: ValidationTier;
  category: ValidatorCategory;
  runtimeBudgetSeconds: number;
  budgetCategory: RuntimeBudgetCategory;
  aflaBlockedInFastStandard: boolean;
}

export interface CapabilityImpactNode {
  capabilityCategory: string;
  pathPatterns: readonly string[];
  validators: readonly string[];
}

export interface CapabilityImpactGraph {
  nodes: readonly CapabilityImpactNode[];
  resolveValidatorsForChangedFiles: (changedFiles: readonly string[]) => readonly string[];
}

export interface RuntimeBudgetEntry {
  validatorName: string;
  budgetSeconds: number;
  budgetCategory: RuntimeBudgetCategory;
  measuredSeconds: number | null;
  estimatedSeconds: number;
  breachBecomesAuditFinding: boolean;
}

export interface ReuseStrategy {
  previewServerReuse: {
    enabled: boolean;
    sharedPool: boolean;
    attachToExistingRuntime: boolean;
    newServerRequiresJustification: boolean;
    estimatedSavingsMinutes: number;
  };
  buildOutputCache: {
    enabled: boolean;
    cacheKeys: readonly string[];
    rebuildWhenInputsChanged: boolean;
    estimatedSavingsMinutes: number;
  };
  playwrightSessionReuse: {
    enabled: boolean;
    sharedBrowserPool: boolean;
    reuseContextWhereSafe: boolean;
    estimatedSavingsMinutes: number;
  };
  artifactReuse: {
    enabled: boolean;
    reusableArtifactTypes: readonly string[];
    avoidReprovingUnchangedEvidence: boolean;
  };
}

export interface DuplicatePreventionRule {
  operation: string;
  blockWhenReusableEvidenceExists: boolean;
  affectedValidatorCount: number;
}

export interface GovernanceMetrics {
  baselineValidationOverheadPercent: number;
  projectedValidationOverheadPercent: number;
  baselineDuplicateWorkPercent: number;
  projectedDuplicateWorkPercent: number;
  targetValidationOverheadPercent: number;
  targetDuplicateWorkPercent: number;
  cacheHitPercent: number;
  previewReusePercent: number;
  buildReusePercent: number;
  governanceActive: boolean;
}

export interface ValidationRunPlan {
  tier: ValidationTier;
  validatorsToRun: readonly string[];
  validatorsSkipped: readonly string[];
  reusableEvidence: readonly string[];
  estimatedRuntimeSeconds: number;
  rationale: string;
}

export interface GovernancePolicy {
  version: 'V1';
  generatedAt: string;
  passToken: string;
  active: boolean;
  tiers: readonly TierDefinition[];
  rules: readonly {
    id: string;
    name: string;
    description: string;
    enforced: boolean;
  }[];
  duplicatePreventionRules: readonly DuplicatePreventionRule[];
}

export interface ValidationRuntimeGovernanceAssessment {
  version: 'V1';
  generatedAt: string;
  passToken: string;
  governanceActive: boolean;
  policy: GovernancePolicy;
  tierAssignments: readonly ValidatorTierAssignment[];
  capabilityImpactGraph: CapabilityImpactGraph;
  runtimeBudgetRegistry: readonly RuntimeBudgetEntry[];
  reuseStrategy: ReuseStrategy;
  governanceMetrics: GovernanceMetrics;
  auditBaselinePassToken: string;
}
