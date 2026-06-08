/** DevPulse V2 Recovery Strategy Planner — types. */

export type RecoveryStatus = 'READY' | 'WARN' | 'BLOCKED';

export interface RecoveryScenario {
  scenarioId: string;
  failureType: string;
  trigger: string;
  recommendedRecovery: string;
  rollbackRecommendation: string;
  validationRequirements: string[];
  warnings: string[];
  errors: string[];
}

export interface RecoveryStrategy {
  strategyId: string;
  createdAt: number;
  codePlanId: string;
  scenarios: RecoveryScenario[];
  duplicateRisks: string[];
  status: RecoveryStatus;
  warnings: string[];
  errors: string[];
}

export interface RecoverySummary {
  strategyId: string;
  codePlanId: string;
  scenarioCount: number;
  summary: string;
  publishedAt: number;
}

export interface RecoveryStrategyPlannerState {
  plannerId: string;
  strategyCount: number;
  warnings: string[];
  errors: string[];
}

export interface RecoveryStrategyReport {
  ownerModule: string;
  strategyCount: number;
  scenarioCount: number;
  readyCount: number;
  warnCount: number;
  blockedCount: number;
  duplicateRiskCount: number;
  latestStrategy: RecoveryStrategy | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface RecoveryDuplicateContext {
  brainSummaries: string[];
  vaultCapabilities: string[];
  architectDuplicateWarnings: string[];
  packageDuplicateWarnings: string[];
  strategyDuplicateWarnings: string[];
  codePlanDuplicateWarnings: string[];
}

export interface GenerateRecoveryInput {
  codePlanId: string;
  implementationStrategyId?: string;
  tasks: Array<{
    taskId: string;
    title: string;
    targetModules: string[];
    validationRequirements: string[];
    duplicateRisks: string[];
    warnings: string[];
    errors: string[];
  }>;
  phases?: Array<{
    phaseId: string;
    order: number;
    title: string;
    rollbackCheckpoint: string;
    validationRequirements: string[];
    warnings: string[];
    errors: string[];
  }>;
  planWarnings: string[];
  planErrors: string[];
}

export const RECOVERY_OWNER_MODULE = 'devpulse_v2_recovery_strategy_authority';
export const RECOVERY_PASS_TOKEN = 'DEVPULSE_V2_RECOVERY_STRATEGY_PLANNER_FOUNDATION_V1_PASS';
export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';
