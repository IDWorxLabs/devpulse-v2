/**
 * Autonomous Repair Loop — gathers upstream read-only authority outputs.
 */

import type { AdaptiveAutoFixAssessment } from '../adaptive-autofix-intelligence/adaptive-autofix-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import { assessFounderAcceptanceGate } from '../founder-acceptance-gate/index.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type {
  AssessAutonomousRepairLoopInput,
  RepairLoopFinding,
  RepairLoopInputSnapshot,
  RepairLoopSeverity,
} from './autonomous-repair-loop-types.js';
import { getAttemptBudgetForSeverity } from './autonomous-repair-loop-registry.js';

function inferSeverityFromFounderTest(assessment: FounderTestAssessment): RepairLoopSeverity {
  if (assessment.summary.criticalBlockerCount > 0) return 'CRITICAL';
  if (assessment.verdict === 'BLOCKED') return 'CRITICAL';
  if (assessment.verdict === 'NOT_FOUNDER_READY') return 'HIGH';
  if (assessment.verdict === 'FOUNDER_READY_WITH_WARNINGS') return 'MEDIUM';
  return 'LOW';
}

function inferFindingFromFounderTest(assessment: FounderTestAssessment): RepairLoopFinding | null {
  const topBlocker = assessment.blockers[0] ?? assessment.findings.find((f) => f.severity === 'CRITICAL')?.summary;
  if (!topBlocker) return null;

  return {
    findingId: `finding-${assessment.run.runId}`,
    severity: inferSeverityFromFounderTest(assessment),
    summary: topBlocker,
    sourceAuthority: 'founder-test-integration',
    category: assessment.findings[0]?.category ?? 'INTEGRATION',
  };
}

function extractExecutionProofFromFounderTest(
  founderTestAssessment: FounderTestAssessment,
): ExecutionProofAssessment | null {
  const result = founderTestAssessment.run.authorityResults.find(
    (entry) => entry.authorityId === 'EXECUTION_PROOF_EVOLUTION',
  );
  if (!result?.available) return null;

  return {
    readOnly: true,
    advisoryOnly: true,
    problem: {
      problemId: 'repair-loop-portfolio',
      problemType: 'REPAIR_LOOP',
      originalFailingSignal: result.blockers[0] ?? founderTestAssessment.blockers[0] ?? 'Founder test finding',
      description: 'Execution proof snapshot from founder test integration',
    },
    attempt: {
      attemptId: `attempt-${founderTestAssessment.run.runId}`,
      problemId: 'repair-loop-portfolio',
      claimedFixType: 'AUTOFIX_RECOMMENDED',
      claimedFixDescription: 'Adaptive repair loop recommended fix — advisory only',
      snapshot: {
        beforeState: 'Pre-repair founder test state',
        afterState: `Post-repair founder test score ${founderTestAssessment.score.overall}/100`,
        metricBefore: null,
        metricAfter: founderTestAssessment.score.overall,
        originalFailureStillPresent: founderTestAssessment.verdict !== 'FOUNDER_READY',
        regressionObserved: result.regressionDetected,
      },
      evidence: [],
      originalFailureRetested: founderTestAssessment.summary.executionProofRegressionFree,
      causalLinkToFix: false,
    },
    executionProofScore: result.normalizedScore,
    verdict: (result.executionProofVerdict as ExecutionProofAssessment['verdict']) ?? 'NOT_PROVEN',
    confidence: result.normalizedScore >= 85 ? 'HIGH' : result.normalizedScore >= 65 ? 'MEDIUM' : 'LOW',
    originalFailureImproved: result.normalizedScore >= 65,
    regressionDetected: result.regressionDetected,
    proofStrongEnough: result.executionProofVerdict === 'PROVEN_FIXED',
    fixDisposition: result.regressionDetected ? 'REVERT' : 'RETRY',
    scoreBreakdown: {
      originalFailureRetested: 0,
      beforeAfterEvidence: 0,
      independentConfirmation: 0,
      noRegression: result.regressionDetected ? 0 : 15,
      causalLink: 0,
      reusableMemory: 0,
    },
    authorityAnswers: {
      originalProblem: result.blockers[0] ?? 'Portfolio finding',
      claimedFix: 'Adaptive AutoFix recommendation',
      beforeAfterSummary: `Score ${founderTestAssessment.score.overall}/100`,
      originalFailureGone: founderTestAssessment.verdict === 'FOUNDER_READY',
      causallyTiedToFix: false,
      regressionAppeared: result.regressionDetected,
      proofStrongEnough: result.executionProofVerdict === 'PROVEN_FIXED',
      recommendedAction: result.regressionDetected ? 'REVERT' : 'RETRY',
    },
    recommendations: result.recommendations,
    cacheKey: `repair-loop-proof:${founderTestAssessment.cacheKey}`,
  };
}

export function buildRepairLoopInputSnapshot(
  input: AssessAutonomousRepairLoopInput,
): RepairLoopInputSnapshot {
  const founderTestAssessment =
    input.founderTestAssessment ??
    (input.rootDir || input.founderAcceptanceAssessment
      ? assessFounderTestIntegration({ rootDir: input.rootDir ?? process.cwd() })
      : null);

  const founderAcceptanceAssessment =
    input.founderAcceptanceAssessment ??
    (founderTestAssessment
      ? assessFounderAcceptanceGate({ founderTestAssessment })
      : null);

  const executionProofAssessment =
    input.executionProofAssessment ??
    (founderTestAssessment ? extractExecutionProofFromFounderTest(founderTestAssessment) : null);

  const finding =
    input.finding ??
    (founderTestAssessment ? inferFindingFromFounderTest(founderTestAssessment) : null);

  const priorAttemptCount = input.priorAttemptCount ?? 0;
  const severity = finding?.severity ?? 'MEDIUM';
  const attemptBudget = getAttemptBudgetForSeverity(severity);
  const budgetExceeded = priorAttemptCount >= attemptBudget;

  const executionProofVerdict = executionProofAssessment?.verdict ?? null;
  const founderAcceptanceState = founderAcceptanceAssessment?.acceptanceState ?? null;

  return {
    finding,
    founderTestAssessment,
    adaptiveAutofixAssessment: input.adaptiveAutofixAssessment ?? null,
    executionProofAssessment,
    founderAcceptanceAssessment,
    executionProofVerdict,
    founderAcceptanceState,
    priorAttemptCount,
    attemptBudget,
    budgetExceeded,
    regressionPresent:
      executionProofVerdict === 'REGRESSION_DETECTED' ||
      executionProofAssessment?.regressionDetected === true,
    loopRiskPresent: executionProofVerdict === 'LOOP_RISK',
  };
}

export function collectAutonomousRepairLoopInputs(
  input: AssessAutonomousRepairLoopInput = {},
): RepairLoopInputSnapshot {
  return buildRepairLoopInputSnapshot(input);
}
