/**
 * Phase 25.26 — Connected Workspace Creation validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ExecutionPlan,
  ExecutionPlanRiskLevel,
  ExecutionPlannerAssessment,
} from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
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
  type RepairLoopFinding,
} from '../src/autonomous-repair-loop/index.js';
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
  type WorkspacePopulationAssessment,
} from '../src/world2-workspace-population/index.js';
import {
  assessWorld2WorkspaceMaterialization,
  resetWorld2WorkspaceMaterializationModuleForTests,
  type World2WorkspaceMaterializationAssessment,
} from '../src/world2-workspace-materialization/index.js';
import {
  assessWorld2InstantiationGovernance,
  resetWorld2InstantiationGovernanceModuleForTests,
  type World2InstantiationGovernanceAssessment,
} from '../src/world2-workspace-instantiation-governance/index.js';
import {
  assessWorld2DisposableWorkspaceCreator,
  resetWorld2DisposableWorkspaceCreatorModuleForTests,
  type World2DisposableWorkspaceCreatorAssessment,
} from '../src/world2-disposable-workspace-creator/index.js';
import {
  assessWorld2DisposableWorkspaceInstantiator,
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests,
  type World2DisposableWorkspaceInstantiatorAssessment,
} from '../src/world2-disposable-workspace-instantiator/index.js';
import {
  assessWorld2RepositorySnapshot,
  resetWorld2RepositorySnapshotModuleForTests,
  type World2RepositorySnapshotAssessment,
} from '../src/world2-repository-snapshot/index.js';
import {
  assessWorld2RepositorySnapshotExecutor,
  resetWorld2RepositorySnapshotExecutorModuleForTests,
  type World2RepositorySnapshotExecutorAssessment,
} from '../src/world2-repository-snapshot-executor/index.js';
import {
  assessWorld2RepositorySnapshotMaterializer,
  resetWorld2RepositorySnapshotMaterializerModuleForTests,
  type World2RepositorySnapshotMaterializerAssessment,
} from '../src/world2-repository-snapshot-materializer/index.js';
import {
  assessWorld2ChangeSetMaterializer,
  resetWorld2ChangeSetMaterializerModuleForTests,
  type World2ChangeSetMaterializerAssessment,
} from '../src/world2-change-set-materializer/index.js';
import {
  assessWorld2DryRunExecutionComposer,
  resetWorld2DryRunExecutionComposerModuleForTests,
} from '../src/world2-dry-run-execution-composer/index.js';
import {
  WORKSPACE_CREATION_SAFETY_GUARANTEES,
  WORKSPACE_CREATION_STATES,
  CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
  CONNECTED_WORKSPACE_CREATION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessConnectedWorkspaceCreation,
  buildConnectedWorkspaceCreationArtifacts,
  buildConnectedWorkspaceCreationHistorySummary,
  buildConnectedWorkspaceCreationReportMarkdown,
  cleanupDisposableWorkspace,
  getConnectedWorkspaceCreationHistorySize,
  resetConnectedWorkspaceCreationModuleForTests,
} from '../src/connected-workspace-creation/index.js';
import {
  assessConnectedAutonomousBuildExecution,
} from '../src/connected-build-execution-foundation/index.js';

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
  'src/connected-workspace-creation/connected-workspace-creation-types.ts',
  'src/connected-workspace-creation/connected-workspace-creation-registry.ts',
  'src/connected-workspace-creation/connected-workspace-creation-authority.ts',
  'src/connected-workspace-creation/connected-workspace-creation-history.ts',
  'src/connected-workspace-creation/connected-workspace-creation-report-builder.ts',
  'src/connected-workspace-creation/workspace-creation-executor.ts',
  'src/connected-workspace-creation/index.ts',
  'architecture/CONNECTED_WORKSPACE_CREATION_REPORT.md',
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
    findingId: 'finding-connected-build-1',
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
      problemId: 'prob-connected-build',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-connected-build',
      problemId: 'prob-connected-build',
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
    cacheKey: 'fixture-connected-build-proof',
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
    cacheKey: 'fixture-connected-build-acceptance',
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
      runId: 'founder-test-connected-build-fixture',
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
    cacheKey: 'fixture-connected-build-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-connected-build-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for connected build execution validation',
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
    cacheKey: 'fixture-planner-connected-build',
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

function buildDryRunComposerAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
) {
  resetWorld2DryRunExecutionComposerModuleForTests();
  const changeSetMaterializer = buildChangeSetMaterializerAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2DryRunExecutionComposer({
    changeSetMaterializerAssessment: changeSetMaterializer,
  });
}

function buildScenarioAssessments(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
  performRealCreation = false,
) {
  const creator = buildCreatorAssessment(plan, proof, acceptance, founderTest);
  const instantiator = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: creator,
    executionModeOverride: performRealCreation ? 'REAL_INSTANTIATION' : undefined,
  });
  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  return assessConnectedWorkspaceCreation({
    instantiatorAssessment: instantiator,
    connectedBuildExecutionAssessment: buildAssessment,
    founderAcceptanceAssessment: acceptance,
    executionProofAssessment: proof,
    founderTestAssessment: founderTest ?? undefined,
    performRealCreation,
    rootDir: ROOT,
  });
}

function main(): void {
  console.log('');
  console.log('Connected Workspace Creation — Validation (leaf mode)');
  console.log('=====================================================');
  console.log('');

  checkpoint('start');
  resetConnectedWorkspaceCreationModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/connected-workspace-creation/connected-workspace-creation-authority.ts');
  const executorSource = readText('src/connected-workspace-creation/workspace-creation-executor.ts');
  const reportBuilderSource = readText('src/connected-workspace-creation/connected-workspace-creation-report-builder.ts');
  const reportMd = readText('architecture/CONNECTED_WORKSPACE_CREATION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:connected-workspace-creation']),
    'package.json',
  );

  assert(
    'core question registered',
    CONNECTED_WORKSPACE_CREATION_CORE_QUESTION.includes('real disposable workspace'),
    CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Real Workspace Creation') &&
      ORCHESTRATION_FLOW.includes('Workspace Creation Evidence'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 8 &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-disposable-workspace') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-workspace-population') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-workspace-materialization') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-workspace-instantiation-governance') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-disposable-workspace-creator') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-disposable-workspace-instantiator') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-build-execution-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'workspace states registered',
    WORKSPACE_CREATION_STATES.length === 5 &&
      WORKSPACE_CREATION_STATES.includes('WORKSPACE_CREATED') &&
      WORKSPACE_CREATION_STATES.includes('INSUFFICIENT_EVIDENCE'),
    WORKSPACE_CREATION_STATES.join(', '),
  );

  assert(
    'consumes disposable workspace via snapshot',
    authoritySource.includes('disposableWorkspaceAssessment'),
    'world2-disposable-workspace',
  );

  assert(
    'consumes population via snapshot',
    authoritySource.includes('populationAssessment'),
    'world2-workspace-population',
  );

  assert(
    'consumes materialization via snapshot',
    authoritySource.includes('materializationAssessment'),
    'world2-workspace-materialization',
  );

  assert(
    'consumes governance via snapshot',
    authoritySource.includes('instantiationGovernanceAssessment'),
    'world2-workspace-instantiation-governance',
  );

  assert(
    'consumes creator via snapshot',
    authoritySource.includes('creatorAssessment'),
    'world2-disposable-workspace-creator',
  );

  assert(
    'consumes instantiator',
    authoritySource.includes('assessWorld2DisposableWorkspaceInstantiator') &&
      authoritySource.includes('instantiatorAssessment'),
    'world2-disposable-workspace-instantiator',
  );

  assert(
    'consumes connected build execution',
    authoritySource.includes('connectedBuildExecutionAssessment'),
    'connected-build-execution-foundation',
  );

  assert(
    'consumes founder acceptance gate',
    authoritySource.includes('founderAcceptanceAssessment'),
    'founder-acceptance-gate',
  );

  assert(
    'workspace creation executor exported',
    executorSource.includes('export function executeWorkspaceCreation') &&
      executorSource.includes('export function inspectWorkspaceFilesystem'),
    'workspace-creation-executor',
  );

  assert(
    'filesystem evidence from real inspection',
    executorSource.includes('real-filesystem-inspection') &&
      executorSource.includes('existsSync'),
    'filesystem inspection',
  );

  assert(
    'cleanup helper exported',
    executorSource.includes('export function cleanupDisposableWorkspace'),
    'cleanup',
  );

  assert(
    'bounded execution safeguard documented',
    WORKSPACE_CREATION_SAFETY_GUARANTEES.some((g) => /max 1 disposable workspace/i.test(g)),
    'bounded execution',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Workspace Creation Score') &&
      reportBuilderSource.includes('Workspace Root') &&
      reportBuilderSource.includes('Creation Evidence'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(CONNECTED_WORKSPACE_CREATION_PASS_TOKEN),
    CONNECTED_WORKSPACE_CREATION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetConnectedWorkspaceCreationModuleForTests();
  const created = buildScenarioAssessments(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
    true,
  );
  const workspaceId = created.report.creationContract?.workspaceId ?? '';
  const workspaceRoot = created.report.creationContract?.workspaceRoot ?? '';

  assert(
    'workspace created scenario',
    created.report.workspaceState === 'WORKSPACE_CREATED' &&
      created.orchestrationState === 'WORKSPACE_CREATION_COMPLETE',
    created.report.workspaceState,
  );

  assert(
    'workspace actually created on filesystem',
    workspaceRoot.length > 0 &&
      existsSync(workspaceRoot) &&
      created.report.creationContract?.filesystemEvidence.workspaceExists === true &&
      created.report.creationContract?.filesystemEvidence.creationSuccessful === true,
    workspaceRoot,
  );

  assert(
    'creation contract generated (created)',
    created.report.creationContract !== null &&
      created.report.creationContract.realFileMutationPerformed === true &&
      created.report.creationContract.createdDirectories.length > 0 &&
      created.report.creationContract.creationEvidence.length > 0,
    `dirs=${created.report.creationContract?.createdDirectories.length ?? 0}`,
  );

  assert(
    'ten required questions answered (created)',
    Object.keys(created.report.questionAnswers).length === 10 &&
      created.report.questionAnswers.workspaceCreationProven === true,
    `${Object.keys(created.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (created)',
    created.report.workspaceCreationScore >= 80 &&
      created.report.recommendedNextActions.length > 0,
    `score=${created.report.workspaceCreationScore}`,
  );

  if (workspaceId) {
    cleanupDisposableWorkspace(ROOT, workspaceId);
    assert(
      'validation workspace cleaned up',
      !existsSync(workspaceRoot),
      workspaceId,
    );
  }

  const warnings = buildScenarioAssessments(
    buildPlan('LOW'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 85),
    true,
  );
  if (warnings.report.creationContract?.workspaceId) {
    cleanupDisposableWorkspace(ROOT, warnings.report.creationContract.workspaceId);
  }
  assert(
    'workspace created with warnings scenario',
    warnings.report.workspaceState === 'WORKSPACE_CREATED_WITH_WARNINGS',
    warnings.report.workspaceState,
  );

  const blocked = buildScenarioAssessments(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
    false,
  );
  assert(
    'workspace creation blocked scenario',
    blocked.report.workspaceState === 'WORKSPACE_CREATION_BLOCKED',
    blocked.report.workspaceState,
  );

  const insufficient = buildScenarioAssessments(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
    false,
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.workspaceState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.workspaceState,
  );

  assert(
    'history records assessments',
    getConnectedWorkspaceCreationHistorySize() >= 4,
    `${getConnectedWorkspaceCreationHistorySize()} entries`,
  );

  const historySummary = buildConnectedWorkspaceCreationHistorySummary();
  assert(
    'history summary tracks workspace states',
    historySummary.totalAssessments >= 4 &&
      historySummary.createdWorkspaces >= 1 &&
      historySummary.createdWithWarningsWorkspaces >= 1 &&
      historySummary.blockedCreations >= 1,
    JSON.stringify(historySummary),
  );

  resetConnectedWorkspaceCreationModuleForTests();
  const instantiator = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: buildCreatorAssessment(
      buildPlan('LOW'),
      buildExecutionProof('PROVEN_FIXED'),
      buildAcceptance('ACCEPTED'),
      buildFounderTest('FOUNDER_READY', true, 92),
    ),
    executionModeOverride: 'REAL_INSTANTIATION',
  });
  const dryRunComposer = buildDryRunComposerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const artifacts = buildConnectedWorkspaceCreationArtifacts({
    instantiatorAssessment: instantiator,
    connectedBuildExecutionAssessment: buildAssessment,
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED'),
    performRealCreation: true,
    rootDir: ROOT,
  });
  if (artifacts.connectedWorkspaceCreationAssessment.report.creationContract?.workspaceId) {
    cleanupDisposableWorkspace(
      ROOT,
      artifacts.connectedWorkspaceCreationAssessment.report.creationContract.workspaceId,
    );
  }
  const markdown = buildConnectedWorkspaceCreationReportMarkdown(
    artifacts.connectedWorkspaceCreationAssessment.report,
  );
  assert(
    'artifacts bundle includes markdown report',
    artifacts.connectedWorkspaceCreationReportMarkdown.length > 100 &&
      markdown.includes('Workspace State') &&
      markdown.includes('Creation Evidence'),
    `${artifacts.connectedWorkspaceCreationReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetConnectedWorkspaceCreationModuleForTests();
  const live = assessConnectedWorkspaceCreation({ rootDir: ROOT, performRealCreation: false });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.creationId.length > 0 &&
      live.report.workspaceState.length > 0,
    `${live.report.workspaceState} id=${live.report.creationId}`,
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
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Runtime: ${Date.now() - START}ms`);
  console.log('');

  if (failed > 0) {
    console.log('CONNECTED_WORKSPACE_CREATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(CONNECTED_WORKSPACE_CREATION_PASS_TOKEN);
  console.log('');
  console.log('Workspace states verified:');
  console.log(`  WORKSPACE_CREATED:             ${created.report.workspaceState}`);
  console.log(`  WORKSPACE_CREATED_WITH_WARNINGS: ${warnings.report.workspaceState}`);
  console.log(`  WORKSPACE_CREATION_BLOCKED:    ${blocked.report.workspaceState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:         ${insufficient.report.workspaceState}`);
  console.log(`  Live repo:                     ${live.report.workspaceState}`);
  console.log('');
  console.log('Report: architecture/CONNECTED_WORKSPACE_CREATION_REPORT.md');
  console.log('');
}

main();
