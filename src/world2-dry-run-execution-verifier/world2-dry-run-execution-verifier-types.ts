/**
 * World 2 Dry-Run Execution Verifier — core models.
 * Independent verification of composed dry-run packages — no real execution or file mutations.
 */

import type { World2ChangeSetMaterializerAssessment } from '../world2-change-set-materializer/world2-change-set-materializer-types.js';
import type {
  AssessWorld2DryRunExecutionComposerInput,
  World2DryRunExecutionComposerAssessment,
} from '../world2-dry-run-execution-composer/world2-dry-run-execution-composer-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { World2RepositorySnapshotMaterializerAssessment } from '../world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js';

export type World2DryRunVerificationState =
  | 'VERIFIED'
  | 'VERIFIED_WITH_WARNINGS'
  | 'FAILED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_READY';

export interface World2DryRunOrderedStepCheck {
  readOnly: true;
  checkId: string;
  expectedStepId: string;
  expectedOrder: number;
  present: boolean;
  orderCorrect: boolean;
  passed: boolean;
  detail: string;
}

export interface World2DryRunVerificationSafetyCheck {
  readOnly: true;
  checkId: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface World2DryRunCoverageCheck {
  readOnly: true;
  checkId: string;
  label: string;
  covered: boolean;
  passed: boolean;
  detail: string;
}

export interface World2DryRunExecutionVerificationAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  verificationId: string;
  packageId: string | null;
  verificationState: World2DryRunVerificationState;
  orderedStepChecks: World2DryRunOrderedStepCheck[];
  safetyChecks: World2DryRunVerificationSafetyCheck[];
  validationCoverageChecks: World2DryRunCoverageCheck[];
  rollbackCoverageChecks: World2DryRunCoverageCheck[];
  auditCoverageChecks: World2DryRunCoverageCheck[];
  missingCoverage: string[];
  blockingReasons: string[];
  warningReasons: string[];
  readinessScore: number;
  realExecutionPerformed: false;
  inputSnapshot: World2DryRunExecutionVerifierInputSnapshot;
  cacheKey: string;
}

export interface World2DryRunExecutionVerifierInputSnapshot {
  composerAssessment: World2DryRunExecutionComposerAssessment;
  snapshotMaterializerAssessment: World2RepositorySnapshotMaterializerAssessment;
  changeSetMaterializerAssessment: World2ChangeSetMaterializerAssessment;
  engineAssessment: World2ExecutionEngineAssessment;
  missingAuthorities: string[];
}

export interface World2DryRunExecutionVerifierReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2DryRunExecutionVerificationAssessment;
  passToken: string;
}

export interface AssessWorld2DryRunExecutionVerifierInput extends AssessWorld2DryRunExecutionComposerInput {
  composerAssessment?: World2DryRunExecutionComposerAssessment;
}

export interface World2DryRunExecutionVerifierHistorySummary {
  totalAssessments: number;
  verifiedAssessments: number;
  verifiedWithWarningsAssessments: number;
  failedAssessments: number;
  insufficientEvidenceAssessments: number;
  notReadyAssessments: number;
}

export interface DryRunVerificationStateContext {
  missingAuthorities: string[];
  packageState: World2DryRunExecutionComposerAssessment['packageState'];
  verificationStateEligible: boolean;
  readinessScore: number;
  blockingReasonCount: number;
  criticalBlockerCount: number;
  hasExecutionPackage: boolean;
  upstreamBlocked: boolean;
}

export interface World2DryRunReadinessScoreBreakdown {
  orderedStepsScore: number;
  safetyChecksScore: number;
  validationCoverageScore: number;
  rollbackCoverageScore: number;
  auditCoverageScore: number;
  upstreamConsistencyScore: number;
  totalScore: number;
}
