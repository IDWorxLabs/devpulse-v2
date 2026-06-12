/**
 * Phase 24O — World 2 Workspace Population validation (leaf mode).
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
import type { World2ChangeSetAssessment } from '../src/world2-change-set-authority/world2-change-set-types.js';
import {
  WORLD2_WORKSPACE_POPULATION_PASS_TOKEN,
  assessWorld2WorkspacePopulation,
  derivePopulationReadinessState,
  resetWorld2WorkspacePopulationModuleForTests,
} from '../src/world2-workspace-population/index.js';

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
  'src/world2-workspace-population/world2-workspace-population-types.ts',
  'src/world2-workspace-population/world2-workspace-population-registry.ts',
  'src/world2-workspace-population/world2-workspace-population-authority.ts',
  'src/world2-workspace-population/world2-workspace-population-history.ts',
  'src/world2-workspace-population/world2-workspace-population-report-builder.ts',
  'src/world2-workspace-population/index.ts',
  'architecture/WORLD2_WORKSPACE_POPULATION_REPORT.md',
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
    findingId: 'finding-population-1',
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
      problemId: 'prob-population',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-population',
      problemId: 'prob-population',
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
    cacheKey: 'fixture-population-proof',
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
    cacheKey: 'fixture-population-acceptance',
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
      runId: 'founder-test-population-fixture',
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
    cacheKey: 'fixture-population-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-population-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for population validation',
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
    cacheKey: 'fixture-planner-population',
  };
}

function buildChangeSetAssessment(
  plan: ExecutionPlan | null,
  proof: ExecutionProofAssessment | null,
  acceptance: FounderAcceptanceAssessment | null,
): World2ChangeSetAssessment {
  resetAutonomousBuilderExecutionSandboxModuleForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
  resetWorld2ExecutionEngineModuleForTests();
  resetWorld2DisposableWorkspaceModuleForTests();
  resetWorld2ChangeSetAuthorityModuleForTests();
  const sandbox = assessAutonomousBuilderExecutionSandbox({
    executionPlannerAssessment: buildPlannerAssessment(plan, proof, acceptance),
  });
  const runtime = assessWorld2ControlledExecutionRuntime({ sandboxAssessment: sandbox });
  const engine = assessWorld2ExecutionEngine({ runtimeAssessment: runtime });
  const disposable = assessWorld2DisposableWorkspace({ engineAssessment: engine });
  return assessWorld2ChangeSetAuthority({ disposableWorkspaceAssessment: disposable });
}

function main(): void {
  console.log('');
  console.log('World 2 Workspace Population — Validation (leaf mode)');
  console.log('======================================================');
  console.log('');

  checkpoint('start');
  resetWorld2WorkspacePopulationModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/world2-workspace-population/world2-workspace-population-authority.ts');
  const registrySource = readText('src/world2-workspace-population/world2-workspace-population-registry.ts');
  const reportMd = readText('architecture/WORLD2_WORKSPACE_POPULATION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:world2-workspace-population']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessWorld2WorkspacePopulation'), 'authority');
  assert('03. population contract builder', authoritySource.includes('buildPopulationContract'), 'contract');
  assert('04. validation assets tracked', authoritySource.includes('VALIDATION_CONTEXT'), 'validation');
  assert('05. rollback assets tracked', authoritySource.includes('ROLLBACK_CONTEXT'), 'rollback');
  assert('06. report pass token', reportMd.includes(WORLD2_WORKSPACE_POPULATION_PASS_TOKEN), 'token');
  assert('07. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('08. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert('09. never require safety list', registrySource.includes('WORLD2_POPULATION_NEVER_REQUIRE'), 'safety');
  checkpoint('static checks');

  resetWorld2WorkspacePopulationModuleForTests();
  const readyChangeSet = buildChangeSetAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
  );
  const ready = assessWorld2WorkspacePopulation({
    changeSetAssessment: readyChangeSet,
    founderTestAssessment: buildFounderTest('FOUNDER_READY', true, 92),
  });
  assert(
    '10. ready scenario',
    ready.readinessState === 'READY' &&
      ready.populationContract !== null &&
      ready.requiredValidationAssets.length > 0 &&
      ready.requiredRollbackAssets.length > 0 &&
      ready.missingArtifacts.filter((a) => a.required).length === 0,
    ready.readinessState,
  );

  resetWorld2WorkspacePopulationModuleForTests();
  const warningChangeSet = buildChangeSetAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
  );
  const warning = assessWorld2WorkspacePopulation({
    changeSetAssessment: warningChangeSet,
    founderTestAssessment: buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  });
  assert(
    '11. warning scenario',
    warning.readinessState === 'READY_WITH_WARNINGS' &&
      warning.populationContract !== null &&
      warning.warningReasons.length > 0,
    warning.readinessState,
  );

  resetWorld2WorkspacePopulationModuleForTests();
  const blockedChangeSet = buildChangeSetAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
  );
  const blocked = assessWorld2WorkspacePopulation({
    changeSetAssessment: blockedChangeSet,
    founderTestAssessment: buildFounderTest('BLOCKED', true, 40),
  });
  assert(
    '12. blocked scenario',
    blocked.readinessState === 'BLOCKED' && blocked.blockingReasons.length > 0,
    blocked.readinessState,
  );

  resetWorld2WorkspacePopulationModuleForTests();
  const insufficientChangeSet = buildChangeSetAssessment(buildPlan('MEDIUM'), null, null);
  const insufficient = assessWorld2WorkspacePopulation({
    changeSetAssessment: insufficientChangeSet,
    founderTestAssessment: buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  });
  assert(
    '13. insufficient evidence scenario',
    insufficient.readinessState === 'INSUFFICIENT_EVIDENCE',
    insufficient.readinessState,
  );

  assert(
    '14. derive readiness exported',
    derivePopulationReadinessState({
      missingAuthorities: [],
      changeSetState: 'READY',
      workspaceState: 'READY',
      founderTestVerdict: 'FOUNDER_READY',
      criticalMissingCount: 0,
      minorMissingCount: 0,
      hasValidationContext: true,
      hasRollbackContext: true,
      hasRequirementsContext: true,
      hasArchitectureContext: true,
    }) === 'READY',
    'derive',
  );

  resetWorld2WorkspacePopulationModuleForTests();
  const live = assessWorld2WorkspacePopulation({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '15. live assessment executes',
    live.populationId.length > 0 && live.readinessState.length > 0,
    `${live.readinessState} id=${live.populationId}`,
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
    console.log('WORLD2_WORKSPACE_POPULATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_WORKSPACE_POPULATION_PASS_TOKEN);
  console.log('');
  console.log('Readiness states verified:');
  console.log(`  READY:                  ${ready.readinessState}`);
  console.log(`  READY_WITH_WARNINGS:    ${warning.readinessState}`);
  console.log(`  BLOCKED:                ${blocked.readinessState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:  ${insufficient.readinessState}`);
  console.log(`  Live repo:              ${live.readinessState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_WORKSPACE_POPULATION_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
