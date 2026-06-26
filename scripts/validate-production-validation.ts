/**
 * Production Validation V1 — full install/build/preview/verify matrix for all supported profiles.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { GeneratedAppProfile } from '../src/code-generation-engine/code-generation-engine-types.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  assertProductionValidationAntiRegression,
  buildProductionValidationMatrixRow,
  buildProductionValidationTraceEvents,
  formatProductionValidationMatrix,
  PRODUCTION_VALIDATION_V1_PASS_TOKEN,
  productionValidationTraceTitles,
  runProductionValidation,
} from '../src/production-validation/index.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/index.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';

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
    prompt: 'Build a custom notes and records workspace app with dashboard and settings.',
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

async function main(): Promise<void> {
  const testRoot = join(tmpdir(), `production-validation-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  console.log('');
  console.log('Production Validation V1 — Supported Profile Matrix');
  console.log('==================================================');
  console.log('');

  const matrixRows = [];

  try {
    for (const scenario of SUPPORTED_PROFILES) {
      const evidence = await runProductionValidation({
        projectRootDir: testRoot,
        workspaceId: `prod-${scenario.id}`,
        profile: scenario.profile,
        prompt: scenario.prompt,
      });

      const row = buildProductionValidationMatrixRow(evidence);
      matrixRows.push(row);

      assert(`${scenario.profile}: production validation PASS`, evidence.productionValidationStatus === 'PASS', evidence.failureReasons.join('; ') || 'ok');
      assert(`${scenario.profile}: manifest productionValidationStatus`, (() => {
        const manifestPath = join(evidence.workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
        if (!existsSync(manifestPath)) return false;
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as GeneratedAppManifest;
        return (
          manifest.productionValidationStatus === 'PASS' &&
          manifest.previewVerified === true &&
          manifest.modularRoutesVerified === true &&
          manifest.profileSpecificUiVerified === true &&
          manifest.featureModuleDetails.length > 0
        );
      })(), 'manifest fields');

      const antiRegression = assertProductionValidationAntiRegression(evidence);
      assert(`${scenario.profile}: anti-regression`, antiRegression.length === 0, antiRegression.join('; ') || 'ok');

      const traceEvents = buildProductionValidationTraceEvents(evidence, `prod-${scenario.id}`);
      for (const title of productionValidationTraceTitles()) {
        assert(
          `${scenario.profile}: trace "${title}"`,
          traceEvents.some((event) => event.eventTitle === title && event.status !== 'Blocked'),
          traceEvents.find((e) => e.eventTitle === title)?.status ?? 'missing',
        );
      }

      const manifestPath = join(evidence.workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as GeneratedAppManifest;
      const sampleResult: OnePromptLivePreviewBuildResult = {
        readOnly: true,
        buildId: `prod-${scenario.id}`,
        projectId: scenario.id,
        projectName: scenario.id,
        status: evidence.productionValidationStatus === 'PASS' ? 'READY' : 'FAILED',
        prompt: scenario.prompt,
        requestType: 'BUILD_FROM_PROMPT',
        workspaceId: scenario.id,
        workspacePath: evidence.workspaceDir.replace(/\\/g, '/'),
        generatedProfile: scenario.profile as GeneratedAppProfile,
        planningProofLevel: 'FULL',
        materializationProofLevel: 'FULL',
        buildResult: evidence.productionValidationStatus === 'PASS' ? 'PASS' : 'FAIL',
        npmInstallOk: evidence.installStatus === 'PASS',
        npmBuildOk: evidence.buildStatus === 'PASS',
        previewUrl: evidence.previewUrl,
        livePreviewAvailable: evidence.previewVerified,
        failureReason: evidence.failureReasons[0] ?? null,
        featureSignals: null,
        materializationManifest: manifest,
        updatedAt: evidence.validatedAt,
      };
      const buildTrace = buildOnePromptExecutionTraceEvents(sampleResult, scenario.prompt);
      assert(
        `${scenario.profile}: build trace includes production validation`,
        buildTrace.some((event) => event.eventTitle === 'Production validation started'),
        buildTrace.filter((e) => e.metadata?.productionValidation).slice(0, 3).map((e) => e.eventTitle).join(', '),
      );
    }
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  console.log(formatProductionValidationMatrix(matrixRows));
  console.log('');

  const failed = results.filter((result) => !result.passed);
  if (failed.length) {
    console.error('PRODUCTION_VALIDATION_V1_FAIL');
    for (const failure of failed) {
      console.error(`  ✗ ${failure.name}: ${failure.detail}`);
    }
    process.exit(1);
  }

  console.log(PRODUCTION_VALIDATION_V1_PASS_TOKEN);
  for (const result of results.filter((r) => r.name.includes('production validation PASS'))) {
    console.log(`  ✓ ${result.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
