/**
 * Phase 24M — World 2 Disposable Workspace validation (leaf mode).
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
import type { World2ExecutionEngineAssessment } from '../src/world2-execution-engine/world2-execution-engine-types.js';
import {
  WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN,
  WORLD2_FORBIDDEN_PATHS,
  assessWorld2DisposableWorkspace,
  deriveWorld2WorkspaceLifecycleDecision,
  deriveWorld2WorkspaceState,
  resetWorld2DisposableWorkspaceModuleForTests,
} from '../src/world2-disposable-workspace/index.js';

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
  'src/world2-disposable-workspace/world2-disposable-workspace-types.ts',
  'src/world2-disposable-workspace/world2-disposable-workspace-registry.ts',
  'src/world2-disposable-workspace/world2-disposable-workspace-authority.ts',
  'src/world2-disposable-workspace/world2-disposable-workspace-history.ts',
  'src/world2-disposable-workspace/world2-disposable-workspace-report-builder.ts',
  'src/world2-disposable-workspace/index.ts',
  'architecture/WORLD2_DISPOSABLE_WORKSPACE_REPORT.md',
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
    findingId: 'finding-disposable-1',
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
      problemId: 'prob-disposable',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-disposable',
      problemId: 'prob-disposable',
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
    cacheKey: 'fixture-disposable-proof',
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
    cacheKey: 'fixture-disposable-acceptance',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-disposable-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for disposable workspace validation',
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
    cacheKey: 'fixture-planner-disposable',
  };
}

function buildEngineAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
): World2ExecutionEngineAssessment {
  resetAutonomousBuilderExecutionSandboxModuleForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
  resetWorld2ExecutionEngineModuleForTests();
  const sandbox = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance),
  });
  const runtime = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: sandbox });
  return assessWorld2ExecutionEngine({ runtimeAssessment: runtime });
}

function main(): void {
  console.log('');
  console.log('World 2 Disposable Workspace — Validation (leaf mode)');
  console.log('========================================================');
  console.log('');

  checkpoint('start');
  resetWorld2DisposableWorkspaceModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-disposable-workspace/world2-disposable-workspace-authority.ts');
  const registrySource = readText('src/world2-disposable-workspace/world2-disposable-workspace-registry.ts');
  const reportMd = readText('architecture/WORLD2_DISPOSABLE_WORKSPACE_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:world2-disposable-workspace']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessWorld2DisposableWorkspace'), 'authority');
  assert('03. lifecycle decisions exist', registrySource.includes('WORLD2_LIFECYCLE_DECISIONS'), 'lifecycle');
  assert('04. disposal requirement in contract', authoritySource.includes('disposalRequired: true'), 'disposal');
  assert('05. report pass token', reportMd.includes(WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN), 'token');
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert(
    '08. forbidden live workspace paths',
    WORLD2_FORBIDDEN_PATHS.some((p) => /live-devpulse|world1-project/i.test(p)),
    'forbidden paths',
  );
  checkpoint('static checks');

  resetWorld2DisposableWorkspaceModuleForTests();
  const readyEngine = buildEngineAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
  );
  const ready = assessWorld2DisposableWorkspace({ engineAssessment: readyEngine });
  assert(
    '09. ready workspace scenario',
    ready.workspaceState === 'READY' &&
      ready.isolationMode === 'DISPOSABLE_COPY_ELIGIBLE' &&
      ready.workspaceContract !== null &&
      ready.workspaceContract.disposalRequired === true &&
      ready.workspaceContract.validationRequired === true &&
      ready.lifecycleAssessment.decision === 'CREATE_ALLOWED',
    ready.workspaceState,
  );

  resetWorld2DisposableWorkspaceModuleForTests();
  const warningEngine = buildEngineAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  );
  const warning = assessWorld2DisposableWorkspace({ engineAssessment: warningEngine });
  assert(
    '10. warning workspace scenario',
    warning.workspaceState === 'READY_WITH_WARNINGS' &&
      warning.isolationMode === 'SIMULATED_WORKSPACE' &&
      warning.lifecycleAssessment.decision === 'CREATE_WITH_RESTRICTIONS',
    warning.workspaceState,
  );

  resetWorld2DisposableWorkspaceModuleForTests();
  const blockedEngine = buildEngineAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
  );
  const blocked = assessWorld2DisposableWorkspace({ engineAssessment: blockedEngine });
  assert(
    '11. blocked workspace scenario',
    blocked.workspaceState === 'BLOCKED' &&
      blocked.lifecycleAssessment.decision === 'DO_NOT_CREATE' &&
      blocked.blockingReasons.length > 0,
    blocked.workspaceState,
  );

  resetWorld2DisposableWorkspaceModuleForTests();
  const insufficientEngine = buildEngineAssessment(buildPlan('MEDIUM'), null, null);
  const insufficient = assessWorld2DisposableWorkspace({ engineAssessment: insufficientEngine });
  assert(
    '12. insufficient evidence scenario',
    insufficient.workspaceState === 'INSUFFICIENT_EVIDENCE' &&
      insufficient.lifecycleAssessment.decision === 'ESCALATE',
    insufficient.workspaceState,
  );

  assert(
    '13. derive workspace state exported',
    deriveWorld2WorkspaceState({
      runtimeState: 'READY_FOR_WORLD2',
      engineMode: 'SANDBOX_EXECUTION_ELIGIBLE',
      missingAuthorities: [],
      runtimeBlocked: false,
      engineBlocked: false,
      forbiddenPathsPresent: true,
      disposalRequired: true,
      validationRequired: true,
      liveMutationAllowed: false,
      foundationIsolationPassed: true,
      foundationOwnedBy: 'world2_workspace_foundation',
    }) === 'READY',
    'derive',
  );

  assert(
    '14. lifecycle decision exported',
    deriveWorld2WorkspaceLifecycleDecision('READY', ready.inputSnapshot).decision === 'CREATE_ALLOWED',
    'lifecycle',
  );

  resetWorld2DisposableWorkspaceModuleForTests();
  const live = assessWorld2DisposableWorkspace({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '15. live assessment executes',
    live.workspaceState.length > 0 && live.assessmentId.length > 0,
    `${live.workspaceState} id=${live.assessmentId}`,
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
    console.log('WORLD2_DISPOSABLE_WORKSPACE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN);
  console.log('');
  console.log('Workspace states verified:');
  console.log(`  READY:                  ${ready.workspaceState}`);
  console.log(`  READY_WITH_WARNINGS:    ${warning.workspaceState}`);
  console.log(`  BLOCKED:                ${blocked.workspaceState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:  ${insufficient.workspaceState}`);
  console.log(`  Live repo:              ${live.workspaceState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_DISPOSABLE_WORKSPACE_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
