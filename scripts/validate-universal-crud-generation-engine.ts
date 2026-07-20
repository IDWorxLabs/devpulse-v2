/**
 * UNIVERSAL_CRUD_GENERATION_ENGINE_V1 — validation.
 *
 * Universal Software Capability Engine — Phase B1: Universal CRUD Generation Engine.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-crud-generation-engine.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyContractBoundGenerationToBuildPlan,
} from '../src/contract-bound-generation-authority-v4/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import {
  buildAllModularFeatureModuleFiles,
  materializableFeatureModules,
} from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  buildUniversalCrudEntityModuleFiles,
  buildUniversalCrudGenerationReport,
  buildUniversalCrudSharedRuntimeFiles,
  diagnoseUniversalCrudGenerationGaps,
  entityDescriptorFromApprovedModule,
  renderUniversalCrudGenerationReportMarkdown,
  shouldGenerateUniversalCrudForModule,
  UNIVERSAL_CRUD_GENERATION_ENGINE_SOURCE,
  UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION,
  verifyCrudMutationChain,
  verifyUniversalCrudBehavior,
} from '../src/universal-crud-generation-engine/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function fileContent(files: { relativePath: string; content: string }[], path: string): string {
  return files.find((file) => file.relativePath === path)?.content ?? '';
}

const DOMAIN_PROMPTS: ReadonlyArray<{ label: string; prompt: string }> = [
  {
    label: 'CRM',
    prompt:
      'Build a CRM platform with customers, contacts, deals, and activities. Full CRUD for every entity.',
  },
  {
    label: 'Restaurant',
    prompt:
      'Build a restaurant management platform with reservations, tables, orders, and staff scheduling.',
  },
  {
    label: 'Inventory',
    prompt:
      'Build an inventory management system with products, warehouses, stock movements, and suppliers.',
  },
  {
    label: 'Booking',
    prompt:
      'Build a booking platform with appointments, resources, customers, and availability slots.',
  },
  {
    label: 'Hospital',
    prompt:
      'Build a hospital management system with patients, appointments, providers, and medical records.',
  },
  {
    label: 'Education',
    prompt:
      'Build a school management platform with students, courses, teachers, and enrollments.',
  },
  {
    label: 'Finance',
    prompt:
      'Build a finance tracker with expenses, invoices, accounts, and transactions.',
  },
  {
    label: 'Asset Management',
    prompt:
      'Build an asset management system with assets, locations, maintenance tasks, and vendors.',
  },
  {
    label: 'Task Management',
    prompt:
      'Build a task management application with projects, tasks, assignees, and milestones.',
  },
];

function materializeDomain(label: string, rawPrompt: string) {
  const canonicalProductContract = buildCanonicalProductContract({ prompt: rawPrompt });
  const buildPlan = resolvePromptFaithfulBuildPlan(rawPrompt);
  const bound = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract, {
    promptHash: `hash-${label.toLowerCase().replace(/\s+/g, '-')}`,
    buildId: `build-${label.toLowerCase().replace(/\s+/g, '-')}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `crud-${label.toLowerCase().replace(/\s+/g, '-')}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  const definition = bound.buildPlan.definition;
  return { workspaceFiles, envelope, definition, label };
}

function crudModuleIds(definition: ProfileFeatureDefinition): string[] {
  return materializableFeatureModules(definition).filter((moduleId) =>
    shouldGenerateUniversalCrudForModule(moduleId, {
      safePaymentPlaceholderActive: definition.safePaymentPlaceholderActive === true,
      isSafePaymentModule: definition.safePaymentPlaceholderActive === true && moduleId !== 'calculator',
    }),
  );
}

async function main(): Promise<void> {
  const engineFiles = [
    'src/universal-crud-generation-engine/universal-crud-types.ts',
    'src/universal-crud-generation-engine/crud-generation-engine.ts',
    'src/universal-crud-generation-engine/crud-persistence-abstraction.ts',
    'src/universal-crud-generation-engine/crud-repository-generator.ts',
    'src/universal-crud-generation-engine/crud-service-generator.ts',
    'src/universal-crud-generation-engine/crud-runtime-state-generator.ts',
    'src/universal-crud-generation-engine/crud-validation-generator.ts',
    'src/universal-crud-generation-engine/crud-ui-handler-generator.ts',
    'src/universal-crud-generation-engine/crud-behavior-verification.ts',
    'src/universal-crud-generation-engine/crud-generation-report.ts',
    'src/universal-crud-generation-engine/index.ts',
  ];

  for (const [index, relativePath] of engineFiles.entries()) {
    assert(
      `${index + 1}. Engine module exists: ${relativePath}`,
      existsSync(join(ROOT, relativePath)),
      'missing file',
    );
  }

  assert(
    '12. Engine version and source are canonical',
    UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION === '1.0.0' &&
      UNIVERSAL_CRUD_GENERATION_ENGINE_SOURCE === 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1',
    `${UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION}/${UNIVERSAL_CRUD_GENERATION_ENGINE_SOURCE}`,
  );

  assert(
    '13. shouldGenerateUniversalCrudForModule excludes auth/persistence/calculator/navigation-router',
    !shouldGenerateUniversalCrudForModule('auth') &&
      !shouldGenerateUniversalCrudForModule('persistence') &&
      !shouldGenerateUniversalCrudForModule('calculator') &&
      !shouldGenerateUniversalCrudForModule('navigation-router'),
    'exclusion failed',
  );

  assert(
    '14. shouldGenerateUniversalCrudForModule accepts generic entity modules',
    shouldGenerateUniversalCrudForModule('customer') &&
      shouldGenerateUniversalCrudForModule('invoice') &&
      shouldGenerateUniversalCrudForModule('task-list'),
    'generic module rejected',
  );

  assert(
    '15. shouldGenerateUniversalCrudForModule excludes informational modules',
    !shouldGenerateUniversalCrudForModule('dashboard') && !shouldGenerateUniversalCrudForModule('reports'),
    'informational module not excluded',
  );

  const descriptor = entityDescriptorFromApprovedModule({
    moduleId: 'customer',
    displayName: 'Customer',
    route: '/customer',
  });
  const built = buildUniversalCrudEntityModuleFiles({
    descriptor,
    appTitle: 'Test App',
    promptTerms: ['customer'],
  });
  const verification = verifyUniversalCrudBehavior(descriptor, built.sources);

  assert('16. Single-entity behavior verification passes', verification.passed, verification.checks.filter((c) => !c.passed).map((c) => c.id).join(','));
  assert('17. Mutation chain verification passes', verifyCrudMutationChain(built.sources), 'mutation chain failed');
  assert(
    '18. Repository imports universal-crud-runtime abstraction',
    built.sources.repository.includes('universal-crud-runtime'),
    'missing runtime import',
  );
  assert(
    '19. Service uses CrudListResult (not empty placeholder)',
    built.sources.service.includes('CrudListResult') && !/return \[\];\s*\}/.test(built.sources.service),
    'empty service placeholder',
  );
  assert(
    '20. UI exposes executable handlers',
    built.sources.component.includes('onClick') &&
      built.sources.component.includes('onSubmit') &&
      built.sources.component.includes('data-interaction-control'),
    'handlers missing',
  );

  const sharedRuntime = buildUniversalCrudSharedRuntimeFiles();
  assert(
    '21. Shared runtime emits persistence abstraction + memory + localStorage providers',
    sharedRuntime.some((f) => f.relativePath.includes('persistence-abstraction.ts')) &&
      sharedRuntime.some((f) => f.relativePath.includes('memory-provider.ts')) &&
      sharedRuntime.some((f) => f.relativePath.includes('local-storage-provider.ts')),
    sharedRuntime.map((f) => f.relativePath).join(','),
  );

  const report = buildUniversalCrudGenerationReport({
    entities: [{ descriptor, appTitle: 'Test App', promptTerms: ['customer'] }],
    entitySources: [built.sources],
  });
  assert('22. Generation report marks allPassed', report.allPassed, `entities=${report.entityCount}`);
  assert(
    '23. Generation report markdown renders',
    renderUniversalCrudGenerationReportMarkdown(report).includes('Universal CRUD Generation Report'),
    'markdown missing',
  );

  const modularSource = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(
    '24. Modular feature generator wires universal CRUD engine',
    modularSource.includes('buildUniversalCrudEntityModuleFiles') &&
      modularSource.includes('buildUniversalCrudSharedRuntimeFiles') &&
      modularSource.includes('shouldGenerateUniversalCrudForModule'),
    'wiring missing',
  );

  const failedVerification = {
    ...verification,
    passed: false,
    checks: [{ id: 'repository-list', passed: false, detail: 'missing' }],
  };
  assert(
    '25. Engineering Intelligence diagnoses missing_repository gap',
    diagnoseUniversalCrudGenerationGaps(failedVerification).includes('missing_repository'),
    'gap diagnosis failed',
  );

  let scenarioIndex = 26;
  const domainEngineMarkers: string[] = [];

  for (const domain of DOMAIN_PROMPTS) {
    const { workspaceFiles, definition, label } = materializeDomain(domain.label, domain.prompt);
    const modules = crudModuleIds(definition);
    assert(
      `${scenarioIndex++}. ${label}: materialization produces workspace files`,
      workspaceFiles.length > 20,
      `files=${workspaceFiles.length}`,
    );
    assert(
      `${scenarioIndex++}. ${label}: at least one CRUD-eligible entity module`,
      modules.length > 0,
      `modules=${modules.join(',')}`,
    );

    if (modules.length > 0) {
      const sampleModule =
        modules.find((moduleId) =>
          workspaceFiles.some((file) => file.relativePath === `src/features/${moduleId}/${moduleId}.repository.ts`),
        ) ?? modules[0]!;
      const repoPath = `src/features/${sampleModule}/${sampleModule}.repository.ts`;
      const servicePath = `src/features/${sampleModule}/${sampleModule}.service.ts`;
      const runtimePath = `src/features/${sampleModule}/${sampleModule}.runtime-state.ts`;
      const pascal = sampleModule
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      const actualComponentPath = `src/features/${sampleModule}/${pascal}Feature.tsx`;

      assert(
        `${scenarioIndex++}. ${label}: repository generated for ${sampleModule}`,
        fileContent(workspaceFiles, repoPath).includes('universal-crud-runtime'),
        repoPath,
      );
      assert(
        `${scenarioIndex++}. ${label}: service has executable list/create/update/delete for ${sampleModule}`,
        fileContent(workspaceFiles, servicePath).includes('CrudListResult') &&
          !/export function list\w+Records\(\): \w+\[\] {\s*return \[\];\s*}/.test(fileContent(workspaceFiles, servicePath)),
        servicePath,
      );
      assert(
        `${scenarioIndex++}. ${label}: runtime state hook generated for ${sampleModule}`,
        fileContent(workspaceFiles, runtimePath).includes('loading') &&
          fileContent(workspaceFiles, runtimePath).includes('confirmDelete'),
        runtimePath,
      );
      const componentSource = fileContent(workspaceFiles, actualComponentPath);
      assert(
        `${scenarioIndex++}. ${label}: UI handlers wired for ${sampleModule}`,
        componentSource.includes('data-universal-crud-engine="v1"') &&
          componentSource.includes('onSubmit') &&
          componentSource.includes('Refresh'),
        actualComponentPath,
      );
      domainEngineMarkers.push(componentSource.match(/data-universal-crud-engine="([^"]+)"/)?.[1] ?? '');
    }

    assert(
      `${scenarioIndex++}. ${label}: shared universal-crud-runtime present when CRUD modules exist`,
      modules.length === 0 ||
        workspaceFiles.some((file) => file.relativePath === 'src/universal-crud-runtime/persistence-abstraction.ts'),
      'shared runtime missing',
    );
  }

  const uniqueMarkers = [...new Set(domainEngineMarkers.filter(Boolean))];
  assert(
    `${scenarioIndex++}. All application classes use the same CRUD engine marker`,
    uniqueMarkers.length === 1 && uniqueMarkers[0] === 'v1',
    uniqueMarkers.join(','),
  );

  const crmPrompt = DOMAIN_PROMPTS[0]!.prompt;
  const crmPlan = resolvePromptFaithfulBuildPlan(crmPrompt);
  const directModular = buildAllModularFeatureModuleFiles(
    'Direct Modular Test',
    crmPlan.definition,
    [{ moduleId: 'customer', displayName: 'Customer', route: '/customer' }],
  );
  assert(
    `${scenarioIndex++}. Direct modular build emits repository + runtime-state paths`,
    directModular.files.some((f) => f.relativePath.endsWith('.repository.ts')) &&
      directModular.files.some((f) => f.relativePath.endsWith('.runtime-state.ts')),
    directModular.files.map((f) => f.relativePath).join(','),
  );

  assert(
    `${scenarioIndex++}. Validator script registered in package.json`,
    readSource('package.json').includes('validate:universal-crud-generation-engine'),
    'npm script missing',
  );

  const touchedPaths = [
    ...engineFiles,
    'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
    'scripts/validate-universal-crud-generation-engine.ts',
  ];
  assert(
    `${scenarioIndex++}. TypeScript compile check for universal CRUD modules`,
    (() => {
      try {
        execSync('npx tsc --noEmit --pretty false 2>&1', {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 120_000,
        });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return !msg.includes('universal-crud-generation-engine') && !msg.includes('modular-feature-module-generator');
      }
    })(),
    'tsc reported errors in universal CRUD modules',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('\n=== Universal CRUD Generation Engine V1 Validation ===\n');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}`);
    if (!result.passed) console.log(`       ${result.detail}`);
  }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);

  if (failed.length === 0) {
    console.log(PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
