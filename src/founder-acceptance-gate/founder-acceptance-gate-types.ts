/**
 * Founder Acceptance Gate — core models.
 * High score ≠ acceptance. Acceptance requires quality, completeness, usability, proof, founder readiness.
 */

import type {
  FounderTestAssessment,
  FounderTestAuthorityId,
  FounderTestAuthorityResult,
} from '../founder-test-integration/founder-test-integration-types.js';
import type { FounderAcceptanceBridgeSnapshot } from '../foundation/founder-acceptance-integration-bridge.js';

export type FounderAcceptanceState =
  | 'ACCEPTED'
  | 'ACCEPTED_WITH_WARNINGS'
  | 'NOT_ACCEPTED'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type FounderAcceptanceRequiredAuthorityId = Extract<
  FounderTestAuthorityId,
  | 'FOUNDER_REALITY'
  | 'UI_REALITY'
  | 'REQUIREMENT_REALITY'
  | 'FOUNDER_SIMULATION'
  | 'EXECUTION_PROOF_EVOLUTION'
  | 'LAUNCH_COUNCIL'
>;

export interface FounderAcceptanceAuthoritySnapshot {
  authorityId: FounderAcceptanceRequiredAuthorityId;
  displayName: string;
  available: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
}

export interface FounderAcceptanceInputSnapshot {
  founderTestAssessment: FounderTestAssessment;
  requiredAuthorities: FounderAcceptanceAuthoritySnapshot[];
  missingRequiredAuthorities: string[];
  founderTestScore: number;
  founderTestVerdict: FounderTestAssessment['verdict'];
  criticalBlockerCount: number;
  executionProofRegressionFree: boolean;
  executionProofScore: number;
  executionProofVerdict: string | null;
  founderSimulationPassed: boolean;
  founderSimulationScore: number;
  requirementRealityAboveThreshold: boolean;
  requirementRealityScore: number;
  authoritativeAcceptanceBridge?: FounderAcceptanceBridgeSnapshot;
}

export interface FounderAcceptanceReasons {
  acceptedBecause: string[];
  rejectedBecause: string[];
  warningReasons: string[];
  blockingReasons: string[];
  requiredNextActions: string[];
}

export interface FounderAcceptanceConfidenceBreakdown {
  authorityCoverage: number;
  proofQuality: number;
  simulationQuality: number;
  requirementCompleteness: number;
  founderReadiness: number;
}

export interface FounderAcceptanceAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  acceptanceState: FounderAcceptanceState;
  acceptanceConfidence: number;
  confidenceBreakdown: FounderAcceptanceConfidenceBreakdown;
  inputSnapshot: FounderAcceptanceInputSnapshot;
  reasons: FounderAcceptanceReasons;
  cacheKey: string;
  authoritativeAcceptanceBridge?: FounderAcceptanceBridgeSnapshot;
}

export interface FounderAcceptanceReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: FounderAcceptanceAssessment;
  passToken: string;
}

export interface AssessFounderAcceptanceGateInput {
  /** Precomputed founder test assessment — preferred for tests and orchestration. */
  founderTestAssessment?: FounderTestAssessment;
  /** When assessment omitted, runs read-only founder test integration against rootDir. */
  rootDir?: string;
  projectId?: string;
  workspaceId?: string;
  governanceBlocked?: boolean;
  /** Skip running founder test integration — prevents recursion during launch proof hydration. */
  skipFounderTestIntegration?: boolean;
}

export interface FounderAcceptanceHistorySummary {
  totalAssessments: number;
  acceptedCount: number;
  acceptedWithWarningsCount: number;
  rejectedCount: number;
  blockedCount: number;
  insufficientEvidenceCount: number;
}

export type { FounderTestAuthorityResult };
