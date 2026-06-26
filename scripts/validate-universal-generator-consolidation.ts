/**
 * Universal Generator Consolidation V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';

export const UNIVERSAL_GENERATOR_CONSOLIDATION_V1_PASS_TOKEN =
  'UNIVERSAL_GENERATOR_CONSOLIDATION_V1_PASS';

interface ProfileScenario {
  id: string;
  profile: GeneratedAppProfile | 'HABIT_TRACKER_WEB_V1' | 'GENERIC_CUSTOM_APP_V1';
  prompt: string;
}

const SUPPORTED_PROFILES: ProfileScenario[] = [
  {
    id: 'expense-tracker',
    profile: 'EXPENSE_TRACKER_WEB_V1',
    prompt:
      'Build ExpenseTracker with expenses, income, categories, reports, charts, and CSV export.',
  },
  {
    id: 'finance-tracker',
    profile: 'FINANCE_TRACKER_WEB_V1',
    prompt: 'Build a finance tracker with transactions, categories, reports, charts, and CSV export.',
  },
  {
    id: 'crm',
    profile: 'CRM_WEB_V1',
    prompt: 'Build a CRM for customers, leads, pipeline, deals, contacts, and follow-ups.',
  },
  {
    id: 'task-tracker',
    profile: 'TASK_TRACKER_WEB_V1',
    prompt:
      'Build a task tracker web app with tasks, projects, labels, calendar, reports, and settings.',
  },
  {
    id: 'project-management',
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    prompt: 'Build a project management app with projects, tasks, team, timeline, and reports.',
  },
  {
    id: 'qr-app',
    profile: 'QR_APP',
    prompt: 'Build a QR app with generator, scanner, code history, analytics, and settings.',
  },
  {
    id: 'inventory',
    profile: 'INVENTORY_WEB_V1',
    prompt: 'Build inventory management with products, stock, suppliers, reorder, and reports.',
  },
  {
    id: 'booking',
    profile: 'BOOKING_WEB_V1',
    prompt: 'Build a booking app with appointments, calendar, customers, availability, and reports.',
  },
  {
    id: 'habit-tracker',
    profile: 'HABIT_TRACKER_WEB_V1',
    prompt: 'Build a habit tracker with habits, streaks, routines, goals, and analytics.',
  },
  {
    id: 'generic-custom',
    profile: 'GENERIC_CUSTOM_APP_V1',
    prompt:
      'Build a custom notes and records workspace app with dashboard, records, settings, and notes management features.',
  },
];

const TASK_TRACKER_MODULES = [
  'auth',
  'dashboard',
  'tasks',
  'projects',
  'labels',
  'calendar',
  'reports',
  'settings',
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

function materializeProfile(
  testRoot: string,
  scenario: ProfileScenario,
): { workspaceDir: string; profile: GeneratedAppProfile | null; generatedFiles: string[] } {
  const workspaceId = `consolidation-${scenario.id}`;
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: scenario.prompt });
  const contract = assessment.report.buildReadyContract;
  if (!contract) throw new Error(`Planning failed for ${scenario.id}`);

  const engine = materializeGeneratedApplication({
    projectRootDir: testRoot,
    workspaceId,
    contract: { ...contract, contractId: workspaceId },
    rawPrompt: scenario.prompt,
    profileOverride: scenario.profile as GeneratedAppProfile,
  });

  if (!engine.generated) {
    throw new Error(engine.skippedReason ?? `Materialization failed for ${scenario.id}`);
  }

  return {
    workspaceDir: join(testRoot, '.generated-builder-workspaces', workspaceId),
    profile: engine.profile,
    generatedFiles: engine.generatedFiles,
  };
}

function readManifest(workspaceDir: string): GeneratedAppManifest {
  return JSON.parse(
    readFileSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME), 'utf8'),
  ) as GeneratedAppManifest;
}

function assertUniversalConsolidation(
  scenario: ProfileScenario,
  workspaceDir: string,
  profile: GeneratedAppProfile | null,
): GeneratedAppManifest {
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
  const manifest = readManifest(workspaceDir);
  const shellSource = readFileSync(join(workspaceDir, 'src/blueprint/AppShell.tsx'), 'utf8');
  const packageJson = JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8')) as {
    devpulseGeneratedApp?: string;
    devpulseModularFeatureMaterialization?: string;
  };
  const buildManifest = JSON.parse(readFileSync(join(workspaceDir, 'build-manifest.json'), 'utf8')) as {
    materializationSource?: string;
  };

  assert(
    `${scenario.id}: uses universal modular generator`,
    packageJson.devpulseModularFeatureMaterialization === 'v1' &&
      buildManifest.materializationSource === 'modular-feature-materialization-v1',
    `${packageJson.devpulseModularFeatureMaterialization} / ${buildManifest.materializationSource}`,
  );
  assert(
    `${scenario.id}: no legacy task-tracker-v1 package marker`,
    packageJson.devpulseGeneratedApp !== 'task-tracker-v1',
    packageJson.devpulseGeneratedApp ?? 'missing',
  );
  assert(
    `${scenario.id}: FeatureAppRouter is primary renderer`,
    shellSource.includes('FeatureAppRouter') && !shellSource.includes('TaskTrackerFeature'),
    'AppShell.tsx',
  );
  assert(
    `${scenario.id}: TaskTrackerFeature.tsx not emitted`,
    !existsSync(join(workspaceDir, 'src/features/task-tracker/TaskTrackerFeature.tsx')),
    'legacy monolith path',
  );
  assert(
    `${scenario.id}: modular validation passed`,
    modularValidation.passed && validation.modularFeaturesPresent,
    modularValidation.missingModuleFiles.join(', ') || 'ok',
  );
  assert(
    `${scenario.id}: manifest featureModuleDetails populated`,
    manifest.featureModuleDetails.length >= materializableFeatureModules(definition).length,
    String(manifest.featureModuleDetails.length),
  );
  assert(
    `${scenario.id}: manifest evidence shape complete`,
    manifest.generatedFeatureModulesCount > 0 &&
      manifest.generatedFeatureModuleFiles.length > 0 &&
      manifest.featureModuleDirectories.length > 0,
    `modules=${manifest.generatedFeatureModulesCount} files=${manifest.generatedFeatureModuleFiles.length}`,
  );
  assert(
    `${scenario.id}: no generic PM fallback`,
    validation.genericFallbackRejected,
    validation.forbiddenTermsFound.join(', '),
  );
  const materializationOk =
    scenario.profile === 'GENERIC_CUSTOM_APP_V1'
      ? validation.modularFeaturesPresent &&
        validation.blueprintShellPresent &&
        validation.genericFallbackRejected
      : validation.passed;
  assert(
    `${scenario.id}: universal materialization validation passed`,
    materializationOk,
    validation.warnings.join('; ').slice(0, 120),
  );

  return manifest;
}

async function main(): Promise<void> {
  const testRoot = join(tmpdir(), `universal-consolidation-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    for (const scenario of SUPPORTED_PROFILES) {
      const { workspaceDir, profile, generatedFiles } = materializeProfile(testRoot, scenario);
      assert(
        `${scenario.id}: materialized through single engine`,
        profile === scenario.profile && generatedFiles.includes('src/features/FeatureAppRouter.tsx'),
        `${profile} files=${generatedFiles.length}`,
      );
      assertUniversalConsolidation(scenario, workspaceDir, profile);
    }

    const taskScenario = SUPPORTED_PROFILES.find((scenario) => scenario.id === 'task-tracker')!;
    const { workspaceDir, profile } = materializeProfile(testRoot, {
      ...taskScenario,
      id: 'task-tracker-deep',
    });
    const manifest = readManifest(workspaceDir);

    for (const moduleId of TASK_TRACKER_MODULES) {
      const pascal = moduleIdToPascalCase(moduleId);
      assert(
        `task-tracker: module folder ${moduleId}`,
        existsSync(join(workspaceDir, 'src/features', moduleId)),
        moduleId,
      );
      assert(
        `task-tracker: module files ${moduleId}`,
        existsSync(join(workspaceDir, 'src/features', moduleId, `${pascal}Feature.tsx`)) &&
          existsSync(join(workspaceDir, 'src/features', moduleId, `${moduleId}.types.ts`)) &&
          existsSync(join(workspaceDir, 'src/features', moduleId, `${moduleId}.service.ts`)) &&
          existsSync(join(workspaceDir, 'src/features', moduleId, `${moduleId}.validation.ts`)) &&
          existsSync(join(workspaceDir, 'src/features', moduleId, 'index.ts')),
        moduleId,
      );
    }

    assert(
      'task-tracker: registry references all modules',
      TASK_TRACKER_MODULES.every((moduleId) =>
        readFileSync(join(workspaceDir, 'src/features/registry.ts'), 'utf8').includes(`id: '${moduleId}'`),
      ),
      TASK_TRACKER_MODULES.join(', '),
    );
    assert(
      'task-tracker: routes from registry',
      readFileSync(join(workspaceDir, 'src/features/routes.ts'), 'utf8').includes('FEATURE_REGISTRY'),
      'routes.ts',
    );

    const sampleResult: OnePromptLivePreviewBuildResult = {
      readOnly: true,
      buildId: 'build-task-tracker-deep',
      projectId: 'task-tracker-deep',
      projectName: 'TaskTracker',
      status: 'READY',
      prompt: taskScenario.prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: 'task-tracker-deep',
      workspacePath: '.generated-builder-workspaces/consolidation-task-tracker-deep',
      generatedProfile: 'TASK_TRACKER_WEB_V1',
      planningProofLevel: 'FULL',
      materializationProofLevel: 'FULL',
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: 'http://127.0.0.1:5173/',
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: manifest,
      updatedAt: new Date().toISOString(),
    };

    const traceEvents = buildOnePromptExecutionTraceEvents(sampleResult, taskScenario.prompt);
    assert(
      'task-tracker: execution trace per-module events',
      traceEvents.some((event) => event.eventTitle.startsWith('Feature module generated: Tasks')) &&
        traceEvents.some(
          (event) =>
            event.eventTitle === 'Component written' &&
            event.technicalDetail.includes('src/features/tasks/TasksFeature.tsx'),
        ),
      traceEvents
        .filter((event) => event.eventTitle.includes('Feature') || event.eventTitle.includes('Component'))
        .slice(0, 4)
        .map((event) => event.eventTitle)
        .join(', '),
    );

    const chatSummary = materializationEvidenceSummaryForChat(manifest);
    assert(
      'task-tracker: chat modular manifest evidence',
      chatSummary !== null &&
        chatSummary.modularFeatureMaterialization === true &&
        (chatSummary.featureModuleNames as string[]).includes('Tasks'),
      JSON.stringify(chatSummary).slice(0, 160),
    );

    assert(
      'authority: no profile-specific primary generator marker in workspace',
      !existsSync(join(workspaceDir, 'src/features/domain/DomainAppFeature.tsx')),
      'monolithic domain feature',
    );
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length) {
    console.error('UNIVERSAL_GENERATOR_CONSOLIDATION_V1_FAIL');
    for (const failure of failed) {
      console.error(`  ✗ ${failure.name}: ${failure.detail}`);
    }
    process.exit(1);
  }

  console.log(UNIVERSAL_GENERATOR_CONSOLIDATION_V1_PASS_TOKEN);
  for (const result of results) {
    console.log(`  ✓ ${result.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
