/**
 * Autonomous Testing — types and models.
 * Test planning only — no real test execution.
 */

import type { VerificationStrategy } from '../verification-strategy-core/verification-strategy-types.js';
import type { VerificationPlanType } from '../verification-intelligence/verification-plan-types.js';
import type { VerificationReadinessState } from '../verification-integration/verification-integration-types.js';

export const AUTONOMOUS_TESTING_PASS_TOKEN = 'AUTONOMOUS_TESTING_V1_PASS';
export const AUTONOMOUS_TESTING_OWNER_MODULE = 'devpulse_v2_autonomous_testing';
export const MAX_AUTONOMOUS_TEST_HISTORY_SIZE = 64;

export type AutonomousTestDepth =
  | 'SMOKE'
  | 'STANDARD'
  | 'DEEP'
  | 'RELEASE'
  | 'CLOUD'
  | 'WORLD2'
  | 'TRUST_RECOVERY';

export type AutonomousTestCategory =
  | 'UNIT'
  | 'INTEGRATION'
  | 'RUNTIME'
  | 'UI'
  | 'ROUTING'
  | 'BRAIN'
  | 'TRUST'
  | 'WORLD2'
  | 'CLOUD'
  | 'BUILD'
  | 'VERIFICATION'
  | 'REGRESSION';

export type AutonomousTestReadiness =
  | 'READY'
  | 'NEEDS_MORE_CONTEXT'
  | 'RISK_ESCALATED'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'BLOCKED';

export type AutonomousTestResultStatus = 'SIMULATED_PASS' | 'SIMULATED_FAIL' | 'NOT_EXECUTED';

export interface AutonomousTestPlan {
  id: string;
  depth: AutonomousTestDepth;
  categories: AutonomousTestCategory[];
  requiredSuites: string[];
  optionalSuites: string[];
  coverageTargets: string[];
  executionOrder: string[];
  estimatedCost: number;
  estimatedDurationMs: number;
  riskScore: number;
  confidence: number;
  readiness: AutonomousTestReadiness;
  reasoning: string[];
  generatedAt: number;
}

export interface AutonomousTestResult {
  planId: string;
  status: AutonomousTestResultStatus;
  passedSuites: string[];
  failedSuites: string[];
  skippedSuites: string[];
  confidenceAfterTesting: number;
  failureSignals: string[];
  generatedAt: number;
}

export interface AutonomousTestPlanInput {
  projectContext?: string;
  buildStrategyCategory?: string;
  verificationStrategy?: VerificationStrategy;
  verificationPlanType?: VerificationPlanType;
  verificationReadiness?: VerificationReadinessState;
  verificationConfidence?: number;
  verificationRiskScore?: number;
  trustScore: number;
  changeScope?: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'MAJOR';
  executionMode?: 'LOCAL' | 'CLOUD' | 'WORLD2' | 'REMOTE' | 'API' | 'AUTONOMOUS' | 'DRY_RUN' | 'NONE';
  subsystemTouched?: string[];
  blastRadius?: 'LOCAL' | 'MODULE' | 'SYSTEM' | 'PLATFORM';
  historicalFailures?: number;
  repeatFailuresDetected?: boolean;
  verificationDisagreement?: boolean;
  releaseReady?: boolean;
  world2ExecutionActive?: boolean;
  cloudRuntimeTouched?: boolean;
  brainChanged?: boolean;
  routingChanged?: boolean;
  dataModelChanged?: boolean;
  uiChanged?: boolean;
  buildStrategyChanged?: boolean;
  verificationSystemChanged?: boolean;
  trustChanged?: boolean;
}

export interface AutonomousTestCoverageModel {
  coverageTargets: string[];
  coveredCategories: AutonomousTestCategory[];
  missingCoverage: string[];
  coverageScore: number;
}

export interface AutonomousTestReport {
  reportId: string;
  planId: string;
  depth: AutonomousTestDepth;
  categories: AutonomousTestCategory[];
  requiredSuites: string[];
  optionalSuites: string[];
  coverageTargets: string[];
  executionOrder: string[];
  riskScore: number;
  confidence: number;
  readiness: AutonomousTestReadiness;
  estimatedDurationMs: number;
  estimatedCost: number;
  resultStatus?: AutonomousTestResultStatus;
  failureSignals: string[];
  reasoning: string[];
  generatedAt: number;
}

export interface AutonomousTestHistoryEntry {
  historyId: string;
  planId: string;
  depth: AutonomousTestDepth;
  readiness: AutonomousTestReadiness;
  resultStatus: AutonomousTestResultStatus;
  recordedAt: number;
}

export interface AutonomousTestRuntimeReport {
  registrySize: number;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
  optimizerReductions: number;
}

export const AUTONOMOUS_TESTING_QUESTION_SIGNALS = [
  'autonomous testing',
  'autonomous test plan',
  'test depth',
  'test suite',
  'testing readiness',
] as const;

export function isAutonomousTestingQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return AUTONOMOUS_TESTING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
