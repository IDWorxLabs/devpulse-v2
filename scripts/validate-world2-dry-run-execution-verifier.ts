/**
 * Phase 24Y — World 2 Dry-Run Execution Verifier validation (leaf mode).
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
  assessWorld2RepositorySnapshotExecutor,
  resetWorld2RepositorySnapshotExecutorModuleForTests,
} from '../src/world2-repository-snapshot-executor/index.js';
import type { World2RepositorySnapshotExecutorAssessment } from '../src/world2-repository-snapshot-executor/world2-repository-snapshot-executor-types.js';
import {
  assessWorld2RepositorySnapshotMaterializer,
  resetWorld2RepositorySnapshotMaterializerModuleForTests,
} from '../src/world2-repository-snapshot-materializer/index.js';
import type { World2RepositorySnapshotMaterializerAssessment } from '../src/world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js';
import {
  assessWorld2ChangeSetMaterializer,
  resetWorld2ChangeSetMaterializerModuleForTests,
} from '../src/world2-change-set-materializer/index.js';
import type { World2ChangeSetMaterializerAssessment } from '../src/world2-change-set-materializer/world2-change-set-materializer-types.js';
import {
  assessWorld2DryRunExecutionComposer,
  resetWorld2DryRunExecutionComposerModuleForTests,
} from '../src/world2-dry-run-execution-composer/index.js';
import type { World2DryRunExecutionComposerAssessment } from '../src/world2-dry-run-execution-composer/world2-dry-run-execution-composer-types.js';
import {
  VERIFIED_MIN_SCORE,
  VERIFIED_WITH_WARNINGS_MIN_SCORE,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN,
  WORLD2_DRY_RUN_VERIFIER_SAFETY_GUARANTEES,
  assessWorld2DryRunExecutionVerifier,
  performWorld2DryRunOrderedStepChecks,
  resetWorld2DryRunExecutionVerifierModuleForTests,
} from '../src/world2-dry-run-execution-verifier/index.js';

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
  'src/world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-types.ts',
  'src/world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-registry.ts',
  'src/world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-authority.ts',
  'src/world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-history.ts',
  'src/world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-report-builder.ts',
  'src/world2-dry-run-execution-verifier/index.ts',
  'architecture/WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT.md',
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
    findingId: 'finding-dry-run-verifier-1',
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
      problemId: 'prob-dry-run-verifier',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-dry-run-verifier',
      problemId: 'prob-dry-run-verifier',
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
    cacheKey: 'fixture-dry-run-verifier-proof',
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
    cacheKey: 'fixture-dry-run-verifier-acceptance',
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
      runId: 'founder-test-dry-run-verifier-fixture',
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
    cacheKey: 'fixture-dry-run-verifier-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-dry-run-verifier-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for dry-run execution verifier validation',
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
    cacheKey: 'fixture-planner-dry-run-verifier',
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

function buildExecutorAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2RepositorySnapshotExecutorAssessment {
  resetWorld2RepositorySnapshotExecutorModuleForTests();
  const snapshot = buildSnapshotAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2RepositorySnapshotExecutor({ repositorySnapshotAssessment: snapshot });
}

function buildSnapshotMaterializerAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2RepositorySnapshotMaterializerAssessment {
  resetWorld2RepositorySnapshotMaterializerModuleForTests();
  const executor = buildExecutorAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2RepositorySnapshotMaterializer({ snapshotExecutorAssessment: executor });
}

function buildChangeSetMaterializerAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2ChangeSetMaterializerAssessment {
  resetWorld2ChangeSetMaterializerModuleForTests();
  const snapshotMaterializer = buildSnapshotMaterializerAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2ChangeSetMaterializer({
    snapshotMaterializerAssessment: snapshotMaterializer,
  });
}

function buildComposerAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
): World2DryRunExecutionComposerAssessment {
  resetWorld2DryRunExecutionComposerModuleForTests();
  const changeSetMaterializer = buildChangeSetMaterializerAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2DryRunExecutionComposer({
    changeSetMaterializerAssessment: changeSetMaterializer,
  });
}

function main(): void {
  console.log('');
  console.log('World 2 Dry-Run Execution Verifier — Validation (leaf mode)');
  console.log('=============================================================');
  console.log('');

  checkpoint('start');
  resetWorld2DryRunExecutionVerifierModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText(
    'src/world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-authority.ts',
  );
  const reportMd = readText('architecture/WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:world2-dry-run-execution-verifier']),
    'package.json',
  );
  assert(
    '02. authority export exists',
    authoritySource.includes('assessWorld2DryRunExecutionVerifier'),
    'authority',
  );
  assert(
    '03. readiness scoring defined',
    authoritySource.includes('computeWorld2DryRunReadinessScore') &&
      authoritySource.includes('READINESS_SCORE_WEIGHTS'),
    'scoring',
  );
  assert(
    '04. no real execution guarantee',
    WORLD2_DRY_RUN_VERIFIER_SAFETY_GUARANTEES.some((g) => /realExecutionPerformed always false/i.test(g)),
    'execution ban',
  );
  assert(
    '05. report pass token',
    reportMd.includes(WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN),
    'token',
  );
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  checkpoint('static checks');

  resetWorld2DryRunExecutionVerifierModuleForTests();
  const readyComposer = buildComposerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const verified = assessWorld2DryRunExecutionVerifier({
    composerAssessment: readyComposer,
  });
  assert(
    '08. verified scenario',
    verified.verificationState === 'VERIFIED' &&
      verified.readinessScore >= VERIFIED_MIN_SCORE &&
      verified.packageId !== null &&
      verified.realExecutionPerformed === false,
    `${verified.verificationState} score=${verified.readinessScore}`,
  );

  resetWorld2DryRunExecutionVerifierModuleForTests();
  const warningComposer = buildComposerAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  const warningVerified = assessWorld2DryRunExecutionVerifier({
    composerAssessment: warningComposer,
  });
  assert(
    '09. warning scenario',
    warningVerified.verificationState === 'VERIFIED_WITH_WARNINGS' &&
      warningVerified.readinessScore >= VERIFIED_WITH_WARNINGS_MIN_SCORE,
    `${warningVerified.verificationState} score=${warningVerified.readinessScore}`,
  );

  resetWorld2DryRunExecutionVerifierModuleForTests();
  const blockedComposer = buildComposerAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  const failed = assessWorld2DryRunExecutionVerifier({
    composerAssessment: blockedComposer,
  });
  assert(
    '10. failed scenario',
    failed.verificationState === 'FAILED' && failed.packageId === null,
    failed.verificationState,
  );

  resetWorld2DryRunExecutionVerifierModuleForTests();
  const insufficientComposer = buildComposerAssessment(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  const insufficient = assessWorld2DryRunExecutionVerifier({
    composerAssessment: insufficientComposer,
  });
  assert(
    '11. insufficient evidence scenario',
    insufficient.verificationState === 'INSUFFICIENT_EVIDENCE',
    insufficient.verificationState,
  );

  const orderedStepChecks = performWorld2DryRunOrderedStepChecks(readyComposer.executionPackage);
  assert(
    '12. ordered step verification',
    orderedStepChecks.length === 6 && orderedStepChecks.every((check) => check.passed),
    `${orderedStepChecks.filter((check) => check.passed).length}/${orderedStepChecks.length} passed`,
  );

  assert(
    '13. validation coverage verification',
    verified.validationCoverageChecks.length > 0 &&
      verified.validationCoverageChecks.every((check) => check.passed),
    `${verified.validationCoverageChecks.length} checks`,
  );

  assert(
    '14. rollback coverage verification',
    verified.rollbackCoverageChecks.length > 0 &&
      verified.rollbackCoverageChecks.every((check) => check.passed),
    `${verified.rollbackCoverageChecks.length} checks`,
  );

  assert(
    '15. audit coverage verification',
    verified.auditCoverageChecks.length > 0 &&
      verified.auditCoverageChecks.every((check) => check.passed),
    `${verified.auditCoverageChecks.length} checks`,
  );

  assert(
    '16. realExecutionPerformed is false',
    verified.realExecutionPerformed === false && warningVerified.realExecutionPerformed === false,
    'realExecutionPerformed',
  );

  resetWorld2DryRunExecutionVerifierModuleForTests();
  const live = assessWorld2DryRunExecutionVerifier({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '17. live assessment executes',
    live.verificationId.length > 0 && live.verificationState.length > 0,
    `${live.verificationState} id=${live.verificationId}`,
  );

  const passed = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failedCount}`);
  console.log('');

  if (failedCount > 0) {
    console.log('WORLD2_DRY_RUN_EXECUTION_VERIFIER_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN);
  console.log('');
  console.log('Verification states verified:');
  console.log(`  VERIFIED:                 ${verified.verificationState} (score=${verified.readinessScore})`);
  console.log(`  VERIFIED_WITH_WARNINGS:   ${warningVerified.verificationState} (score=${warningVerified.readinessScore})`);
  console.log(`  FAILED:                   ${failed.verificationState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:    ${insufficient.verificationState}`);
  console.log(`  Live repo:                ${live.verificationState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_DRY_RUN_EXECUTION_VERIFIER_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
