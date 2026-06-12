/**
 * Phase 24J — Autonomous Builder Execution Sandbox validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionPlannerAssessment } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  assessAutonomousRepairLoop,
  resetAutonomousRepairLoopModuleForTests,
} from '../src/autonomous-repair-loop/index.js';
import type { RepairLoopFinding } from '../src/autonomous-repair-loop/index.js';
import {
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN,
  SANDBOX_FORBIDDEN_ACTIONS,
  assessAutonomousBuilderExecutionSandbox,
  deriveSandboxEligibilityState,
  resetAutonomousBuilderExecutionSandboxModuleForTests,
} from '../src/autonomous-builder-execution-sandbox/index.js';

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
  'src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.ts',
  'src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-registry.ts',
  'src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-authority.ts',
  'src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-history.ts',
  'src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-report-builder.ts',
  'src/autonomous-builder-execution-sandbox/index.ts',
  'architecture/AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT.md',
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

function baseFinding(): RepairLoopFinding {
  return {
    findingId: 'finding-sandbox-1',
    severity: 'MEDIUM',
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
      problemId: 'prob-sandbox',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-sandbox',
      problemId: 'prob-sandbox',
      claimedFixType: 'AUTOFIX_SHELL',
      claimedFixDescription: 'Fixture',
      snapshot: {
        beforeState: 'Not clickable',
        afterState: 'Clickable',
        metricBefore: 3000,
        metricAfter: 400,
        originalFailureStillPresent: false,
        regressionObserved: false,
      },
      evidence: [],
      originalFailureRetested: true,
      causalLinkToFix: true,
    },
    executionProofScore: verdict === 'PROVEN_FIXED' ? 100 : 70,
    verdict,
    confidence: 'HIGH',
    originalFailureImproved: true,
    regressionDetected: false,
    proofStrongEnough: verdict === 'PROVEN_FIXED',
    fixDisposition: 'KEEP',
    scoreBreakdown: {
      originalFailureRetested: 30,
      beforeAfterEvidence: 20,
      independentConfirmation: 20,
      noRegression: 15,
      causalLink: 10,
      reusableMemory: 5,
    },
    authorityAnswers: {
      originalProblem: 'Shell not clickable',
      claimedFix: 'AUTOFIX_SHELL',
      beforeAfterSummary: 'Fixture',
      originalFailureGone: true,
      causallyTiedToFix: true,
      regressionAppeared: false,
      proofStrongEnough: true,
      recommendedAction: 'KEEP',
    },
    recommendations: [],
    cacheKey: 'fixture-sandbox-proof',
  };
}

function buildAcceptance(state: FounderAcceptanceAssessment['acceptanceState']): FounderAcceptanceAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Would a reasonable founder accept this project?',
    acceptanceState: state,
    acceptanceConfidence: state === 'ACCEPTED' ? 95 : 60,
    confidenceBreakdown: {
      authorityCoverage: 25,
      proofQuality: 22,
      simulationQuality: 18,
      requirementCompleteness: 15,
      founderReadiness: 14,
    },
    inputSnapshot: {
      founderTestAssessment: null as never,
      requiredAuthorities: [],
      missingRequiredAuthorities: [],
      founderTestScore: 90,
      founderTestVerdict: 'FOUNDER_READY',
      criticalBlockerCount: state === 'BLOCKED' ? 1 : 0,
      executionProofRegressionFree: true,
      executionProofScore: 90,
      executionProofVerdict: 'PROVEN_FIXED',
      founderSimulationPassed: true,
      founderSimulationScore: 88,
      requirementRealityAboveThreshold: true,
      requirementRealityScore: 85,
    },
    reasons: {
      acceptedBecause: state === 'ACCEPTED' ? ['Founder ready'] : [],
      rejectedBecause: [],
      warningReasons: [],
      blockingReasons: state === 'BLOCKED' ? ['Critical blocker'] : [],
      requiredNextActions: [],
    },
    cacheKey: 'fixture-sandbox-acceptance',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel, rollbackComplete = true): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-sandbox-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for sandbox validation',
    targetFinding: baseFinding(),
    repairDecision: 'APPLY_DIFFERENT_FIX',
    steps: [
      {
        stepId: 'step-1',
        order: 1,
        title: 'Diagnose',
        description: 'Diagnose root cause',
        readOnly: true,
      },
      {
        stepId: 'step-2',
        order: 2,
        title: 'Plan fix',
        description: 'Plan alternative fix path',
        readOnly: true,
      },
    ],
    expectedOutcome: 'Alternative fix path defined with proof requirements',
    verificationPlan: {
      validationStrategy: 'Run leaf validate scripts',
      executionProofStrategy: 'Retest original failure with before/after evidence',
      founderTestStrategy: 'Run read-only founder test integration',
      acceptanceStrategy: 'Run founder acceptance gate',
    },
    rollbackPlan: rollbackComplete
      ? {
          rollbackTrigger: 'Regression detected',
          rollbackMethod: 'Revert claimed fix path',
          rollbackSuccessCriteria: 'Baseline restored without regression',
        }
      : {
          rollbackTrigger: '',
          rollbackMethod: '',
          rollbackSuccessCriteria: '',
        },
    riskLevel,
    estimatedComplexity: 'MEDIUM',
    successCriteria: ['Verification complete', 'No regression', 'Acceptance not BLOCKED'],
  };
}

function buildPlannerAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
): ExecutionPlannerAssessment {
  resetAutonomousRepairLoopModuleForTests();
  const repairLoopAssessment = assessAutonomousRepairLoop({
    finding: baseFinding(),
    executionProofAssessment: proof ?? undefined,
    founderAcceptanceAssessment: acceptance ?? undefined,
  });

  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Given a repair decision: what exact plan should be executed?',
    inputSnapshot: {
      repairLoopAssessment,
      founderTestAssessment: repairLoopAssessment.inputSnapshot.founderTestAssessment,
      executionProofAssessment: proof,
      founderAcceptanceAssessment: acceptance,
    },
    plan,
    planExecutable: plan !== null,
    nonExecutableReason: plan === null ? 'No plan' : null,
    cacheKey: 'fixture-planner-sandbox',
  };
}

function main(): void {
  console.log('');
  console.log('Autonomous Builder Execution Sandbox — Validation (leaf mode)');
  console.log('===============================================================');
  console.log('');

  checkpoint('start');
  resetAutonomousBuilderExecutionSandboxModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-authority.ts');
  const registrySource = readText('src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-registry.ts');
  const reportMd = readText('architecture/AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:autonomous-builder-execution-sandbox']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessAutonomousBuilderExecutionSandbox'), 'authority');
  assert('03. sandbox boundaries defined', registrySource.includes('SANDBOX_FORBIDDEN_ACTIONS'), 'boundaries');
  assert('04. execution contract builder', authoritySource.includes('buildExecutionContract'), 'contract');
  assert('05. report pass token', reportMd.includes(AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN), 'token');
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert('08. live workspace prohibition', SANDBOX_FORBIDDEN_ACTIONS.some((a) => /live project workspace/i.test(a)), 'live ban');
  checkpoint('static checks');

  const eligible = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(
      buildPlan('LOW'),
      buildExecutionProof('PROVEN_FIXED'),
      buildAcceptance('ACCEPTED'),
    ),
  });
  assert(
    '09. eligible scenario',
    eligible.eligibilityState === 'ELIGIBLE' &&
      eligible.executionContract !== null &&
      eligible.executionContract.forbiddenActions.length >= 5,
    eligible.eligibilityState,
  );

  resetAutonomousBuilderExecutionSandboxModuleForTests();
  const warning = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(
      buildPlan('HIGH'),
      buildExecutionProof('PARTIALLY_PROVEN'),
      buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    ),
  });
  assert(
    '10. warning scenario',
    warning.eligibilityState === 'ELIGIBLE_WITH_WARNINGS' && warning.warningReasons.length > 0,
    warning.eligibilityState,
  );

  resetAutonomousBuilderExecutionSandboxModuleForTests();
  const blocked = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(
      buildPlan('CRITICAL'),
      buildExecutionProof('PROVEN_FIXED'),
      buildAcceptance('BLOCKED'),
    ),
  });
  assert(
    '11. blocked scenario',
    blocked.eligibilityState === 'BLOCKED' && blocked.blockingReasons.length > 0,
    blocked.eligibilityState,
  );

  resetAutonomousBuilderExecutionSandboxModuleForTests();
  const insufficient = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(buildPlan('MEDIUM'), null, null),
  });
  assert(
    '12. insufficient evidence scenario',
    insufficient.eligibilityState === 'INSUFFICIENT_EVIDENCE',
    insufficient.eligibilityState,
  );

  resetAutonomousBuilderExecutionSandboxModuleForTests();
  const missingRollback = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(
      buildPlan('MEDIUM', false),
      buildExecutionProof('PROVEN_FIXED'),
      buildAcceptance('ACCEPTED'),
    ),
  });
  assert(
    '13. missing rollback blocks',
    missingRollback.eligibilityState === 'BLOCKED',
    missingRollback.eligibilityState,
  );

  assert(
    '14. derive eligibility exported',
    deriveSandboxEligibilityState({
      plan: buildPlan('LOW'),
      planExecutable: true,
      missingAuthorities: [],
      founderAcceptanceBlocked: false,
      readiness: {
        rollbackReadinessPercent: 95,
        verificationReadinessPercent: 95,
        proofReadinessPercent: 95,
        executionReadinessPercent: 90,
        riskReadinessPercent: 95,
      },
    }) === 'ELIGIBLE',
    'derive',
  );

  resetAutonomousBuilderExecutionSandboxModuleForTests();
  const live = assessAutonomousBuilderExecutionSandbox({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '15. live assessment executes',
    live.eligibilityState.length > 0 && live.readinessReview.verificationReadinessPercent >= 0,
    `${live.eligibilityState} verification=${live.readinessReview.verificationReadinessPercent}%`,
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
    console.log('AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN);
  console.log('');
  console.log('Eligibility states verified:');
  console.log(`  ELIGIBLE:               ${eligible.eligibilityState}`);
  console.log(`  ELIGIBLE_WITH_WARNINGS: ${warning.eligibilityState}`);
  console.log(`  BLOCKED:                ${blocked.eligibilityState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:  ${insufficient.eligibilityState}`);
  console.log(`  Live repo:              ${live.eligibilityState}`);
  console.log('');
  console.log('Report: architecture/AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
