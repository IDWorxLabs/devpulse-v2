/**
 * Phase 26.70 — Founder Test Consistency Audit types (V1).
 * Read-only cross-authority truth reconciliation.
 */

import type { ChatIntelligenceRealityAssessment } from '../chat-intelligence-reality/chat-intelligence-reality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { FounderExecutionProofAssessment } from '../founder-execution-proof/founder-execution-proof-types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { PromiseRealityEngineAssessment } from '../promise-reality-engine/promise-reality-engine-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import type { CapabilityTruthRegistry } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-types.js';
import type { ExecutionProofSynchronizationReport } from '../founder-test-integration/execution-proof-contradiction-detector.js';
import type { ConsistencyAuthoritativeEvidence } from './resolve-consistency-authoritative-evidence.js';

export type ConsistencyVerdict = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN' | 'UNKNOWN';

export type ConsistencyRootCause =
  | 'STALE_EVIDENCE'
  | 'SCORING_DEFECT'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'AUTHORITY_DISAGREEMENT'
  | 'REAL_PRODUCT_GAP'
  | 'UNKNOWN';

export type ConsistencyFailureKind =
  | 'CONSISTENCY_FAILURE'
  | 'SCORING_DEFECT'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'AUTHORITY_DISAGREEMENT'
  | 'REAL_PRODUCT_GAP';

export type AuditedClaimId =
  | 'AIDEVENGINE_BUILDS_APPLICATIONS'
  | 'WORLD2_EXECUTES_PLANS'
  | 'LIVE_PREVIEW_RUNS_APPLICATIONS'
  | 'APPLICATION_WORKS'
  | 'APPLICATION_RUNS'
  | 'APPLICATION_REACHABLE'
  | 'FOUNDER_CAN_USE_APPLICATION'
  | 'VERIFICATION_PROVES_READINESS'
  | 'IDEA_TO_LAUNCH'
  | 'CHAT_INTELLIGENCE_READINESS'
  | 'LAUNCH_DAY_READINESS'
  | 'AUTONOMOUS_BUILD_EXECUTION_PROOF'
  | 'LAUNCH_READINESS_VERDICT';

export interface AuthorityVerdictRecord {
  readOnly: true;
  authorityId: string;
  displayName: string;
  verdict: ConsistencyVerdict;
  score: number | null;
  detail: string;
  evidenceSource: string;
}

export interface ConsistencyClaimAudit {
  readOnly: true;
  claimId: AuditedClaimId;
  claim: string;
  chatVerdict: ConsistencyVerdict;
  founderTestVerdict: ConsistencyVerdict;
  authorityVerdicts: AuthorityVerdictRecord[];
  evidenceSources: string[];
  contradictionDetected: boolean;
  contradictionReason: string;
  rootCause: ConsistencyRootCause;
  finalTruth: ConsistencyVerdict;
  confidence: number;
  failureKinds: ConsistencyFailureKind[];
}

export interface FounderTruthMatrixRow {
  readOnly: true;
  claim: string;
  claimId: AuditedClaimId;
  finalTruth: ConsistencyVerdict;
  rootCause: ConsistencyRootCause;
  confidence: number;
  contradictionDetected: boolean;
}

export interface FounderTruthMatrix {
  readOnly: true;
  generatedAt: string;
  coreQuestion: string;
  rows: FounderTruthMatrixRow[];
  authoritativeNote: string;
}

export interface ConsistencyAuditSections {
  readOnly: true;
  contradictionsDetected: string[];
  scoringDefects: string[];
  evidencePropagationFailures: string[];
  authorityDisagreements: string[];
  realProductGaps: string[];
  singleSourceOfTruth: string[];
}

export interface FounderTestConsistencyAuditInputSnapshot {
  readOnly: true;
  founderTestAvailable: boolean;
  chatIntelligenceAvailable: boolean;
  promiseRealityAvailable: boolean;
  executionProofAvailable: boolean;
  launchReadinessAvailable: boolean;
  productReadinessAvailable: boolean;
  chatStressAvailable: boolean;
  autonomousBuildProofAvailable: boolean;
  executionChainTruthAvailable: boolean;
}

export interface FounderTestConsistencyAuditReport {
  readOnly: true;
  advisoryOnly: true;
  auditId: string;
  generatedAt: string;
  coreQuestion: string;
  claimAudits: ConsistencyClaimAudit[];
  truthMatrix: FounderTruthMatrix;
  sections: ConsistencyAuditSections;
  contradictionCount: number;
  scoringDefectCount: number;
  propagationFailureCount: number;
  authorityDisagreementCount: number;
  realProductGapCount: number;
  overallConfidence: number;
  founderAnswerSummary: {
    whatIsTrueNow: string;
    whatIsBrokenNow: string;
    wrongAuthorityWhenDisagree: string;
    productGapVsTestingGap: string;
  };
}

export interface FounderTestConsistencyAuditAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: FounderTestConsistencyAuditReport;
  cacheKey: string;
}

export interface AssessFounderTestConsistencyAuditInput {
  rootDir?: string;
  founderTestAssessment?: FounderTestAssessment;
  chatIntelligenceReality?: ChatIntelligenceRealityAssessment;
  chatStressSimulation?: ChatStressSimulationReport | null;
  promiseRealityEngine?: PromiseRealityEngineAssessment | null;
  founderExecutionProof?: FounderExecutionProofAssessment;
  launchReadiness?: FounderTestLaunchReadinessAssessment;
  productReadiness?: ProductReadinessReport | null;
  autonomousBuildExecutionProof?: AutonomousBuildExecutionProofReport | null;
  executionChainTruth?: ConnectedExecutionChainTruth;
  capabilityTruthRegistry?: CapabilityTruthRegistry;
  executionProofSync?: ExecutionProofSynchronizationReport;
  authoritativeEvidence?: ConsistencyAuthoritativeEvidence | null;
  skipAuthoritativeBridgeAssessment?: boolean;
}

export interface FounderTestConsistencyAuditHistoryEntry {
  readOnly: true;
  auditId: string;
  generatedAt: string;
  contradictionCount: number;
  overallConfidence: number;
  cacheKey: string;
}
