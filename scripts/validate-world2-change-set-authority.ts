/**
 * Phase 24N — World 2 Change Set Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionPlannerAssessment } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
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
import {
  assessWorld2ExecutionEngine,
  resetWorld2ExecutionEngineModuleForTests,
} from '../src/world2-execution-engine/index.js';
import {
  assessWorld2DisposableWorkspace,
  resetWorld2DisposableWorkspaceModuleForTests,
} from '../src/world2-disposable-workspace/index.js';
import type { World2DisposableWorkspaceAssessment } from '../src/world2-disposable-workspace/world2-disposable-workspace-types.js';
import {
  MAX_DELETE_OPERATIONS,
  WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN,
  assessWorld2ChangeSetAuthority,
  computeChangeSetImpactAnalysis,
  evaluateChangeOperationSafety,
  resetWorld2ChangeSetAuthorityModuleForTests,
  resolveWorld2TargetPath,
} from '../src/world2-change-set-authority/index.js';
import type { World2ChangeOperation } from '../src/world2-change-set-authority/index.js';

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
  'src/world2-change-set-authority/world2-change-set-types.ts',
  'src/world2-change-set-authority/world2-change-set-registry.ts',
  'src/world2-change-set-authority/world2-change-set-authority.ts',
  'src/world2-change-set-authority/world2-change-set-history.ts',
  'src/world2-change-set-authority/world2-change-set-report-builder.ts',
  'src/world2-change-set-authority/index.ts',
  'architecture/WORLD2_CHANGE_SET_AUTHORITY_REPORT.md',
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
    findingId: 'finding-changeset-1',
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
      problemId: 'prob-changeset',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-changeset',
      problemId: 'prob-changeset',
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
    cacheKey: 'fixture-changeset-proof',
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
    cacheKey: 'fixture-changeset-acceptance',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-changeset-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for change set validation',
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
        title: 'Apply fix',
        description: 'Apply alternative fix in World 2 scope',
        readOnly: true,
      },
    ],
    expectedOutcome: 'Fix applied with verification',
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
    successCriteria: ['Verification complete', 'No regression'],
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
    cacheKey: 'fixture-planner-changeset',
  };
}

function buildDisposableAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
): World2DisposableWorkspaceAssessment {
  resetAutonomousBuilderExecutionSandboxModuleForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
  resetWorld2ExecutionEngineModuleForTests();
  resetWorld2DisposableWorkspaceModuleForTests();
  const sandbox = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance),
  });
  const runtime = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: sandbox });
  const engine = assessWorld2ExecutionEngine({ runtimeAssessment: runtime });
  return assessWorld2DisposableWorkspace({ engineAssessment: engine });
}

function main(): void {
  console.log('');
  console.log('World 2 Change Set Authority — Validation (leaf mode)');
  console.log('=======================================================');
  console.log('');

  checkpoint('start');
  resetWorld2ChangeSetAuthorityModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-change-set-authority/world2-change-set-authority.ts');
  const registrySource = readText('src/world2-change-set-authority/world2-change-set-registry.ts');
  const reportMd = readText('architecture/WORLD2_CHANGE_SET_AUTHORITY_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:world2-change-set-authority']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessWorld2ChangeSetAuthority'), 'authority');
  assert('03. impact analysis export', authoritySource.includes('computeChangeSetImpactAnalysis'), 'impact');
  assert('04. safety evaluation export', authoritySource.includes('evaluateChangeOperationSafety'), 'safety');
  assert('05. report pass token', reportMd.includes(WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN), 'token');
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert('08. delete bound defined', registrySource.includes('MAX_DELETE_OPERATIONS'), 'delete bound');
  checkpoint('static checks');

  const createPath = resolveWorld2TargetPath('ws-fixture', 'src/new-component.tsx');
  const createSafety = evaluateChangeOperationSafety({
    operationType: 'CREATE_FILE',
    targetPath: createPath,
  });
  assert(
    '09. create file operation allowed',
    createSafety.allowed === true && createPath.startsWith('/world2/disposable/'),
    createPath,
  );

  const modifyPath = resolveWorld2TargetPath('ws-fixture', 'src/existing-component.tsx');
  const modifySafety = evaluateChangeOperationSafety({
    operationType: 'MODIFY_FILE',
    targetPath: modifyPath,
  });
  assert('10. modify file operation allowed', modifySafety.allowed === true, modifyPath);

  const forbiddenDelete = evaluateChangeOperationSafety({
    operationType: 'DELETE_FILE',
    targetPath: '/live-devpulse-workspace/src/app.ts',
  });
  assert(
    '11. forbidden path blocks delete',
    forbiddenDelete.allowed === false && forbiddenDelete.blockReason !== null,
    forbiddenDelete.blockReason ?? 'blocked',
  );

  const unboundedDelete = evaluateChangeOperationSafety({
    operationType: 'DELETE_FILE',
    targetPath: resolveWorld2TargetPath('ws-fixture', 'src/remove-me.ts'),
    deleteCountInSet: MAX_DELETE_OPERATIONS + 1,
  });
  assert(
    '12. delete operation safety bound',
    unboundedDelete.allowed === false && /unbounded delete/i.test(unboundedDelete.blockReason ?? ''),
    unboundedDelete.blockReason ?? 'blocked',
  );

  const sampleOps: World2ChangeOperation[] = [
    {
      readOnly: true,
      operationId: 'op-1',
      operationType: 'MODIFY_FILE',
      targetPath: modifyPath,
      reason: 'Fixture',
      allowed: true,
      requiresVerification: true,
      requiresRollback: true,
      riskLevel: 'LOW',
      blockReason: null,
    },
  ];
  const impact = computeChangeSetImpactAnalysis({
    operations: sampleOps,
    planRiskLevel: 'LOW',
    rollbackComplexity: 2,
  });
  assert('13. impact analysis returns level', impact === 'LOW' || impact === 'MEDIUM', impact);

  resetWorld2ChangeSetAuthorityModuleForTests();
  const readyDisposable = buildDisposableAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
  );
  const ready = assessWorld2ChangeSetAuthority({ disposableWorkspaceAssessment: readyDisposable });
  assert(
    '14. ready change set scenario',
    ready.eligibilityState === 'READY' &&
      ready.changeSet !== null &&
      ready.changeSet.operations.some((op) => op.operationType === 'MODIFY_FILE') &&
      ready.changeSet.operations.some((op) => op.operationType === 'NO_CHANGE') &&
      ready.blockedOperations.length === 0,
    ready.eligibilityState,
  );

  resetWorld2ChangeSetAuthorityModuleForTests();
  const warningDisposable = buildDisposableAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  );
  const warning = assessWorld2ChangeSetAuthority({ disposableWorkspaceAssessment: warningDisposable });
  assert(
    '15. warning change set scenario',
    warning.eligibilityState === 'READY_WITH_WARNINGS' && warning.changeSet !== null,
    warning.eligibilityState,
  );

  resetWorld2ChangeSetAuthorityModuleForTests();
  const blockedDisposable = buildDisposableAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
  );
  const blocked = assessWorld2ChangeSetAuthority({ disposableWorkspaceAssessment: blockedDisposable });
  assert(
    '16. blocked change set scenario',
    blocked.eligibilityState === 'BLOCKED' && blocked.blockingReasons.length > 0,
    blocked.eligibilityState,
  );

  resetWorld2ChangeSetAuthorityModuleForTests();
  const insufficientDisposable = buildDisposableAssessment(buildPlan('MEDIUM'), null, null);
  const insufficient = assessWorld2ChangeSetAuthority({
    disposableWorkspaceAssessment: insufficientDisposable,
  });
  assert(
    '17. insufficient evidence scenario',
    insufficient.eligibilityState === 'INSUFFICIENT_EVIDENCE' || insufficient.eligibilityState === 'BLOCKED',
    insufficient.eligibilityState,
  );

  resetWorld2ChangeSetAuthorityModuleForTests();
  const live = assessWorld2ChangeSetAuthority({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '18. live assessment executes',
    live.assessmentId.length > 0 && live.eligibilityState.length > 0,
    `${live.eligibilityState} id=${live.assessmentId}`,
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
    console.log('WORLD2_CHANGE_SET_AUTHORITY_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('Eligibility states verified:');
  console.log(`  READY:                  ${ready.eligibilityState}`);
  console.log(`  READY_WITH_WARNINGS:    ${warning.eligibilityState}`);
  console.log(`  BLOCKED:                ${blocked.eligibilityState}`);
  console.log(`  INSUFFICIENT/BLOCKED:   ${insufficient.eligibilityState}`);
  console.log(`  Live repo:              ${live.eligibilityState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_CHANGE_SET_AUTHORITY_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
