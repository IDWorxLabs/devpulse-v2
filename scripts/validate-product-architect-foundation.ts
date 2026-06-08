/**
 * DevPulse V2 Product Architect Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertProjectVaultOwnershipUnchanged,
  assertRequirementExtractorOwnershipUnchanged,
  ARCHITECT_OWNER_MODULE,
  ARCHITECT_PASS_TOKEN,
  buildArchitectureFromRequirements,
  buildDuplicateContextFromBridges,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  DevPulseV2ProductArchitectAuthority,
  DUPLICATE_RISK_PREFIX,
  formatProductArchitectReport,
  generateArchitectureBlueprint,
  generateDataModels,
  generateFlows,
  generateIntegrations,
  generateModules,
  generatePermissions,
  generateScreens,
  resetDevPulseV2ProductArchitectAuthorityForTests,
  summarizeArchitecture,
} from '../src/product-architect/index.js';
import { extractRequirements } from '../src/requirement-extractor/index.js';
import { EXTRACTOR_OWNER_MODULE } from '../src/requirement-extractor/types.js';
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

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Product Architect Foundation Validation');
  console.log('=====================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['product_architect'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts product_architect packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const architect = resetDevPulseV2ProductArchitectAuthorityForTests();
  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();

  assert(
    '2. Product Architect Authority exists',
    architect instanceof DevPulseV2ProductArchitectAuthority,
    `ownerModule=${DevPulseV2ProductArchitectAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('product_architect');
  assert(
    '3. Ownership registry contains product_architect',
    owner.ownerModule === ARCHITECT_OWNER_MODULE &&
      DevPulseV2ProductArchitectAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Architect starts empty',
    architect.getArchitectState().blueprintCount === 0,
    `blueprints=${architect.getArchitectState().blueprintCount}`,
  );

  const extraction = extractRequirements({
    requestId: 'arch-test-001',
    userInput: ANDROID_EXAMPLE,
  });

  const blueprint = generateArchitectureBlueprint(
    {
      requestId: extraction.requestId,
      requirements: extraction.requirements.map((r) => ({
        requirementId: r.requirementId,
        category: r.category,
        value: r.value,
      })),
    },
    buildDuplicateContextFromBridges(),
  );

  assert(
    '5. generateArchitectureBlueprint works',
    blueprint.blueprintId.length > 0 && blueprint.components.length > 0,
    `components=${blueprint.components.length}`,
  );

  const screens = generateScreens(extraction.requirements);
  assert(
    '6. generateScreens works',
    screens.some((s) => s.type === 'SCREEN' && /expense/i.test(s.name)),
    screens.map((s) => s.name).join(', '),
  );

  const flows = generateFlows(extraction.requirements);
  assert(
    '7. generateFlows works',
    flows.some((f) => f.type === 'FLOW'),
    flows.map((f) => f.name).join(', '),
  );

  const modules = generateModules(extraction.requirements);
  assert(
    '8. generateModules works',
    modules.some((m) => m.name === 'ExpenseModule'),
    modules.map((m) => m.name).join(', '),
  );

  const dataModels = generateDataModels(extraction.requirements);
  assert(
    '9. generateDataModels works',
    dataModels.some((d) => d.name === 'Expense'),
    dataModels.map((d) => d.name).join(', '),
  );

  const integrations = generateIntegrations(extraction.requirements);
  assert(
    '10. generateIntegrations works',
    integrations.some((i) => i.type === 'INTEGRATION'),
    integrations.map((i) => i.name).join(', '),
  );

  const permissions = generatePermissions(extraction.requirements);
  assert(
    '11. generatePermissions works',
    permissions.some((p) => p.type === 'PERMISSION'),
    permissions.map((p) => p.name).join(', '),
  );

  const summary = summarizeArchitecture(blueprint);
  assert(
    '12. summarizeArchitecture works',
    summary.includes('Blueprint') && summary.includes(blueprint.requestId),
    summary.slice(0, 80),
  );

  const fromRequirements = buildArchitectureFromRequirements(extraction);
  const reqSummary = architect.getRequirementSummary(extraction);
  assert(
    '13. Requirement bridge works',
    fromRequirements.requestId === extraction.requestId &&
      reqSummary.includes('FEATURE') &&
      assertRequirementExtractorOwnershipUnchanged() &&
      getDevPulseV2Owner('requirement_extractor').ownerModule === EXTRACTOR_OWNER_MODULE,
    `components=${fromRequirements.components.length}`,
  );

  const published = architect.publishArchitectureSummary(fromRequirements);
  const latest = architect.getLatestArchitectureSummary();
  assert(
    '14. Central Brain bridge works',
    published.blueprintId === fromRequirements.blueprintId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const project = vault.createProject('Expense Tracker', 'Existing expense tracking with ExpenseModule');
  vault.addProjectFact(project.projectId, {
    source: 'SYSTEM',
    label: 'module',
    value: 'ExpenseModule',
    confidence: 'HIGH',
  });
  const vaultCtx = architect.getProjectArchitectureContext();
  const capSummary = architect.getExistingCapabilitySummary();
  assert(
    '15. Project Vault bridge works',
    vaultCtx.projectCount >= 1 &&
      vaultCtx.capabilityLabels.includes('ExpenseModule') &&
      capSummary.includes('ExpenseModule') &&
      assertProjectVaultOwnershipUnchanged() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    capSummary.slice(0, 60),
  );

  const dupContext = buildDuplicateContextFromBridges();
  const existing = detectExistingCapabilities(dupContext);
  const expenseModule = modules.find((m) => m.name === 'ExpenseModule')!;
  const dupWarnings = detectPotentialDuplicates(expenseModule, dupContext);
  assert(
    '16. Duplicate detection works',
    existing.some((c) => c.includes('expensemodule')) && dupWarnings.length > 0,
    `existing=${existing.join('|')} warnings=${dupWarnings.length}`,
  );

  const blueprintWithDup = generateArchitectureBlueprint(
    {
      requestId: extraction.requestId,
      requirements: extraction.requirements.map((r) => ({
        requirementId: r.requirementId,
        category: r.category,
        value: r.value,
      })),
    },
    dupContext,
  );
  const dupComponents = blueprintWithDup.components.filter((c) =>
    c.warnings.some((w) => w.startsWith(DUPLICATE_RISK_PREFIX)),
  );
  assert(
    '17. DUPLICATE_RISK warnings generated correctly',
    dupComponents.length > 0 &&
      dupComponents.some((c) => c.name === 'ExpenseModule') &&
      blueprintWithDup.components.some((c) => c.name === 'ExpenseModule'),
    `flagged=${dupComponents.map((c) => c.name).join(', ')}`,
  );

  const stored = architect.generateFromRequirements(extraction);
  const retrieved = architect.getBlueprint(stored.blueprintId);
  assert(
    '18. Blueprint records stored correctly',
    architect.getArchitectState().blueprintCount >= 1 &&
      retrieved !== null &&
      retrieved.components.length > 0,
    `stored=${stored.blueprintId}`,
  );

  const reportText = formatProductArchitectReport(
    architect.getArchitectState(),
    architect.listBlueprints(),
  );
  assert(
    '19. Report generated',
    reportText.includes('Product Architect Report') &&
      architect.formatReport().includes('Recommendation:'),
    `blueprints=${architect.getArchitectState().blueprintCount}`,
  );

  assert(
    '20. Product Architect does not generate code',
    DevPulseV2ProductArchitectAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '21. Product Architect does not execute actions',
    DevPulseV2ProductArchitectAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '22. Product Architect does not modify projects',
    DevPulseV2ProductArchitectAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '23. Product Architect does not become answer authority',
    DevPulseV2ProductArchitectAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    ARCHITECT_OWNER_MODULE,
  );

  assert(
    '24. Validation Budget Policy still passes',
    DevPulseV2ProductArchitectAuthority.assertValidationBudgetCompatible() &&
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
  assert('25. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=====================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(ARCHITECT_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('PRODUCT ARCHITECT FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
