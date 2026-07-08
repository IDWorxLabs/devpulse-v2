/**

 * Phase 25.31 — Founder Execution Proof validation (leaf mode).

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

  assessConnectedVerificationExecution,

  resetConnectedVerificationExecutionModuleForTests,

} from '../src/connected-verification-execution/index.js';

import {

  assessEndToEndExecutionProofChain,

  resetEndToEndExecutionProofModuleForTests,

} from '../src/end-to-end-execution-proof-chain/index.js';

import {

  FOUNDER_EXECUTION_PROOF_PASS_TOKEN,

  FOUNDER_EXECUTION_PROOF_CORE_QUESTION,

  FOUNDER_EXECUTION_STATES,

  LAUNCH_RECOMMENDATION_STATES,

  ORCHESTRATION_FLOW,

  REQUIRED_INPUT_AUTHORITIES,

  FOUNDER_EXECUTION_PROOF_SAFETY_GUARANTEES,

  assessFounderExecutionProof,

  buildFounderExecutionProofArtifacts,

  buildFounderExecutionProofHistorySummary,

  buildFounderExecutionProofReportMarkdown,

  getFounderExecutionProofHistorySize,

  resetFounderExecutionProofModuleForTests,

} from '../src/founder-execution-proof/index.js';

import {

  assessFounderTestExecutionChain,

  resetFounderTestExecutionChainModuleForTests,

} from '../src/founder-test-execution-chain-integration/index.js';

import {

  assessFounderTestIntegration,

  resetFounderTestIntegrationModuleForTests,

} from '../src/founder-test-integration/index.js';

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

  'src/founder-execution-proof/founder-execution-proof-types.ts',

  'src/founder-execution-proof/founder-execution-proof-registry.ts',

  'src/founder-execution-proof/founder-execution-proof-authority.ts',

  'src/founder-execution-proof/execution-proof-aggregator.ts',

  'src/founder-execution-proof/founder-execution-proof-history.ts',

  'src/founder-execution-proof/founder-execution-proof-report-builder.ts',

  'src/founder-execution-proof/index.ts',

  'architecture/FOUNDER_EXECUTION_PROOF_REPORT.md',

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

    findingId: 'finding-founder-execution-proof-1',

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

      problemId: 'prob-founder-execution-proof',

      problemType: 'SHELL_INTERACTION',

      originalFailingSignal: 'Shell not clickable',

      description: 'Fixture',

    },

    attempt: {

      attemptId: 'attempt-founder-execution-proof',

      problemId: 'prob-founder-execution-proof',

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

    cacheKey: 'fixture-founder-execution-proof',

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

    cacheKey: 'fixture-founder-execution-proof-acceptance',

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

      runId: 'founder-test-founder-execution-proof-fixture',

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

    cacheKey: 'fixture-founder-execution-proof-founder-test',

  };

}



function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {

  return {

    readOnly: true,

    planId: `plan-founder-execution-proof-${riskLevel}`,

    planType: 'FIX_PLAN',

    planSource: 'repair',

    reason: 'Fixture plan for founder execution proof validation',

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

  founderTest: FounderTestAssessment | null,

): ExecutionPlannerAssessment {

  resetAutonomousRepairLoopModuleForTests();

  const repairLoopAssessment = assessAutonomousRepairLoop({

    finding: baseFinding(),

    executionProofAssessment: proof ?? undefined,

    founderAcceptanceAssessment: acceptance ?? undefined,

    founderTestAssessment: founderTest ?? undefined,

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

    cacheKey: 'fixture-planner-founder-execution-proof',

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

    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance, founderTest),

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



function buildConnectedBuildAssessment(

  plan: ExecutionPlan | null,

  proof: ExecutionProofAssessment | null,

  acceptance: FounderAcceptanceAssessment | null,

  founderTest: FounderTestAssessment | null,

) {

  const dryRunComposer = buildDryRunComposerAssessment(plan, proof, acceptance, founderTest);

  const planner = buildPlannerAssessment(plan, proof, acceptance, founderTest);

  return assessConnectedAutonomousBuildExecution({

    dryRunComposerAssessment: dryRunComposer,

    executionPlannerAssessment: planner,

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

  const buildAssessment = buildConnectedBuildAssessment(plan, proof, acceptance, founderTest);

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

  const buildAssessment = buildConnectedBuildAssessment(plan, proof, acceptance, founderTest);

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

  const buildAssessment = buildConnectedBuildAssessment(plan, proof, acceptance, founderTest);

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

  const buildAssessment = buildConnectedBuildAssessment(plan, proof, acceptance, founderTest);

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



function buildEndToEndAssessment(

  plan: ExecutionPlan | null,

  proof: ExecutionProofAssessment | null,

  founderTest: FounderTestAssessment | null,

) {

  resetEndToEndExecutionProofModuleForTests();

  return assessEndToEndExecutionProofChain({

    rootDir: ROOT,

    executionProofAssessment: proof,

    founderTestAssessment: founderTest ?? undefined,

  });

}



function buildExecutionChainAssessment(

  plan: ExecutionPlan | null,

  proof: ExecutionProofAssessment | null,

  founderTest: FounderTestAssessment | null,

) {

  resetFounderTestExecutionChainModuleForTests();

  const endToEnd = buildEndToEndAssessment(plan, proof, founderTest);

  return assessFounderTestExecutionChain({

    endToEndExecutionProofAssessment: endToEnd,

    executionProofAssessment: proof,

    founderTestAssessment: founderTest ?? undefined,

  });

}



async function buildFounderExecutionProofScenario(

  plan: ExecutionPlan | null,

  proof: ExecutionProofAssessment | null,

  acceptance: FounderAcceptanceAssessment | null,

  founderTest: FounderTestAssessment | null,

  performRealExecution = false,

  options?: {

    chainProof?: ExecutionProofAssessment | null;

    assessmentProof?: ExecutionProofAssessment | null;

  },

) {

  const chainProof = options?.chainProof ?? proof;

  const assessmentProof = options?.assessmentProof ?? proof;

  const verification = await buildVerificationScenario(

    plan,

    chainProof,

    acceptance,

    founderTest,

    performRealExecution,

  );

  const preview = verification.report.inputSnapshot.connectedLivePreviewExecutionAssessment;

  const runtime = verification.report.inputSnapshot.connectedRuntimeExecutionAssessment;

  const workspace = verification.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? undefined;

  const endToEnd = buildEndToEndAssessment(plan, chainProof, founderTest);

  const executionChain = buildExecutionChainAssessment(plan, chainProof, founderTest);



  return assessFounderExecutionProof({

    rootDir: ROOT,

    connectedWorkspaceCreationAssessment: workspace,

    connectedRuntimeExecutionAssessment: runtime,

    connectedLivePreviewExecutionAssessment: preview,

    connectedVerificationExecutionAssessment: verification,

    endToEndExecutionProofAssessment: endToEnd,

    founderTestExecutionChainAssessment: executionChain,

    executionProofAssessment: assessmentProof,

    founderAcceptanceAssessment: acceptance,

    founderTestAssessment: founderTest ?? undefined,

  });

}



function buildFounderExecutionProofInputFromVerification(

  verification: Awaited<ReturnType<typeof buildVerificationScenario>>,

  plan: ExecutionPlan | null,

  proof: ExecutionProofAssessment | null,

  acceptance: FounderAcceptanceAssessment | null,

  founderTest: FounderTestAssessment | null,

) {

  const endToEnd = buildEndToEndAssessment(plan, proof, founderTest);

  const executionChain = buildExecutionChainAssessment(plan, proof, founderTest);

  return {

    rootDir: ROOT,

    connectedWorkspaceCreationAssessment:

      verification.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? undefined,

    connectedRuntimeExecutionAssessment:

      verification.report.inputSnapshot.connectedRuntimeExecutionAssessment,

    connectedLivePreviewExecutionAssessment:

      verification.report.inputSnapshot.connectedLivePreviewExecutionAssessment,

    connectedVerificationExecutionAssessment: verification,

    endToEndExecutionProofAssessment: endToEnd,

    founderTestExecutionChainAssessment: executionChain,

    executionProofAssessment: proof,

    founderAcceptanceAssessment: acceptance,

    founderTestAssessment: founderTest ?? undefined,

  };

}



async function cleanupVerificationWorkspace(

  verification: Awaited<ReturnType<typeof buildVerificationScenario>>,

): Promise<void> {

  const workspaceId = verification.report.executionContract?.workspaceId ?? '';

  const workspaceRoot =

    verification.report.inputSnapshot.connectedWorkspaceCreationAssessment?.report.creationContract

      ?.workspaceRoot ?? '';

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

}



async function main(): Promise<void> {

  console.log('');

  console.log('Founder Execution Proof — Validation (leaf mode)');

  console.log('===============================================');

  console.log('');



  checkpoint('start');

  resetFounderExecutionProofModuleForTests();

  resetConnectedVerificationExecutionModuleForTests();

  resetConnectedWorkspaceCreationModuleForTests();

  resetConnectedBuildExecutionModuleForTests();



  for (const file of REQUIRED_FILES) {

    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');

  }

  checkpoint('file checks');



  const authoritySource = readText('src/founder-execution-proof/founder-execution-proof-authority.ts');

  const aggregatorSource = readText('src/founder-execution-proof/execution-proof-aggregator.ts');

  const reportBuilderSource = readText('src/founder-execution-proof/founder-execution-proof-report-builder.ts');

  const reportMd = readText('architecture/FOUNDER_EXECUTION_PROOF_REPORT.md');

  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };



  assert(

    'package script registered',

    Boolean(pkg.scripts?.['validate:founder-execution-proof']),

    'package.json',

  );



  assert(

    'core question registered',

    FOUNDER_EXECUTION_PROOF_CORE_QUESTION.includes('entire execution chain'),

    FOUNDER_EXECUTION_PROOF_CORE_QUESTION,

  );



  assert(

    'orchestration flow documented',

    ORCHESTRATION_FLOW.includes('Founder Execution Proof') &&

      ORCHESTRATION_FLOW.includes('Launch Readiness Evidence'),

    ORCHESTRATION_FLOW.join(' → '),

  );



  assert(

    'required input authorities registered',

    REQUIRED_INPUT_AUTHORITIES.length === 11 &&

      REQUIRED_INPUT_AUTHORITIES.includes('connected-workspace-creation') &&

      REQUIRED_INPUT_AUTHORITIES.includes('connected-verification-execution') &&

      REQUIRED_INPUT_AUTHORITIES.includes('end-to-end-execution-proof-chain') &&

      REQUIRED_INPUT_AUTHORITIES.includes('founder-test-execution-chain-integration') &&

      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate'),

    REQUIRED_INPUT_AUTHORITIES.join(', '),

  );



  assert(

    'founder execution states registered',

    FOUNDER_EXECUTION_STATES.length === 5 &&

      FOUNDER_EXECUTION_STATES.includes('FOUNDER_EXECUTION_PROVEN') &&

      FOUNDER_EXECUTION_STATES.includes('INSUFFICIENT_EVIDENCE'),

    FOUNDER_EXECUTION_STATES.join(', '),

  );



  assert(

    'launch recommendation states registered',

    LAUNCH_RECOMMENDATION_STATES.length === 5 &&

      LAUNCH_RECOMMENDATION_STATES.includes('RECOMMEND_LAUNCH') &&

      LAUNCH_RECOMMENDATION_STATES.includes('BLOCK_LAUNCH') &&

      LAUNCH_RECOMMENDATION_STATES.includes('INSUFFICIENT_EVIDENCE'),

    LAUNCH_RECOMMENDATION_STATES.join(', '),

  );



  assert(

    'aggregator consumes workspace evidence',

    aggregatorSource.includes('extractWorkspaceEvidence') &&

      aggregatorSource.includes('connectedWorkspaceCreationAssessment'),

    'connected-workspace-creation',

  );



  assert(

    'aggregator consumes build evidence',

    aggregatorSource.includes('extractBuildEvidence') &&

      aggregatorSource.includes('connectedBuildExecutionContract'),

    'connected-build-execution',

  );



  assert(

    'aggregator consumes runtime evidence',

    aggregatorSource.includes('extractRuntimeEvidence') &&

      aggregatorSource.includes('connectedRuntimeExecutionAssessment'),

    'connected-runtime-execution',

  );



  assert(

    'aggregator consumes preview evidence',

    aggregatorSource.includes('extractPreviewEvidence') &&

      aggregatorSource.includes('connectedLivePreviewExecutionAssessment'),

    'connected-live-preview-execution',

  );



  assert(

    'aggregator consumes verification evidence',

    aggregatorSource.includes('extractVerificationEvidence') &&

      aggregatorSource.includes('connectedVerificationExecutionAssessment'),

    'connected-verification-execution',

  );



  assert(

    'read-only aggregation guarantee documented',

    FOUNDER_EXECUTION_PROOF_SAFETY_GUARANTEES.some((g) => /read-only aggregation/i.test(g)),

    'read-only aggregation',

  );



  assert('no real activation in authority', !authoritySource.includes('performRealActivation'), 'activation ban');

  assert('no verification execution in authority', !authoritySource.includes('executeVerificationExecution'), 'verification ban');

  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');



  assert(

    'founder report markdown builder',

    reportBuilderSource.includes('Founder Execution Score') &&

      reportBuilderSource.includes('Launch Recommendation') &&

      reportBuilderSource.includes('Execution Completeness'),

    'report fields',

  );



  assert(

    'architecture report pass token',

    reportMd.includes(FOUNDER_EXECUTION_PROOF_PASS_TOKEN),

    FOUNDER_EXECUTION_PROOF_PASS_TOKEN,

  );

  checkpoint('static checks');



  resetFounderExecutionProofModuleForTests();

  resetFounderTestIntegrationModuleForTests();

  const proven = await buildFounderExecutionProofScenario(

    buildPlan('LOW'),

    buildExecutionProof('PROVEN_FIXED'),

    buildAcceptance('ACCEPTED'),

    buildFounderTest('FOUNDER_READY', true, 92),

    true,

  );

  const provenVerification =

    proven.report.inputSnapshot.connectedVerificationExecutionAssessment!;

  const provenBundle = proven.report.proofBundle;

  const workspaceRoot =

    provenVerification.report.inputSnapshot.connectedWorkspaceCreationAssessment?.report.creationContract

      ?.workspaceRoot ?? '';



  assert(

    'founder execution proven scenario',

    proven.report.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN' ||

      proven.report.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS',

    proven.report.founderExecutionState,

  );



  assert(

    'all stage evidence proven',

    provenBundle.workspaceEvidence.proven &&

      provenBundle.buildEvidence.proven &&

      provenBundle.runtimeEvidence.proven &&

      provenBundle.previewEvidence.proven &&

      provenBundle.verificationEvidence.proven,

    JSON.stringify({

      workspace: provenBundle.workspaceEvidence.proven,

      build: provenBundle.buildEvidence.proven,

      runtime: provenBundle.runtimeEvidence.proven,

      preview: provenBundle.previewEvidence.proven,

      verification: provenBundle.verificationEvidence.proven,

    }),

  );



  assert(

    'proof bundle created',

    provenBundle.proofBundleId.length > 0 &&

      provenBundle.proofArtifacts.length > 0 &&

      proven.report.inputSnapshot.endToEndExecutionProofAssessment !== null &&

      proven.report.inputSnapshot.founderTestExecutionChainAssessment !== null,

    provenBundle.proofBundleId,

  );



  assert(

    'launch recommendation generated',

    proven.report.launchRecommendation === 'RECOMMEND_LAUNCH' ||

      proven.report.launchRecommendation === 'RECOMMEND_LAUNCH_WITH_WARNINGS',

    proven.report.launchRecommendation,

  );



  assert(

    'founder execution proven question answered',

    proven.report.questionAnswers.founderExecutionProven === true,

    String(proven.report.questionAnswers.founderExecutionProven),

  );



  assert(

    'orchestration complete (proven)',

    proven.orchestrationState === 'FOUNDER_EXECUTION_PROOF_COMPLETE',

    proven.orchestrationState,

  );



  await cleanupVerificationWorkspace(provenVerification);



  const warnings = await buildFounderExecutionProofScenario(

    buildPlan('LOW'),

    buildExecutionProof('PARTIALLY_PROVEN'),

    buildAcceptance('ACCEPTED'),

    buildFounderTest('FOUNDER_READY', true, 85),

    true,

    { chainProof: buildExecutionProof('PROVEN_FIXED') },

  );

  const warningsVerification =

    warnings.report.inputSnapshot.connectedVerificationExecutionAssessment!;

  await cleanupVerificationWorkspace(warningsVerification);

  assert(

    'founder execution proven with warnings scenario',

    warnings.report.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS' ||

      warnings.report.launchRecommendation === 'RECOMMEND_LAUNCH_WITH_WARNINGS',

    `${warnings.report.founderExecutionState} / ${warnings.report.launchRecommendation}`,

  );



  const blocked = await buildFounderExecutionProofScenario(

    buildPlan('CRITICAL'),

    buildExecutionProof('PROVEN_FIXED'),

    buildAcceptance('BLOCKED'),

    buildFounderTest('BLOCKED', true, 40),

    false,

  );

  assert(

    'founder execution blocked scenario',

    blocked.report.founderExecutionState === 'FOUNDER_EXECUTION_BLOCKED' ||

      blocked.report.launchRecommendation === 'BLOCK_LAUNCH',

    `${blocked.report.founderExecutionState} / ${blocked.report.launchRecommendation}`,

  );



  const insufficient = assessFounderExecutionProof({

    rootDir: ROOT,

    executionProofAssessment: null,

    founderAcceptanceAssessment: null,

    founderTestAssessment: buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),

  });

  assert(

    'insufficient evidence scenario',

    insufficient.report.founderExecutionState === 'INSUFFICIENT_EVIDENCE' &&

      insufficient.report.launchRecommendation === 'INSUFFICIENT_EVIDENCE',

    `${insufficient.report.founderExecutionState} / ${insufficient.report.launchRecommendation}`,

  );



  assert(

    'history records assessments',

    getFounderExecutionProofHistorySize() >= 4,

    `${getFounderExecutionProofHistorySize()} entries`,

  );



  const scenarioHistoryEntries = [proven, warnings, blocked, insufficient].map((assessment) => ({

    timestamp: assessment.report.generatedAt,

    proofId: assessment.report.proofId,

    founderExecutionScore: assessment.report.founderExecutionScore,

    founderExecutionState: assessment.report.founderExecutionState,

    launchRecommendation: assessment.report.launchRecommendation,

    blockerCount: assessment.report.blockingReasons.length,

    warningCount: assessment.report.warningReasons.length,

  }));

  const historySummary = buildFounderExecutionProofHistorySummary(scenarioHistoryEntries);

  assert(

    'history summary tracks founder execution states',

    historySummary.totalAssessments === 4 &&

      historySummary.provenExecutions + historySummary.provenWithWarningsExecutions >= 1 &&

      historySummary.blockedExecutions >= 1 &&

      historySummary.insufficientEvidenceExecutions >= 1,

    JSON.stringify(historySummary),

  );



  resetFounderTestIntegrationModuleForTests();

  const provenForIntegration = await buildVerificationScenario(

    buildPlan('LOW'),

    buildExecutionProof('PROVEN_FIXED'),

    buildAcceptance('ACCEPTED'),

    buildFounderTest('FOUNDER_READY', true, 92),

    true,

  );

  const integrationInput = buildFounderExecutionProofInputFromVerification(

    provenForIntegration,

    buildPlan('LOW'),

    buildExecutionProof('PROVEN_FIXED'),

    buildAcceptance('ACCEPTED'),

    buildFounderTest('FOUNDER_READY', true, 92),

  );

  const integration = assessFounderTestIntegration({

    rootDir: ROOT,

    founderExecutionProofInput: integrationInput,

  });

  await cleanupVerificationWorkspace(provenForIntegration);

  assert(

    'founder test integration execution proof summary',

    integration.executionProofSummary !== undefined &&

      integration.executionProofSummary.founderExecutionState.length > 0 &&

      integration.executionProofSummary.launchRecommendation.length > 0,

    JSON.stringify(integration.executionProofSummary),

  );



  resetFounderExecutionProofModuleForTests();

  const provenForArtifacts = await buildVerificationScenario(

    buildPlan('LOW'),

    buildExecutionProof('PROVEN_FIXED'),

    buildAcceptance('ACCEPTED'),

    buildFounderTest('FOUNDER_READY', true, 92),

    true,

  );

  const artifactsInput = buildFounderExecutionProofInputFromVerification(

    provenForArtifacts,

    buildPlan('LOW'),

    buildExecutionProof('PROVEN_FIXED'),

    buildAcceptance('ACCEPTED'),

    buildFounderTest('FOUNDER_READY', true, 92),

  );

  const artifacts = buildFounderExecutionProofArtifacts(artifactsInput);

  await cleanupVerificationWorkspace(provenForArtifacts);

  const markdown = buildFounderExecutionProofReportMarkdown(artifacts.founderExecutionProofAssessment);

  assert(

    'artifacts bundle includes markdown report',

    artifacts.founderExecutionProofReportMarkdown.length > 100 &&

      markdown.includes('Founder Execution Score') &&

      markdown.includes('Launch Recommendation'),

    `${artifacts.founderExecutionProofReportMarkdown.length} chars`,

  );

  checkpoint('fixture scenarios');



  resetFounderExecutionProofModuleForTests();

  const live = assessFounderExecutionProof({ rootDir: ROOT });

  checkpoint('live assessment');

  assert(

    'live assessment executes',

    live.report.proofId.length > 0 && live.report.founderExecutionState.length > 0,

    `${live.report.founderExecutionState} id=${live.report.proofId}`,

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

    console.log('FOUNDER_EXECUTION_PROOF_REQUIRES_FIXES');

    process.exit(1);

  }



  console.log(FOUNDER_EXECUTION_PROOF_PASS_TOKEN);

  console.log('');

  console.log('Founder execution states verified:');

  console.log(`  FOUNDER_EXECUTION_PROVEN:               ${proven.report.founderExecutionState}`);

  console.log(`  FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS: ${warnings.report.founderExecutionState}`);

  console.log(`  FOUNDER_EXECUTION_BLOCKED:              ${blocked.report.founderExecutionState}`);

  console.log(`  INSUFFICIENT_EVIDENCE:                  ${insufficient.report.founderExecutionState}`);

  console.log(`  Live repo:                              ${live.report.founderExecutionState}`);

  console.log('');

  console.log('Report: architecture/FOUNDER_EXECUTION_PROOF_REPORT.md');

  console.log('');

}



main().catch((err) => {

  console.error(err);

  process.exit(1);

});


