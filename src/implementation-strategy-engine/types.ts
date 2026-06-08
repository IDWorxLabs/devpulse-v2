/** DevPulse V2 Implementation Strategy Engine — types. */

export type StrategyStatus = 'READY' | 'WARN' | 'BLOCKED';

export interface ImplementationPhase {
  phaseId: string;
  order: number;
  title: string;
  objective: string;
  packageIds: string[];
  dependencies: string[];
  validationRequirements: string[];
  rollbackCheckpoint: string;
  warnings: string[];
  errors: string[];
}

export interface ImplementationStrategy {
  strategyId: string;
  createdAt: number;
  phases: ImplementationPhase[];
  duplicateRisks: string[];
  status: StrategyStatus;
  warnings: string[];
  errors: string[];
}

export interface StrategySummary {
  strategyId: string;
  phaseCount: number;
  summary: string;
  publishedAt: number;
}

export interface ImplementationStrategyEngineState {
  engineId: string;
  strategyCount: number;
  warnings: string[];
  errors: string[];
}

export interface ImplementationStrategyReport {
  ownerModule: string;
  strategyCount: number;
  phaseCount: number;
  readyCount: number;
  warnCount: number;
  blockedCount: number;
  duplicateRiskCount: number;
  latestStrategy: ImplementationStrategy | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface StrategyDuplicateContext {
  brainSummaries: string[];
  vaultCapabilities: string[];
  packageDuplicateWarnings: string[];
}

export const STRATEGY_OWNER_MODULE = 'devpulse_v2_implementation_strategy_authority';
export const STRATEGY_PASS_TOKEN = 'DEVPULSE_V2_IMPLEMENTATION_STRATEGY_ENGINE_FOUNDATION_V1_PASS';
export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';
