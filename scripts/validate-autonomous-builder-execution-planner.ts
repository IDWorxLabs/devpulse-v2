/**
 * Phase 24I — Autonomous Builder Execution Planner validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  assessAutonomousRepairLoop,
  resetAutonomousRepairLoopModuleForTests,
} from '../src/autonomous-repair-loop/index.js';
import type { RepairLoopFinding } from '../src/autonomous-repair-loop/index.js';
import {
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN,
  EXECUTION_PLAN_TYPES,
  assessAutonomousBuilderExecutionPlanner,
  buildExecutionPlan,
  resetAutonomousBuilderExecutionPlannerModuleForTests,
} from '../src/autonomous-builder-execution-planner/index.js';

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
  'src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.ts',
  'src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-registry.ts',
  'src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-authority.ts',
  'src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-history.ts',
  'src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-report-builder.ts',
  'src/autonomous-builder-execution-planner/index.ts',
  'architecture/AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT.md',
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
    findingId: 'finding-planner-1',
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
      problemId: 'prob-planner',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-planner',
      problemId: 'prob-planner',
      claimedFixType: 'AUTOFIX_SHELL',
      claimedFixDescription: 'Fixture',
      snapshot: {
        beforeState: 'Not clickable',
        afterState: verdict === 'REGRESSION_DETECTED' ? 'Regression' : 'Clickable',
        metricBefore: 3000,
        metricAfter: verdict === 'PROVEN_FIXED' ? 400 : 3000,
        originalFailureStillPresent: verdict !== 'PROVEN_FIXED',
        regressionObserved: verdict === 'REGRESSION_DETECTED',
      },
      evidence: [],
      originalFailureRetested: true,
      causalLinkToFix: false,
    },
    executionProofScore: 70,
    verdict,
    confidence: 'MEDIUM',
    originalFailureImproved: verdict === 'PROVEN_FIXED',
    regressionDetected: verdict === 'REGRESSION_DETECTED',
    proofStrongEnough: verdict === 'PROVEN_FIXED',
    fixDisposition: 'RETRY',
    scoreBreakdown: {
      originalFailureRetested: 30,
      beforeAfterEvidence: 20,
      independentConfirmation: 0,
      noRegression: 15,
      causalLink: 0,
      reusableMemory: 0,
    },
    authorityAnswers: {
      originalProblem: 'Shell not clickable',
      claimedFix: 'AUTOFIX_SHELL',
      beforeAfterSummary: 'Fixture',
      originalFailureGone: verdict === 'PROVEN_FIXED',
      causallyTiedToFix: false,
      regressionAppeared: verdict === 'REGRESSION_DETECTED',
      proofStrongEnough: verdict === 'PROVEN_FIXED',
      recommendedAction: 'RETRY',
    },
    recommendations: [],
    cacheKey: 'fixture-planner-proof',
  };
}

function buildAcceptance(state: FounderAcceptanceAssessment['acceptanceState']): FounderAcceptanceAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Would a reasonable founder accept this project?',
    acceptanceState: state,
    acceptanceConfidence: 80,
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
      founderTestScore: 80,
      founderTestVerdict: 'FOUNDER_READY_WITH_WARNINGS',
      criticalBlockerCount: state === 'BLOCKED' ? 1 : 0,
      executionProofRegressionFree: true,
      executionProofScore: 80,
      executionProofVerdict: 'PARTIALLY_PROVEN',
      founderSimulationPassed: true,
      founderSimulationScore: 80,
      requirementRealityAboveThreshold: true,
      requirementRealityScore: 80,
    },
    reasons: {
      acceptedBecause: [],
      rejectedBecause: [],
      warningReasons: [],
      blockingReasons: [],
      requiredNextActions: [],
    },
    cacheKey: 'fixture-planner-acceptance',
  };
}

function buildRepairLoop(verdict: ExecutionProofAssessment['verdict'], acceptance: FounderAcceptanceAssessment['acceptanceState']) {
  resetAutonomousRepairLoopModuleForTests();
  return assessAutonomousRepairLoop({
    finding: baseFinding(),
    executionProofAssessment: buildExecutionProof(verdict),
    founderAcceptanceAssessment: buildAcceptance(acceptance),
  });
}

function planHasVerification(plan: NonNullable<ReturnType<typeof buildExecutionPlan>>): boolean {
  return (
    plan.verificationPlan.validationStrategy.length > 0 &&
    plan.verificationPlan.executionProofStrategy.length > 0 &&
    plan.verificationPlan.founderTestStrategy.length > 0 &&
    plan.verificationPlan.acceptanceStrategy.length > 0
  );
}

function planHasRollback(plan: NonNullable<ReturnType<typeof buildExecutionPlan>>): boolean {
  return (
    plan.rollbackPlan.rollbackTrigger.length > 0 &&
    plan.rollbackPlan.rollbackMethod.length > 0 &&
    plan.rollbackPlan.rollbackSuccessCriteria.length > 0
  );
}

function main(): void {
  console.log('');
  console.log('Autonomous Builder Execution Planner — Validation (leaf mode)');
  console.log('================================================================');
  console.log('');

  checkpoint('start');
  resetAutonomousBuilderExecutionPlannerModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-authority.ts');
  const registrySource = readText('src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-registry.ts');
  const reportMd = readText('architecture/AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:autonomous-builder-execution-planner']), 'package.json');
  assert('02. buildExecutionPlan export', authoritySource.includes('buildExecutionPlan'), 'authority');
  assert('03. six plan types', EXECUTION_PLAN_TYPES.length === 6, String(EXECUTION_PLAN_TYPES.length));
  assert('04. verification required', authoritySource.includes('buildVerificationPlan'), 'verification');
  assert('05. rollback required', authoritySource.includes('buildRollbackPlan'), 'rollback');
  assert('06. report pass token', reportMd.includes(AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN), 'token');
  assert('07. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('08. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert('09. read-only plans', authoritySource.includes('readOnly: true'), 'read-only');
  assert('10. decision mapping', registrySource.includes('RETRY_FIX') && registrySource.includes('VALIDATION_PLAN'), 'mapping');
  checkpoint('static checks');

  const validationRepair = buildRepairLoop('INSUFFICIENT_EVIDENCE', 'NOT_ACCEPTED');
  const validationPlan = buildExecutionPlan({ repairLoopAssessment: validationRepair });
  assert(
    '11. validation plan path',
    validationPlan?.planType === 'VALIDATION_PLAN' &&
      planHasVerification(validationPlan!) &&
      planHasRollback(validationPlan!),
    validationPlan?.planType ?? 'null',
  );

  resetAutonomousBuilderExecutionPlannerModuleForTests();
  const fixRepair = assessAutonomousRepairLoop({
    finding: baseFinding(),
    executionProofAssessment: buildExecutionProof('NOT_PROVEN'),
    founderAcceptanceAssessment: buildAcceptance('NOT_ACCEPTED'),
  });
  const fixPlan = buildExecutionPlan({ repairLoopAssessment: fixRepair });
  assert('12. fix plan path', fixPlan?.planType === 'FIX_PLAN', fixPlan?.planType ?? 'null');

  resetAutonomousBuilderExecutionPlannerModuleForTests();
  const rollbackRepair = assessAutonomousRepairLoop({
    finding: { ...baseFinding(), severity: 'HIGH' },
    executionProofAssessment: buildExecutionProof('REGRESSION_DETECTED'),
    founderAcceptanceAssessment: buildAcceptance('NOT_ACCEPTED'),
  });
  const rollbackPlan = buildExecutionPlan({ repairLoopAssessment: rollbackRepair });
  assert(
    '13. rollback plan path',
    rollbackPlan?.planType === 'ROLLBACK_PLAN' && rollbackPlan.riskLevel === 'HIGH',
    rollbackPlan?.planType ?? 'null',
  );

  resetAutonomousBuilderExecutionPlannerModuleForTests();
  const escalateRepair = assessAutonomousRepairLoop({
    finding: { ...baseFinding(), severity: 'CRITICAL' },
    executionProofAssessment: buildExecutionProof('LOOP_RISK'),
    founderAcceptanceAssessment: buildAcceptance('BLOCKED'),
  });
  const escalatePlan = buildExecutionPlan({ repairLoopAssessment: escalateRepair });
  assert(
    '14. escalation plan path',
    escalatePlan?.planType === 'ESCALATION_PLAN' && escalatePlan.steps.length >= 3,
    escalatePlan?.planType ?? 'null',
  );

  resetAutonomousBuilderExecutionPlannerModuleForTests();
  const retestRepair = assessAutonomousRepairLoop({
    finding: baseFinding(),
    executionProofAssessment: buildExecutionProof('PARTIALLY_PROVEN'),
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  });
  const retestPlan = buildExecutionPlan({ repairLoopAssessment: retestRepair });
  assert('15. retest plan path', retestPlan?.planType === 'RETEST_PLAN', retestPlan?.planType ?? 'null');

  resetAutonomousBuilderExecutionPlannerModuleForTests();
  const assessment = assessAutonomousBuilderExecutionPlanner({
    repairLoopAssessment: fixRepair,
  });
  assert(
    '16. assess planner works',
    assessment.planExecutable && assessment.plan !== null && assessment.plan.steps.length > 0,
    String(assessment.plan?.steps.length ?? 0),
  );

  resetAutonomousBuilderExecutionPlannerModuleForTests();
  const live = assessAutonomousBuilderExecutionPlanner({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '17. live assessment executes',
    live.plan === null || (planHasVerification(live.plan) && planHasRollback(live.plan)),
    live.plan?.planType ?? 'none',
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
    console.log('AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN);
  console.log('');
  console.log('Plan paths verified:');
  console.log(`  VALIDATION_PLAN: ${validationPlan?.planType}`);
  console.log(`  FIX_PLAN:        ${fixPlan?.planType}`);
  console.log(`  ROLLBACK_PLAN:   ${rollbackPlan?.planType}`);
  console.log(`  ESCALATION_PLAN: ${escalatePlan?.planType}`);
  console.log(`  RETEST_PLAN:     ${retestPlan?.planType}`);
  console.log(`  Live repo:       ${live.plan?.planType ?? 'none'}`);
  console.log('');
  console.log('Report: architecture/AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
