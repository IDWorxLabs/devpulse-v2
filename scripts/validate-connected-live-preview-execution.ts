/**
 * Phase 25.29 — Connected Live Preview Execution validation (leaf mode).
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
  assessConnectedRuntimeExecution,
  cleanupActiveRuntime,
} from '../src/connected-runtime-execution/index.js';
import {
  PREVIEW_EXECUTION_SAFETY_GUARANTEES,
  PREVIEW_EXECUTION_STATES,
  CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
  CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessConnectedLivePreviewExecution,
  buildConnectedLivePreviewExecutionArtifacts,
  buildConnectedLivePreviewExecutionHistorySummary,
  buildConnectedLivePreviewExecutionReportMarkdown,
  getConnectedLivePreviewExecutionHistorySize,
  resetConnectedLivePreviewExecutionModuleForTests,
} from '../src/connected-live-preview-execution/index.js';
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
  'src/connected-live-preview-execution/connected-live-preview-execution-types.ts',
  'src/connected-live-preview-execution/connected-live-preview-execution-registry.ts',
  'src/connected-live-preview-execution/connected-live-preview-execution-authority.ts',
  'src/connected-live-preview-execution/connected-live-preview-execution-history.ts',
  'src/connected-live-preview-execution/connected-live-preview-execution-report-builder.ts',
  'src/connected-live-preview-execution/preview-activation-engine.ts',
  'src/connected-live-preview-execution/index.ts',
  'architecture/CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT.md',
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

async function buildPreviewScenario(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
  performRealPreview = false,
) {
  const runtime = await buildRuntimeScenario(
    plan,
    proof,
    acceptance,
    founderTest,
    performRealPreview,
  );
  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  return assessConnectedLivePreviewExecution({
    rootDir: ROOT,
    connectedRuntimeExecutionAssessment: runtime,
    connectedWorkspaceCreationAssessment:
      runtime.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? undefined,
    connectedBuildExecutionFoundationAssessment: buildAssessment,
    founderAcceptanceAssessment: acceptance,
    executionProofAssessment: proof,
    founderTestAssessment: founderTest ?? undefined,
    performRealPreview,
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Connected Live Preview Execution — Validation (leaf mode)');
  console.log('=========================================================');
  console.log('');

  checkpoint('start');
  resetConnectedLivePreviewExecutionModuleForTests();
  resetConnectedWorkspaceCreationModuleForTests();
  resetConnectedBuildExecutionModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/connected-live-preview-execution/connected-live-preview-execution-authority.ts');
  const engineSource = readText('src/connected-live-preview-execution/preview-activation-engine.ts');
  const reportBuilderSource = readText('src/connected-live-preview-execution/connected-live-preview-execution-report-builder.ts');
  const reportMd = readText('architecture/CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:connected-live-preview-execution']),
    'package.json',
  );

  assert(
    'core question registered',
    CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION.includes('founder-viewable preview'),
    CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Real Preview Activation') &&
      ORCHESTRATION_FLOW.includes('Preview Evidence'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 8 &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-runtime-execution') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-live-preview-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('live-preview-reality') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'preview states registered',
    PREVIEW_EXECUTION_STATES.length === 5 &&
      PREVIEW_EXECUTION_STATES.includes('PREVIEW_ACTIVATED') &&
      PREVIEW_EXECUTION_STATES.includes('INSUFFICIENT_EVIDENCE'),
    PREVIEW_EXECUTION_STATES.join(', '),
  );

  assert(
    'consumes runtime execution',
    authoritySource.includes('connectedRuntimeExecutionAssessment') &&
      authoritySource.includes('assessConnectedRuntimeExecution'),
    'connected-runtime-execution',
  );

  assert(
    'consumes preview foundation',
    authoritySource.includes('assessConnectedLivePreview') &&
      authoritySource.includes('connectedLivePreviewFoundationAssessment'),
    'connected-live-preview-foundation',
  );

  assert(
    'consumes live preview reality',
    authoritySource.includes('livePreviewRealityAssessment'),
    'live-preview-reality',
  );

  assert(
    'consumes execution verification loop',
    authoritySource.includes('buildExecutionVerificationReport'),
    'execution-verification-loop',
  );

  assert(
    'consumes founder acceptance gate',
    authoritySource.includes('founderAcceptanceAssessment'),
    'founder-acceptance-gate',
  );

  assert(
    'consumes workspace creation',
    authoritySource.includes('connectedWorkspaceCreationAssessment'),
    'connected-workspace-creation',
  );

  assert(
    'preview activation engine exported',
    engineSource.includes('export async function executePreviewActivation') &&
      engineSource.includes('httpGet'),
    'preview-activation-engine',
  );

  assert(
    'preview evidence from real activation',
    engineSource.includes('real-preview-activation-inspection') &&
      engineSource.includes('previewUrlGenerated') &&
      engineSource.includes('previewContentServed'),
    'preview evidence',
  );

  assert(
    'preview URL generated in engine',
    engineSource.includes('PREVIEW_URL_GENERATED') &&
      engineSource.includes('.preview-founder-metadata.json'),
    'preview url',
  );

  assert(
    'bounded execution safeguard documented',
    PREVIEW_EXECUTION_SAFETY_GUARANTEES.some((g) => /max 1 preview/i.test(g)),
    'bounded execution',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Preview Score') &&
      reportBuilderSource.includes('Preview Evidence') &&
      reportBuilderSource.includes('Preview URL'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN),
    CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetConnectedLivePreviewExecutionModuleForTests();
  const activated = await buildPreviewScenario(
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
    'preview activated scenario',
    activated.report.previewState === 'PREVIEW_ACTIVATED' &&
      activated.orchestrationState === 'PREVIEW_EXECUTION_COMPLETE',
    activated.report.previewState,
  );

  assert(
    'preview activation attempted',
    activated.report.questionAnswers.previewActivationAttempted === true,
    String(activated.report.questionAnswers.previewActivationAttempted),
  );

  assert(
    'preview URL generated',
    activated.report.previewUrl !== null &&
      activated.report.previewUrl.startsWith('http://127.0.0.1:') &&
      evidence?.previewUrlGenerated === true,
    activated.report.previewUrl ?? 'null',
  );

  assert(
    'preview activation contract generated',
    activated.report.activationContract !== null &&
      activated.report.activationContract.realPreviewLaunchPerformed === true &&
      activated.report.activationContract.previewEvidence.length > 0,
    `evidence=${activated.report.activationContract?.previewEvidence.length ?? 0}`,
  );

  assert(
    'preview evidence collected',
    evidence?.previewActivated === true &&
      evidence.previewReachable === true &&
      evidence.previewContentServed === true &&
      evidence.previewResponseSuccessful === true &&
      evidence.previewEndpointAvailable === true &&
      evidence.previewArtifactsPresent === true,
    JSON.stringify(evidence),
  );

  assert(
    'preview endpoint reachable and content served',
    evidence?.previewReachable === true && evidence.previewContentServed === true,
    JSON.stringify(evidence),
  );

  assert(
    'preview artifacts collected',
    existsSync(join(workspaceRoot, '.preview-activated.json')) &&
      existsSync(join(workspaceRoot, '.preview-founder-metadata.json')),
    workspaceRoot,
  );

  assert(
    'ten required questions answered (activated)',
    Object.keys(activated.report.questionAnswers).length === 10 &&
      activated.report.questionAnswers.previewActivationProven === true,
    `${Object.keys(activated.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (activated)',
    activated.report.previewScore >= 80 &&
      activated.report.previewActivationDurationMs >= 0 &&
      activated.report.recommendedNextActions.length > 0,
    `score=${activated.report.previewScore}`,
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

  const warnings = await buildPreviewScenario(
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
    'preview activated with warnings scenario',
    warnings.report.previewState === 'PREVIEW_ACTIVATED_WITH_WARNINGS',
    warnings.report.previewState,
  );

  const blocked = await buildPreviewScenario(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
    false,
  );
  assert(
    'preview activation blocked scenario',
    blocked.report.previewState === 'PREVIEW_ACTIVATION_BLOCKED',
    blocked.report.previewState,
  );

  const insufficient = await buildPreviewScenario(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
    false,
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.previewState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.previewState,
  );

  assert(
    'history records assessments',
    getConnectedLivePreviewExecutionHistorySize() >= 4,
    `${getConnectedLivePreviewExecutionHistorySize()} entries`,
  );

  const historySummary = buildConnectedLivePreviewExecutionHistorySummary();
  assert(
    'history summary tracks preview states',
    historySummary.totalAssessments >= 4 &&
      historySummary.activatedPreviews >= 1 &&
      historySummary.activatedWithWarningsPreviews >= 1 &&
      historySummary.blockedActivations >= 1,
    JSON.stringify(historySummary),
  );

  resetConnectedLivePreviewExecutionModuleForTests();
  const runtime = await buildRuntimeScenario(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
    true,
  );
  const dryRunComposer = buildDryRunComposerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const artifacts = await buildConnectedLivePreviewExecutionArtifacts({
    rootDir: ROOT,
    connectedRuntimeExecutionAssessment: runtime,
    connectedWorkspaceCreationAssessment:
      runtime.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? undefined,
    connectedBuildExecutionFoundationAssessment: buildAssessment,
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED'),
    performRealPreview: true,
  });
  cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (artifacts.connectedLivePreviewExecutionAssessment.report.activationContract?.workspaceId) {
    cleanupDisposableWorkspace(
      ROOT,
      artifacts.connectedLivePreviewExecutionAssessment.report.activationContract.workspaceId,
    );
  }
  const markdown = buildConnectedLivePreviewExecutionReportMarkdown(
    artifacts.connectedLivePreviewExecutionAssessment.report,
  );
  assert(
    'artifacts bundle includes markdown report',
    artifacts.connectedLivePreviewExecutionReportMarkdown.length > 100 &&
      markdown.includes('Preview State') &&
      markdown.includes('Preview Evidence'),
    `${artifacts.connectedLivePreviewExecutionReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetConnectedLivePreviewExecutionModuleForTests();
  const live = await assessConnectedLivePreviewExecution({ rootDir: ROOT, performRealPreview: false });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.executionId.length > 0 && live.report.previewState.length > 0,
    `${live.report.previewState} id=${live.report.executionId}`,
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
    console.log('CONNECTED_LIVE_PREVIEW_EXECUTION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN);
  console.log('');
  console.log('Preview states verified:');
  console.log(`  PREVIEW_ACTIVATED:               ${activated.report.previewState}`);
  console.log(`  PREVIEW_ACTIVATED_WITH_WARNINGS: ${warnings.report.previewState}`);
  console.log(`  PREVIEW_ACTIVATION_BLOCKED:      ${blocked.report.previewState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:           ${insufficient.report.previewState}`);
  console.log(`  Live repo:                       ${live.report.previewState}`);
  console.log('');
  console.log('Report: architecture/CONNECTED_LIVE_PREVIEW_EXECUTION_REPORT.md');
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
