/**
 * Phase 24Q — World 2 Workspace Instantiation Governance validation (leaf mode).
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
  MAX_APPROVAL_DURATION_MS,
  MAX_INSTANTIATION_ATTEMPTS,
  WORLD2_INSTANTIATION_SAFETY_GUARANTEES,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN,
  assessWorld2InstantiationGovernance,
  deriveInstantiationApprovalState,
  resetWorld2InstantiationGovernanceModuleForTests,
} from '../src/world2-workspace-instantiation-governance/index.js';

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
  'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-types.ts',
  'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-registry.ts',
  'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-authority.ts',
  'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-history.ts',
  'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-report-builder.ts',
  'src/world2-workspace-instantiation-governance/index.ts',
  'architecture/WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT.md',
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
    findingId: 'finding-instantiation-1',
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
      problemId: 'prob-instantiation',
      problemType: 'SHELL_INTERACTION',
      originalFailingSignal: 'Shell not clickable',
      description: 'Fixture',
    },
    attempt: {
      attemptId: 'attempt-instantiation',
      problemId: 'prob-instantiation',
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
    cacheKey: 'fixture-instantiation-proof',
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
    cacheKey: 'fixture-instantiation-acceptance',
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
      runId: 'founder-test-instantiation-fixture',
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
    cacheKey: 'fixture-instantiation-founder-test',
  };
}

function buildPlan(riskLevel: ExecutionPlanRiskLevel): ExecutionPlan {
  return {
    readOnly: true,
    planId: `plan-instantiation-${riskLevel}`,
    planType: 'FIX_PLAN',
    planSource: 'repair',
    reason: 'Fixture plan for instantiation governance validation',
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
    cacheKey: 'fixture-planner-instantiation',
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

function main(): void {
  console.log('');
  console.log('World 2 Workspace Instantiation Governance — Validation (leaf mode)');
  console.log('======================================================================');
  console.log('');

  checkpoint('start');
  resetWorld2InstantiationGovernanceModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText(
    'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-authority.ts',
  );
  const registrySource = readText(
    'src/world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-registry.ts',
  );
  const reportMd = readText('architecture/WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:world2-workspace-instantiation-governance']),
    'package.json',
  );
  assert(
    '02. authority export exists',
    authoritySource.includes('assessWorld2InstantiationGovernance'),
    'authority',
  );
  assert(
    '03. expiration policy defined',
    registrySource.includes('MAX_APPROVAL_DURATION_MS') &&
      registrySource.includes('MAX_INSTANTIATION_ATTEMPTS'),
    'expiration',
  );
  assert(
    '04. safety guarantees defined',
    registrySource.includes('WORLD2_INSTANTIATION_SAFETY_GUARANTEES'),
    'safety',
  );
  assert(
    '05. no live mutation guarantee',
    WORLD2_INSTANTIATION_SAFETY_GUARANTEES.some((g) => /no live workspace mutation/i.test(g)),
    'live ban',
  );
  assert('06. report pass token', reportMd.includes(WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN), 'token');
  assert('07. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('08. no network fetch', !authoritySource.includes('fetch('), 'network');
  checkpoint('static checks');

  resetWorld2InstantiationGovernanceModuleForTests();
  const approvedMaterialization = buildMaterializationAssessment(
    buildPlan('LOW'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('ACCEPTED'),
    buildFounderTest('FOUNDER_READY', true, 92),
  );
  const approved = assessWorld2InstantiationGovernance({
    materializationAssessment: approvedMaterialization,
  });
  assert(
    '09. approved scenario',
    approved.approvalState === 'APPROVED' &&
      approved.governanceApproval !== null &&
      approved.governanceApproval.expirationPolicy.maxApprovalDurationMs === MAX_APPROVAL_DURATION_MS &&
      approved.governanceApproval.safetyGuarantees.length >= 6,
    approved.approvalState,
  );

  resetWorld2InstantiationGovernanceModuleForTests();
  const restrictedMaterialization = buildMaterializationAssessment(
    buildPlan('HIGH'),
    buildExecutionProof('PARTIALLY_PROVEN'),
    buildAcceptance('ACCEPTED_WITH_WARNINGS'),
    buildFounderTest('FOUNDER_READY_WITH_WARNINGS', true, 72),
  );
  const restricted = assessWorld2InstantiationGovernance({
    materializationAssessment: restrictedMaterialization,
  });
  assert(
    '10. approved with restrictions scenario',
    restricted.approvalState === 'APPROVED_WITH_RESTRICTIONS' &&
      restricted.governanceApproval !== null &&
      restricted.governanceApproval.restrictions.length > 0,
    restricted.approvalState,
  );

  resetWorld2InstantiationGovernanceModuleForTests();
  const blockedMaterialization = buildMaterializationAssessment(
    buildPlan('CRITICAL'),
    buildExecutionProof('PROVEN_FIXED'),
    buildAcceptance('BLOCKED'),
    buildFounderTest('BLOCKED', true, 40),
  );
  const blocked = assessWorld2InstantiationGovernance({
    materializationAssessment: blockedMaterialization,
  });
  assert(
    '11. blocked scenario',
    blocked.approvalState === 'BLOCKED' && blocked.governanceApproval === null,
    blocked.approvalState,
  );

  resetWorld2InstantiationGovernanceModuleForTests();
  const insufficientMaterialization = buildMaterializationAssessment(
    buildPlan('MEDIUM'),
    null,
    null,
    buildFounderTest('INSUFFICIENT_EVIDENCE', false, 30),
  );
  const insufficient = assessWorld2InstantiationGovernance({
    materializationAssessment: insufficientMaterialization,
  });
  assert(
    '12. insufficient evidence scenario',
    insufficient.approvalState === 'INSUFFICIENT_EVIDENCE',
    insufficient.approvalState,
  );

  assert(
    '13. derive approval state exported',
    deriveInstantiationApprovalState({
      missingAuthorities: [],
      materializationState: 'READY',
      disposableWorkspaceState: 'READY',
      changeSetState: 'READY',
      runtimeState: 'READY_FOR_WORLD2',
      forbiddenPathCount: 0,
      validationAssetsPresent: true,
      rollbackAssetsPresent: true,
      disposalRequired: true,
      criticalRisk: false,
      hasBlueprint: true,
    }) === 'APPROVED',
    'derive',
  );

  assert(
    '14. expiration policy bounded',
    MAX_APPROVAL_DURATION_MS > 0 &&
      MAX_INSTANTIATION_ATTEMPTS > 0 &&
      MAX_INSTANTIATION_ATTEMPTS <= 10,
    `${MAX_APPROVAL_DURATION_MS}/${MAX_INSTANTIATION_ATTEMPTS}`,
  );

  resetWorld2InstantiationGovernanceModuleForTests();
  const live = assessWorld2InstantiationGovernance({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '15. live assessment executes',
    live.governanceId.length > 0 && live.approvalState.length > 0,
    `${live.approvalState} id=${live.governanceId}`,
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
    console.log('WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN);
  console.log('');
  console.log('Instantiation states verified:');
  console.log(`  APPROVED:                 ${approved.approvalState}`);
  console.log(`  APPROVED_WITH_RESTRICTIONS: ${restricted.approvalState}`);
  console.log(`  BLOCKED:                  ${blocked.approvalState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:    ${insufficient.approvalState}`);
  console.log(`  Live repo:                ${live.approvalState}`);
  console.log('');
  console.log('Report: architecture/WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
