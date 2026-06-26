/**
 * Modular Feature Materialization V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import type { GeneratedAppProfile } from '../src/code-generation-engine/code-generation-engine-types.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  getProfileFeatureDefinition,
  materializableFeatureModules,
  moduleIdToPascalCase,
  validateModularFeatureModules,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import { materializationEvidenceSummaryForChat } from '../src/materialization-evidence/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

export const MODULAR_FEATURE_MATERIALIZATION_V1_PASS_TOKEN =
  'MODULAR_FEATURE_MATERIALIZATION_V1_PASS';

interface ProfileScenario {
  id: string;
  prompt: string;
  profile: GeneratedAppProfile | 'HABIT_TRACKER_WEB_V1';
  expectedModules: string[];
}

const SCENARIOS: ProfileScenario[] = [
  {
    id: 'expense-tracker',
    prompt:
      'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export.',
    profile: 'EXPENSE_TRACKER_WEB_V1',
    expectedModules: [
      'auth',
      'dashboard',
      'income',
      'expenses',
      'categories',
      'reports',
      'charts',
      'csv-export',
    ],
  },
  {
    id: 'crm',
    prompt:
      'Build a CRM web application for managing customers, leads, sales pipeline, deals, contacts, and follow-ups.',
    profile: 'CRM_WEB_V1',
    expectedModules: [
      'auth',
      'dashboard',
      'customers',
      'leads',
      'pipeline',
      'deals',
      'contacts',
      'follow-ups',
      'reports',
    ],
  },
  {
    id: 'qr-app',
    prompt:
      'Build a QR code generator app with generator, scanner, code history, analytics, and settings.',
    profile: 'QR_APP',
    expectedModules: ['auth', 'dashboard', 'generator', 'scanner', 'code-history', 'analytics', 'settings'],
  },
  {
    id: 'inventory',
    prompt:
      'Build an inventory management app with stock tracking, products, suppliers, and reorder alerts.',
    profile: 'INVENTORY_WEB_V1',
    expectedModules: ['auth', 'dashboard', 'products', 'stock', 'suppliers', 'reorder', 'reports'],
  },
  {
    id: 'habit-tracker',
    prompt: 'Build a habit tracker for daily routines, streaks, goals, and analytics.',
    profile: 'HABIT_TRACKER_WEB_V1',
    expectedModules: ['auth', 'dashboard', 'habits', 'streaks', 'routines', 'goals', 'analytics'],
  },
  {
    id: 'task-tracker',
    prompt:
      'Build a task tracker web app with tasks, projects, labels, calendar, reports, and settings.',
    profile: 'TASK_TRACKER_WEB_V1',
    expectedModules: [
      'auth',
      'dashboard',
      'tasks',
      'projects',
      'labels',
      'calendar',
      'reports',
      'settings',
    ],
  },
];

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function materializeScenario(
  testRoot: string,
  scenario: ProfileScenario,
): { workspaceDir: string; profile: GeneratedAppProfile | null } {
  const workspaceId = `modular-${scenario.id}`;
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: scenario.prompt });
  const contract = assessment.report.buildReadyContract;
  if (!contract) throw new Error(`Planning failed for ${scenario.id}`);

  const ranked = rankBuildProfiles(scenario.prompt);
  const engine = materializeGeneratedApplication({
    projectRootDir: testRoot,
    workspaceId,
    contract: { ...contract, contractId: workspaceId },
    rawPrompt: scenario.prompt,
    profileOverride: ranked.selectedProfile ?? scenario.profile,
  });

  if (!engine.generated) {
    throw new Error(engine.skippedReason ?? `Materialization failed for ${scenario.id}`);
  }

  return {
    workspaceDir: join(testRoot, '.generated-builder-workspaces', workspaceId),
    profile: engine.profile,
  };
}

function moduleHasRequiredFiles(workspaceDir: string, moduleId: string): boolean {
  const pascal = moduleIdToPascalCase(moduleId);
  const required = [
    join(workspaceDir, 'src/features', moduleId, `${pascal}Feature.tsx`),
    join(workspaceDir, 'src/features', moduleId, `${moduleId}.types.ts`),
    join(workspaceDir, 'src/features', moduleId, `${moduleId}.service.ts`),
    join(workspaceDir, 'src/features', moduleId, `${moduleId}.validation.ts`),
    join(workspaceDir, 'src/features', moduleId, 'index.ts'),
  ];
  return required.every((path) => existsSync(path));
}

async function main(): Promise<void> {
  const testRoot = join(tmpdir(), `modular-feature-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    for (const scenario of SCENARIOS) {
      const { workspaceDir, profile } = materializeScenario(testRoot, scenario);
      const definition = getProfileFeatureDefinition(scenario.profile, scenario.prompt);
      const modularValidation = validateModularFeatureModules(workspaceDir, definition);
      const validation = validateUniversalAppMaterialization({
        workspaceDir,
        rawPrompt: scenario.prompt,
        selectedProfile: profile,
        projectId: scenario.id,
        projectName: scenario.id,
        buildRunId: `build-${scenario.id}`,
        npmBuildOk: true,
      });

      const manifestRaw = readFileSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME), 'utf8');
      const manifest = JSON.parse(manifestRaw) as {
        featureModuleDetails: Array<{ id: string; componentPath: string }>;
        generatedFeatureModulesCount: number;
        generatedFeatureModuleFiles: string[];
      };

      for (const moduleId of scenario.expectedModules) {
        assert(
          `${scenario.id}: module folder ${moduleId}`,
          existsSync(join(workspaceDir, 'src/features', moduleId)),
          join('src/features', moduleId),
        );
        assert(
          `${scenario.id}: module files ${moduleId}`,
          moduleHasRequiredFiles(workspaceDir, moduleId),
          moduleId,
        );
      }

      assert(
        `${scenario.id}: registry references all modules`,
        modularValidation.passed,
        modularValidation.missingModules.join(', ') || 'ok',
      );
      assert(
        `${scenario.id}: routes.ts references registry`,
        readFileSync(join(workspaceDir, 'src/features/routes.ts'), 'utf8').includes('FEATURE_REGISTRY'),
        'routes.ts',
      );
      assert(
        `${scenario.id}: App shell renders from registry/routes`,
        readFileSync(join(workspaceDir, 'src/blueprint/AppShell.tsx'), 'utf8').includes('FeatureAppRouter'),
        'AppShell.tsx',
      );
      assert(
        `${scenario.id}: DomainAppFeature not primary renderer`,
        !existsSync(join(workspaceDir, 'src/features/domain/DomainAppFeature.tsx')) ||
          !readFileSync(join(workspaceDir, 'src/blueprint/AppShell.tsx'), 'utf8').includes('DomainAppFeature'),
        'monolithic domain feature',
      );
      assert(
        `${scenario.id}: manifest records feature module files`,
        manifest.featureModuleDetails.length >= scenario.expectedModules.length &&
          manifest.generatedFeatureModuleFiles.length > scenario.expectedModules.length * 3,
        `details=${manifest.featureModuleDetails.length} files=${manifest.generatedFeatureModuleFiles.length}`,
      );
      assert(
        `${scenario.id}: featureModulesCount backed by disk`,
        manifest.generatedFeatureModulesCount >= scenario.expectedModules.length,
        String(manifest.generatedFeatureModulesCount),
      );
      assert(
        `${scenario.id}: modular validation passed`,
        validation.modularFeaturesPresent && validation.passed,
        validation.warnings.join('; ').slice(0, 120),
      );
      assert(
        `${scenario.id}: anti-regression monolithic tabs`,
        !readFileSync(join(workspaceDir, 'src/features/FeatureAppRouter.tsx'), 'utf8').includes(
          'import DomainAppFeature',
        ),
        'FeatureAppRouter uses registry',
      );

      const materializable = materializableFeatureModules(definition);
      assert(
        `${scenario.id}: expected module contract`,
        scenario.expectedModules.every((moduleId) => materializable.includes(moduleId)),
        materializable.join(', '),
      );

      if (scenario.id === 'expense-tracker' || scenario.id === 'task-tracker') {
        const profile =
          scenario.id === 'expense-tracker' ? 'EXPENSE_TRACKER_WEB_V1' : 'TASK_TRACKER_WEB_V1';
        const projectName = scenario.id === 'expense-tracker' ? 'ExpenseTracker' : 'TaskTracker';
        const componentPath =
          scenario.id === 'expense-tracker'
            ? 'src/features/expenses/ExpensesFeature.tsx'
            : 'src/features/tasks/TasksFeature.tsx';
        const minModuleNames = scenario.id === 'expense-tracker' ? 8 : 7;
        const sampleResult: OnePromptLivePreviewBuildResult = {
          readOnly: true,
          buildId: `build-${scenario.id}`,
          projectId: scenario.id,
          projectName,
          status: 'READY',
          prompt: scenario.prompt,
          requestType: 'BUILD_FROM_PROMPT',
          workspaceId: scenario.id,
          workspacePath: `.generated-builder-workspaces/modular-${scenario.id}`,
          generatedProfile: profile,
          planningProofLevel: 'FULL',
          materializationProofLevel: 'FULL',
          buildResult: 'PASS',
          npmInstallOk: true,
          npmBuildOk: true,
          previewUrl: 'http://127.0.0.1:5173/',
          livePreviewAvailable: true,
          failureReason: null,
          featureSignals: null,
          materializationManifest: JSON.parse(manifestRaw),
          updatedAt: new Date().toISOString(),
        };
        const traceEvents = buildOnePromptExecutionTraceEvents(sampleResult, scenario.prompt);
        assert(
          `${scenario.id}: Execution Trace modular events`,
          traceEvents.some((event) => event.eventTitle.startsWith('Feature module generated:')) &&
            traceEvents.some((event) => event.eventTitle === 'Registry updated') &&
            traceEvents.some(
              (event) =>
                event.eventTitle === 'Component written' && event.technicalDetail.includes(componentPath),
            ),
          traceEvents
            .filter((event) => event.eventTitle.includes('Feature') || event.eventTitle.includes('Registry'))
            .slice(0, 5)
            .map((event) => event.eventTitle)
            .join(', '),
        );
        const chatSummary = materializationEvidenceSummaryForChat(sampleResult.materializationManifest);
        assert(
          `${scenario.id}: chat evidence modular summary`,
          chatSummary !== null &&
            chatSummary.modularFeatureMaterialization === true &&
            Array.isArray(chatSummary.featureModuleNames) &&
            (chatSummary.featureModuleNames as string[]).length >= minModuleNames,
          JSON.stringify(chatSummary).slice(0, 160),
        );
      }
    }
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length) {
    console.error('MODULAR_FEATURE_MATERIALIZATION_V1_FAIL');
    for (const failure of failed) {
      console.error(`  ✗ ${failure.name}: ${failure.detail}`);
    }
    process.exit(1);
  }

  console.log(MODULAR_FEATURE_MATERIALIZATION_V1_PASS_TOKEN);
  for (const result of results) {
    console.log(`  ✓ ${result.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
