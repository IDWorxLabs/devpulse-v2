/**
 * Phase 24K — World 2 Controlled Execution Runtime validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionPlannerAssessment } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { SandboxExecutionAssessment } from '../src/autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.js';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  assessAutonomousBuilderExecutionSandbox,
  resetAutonomousBuilderExecutionSandboxModuleForTests,
} from '../src/autonomous-builder-execution-sandbox/index.js';
import {
  assessAutonomousRepairLoop,
  resetAutonomousRepairLoopModuleForTests,
} from '../src/autonomous-repair-loop/index.js';
import type { RepairLoopFinding } from '../src/autonomous-repair-loop/index.js';
import {
  MAX_ATTEMPTS,
  MAX_REPAIRS,
  MAX_RUNTIME_MS,
  MAX_SANDBOX_FAILURES,
  MAX_VALIDATIONS,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN,
  WORLD2_FORBIDDEN_ACTIONS,
  assessWorld2ControlledExecutionRuntime,
  deriveWorld2ExecutionState,
  deriveWorld2TerminationAssessment,
  resetWorld2ControlledExecutionRuntimeModuleForTests,
} from '../src/world2-controlled-execution-runtime/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_VALIDATOR_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.ts',
  'src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-registry.ts',
  'src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-authority.ts',
  'src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-history.ts',
  'src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-report-builder.ts',
  'src/world2-controlled-execution-runtime/index.ts',
  'architecture/WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT.md',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_VALIDATOR_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_VALIDATOR_RUNTIME_MS}ms)`);
  }
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function baseFinding(): RepairLoopFinding {
  return {
    findingId: 'finding-world2-1',
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
      problemId: 'prob-world2',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-world2',
      problemId: 'prob-world2',
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
    cacheKey: 'fixture-world2-proof',
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
    cacheKey: 'fixture-world2-acceptance',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel, rollbackComplete = true): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-world2-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for World 2 validation',
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
    cacheKey: 'fixture-planner-world2',
  };
}

function buildSandboxAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
): SandboxExecutionAssessment {
  resetAutonomousBuilderExecutionSandboxModuleForTests();
  return assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance),
  });
}

function main(): void {
  console.log('');
  console.log('World 2 Controlled Execution Runtime — Validation (leaf mode)');
  console.log('==============================================================');
  console.log('');

  checkpoint('start');
  resetWorld2ControlledExecutionRuntimeModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-authority.ts');
  const registrySource = readText('src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-registry.ts');
  const reportMd = readText('architecture/WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:world2-controlled-execution-runtime']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessWorld2ControlledExecutionRuntime'), 'authority');
  assert('03. runtime limits defined', registrySource.includes('MAX_RUNTIME_MS') && registrySource.includes('MAX_ATTEMPTS'), 'limits');
  assert('04. execution contract builder', authoritySource.includes('buildWorld2ExecutionContract'), 'contract');
  assert('05. termination authority exists', authoritySource.includes('deriveWorld2TerminationAssessment'), 'termination');
  assert('06. report pass token', reportMd.includes(WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN), 'token');
  assert('07. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('08. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert(
    '09. live workspace prohibition',
    WORLD2_FORBIDDEN_ACTIONS.some((a) => /live DevPulse workspace/i.test(a)),
    'live ban',
  );
  checkpoint('static checks');

  resetWorld2ControlledExecutionRuntimeModuleForTests();
  const readySandbox = buildSandboxAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
  );
  const ready = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: readySandbox });
  assert(
    '10. ready scenario',
    ready.executionState === 'READY_FOR_WORLD2' &&
      ready.executionContract !== null &&
      ready.executionContract.resourceLimits.maxAttempts === MAX_ATTEMPTS,
    ready.executionState,
  );

  resetWorld2ControlledExecutionRuntimeModuleForTests();
  const restrictedSandbox = buildSandboxAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  );
  const restricted = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: restrictedSandbox });
  assert(
    '11. restricted scenario',
    restricted.executionState === 'READY_WITH_RESTRICTIONS' && restricted.warningReasons.length > 0,
    restricted.executionState,
  );

  resetWorld2ControlledExecutionRuntimeModuleForTests();
  const blockedSandbox = buildSandboxAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
  );
  const blocked = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: blockedSandbox });
  assert(
    '12. blocked scenario',
    blocked.executionState === 'BLOCKED' && blocked.blockingReasons.length > 0,
    blocked.executionState,
  );

  resetWorld2ControlledExecutionRuntimeModuleForTests();
  const insufficientSandbox = buildSandboxAssessment(buildPlan('MEDIUM'), null, null);
  const insufficient = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: insufficientSandbox });
  assert(
    '13. insufficient evidence scenario',
    insufficient.executionState === 'INSUFFICIENT_EVIDENCE',
    insufficient.executionState,
  );

  assert(
    '14. derive execution state exported',
    deriveWorld2ExecutionState({
      sandboxAssessment: readySandbox,
      plan: buildPlan('LOW'),
      planExecutable: true,
      missingAuthorities: [],
      founderAcceptanceBlocked: false,
      sandboxContractPresent: true,
    }) === 'READY_FOR_WORLD2',
    'derive',
  );

  assert(
    '15. termination authority exported',
    deriveWorld2TerminationAssessment({
      repairLoopAssessment: ready.inputSnapshot.repairLoopAssessment,
      sandboxAssessment: readySandbox,
      executionState: 'READY_FOR_WORLD2',
      founderAcceptanceBlocked: false,
    }).decision === 'CONTINUE',
    'termination',
  );

  assert(
    '16. runtime limits bounded',
    MAX_RUNTIME_MS > 0 &&
      MAX_ATTEMPTS <= 10 &&
      MAX_VALIDATIONS <= 20 &&
      MAX_REPAIRS <= 10 &&
      MAX_SANDBOX_FAILURES <= 10,
    `${MAX_RUNTIME_MS}/${MAX_ATTEMPTS}/${MAX_VALIDATIONS}`,
  );

  resetWorld2ControlledExecutionRuntimeModuleForTests();
  const live = assessWorld2ControlledExecutionRuntime({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '17. live assessment executes',
    live.executionState.length > 0 && live.terminationAssessment.decision.length > 0,
    `${live.executionState} termination=${live.terminationAssessment.decision}`,
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
    console.log('WORLD2_CONTROLLED_EXECUTION_RUNTIME_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN);
  console.log('');
  console.log('Execution states verified:');
  console.log(`  READY_FOR_WORLD2:       ${ready.executionState}`);
  console.log(`  READY_WITH_RESTRICTIONS: ${restricted.executionState}`);
  console.log(`  BLOCKED:                ${blocked.executionState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:  ${insufficient.executionState}`);
  console.log(`  Live repo:              ${live.executionState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
