/**
 * Phase 24U — World 2 Repository Snapshot Executor validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionPlannerAssessment } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderTestAssessment } from '../src/founder-test-integration/founder-test-integration-types.js';
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
import {
  assessWorld2ChangeSetAuthority,
  resetWorld2ChangeSetAuthorityModuleForTests,
} from '../src/world2-change-set-authority/index.js';
import {
  assessWorld2WorkspacePopulation,
  resetWorld2WorkspacePopulationModuleForTests,
} from '../src/world2-workspace-population/index.js';
import type { WorkspacePopulationAssessment } from '../src/world2-workspace-population/world2-workspace-population-types.js';
import {
  assessWorld2WorkspaceMaterialization,
  resetWorld2WorkspaceMaterializationModuleForTests,
} from '../src/world2-workspace-materialization/index.js';
import type { World2WorkspaceMaterializationAssessment } from '../src/world2-workspace-materialization/world2-workspace-materialization-types.js';
import {
  assessWorld2InstantiationGovernance,
  resetWorld2InstantiationGovernanceModuleForTests,
} from '../src/world2-workspace-instantiation-governance/index.js';
import type { World2InstantiationGovernanceAssessment } from '../src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-types.js';
import {
  assessWorld2DisposableWorkspaceCreator,
  resetWorld2DisposableWorkspaceCreatorModuleForTests,
} from '../src/world2-disposable-workspace-creator/index.js';
import type { World2DisposableWorkspaceCreatorAssessment } from '../src/world2-disposable-workspace-creator/world2-disposable-workspace-creator-types.js';
import {
  assessWorld2DisposableWorkspaceInstantiator,
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests,
} from '../src/world2-disposable-workspace-instantiator/index.js';
import type { World2DisposableWorkspaceInstantiatorAssessment } from '../src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import {
  assessWorld2RepositorySnapshot,
  resetWorld2RepositorySnapshotModuleForTests,
} from '../src/world2-repository-snapshot/index.js';
import type { World2RepositorySnapshotAssessment } from '../src/world2-repository-snapshot/world2-repository-snapshot-types.js';
import {
  DEFAULT_SNAPSHOT_EXECUTION_MODE,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN,
  WORLD2_SNAPSHOT_EXECUTOR_SAFETY_GUARANTEES,
  assessWorld2RepositorySnapshotExecutor,
  deriveSnapshotExecutionEligibilityMode,
  isUnboundedRootCopyPath,
  performWorld2SnapshotExecutionSafetyChecks,
  resetWorld2RepositorySnapshotExecutorModuleForTests,
} from '../src/world2-repository-snapshot-executor/index.js';

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
  'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-types.ts',
  'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-registry.ts',
  'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-authority.ts',
  'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-history.ts',
  'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-report-builder.ts',
  'src/world2-repository-snapshot-executor/index.ts',
  'architecture/WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT.md',
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
    findingId: 'finding-snapshot-exec-1',
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
      problemId: 'prob-snapshot-exec',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-snapshot-exec',
      problemId: 'prob-snapshot-exec',
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
    cacheKey: 'fixture-snapshot-exec-proof',
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
    cacheKey: 'fixture-snapshot-exec-acceptance',
  };
}

function buildFounderTest(
  verdict: FounderTestAssessment['verdict'],
  requirementAboveThreshold: boolean,
  score = 90,
): FounderTestAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    run: {
      readOnly: true,
      runId: 'founder-test-snapshot-exec-fixture',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      rootDir: ROOT,
      authorityResults: [],
    },
    score: {
      overall: score,
      byAuthority: {} as FounderTestAssessment['score']['byAuthority'],
      weightedBreakdown: {} as FounderTestAssessment['score']['weightedBreakdown'],
    },
    summary: {
      participatingAuthorities: 9,
      availableAuthorities: 9,
      missingAuthorities: [],
      criticalBlockerCount: verdict === 'BLOCKED' ? 1 : 0,
      warningCount: verdict === 'FOUNDER_READY_WITH_WARNINGS' ? 2 : 0,
      recommendationCount: 1,
      founderSimulationPassed: verdict !== 'NOT_FOUNDER_READY',
      executionProofRegressionFree: true,
      requirementRealityAboveThreshold: requirementAboveThreshold,
    },
    verdict,
    findings: [],
    blockers: verdict === 'BLOCKED' ? ['Critical blocker'] : [],
    warnings: verdict === 'FOUNDER_READY_WITH_WARNINGS' ? ['Minor gap'] : [],
    recommendations: ['Continue validation'],
    missingCapabilities: verdict === 'INSUFFICIENT_EVIDENCE' ? ['Missing authority'] : [],
    cacheKey: 'fixture-snapshot-exec-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-snapshot-exec-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for snapshot executor validation',
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
    cacheKey: 'fixture-planner-snapshot-exec',
  };
}

function buildMaterializationAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2WorkspaceMaterializationAssessment {
  resetAutonomousBuilderExecutionSandboxModuleForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
  resetWorld2ExecutionEngineModuleForTests();
  resetWorld2DisposableWorkspaceModuleForTests();
  resetWorld2ChangeSetAuthorityModuleForTests();
  resetWorld2WorkspacePopulationModuleForTests();
  resetWorld2WorkspaceMaterializationModuleForTests();
  const sandbox = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance),
  });
  const runtime = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: sandbox });
  const engine = assessWorld2ExecutionEngine({ runtimeAssessment: runtime });
  const disposable = assessWorld2DisposableWorkspace({ engineAssessment: engine });
  const changeSet = assessWorld2ChangeSetAuthority({ disposableWorkspaceAssessment: disposable });
  const population: WorkspacePopulationAssessment = assessWorld2WorkspacePopulation({
    changeSetAssessment: changeSet,
    founderTestAssessment: founderTest ?? undefined,
  });
  return assessWorld2WorkspaceMaterialization({ populationAssessment: population });
}

function buildGovernanceAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2InstantiationGovernanceAssessment {
  resetWorld2InstantiationGovernanceModuleForTests();
  const materialization = buildMaterializationAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2InstantiationGovernance({ materializationAssessment: materialization });
}

function buildCreatorAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2DisposableWorkspaceCreatorAssessment {
  resetWorld2DisposableWorkspaceCreatorModuleForTests();
  const governance = buildGovernanceAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2DisposableWorkspaceCreator({
    instantiationGovernanceAssessment: governance,
  });
}

function buildInstantiatorAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2DisposableWorkspaceInstantiatorAssessment {
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const creator = buildCreatorAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2DisposableWorkspaceInstantiator({ creatorAssessment: creator });
}

function buildSnapshotAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2RepositorySnapshotAssessment {
  resetWorld2RepositorySnapshotModuleForTests();
  const instantiator = buildInstantiatorAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2RepositorySnapshot({ instantiatorAssessment: instantiator });
}

function main(): void {
  console.log('');
  console.log('World 2 Repository Snapshot Executor — Validation (leaf mode)');
  console.log('==============================================================');
  console.log('');

  checkpoint('start');
  resetWorld2RepositorySnapshotExecutorModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText(
    'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-authority.ts',
  );
  const registrySource = readText(
    'src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-registry.ts',
  );
  const reportMd = readText('architecture/WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:world2-repository-snapshot-executor']),
    'package.json',
  );
  assert(
    '02. authority export exists',
    authoritySource.includes('assessWorld2RepositorySnapshotExecutor'),
    'authority',
  );
  assert(
    '03. default dry-run mode defined',
    registrySource.includes('DEFAULT_SNAPSHOT_EXECUTION_MODE') &&
      registrySource.includes("'DRY_RUN'"),
    'dry-run default',
  );
  assert(
    '04. secrets blocking patterns',
    registrySource.includes('WORLD2_SECRETS_PATH_PATTERNS') &&
      registrySource.includes('pathMatchesSecrets'),
    'secrets',
  );
  assert(
    '05. node_modules exclusion exists',
    registrySource.includes('WORLD2_NODE_MODULES_EXCLUSION'),
    'node_modules',
  );
  assert(
    '06. git internals exclusion exists',
    registrySource.includes('WORLD2_GIT_INTERNALS_EXCLUSIONS'),
    'git',
  );
  assert(
    '07. unbounded root copy blocking exists',
    registrySource.includes('isUnboundedRootCopyPath'),
    'unbounded',
  );
  assert(
    '08. no repository copy guarantee',
    WORLD2_SNAPSHOT_EXECUTOR_SAFETY_GUARANTEES.some((g) => /no repository copy/i.test(g)),
    'repo copy ban',
  );
  assert(
    '09. report pass token',
    reportMd.includes(WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN),
    'token',
  );
  assert('10. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('11. no network fetch', !authoritySource.includes('fetch('), 'network');
  checkpoint('static checks');

  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const readySnapshot = buildSnapshotAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const dryRunDefault = assessWorld2RepositorySnapshotExecutor({
    repositorySnapshotAssessment: readySnapshot,
  });
  assert(
    '12. dry-run default scenario',
    dryRunDefault.executionState === 'SNAPSHOT_EXECUTION_READY' &&
      dryRunDefault.executionRequest !== null &&
      dryRunDefault.executionRequest.mode === DEFAULT_SNAPSHOT_EXECUTION_MODE &&
      dryRunDefault.executionRequest.eligibilityMode === 'REAL_SNAPSHOT_ELIGIBLE',
    `${dryRunDefault.executionState} mode=${dryRunDefault.executionRequest?.mode}`,
  );

  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const realEligible = assessWorld2RepositorySnapshotExecutor({
    repositorySnapshotAssessment: readySnapshot,
    executionModeOverride: 'REAL_SNAPSHOT_ELIGIBLE',
  });
  assert(
    '13. real snapshot eligible scenario',
    realEligible.executionState === 'SNAPSHOT_EXECUTION_READY' &&
      realEligible.executionRequest !== null &&
      realEligible.executionRequest.mode === 'REAL_SNAPSHOT_ELIGIBLE',
    `${realEligible.executionState} mode=${realEligible.executionRequest?.mode}`,
  );

  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const restrictedSnapshot = buildSnapshotAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  const simulated = assessWorld2RepositorySnapshotExecutor({
    repositorySnapshotAssessment: restrictedSnapshot,
  });
  assert(
    '14. simulated snapshot scenario',
    simulated.executionState === 'SNAPSHOT_EXECUTION_SIMULATED' &&
      simulated.executionRequest !== null &&
      simulated.executionRequest.eligibilityMode === 'SIMULATED_SNAPSHOT',
    simulated.executionState,
  );

  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const blockedSnapshot = buildSnapshotAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  const blocked = assessWorld2RepositorySnapshotExecutor({
    repositorySnapshotAssessment: blockedSnapshot,
  });
  assert(
    '15. blocked scenario',
    blocked.executionState === 'SNAPSHOT_EXECUTION_BLOCKED' && blocked.executionRequest === null,
    blocked.executionState,
  );

  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const insufficientSnapshot = buildSnapshotAssessment(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  const insufficient = assessWorld2RepositorySnapshotExecutor({
    repositorySnapshotAssessment: insufficientSnapshot,
  });
  assert(
    '16. insufficient evidence scenario',
    insufficient.executionState === 'INSUFFICIENT_EVIDENCE',
    insufficient.executionState,
  );

  const secretChecks = performWorld2SnapshotExecutionSafetyChecks({
    ...dryRunDefault.inputSnapshot,
    repositorySnapshotAssessment: {
      ...readySnapshot,
      snapshotScope: readySnapshot.snapshotScope
        ? {
            ...readySnapshot.snapshotScope,
            includedPaths: [...readySnapshot.snapshotScope.includedPaths, '.env'],
          }
        : null,
    },
  }).find((c) => c.checkId === 'secrets-excluded');

  assert(
    '17. secrets blocking',
    secretChecks !== undefined && secretChecks.passed === false,
    secretChecks?.detail ?? 'missing check',
  );

  assert(
    '18. node_modules exclusion in request',
    dryRunDefault.executionRequest !== null &&
      dryRunDefault.executionRequest.excludedPaths.includes(WORLD2_NODE_MODULES_EXCLUSION),
    'node_modules',
  );

  assert(
    '19. git internals exclusion in request',
    dryRunDefault.executionRequest !== null &&
      WORLD2_GIT_INTERNALS_EXCLUSIONS.every((rule) =>
        dryRunDefault.executionRequest!.excludedPaths.includes(rule),
      ),
    'git exclusions',
  );

  assert(
    '20. unbounded root copy blocking',
    isUnboundedRootCopyPath('/') &&
      deriveSnapshotExecutionEligibilityMode({
        missingAuthorities: [],
        snapshotState: 'SNAPSHOT_READY',
        instantiatorResultState: 'INSTANTIATION_READY',
        creatorState: 'CREATION_READY',
        safetyChecksPassed: false,
        criticalSafetyFailures: 1,
        hasSnapshotScope: true,
        secretsIncluded: false,
        livePathIncluded: false,
        productionPathIncluded: false,
        unboundedRootCopy: true,
      }) === 'BLOCKED',
    'unbounded root',
  );

  assert(
    '21. repositoryCopyPerformed always false',
    dryRunDefault.executionRequest?.repositoryCopyPerformed === false &&
      dryRunDefault.dryRunExecutionResult?.repositoryCopyPerformed === false &&
      (blocked.executionRequest === null || blocked.executionRequest.repositoryCopyPerformed === false),
    'repositoryCopyPerformed',
  );

  assert(
    '22. dry-run execution result exists',
    dryRunDefault.dryRunExecutionResult !== null &&
      dryRunDefault.dryRunExecutionResult.requestId === dryRunDefault.executionRequest?.requestId,
    'dry-run result',
  );

  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const live = assessWorld2RepositorySnapshotExecutor({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '23. live assessment executes',
    live.executorAssessmentId.length > 0 && live.executionState.length > 0,
    `${live.executionState} id=${live.executorAssessmentId}`,
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
    console.log('WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN);
  console.log('');
  console.log('Execution states verified:');
  console.log(`  SNAPSHOT_EXECUTION_READY (dry-run):  ${dryRunDefault.executionState}`);
  console.log(`  REAL_SNAPSHOT_ELIGIBLE:              ${realEligible.executionRequest?.mode}`);
  console.log(`  SNAPSHOT_EXECUTION_SIMULATED:        ${simulated.executionState}`);
  console.log(`  SNAPSHOT_EXECUTION_BLOCKED:          ${blocked.executionState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:               ${insufficient.executionState}`);
  console.log(`  Live repo:                           ${live.executionState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
