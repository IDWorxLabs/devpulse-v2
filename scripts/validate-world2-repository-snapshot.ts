/**
 * Phase 24T — World 2 Repository Snapshot validation (leaf mode).
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
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN,
  WORLD2_SNAPSHOT_SAFETY_GUARANTEES,
  assessWorld2RepositorySnapshot,
  deriveSnapshotState,
  isUnboundedRootCopyPath,
  performWorld2SnapshotSafetyChecks,
  resetWorld2RepositorySnapshotModuleForTests,
} from '../src/world2-repository-snapshot/index.js';

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
  'src/world2-repository-snapshot/world2-repository-snapshot-types.ts',
  'src/world2-repository-snapshot/world2-repository-snapshot-registry.ts',
  'src/world2-repository-snapshot/world2-repository-snapshot-authority.ts',
  'src/world2-repository-snapshot/world2-repository-snapshot-history.ts',
  'src/world2-repository-snapshot/world2-repository-snapshot-report-builder.ts',
  'src/world2-repository-snapshot/index.ts',
  'architecture/WORLD2_REPOSITORY_SNAPSHOT_REPORT.md',
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
    findingId: 'finding-snapshot-1',
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
      problemId: 'prob-snapshot',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-snapshot',
      problemId: 'prob-snapshot',
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
    cacheKey: 'fixture-snapshot-proof',
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
    cacheKey: 'fixture-snapshot-acceptance',
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
      runId: 'founder-test-snapshot-fixture',
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
    cacheKey: 'fixture-snapshot-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-snapshot-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for repository snapshot validation',
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
    cacheKey: 'fixture-planner-snapshot',
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

function main(): void {
  console.log('');
  console.log('World 2 Repository Snapshot — Validation (leaf mode)');
  console.log('========================================================');
  console.log('');

  checkpoint('start');
  resetWorld2RepositorySnapshotModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-repository-snapshot/world2-repository-snapshot-authority.ts');
  const registrySource = readText('src/world2-repository-snapshot/world2-repository-snapshot-registry.ts');
  const reportMd = readText('architecture/WORLD2_REPOSITORY_SNAPSHOT_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:world2-repository-snapshot']),
    'package.json',
  );
  assert(
    '02. authority export exists',
    authoritySource.includes('assessWorld2RepositorySnapshot'),
    'authority',
  );
  assert(
    '03. secrets exclusion exists',
    registrySource.includes('WORLD2_SECRETS_PATH_PATTERNS') &&
      registrySource.includes('.env'),
    'secrets',
  );
  assert(
    '04. node_modules exclusion exists',
    registrySource.includes('WORLD2_NODE_MODULES_EXCLUSION') &&
      registrySource.includes('node_modules/**'),
    'node_modules',
  );
  assert(
    '05. git internals exclusion exists',
    registrySource.includes('WORLD2_GIT_INTERNALS_EXCLUSIONS') &&
      registrySource.includes('.git/objects/**'),
    'git',
  );
  assert(
    '06. unbounded root copy blocking exists',
    registrySource.includes('WORLD2_UNBOUNDED_ROOT_COPY_PATTERNS') &&
      registrySource.includes('isUnboundedRootCopyPath'),
    'unbounded',
  );
  assert(
    '07. no repository copy guarantee',
    WORLD2_SNAPSHOT_SAFETY_GUARANTEES.some((g) => /no repository copy/i.test(g)),
    'repo copy ban',
  );
  assert('08. report pass token', reportMd.includes(WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN), 'token');
  assert('09. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('10. no network fetch', !authoritySource.includes('fetch('), 'network');
  checkpoint('static checks');

  resetWorld2RepositorySnapshotModuleForTests();
  const readyInstantiator = buildInstantiatorAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const ready = assessWorld2RepositorySnapshot({ instantiatorAssessment: readyInstantiator });
  assert(
    '11. snapshot ready scenario',
    ready.snapshotState === 'SNAPSHOT_READY' &&
      ready.snapshotScope !== null &&
      ready.snapshotScope.snapshotManifest.repositoryCopyPerformed === false,
    ready.snapshotState,
  );

  resetWorld2RepositorySnapshotModuleForTests();
  const restrictedInstantiator = buildInstantiatorAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  const restricted = assessWorld2RepositorySnapshot({
    instantiatorAssessment: restrictedInstantiator,
  });
  assert(
    '12. restricted snapshot scenario',
    restricted.snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS' &&
      restricted.snapshotScope !== null,
    restricted.snapshotState,
  );

  resetWorld2RepositorySnapshotModuleForTests();
  const blockedInstantiator = buildInstantiatorAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  const blocked = assessWorld2RepositorySnapshot({
    instantiatorAssessment: blockedInstantiator,
  });
  assert(
    '13. blocked scenario',
    blocked.snapshotState === 'SNAPSHOT_BLOCKED' && blocked.snapshotScope === null,
    blocked.snapshotState,
  );

  resetWorld2RepositorySnapshotModuleForTests();
  const insufficientInstantiator = buildInstantiatorAssessment(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  const insufficient = assessWorld2RepositorySnapshot({
    instantiatorAssessment: insufficientInstantiator,
  });
  assert(
    '14. insufficient evidence scenario',
    insufficient.snapshotState === 'INSUFFICIENT_EVIDENCE',
    insufficient.snapshotState,
  );

  assert(
    '15. snapshot manifest exists',
    ready.snapshotScope !== null &&
      ready.snapshotScope.snapshotManifest.manifestId.length > 0 &&
      ready.snapshotScope.snapshotManifest.entries.length > 0 &&
      ready.snapshotScope.excludedPaths.includes(WORLD2_NODE_MODULES_EXCLUSION),
    'manifest',
  );

  assert(
    '16. safety checks exist',
    ready.snapshotScope !== null &&
      ready.snapshotScope.safetyChecks.length >= 10 &&
      ready.snapshotScope.safetyChecks.every((c) => c.passed),
    `${ready.snapshotScope?.safetyChecks.length ?? 0} checks`,
  );

  assert(
    '17. unbounded root copy blocked',
    isUnboundedRootCopyPath('/') &&
      deriveSnapshotState({
        missingAuthorities: [],
        instantiatorResultState: 'INSTANTIATION_READY',
        materializationState: 'READY',
        populationState: 'READY',
        disposableWorkspaceState: 'READY',
        safetyChecksPassed: false,
        criticalSafetyFailures: 1,
        hasInstantiationOperation: true,
        upstreamWarningStates: false,
        sensitivePathExcluded: false,
        exclusionsPresent: true,
        unboundedRootCopyDetected: true,
      }) === 'SNAPSHOT_BLOCKED',
    'unbounded root',
  );

  const secretChecks = performWorld2SnapshotSafetyChecks(
    ready.inputSnapshot,
    ['src/index.ts', '.env'],
    [...ready.snapshotScope!.excludedPaths],
  ).find((c) => c.checkId === 'no-secrets-included');

  assert(
    '18. secrets path fails safety check',
    secretChecks !== undefined && secretChecks.passed === false,
    secretChecks?.detail ?? 'missing check',
  );

  assert(
    '19. derive snapshot state exported',
    deriveSnapshotState({
      missingAuthorities: [],
      instantiatorResultState: 'INSTANTIATION_READY',
      materializationState: 'READY',
      populationState: 'READY',
      disposableWorkspaceState: 'READY',
      safetyChecksPassed: true,
      criticalSafetyFailures: 0,
      hasInstantiationOperation: true,
      upstreamWarningStates: false,
      sensitivePathExcluded: false,
      exclusionsPresent: true,
      unboundedRootCopyDetected: false,
    }) === 'SNAPSHOT_READY',
    'derive',
  );

  assert(
    '20. git internals in exclusions',
    WORLD2_GIT_INTERNALS_EXCLUSIONS.length >= 4 &&
      ready.snapshotScope!.excludedPaths.some((p) => p.includes('.git/')),
    'git exclusions',
  );

  resetWorld2RepositorySnapshotModuleForTests();
  const live = assessWorld2RepositorySnapshot({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '21. live assessment executes',
    live.snapshotAssessmentId.length > 0 && live.snapshotState.length > 0,
    `${live.snapshotState} id=${live.snapshotAssessmentId}`,
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
    console.log('WORLD2_REPOSITORY_SNAPSHOT_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN);
  console.log('');
  console.log('Snapshot states verified:');
  console.log(`  SNAPSHOT_READY:                    ${ready.snapshotState}`);
  console.log(`  SNAPSHOT_READY_WITH_RESTRICTIONS:  ${restricted.snapshotState}`);
  console.log(`  SNAPSHOT_BLOCKED:                  ${blocked.snapshotState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:             ${insufficient.snapshotState}`);
  console.log(`  Live repo:                         ${live.snapshotState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_REPOSITORY_SNAPSHOT_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
