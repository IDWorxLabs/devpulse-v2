/**
 * Phase 24H — Autonomous Repair Loop validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AdaptiveAutoFixAssessment } from '../src/adaptive-autofix-intelligence/adaptive-autofix-types.js';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  ATTEMPT_BUDGET_BY_SEVERITY,
  AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN,
  REPAIR_LOOP_ACTIONS,
  assessAutonomousRepairLoop,
  deriveRepairLoopAction,
  getAttemptBudgetForSeverity,
  resetAutonomousRepairLoopModuleForTests,
} from '../src/autonomous-repair-loop/index.js';
import type { RepairLoopFinding } from '../src/autonomous-repair-loop/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/autonomous-repair-loop/autonomous-repair-loop-types.ts',
  'src/autonomous-repair-loop/autonomous-repair-loop-registry.ts',
  'src/autonomous-repair-loop/autonomous-repair-loop-authority.ts',
  'src/autonomous-repair-loop/autonomous-repair-loop-orchestrator.ts',
  'src/autonomous-repair-loop/autonomous-repair-loop-history.ts',
  'src/autonomous-repair-loop/autonomous-repair-loop-report-builder.ts',
  'src/autonomous-repair-loop/index.ts',
  'architecture/AUTONOMOUS_REPAIR_LOOP_REPORT.md',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function baseFinding(severity: RepairLoopFinding['severity'] = 'MEDIUM'): RepairLoopFinding {
  return {
    findingId: 'finding-test-1',
    severity,
    summary: 'Shell click handler missing on primary control',
    sourceAuthority: 'founder-test-integration',
    category: 'WORKFLOW',
  };
}

function buildExecutionProof(verdict: ExecutionProofAssessment['verdict']): ExecutionProofAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    problem: {
      problemId: 'prob-test',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture problem',
    },
    attempt: {
      attemptId: 'attempt-test',
      problemId: 'prob-test',
      claimedFixType: 'AUTOFIX_SHELL',
      claimedFixDescription: 'Fixture fix',
      snapshot: {
        beforeState: 'Not clickable',
        afterState: verdict === 'REGRESSION_DETECTED' ? 'Feed disappeared' : 'Clickable',
        metricBefore: 3000,
        metricAfter: verdict === 'PROVEN_FIXED' ? 400 : 3000,
        originalFailureStillPresent: verdict !== 'PROVEN_FIXED',
        regressionObserved: verdict === 'REGRESSION_DETECTED',
      },
      evidence: [],
      originalFailureRetested: verdict === 'PROVEN_FIXED' || verdict === 'PARTIALLY_PROVEN',
      causalLinkToFix: verdict === 'PROVEN_FIXED',
    },
    executionProofScore: verdict === 'PROVEN_FIXED' ? 100 : verdict === 'PARTIALLY_PROVEN' ? 72 : 40,
    verdict,
    confidence: 'MEDIUM',
    originalFailureImproved: verdict === 'PROVEN_FIXED' || verdict === 'PARTIALLY_PROVEN',
    regressionDetected: verdict === 'REGRESSION_DETECTED',
    proofStrongEnough: verdict === 'PROVEN_FIXED',
    fixDisposition: verdict === 'REGRESSION_DETECTED' ? 'REVERT' : 'RETRY',
    scoreBreakdown: {
      originalFailureRetested: 30,
      beforeAfterEvidence: 20,
      independentConfirmation: 0,
      noRegression: verdict === 'REGRESSION_DETECTED' ? 0 : 15,
      causalLink: 0,
      reusableMemory: 0,
    },
    authorityAnswers: {
      originalProblem: 'Shell not clickable',
      claimedFix: 'AUTOFIX_SHELL',
      beforeAfterSummary: 'Before/after fixture',
      originalFailureGone: verdict === 'PROVEN_FIXED',
      causallyTiedToFix: verdict === 'PROVEN_FIXED',
      regressionAppeared: verdict === 'REGRESSION_DETECTED',
      proofStrongEnough: verdict === 'PROVEN_FIXED',
      recommendedAction: verdict === 'REGRESSION_DETECTED' ? 'REVERT' : 'RETRY',
    },
    recommendations: [],
    cacheKey: 'fixture-proof',
  };
}

function buildAcceptance(state: FounderAcceptanceAssessment['acceptanceState']): FounderAcceptanceAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Would a reasonable founder accept this project?',
    acceptanceState: state,
    acceptanceConfidence: state === 'ACCEPTED' ? 95 : 50,
    confidenceBreakdown: {
      authorityCoverage: 25,
      proofQuality: 20,
      simulationQuality: 18,
      requirementCompleteness: 14,
      founderReadiness: 14,
    },
    inputSnapshot: {
      founderTestAssessment: null as never,
      requiredAuthorities: [],
      missingRequiredAuthorities: [],
      founderTestScore: state === 'ACCEPTED' ? 91 : 55,
      founderTestVerdict: state === 'ACCEPTED' ? 'FOUNDER_READY' : 'NOT_FOUNDER_READY',
      criticalBlockerCount: state === 'BLOCKED' ? 1 : 0,
      executionProofRegressionFree: state !== 'BLOCKED',
      executionProofScore: 90,
      executionProofVerdict: 'PROVEN_FIXED',
      founderSimulationPassed: true,
      founderSimulationScore: 88,
      requirementRealityAboveThreshold: true,
      requirementRealityScore: 80,
    },
    reasons: {
      acceptedBecause: state === 'ACCEPTED' ? ['Founder ready'] : [],
      rejectedBecause: state === 'BLOCKED' ? ['Critical blocker'] : [],
      warningReasons: [],
      blockingReasons: state === 'BLOCKED' ? ['Critical workflow break'] : [],
      requiredNextActions: [],
    },
    cacheKey: 'fixture-acceptance',
  };
}

function buildAdaptiveAutofix(): AdaptiveAutoFixAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    adaptiveAutoFixScore: 72,
    repeatedFailureCount: 1,
    capabilityGapCount: 1,
    evolutionRequiredCount: 0,
    estimatedFailureReduction: 15,
    autofixReadiness: 'LIMITED_AUTOFIX',
    missingCapabilities: ['Stronger before/after proof collector'],
    recommendations: [],
    blocksLaunchReadiness: false,
    triggeredAdaptiveAutofix: true,
    failureCategories: ['UI_FAILURE'],
    failureRecords: [],
    capabilityGaps: [],
    cacheKey: 'fixture-autofix',
  };
}

function main(): void {
  console.log('');
  console.log('Autonomous Repair Loop — Validation (leaf mode)');
  console.log('===============================================');
  console.log('');

  checkpoint('start');
  resetAutonomousRepairLoopModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/autonomous-repair-loop/autonomous-repair-loop-authority.ts');
  const registrySource = readText('src/autonomous-repair-loop/autonomous-repair-loop-registry.ts');
  const orchestratorSource = readText('src/autonomous-repair-loop/autonomous-repair-loop-orchestrator.ts');
  const reportMd = readText('architecture/AUTONOMOUS_REPAIR_LOOP_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:autonomous-repair-loop']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessAutonomousRepairLoop'), 'authority');
  assert('03. seven repair actions', REPAIR_LOOP_ACTIONS.length === 7, String(REPAIR_LOOP_ACTIONS.length));
  assert('04. attempt budgets defined', registrySource.includes('ATTEMPT_BUDGET_BY_SEVERITY'), 'budgets');
  assert('05. report pass token', reportMd.includes(AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN), 'report token');
  assert('06. no nested npm validation', !orchestratorSource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !orchestratorSource.includes('fetch('), 'network');
  assert('08. read-only advisory', authoritySource.includes('advisoryOnly: true'), 'advisory');
  checkpoint('static checks');

  const accepted = assessAutonomousRepairLoop({
    finding: baseFinding('LOW'),
    executionProofAssessment: buildExecutionProof('PROVEN_FIXED'),
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED'),
    adaptiveAutofixAssessment: buildAdaptiveAutofix(),
  });
  assert(
    '09. accepted path',
    accepted.decision.recommendedAction === 'ACCEPT_FIX' && accepted.decision.loopState === 'ACCEPTED',
    `${accepted.decision.recommendedAction} / ${accepted.decision.loopState}`,
  );

  resetAutonomousRepairLoopModuleForTests();
  const retry = assessAutonomousRepairLoop({
    finding: baseFinding(),
    executionProofAssessment: buildExecutionProof('PARTIALLY_PROVEN'),
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  });
  assert('10. retry/retest path', retry.decision.recommendedAction === 'RETEST', retry.decision.recommendedAction);

  resetAutonomousRepairLoopModuleForTests();
  const differentFix = assessAutonomousRepairLoop({
    finding: baseFinding(),
    executionProofAssessment: buildExecutionProof('NOT_PROVEN'),
    founderAcceptanceAssessment: buildAcceptance('NOT_ACCEPTED'),
  });
  assert(
    '11. different fix path',
    differentFix.decision.recommendedAction === 'APPLY_DIFFERENT_FIX',
    differentFix.decision.recommendedAction,
  );

  resetAutonomousRepairLoopModuleForTests();
  const revert = assessAutonomousRepairLoop({
    finding: baseFinding('HIGH'),
    executionProofAssessment: buildExecutionProof('REGRESSION_DETECTED'),
    founderAcceptanceAssessment: buildAcceptance('NOT_ACCEPTED'),
  });
  assert(
    '12. revert path',
    revert.decision.recommendedAction === 'REVERT_FIX' && revert.decision.loopState === 'FAILED',
    revert.decision.recommendedAction,
  );

  resetAutonomousRepairLoopModuleForTests();
  const escalateLoop = assessAutonomousRepairLoop({
    finding: baseFinding('CRITICAL'),
    executionProofAssessment: buildExecutionProof('LOOP_RISK'),
    founderAcceptanceAssessment: buildAcceptance('NOT_ACCEPTED'),
  });
  assert(
    '13. escalation path (loop risk)',
    escalateLoop.decision.recommendedAction === 'ESCALATE' &&
      escalateLoop.decision.escalationGuidance !== null,
    escalateLoop.decision.recommendedAction,
  );

  resetAutonomousRepairLoopModuleForTests();
  const escalateBlocked = assessAutonomousRepairLoop({
    finding: baseFinding('HIGH'),
    executionProofAssessment: buildExecutionProof('PROVEN_FIXED'),
    founderAcceptanceAssessment: buildAcceptance('BLOCKED'),
  });
  assert(
    '14. escalation path (blocked acceptance)',
    escalateBlocked.decision.recommendedAction === 'ESCALATE',
    escalateBlocked.decision.recommendedAction,
  );

  resetAutonomousRepairLoopModuleForTests();
  const budgetMax = getAttemptBudgetForSeverity('LOW');
  const budgetExceeded = assessAutonomousRepairLoop({
    finding: baseFinding('LOW'),
    executionProofAssessment: buildExecutionProof('NOT_PROVEN'),
    founderAcceptanceAssessment: buildAcceptance('NOT_ACCEPTED'),
    priorAttemptCount: budgetMax,
  });
  assert(
    '15. budget enforcement',
    budgetExceeded.inputSnapshot.budgetExceeded &&
      budgetExceeded.decision.recommendedAction === 'ESCALATE' &&
      ATTEMPT_BUDGET_BY_SEVERITY.LOW === 2,
    `${budgetExceeded.decision.recommendedAction} attempts=${budgetExceeded.inputSnapshot.priorAttemptCount}/${budgetExceeded.inputSnapshot.attemptBudget}`,
  );

  assert(
    '16. derive action exported',
    deriveRepairLoopAction({
      findingPresent: true,
      budgetExceeded: false,
      priorAttemptCount: 0,
      attemptBudget: 3,
      executionProofVerdict: 'INSUFFICIENT_EVIDENCE',
      founderAcceptanceState: 'NOT_ACCEPTED',
      regressionPresent: false,
      loopRiskPresent: false,
    }).action === 'RETRY_FIX',
    'derive',
  );

  resetAutonomousRepairLoopModuleForTests();
  const live = assessAutonomousRepairLoop({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '17. live assessment executes',
    live.decision.recommendedAction.length > 0 && live.inputSnapshot.finding !== null,
    `${live.decision.recommendedAction} state=${live.decision.loopState}`,
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('AUTONOMOUS_REPAIR_LOOP_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN);
  console.log('');
  console.log('Decision paths verified:');
  console.log(`  ACCEPT_FIX:           ${accepted.decision.recommendedAction}`);
  console.log(`  RETEST:               ${retry.decision.recommendedAction}`);
  console.log(`  APPLY_DIFFERENT_FIX:  ${differentFix.decision.recommendedAction}`);
  console.log(`  REVERT_FIX:           ${revert.decision.recommendedAction}`);
  console.log(`  ESCALATE (loop risk): ${escalateLoop.decision.recommendedAction}`);
  console.log(`  Live repo:            ${live.decision.recommendedAction} (${live.decision.loopState})`);
  console.log('');
  console.log('Report: architecture/AUTONOMOUS_REPAIR_LOOP_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
