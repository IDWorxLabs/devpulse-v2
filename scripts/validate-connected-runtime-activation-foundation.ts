/**
 * Phase 25.21 — Connected Runtime Activation Foundation validation (leaf mode).
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
  RUNTIME_ACTIVATION_SAFETY_GUARANTEES,
  RUNTIME_STATES,
  CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
  CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessConnectedRuntimeActivation,
  buildConnectedRuntimeActivationArtifacts,
  buildConnectedRuntimeActivationHistorySummary,
  buildConnectedRuntimeActivationReportMarkdown,
  getConnectedRuntimeActivationHistorySize,
  resetConnectedRuntimeActivationModuleForTests,
} from '../src/connected-runtime-activation-foundation/index.js';
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
  'src/connected-runtime-activation-foundation/connected-runtime-activation-types.ts',
  'src/connected-runtime-activation-foundation/connected-runtime-activation-registry.ts',
  'src/connected-runtime-activation-foundation/connected-runtime-activation-authority.ts',
  'src/connected-runtime-activation-foundation/connected-runtime-activation-history.ts',
  'src/connected-runtime-activation-foundation/connected-runtime-activation-report-builder.ts',
  'src/connected-runtime-activation-foundation/index.ts',
  'architecture/CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_REPORT.md',
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
  resetWorld2DryRunExecutionVerifierModuleForTests();
  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const verifierAssessment = assessWorld2DryRunExecutionVerifier({ composerAssessment: dryRunComposer });
  return assessConnectedRuntimeActivation({
    connectedBuildExecutionAssessment: buildAssessment,
    dryRunVerifierAssessment: verifierAssessment,
  });
}

function main(): void {
  console.log('');
  console.log('Connected Runtime Activation Foundation — Validation (leaf mode)');
  console.log('================================================================');
  console.log('');

  checkpoint('start');
  resetConnectedRuntimeActivationModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/connected-runtime-activation-foundation/connected-runtime-activation-authority.ts');
  const reportBuilderSource = readText(
    'src/connected-runtime-activation-foundation/connected-runtime-activation-report-builder.ts',
  );
  const reportMd = readText('architecture/CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:connected-runtime-activation-foundation']),
    'package.json',
  );

  assert(
    'core question registered',
    CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION.includes('runnable application runtime'),
    CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Runtime Activation Contract') &&
      ORCHESTRATION_FLOW.includes('Runtime Readiness Assessment'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 11 &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-build-execution-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('world2-dry-run-execution-verifier') &&
      REQUIRED_INPUT_AUTHORITIES.includes('execution-package-runtime') &&
      REQUIRED_INPUT_AUTHORITIES.includes('execution-verification-loop'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'runtime states registered',
    RUNTIME_STATES.length === 5 &&
      RUNTIME_STATES.includes('RUNTIME_READY') &&
      RUNTIME_STATES.includes('INSUFFICIENT_EVIDENCE'),
    RUNTIME_STATES.join(', '),
  );

  assert(
    'consumes connected build execution foundation',
    authoritySource.includes('assessConnectedAutonomousBuildExecution'),
    'assessConnectedAutonomousBuildExecution',
  );

  assert(
    'consumes dry-run execution verifier',
    authoritySource.includes('assessWorld2DryRunExecutionVerifier'),
    'assessWorld2DryRunExecutionVerifier',
  );

  assert(
    'consumes execution engine via snapshot',
    authoritySource.includes('executionEngineAssessment'),
    'executionEngineAssessment',
  );

  assert(
    'consumes disposable workspace creator',
    authoritySource.includes('disposableWorkspaceCreatorAssessment'),
    'disposableWorkspaceCreatorAssessment',
  );

  assert(
    'consumes disposable workspace instantiator',
    authoritySource.includes('disposableWorkspaceInstantiatorAssessment'),
    'disposableWorkspaceInstantiatorAssessment',
  );

  assert(
    'consumes repository snapshot materializer',
    authoritySource.includes('repositorySnapshotMaterializerAssessment'),
    'repositorySnapshotMaterializerAssessment',
  );

  assert(
    'consumes execution package runtime',
    authoritySource.includes('buildExecutionPackageRuntimeReport') &&
      authoritySource.includes('getDevPulseV2ExecutionPackageRuntime'),
    'execution-package-runtime',
  );

  assert(
    'consumes execution verification loop',
    authoritySource.includes('buildExecutionVerificationReport') &&
      authoritySource.includes('getDevPulseV2ExecutionVerificationLoop'),
    'execution-verification-loop',
  );

  assert(
    'runtime activation contract builder exported',
    authoritySource.includes('export function buildRuntimeActivationContract'),
    'buildRuntimeActivationContract',
  );

  assert(
    'no real runtime launch guarantee',
    RUNTIME_ACTIVATION_SAFETY_GUARANTEES.some((g) => /realRuntimeLaunchPerformed always false/i.test(g)),
    'launch ban',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Runtime Readiness Score') &&
      reportBuilderSource.includes('Missing Runtime Components') &&
      reportBuilderSource.includes('Runtime Activation Path') &&
      reportBuilderSource.includes('Proof Completeness'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN),
    CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetConnectedRuntimeActivationModuleForTests();
  const ready = buildScenarioAssessments(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  assert(
    'runtime ready scenario',
    ready.report.runtimeState === 'RUNTIME_READY' && ready.orchestrationState === 'RUNTIME_ACTIVATION_COMPLETE',
    ready.report.runtimeState,
  );

  assert(
    'runtime activation contract generated (ready)',
    ready.report.runtimeActivationContract.contractId.length > 0 &&
      ready.report.runtimeActivationContract.realRuntimeLaunchPerformed === false,
    ready.report.runtimeActivationContract.contractId,
  );

  assert(
    'contract arrays populated (ready)',
    ready.report.runtimeActivationContract.activationSteps.length > 0 &&
      ready.report.runtimeActivationContract.verificationRequirements.length > 0 &&
      ready.report.runtimeActivationContract.proofArtifacts.length > 0,
    `steps=${ready.report.runtimeActivationContract.activationSteps.length}`,
  );

  assert(
    'runtime candidate generated (ready)',
    ready.report.runtimeActivationCandidate.candidateId.length > 0 &&
      ready.report.runtimeActivationCandidate.realRuntimeLaunchPerformed === false,
    ready.report.runtimeActivationCandidate.candidateId,
  );

  assert(
    'ten required questions answered (ready)',
    Object.keys(ready.report.questionAnswers).length === 10 &&
      ready.report.questionAnswers.runtimeReadinessProven === true,
    `${Object.keys(ready.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (ready)',
    ready.report.runtimeReadinessScore >= 80 &&
      ready.report.runtimeActivationPath.length >= 3 &&
      ready.report.activationCompleteness >= 0 &&
      ready.report.dependencyCompleteness >= 0 &&
      ready.report.proofCompleteness > 0 &&
      ready.report.recommendedNextActions.length > 0,
    `score=${ready.report.runtimeReadinessScore}`,
  );

  const warnings = buildScenarioAssessments(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  assert(
    'runtime ready with warnings scenario',
    warnings.report.runtimeState === 'RUNTIME_READY_WITH_WARNINGS',
    warnings.report.runtimeState,
  );

  const blocked = buildScenarioAssessments(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  assert(
    'runtime blocked scenario',
    blocked.report.runtimeState === 'RUNTIME_BLOCKED',
    blocked.report.runtimeState,
  );

  const insufficient = buildScenarioAssessments(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.runtimeState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.runtimeState,
  );

  assert(
    'history records assessments',
    getConnectedRuntimeActivationHistorySize() >= 4,
    `${getConnectedRuntimeActivationHistorySize()} entries`,
  );

  const historySummary = buildConnectedRuntimeActivationHistorySummary();
  assert(
    'history summary tracks runtime states',
    historySummary.totalAssessments >= 4 &&
      historySummary.readyRuntimes >= 1 &&
      historySummary.readyWithWarningsRuntimes >= 1 &&
      historySummary.blockedRuntimes >= 1,
    JSON.stringify(historySummary),
  );

  resetConnectedRuntimeActivationModuleForTests();
  const dryRunComposer = buildDryRunComposerAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const buildAssessment = assessConnectedAutonomousBuildExecution({ dryRunComposerAssessment: dryRunComposer });
  const verifierAssessment = assessWorld2DryRunExecutionVerifier({ composerAssessment: dryRunComposer });
  const artifacts = buildConnectedRuntimeActivationArtifacts({
    connectedBuildExecutionAssessment: buildAssessment,
    dryRunVerifierAssessment: verifierAssessment,
  });
  const markdown = buildConnectedRuntimeActivationReportMarkdown(artifacts.connectedRuntimeActivationAssessment.report);
  assert(
    'artifacts bundle includes markdown report',
    artifacts.connectedRuntimeActivationReportMarkdown.length > 100 &&
      markdown.includes('Runtime State') &&
      markdown.includes('Runtime Activation Contract'),
    `${artifacts.connectedRuntimeActivationReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetConnectedRuntimeActivationModuleForTests();
  const live = assessConnectedRuntimeActivation({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.activationId.length > 0 &&
      live.report.runtimeState.length > 0 &&
      live.report.runtimeActivationContract.realRuntimeLaunchPerformed === false,
    `${live.report.runtimeState} id=${live.report.activationId}`,
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
    console.log('CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('Runtime states verified:');
  console.log(`  RUNTIME_READY:               ${ready.report.runtimeState}`);
  console.log(`  RUNTIME_READY_WITH_WARNINGS: ${warnings.report.runtimeState}`);
  console.log(`  RUNTIME_BLOCKED:             ${blocked.report.runtimeState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:       ${insufficient.report.runtimeState}`);
  console.log(`  Live repo:                   ${live.report.runtimeState}`);
  console.log('');
  console.log('Report: architecture/CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_REPORT.md');
  console.log('');
}

main();
