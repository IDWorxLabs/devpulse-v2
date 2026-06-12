/**
 * Phase 25.24 — End-to-End Execution Proof Chain validation (leaf mode).
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
  END_TO_END_PROOF_SAFETY_GUARANTEES,
  PROOF_STATES,
  END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
  END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  assessEndToEndExecutionProofChain,
  buildEndToEndExecutionProofArtifacts,
  buildEndToEndExecutionProofHistorySummary,
  buildEndToEndExecutionProofReportMarkdown,
  getEndToEndExecutionProofHistorySize,
  resetEndToEndExecutionProofModuleForTests,
} from '../src/end-to-end-execution-proof-chain/index.js';
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
  'src/end-to-end-execution-proof-chain/end-to-end-execution-proof-types.ts',
  'src/end-to-end-execution-proof-chain/end-to-end-execution-proof-registry.ts',
  'src/end-to-end-execution-proof-chain/end-to-end-execution-proof-authority.ts',
  'src/end-to-end-execution-proof-chain/end-to-end-execution-proof-history.ts',
  'src/end-to-end-execution-proof-chain/end-to-end-execution-proof-report-builder.ts',
  'src/end-to-end-execution-proof-chain/index.ts',
  'architecture/END_TO_END_EXECUTION_PROOF_CHAIN_REPORT.md',
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
  return assessEndToEndExecutionProofChain({
    connectedVerificationAssessment: verificationAssessment,
    executionProofAssessment: proof,
    founderTestAssessment: founderTest ?? undefined,
  });
}

function main(): void {
  console.log('');
  console.log('End-to-End Execution Proof Chain — Validation (leaf mode)');
  console.log('===========================================================');
  console.log('');

  checkpoint('start');
  resetEndToEndExecutionProofModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }
  checkpoint('file checks');

  const authoritySource = readText('src/end-to-end-execution-proof-chain/end-to-end-execution-proof-authority.ts');
  const reportBuilderSource = readText(
    'src/end-to-end-execution-proof-chain/end-to-end-execution-proof-report-builder.ts',
  );
  const reportMd = readText('architecture/END_TO_END_EXECUTION_PROOF_CHAIN_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:end-to-end-execution-proof-chain']),
    'package.json',
  );

  assert(
    'core question registered',
    END_TO_END_EXECUTION_PROOF_CORE_QUESTION.includes('complete chain'),
    END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
  );

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('Connected Verification') &&
      ORCHESTRATION_FLOW.includes('End-to-End Execution Proof Assessment'),
    ORCHESTRATION_FLOW.join(' → '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 8 &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-build-execution-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-runtime-activation-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-live-preview-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('connected-verification-foundation') &&
      REQUIRED_INPUT_AUTHORITIES.includes('execution-proof-evolution') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-test-launch-readiness') &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-acceptance-gate') &&
      REQUIRED_INPUT_AUTHORITIES.includes('launch-council'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'proof states registered',
    PROOF_STATES.length === 5 &&
      PROOF_STATES.includes('END_TO_END_PROVEN') &&
      PROOF_STATES.includes('INSUFFICIENT_EVIDENCE'),
    PROOF_STATES.join(', '),
  );

  assert(
    'consumes connected verification foundation',
    authoritySource.includes('assessConnectedVerification'),
    'assessConnectedVerification',
  );

  assert(
    'consumes build foundation via snapshot',
    authoritySource.includes('connectedBuildExecutionAssessment'),
    'connectedBuildExecutionAssessment',
  );

  assert(
    'consumes runtime foundation via snapshot',
    authoritySource.includes('connectedRuntimeActivationAssessment'),
    'connectedRuntimeActivationAssessment',
  );

  assert(
    'consumes preview foundation via snapshot',
    authoritySource.includes('connectedLivePreviewAssessment'),
    'connectedLivePreviewAssessment',
  );

  assert(
    'consumes execution proof evolution',
    authoritySource.includes('executionProofAssessment') &&
      authoritySource.includes('execution-proof-evolution'),
    'execution-proof-evolution',
  );

  assert(
    'consumes founder test launch readiness',
    authoritySource.includes('founderTestLaunchReadinessAssessment'),
    'founder-test-launch-readiness',
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
    'proof bundle builder exported',
    authoritySource.includes('export function buildEndToEndExecutionProofBundle'),
    'buildEndToEndExecutionProofBundle',
  );

  assert(
    'no real execution guarantee',
    END_TO_END_PROOF_SAFETY_GUARANTEES.some((g) => /realExecutionPerformed always false/i.test(g)),
    'execution ban',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Connected Execution Score') &&
      reportBuilderSource.includes('Chain Completeness') &&
      reportBuilderSource.includes('Missing Chain Links') &&
      reportBuilderSource.includes('Execution Confidence'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN),
    END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN,
  );
  checkpoint('static checks');

  resetEndToEndExecutionProofModuleForTests();
  const proven = buildScenarioAssessments(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  assert(
    'end-to-end proven scenario',
    proven.report.proofState === 'END_TO_END_PROVEN' &&
      proven.orchestrationState === 'END_TO_END_PROOF_COMPLETE',
    proven.report.proofState,
  );

  assert(
    'proof bundle generated (proven)',
    proven.report.proofBundle.buildProof.proven &&
      proven.report.proofBundle.runtimeProof.proven &&
      proven.report.proofBundle.previewProof.proven &&
      proven.report.proofBundle.verificationProof.proven &&
      proven.report.proofBundle.realExecutionPerformed === false,
    `build=${proven.report.proofBundle.buildProof.state} runtime=${proven.report.proofBundle.runtimeProof.state}`,
  );

  assert(
    'chain completeness full (proven)',
    proven.report.chainCompletenessPercent === 100 && proven.report.proofBundle.chainGaps.length === 0,
    `${proven.report.chainCompletenessPercent}% gaps=${proven.report.proofBundle.chainGaps.length}`,
  );

  assert(
    'ten required questions answered (proven)',
    Object.keys(proven.report.questionAnswers).length === 10 &&
      proven.report.questionAnswers.connectedExecutionProven === true,
    `${Object.keys(proven.report.questionAnswers).length} answers`,
  );

  assert(
    'founder report fields present (proven)',
    proven.report.connectedExecutionScore >= 80 &&
      proven.report.executionConfidence >= 80 &&
      proven.report.missingChainLinks.length === 0 &&
      proven.report.recommendedNextActions.length > 0,
    `score=${proven.report.connectedExecutionScore} confidence=${proven.report.executionConfidence}`,
  );

  const partial = buildScenarioAssessments(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  assert(
    'end-to-end partially proven scenario',
    partial.report.proofState === 'END_TO_END_PARTIALLY_PROVEN',
    partial.report.proofState,
  );

  const blocked = buildScenarioAssessments(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  assert(
    'end-to-end blocked scenario',
    blocked.report.proofState === 'END_TO_END_BLOCKED',
    blocked.report.proofState,
  );

  const insufficient = buildScenarioAssessments(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  assert(
    'insufficient evidence scenario',
    insufficient.report.proofState === 'INSUFFICIENT_EVIDENCE',
    insufficient.report.proofState,
  );

  assert(
    'history records assessments',
    getEndToEndExecutionProofHistorySize() >= 4,
    `${getEndToEndExecutionProofHistorySize()} entries`,
  );

  const historySummary = buildEndToEndExecutionProofHistorySummary();
  assert(
    'history summary tracks proof states',
    historySummary.totalAssessments >= 4 &&
      historySummary.provenChains >= 1 &&
      historySummary.partiallyProvenChains >= 1 &&
      historySummary.blockedChains >= 1,
    JSON.stringify(historySummary),
  );

  resetEndToEndExecutionProofModuleForTests();
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
  const artifacts = buildEndToEndExecutionProofArtifacts({
    connectedVerificationAssessment: verificationAssessment,
    executionProofAssessment: buildExecutionProof('PROVEN_FIXED'),
    founderTestAssessment: founderTest,
  });
  const markdown = buildEndToEndExecutionProofReportMarkdown(artifacts.endToEndExecutionProofAssessment.report);
  assert(
    'artifacts bundle includes markdown report',
    artifacts.endToEndExecutionProofReportMarkdown.length > 100 &&
      markdown.includes('Proof State') &&
      markdown.includes('Stage Proof Summary'),
    `${artifacts.endToEndExecutionProofReportMarkdown.length} chars`,
  );
  checkpoint('fixture scenarios');

  resetEndToEndExecutionProofModuleForTests();
  const live = assessEndToEndExecutionProofChain({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    'live assessment executes',
    live.report.proofChainId.length > 0 &&
      live.report.proofState.length > 0 &&
      live.report.proofBundle.realExecutionPerformed === false,
    `${live.report.proofState} id=${live.report.proofChainId}`,
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
    console.log('END_TO_END_EXECUTION_PROOF_CHAIN_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN);
  console.log('');
  console.log('Proof states verified:');
  console.log(`  END_TO_END_PROVEN:             ${proven.report.proofState}`);
  console.log(`  END_TO_END_PARTIALLY_PROVEN:   ${partial.report.proofState}`);
  console.log(`  END_TO_END_BLOCKED:            ${blocked.report.proofState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:         ${insufficient.report.proofState}`);
  console.log(`  Live repo:                     ${live.report.proofState}`);
  console.log('');
  console.log('Report: architecture/END_TO_END_EXECUTION_PROOF_CHAIN_REPORT.md');
  console.log('');
}

main();
