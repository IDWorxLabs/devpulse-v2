/**
 * Universal Prompt-to-App Materialization V1 — validation.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import type { GeneratedAppProfile } from '../src/code-generation-engine/code-generation-engine-types.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  UNIVERSAL_PROMPT_TO_APP_MATERIALIZATION_V1_PASS_TOKEN,
  validateUniversalAppMaterialization,
} from '../src/universal-prompt-to-app-materialization/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Scenario {
  id: string;
  prompt: string;
  expectedProfile: GeneratedAppProfile | 'HABIT_TRACKER_WEB_V1' | 'GENERIC_CUSTOM_APP_V1';
  requiredTerms: string[];
  forbiddenTerms: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'A-expense-tracker',
    prompt:
      'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, income, expenses, balance, spending reports, charts, and CSV export. Begin build execution now.',
    expectedProfile: 'EXPENSE_TRACKER_WEB_V1',
    requiredTerms: ['expense', 'income', 'balance', 'categories', 'reports', 'chart', 'csv'],
    forbiddenTerms: ['Project Management System'],
  },
  {
    id: 'B-crm',
    prompt:
      'Build a CRM web application for managing customers, leads, sales pipeline, deals, and contacts. Begin build execution now.',
    expectedProfile: 'CRM_WEB_V1',
    requiredTerms: ['customer', 'lead', 'pipeline', 'deal', 'contact'],
    forbiddenTerms: ['expense tracker', 'ExpenseTracker'],
  },
  {
    id: 'C-qr-app',
    prompt: 'Build a QR code generator app with generate, scan, code history, and QR management features.',
    expectedProfile: 'QR_APP',
    requiredTerms: ['qr', 'generate', 'scan', 'code', 'history'],
    forbiddenTerms: ['CRM', 'expense'],
  },
  {
    id: 'D-inventory',
    prompt:
      'Build an inventory management app with stock tracking, products, suppliers, and reorder alerts.',
    expectedProfile: 'INVENTORY_WEB_V1',
    requiredTerms: ['inventory', 'stock', 'product', 'supplier', 'reorder'],
    forbiddenTerms: ['expense tracker', 'CRM pipeline'],
  },
  {
    id: 'E-habit-custom',
    prompt: 'Build a habit tracker for daily routines and streaks',
    expectedProfile: 'HABIT_TRACKER_WEB_V1',
    requiredTerms: ['habit', 'streak', 'routine', 'goal', 'analytics'],
    forbiddenTerms: ['Project Management System'],
  },
  {
    id: 'F-task-tracker',
    prompt:
      'Build a task tracker web app with tasks, projects, labels, calendar, reports, and settings.',
    expectedProfile: 'TASK_TRACKER_WEB_V1',
    requiredTerms: ['task', 'project', 'label', 'calendar', 'complete'],
    forbiddenTerms: ['Project Management System', 'ExpenseTracker'],
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

async function materializeScenario(
  testRoot: string,
  scenario: Scenario,
): Promise<{ workspaceDir: string; profile: GeneratedAppProfile | null; generatedFiles: string[] }> {
  const workspaceId = `mat-${scenario.id}`;
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: scenario.prompt });
  const contract = assessment.report.buildReadyContract;
  if (!contract) {
    return { workspaceDir: join(testRoot, '.generated-builder-workspaces', workspaceId), profile: null, generatedFiles: [] };
  }

  const ranked = rankBuildProfiles(scenario.prompt);
  const profileOverride = ranked.selectedProfile ?? ('GENERIC_CUSTOM_APP_V1' as GeneratedAppProfile);

  const engine = materializeGeneratedApplication({
    projectRootDir: testRoot,
    workspaceId,
    contract: { ...contract, contractId: workspaceId },
    rawPrompt: scenario.prompt,
    profileOverride,
  });

  return {
    workspaceDir: join(testRoot, '.generated-builder-workspaces', workspaceId),
    profile: engine.profile,
    generatedFiles: engine.generatedFiles,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Universal Prompt-to-App Materialization V1 — Validation');
  console.log('=======================================================');
  console.log('');

  const testRoot = join(tmpdir(), `devpulse-materialization-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  assert(
    '01. module exists',
    existsSync(join(ROOT, 'src/universal-prompt-to-app-materialization/index.ts')),
    'index.ts',
  );

  for (const scenario of SCENARIOS) {
    const ranked = rankBuildProfiles(scenario.prompt);
    assert(
      `${scenario.id}. profile rank`,
      ranked.selectedProfile === scenario.expectedProfile ||
        (scenario.expectedProfile === 'HABIT_TRACKER_WEB_V1' &&
          (ranked.selectedProfile === 'HABIT_TRACKER_WEB_V1' || ranked.selectedProfile === 'GENERIC_CUSTOM_APP_V1')),
      `${ranked.selectedProfile} expected ${scenario.expectedProfile}`,
    );

    const { workspaceDir, profile, generatedFiles } = await materializeScenario(testRoot, scenario);
    const validation = validateUniversalAppMaterialization({
      workspaceDir,
      rawPrompt: scenario.prompt,
      selectedProfile: profile,
      projectId: scenario.id,
      projectName: scenario.id,
      buildRunId: `build-${scenario.id}`,
    });

    assert(`${scenario.id}. files generated`, generatedFiles.length > 10, String(generatedFiles.length));
    assert(`${scenario.id}. manifest exists`, existsSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME)), GENERATED_APP_MANIFEST_FILENAME);
    assert(`${scenario.id}. app shell`, validation.blueprintShellPresent, String(validation.blueprintShellPresent));
    assert(`${scenario.id}. feature modules`, validation.featureModulesPresent, String(validation.featureModulesPresent));
    assert(`${scenario.id}. materialization passed`, validation.passed, validation.warnings.join('; ').slice(0, 120));
    assert(
      `${scenario.id}. prompt-specific UI`,
      validation.promptSpecificTermsPresent,
      validation.matchedUiTerms.join(', ').slice(0, 80),
    );
    assert(
      `${scenario.id}. no generic fallback`,
      validation.genericFallbackRejected &&
        scenario.forbiddenTerms.every((term) => !validation.forbiddenTermsFound.some((f) => f.toLowerCase().includes(term.toLowerCase()))),
      validation.forbiddenTermsFound.join(', '),
    );
    assert(
      `${scenario.id}. required terms in source`,
      scenario.requiredTerms.filter((term) =>
        validation.matchedUiTerms.some((m) => m.toLowerCase().includes(term.toLowerCase())) ||
        validation.matchedUiTerms.join(' ').toLowerCase().includes(term.toLowerCase()),
      ).length >= Math.min(3, scenario.requiredTerms.length),
      validation.matchedUiTerms.join(', ').slice(0, 80),
    );
    assert(
      `${scenario.id}. npm-build-alone insufficient flag`,
      validation.npmBuildAloneInsufficient === true,
      'npmBuildAloneInsufficient',
    );
  }

  try {
    rmSync(testRoot, { recursive: true, force: true });
  } catch {
    /* ignore cleanup errors */
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Universal Prompt-to-App Materialization V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(UNIVERSAL_PROMPT_TO_APP_MATERIALIZATION_V1_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
