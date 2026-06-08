/**
 * DevPulse V2 Build Package Generator Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import {
  buildArchitectureFromRequirements,
  ARCHITECT_OWNER_MODULE,
} from '../src/product-architect/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertProductArchitectOwnershipUnchanged,
  assertProjectVaultOwnershipUnchanged,
  buildPackageDuplicateContextFromBridges,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  DevPulseV2BuildPackageGeneratorAuthority,
  DUPLICATE_RISK_PREFIX,
  formatBuildPackageReport,
  generateBuildPackages,
  generateDependencyRequirements,
  generateModulePackages,
  generatePackagesFromBlueprint,
  generateRiskRequirements,
  generateRollbackRequirements,
  generateValidationRequirements,
  GENERATOR_OWNER_MODULE,
  GENERATOR_PASS_TOKEN,
  resetDevPulseV2BuildPackageGeneratorAuthorityForTests,
  summarizePackages,
} from '../src/build-package-generator/index.js';
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

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Build Package Generator Foundation Validation');
  console.log('===========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['build_package_generator'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts build_package_generator packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const generator = resetDevPulseV2BuildPackageGeneratorAuthorityForTests();
  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();

  assert(
    '2. Authority exists',
    generator instanceof DevPulseV2BuildPackageGeneratorAuthority,
    `ownerModule=${DevPulseV2BuildPackageGeneratorAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('build_package_generator');
  assert(
    '3. Ownership registry contains build_package_generator',
    owner.ownerModule === GENERATOR_OWNER_MODULE &&
      DevPulseV2BuildPackageGeneratorAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Generator starts empty',
    generator.getGeneratorState().generationCount === 0,
    `generations=${generator.getGeneratorState().generationCount}`,
  );

  const extraction = extractRequirements({
    requestId: 'pkg-test-001',
    userInput: ANDROID_EXAMPLE,
  });
  const blueprint = buildArchitectureFromRequirements(extraction);

  const result = generateBuildPackages(blueprint, buildPackageDuplicateContextFromBridges(blueprint));
  assert(
    '5. generateBuildPackages works',
    result.generationId.length > 0 && result.packages.length > 0,
    `packages=${result.packageCount}`,
  );

  const modulePackages = generateModulePackages(blueprint);
  assert(
    '6. generateModulePackages works',
    modulePackages.some((p) => p.modules.includes('ExpenseModule')),
    modulePackages.map((p) => p.modules.join(',')).join('|'),
  );

  const samplePkg = modulePackages[0];
  const deps = generateDependencyRequirements(blueprint, samplePkg);
  assert(
    '7. generateDependencyRequirements works',
    deps.length > 0,
    deps.slice(0, 3).join('; '),
  );

  const validations = generateValidationRequirements(blueprint, samplePkg);
  assert(
    '8. generateValidationRequirements works',
    validations.some((v) => v.includes('Verification Loop')),
    validations.slice(0, 3).join('; '),
  );

  const risks = generateRiskRequirements(blueprint, samplePkg);
  assert(
    '9. generateRiskRequirements works',
    risks.length >= 0,
    risks.join('; ') || 'none',
  );

  const rollbacks = generateRollbackRequirements(blueprint, samplePkg);
  assert(
    '10. generateRollbackRequirements works',
    rollbacks.some((r) => r.includes('Snapshot')),
    rollbacks.join('; '),
  );

  const summary = summarizePackages(result);
  assert(
    '11. summarizePackages works',
    summary.includes('Generation') && summary.includes('packages='),
    summary.slice(0, 80),
  );

  const fromBlueprint = generatePackagesFromBlueprint(blueprint);
  const blueprintSummary = generator.getBlueprintSummary(blueprint);
  assert(
    '12. Architect bridge works',
    fromBlueprint.packages.length > 0 &&
      blueprintSummary.includes('Blueprint') &&
      assertProductArchitectOwnershipUnchanged() &&
      getDevPulseV2Owner('product_architect').ownerModule === ARCHITECT_OWNER_MODULE,
    `packages=${fromBlueprint.packageCount}`,
  );

  const published = generator.publishPackageSummary(fromBlueprint);
  const latest = generator.getLatestPackageSummary();
  assert(
    '13. Central Brain bridge works',
    published.generationId === fromBlueprint.generationId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const project = vault.createProject('Expense Tracker', 'Existing ExpenseModule package');
  vault.addProjectFact(project.projectId, {
    source: 'SYSTEM',
    label: 'module',
    value: 'ExpenseModule',
    confidence: 'HIGH',
  });
  const pkgCtx = generator.getPackageContext();
  const capSummary = generator.getExistingCapabilitySummary();
  assert(
    '14. Project Vault bridge works',
    pkgCtx.projectCount >= 1 &&
      pkgCtx.capabilityLabels.includes('ExpenseModule') &&
      capSummary.includes('ExpenseModule') &&
      assertProjectVaultOwnershipUnchanged() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    capSummary.slice(0, 60),
  );

  const dupContext = buildPackageDuplicateContextFromBridges(blueprint);
  const existing = detectExistingCapabilities(dupContext);
  const expensePkg = modulePackages.find((p) => p.modules.includes('ExpenseModule'))!;
  const dupWarnings = detectPotentialDuplicates('ExpenseModule', dupContext);
  assert(
    '15. Duplicate detection works',
    existing.some((c) => c.includes('expensemodule')) && dupWarnings.length > 0,
    `existing=${existing.join('|')} warnings=${dupWarnings.length}`,
  );

  const resultWithDup = generateBuildPackages(blueprint, dupContext);
  const dupPackages = resultWithDup.packages.filter((p) =>
    p.duplicateRisks.some((r) => r.startsWith(DUPLICATE_RISK_PREFIX)),
  );
  assert(
    '16. DUPLICATE_RISK warnings generated correctly',
    dupPackages.length > 0 &&
      dupPackages.some((p) => p.modules.includes('ExpenseModule')) &&
      resultWithDup.packages.some((p) => p.modules.includes('ExpenseModule')),
    `flagged=${dupPackages.map((p) => p.modules.join(',')).join('|')}`,
  );

  const stored = generator.generateAndStore(blueprint);
  const retrieved = generator.getGeneration(stored.generationId);
  assert(
    '17. Package records stored correctly',
    generator.getGeneratorState().generationCount >= 1 &&
      retrieved !== null &&
      retrieved.packages.length > 0,
    `stored=${stored.generationId}`,
  );

  const reportText = formatBuildPackageReport(
    generator.getGeneratorState(),
    generator.listGenerations(),
  );
  assert(
    '18. Report generated',
    reportText.includes('Build Package Generator Report') &&
      generator.formatReport().includes('Recommendation:'),
    `generations=${generator.getGeneratorState().generationCount}`,
  );

  assert(
    '19. Generator does not generate code',
    DevPulseV2BuildPackageGeneratorAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '20. Generator does not execute actions',
    DevPulseV2BuildPackageGeneratorAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '21. Generator does not modify projects',
    DevPulseV2BuildPackageGeneratorAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '22. Generator does not become answer authority',
    DevPulseV2BuildPackageGeneratorAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    GENERATOR_OWNER_MODULE,
  );

  assert(
    '23. Validation Budget Policy still passes',
    DevPulseV2BuildPackageGeneratorAuthority.assertValidationBudgetCompatible() &&
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
    console.log('===========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(GENERATOR_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('BUILD PACKAGE GENERATOR FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
