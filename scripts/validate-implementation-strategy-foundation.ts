/**
 * DevPulse V2 Implementation Strategy Engine Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { buildArchitectureFromRequirements } from '../src/product-architect/index.js';
import { generatePackagesFromBlueprint, GENERATOR_OWNER_MODULE } from '../src/build-package-generator/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import {
  assertBuildPackageGeneratorOwnershipUnchanged,
  assertCentralBrainOwnershipUnchanged,
  assertProjectVaultOwnershipUnchanged,
  buildStrategyDuplicateContextFromBridges,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  DevPulseV2ImplementationStrategyAuthority,
  DUPLICATE_RISK_PREFIX,
  formatImplementationStrategyReport,
  generateBuildOrder,
  generateDependencyOrder,
  generateImplementationPhases,
  generateImplementationStrategy,
  generateRollbackPlan,
  generateValidationSequence,
  resetDevPulseV2ImplementationStrategyAuthorityForTests,
  STRATEGY_OWNER_MODULE,
  STRATEGY_PASS_TOKEN,
  summarizeStrategy,
} from '../src/implementation-strategy-engine/index.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { extractRequirements } from '../src/requirement-extractor/index.js';
import { resetDevPulseV2ProjectVaultAuthorityForTests } from '../src/project-vault/index.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';
import type { BuildPackage } from '../src/build-package-generator/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const ANDROID_EXAMPLE =
  'Build an Android expense tracker app for students with offline support.';

function createTestPackages(): BuildPackage[] {
  const now = Date.now();
  return [
    {
      packageId: 'pkg-expense-001',
      createdAt: now + 2,
      blueprintId: 'bp-test',
      objective: 'Implement ExpenseModule',
      modules: ['ExpenseModule'],
      dependencies: ['Requires data model: Expense'],
      validationRequirements: ['Validate expense CRUD operations'],
      risks: ['Financial data accuracy risk'],
      duplicateRisks: [],
      rollbackRequirements: ['Snapshot after ExpenseModule'],
      status: 'READY',
      warnings: [],
      errors: [],
    },
    {
      packageId: 'pkg-offline-001',
      createdAt: now,
      blueprintId: 'bp-test',
      objective: 'Implement OfflineStorageModule',
      modules: ['OfflineStorageModule'],
      dependencies: ['Requires integration: LocalStorageIntegration'],
      validationRequirements: ['Validate offline mode behavior without network'],
      risks: ['Offline data consistency risk'],
      duplicateRisks: [],
      rollbackRequirements: ['Restore local storage snapshot on rollback'],
      status: 'READY',
      warnings: [],
      errors: [],
    },
    {
      packageId: 'pkg-reports-001',
      createdAt: now + 3,
      blueprintId: 'bp-test',
      objective: 'Implement ReportsModule',
      modules: ['ReportsModule'],
      dependencies: ['Depends on service: ExpenseTrackingService'],
      validationRequirements: ['Validate reporting output'],
      risks: [],
      duplicateRisks: [],
      rollbackRequirements: ['Snapshot after ReportsModule'],
      status: 'READY',
      warnings: [],
      errors: [],
    },
  ];
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Implementation Strategy Engine Foundation Validation');
  console.log('====================================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['implementation_strategy_engine'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts implementation_strategy_engine packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const engine = resetDevPulseV2ImplementationStrategyAuthorityForTests();
  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();

  assert(
    '2. Authority exists',
    engine instanceof DevPulseV2ImplementationStrategyAuthority,
    `ownerModule=${DevPulseV2ImplementationStrategyAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('implementation_strategy_engine');
  assert(
    '3. Ownership registry contains implementation_strategy_engine',
    owner.ownerModule === STRATEGY_OWNER_MODULE &&
      DevPulseV2ImplementationStrategyAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Engine starts empty',
    engine.getEngineState().strategyCount === 0,
    `strategies=${engine.getEngineState().strategyCount}`,
  );

  const testPackages = createTestPackages();
  const generation = {
    generationId: 'gen-test-001',
    packageCount: testPackages.length,
    packages: testPackages,
    warnings: [],
    errors: [],
  };

  const strategy = generateImplementationStrategy(generation);
  assert(
    '5. generateImplementationStrategy works',
    strategy.strategyId.length > 0 && strategy.phases.length === 3,
    `phases=${strategy.phases.length} status=${strategy.status}`,
  );

  const buildOrder = generateBuildOrder(testPackages);
  const offlineIdx = buildOrder.findIndex((p) => p.modules.includes('OfflineStorageModule'));
  const expenseIdx = buildOrder.findIndex((p) => p.modules.includes('ExpenseModule'));
  const reportsIdx = buildOrder.findIndex((p) => p.modules.includes('ReportsModule'));
  assert(
    '6. generateBuildOrder works',
    offlineIdx < expenseIdx && expenseIdx < reportsIdx,
    buildOrder.map((p) => p.modules[0]).join(' → '),
  );

  const depOrder = generateDependencyOrder(testPackages);
  assert(
    '7. generateDependencyOrder works',
    depOrder.length === 3 && depOrder.includes('pkg-offline-001'),
    depOrder.join(', '),
  );

  const validationSeq = generateValidationSequence(testPackages);
  assert(
    '8. generateValidationSequence works',
    validationSeq.some((v) => v.includes('offline')) &&
      validationSeq.some((v) => v.includes('expense')),
    validationSeq.slice(0, 3).join('; '),
  );

  const rollbackPlan = generateRollbackPlan(testPackages);
  assert(
    '9. generateRollbackPlan works',
    rollbackPlan.length >= 3 && rollbackPlan.some((r) => r.includes('Phase')),
    rollbackPlan.slice(0, 2).join('; '),
  );

  const phases = generateImplementationPhases(testPackages);
  assert(
    '10. generateImplementationPhases works',
    phases.length === 3 &&
      phases[0].title.includes('OfflineStorageModule') &&
      phases[1].title.includes('ExpenseModule'),
    phases.map((p) => p.title).join(' | '),
  );

  const summary = summarizeStrategy(strategy);
  assert(
    '11. summarizeStrategy works',
    summary.includes('Strategy') && summary.includes('phases=3'),
    summary.slice(0, 80),
  );

  const extraction = extractRequirements({
    requestId: 'strat-test-001',
    userInput: ANDROID_EXAMPLE,
  });
  const blueprint = buildArchitectureFromRequirements(extraction);
  const pkgGeneration = generatePackagesFromBlueprint(blueprint);
  const fromPackages = engine.generateAndStore(pkgGeneration);
  const pkgSummary = engine.getPackageSummary(pkgGeneration);
  assert(
    '12. Package bridge works',
    fromPackages.phases.length > 0 &&
      pkgSummary.includes('modules=') &&
      assertBuildPackageGeneratorOwnershipUnchanged() &&
      getDevPulseV2Owner('build_package_generator').ownerModule === GENERATOR_OWNER_MODULE,
    `phases=${fromPackages.phases.length}`,
  );

  const published = engine.publishStrategySummary(fromPackages);
  const latest = engine.getLatestStrategySummary();
  assert(
    '13. Central Brain bridge works',
    published.strategyId === fromPackages.strategyId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const project = vault.createProject('Expense Tracker', 'Existing ExpenseModule strategy');
  vault.addProjectFact(project.projectId, {
    source: 'SYSTEM',
    label: 'module',
    value: 'ExpenseModule',
    confidence: 'HIGH',
  });
  const stratCtx = engine.getStrategyContext();
  const capSummary = engine.getExistingCapabilitySummary();
  assert(
    '14. Project Vault bridge works',
    stratCtx.projectCount >= 1 &&
      stratCtx.capabilityLabels.includes('ExpenseModule') &&
      capSummary.includes('ExpenseModule') &&
      assertProjectVaultOwnershipUnchanged() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    capSummary.slice(0, 60),
  );

  const dupContext = buildStrategyDuplicateContextFromBridges(generation);
  const existing = detectExistingCapabilities(dupContext);
  const dupWarnings = detectPotentialDuplicates('ExpenseModule', dupContext);
  assert(
    '15. Duplicate detection works',
    existing.some((c) => c.includes('expensemodule')) && dupWarnings.length > 0,
    `existing=${existing.join('|')} warnings=${dupWarnings.length}`,
  );

  const strategyWithDup = generateImplementationStrategy(generation, dupContext);
  const dupPhases = strategyWithDup.phases.filter((p) =>
    p.warnings.some((w) => w.startsWith(DUPLICATE_RISK_PREFIX)),
  );
  assert(
    '16. DUPLICATE_RISK warnings generated correctly',
    strategyWithDup.duplicateRisks.length > 0 &&
      dupPhases.length > 0 &&
      strategyWithDup.phases.length === 3,
    `risks=${strategyWithDup.duplicateRisks.length} flagged_phases=${dupPhases.length}`,
  );

  const stored = engine.generateAndStore(pkgGeneration);
  const retrieved = engine.getStrategy(stored.strategyId);
  assert(
    '17. Strategy records stored correctly',
    engine.getEngineState().strategyCount >= 2 &&
      retrieved !== null &&
      retrieved.phases.length > 0,
    `stored=${stored.strategyId}`,
  );

  const reportText = formatImplementationStrategyReport(
    engine.getEngineState(),
    engine.listStrategies(),
  );
  assert(
    '18. Report generated',
    reportText.includes('Implementation Strategy Engine Report') &&
      engine.formatReport().includes('Recommendation:'),
    `strategies=${engine.getEngineState().strategyCount}`,
  );

  assert(
    '19. Strategy Engine does not generate code',
    DevPulseV2ImplementationStrategyAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '20. Strategy Engine does not execute actions',
    DevPulseV2ImplementationStrategyAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '21. Strategy Engine does not modify projects',
    DevPulseV2ImplementationStrategyAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '22. Strategy Engine does not become answer authority',
    DevPulseV2ImplementationStrategyAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    STRATEGY_OWNER_MODULE,
  );

  assert(
    '23. Validation Budget Policy still passes',
    DevPulseV2ImplementationStrategyAuthority.assertValidationBudgetCompatible() &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `policy=${POLICY_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('24. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('====================================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(STRATEGY_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('IMPLEMENTATION STRATEGY ENGINE FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
