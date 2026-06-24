/**
 * Validation Runtime Audit V1 — types.
 */

export type RuntimeCostTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MeasurementSource = 'MEASURED' | 'MAX_RUNTIME_BOUND' | 'STATIC_ESTIMATE';

export type GovernanceAction = 'CACHE' | 'MERGE' | 'REMOVE' | 'REUSE' | 'TIER' | 'KEEP';

export type ValidatorCategory =
  | 'CAPABILITY_AUDIT'
  | 'CQI'
  | 'UVL'
  | 'AFLA'
  | 'PAI'
  | 'REAL_BUILD_EXECUTION'
  | 'LAUNCH'
  | 'ENGINEERING'
  | 'BLUEPRINT'
  | 'FEATURE_REALITY'
  | 'WORLD2'
  | 'OPERATOR'
  | 'CONNECTED_PIPELINE'
  | 'FOUNDATION'
  | 'REGRESSION'
  | 'OTHER';

export interface WorkPatternCounts {
  npmInstallCount: number;
  npmBuildCount: number;
  previewServerCount: number;
  playwrightExecutionCount: number;
  workspaceMaterializationCount: number;
  uvlExecutionCount: number;
  aflaExecutionCount: number;
  auditExecutionCount: number;
  realBuildPipelineCount: number;
  nestedValidatorCount: number;
}

export interface ValidatorRuntimeMetric {
  validatorName: string;
  scriptPath: string;
  category: ValidatorCategory;
  runtimeSeconds: number;
  runtimeMinutes: number;
  measurementSource: MeasurementSource;
  costTier: RuntimeCostTier;
  duplicateWorkPercent: number;
  workPatterns: WorkPatternCounts;
  maxRuntimeBoundMs: number | null;
  validationMode: 'FAST_FEATURE_CHECK' | 'FULL_STACK_CHECK' | 'UNMARKED';
  registeredInPackageJson: boolean;
}

export interface ValidatorRankingEntry {
  rank: number;
  validatorName: string;
  runtimeSeconds: number;
  runtimeMinutes: number;
  costTier: RuntimeCostTier;
  duplicateWorkPercent: number;
  category: ValidatorCategory;
}

export interface DuplicateWorkEntry {
  validatorName: string;
  duplicateWorkPercent: number;
  overlappingValidators: readonly string[];
  duplicatedOperations: readonly string[];
}

export interface DependencyGraphNode {
  validatorName: string;
  triggers: readonly string[];
  triggeredBy: readonly string[];
  nestedValidation: boolean;
  circularRisk: boolean;
}

export interface DependencyGraph {
  nodes: readonly DependencyGraphNode[];
  nestedChains: readonly { chain: readonly string[]; circular: boolean }[];
  circularValidationPaths: readonly string[];
  repeatedValidationPaths: readonly string[];
}

export interface BottleneckEntry {
  bottleneck: string;
  impactScore: number;
  affectedValidatorCount: number;
  estimatedAggregateMinutes: number;
  rank: number;
}

export interface GovernanceRecommendation {
  action: GovernanceAction;
  target: string;
  rationale: string;
  evidenceValidators: readonly string[];
  estimatedSavingsMinutes: number;
}

export interface RegressionChainAnalysis {
  typicalImplementationMinutes: number;
  typicalRegressionValidationMinutes: number;
  validationOverheadRatio: number;
  phaseValidators: readonly string[];
  totalPhaseRuntimeSeconds: number;
}

export interface ValidationRuntimeAuditAssessment {
  version: 'V1';
  generatedAt: string;
  passToken: string;
  readOnly: true;
  measurementOnly: true;
  validatorCount: number;
  registeredValidatorCount: number;
  totalEstimatedRuntimeSeconds: number;
  totalEstimatedRuntimeMinutes: number;
  aggregateDuplicateWorkPercent: number;
  metrics: readonly ValidatorRuntimeMetric[];
  regressionChain: RegressionChainAnalysis;
}
