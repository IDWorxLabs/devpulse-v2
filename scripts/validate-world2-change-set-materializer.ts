/**
 * Phase 24W — World 2 Change Set Materializer validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionPlannerAssessment } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderTestAssessment } from '../src/founder-test-integration/founder-test-integration-types.js';
import type { World2ChangeOperation } from '../src/world2-change-set-authority/world2-change-set-types.js';
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
  DEFAULT_CHANGE_MATERIALIZATION_MODE,
  WORLD2_CHANGE_MATERIALIZER_SAFETY_GUARANTEES,
  WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
  assessWorld2ChangeSetMaterializer,
  isDisposableOnlyTargetRoot,
  mapChangeOperationsToPlannedFields,
  resetWorld2ChangeSetMaterializerModuleForTests,
} from '../src/world2-change-set-materializer/index.js';

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
  'src/world2-change-set-materializer/world2-change-set-materializer-types.ts',
  'src/world2-change-set-materializer/world2-change-set-materializer-registry.ts',
  'src/world2-change-set-materializer/world2-change-set-materializer-authority.ts',
  'src/world2-change-set-materializer/world2-change-set-materializer-history.ts',
  'src/world2-change-set-materializer/world2-change-set-materializer-report-builder.ts',
  'src/world2-change-set-materializer/index.ts',
  'architecture/WORLD2_CHANGE_SET_MATERIALIZER_REPORT.md',
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
    findingId: 'finding-change-mat-1',
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
      problemId: 'prob-change-mat',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-change-mat',
      problemId: 'prob-change-mat',
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
    cacheKey: 'fixture-change-mat-proof',
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
    cacheKey: 'fixture-change-mat-acceptance',
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
      runId: 'founder-test-change-mat-fixture',
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
    cacheKey: 'fixture-change-mat-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-change-mat-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for change set materializer validation',
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
    cacheKey: 'fixture-planner-change-mat',
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

function sampleOperations(): World2ChangeOperation[] {
  const base = {
    readOnly: true as const,
    reason: 'Fixture',
    allowed: true,
    requiresVerification: true,
    requiresRollback: true,
    riskLevel: 'LOW' as const,
    blockReason: null,
  };
  return [
    { ...base, operationId: 'op-create', operationType: 'CREATE_FILE', targetPath: '/world2/disposable/ws/a.ts' },
    { ...base, operationId: 'op-modify', operationType: 'MODIFY_FILE', targetPath: '/world2/disposable/ws/b.ts' },
    { ...base, operationId: 'op-delete', operationType: 'DELETE_FILE', targetPath: '/world2/disposable/ws/c.ts' },
    { ...base, operationId: 'op-move', operationType: 'MOVE_FILE', targetPath: '/world2/disposable/ws/d.ts' },
    { ...base, operationId: 'op-mkdir', operationType: 'CREATE_DIRECTORY', targetPath: '/world2/disposable/ws/dir' },
    { ...base, operationId: 'op-rmdir', operationType: 'DELETE_DIRECTORY', targetPath: '/world2/disposable/ws/old' },
  ];
}

function main(): void {
  console.log('');
  console.log('World 2 Change Set Materializer — Validation (leaf mode)');
  console.log('========================================================');
  console.log('');

  checkpoint('start');
  resetWorld2ChangeSetMaterializerModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-change-set-materializer/world2-change-set-materializer-authority.ts');
  const registrySource = readText('src/world2-change-set-materializer/world2-change-set-materializer-registry.ts');
  const reportMd = readText('architecture/WORLD2_CHANGE_SET_MATERIALIZER_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:world2-change-set-materializer']),
    'package.json',
  );
  assert(
    '02. authority export exists',
    authoritySource.includes('assessWorld2ChangeSetMaterializer'),
    'authority',
  );
  assert(
    '03. default dry-run mode defined',
    registrySource.includes('DEFAULT_CHANGE_MATERIALIZATION_MODE') &&
      registrySource.includes("'DRY_RUN'"),
    'dry-run default',
  );
  assert(
    '04. no real file mutation guarantee',
    WORLD2_CHANGE_MATERIALIZER_SAFETY_GUARANTEES.some((g) => /no real file modification/i.test(g)),
    'mutation ban',
  );
  assert(
    '05. report pass token',
    reportMd.includes(WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN),
    'token',
  );
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  checkpoint('static checks');

  resetWorld2ChangeSetMaterializerModuleForTests();
  const readySnapshotMaterializer = buildSnapshotMaterializerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const dryRunDefault = assessWorld2ChangeSetMaterializer({
    snapshotMaterializerAssessment: readySnapshotMaterializer,
  });
  assert(
    '08. dry-run default scenario',
    dryRunDefault.materializationState === 'CHANGE_MATERIALIZATION_READY' &&
      dryRunDefault.materializationOperation !== null &&
      dryRunDefault.materializationOperation.mode === DEFAULT_CHANGE_MATERIALIZATION_MODE &&
      dryRunDefault.materializationOperation.eligibilityMode === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE',
    `${dryRunDefault.materializationState} mode=${dryRunDefault.materializationOperation?.mode}`,
  );

  resetWorld2ChangeSetMaterializerModuleForTests();
  const realEligible = assessWorld2ChangeSetMaterializer({
    snapshotMaterializerAssessment: readySnapshotMaterializer,
    materializationModeOverride: 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE',
  });
  assert(
    '09. real materialization eligible scenario',
    realEligible.materializationState === 'CHANGE_MATERIALIZATION_READY' &&
      realEligible.materializationOperation !== null &&
      realEligible.materializationOperation.mode === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE',
    `${realEligible.materializationState} mode=${realEligible.materializationOperation?.mode}`,
  );

  resetWorld2ChangeSetMaterializerModuleForTests();
  const restrictedSnapshotMaterializer = buildSnapshotMaterializerAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  const simulated = assessWorld2ChangeSetMaterializer({
    snapshotMaterializerAssessment: restrictedSnapshotMaterializer,
  });
  assert(
    '10. simulated materialization scenario',
    simulated.materializationState === 'CHANGE_MATERIALIZATION_SIMULATED' &&
      simulated.materializationOperation !== null,
    simulated.materializationState,
  );

  resetWorld2ChangeSetMaterializerModuleForTests();
  const blockedSnapshotMaterializer = buildSnapshotMaterializerAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  const blocked = assessWorld2ChangeSetMaterializer({
    snapshotMaterializerAssessment: blockedSnapshotMaterializer,
  });
  assert(
    '11. blocked scenario',
    blocked.materializationState === 'CHANGE_MATERIALIZATION_BLOCKED' &&
      blocked.materializationOperation === null,
    blocked.materializationState,
  );

  resetWorld2ChangeSetMaterializerModuleForTests();
  const insufficientSnapshotMaterializer = buildSnapshotMaterializerAssessment(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  const insufficient = assessWorld2ChangeSetMaterializer({
    snapshotMaterializerAssessment: insufficientSnapshotMaterializer,
  });
  assert(
    '12. insufficient evidence scenario',
    insufficient.materializationState === 'INSUFFICIENT_EVIDENCE',
    insufficient.materializationState,
  );

  const mapped = mapChangeOperationsToPlannedFields(sampleOperations());
  assert(
    '13. create/modify/delete/move operation mapping',
    mapped.plannedFileCreates.length === 1 &&
      mapped.plannedFileModifies.length === 1 &&
      mapped.plannedFileDeletes.length === 1 &&
      mapped.plannedMoves.length === 1 &&
      mapped.plannedDirectoryCreates.length === 1 &&
      mapped.plannedDirectoryDeletes.length === 1,
    `creates=${mapped.plannedFileCreates.length} moves=${mapped.plannedMoves.length}`,
  );

  assert(
    '14. rollback map exists',
    dryRunDefault.materializationOperation !== null &&
      dryRunDefault.materializationOperation.rollbackMap.length > 0 &&
      dryRunDefault.materializationOperation.rollbackMap.every(
        (entry) => entry.operationId.length > 0 && entry.rollbackAction.length > 0,
      ),
    `${dryRunDefault.materializationOperation?.rollbackMap.length ?? 0} entries`,
  );

  assert(
    '15. verification requirement exists',
    dryRunDefault.materializationOperation !== null &&
      dryRunDefault.inputSnapshot.changeSetAssessment.changeSet !== null &&
      dryRunDefault.inputSnapshot.changeSetAssessment.changeSet.verificationRequirements.length > 0,
    'verification',
  );

  assert(
    '16. target root disposable-only check',
    dryRunDefault.materializationOperation !== null &&
      dryRunDefault.materializationOperation.targetWorkspaceRoot.startsWith(
        WORLD2_DISPOSABLE_WORKSPACE_ROOT_PREFIX,
      ) &&
      isDisposableOnlyTargetRoot(dryRunDefault.materializationOperation.targetWorkspaceRoot),
    dryRunDefault.materializationOperation?.targetWorkspaceRoot ?? 'none',
  );

  assert(
    '17. realFileMutationPerformed always false',
    dryRunDefault.materializationOperation?.realFileMutationPerformed === false &&
      dryRunDefault.dryRunMaterializationResult?.realFileMutationPerformed === false,
    'realFileMutationPerformed',
  );

  assert(
    '18. postconditions exist',
    dryRunDefault.materializationOperation !== null &&
      dryRunDefault.materializationOperation.postconditions.length >= 5,
    `${dryRunDefault.materializationOperation?.postconditions.length ?? 0} postconditions`,
  );

  resetWorld2ChangeSetMaterializerModuleForTests();
  const live = assessWorld2ChangeSetMaterializer({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '19. live assessment executes',
    live.materializerAssessmentId.length > 0 && live.materializationState.length > 0,
    `${live.materializationState} id=${live.materializerAssessmentId}`,
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
    console.log('WORLD2_CHANGE_SET_MATERIALIZER_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN);
  console.log('');
  console.log('Materialization states verified:');
  console.log(`  CHANGE_MATERIALIZATION_READY (dry-run):  ${dryRunDefault.materializationState}`);
  console.log(`  REAL_CHANGE_MATERIALIZATION_ELIGIBLE:    ${realEligible.materializationOperation?.mode}`);
  console.log(`  CHANGE_MATERIALIZATION_SIMULATED:        ${simulated.materializationState}`);
  console.log(`  CHANGE_MATERIALIZATION_BLOCKED:          ${blocked.materializationState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:                   ${insufficient.materializationState}`);
  console.log(`  Live repo:                               ${live.materializationState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_CHANGE_SET_MATERIALIZER_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
