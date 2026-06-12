/**
 * Phase 24S — World 2 Disposable Workspace Instantiator validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecutionPlannerAssessment } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
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
  DEFAULT_INSTANTIATION_MODE,
  WORLD2_INSTANTIATOR_SAFETY_GUARANTEES,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN,
  assessWorld2DisposableWorkspaceInstantiator,
  deriveInstantiationEligibilityMode,
  performWorld2InstantiationSafetyChecks,
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests,
} from '../src/world2-disposable-workspace-instantiator/index.js';

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
  'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.ts',
  'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-registry.ts',
  'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-authority.ts',
  'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-history.ts',
  'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-report-builder.ts',
  'src/world2-disposable-workspace-instantiator/index.ts',
  'architecture/WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT.md',
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
    findingId: 'finding-instantiator-1',
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
      problemId: 'prob-instantiator',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-instantiator',
      problemId: 'prob-instantiator',
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
    cacheKey: 'fixture-instantiator-proof',
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
    cacheKey: 'fixture-instantiator-acceptance',
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
      runId: 'founder-test-instantiator-fixture',
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
    cacheKey: 'fixture-instantiator-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-instantiator-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for disposable workspace instantiator validation',
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
    cacheKey: 'fixture-planner-instantiator',
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

function main(): void {
  console.log('');
  console.log('World 2 Disposable Workspace Instantiator — Validation (leaf mode)');
  console.log('====================================================================');
  console.log('');

  checkpoint('start');
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText(
    'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-authority.ts',
  );
  const registrySource = readText(
    'src/world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-registry.ts',
  );
  const reportMd = readText('architecture/WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:world2-disposable-workspace-instantiator']),
    'package.json',
  );
  assert(
    '02. authority export exists',
    authoritySource.includes('assessWorld2DisposableWorkspaceInstantiator'),
    'authority',
  );
  assert(
    '03. default dry-run mode defined',
    registrySource.includes('DEFAULT_INSTANTIATION_MODE') &&
      registrySource.includes("'DRY_RUN'"),
    'dry-run default',
  );
  assert(
    '04. safety guarantees defined',
    registrySource.includes('WORLD2_INSTANTIATOR_SAFETY_GUARANTEES'),
    'safety',
  );
  assert(
    '05. no repository copy guarantee',
    WORLD2_INSTANTIATOR_SAFETY_GUARANTEES.some((g) => /no repository copy/i.test(g)),
    'repo copy ban',
  );
  assert(
    '06. no change set application guarantee',
    WORLD2_INSTANTIATOR_SAFETY_GUARANTEES.some((g) => /no change set application/i.test(g)),
    'change set ban',
  );
  assert(
    '07. report pass token',
    reportMd.includes(WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN),
    'token',
  );
  assert('08. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('09. no network fetch', !authoritySource.includes('fetch('), 'network');
  checkpoint('static checks');

  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const readyCreator = buildCreatorAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const dryRunDefault = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: readyCreator,
  });
  assert(
    '10. dry-run default scenario',
    dryRunDefault.resultState === 'INSTANTIATION_READY' &&
      dryRunDefault.instantiationOperation !== null &&
      dryRunDefault.instantiationOperation.mode === DEFAULT_INSTANTIATION_MODE &&
      dryRunDefault.instantiationOperation.eligibilityMode === 'REAL_INSTANTIATION_ELIGIBLE',
    `${dryRunDefault.resultState} mode=${dryRunDefault.instantiationOperation?.mode}`,
  );

  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const realEligible = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: readyCreator,
    executionModeOverride: 'REAL_INSTANTIATION',
  });
  assert(
    '11. real instantiation eligible scenario',
    realEligible.resultState === 'INSTANTIATION_READY' &&
      realEligible.instantiationOperation !== null &&
      realEligible.instantiationOperation.mode === 'REAL_INSTANTIATION_ELIGIBLE' &&
      realEligible.instantiationOperation.repositoryCopyPerformed === false,
    `${realEligible.resultState} mode=${realEligible.instantiationOperation?.mode}`,
  );

  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const restrictedCreator = buildCreatorAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  const simulated = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: restrictedCreator,
  });
  assert(
    '12. simulated instantiation scenario',
    simulated.resultState === 'INSTANTIATION_SIMULATED' &&
      simulated.instantiationOperation !== null &&
      simulated.instantiationOperation.eligibilityMode === 'SIMULATED_INSTANTIATION',
    simulated.resultState,
  );

  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const blockedCreator = buildCreatorAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  const blocked = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: blockedCreator,
  });
  assert(
    '13. blocked scenario',
    blocked.resultState === 'INSTANTIATION_BLOCKED' && blocked.instantiationOperation === null,
    blocked.resultState,
  );

  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const insufficientCreator = buildCreatorAssessment(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  const insufficient = assessWorld2DisposableWorkspaceInstantiator({
    creatorAssessment: insufficientCreator,
  });
  assert(
    '14. insufficient evidence scenario',
    insufficient.resultState === 'INSUFFICIENT_EVIDENCE',
    insufficient.resultState,
  );

  assert(
    '15. live path blocking',
    deriveInstantiationEligibilityMode({
      missingAuthorities: [],
      creationState: 'CREATION_READY',
      materializationState: 'READY',
      governanceState: 'APPROVED',
      safetyChecksPassed: false,
      criticalSafetyFailures: 1,
      hasCreationPlan: true,
      plannedRootIsLive: true,
      plannedRootIsProduction: false,
    }) === 'BLOCKED',
    'live path',
  );

  assert(
    '16. safety checks exist',
    dryRunDefault.instantiationOperation !== null &&
      dryRunDefault.instantiationOperation.safetyChecks.length >= 9 &&
      dryRunDefault.instantiationOperation.safetyChecks.every((c) => c.checkId.length > 0),
    `${dryRunDefault.instantiationOperation?.safetyChecks.length ?? 0} checks`,
  );

  assert(
    '17. no repo copy in operation',
    dryRunDefault.instantiationOperation !== null &&
      dryRunDefault.instantiationOperation.repositoryCopyPerformed === false,
    'repositoryCopyPerformed',
  );

  assert(
    '18. no change set application in operation',
    dryRunDefault.instantiationOperation !== null &&
      dryRunDefault.instantiationOperation.changeSetApplicationPerformed === false,
    'changeSetApplicationPerformed',
  );

  assert(
    '19. safety checks exported',
    typeof performWorld2InstantiationSafetyChecks === 'function',
    'performWorld2InstantiationSafetyChecks',
  );

  const livePathCheck = performWorld2InstantiationSafetyChecks({
    creatorAssessment: {
      ...readyCreator,
      creationPlan: readyCreator.creationPlan
        ? {
            ...readyCreator.creationPlan,
            plannedRoot: '/live-devpulse-workspace/world2-test',
          }
        : null,
    },
    materializationAssessment: readyCreator.inputSnapshot.materializationAssessment,
    instantiationGovernanceAssessment: readyCreator.inputSnapshot.instantiationGovernanceAssessment,
    missingAuthorities: [],
  }).find((check) => check.checkId === 'planned-root-not-live');

  assert(
    '20. live path safety check fails',
    livePathCheck !== undefined && livePathCheck.passed === false,
    livePathCheck?.detail ?? 'missing check',
  );

  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  const live = assessWorld2DisposableWorkspaceInstantiator({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '21. live assessment executes',
    live.instantiatorAssessmentId.length > 0 && live.resultState.length > 0,
    `${live.resultState} id=${live.instantiatorAssessmentId}`,
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
    console.log('WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN);
  console.log('');
  console.log('Instantiation states verified:');
  console.log(`  INSTANTIATION_READY (dry-run):     ${dryRunDefault.resultState}`);
  console.log(`  REAL_INSTANTIATION_ELIGIBLE:       ${realEligible.instantiationOperation?.mode}`);
  console.log(`  INSTANTIATION_SIMULATED:           ${simulated.resultState}`);
  console.log(`  INSTANTIATION_BLOCKED:             ${blocked.resultState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:             ${insufficient.resultState}`);
  console.log(`  Live repo:                         ${live.resultState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
