/**
 * DevPulse V2 Recovery Strategy Planner Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { buildArchitectureFromRequirements } from '../src/product-architect/index.js';
import { generatePackagesFromBlueprint } from '../src/build-package-generator/index.js';
import { generateStrategyFromPackages } from '../src/implementation-strategy-engine/index.js';
import { generatePlanFromStrategy, PLANNER_OWNER_MODULE } from '../src/code-generation-planner/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { STRATEGY_OWNER_MODULE } from '../src/implementation-strategy-engine/types.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertCodeGenerationPlannerOwnershipUnchanged,
  assertImplementationStrategyOwnershipUnchanged,
  assertProjectVaultOwnershipUnchanged,
  buildRecoveryDuplicateContextFromBridges,
  buildRecoveryInputFromCodePlan,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  DevPulseV2RecoveryStrategyAuthority,
  DUPLICATE_RISK_PREFIX,
  formatRecoveryStrategyReport,
  generateDependencyFailureResponses,
  generateFailureResponses,
  generateRecoveryCheckpoints,
  generateRecoveryFromCodePlan,
  generateRecoveryFromStrategy,
  generateRecoveryStrategy,
  generateRollbackRecommendations,
  generateValidationFailureResponses,
  RECOVERY_OWNER_MODULE,
  RECOVERY_PASS_TOKEN,
  resetDevPulseV2RecoveryStrategyAuthorityForTests,
  summarizeRecoveryStrategy,
} from '../src/recovery-strategy-planner/index.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { extractRequirements } from '../src/requirement-extractor/index.js';
import { resetDevPulseV2ProjectVaultAuthorityForTests } from '../src/project-vault/index.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

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

function buildFullPipeline() {
  const extraction = extractRequirements({
    requestId: 'recovery-test-001',
    userInput: ANDROID_EXAMPLE,
  });
  const blueprint = buildArchitectureFromRequirements(extraction);
  const packages = generatePackagesFromBlueprint(blueprint);
  const implStrategy = generateStrategyFromPackages(packages);
  const codePlan = generatePlanFromStrategy(implStrategy);
  return { implStrategy, codePlan };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Recovery Strategy Planner Foundation Validation');
  console.log('==============================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['recovery_strategy_planner'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts recovery_strategy_planner packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const planner = resetDevPulseV2RecoveryStrategyAuthorityForTests();
  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();

  assert(
    '2. Authority exists',
    planner instanceof DevPulseV2RecoveryStrategyAuthority,
    `ownerModule=${DevPulseV2RecoveryStrategyAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('recovery_strategy_planner');
  assert(
    '3. Ownership registry contains recovery_strategy_planner',
    owner.ownerModule === RECOVERY_OWNER_MODULE &&
      DevPulseV2RecoveryStrategyAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Planner starts empty',
    planner.getPlannerState().strategyCount === 0,
    `strategies=${planner.getPlannerState().strategyCount}`,
  );

  const { implStrategy, codePlan } = buildFullPipeline();
  const input = buildRecoveryInputFromCodePlan(
    codePlan,
    implStrategy.phases.map((p) => ({
      phaseId: p.phaseId,
      order: p.order,
      title: p.title,
      rollbackCheckpoint: p.rollbackCheckpoint,
      validationRequirements: p.validationRequirements,
      warnings: p.warnings,
      errors: p.errors,
    })),
  );
  const recovery = generateRecoveryStrategy(input, buildRecoveryDuplicateContextFromBridges(codePlan, implStrategy));
  assert(
    '5. generateRecoveryStrategy works',
    recovery.strategyId.length > 0 && recovery.scenarios.length > 0,
    `scenarios=${recovery.scenarios.length} status=${recovery.status}`,
  );

  const failures = generateFailureResponses(input);
  assert(
    '6. generateFailureResponses works',
    failures.some((s) => s.failureType === 'DEPENDENCY_FAILURE') &&
      failures.some((s) => s.failureType === 'VALIDATION_FAILURE'),
    `count=${failures.length}`,
  );

  const rollbacks = generateRollbackRecommendations(input.phases);
  assert(
    '7. generateRollbackRecommendations works',
    rollbacks.length > 0 &&
      rollbacks.every((r) => r.rollbackRecommendation.includes('recommendation only')),
    rollbacks.map((r) => r.failureType).join(', '),
  );

  const depResponses = generateDependencyFailureResponses('Implement ExpenseModule', ['ExpenseModule']);
  assert(
    '8. generateDependencyFailureResponses works',
    depResponses.length > 0 && depResponses[0].failureType === 'DEPENDENCY_FAILURE',
    depResponses[0].recommendedRecovery.slice(0, 60),
  );

  const valResponses = generateValidationFailureResponses('Implement ExpenseModule', ['Validate expense CRUD']);
  assert(
    '9. generateValidationFailureResponses works',
    valResponses.length > 0 && valResponses[0].failureType === 'VALIDATION_FAILURE',
    valResponses[0].trigger.slice(0, 60),
  );

  const checkpoints = generateRecoveryCheckpoints(input.phases, input.tasks);
  assert(
    '10. generateRecoveryCheckpoints works',
    checkpoints.some((c) => c.failureType === 'RECOVERY_CHECKPOINT'),
    `count=${checkpoints.length}`,
  );

  const summary = summarizeRecoveryStrategy(recovery);
  assert(
    '11. summarizeRecoveryStrategy works',
    summary.includes('Recovery') && summary.includes(recovery.codePlanId),
    summary.slice(0, 80),
  );

  const fromCodePlan = generateRecoveryFromCodePlan(codePlan, implStrategy);
  const codePlanSummary = planner.getCodePlanSummary(codePlan);
  assert(
    '12. Code Plan bridge works',
    fromCodePlan.scenarios.length > 0 &&
      codePlanSummary.includes('Code plan') &&
      assertCodeGenerationPlannerOwnershipUnchanged() &&
      getDevPulseV2Owner('code_generation_planner').ownerModule === PLANNER_OWNER_MODULE,
    `scenarios=${fromCodePlan.scenarios.length}`,
  );

  const fromStrategy = generateRecoveryFromStrategy(implStrategy, codePlan);
  const stratSummary = planner.getStrategySummary(implStrategy);
  assert(
    '13. Strategy bridge works',
    fromStrategy.scenarios.length > 0 &&
      stratSummary.includes('Implementation strategy') &&
      assertImplementationStrategyOwnershipUnchanged() &&
      getDevPulseV2Owner('implementation_strategy_engine').ownerModule === STRATEGY_OWNER_MODULE,
    `scenarios=${fromStrategy.scenarios.length}`,
  );

  const published = planner.publishRecoverySummary(fromStrategy);
  const latest = planner.getLatestRecoverySummary();
  assert(
    '14. Central Brain bridge works',
    published.strategyId === fromStrategy.strategyId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const project = vault.createProject('Expense Tracker', 'Existing ExpenseModule recovery');
  vault.addProjectFact(project.projectId, {
    source: 'SYSTEM',
    label: 'module',
    value: 'ExpenseModule',
    confidence: 'HIGH',
  });
  const recoveryCtx = planner.getRecoveryContext();
  const capSummary = planner.getExistingCapabilitySummary();
  assert(
    '15. Project Vault bridge works',
    recoveryCtx.projectCount >= 1 &&
      recoveryCtx.capabilityLabels.includes('ExpenseModule') &&
      capSummary.includes('ExpenseModule') &&
      assertProjectVaultOwnershipUnchanged() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    capSummary.slice(0, 60),
  );

  const dupContext = buildRecoveryDuplicateContextFromBridges(codePlan, implStrategy);
  const existing = detectExistingCapabilities(dupContext);
  const dupWarnings = detectPotentialDuplicates('ExpenseModule', dupContext);
  assert(
    '16. Duplicate detection works',
    existing.some((c) => c.includes('expensemodule')) && dupWarnings.length > 0,
    `existing=${existing.join('|')} warnings=${dupWarnings.length}`,
  );

  const recoveryWithDup = generateRecoveryStrategy(input, dupContext);
  assert(
    '17. DUPLICATE_RISK warnings generated correctly',
    recoveryWithDup.duplicateRisks.some((r) => r.startsWith(DUPLICATE_RISK_PREFIX)) &&
      recoveryWithDup.scenarios.length > 0,
    `risks=${recoveryWithDup.duplicateRisks.length}`,
  );

  const stored = planner.generateAndStore(codePlan, implStrategy);
  const retrieved = planner.getRecoveryStrategy(stored.strategyId);
  assert(
    '18. Recovery scenarios stored correctly',
    planner.getPlannerState().strategyCount >= 1 &&
      retrieved !== null &&
      retrieved.scenarios.length > 0,
    `stored=${stored.strategyId} scenarios=${retrieved?.scenarios.length}`,
  );

  const reportText = formatRecoveryStrategyReport(
    planner.getPlannerState(),
    planner.listRecoveryStrategies(),
  );
  assert(
    '19. Report generated',
    reportText.includes('Recovery Strategy Planner Report') &&
      planner.formatReport().includes('Recommendation:'),
    `strategies=${planner.getPlannerState().strategyCount}`,
  );

  assert(
    '20. Planner does not generate code',
    DevPulseV2RecoveryStrategyAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '21. Planner does not execute actions',
    DevPulseV2RecoveryStrategyAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '22. Planner does not perform rollback',
    DevPulseV2RecoveryStrategyAuthority.assertDoesNotPerformRollback() &&
      DevPulseV2RecoveryStrategyAuthority.assertDoesNotPerformRecovery(),
    'no rollback or recovery execution methods',
  );

  assert(
    '23. Planner does not modify projects',
    DevPulseV2RecoveryStrategyAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '24. Planner does not become answer authority',
    DevPulseV2RecoveryStrategyAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    RECOVERY_OWNER_MODULE,
  );

  assert(
    '25. Validation Budget Policy still passes',
    DevPulseV2RecoveryStrategyAuthority.assertValidationBudgetCompatible() &&
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
  assert('26. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==============================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(RECOVERY_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('RECOVERY STRATEGY PLANNER FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
