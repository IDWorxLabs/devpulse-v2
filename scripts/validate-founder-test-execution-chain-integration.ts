/**
 * Phase 25.25 — Founder Test Execution Chain Integration validation (leaf mode).
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
  assessConnectedRuntimeActivation,
  resetConnectedRuntimeActivationModuleForTests,
} from '../src/connected-runtime-activation-foundation/index.js';
import {
  assessConnectedLivePreview,
} from '../src/connected-live-preview-foundation/index.js';
import {
  assessConnectedVerification,
} from '../src/connected-verification-foundation/index.js';
import {
  assessEndToEndExecutionProofChain,
} from '../src/end-to-end-execution-proof-chain/index.js';
import {
  EXECUTION_CHAIN_SAFETY_GUARANTEES,
  EXECUTION_CHAIN_STATES,
  FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessFounderTestExecutionChain,
  buildFounderTestExecutionChainArtifacts,
  buildFounderTestExecutionChainHistorySummary,
  buildFounderTestExecutionChainReportMarkdown,
  getFounderTestExecutionChainHistorySize,
  resetFounderTestExecutionChainModuleForTests,
} from '../src/founder-test-execution-chain-integration/index.js';
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
  assessWorld2DryRunExecutionVerifier,
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
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-types.ts',
  'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-registry.ts',
  'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-authority.ts',
  'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-history.ts',
  'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-report-builder.ts',
  'src/founder-test-execution-chain-integration/index.ts',
  'architecture/FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT.md',
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
    findingId: 'finding-runtime-activation-1',
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
      problemId: 'prob-runtime-activation',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-runtime-activation',
      problemId: 'prob-runtime-activation',
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
    cacheKey: 'fixture-runtime-activation-proof',
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
    cacheKey: 'fixture-runtime-activation-acceptance',
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
      runId: 'founder-test-runtime-activation-fixture',
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
    cacheKey: 'fixture-runtime-activation-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-runtime-activation-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for connected runtime activation validation',
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
    cacheKey: 'fixture-planner-runtime-activation',
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
) {
  resetConnectedBuildExecutionModuleForTests();
  resetConnectedRuntimeActivationModuleForTests();
  resetWorld2DryRunExecutionVerifierModuleForTests();
  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const verifierAssessment = assessWorld2DryRunExecutionVerifier({ composerAssessment: dryRunComposer });
  const runtimeAssessment = assessConnectedRuntimeActivation({
    connectedBuildExecutionAssessment: buildAssessment,
    dryRunVerifierAssessment: verifierAssessment,
  });
  const previewAssessment = assessConnectedLivePreview({
    connectedRuntimeActivationAssessment: runtimeAssessment,
  });
  const verificationAssessment = assessConnectedVerification({
    connectedLivePreviewAssessment: previewAssessment,
    founderTestAssessment: founderTest ?? undefined,
  });
  return assessFounderTestExecutionChain({
    endToEndExecutionProofAssessment: assessEndToEndExecutionProofChain({
      connectedVerificationAssessment: verificationAssessment,
      executionProofAssessment: proof,
      founderTestAssessment: founderTest ?? undefined,
    }),
    executionProofAssessment: proof,
    founderTestAssessment: founderTest ?? undefined,
  });
}

function main(): void {
  console.log('');
  console.log('Founder Test Execution Chain Integration — Validation (leaf mode)');
  console.log('================================================================');
  console.log('');

  checkpoint('start');
  resetFounderTestExecutionChainModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText(
    'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-authority.ts',
  );
  const reportBuilderSource = readText(
    'src/founder-test-execution-chain-integration/founder-test-execution-chain-integration-report-builder.ts',
  );
  const reportMd = readText('architecture/FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:founder-test-execution-chain-integration']),
    'package.json',
  );

  assert(
    'core question registered',
    FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION.includes('real execution chain'),
    FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Founder Test Launch Readiness') &&
      ORCHESTRATION_FLOW.includes('Founder Execution Chain Assessment'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 9 &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-test-launch-readiness') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-build-execution-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-runtime-activation-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-live-preview-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-verification-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('end-to-end-execution-proof-chain') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate') &&
      REQUIRED_INPUT_AUTHORITIES.includes('execution-proof-evolution') &&
      REQUIRED_INPUT_AUTHORITIES.includes('launch-council'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'execution chain states registered',
    EXECUTION_CHAIN_STATES.length === 5 &&
      EXECUTION_CHAIN_STATES.includes('EXECUTION_CHAIN_CONNECTED') &&
      EXECUTION_CHAIN_STATES.includes('INSUFFICIENT_EVIDENCE'),
    EXECUTION_CHAIN_STATES.join(', '),
  );

  assert(
    'consumes founder launch readiness',
    authoritySource.includes('founderTestLaunchReadinessAssessment'),
    'founder-test-launch-readiness',
  );

  assert(
    'consumes build foundation via snapshot',
    authoritySource.includes('connectedBuildExecutionAssessment'),
    'connected-build-execution-foundation',
  );

  assert(
    'consumes runtime foundation via snapshot',
    authoritySource.includes('connectedRuntimeActivationAssessment'),
    'connected-runtime-activation-foundation',
  );

  assert(
    'consumes preview foundation via snapshot',
    authoritySource.includes('connectedLivePreviewAssessment'),
    'connected-live-preview-foundation',
  );

  assert(
    'consumes verification foundation via snapshot',
    authoritySource.includes('connectedVerificationAssessment'),
    'connected-verification-foundation',
  );

  assert(
    'consumes end-to-end proof chain',
    authoritySource.includes('assessEndToEndExecutionProofChain') &&
      authoritySource.includes('endToEndExecutionProofAssessment'),
    'end-to-end-execution-proof-chain',
  );

  assert(
    'consumes execution proof evolution',
    authoritySource.includes('executionProofAssessment'),
    'execution-proof-evolution',
  );

  assert(
    'consumes founder acceptance gate',
    authoritySource.includes('founderAcceptanceAssessment'),
    'founder-acceptance-gate',
  );

  assert(
    'consumes launch council',
    authoritySource.includes('launchCouncilAssessment'),
    'launch-council',
  );

  assert(
    'execution chain assessment exported',
    authoritySource.includes('export function assessFounderTestExecutionChain'),
    'assessFounderTestExecutionChain',
  );

  assert(
    'no real execution guarantee',
    EXECUTION_CHAIN_SAFETY_GUARANTEES.some((g) => /realExecutionPerformed always false/i.test(g)),
    'execution ban',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Execution Chain Score') &&
      reportBuilderSource.includes('Execution Chain State') &&
      reportBuilderSource.includes('Chain Completeness') &&
      reportBuilderSource.includes('Launch Impact'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN),
    FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetFounderTestExecutionChainModuleForTests();
  const connected = buildScenarioAssessments(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  assert(
    'execution chain connected scenario',
    connected.report.executionChainState === 'EXECUTION_CHAIN_CONNECTED' &&
      connected.report.executionChainConnected === true &&
      connected.orchestrationState === 'EXECUTION_CHAIN_INTEGRATION_COMPLETE',
    connected.report.executionChainState,
  );

  assert(
    'stage statuses populated (connected)',
    connected.report.buildStatus === 'BUILD_OUTPUT_PROVEN' &&
      connected.report.runtimeStatus === 'RUNTIME_READY' &&
      connected.report.previewStatus === 'PREVIEW_READY' &&
      connected.report.verificationStatus === 'VERIFICATION_READY' &&
      connected.report.endToEndStatus === 'END_TO_END_PROVEN',
    `${connected.report.buildStatus} → ${connected.report.endToEndStatus}`,
  );

  assert(
    'chain completeness full (connected)',
    connected.report.executionChainCompleteness === 100 &&
      connected.report.executionChainBlockers.length === 0,
    `${connected.report.executionChainCompleteness}% blockers=${connected.report.executionChainBlockers.length}`,
  );

  assert(
    'ten required questions answered (connected)',
    Object.keys(connected.report.questionAnswers).length === 10 &&
      connected.report.questionAnswers.connectedExecutionProven === true,
    `${Object.keys(connected.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (connected)',
    connected.report.executionChainScore >= 80 &&
      connected.report.weakestExecutionStage.length > 0 &&
      connected.report.strongestExecutionStage.length > 0 &&
      connected.report.launchImpact.length > 0 &&
      connected.report.recommendedNextActions.length > 0,
    `score=${connected.report.executionChainScore}`,
  );

  const partial = buildScenarioAssessments(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  assert(
    'execution chain partially connected scenario',
    partial.report.executionChainState === 'EXECUTION_CHAIN_PARTIALLY_CONNECTED' &&
      partial.report.executionChainConnected === false,
    partial.report.executionChainState,
  );

  const blocked = buildScenarioAssessments(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  assert(
    'execution chain blocked scenario',
    blocked.report.executionChainState === 'EXECUTION_CHAIN_BLOCKED' &&
      blocked.report.launchBlockingStage !== null,
    `${blocked.report.executionChainState} blocker=${blocked.report.launchBlockingStage}`,
  );

  const insufficient = buildScenarioAssessments(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.executionChainState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.executionChainState,
  );

  assert(
    'history records assessments',
    getFounderTestExecutionChainHistorySize() >= 4,
    `${getFounderTestExecutionChainHistorySize()} entries`,
  );

  const historySummary = buildFounderTestExecutionChainHistorySummary();
  assert(
    'history summary tracks execution chain states',
    historySummary.totalAssessments >= 4 &&
      historySummary.connectedChains >= 1 &&
      historySummary.partiallyConnectedChains >= 1 &&
      historySummary.blockedChains >= 1,
    JSON.stringify(historySummary),
  );

  resetFounderTestExecutionChainModuleForTests();
  const dryRunComposer = buildDryRunComposerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const verifierAssessment = assessWorld2DryRunExecutionVerifier({ composerAssessment: dryRunComposer });
  const runtimeAssessment = assessConnectedRuntimeActivation({
    connectedBuildExecutionAssessment: buildAssessment,
    dryRunVerifierAssessment: verifierAssessment,
  });
  const previewAssessment = assessConnectedLivePreview({
    connectedRuntimeActivationAssessment: runtimeAssessment,
  });
  const founderTest = buildFounderTest('FOUNDER_READY', true, 92);
  const verificationAssessment = assessConnectedVerification({
    connectedLivePreviewAssessment: previewAssessment,
    founderTestAssessment: founderTest,
  });
  const endToEndAssessment = assessEndToEndExecutionProofChain({
    connectedVerificationAssessment: verificationAssessment,
    executionProofAssessment: buildExecutionProof('PROVEN_FIXED'),
    founderTestAssessment: founderTest,
  });
  const artifacts = buildFounderTestExecutionChainArtifacts({
    endToEndExecutionProofAssessment: endToEndAssessment,
    executionProofAssessment: buildExecutionProof('PROVEN_FIXED'),
    founderTestAssessment: founderTest,
  });
  const markdown = buildFounderTestExecutionChainReportMarkdown(artifacts.founderExecutionChainAssessment.report);
  assert(
    'artifacts bundle includes markdown report',
    artifacts.founderExecutionChainReportMarkdown.length > 100 &&
      markdown.includes('Execution Chain State') &&
      markdown.includes('Stage Status'),
    `${artifacts.founderExecutionChainReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetFounderTestExecutionChainModuleForTests();
  const live = assessFounderTestExecutionChain({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.integrationId.length > 0 &&
      live.report.executionChainState.length > 0 &&
      live.report.executionChainConnected === false,
    `${live.report.executionChainState} id=${live.report.integrationId}`,
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
    console.log('FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN);
  console.log('');
  console.log('Execution chain states verified:');
  console.log(`  EXECUTION_CHAIN_CONNECTED:            ${connected.report.executionChainState}`);
  console.log(`  EXECUTION_CHAIN_PARTIALLY_CONNECTED:  ${partial.report.executionChainState}`);
  console.log(`  EXECUTION_CHAIN_BLOCKED:              ${blocked.report.executionChainState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:                ${insufficient.report.executionChainState}`);
  console.log(`  Live repo:                            ${live.report.executionChainState}`);
  console.log('');
  console.log('Report: architecture/FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_REPORT.md');
  console.log('');
}

main();
