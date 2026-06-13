/**
 * Phase 26.5 — Full product readiness simulation types.
 */

import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { SimulationRuntimeHealth } from './product-readiness-simulation-budget.js';

export const FULL_PRODUCT_READINESS_SIMULATION_PASS_TOKEN =
  'FULL_PRODUCT_READINESS_SIMULATION_ORCHESTRATOR_PASS';

export type ProductReadinessSimulationId =
  | 'FIRST_TIME_USER'
  | 'PRODUCT_CREATION_JOURNEY'
  | 'CHAT_INTELLIGENCE'
  | 'SKEPTICAL_FOUNDER'
  | 'INVESTOR'
  | 'NON_TECHNICAL_USER'
  | 'POWER_USER'
  | 'FRUSTRATED_USER'
  | 'EXECUTION_REALITY'
  | 'VERIFICATION'
  | 'PROJECT_MEMORY'
  | 'IDENTITY'
  | 'UI_NAVIGATION'
  | 'CLAIM_VS_REALITY'
  | 'LAUNCH_DAY';

export type ProductReadinessVerdict =
  | 'LAUNCH_READY'
  | 'LAUNCH_READY_WITH_WARNINGS'
  | 'NOT_YET_LAUNCH_READY'
  | 'LAUNCH_BLOCKED';

export interface ProductReadinessSimulationResult {
  readOnly: true;
  id: ProductReadinessSimulationId;
  label: string;
  score: number;
  verdict: ProductReadinessVerdict;
  weightPercent: number;
  weightedContribution: number;
  topFailures: string[];
  recommendedFixes: string[];
  evidenceNotes: string[];
}

export interface ProductReadinessAutomaticBlocker {
  readOnly: true;
  id: string;
  explanation: string;
  recommendedAction: string;
}

export interface ProductReadinessSelfEvolution {
  readOnly: true;
  topProductRisks: string[];
  topMissingCapabilities: string[];
  topUserFrustrations: string[];
  topLaunchBlockers: string[];
  whatShouldWeBuildNext: string[];
}

export interface ProductReadinessReport {
  readOnly: true;
  advisoryOnly: true;
  runId: string;
  generatedAt: string;
  coreQuestion: string;
  readinessScore: number;
  verdict: ProductReadinessVerdict;
  launchBlocked: boolean;
  automaticBlockers: ProductReadinessAutomaticBlocker[];
  simulations: ProductReadinessSimulationResult[];
  selfEvolution: ProductReadinessSelfEvolution;
  chatStressSimulation: ChatStressSimulationReport | null;
  founderTestScore: number | null;
  simulationRuntimeHealth: SimulationRuntimeHealth;
  simulationBudgetElapsedMs: number;
  simulationDegradedPartial: boolean;
  simulationBudgetNotes: string[];
}

export interface ProductReadinessAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: ProductReadinessReport;
}

export interface RunProductReadinessSimulationInput {
  rootDir?: string;
  founderTestAssessment?: FounderTestAssessment;
  chatStressSimulation?: ChatStressSimulationReport | null;
  skipChatStressSimulation?: boolean;
  chatStressMaxScenarios?: number;
  founderReviewerConfidence?: number | null;
  /** Founder Test path — applies bounded scenario defaults and budget guards. */
  founderTestContext?: boolean;
  simulationBudgetMs?: number;
  onSimulationTrace?: (event: {
    operationId: string;
    operationLabel: string;
    phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';
    errorMessage?: string;
  }) => void;
}

export interface ProductReadinessHistoryEntry {
  timestamp: string;
  runId: string;
  readinessScore: number;
  verdict: ProductReadinessVerdict;
  launchBlocked: boolean;
  blockerCount: number;
}
