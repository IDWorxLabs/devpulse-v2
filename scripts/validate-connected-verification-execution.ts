/**
 * Phase 25.30 — Connected Verification Execution validation (leaf mode).
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
  assessConnectedLivePreviewExecution,
} from '../src/connected-live-preview-execution/index.js';
import {
  VERIFICATION_EXECUTION_SAFETY_GUARANTEES,
  VERIFICATION_EXECUTION_STATES,
  CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
  CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessConnectedVerificationExecution,
  buildConnectedVerificationExecutionArtifacts,
  buildConnectedVerificationExecutionHistorySummary,
  buildConnectedVerificationExecutionReportMarkdown,
  getConnectedVerificationExecutionHistorySize,
  resetConnectedVerificationExecutionModuleForTests,
} from '../src/connected-verification-execution/index.js';
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
  'src/connected-verification-execution/connected-verification-execution-types.ts',
  'src/connected-verification-execution/connected-verification-execution-registry.ts',
  'src/connected-verification-execution/connected-verification-execution-authority.ts',
  'src/connected-verification-execution/connected-verification-execution-history.ts',
  'src/connected-verification-execution/connected-verification-execution-report-builder.ts',
  'src/connected-verification-execution/verification-execution-engine.ts',
  'src/connected-verification-execution/index.ts',
  'architecture/CONNECTED_VERIFICATION_EXECUTION_REPORT.md',
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

async function buildVerificationScenario(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
  founderTest: FounderTestAssessment | null,
  performRealVerification = false,
) {
  const preview = await buildPreviewScenario(
    plan,
    proof,
    acceptance,
    founderTest,
    performRealVerification,
  );
  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  return assessConnectedVerificationExecution({
    rootDir: ROOT,
    connectedLivePreviewExecutionAssessment: preview,
    connectedRuntimeExecutionAssessment:
      preview.report.inputSnapshot.connectedRuntimeExecutionAssessment,
    connectedWorkspaceCreationAssessment:
      preview.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? undefined,
    connectedBuildExecutionFoundationAssessment: buildAssessment,
    founderAcceptanceAssessment: acceptance,
    executionProofAssessment: proof,
    founderTestAssessment: founderTest ?? undefined,
    performRealVerification,
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Connected Verification Execution — Validation (leaf mode)');
  console.log('==========================================================');
  console.log('');

  checkpoint('start');
  resetConnectedVerificationExecutionModuleForTests();
  resetConnectedWorkspaceCreationModuleForTests();
  resetConnectedBuildExecutionModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/connected-verification-execution/connected-verification-execution-authority.ts');
  const engineSource = readText('src/connected-verification-execution/verification-execution-engine.ts');
  const reportBuilderSource = readText('src/connected-verification-execution/connected-verification-execution-report-builder.ts');
  const reportMd = readText('architecture/CONNECTED_VERIFICATION_EXECUTION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:connected-verification-execution']),
    'package.json',
  );

  assert(
    'core question registered',
    CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION.includes('verify a generated application'),
    CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Real Verification Execution') &&
      ORCHESTRATION_FLOW.includes('Verification Evidence'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 10 &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-live-preview-execution') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-verification-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('verification-reality') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-dry-run-execution-verifier') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'verification states registered',
    VERIFICATION_EXECUTION_STATES.length === 5 &&
      VERIFICATION_EXECUTION_STATES.includes('VERIFICATION_EXECUTED') &&
      VERIFICATION_EXECUTION_STATES.includes('INSUFFICIENT_EVIDENCE'),
    VERIFICATION_EXECUTION_STATES.join(', '),
  );

  assert(
    'consumes live preview execution',
    authoritySource.includes('connectedLivePreviewExecutionAssessment') &&
      authoritySource.includes('assessConnectedLivePreviewExecution'),
    'connected-live-preview-execution',
  );

  assert(
    'consumes verification foundation',
    authoritySource.includes('assessConnectedVerification') &&
      authoritySource.includes('connectedVerificationFoundationAssessment'),
    'connected-verification-foundation',
  );

  assert(
    'consumes verification reality',
    authoritySource.includes('verificationRealityAssessment'),
    'verification-reality',
  );

  assert(
    'consumes dry run verifier',
    authoritySource.includes('assessWorld2DryRunExecutionVerifier') &&
      authoritySource.includes('dryRunVerifierAssessment'),
    'world2-dry-run-execution-verifier',
  );

  assert(
    'consumes runtime execution',
    authoritySource.includes('connectedRuntimeExecutionAssessment'),
    'connected-runtime-execution',
  );

  assert(
    'consumes workspace creation',
    authoritySource.includes('connectedWorkspaceCreationAssessment'),
    'connected-workspace-creation',
  );

  assert(
    'verification execution engine exported',
    engineSource.includes('export async function executeVerificationExecution') &&
      engineSource.includes('httpGet'),
    'verification-execution-engine',
  );

  assert(
    'verification evidence from real execution',
    engineSource.includes('real-verification-execution-inspection') &&
      engineSource.includes('verificationCompleted') &&
      engineSource.includes('previewProbeStatus'),
    'verification evidence',
  );

  assert(
    'workspace and artifact checks in engine',
    engineSource.includes('workspace-exists') &&
      engineSource.includes('build-artifacts-exist') &&
      engineSource.includes('runtime-evidence-exists') &&
      engineSource.includes('preview-evidence-exists') &&
      engineSource.includes('.verification-executed.json'),
    'bounded checks',
  );

  assert(
    'bounded execution safeguard documented',
    VERIFICATION_EXECUTION_SAFETY_GUARANTEES.some((g) => /max 1 verification/i.test(g)),
    'bounded execution',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Verification Score') &&
      reportBuilderSource.includes('Verification Evidence') &&
      reportBuilderSource.includes('Verification Coverage'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN),
    CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetConnectedVerificationExecutionModuleForTests();
  const executed = await buildVerificationScenario(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
    true,
  );
  const workspaceId = executed.report.executionContract?.workspaceId ?? '';
  const workspaceRoot =
    executed.report.inputSnapshot.connectedWorkspaceCreationAssessment?.report.creationContract?.workspaceRoot ?? '';
  const evidence = executed.report.executionContract?.executionEvidence;

  assert(
    'verification executed scenario',
    executed.report.verificationState === 'VERIFICATION_EXECUTED' &&
      executed.orchestrationState === 'VERIFICATION_EXECUTION_COMPLETE',
    executed.report.verificationState,
  );

  assert(
    'verification execution attempted',
    executed.report.questionAnswers.verificationExecuted === true,
    String(executed.report.questionAnswers.verificationExecuted),
  );

  assert(
    'verification checks executed',
    (evidence?.verificationChecksExecuted ?? 0) > 0 &&
      executed.report.questionAnswers.checksActuallyRun === true,
    String(evidence?.verificationChecksExecuted),
  );

  assert(
    'verification contract generated',
    executed.report.executionContract !== null &&
      executed.report.executionContract.realVerificationExecutionPerformed === true &&
      executed.report.executionContract.verificationEvidence.length > 0,
    `evidence=${executed.report.executionContract?.verificationEvidence.length ?? 0}`,
  );

  assert(
    'verification evidence collected',
    evidence?.verificationCompleted === true &&
      evidence.verificationSucceeded === true &&
      evidence.verificationArtifactsGenerated === true &&
      evidence.previewProbeStatus === 'PASS' &&
      evidence.workspaceEvidenceStatus === 'PASS' &&
      evidence.runtimeEvidenceStatus === 'PASS' &&
      evidence.previewEvidenceStatus === 'PASS',
    JSON.stringify(evidence),
  );

  assert(
    'preview URL probed',
    executed.report.previewProbeResult === 'PASS',
    executed.report.previewProbeResult,
  );

  assert(
    'verification artifact generated',
    existsSync(join(workspaceRoot, '.verification-executed.json')) &&
      executed.report.executionContract?.verificationArtifacts.some((a) => a.path === '.verification-executed.json') === true,
    workspaceRoot,
  );

  assert(
    'ten required questions answered (executed)',
    Object.keys(executed.report.questionAnswers).length === 10 &&
      executed.report.questionAnswers.verificationExecutionProven === true,
    `${Object.keys(executed.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (executed)',
    executed.report.verificationScore >= 80 &&
      executed.report.verificationCoverage >= 80 &&
      executed.report.recommendedNextActions.length > 0,
    `score=${executed.report.verificationScore}`,
  );

  await cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (workspaceId) {
    cleanupDisposableWorkspace(ROOT, workspaceId);
    assert(
      'validation workspace cleaned up',
      !existsSync(workspaceRoot),
      workspaceId,
    );
  }

  const warnings = await buildVerificationScenario(
    buildPlan('LOW'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 85),
    true,
  );
  await cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (warnings.report.executionContract?.workspaceId) {
    cleanupDisposableWorkspace(ROOT, warnings.report.executionContract.workspaceId);
  }
  assert(
    'verification executed with warnings scenario',
    warnings.report.verificationState === 'VERIFICATION_EXECUTED_WITH_WARNINGS',
    warnings.report.verificationState,
  );

  const blocked = await buildVerificationScenario(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
    false,
  );
  assert(
    'verification execution blocked scenario',
    blocked.report.verificationState === 'VERIFICATION_EXECUTION_BLOCKED',
    blocked.report.verificationState,
  );

  const insufficient = await buildVerificationScenario(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
    false,
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.verificationState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.verificationState,
  );

  assert(
    'history records assessments',
    getConnectedVerificationExecutionHistorySize() >= 4,
    `${getConnectedVerificationExecutionHistorySize()} entries`,
  );

  const historySummary = buildConnectedVerificationExecutionHistorySummary();
  assert(
    'history summary tracks verification states',
    historySummary.totalAssessments >= 4 &&
      historySummary.executedVerifications >= 1 &&
      historySummary.executedWithWarningsVerifications >= 1 &&
      historySummary.blockedExecutions >= 1,
    JSON.stringify(historySummary),
  );

  resetConnectedVerificationExecutionModuleForTests();
  const preview = await buildPreviewScenario(
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
  const artifacts = await buildConnectedVerificationExecutionArtifacts({
    rootDir: ROOT,
    connectedLivePreviewExecutionAssessment: preview,
    connectedRuntimeExecutionAssessment:
      preview.report.inputSnapshot.connectedRuntimeExecutionAssessment,
    connectedWorkspaceCreationAssessment:
      preview.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? undefined,
    connectedBuildExecutionFoundationAssessment: buildAssessment,
    founderAcceptanceAssessment: buildAcceptance('ACCEPTED'),
    performRealVerification: true,
  });
  await cleanupActiveRuntime();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (artifacts.connectedVerificationExecutionAssessment.report.executionContract?.workspaceId) {
    cleanupDisposableWorkspace(
      ROOT,
      artifacts.connectedVerificationExecutionAssessment.report.executionContract.workspaceId,
    );
  }
  const markdown = buildConnectedVerificationExecutionReportMarkdown(
    artifacts.connectedVerificationExecutionAssessment.report,
  );
  assert(
    'artifacts bundle includes markdown report',
    artifacts.connectedVerificationExecutionReportMarkdown.length > 100 &&
      markdown.includes('Verification State') &&
      markdown.includes('Verification Evidence'),
    `${artifacts.connectedVerificationExecutionReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetConnectedVerificationExecutionModuleForTests();
  const live = await assessConnectedVerificationExecution({ rootDir: ROOT, performRealVerification: false });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.executionId.length > 0 && live.report.verificationState.length > 0,
    `${live.report.verificationState} id=${live.report.executionId}`,
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
    console.log('CONNECTED_VERIFICATION_EXECUTION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN);
  console.log('');
  console.log('Verification states verified:');
  console.log(`  VERIFICATION_EXECUTED:               ${executed.report.verificationState}`);
  console.log(`  VERIFICATION_EXECUTED_WITH_WARNINGS: ${warnings.report.verificationState}`);
  console.log(`  VERIFICATION_EXECUTION_BLOCKED:      ${blocked.report.verificationState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:               ${insufficient.report.verificationState}`);
  console.log(`  Live repo:                           ${live.report.verificationState}`);
  console.log('');
  console.log('Report: architecture/CONNECTED_VERIFICATION_EXECUTION_REPORT.md');
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
