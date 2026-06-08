/** DevPulse V2 World 2 Simulation Runtime — types. */

import type {
  CompletionCriterion,
  ExecutionStage,
  RiskItem,
  RollbackPoint,
  StageType,
  VerificationPoint,
} from '../world2-execution-planner/types.js';

export type SimulationState =
  | 'SIMULATION_REQUEST_RECEIVED'
  | 'PLAN_VALIDATED'
  | 'STAGES_SIMULATED'
  | 'RISKS_SIMULATED'
  | 'VERIFICATION_FORECAST_CREATED'
  | 'ROLLBACK_FORECAST_CREATED'
  | 'COMPLETION_FORECAST_CREATED'
  | 'SIMULATION_READY';

export type LikelihoodLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ForecastOutcome = 'LIKELY_SUCCESS' | 'LIKELY_DELAY' | 'LIKELY_BLOCKER';

export type VerificationForecastResult = 'LIKELY_PASS' | 'LIKELY_FAIL' | 'LIKELY_PARTIAL';

export type WarningSeverity = 'INFO' | 'WARN' | 'ALERT';

export interface SimulationInput {
  workspaceId: string;
  projectId: string;
  planId: string;
  executionStages: ExecutionStage[];
  riskItems: RiskItem[];
  verificationPoints: VerificationPoint[];
  rollbackPoints: RollbackPoint[];
  completionCriteria: CompletionCriterion[];
}

export interface SimulatedStage {
  stageOrder: number;
  stageType: StageType;
  stageName: string;
  forecastOutcome: ForecastOutcome;
  estimatedDurationUnits: number;
  simulationNote: string;
}

export interface SimulatedRisk {
  sourceRiskId: string;
  forecastLevel: RiskItem['riskLevel'];
  likelihood: LikelihoodLevel;
  forecastDescription: string;
  recommendedMitigation: string;
}

export interface SimulatedWarning {
  warningId: string;
  severity: WarningSeverity;
  message: string;
}

export interface VerificationForecast {
  pointId: string;
  pointType: VerificationPoint['pointType'];
  stageType: StageType;
  forecastResult: VerificationForecastResult;
  likelihood: LikelihoodLevel;
  forecastReason: string;
}

export interface RollbackForecast {
  pointId: string;
  pointType: RollbackPoint['pointType'];
  stageType: StageType;
  triggerLikelihood: LikelihoodLevel;
  forecastTrigger: string;
  rollbackReady: boolean;
}

export interface SimulationResult {
  simulationId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulatedStages: SimulatedStage[];
  simulatedRisks: SimulatedRisk[];
  simulatedWarnings: SimulatedWarning[];
  verificationForecasts: VerificationForecast[];
  rollbackForecasts: RollbackForecast[];
  completionLikelihood: LikelihoodLevel;
  confidenceScore: ConfidenceLevel;
  recommendations: string[];
  stateSequence: SimulationState[];
  createdAt: number;
  simulationOnlyConfirmed: true;
  noExecutionOccurred: true;
  noFilesModified: true;
  noCodeGenerated: true;
  simulationReady: boolean;
}

export interface World2SimulationRuntimeState {
  runtimeId: string;
  simulationCount: number;
  warnings: string[];
  errors: string[];
}

export interface World2SimulationReport {
  ownerModule: string;
  simulationId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  stageCount: number;
  riskCount: number;
  warningCount: number;
  completionLikelihood: LikelihoodLevel;
  confidenceScore: ConfidenceLevel;
  recommendationCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const WORLD2_SIMULATION_RUNTIME_OWNER_MODULE = 'devpulse_v2_world2_simulation_runtime';
export const WORLD2_SIMULATION_RUNTIME_PASS_TOKEN = 'DEVPULSE_V2_WORLD2_SIMULATION_RUNTIME_V1_PASS';

export const SIMULATION_STATE_SEQUENCE: readonly SimulationState[] = [
  'SIMULATION_REQUEST_RECEIVED',
  'PLAN_VALIDATED',
  'STAGES_SIMULATED',
  'RISKS_SIMULATED',
  'VERIFICATION_FORECAST_CREATED',
  'ROLLBACK_FORECAST_CREATED',
  'COMPLETION_FORECAST_CREATED',
  'SIMULATION_READY',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'world2_execution_planner',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'verification_gated_apply',
] as const;

export const DUPLICATE_PATTERNS = [
  'simulation_runtime',
  'simulation_engine',
  'execution_simulator',
  'project_simulator',
  'runtime_simulator',
] as const;

export const WORLD1_PROTECTED_DOMAINS = [
  'law_enforcement',
  'foundation_enforcement',
  'execution_authority',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'verification_gated_apply',
] as const;

export const LIKELIHOOD_LEVELS: readonly LikelihoodLevel[] = [
  'VERY_LOW',
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
] as const;

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ['LOW', 'MEDIUM', 'HIGH'] as const;
