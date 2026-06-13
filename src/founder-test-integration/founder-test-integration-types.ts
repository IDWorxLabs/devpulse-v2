/**
 * Founder Test Integration — core models.
 * One button → one execution → one report → one founder verdict.
 */

import type {
  AssessFounderExecutionProofInput,
  FounderExecutionProofAssessment,
  FounderTestExecutionProofSummary,
} from '../founder-execution-proof/founder-execution-proof-types.js';

import type { FounderAcceptanceBridgeSnapshot } from '../foundation/founder-acceptance-integration-bridge.js';

export type FounderTestAuthorityId =
  | 'FOUNDER_REALITY'
  | 'UI_REALITY'
  | 'REQUIREMENT_REALITY'
  | 'FOUNDER_SIMULATION'
  | 'EXECUTION_PROOF_EVOLUTION'
  | 'LIVE_PREVIEW_REALITY'
  | 'MOBILE_RUNTIME_REALITY'
  | 'VERIFICATION_REALITY'
  | 'LAUNCH_COUNCIL';

export type FounderTestCategory =
  | 'WORKFLOW'
  | 'UI'
  | 'REQUIREMENTS'
  | 'SIMULATION'
  | 'EXECUTION_PROOF'
  | 'PREVIEW'
  | 'MOBILE'
  | 'VERIFICATION'
  | 'LAUNCH'
  | 'INTEGRATION';

export type FounderTestFindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FounderTestVerdict =
  | 'FOUNDER_READY'
  | 'FOUNDER_READY_WITH_WARNINGS'
  | 'NOT_FOUNDER_READY'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface FounderTestShellSources {
  html: string;
  appJs: string;
  css: string;
}

export interface FounderTestAuthorityResult {
  authorityId: FounderTestAuthorityId;
  displayName: string;
  sourceModule: string;
  readOnly: true;
  available: boolean;
  normalizedScore: number;
  weight: number;
  weightedContribution: number;
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  missingCapabilities: string[];
  criticalBlockerCount: number;
  regressionDetected: boolean;
  simulationPassed: boolean | null;
  executionProofVerdict: string | null;
}

export interface FounderTestFinding {
  findingId: string;
  category: FounderTestCategory;
  severity: FounderTestFindingSeverity;
  summary: string;
  sourceAuthority: FounderTestAuthorityId;
  recommendation: string | null;
}

export interface FounderTestScore {
  overall: number;
  byAuthority: Record<FounderTestAuthorityId, number>;
  weightedBreakdown: Record<FounderTestAuthorityId, number>;
}

export interface FounderTestSummary {
  participatingAuthorities: number;
  availableAuthorities: number;
  missingAuthorities: string[];
  criticalBlockerCount: number;
  warningCount: number;
  recommendationCount: number;
  founderSimulationPassed: boolean;
  executionProofRegressionFree: boolean;
  requirementRealityAboveThreshold: boolean;
}

export interface FounderTestRun {
  readOnly: true;
  runId: string;
  startedAt: string;
  completedAt: string;
  rootDir: string;
  authorityResults: FounderTestAuthorityResult[];
}

export interface FounderTestAssessment {
  readOnly: true;
  advisoryOnly: true;
  run: FounderTestRun;
  score: FounderTestScore;
  summary: FounderTestSummary;
  verdict: FounderTestVerdict;
  findings: FounderTestFinding[];
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  missingCapabilities: string[];
  cacheKey: string;
  portfolioAcceptanceBridge?: FounderAcceptanceBridgeSnapshot;
  /** Unified founder execution proof summary (Phase 25.31) — set by assessFounderTestIntegration. */
  executionProofSummary?: FounderTestExecutionProofSummary;
}

export interface FounderTestReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: FounderTestAssessment;
  passToken: string;
}

export interface RunFounderTestIntegrationInput {
  rootDir?: string;
  shellSources?: FounderTestShellSources;
  /** Inject authority results for tests — skips live authority execution when set. */
  authorityResults?: FounderTestAuthorityResult[];
  /** Optional connected execution assessments for founder execution proof aggregation. */
  founderExecutionProofInput?: AssessFounderExecutionProofInput;
  /** Pre-assessed proof — skips initial proof pass when injected (tests). */
  founderExecutionProofAssessment?: FounderExecutionProofAssessment;
  /** Pre-resolved executionConnected — skips resolver when injected (tests). */
  resolvedExecutionConnected?: boolean;
}

export interface FounderTestHistorySummary {
  totalRuns: number;
  readyRuns: number;
  warningRuns: number;
  blockedRuns: number;
  insufficientEvidenceRuns: number;
  notReadyRuns: number;
}
