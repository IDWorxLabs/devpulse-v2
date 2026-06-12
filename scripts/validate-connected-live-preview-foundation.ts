/**
 * Phase 25.22 — Connected Live Preview Foundation validation (leaf mode).
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
  PREVIEW_READINESS_SAFETY_GUARANTEES,
  PREVIEW_STATES,
  CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
  CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessConnectedLivePreview,
  buildConnectedLivePreviewArtifacts,
  buildConnectedLivePreviewHistorySummary,
  buildConnectedLivePreviewReportMarkdown,
  getConnectedLivePreviewHistorySize,
  resetConnectedLivePreviewModuleForTests,
} from '../src/connected-live-preview-foundation/index.js';
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
  'src/connected-live-preview-foundation/connected-live-preview-types.ts',
  'src/connected-live-preview-foundation/connected-live-preview-registry.ts',
  'src/connected-live-preview-foundation/connected-live-preview-authority.ts',
  'src/connected-live-preview-foundation/connected-live-preview-history.ts',
  'src/connected-live-preview-foundation/connected-live-preview-report-builder.ts',
  'src/connected-live-preview-foundation/index.ts',
  'architecture/CONNECTED_LIVE_PREVIEW_FOUNDATION_REPORT.md',
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
  return assessConnectedLivePreview({
    connectedRuntimeActivationAssessment: runtimeAssessment,
  });
}

function main(): void {
  console.log('');
  console.log('Connected Live Preview Foundation — Validation (leaf mode)');
  console.log('==========================================================');
  console.log('');

  checkpoint('start');
  resetConnectedLivePreviewModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/connected-live-preview-foundation/connected-live-preview-authority.ts');
  const reportBuilderSource = readText(
    'src/connected-live-preview-foundation/connected-live-preview-report-builder.ts',
  );
  const reportMd = readText('architecture/CONNECTED_LIVE_PREVIEW_FOUNDATION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:connected-live-preview-foundation']),
    'package.json',
  );

  assert(
    'core question registered',
    CONNECTED_LIVE_PREVIEW_CORE_QUESTION.includes('founder-viewable'),
    CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Preview Readiness Contract') &&
      ORCHESTRATION_FLOW.includes('Preview Readiness Assessment'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 10 &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-runtime-activation-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-build-execution-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('live-preview-reality') &&
      REQUIRED_INPUT_AUTHORITIES.includes('execution-package-runtime') &&
      REQUIRED_INPUT_AUTHORITIES.includes('execution-verification-loop'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'preview states registered',
    PREVIEW_STATES.length === 5 &&
      PREVIEW_STATES.includes('PREVIEW_READY') &&
      PREVIEW_STATES.includes('INSUFFICIENT_EVIDENCE'),
    PREVIEW_STATES.join(', '),
  );

  assert(
    'consumes runtime activation foundation',
    authoritySource.includes('assessConnectedRuntimeActivation'),
    'assessConnectedRuntimeActivation',
  );

  assert(
    'consumes build execution foundation via snapshot',
    authoritySource.includes('connectedBuildExecutionAssessment'),
    'connectedBuildExecutionAssessment',
  );

  assert(
    'consumes live preview reality',
    authoritySource.includes('assessLivePreviewRealityAuthority') &&
      authoritySource.includes('detectPreviewModulePresenceEvidence'),
    'live-preview-reality',
  );

  assert(
    'consumes dry-run execution verifier',
    authoritySource.includes('dryRunVerifierAssessment'),
    'dryRunVerifierAssessment',
  );

  assert(
    'consumes execution engine via snapshot',
    authoritySource.includes('executionEngineAssessment'),
    'executionEngineAssessment',
  );

  assert(
    'consumes repository snapshot materializer',
    authoritySource.includes('repositorySnapshotMaterializerAssessment'),
    'repositorySnapshotMaterializerAssessment',
  );

  assert(
    'consumes change set materializer',
    authoritySource.includes('changeSetMaterializerAssessment'),
    'changeSetMaterializerAssessment',
  );

  assert(
    'consumes execution package runtime',
    authoritySource.includes('executionPackageRuntimeReport'),
    'execution-package-runtime',
  );

  assert(
    'consumes execution verification loop',
    authoritySource.includes('executionVerificationReport'),
    'execution-verification-loop',
  );

  assert(
    'preview readiness contract builder exported',
    authoritySource.includes('export function buildPreviewReadinessContract'),
    'buildPreviewReadinessContract',
  );

  assert(
    'no real preview launch guarantee',
    PREVIEW_READINESS_SAFETY_GUARANTEES.some((g) => /realPreviewLaunchPerformed always false/i.test(g)),
    'launch ban',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Preview Readiness Score') &&
      reportBuilderSource.includes('Missing Preview Components') &&
      reportBuilderSource.includes('Preview Activation Path') &&
      reportBuilderSource.includes('Proof Completeness'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN),
    CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetConnectedLivePreviewModuleForTests();
  const ready = buildScenarioAssessments(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  assert(
    'preview ready scenario',
    ready.report.previewState === 'PREVIEW_READY' && ready.orchestrationState === 'PREVIEW_READINESS_COMPLETE',
    ready.report.previewState,
  );

  assert(
    'preview readiness contract generated (ready)',
    ready.report.previewReadinessContract.contractId.length > 0 &&
      ready.report.previewReadinessContract.realPreviewLaunchPerformed === false,
    ready.report.previewReadinessContract.contractId,
  );

  assert(
    'contract arrays populated (ready)',
    ready.report.previewReadinessContract.previewActivationSteps.length > 0 &&
      ready.report.previewReadinessContract.verificationRequirements.length > 0 &&
      ready.report.previewReadinessContract.proofArtifacts.length > 0,
    `steps=${ready.report.previewReadinessContract.previewActivationSteps.length}`,
  );

  assert(
    'preview candidate generated (ready)',
    ready.report.previewCandidate.candidateId.length > 0 &&
      ready.report.previewCandidate.realPreviewLaunchPerformed === false,
    ready.report.previewCandidate.candidateId,
  );

  assert(
    'ten required questions answered (ready)',
    Object.keys(ready.report.questionAnswers).length === 10 &&
      ready.report.questionAnswers.previewReadinessProven === true,
    `${Object.keys(ready.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (ready)',
    ready.report.previewReadinessScore >= 80 &&
      ready.report.previewActivationPath.length >= 3 &&
      ready.report.previewCompleteness >= 0 &&
      ready.report.dependencyCompleteness >= 0 &&
      ready.report.proofCompleteness > 0 &&
      ready.report.recommendedNextActions.length > 0,
    `score=${ready.report.previewReadinessScore}`,
  );

  const warnings = buildScenarioAssessments(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  assert(
    'preview ready with warnings scenario',
    warnings.report.previewState === 'PREVIEW_READY_WITH_WARNINGS',
    warnings.report.previewState,
  );

  const blocked = buildScenarioAssessments(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  assert(
    'preview blocked scenario',
    blocked.report.previewState === 'PREVIEW_BLOCKED',
    blocked.report.previewState,
  );

  const insufficient = buildScenarioAssessments(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.previewState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.previewState,
  );

  assert(
    'history records assessments',
    getConnectedLivePreviewHistorySize() >= 4,
    `${getConnectedLivePreviewHistorySize()} entries`,
  );

  const historySummary = buildConnectedLivePreviewHistorySummary();
  assert(
    'history summary tracks preview states',
    historySummary.totalAssessments >= 4 &&
      historySummary.readyPreviews >= 1 &&
      historySummary.readyWithWarningsPreviews >= 1 &&
      historySummary.blockedPreviews >= 1,
    JSON.stringify(historySummary),
  );

  resetConnectedLivePreviewModuleForTests();
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
  const artifacts = buildConnectedLivePreviewArtifacts({
    connectedRuntimeActivationAssessment: runtimeAssessment,
  });
  const markdown = buildConnectedLivePreviewReportMarkdown(artifacts.connectedLivePreviewAssessment.report);
  assert(
    'artifacts bundle includes markdown report',
    artifacts.connectedLivePreviewReportMarkdown.length > 100 &&
      markdown.includes('Preview State') &&
      markdown.includes('Preview Readiness Contract'),
    `${artifacts.connectedLivePreviewReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetConnectedLivePreviewModuleForTests();
  const live = assessConnectedLivePreview({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.previewConnectionId.length > 0 &&
      live.report.previewState.length > 0 &&
      live.report.previewReadinessContract.realPreviewLaunchPerformed === false,
    `${live.report.previewState} id=${live.report.previewConnectionId}`,
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
    console.log('CONNECTED_LIVE_PREVIEW_FOUNDATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('Preview states verified:');
  console.log(`  PREVIEW_READY:               ${ready.report.previewState}`);
  console.log(`  PREVIEW_READY_WITH_WARNINGS: ${warnings.report.previewState}`);
  console.log(`  PREVIEW_BLOCKED:             ${blocked.report.previewState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:       ${insufficient.report.previewState}`);
  console.log(`  Live repo:                   ${live.report.previewState}`);
  console.log('');
  console.log('Report: architecture/CONNECTED_LIVE_PREVIEW_FOUNDATION_REPORT.md');
  console.log('');
}

main();
