/**
 * DevPulse V2 Code Generation Planner Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { buildArchitectureFromRequirements } from '../src/product-architect/index.js';
import { generatePackagesFromBlueprint } from '../src/build-package-generator/index.js';
import { generateStrategyFromPackages } from '../src/implementation-strategy-engine/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { STRATEGY_OWNER_MODULE } from '../src/implementation-strategy-engine/types.js';
import { GUARD_OWNER_MODULE } from '../src/visible-ui-guard/types.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertImplementationStrategyOwnershipUnchanged,
  assertProjectVaultOwnershipUnchanged,
  assertVisibleUiGuardOwnershipUnchanged,
  buildPlanDuplicateContextFromBridges,
  CLICKABILITY_PROOF_REQUIRED,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  DevPulseV2CodeGenerationPlannerAuthority,
  DUPLICATE_RISK_PREFIX,
  formatCodeGenerationPlanReport,
  generateCodePlan,
  generateFileTargets,
  generateImplementationTasks,
  generateModuleTargets,
  generatePlanFromStrategy,
  generateUiGuardRequirements,
  generateUiRequirements,
  generateValidationTasks,
  PLANNER_OWNER_MODULE,
  PLANNER_PASS_TOKEN,
  resetDevPulseV2CodeGenerationPlannerAuthorityForTests,
  summarizeCodePlan,
  UI_REGISTRATION_REQUIRED,
  validateUiRequirements,
} from '../src/code-generation-planner/index.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { extractRequirements } from '../src/requirement-extractor/index.js';
import { resetDevPulseV2ProjectVaultAuthorityForTests } from '../src/project-vault/index.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';
import type { ImplementationStrategy } from '../src/implementation-strategy-engine/types.js';

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

function buildTestStrategy(): ImplementationStrategy {
  const extraction = extractRequirements({
    requestId: 'plan-test-001',
    userInput: ANDROID_EXAMPLE,
  });
  const blueprint = buildArchitectureFromRequirements(extraction);
  const packages = generatePackagesFromBlueprint(blueprint);
  return generateStrategyFromPackages(packages);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Code Generation Planner Foundation Validation');
  console.log('=============================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['code_generation_planner'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts code_generation_planner packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const planner = resetDevPulseV2CodeGenerationPlannerAuthorityForTests();
  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();

  assert(
    '2. Authority exists',
    planner instanceof DevPulseV2CodeGenerationPlannerAuthority,
    `ownerModule=${DevPulseV2CodeGenerationPlannerAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('code_generation_planner');
  assert(
    '3. Ownership registry contains code_generation_planner',
    owner.ownerModule === PLANNER_OWNER_MODULE &&
      DevPulseV2CodeGenerationPlannerAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Planner starts empty',
    planner.getPlannerState().planCount === 0,
    `plans=${planner.getPlannerState().planCount}`,
  );

  const strategy = buildTestStrategy();
  const plan = generateCodePlan(strategy, buildPlanDuplicateContextFromBridges(strategy));
  assert(
    '5. generateCodePlan works',
    plan.planId.length > 0 && plan.tasks.length > 0,
    `tasks=${plan.tasks.length} status=${plan.status}`,
  );

  const tasks = generateImplementationTasks(strategy);
  assert(
    '6. generateImplementationTasks works',
    tasks.length === strategy.phases.length && tasks.every((t) => t.targetModules.length > 0),
    tasks.map((t) => t.title).join(' | '),
  );

  const samplePhase = strategy.phases[0];
  const validations = generateValidationTasks(samplePhase);
  assert(
    '7. generateValidationTasks works',
    validations.some((v) => v.includes('Verification Loop')),
    validations.slice(0, 3).join('; '),
  );

  const expenseModule = 'ExpenseModule';
  const expenseFiles = generateFileTargets(expenseModule);
  const uiReqs = generateUiRequirements(
    expenseModule,
    expenseFiles,
    'Implement ExpenseModule screen',
    'Build expense list screen with input button',
  );
  assert(
    '8. generateUiRequirements works',
    uiReqs.includes(UI_REGISTRATION_REQUIRED) && uiReqs.includes(CLICKABILITY_PROOF_REQUIRED),
    uiReqs.join(', '),
  );

  const modules = generateModuleTargets(samplePhase);
  assert(
    '9. generateModuleTargets works',
    modules.length > 0,
    modules.join(', '),
  );

  const files = generateFileTargets(modules[0]);
  assert(
    '10. generateFileTargets works',
    files.some((f) => f.includes('src/modules/')) || files.some((f) => f.includes('src/screens/')),
    files.slice(0, 3).join(', '),
  );

  const summary = summarizeCodePlan(plan);
  assert(
    '11. summarizeCodePlan works',
    summary.includes('Plan') && summary.includes(plan.strategyId),
    summary.slice(0, 80),
  );

  const fromStrategy = generatePlanFromStrategy(strategy);
  const stratSummary = planner.getStrategySummary(strategy);
  assert(
    '12. Strategy bridge works',
    fromStrategy.tasks.length > 0 &&
      stratSummary.includes('Strategy') &&
      assertImplementationStrategyOwnershipUnchanged() &&
      getDevPulseV2Owner('implementation_strategy_engine').ownerModule === STRATEGY_OWNER_MODULE,
    `tasks=${fromStrategy.tasks.length}`,
  );

  const published = planner.publishCodePlanSummary(fromStrategy);
  const latest = planner.getLatestCodePlanSummary();
  assert(
    '13. Central Brain bridge works',
    published.planId === fromStrategy.planId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const project = vault.createProject('Expense Tracker', 'Existing ExpenseModule plan');
  vault.addProjectFact(project.projectId, {
    source: 'SYSTEM',
    label: 'module',
    value: 'ExpenseModule',
    confidence: 'HIGH',
  });
  const planCtx = planner.getCodePlanContext();
  const capSummary = planner.getExistingCapabilitySummary();
  assert(
    '14. Project Vault bridge works',
    planCtx.projectCount >= 1 &&
      planCtx.capabilityLabels.includes('ExpenseModule') &&
      capSummary.includes('ExpenseModule') &&
      assertProjectVaultOwnershipUnchanged() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    capSummary.slice(0, 60),
  );

  const guardReqs = generateUiGuardRequirements({
    title: 'Add expense screen with submit button',
    objective: 'Create dialog panel for expense input',
    targetFiles: ['src/screens/add-expense-screen.tsx'],
  });
  const uiValidation = validateUiRequirements(guardReqs);
  assert(
    '15. UI Guard bridge works',
    guardReqs.includes(UI_REGISTRATION_REQUIRED) &&
      guardReqs.includes(CLICKABILITY_PROOF_REQUIRED) &&
      uiValidation.valid &&
      assertVisibleUiGuardOwnershipUnchanged() &&
      getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE,
    guardReqs.join(', '),
  );

  const dupContext = buildPlanDuplicateContextFromBridges(strategy);
  const existing = detectExistingCapabilities(dupContext);
  const dupWarnings = detectPotentialDuplicates('ExpenseModule', dupContext);
  assert(
    '16. Duplicate detection works',
    existing.some((c) => c.includes('expensemodule')) && dupWarnings.length > 0,
    `existing=${existing.join('|')} warnings=${dupWarnings.length}`,
  );

  const planWithDup = generateCodePlan(strategy, dupContext);
  const dupTasks = planWithDup.tasks.filter((t) =>
    t.duplicateRisks.some((r) => r.startsWith(DUPLICATE_RISK_PREFIX)),
  );
  assert(
    '17. DUPLICATE_RISK warnings generated correctly',
    dupTasks.length > 0 &&
      planWithDup.tasks.length > 0 &&
      !planWithDup.tasks.every((t) => t.duplicateRisks.length === 0 && t.targetModules.includes('ExpenseModule') === false),
    `flagged_tasks=${dupTasks.length}`,
  );

  const expenseTask = plan.tasks.find((t) => t.targetModules.some((m) => /expense/i.test(m)));
  assert(
    '18. UI_REGISTRATION_REQUIRED generated correctly',
    expenseTask !== undefined && expenseTask.uiRequirements.includes(UI_REGISTRATION_REQUIRED),
    expenseTask?.uiRequirements.join(', ') ?? 'no expense task',
  );

  assert(
    '19. CLICKABILITY_PROOF_REQUIRED generated correctly',
    expenseTask !== undefined && expenseTask.uiRequirements.includes(CLICKABILITY_PROOF_REQUIRED),
    expenseTask?.uiRequirements.join(', ') ?? 'no expense task',
  );

  const stored = planner.generateAndStore(strategy);
  const retrieved = planner.getPlan(stored.planId);
  assert(
    '20. Plan records stored correctly',
    planner.getPlannerState().planCount >= 1 &&
      retrieved !== null &&
      retrieved.tasks.length > 0,
    `stored=${stored.planId}`,
  );

  const reportText = formatCodeGenerationPlanReport(
    planner.getPlannerState(),
    planner.listPlans(),
  );
  assert(
    '21. Report generated',
    reportText.includes('Code Generation Planner Report') &&
      planner.formatReport().includes('Recommendation:'),
    `plans=${planner.getPlannerState().planCount}`,
  );

  assert(
    '22. Planner does not generate code',
    DevPulseV2CodeGenerationPlannerAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '23. Planner does not execute actions',
    DevPulseV2CodeGenerationPlannerAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '24. Planner does not modify projects',
    DevPulseV2CodeGenerationPlannerAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '25. Planner does not become answer authority',
    DevPulseV2CodeGenerationPlannerAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    PLANNER_OWNER_MODULE,
  );

  assert(
    '26. Validation Budget Policy still passes',
    DevPulseV2CodeGenerationPlannerAuthority.assertValidationBudgetCompatible() &&
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
  assert('27. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=============================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(PLANNER_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('CODE GENERATION PLANNER FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
