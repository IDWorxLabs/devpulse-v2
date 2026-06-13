/**
 * Phase 25.28 — Connected Runtime Execution validation (leaf mode).
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
  assessConnectedAutonomousBuildExecution,
  resetConnectedBuildExecutionModuleForTests,
} from '../src/connected-build-execution-foundation/index.js';
import {
  assessConnectedWorkspaceCreation,
  cleanupDisposableWorkspace,
  resetConnectedWorkspaceCreationModuleForTests,
} from '../src/connected-workspace-creation/index.js';
import {
  RUNTIME_EXECUTION_SAFETY_GUARANTEES,
  RUNTIME_EXECUTION_STATES,
  CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
  CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessConnectedRuntimeExecution,
  buildConnectedRuntimeExecutionArtifacts,
  buildConnectedRuntimeExecutionHistorySummary,
  buildConnectedRuntimeExecutionReportMarkdown,
  cleanupActiveRuntime,
  getConnectedRuntimeExecutionHistorySize,
  resetConnectedRuntimeExecutionModuleForTests,
} from '../src/connected-runtime-execution/index.js';
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
  'src/connected-runtime-execution/connected-runtime-execution-types.ts',
  'src/connected-runtime-execution/connected-runtime-execution-registry.ts',
  'src/connected-runtime-execution/connected-runtime-execution-authority.ts',
  'src/connected-runtime-execution/connected-runtime-execution-history.ts',
  'src/connected-runtime-execution/connected-runtime-execution-report-builder.ts',
  'src/connected-runtime-execution/runtime-activation-engine.ts',
  'src/connected-runtime-execution/index.ts',
  'architecture/CONNECTED_RUNTIME_EXECUTION_REPORT.md',
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
    findingId: 'finding-connected-runtime-1',
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
      problemId: 'prob-connected-runtime',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-connected-runtime',
      problemId: 'prob-connected-runtime',
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
    cacheKey: 'fixture-connected-runtime-proof',
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
    cacheKey: 'fixture-connected-runtime-acceptance',
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
      runId: 'founder-test-connected-runtime-fixture',
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
    cacheKey: 'fixture-connected-runtime-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-connected-runtime-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for connected runtime execution validation',
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
    cacheKey: 'fixture-planner-connected-runtime',
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
  performReal = false,
): World2DisposableWorkspaceInstantiatorAssessment {
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const creator = buildCreatorAssessment(plan, proof, acceptance, founderTest);
  return assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: creator,
    executionModeOverride: performReal ? 'REAL_INSTANTIATION' : undefined,
  });
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

function buildWorkspaceScenario(
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

async function buildRuntimeScenario(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
  performRealActivation = false,
) {
  const workspace = buildWorkspaceScenario(
    plan,
    proof,
    acceptance,
    founderTest,
    performRealActivation,
  );
  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  return assessConnectedRuntimeExecution({
    rootDir: ROOT,
    connectedWorkspaceCreationAssessment: workspace,
    connectedBuildExecutionFoundationAssessment: buildAssessment,
    founderAcceptanceAssessment: acceptance,
    executionProofAssessment: proof,
    founderTestAssessment: founderTest ?? undefined,
    performRealActivation,
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Connected Runtime Execution — Validation (leaf mode)');
  console.log('====================================================');
  console.log('');

  checkpoint('start');
  resetConnectedRuntimeExecutionModuleForTests();
  resetConnectedWorkspaceCreationModuleForTests();
  resetConnectedBuildExecutionModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/connected-runtime-execution/connected-runtime-execution-authority.ts');
  const engineSource = readText('src/connected-runtime-execution/runtime-activation-engine.ts');
  const reportBuilderSource = readText('src/connected-runtime-execution/connected-runtime-execution-report-builder.ts');
  const reportMd = readText('architecture/CONNECTED_RUNTIME_EXECUTION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:connected-runtime-execution']),
    'package.json',
  );

  assert(
    'core question registered',
    CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION.includes('activate a generated application runtime'),
    CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Real Runtime Activation') &&
      ORCHESTRATION_FLOW.includes('Runtime Evidence'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 7 &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-build-execution') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-runtime-activation-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-controlled-execution-runtime') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'runtime states registered',
    RUNTIME_EXECUTION_STATES.length === 5 &&
      RUNTIME_EXECUTION_STATES.includes('RUNTIME_ACTIVATED') &&
      RUNTIME_EXECUTION_STATES.includes('INSUFFICIENT_EVIDENCE'),
    RUNTIME_EXECUTION_STATES.join(', '),
  );

  assert(
    'consumes build execution foundation',
    authoritySource.includes('connectedBuildExecutionFoundationAssessment') &&
      authoritySource.includes('prepareBuildExecutionInWorkspace'),
    'connected-build-execution',
  );

  assert(
    'consumes runtime activation foundation',
    authoritySource.includes('assessConnectedRuntimeActivation') &&
      authoritySource.includes('connectedRuntimeActivationAssessment'),
    'connected-runtime-activation-foundation',
  );

  assert(
    'consumes workspace creation',
    authoritySource.includes('connectedWorkspaceCreationAssessment') &&
      authoritySource.includes('assessConnectedWorkspaceCreation'),
    'connected-workspace-creation',
  );

  assert(
    'consumes execution package runtime',
    authoritySource.includes('buildExecutionPackageRuntimeReport'),
    'execution-package-runtime',
  );

  assert(
    'consumes execution verification loop',
    authoritySource.includes('buildExecutionVerificationReport'),
    'execution-verification-loop',
  );

  assert(
    'consumes world2 runtime authority',
    authoritySource.includes('assessWorld2ControlledExecutionRuntime'),
    'world2-controlled-execution-runtime',
  );

  assert(
    'consumes founder acceptance gate',
    authoritySource.includes('founderAcceptanceAssessment'),
    'founder-acceptance-gate',
  );

  assert(
    'runtime activation engine exported',
    engineSource.includes('export async function executeRuntimeActivation') &&
      engineSource.includes('export function prepareBuildExecutionInWorkspace') &&
      engineSource.includes('export function cleanupActiveRuntime'),
    'runtime-activation-engine',
  );

  assert(
    'runtime evidence from real activation',
    engineSource.includes('real-runtime-activation-inspection') &&
      engineSource.includes('probeEndpoint') &&
      engineSource.includes('spawn'),
    'runtime evidence',
  );

  assert(
    'bounded execution safeguard documented',
    RUNTIME_EXECUTION_SAFETY_GUARANTEES.some((g) => /max 1 runtime/i.test(g)),
    'bounded execution',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Runtime Score') &&
      reportBuilderSource.includes('Runtime Evidence') &&
      reportBuilderSource.includes('Startup Duration'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN),
    CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetConnectedRuntimeExecutionModuleForTests();
  const activated = await buildRuntimeScenario(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
    true,
  );
  const workspaceId = activated.report.activationContract?.workspaceId ?? '';
  const workspaceRoot =
    activated.report.inputSnapshot.connectedWorkspaceCreationAssessment?.report.creationContract?.workspaceRoot ?? '';
  const evidence = activated.report.activationContract?.activationEvidence;

  assert(
    'runtime activated scenario',
    activated.report.runtimeState === 'RUNTIME_ACTIVATED' &&
      activated.orchestrationState === 'RUNTIME_EXECUTION_COMPLETE',
    activated.report.runtimeState,
  );

  assert(
    'runtime activation attempted',
    activated.report.questionAnswers.runtimeActivationAttempted === true,
    String(activated.report.questionAnswers.runtimeActivationAttempted),
  );

  assert(
    'runtime activation contract generated',
    activated.report.activationContract !== null &&
      activated.report.activationContract.realRuntimeLaunchPerformed === true &&
      activated.report.activationContract.runtimeEvidence.length > 0,
    `evidence=${activated.report.activationContract?.runtimeEvidence.length ?? 0}`,
  );

  assert(
    'runtime evidence collected',
    evidence?.runtimeStarted === true &&
      evidence.startupSucceeded === true &&
      evidence.processDetected === true &&
      evidence.runtimeEndpointAvailable === true &&
      evidence.startupArtifactsPresent === true &&
      evidence.startupDurationMs >= 0,
    JSON.stringify(evidence),
  );

  assert(
    'startup artifacts collected',
    activated.report.activationContract?.runtimeArtifacts.some((a) => a.path === 'dist/server.js') === true &&
      existsSync(join(workspaceRoot, '.runtime-activated.json')),
    workspaceRoot,
  );

  assert(
    'ten required questions answered (activated)',
    Object.keys(activated.report.questionAnswers).length === 10 &&
      activated.report.questionAnswers.runtimeActivationProven === true,
    `${Object.keys(activated.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (activated)',
    activated.report.runtimeScore >= 80 &&
      activated.report.startupDurationMs >= 0 &&
      activated.report.recommendedNextActions.length > 0,
    `score=${activated.report.runtimeScore}`,
  );

  cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (workspaceId) {
    cleanupDisposableWorkspace(ROOT, workspaceId);
    assert(
      'validation workspace cleaned up',
      !existsSync(workspaceRoot),
      workspaceId,
    );
  }

  const warnings = await buildRuntimeScenario(
    buildPlan('LOW'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 85),
    true,
  );
  cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (warnings.report.activationContract?.workspaceId) {
    cleanupDisposableWorkspace(ROOT, warnings.report.activationContract.workspaceId);
  }
  assert(
    'runtime activated with warnings scenario',
    warnings.report.runtimeState === 'RUNTIME_ACTIVATED_WITH_WARNINGS',
    warnings.report.runtimeState,
  );

  const blocked = await buildRuntimeScenario(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
    false,
  );
  assert(
    'runtime activation blocked scenario',
    blocked.report.runtimeState === 'RUNTIME_ACTIVATION_BLOCKED',
    blocked.report.runtimeState,
  );

  const insufficient = await buildRuntimeScenario(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
    false,
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.runtimeState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.runtimeState,
  );

  assert(
    'history records assessments',
    getConnectedRuntimeExecutionHistorySize() >= 4,
    `${getConnectedRuntimeExecutionHistorySize()} entries`,
  );

  const historySummary = buildConnectedRuntimeExecutionHistorySummary();
  assert(
    'history summary tracks runtime states',
    historySummary.totalAssessments >= 4 &&
      historySummary.activatedRuntimes >= 1 &&
      historySummary.activatedWithWarningsRuntimes >= 1 &&
      historySummary.blockedActivations >= 1,
    JSON.stringify(historySummary),
  );

  resetConnectedRuntimeExecutionModuleForTests();
  const dryRunComposer = buildDryRunComposerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const workspace = buildWorkspaceScenario(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
    true,
  );
  const artifacts = await buildConnectedRuntimeExecutionArtifacts({
    rootDir: ROOT,
    connectedWorkspaceCreationAssessment: workspace,
    connectedBuildExecutionFoundationAssessment: buildAssessment,
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED'),
    performRealActivation: true,
  });
  cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (artifacts.connectedRuntimeExecutionAssessment.report.activationContract?.workspaceId) {
    cleanupDisposableWorkspace(
      ROOT,
      artifacts.connectedRuntimeExecutionAssessment.report.activationContract.workspaceId,
    );
  }
  const markdown = buildConnectedRuntimeExecutionReportMarkdown(
    artifacts.connectedRuntimeExecutionAssessment.report,
  );
  assert(
    'artifacts bundle includes markdown report',
    artifacts.connectedRuntimeExecutionReportMarkdown.length > 100 &&
      markdown.includes('Runtime State') &&
      markdown.includes('Runtime Evidence'),
    `${artifacts.connectedRuntimeExecutionReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetConnectedRuntimeExecutionModuleForTests();
  const live = await assessConnectedRuntimeExecution({ rootDir: ROOT, performRealActivation: false });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.executionId.length > 0 && live.report.runtimeState.length > 0,
    `${live.report.runtimeState} id=${live.report.executionId}`,
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
    console.log('CONNECTED_RUNTIME_EXECUTION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN);
  console.log('');
  console.log('Runtime states verified:');
  console.log(`  RUNTIME_ACTIVATED:               ${activated.report.runtimeState}`);
  console.log(`  RUNTIME_ACTIVATED_WITH_WARNINGS: ${warnings.report.runtimeState}`);
  console.log(`  RUNTIME_ACTIVATION_BLOCKED:      ${blocked.report.runtimeState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:           ${insufficient.report.runtimeState}`);
  console.log(`  Live repo:                       ${live.report.runtimeState}`);
  console.log('');
  console.log('Report: architecture/CONNECTED_RUNTIME_EXECUTION_REPORT.md');
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
