/**
 * Phase 24XB — Authority Ownership & Integration Bridge validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertNoThirdPlanner,
  assertPlannerOwnership,
  FOUNDER_ACCEPTANCE_AUTHORITATIVE_OWNER,
  getDevPulseV2Owner,
  PLANNER_OWNERSHIP_RULES,
  resolvePlannerOwnerForPlanSource,
} from '../src/foundation/index.js';
import type { OwnershipDomain } from '../src/foundation/types.js';
import {
  EXECUTION_PROOF_AUTHORITATIVE_OWNER,
  EXECUTION_PROOF_PERSISTENCE_OWNER,
  mapExecutionProofAssessmentToEvidenceChain,
  recordExecutionProofAssessmentInLedger,
} from '../src/execution-proof-evolution/index.js';
import type { ExecutionProofAssessment } from '../src/execution-proof-evolution/execution-proof-types.js';
import {
  EXECUTION_PACKAGE_AUTHORITATIVE_OWNER,
  mapWorld2DryRunPackageToExecutionPackage,
} from '../src/world2-dry-run-execution-composer/index.js';
import type { World2DryRunExecutionPackage } from '../src/world2-dry-run-execution-composer/world2-dry-run-execution-composer-types.js';
import {
  evaluateDisposableWorkspaceFoundationBoundaries,
  WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER,
} from '../src/world2-disposable-workspace/index.js';
import {
  applyOrchestratorAcceptanceDelegation,
  buildFounderAcceptanceBridgeSnapshot,
  FOUNDER_ACCEPTANCE_GATE_ROLE,
  FOUNDER_TEST_INTEGRATION_ROLE,
  resolveAuthoritativeFounderAcceptance,
} from '../src/foundation/founder-acceptance-integration-bridge.js';

export const AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_PASS =
  'AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();

const PHASE_24E_24Y_DOMAINS: OwnershipDomain[] = [
  'execution_proof_evolution',
  'founder_test_integration',
  'founder_acceptance_gate',
  'autonomous_repair_loop',
  'autonomous_builder_execution_planner',
  'autonomous_builder_execution_sandbox',
  'world2_controlled_execution_runtime',
  'world2_execution_engine',
  'world2_disposable_workspace',
  'world2_change_set_authority',
  'world2_workspace_population',
  'world2_workspace_materialization',
  'world2_workspace_instantiation_governance',
  'world2_disposable_workspace_creator',
  'world2_disposable_workspace_instantiator',
  'world2_repository_snapshot',
  'world2_repository_snapshot_executor',
  'world2_repository_snapshot_materializer',
  'world2_change_set_materializer',
  'world2_dry_run_execution_composer',
  'world2_dry_run_execution_verifier',
];

const REQUIRED_FILES = [
  'src/foundation/ownership-registry.ts',
  'src/foundation/planner-ownership-registry.ts',
  'src/foundation/founder-acceptance-integration-bridge.ts',
  'src/world2-dry-run-execution-composer/world2-execution-package-bridge.ts',
  'src/world2-disposable-workspace/world2-workspace-foundation-bridge.ts',
  'src/execution-proof-evolution/execution-evidence-ledger-bridge.ts',
  'architecture/AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_REPORT.md',
  'scripts/validate-authority-ownership-and-integration-bridge.ts',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function buildSampleDryRunPackage(): World2DryRunExecutionPackage {
  return {
    readOnly: true,
    packageId: 'dry-run-bridge-fixture-001',
    workspaceId: 'world2-fixture-ws',
    snapshotMaterializationOperation: null,
    changeMaterializationOperation: null,
    orderedSteps: [],
    validationSteps: [],
    rollbackSteps: [],
    auditTrail: [],
    safetyChecks: [],
    finalReadinessState: 'DRY_RUN_PACKAGE_READY',
    realExecutionPerformed: false,
  };
}

function buildSampleProofAssessment(): ExecutionProofAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    problem: {
      problemId: 'proof-bridge-fixture',
      problemType: 'VALIDATION',
      originalFailingSignal: 'fixture signal',
      description: 'Fixture problem for bridge validation',
    },
    attempt: {
      attemptId: 'attempt-bridge-fixture',
      problemId: 'proof-bridge-fixture',
      claimedFixType: 'FIX',
      claimedFixDescription: 'Fixture fix',
      snapshot: {
        beforeState: 'fail',
        afterState: 'pass',
        metricBefore: 0,
        metricAfter: 100,
        originalFailureStillPresent: false,
        regressionObserved: false,
      },
      evidence: [],
      originalFailureRetested: true,
      causalLinkToFix: true,
    },
    executionProofScore: 90,
    verdict: 'PROVEN_FIXED',
    confidence: 'HIGH',
    originalFailureImproved: true,
    regressionDetected: false,
    proofStrongEnough: true,
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
      originalProblem: 'fixture',
      claimedFix: 'fixture',
      beforeAfterSummary: 'improved',
      originalFailureGone: true,
      causallyTiedToFix: true,
      regressionAppeared: false,
      proofStrongEnough: true,
      recommendedAction: 'KEEP',
    },
    recommendations: [],
    cacheKey: 'fixture-proof-bridge',
  };
}

function main(): void {
  console.log('Phase 24XB — Authority Ownership & Integration Bridge Validation');
  console.log('==================================================================');
  console.log('');

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }

  for (const domain of PHASE_24E_24Y_DOMAINS) {
    const owner = getDevPulseV2Owner(domain);
    assert(
      `ownership registry: ${domain}`,
      owner.domain === domain && owner.ownerModule.length > 0 && owner.ownerFunction.length > 0,
      `${owner.ownerModule}.${owner.ownerFunction} phase=${owner.phase}`,
    );
  }

  const registryText = readText('src/foundation/ownership-registry.ts');
  assert(
    'OwnerRecord extended with delegation fields',
    registryText.includes('delegatedCapabilities') &&
      registryText.includes('upstreamDependencies') &&
      registryText.includes('downstreamConsumers'),
    'delegation metadata fields',
  );

  const dryRunPackage = buildSampleDryRunPackage();
  const executionPackage = mapWorld2DryRunPackageToExecutionPackage(dryRunPackage);
  assert(
    'execution package bridge maps dry-run package',
    executionPackage.packageId === dryRunPackage.packageId &&
      executionPackage.metadata.authoritativeExecutionPackageOwner === EXECUTION_PACKAGE_AUTHORITATIVE_OWNER,
    `owner=${executionPackage.metadata.authoritativeExecutionPackageOwner}`,
  );

  assert(
    'execution package authoritative owner is execution_package_runtime',
    EXECUTION_PACKAGE_AUTHORITATIVE_OWNER === 'execution_package_runtime',
    EXECUTION_PACKAGE_AUTHORITATIVE_OWNER,
  );

  const composerOwner = getDevPulseV2Owner('world2_dry_run_execution_composer');
  assert(
    '24X composer delegates package authority to runtime',
    composerOwner.authoritativeOwner === 'execution_package_runtime',
    String(composerOwner.authoritativeOwner),
  );

  const foundationBridge = evaluateDisposableWorkspaceFoundationBoundaries(
    'world2-fixture-ws',
    'world2-fixture-ws',
  );
  assert(
    'workspace foundation bridge returns foundation-owned result',
    foundationBridge.foundationOwned === true && foundationBridge.readOnly === true,
    `isolated=${foundationBridge.isolated}`,
  );

  assert(
    'workspace isolation authoritative owner',
    WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER === 'world2_workspace_foundation',
    WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER,
  );

  const disposableOwner = getDevPulseV2Owner('world2_disposable_workspace');
  assert(
    '24M disposable workspace delegates isolation to foundation',
    disposableOwner.authoritativeOwner === 'world2_workspace_foundation',
    String(disposableOwner.authoritativeOwner),
  );

  const disposableAuthorityText = readText('src/world2-disposable-workspace/world2-disposable-workspace-authority.ts');
  assert(
    'disposable workspace consumes foundation bridge',
    disposableAuthorityText.includes('evaluateDisposableWorkspaceFoundationBoundaries'),
    'foundation bridge import used',
  );

  const orchestratorBundle = resolveAuthoritativeFounderAcceptance({
    requestId: 'bridge-validation-request',
    projectId: 'bridge-project',
    workspaceId: 'bridge-workspace',
  });
  const gateBridge = buildFounderAcceptanceBridgeSnapshot(orchestratorBundle, 'founder_acceptance_gate', true);
  const portfolioBridge = buildFounderAcceptanceBridgeSnapshot(
    orchestratorBundle,
    'founder_test_integration',
    false,
  );

  assert(
    'founder acceptance bridge resolves orchestrator',
    gateBridge.authoritativeOwner === FOUNDER_ACCEPTANCE_AUTHORITATIVE_OWNER &&
      gateBridge.noDuplicateScoring === true,
    `verdict=${gateBridge.orchestratorVerdict}`,
  );

  assert(
    '24G repair-path gate role documented',
    gateBridge.repairPathOnly === true && gateBridge.delegatedFrom === 'founder_acceptance_gate',
    FOUNDER_ACCEPTANCE_GATE_ROLE,
  );

  assert(
    '24F portfolio role documented',
    portfolioBridge.delegatedFrom === 'founder_test_integration' && portfolioBridge.repairPathOnly === false,
    FOUNDER_TEST_INTEGRATION_ROLE,
  );

  const delegatedState = applyOrchestratorAcceptanceDelegation(
    'ACCEPTED',
    'FAIL',
    'FOUNDER_REJECTS',
  );
  assert(
    'orchestrator rejection caps repair gate acceptance',
    delegatedState === 'NOT_ACCEPTED',
    delegatedState,
  );

  const gateOwner = getDevPulseV2Owner('founder_acceptance_gate');
  assert(
    '24G delegates product acceptance to orchestrator',
    gateOwner.authoritativeOwner === 'founder_acceptance_orchestrator',
    String(gateOwner.authoritativeOwner),
  );

  const proofAssessment = buildSampleProofAssessment();
  const chain = mapExecutionProofAssessmentToEvidenceChain(proofAssessment);
  const ledgerRecord = recordExecutionProofAssessmentInLedger(proofAssessment);

  assert(
    'execution proof bridge maps assessment to evidence chain',
    chain.authorityId === EXECUTION_PROOF_AUTHORITATIVE_OWNER && chain.packageId.includes('execution-proof'),
    chain.authorityId,
  );

  assert(
    'execution proof persistence owner is ledger',
    EXECUTION_PROOF_PERSISTENCE_OWNER === 'execution_evidence_ledger' &&
      ledgerRecord.packageId.includes('execution-proof'),
    ledgerRecord.ledgerRecordId,
  );

  assert(
    'planner ownership: builder → world2_execution_planner',
    assertPlannerOwnership('builder', 'world2_execution_planner'),
    resolvePlannerOwnerForPlanSource('builder').ownerModule,
  );

  assert(
    'planner ownership: repair → autonomous_builder_execution_planner',
    assertPlannerOwnership('repair', 'autonomous_builder_execution_planner'),
    resolvePlannerOwnerForPlanSource('repair').ownerModule,
  );

  assert(
    'no third planner domain registered in rules',
    Object.keys(PLANNER_OWNERSHIP_RULES).length === 2 &&
      assertNoThirdPlanner('world2_execution_planner') &&
      assertNoThirdPlanner('autonomous_builder_execution_planner'),
    'builder + repair only',
  );

  const world2PlannerTypes = readText('src/world2-execution-planner/types.ts');
  const repairPlannerTypes = readText('src/autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.ts');
  assert(
    'planSource enforced on planner types',
    world2PlannerTypes.includes("planSource: 'builder'") &&
      repairPlannerTypes.includes("planSource: 'repair'"),
    'planSource fields present',
  );

  const srcScanRoots = readText('src/foundation/ownership-registry.ts');
  assert(
    'no new execution runtime created in 24XB bridge files',
    !readText('src/world2-dry-run-execution-composer/world2-execution-package-bridge.ts').includes(
      'class DevPulseV2',
    ) &&
      !readText('src/world2-disposable-workspace/world2-workspace-foundation-bridge.ts').includes(
        'class DevPulseV2',
      ),
    'bridge files are functions only',
  );

  assert(
    'no new planner module created in 24XB',
    !existsSync(join(ROOT, 'src/world2-repair-execution-planner')) &&
      !existsSync(join(ROOT, 'src/third-execution-planner')),
    'only planner-ownership-registry added',
  );

  assert(
    'no new acceptance authority created in 24XB',
    !existsSync(join(ROOT, 'src/founder-acceptance-authority-v2')) &&
      srcScanRoots.includes('founder_acceptance_orchestrator'),
    'orchestrator remains single product acceptance owner',
  );

  const reportText = readText('architecture/AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_REPORT.md');
  assert(
    'integration report includes required sections',
    reportText.includes('Authority Ownership Matrix') &&
      reportText.includes('Delegation Matrix') &&
      reportText.includes('Execution Package Bridge Summary') &&
      reportText.includes('Workspace Foundation Bridge Summary') &&
      reportText.includes('Founder Acceptance Bridge Summary') &&
      reportText.includes('Execution Proof Bridge Summary') &&
      reportText.includes('Planner Ownership Summary') &&
      reportText.includes(AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_PASS),
    'report sections + pass token',
  );

  const passed = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failedCount}`);
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');

  if (failedCount > 0) {
    console.log('AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_PASS);
  console.log('');
  console.log('Report: architecture/AUTHORITY_OWNERSHIP_AND_INTEGRATION_BRIDGE_REPORT.md');
}

main();
