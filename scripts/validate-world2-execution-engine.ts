/**
 * Phase 24L — World 2 Execution Engine validation (leaf mode).
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
  assessWorld2ControlledExecutionRuntime,
  resetWorld2ControlledExecutionRuntimeModuleForTests,
} from '../src/world2-controlled-execution-runtime/index.js';
import type { World2RuntimeAssessment } from '../src/world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';
import {
  MAX_QUEUED_STEPS,
  MAX_SIMULATED_STEPS,
  WORLD2_EXECUTION_ENGINE_PASS_TOKEN,
  WORLD2_FORBIDDEN_SCOPE,
  assessWorld2ExecutionEngine,
  deriveWorld2ExecutionMode,
  resetWorld2ExecutionEngineModuleForTests,
} from '../src/world2-execution-engine/index.js';

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
  'src/world2-execution-engine/world2-execution-engine-types.ts',
  'src/world2-execution-engine/world2-execution-engine-registry.ts',
  'src/world2-execution-engine/world2-execution-engine-authority.ts',
  'src/world2-execution-engine/world2-execution-engine-queue.ts',
  'src/world2-execution-engine/world2-execution-engine-history.ts',
  'src/world2-execution-engine/world2-execution-engine-report-builder.ts',
  'src/world2-execution-engine/index.ts',
  'architecture/WORLD2_EXECUTION_ENGINE_REPORT.md',
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
    findingId: 'finding-engine-1',
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
      problemId: 'prob-engine',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-engine',
      problemId: 'prob-engine',
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
    cacheKey: 'fixture-engine-proof',
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
    cacheKey: 'fixture-engine-acceptance',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-engine-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for engine validation',
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
    rollbackPlan: {
      rollbackTrigger: 'Regression detected',
      rollbackMethod: 'Revert claimed fix path',
      rollbackSuccessCriteria: 'Baseline restored without regression',
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
    cacheKey: 'fixture-planner-engine',
  };
}

function buildRuntimeAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
): World2RuntimeAssessment {
  resetAutonomousBuilderExecutionSandboxModuleForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
  const sandbox = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance),
  });
  return assessWorld2ControlledExecutionRuntime({ sandboxAssessment: sandbox });
}

function main(): void {
  console.log('');
  console.log('World 2 Execution Engine — Validation (leaf mode)');
  console.log('=================================================');
  console.log('');

  checkpoint('start');
  resetWorld2ExecutionEngineModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-execution-engine/world2-execution-engine-authority.ts');
  const registrySource = readText('src/world2-execution-engine/world2-execution-engine-registry.ts');
  const queueSource = readText('src/world2-execution-engine/world2-execution-engine-queue.ts');
  const reportMd = readText('architecture/WORLD2_EXECUTION_ENGINE_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:world2-execution-engine']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessWorld2ExecutionEngine'), 'authority');
  assert('03. queue bounds defined', registrySource.includes('MAX_QUEUED_STEPS') && queueSource.includes('MAX_SIMULATED_STEPS'), 'bounds');
  assert('04. audit trail builder', authoritySource.includes('buildAuditTrail'), 'audit');
  assert('05. report pass token', reportMd.includes(WORLD2_EXECUTION_ENGINE_PASS_TOKEN), 'token');
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert(
    '08. forbidden live workspace scope',
    WORLD2_FORBIDDEN_SCOPE.some((s) => /live DevPulse workspace/i.test(s)),
    'forbidden scope',
  );
  checkpoint('static checks');

  resetWorld2ExecutionEngineModuleForTests();
  const readyRuntime = buildRuntimeAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
  );
  const ready = assessWorld2ExecutionEngine({ runtimeAssessment: readyRuntime });
  assert(
    '09. ready contract creates execution steps',
    ready.executionMode === 'SANDBOX_EXECUTION_ELIGIBLE' &&
      ready.steps.length >= 3 &&
      ready.auditTrail.length >= 3 &&
      ready.steps.some((s) => s.status === 'QUEUED'),
    `${ready.executionMode} steps=${ready.steps.length}`,
  );

  resetWorld2ExecutionEngineModuleForTests();
  const restrictedRuntime = buildRuntimeAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  );
  const restricted = assessWorld2ExecutionEngine({ runtimeAssessment: restrictedRuntime });
  assert(
    '10. restricted contract creates simulated execution',
    restricted.executionMode === 'SIMULATED_EXECUTION' &&
      restricted.steps.every((s) => s.status === 'SIMULATED'),
    restricted.executionMode,
  );

  resetWorld2ExecutionEngineModuleForTests();
  const blockedRuntime = buildRuntimeAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
  );
  const blocked = assessWorld2ExecutionEngine({ runtimeAssessment: blockedRuntime });
  assert(
    '11. blocked contract blocks execution',
    blocked.executionMode === 'BLOCKED' &&
      blocked.steps.every((s) => s.status === 'BLOCKED') &&
      blocked.blockers.length > 0,
    blocked.executionMode,
  );

  resetWorld2ExecutionEngineModuleForTests();
  const insufficientRuntime = buildRuntimeAssessment(buildPlan('MEDIUM'), null, null);
  const insufficient = assessWorld2ExecutionEngine({ runtimeAssessment: insufficientRuntime });
  assert(
    '12. insufficient evidence blocks execution',
    insufficient.executionMode === 'BLOCKED' && insufficient.finalState === 'INSUFFICIENT_EVIDENCE',
    insufficient.finalState,
  );

  assert(
    '13. derive execution mode exported',
    deriveWorld2ExecutionMode({
      runtimeState: 'READY_FOR_WORLD2',
      executionContract: readyRuntime.executionContract,
      missingAuthorities: [],
      plan: buildPlan('LOW'),
    }) === 'SANDBOX_EXECUTION_ELIGIBLE',
    'derive',
  );

  assert(
    '14. queue bounds enforced',
    MAX_QUEUED_STEPS <= 32 && MAX_SIMULATED_STEPS <= 32 && ready.queueSnapshot.recursiveRunBlocked === true,
    `${MAX_QUEUED_STEPS}/${MAX_SIMULATED_STEPS}`,
  );

  resetWorld2ExecutionEngineModuleForTests();
  const live = assessWorld2ExecutionEngine({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '15. live assessment executes',
    live.executionMode.length > 0 && live.engineRunId.length > 0,
    `${live.executionMode} run=${live.engineRunId}`,
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
    console.log('WORLD2_EXECUTION_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_EXECUTION_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('Execution modes verified:');
  console.log(`  SANDBOX_EXECUTION_ELIGIBLE: ${ready.executionMode}`);
  console.log(`  SIMULATED_EXECUTION:        ${restricted.executionMode}`);
  console.log(`  BLOCKED:                    ${blocked.executionMode}`);
  console.log(`  INSUFFICIENT_EVIDENCE:      ${insufficient.finalState}`);
  console.log(`  Live repo:                  ${live.executionMode}`);
  console.log('');
  console.log('Report: architecture/WORLD2_EXECUTION_ENGINE_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
