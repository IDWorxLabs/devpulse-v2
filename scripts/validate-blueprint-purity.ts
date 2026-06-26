/**
 * Blueprint Purity V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import type { GeneratedAppProfile } from '../src/code-generation-engine/code-generation-engine-types.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  applyBlueprintPurityToManifest,
  BLUEPRINT_PURITY_V1_PASS_TOKEN,
  blueprintPurityTraceTitles,
  buildBlueprintPurityEvidence,
  buildBlueprintPurityTraceEvents,
  findBlueprintPurityViolations,
  scanBlueprintSourceFiles,
  scanGeneratedWorkspaceShell,
  verifyGeneratedAppDomainBoundary,
} from '../src/blueprint-purity/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  serializeGeneratedAppManifest,
} from '../src/universal-prompt-to-app-materialization/index.js';
import type { GeneratedAppManifest } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import { runProductionValidation } from '../src/production-validation/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface ProfileScenario {
  id: string;
  profile: GeneratedAppProfile | 'HABIT_TRACKER_WEB_V1' | 'GENERIC_CUSTOM_APP_V1';
  prompt: string;
}

const SAMPLE_PROFILES: ProfileScenario[] = [
  {
    id: 'expense-tracker',
    profile: 'EXPENSE_TRACKER_WEB_V1',
    prompt: 'Build ExpenseTracker with expenses, income, categories, reports, and charts.',
  },
  {
    id: 'task-tracker',
    profile: 'TASK_TRACKER_WEB_V1',
    prompt: 'Build a task tracker with tasks, projects, labels, calendar, and reports.',
  },
  {
    id: 'crm',
    profile: 'CRM_WEB_V1',
    prompt: 'Build a CRM for customers, leads, pipeline, deals, and contacts.',
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

function materializeProfile(testRoot: string, scenario: ProfileScenario): string {
  const workspaceId = `purity-${scenario.id}`;
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
  if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');
  return join(testRoot, '.generated-builder-workspaces', workspaceId);
}

async function main(): Promise<void> {
  console.log('');
  console.log('Blueprint Purity V1 — Validation');
  console.log('=================================');
  console.log('');

  const sourceResults = scanBlueprintSourceFiles(ROOT);
  assert(
    '01. universal blueprint source files pure',
    sourceResults.every((result) => result.passed),
    sourceResults
      .filter((result) => !result.passed)
      .map((result) => `${result.relativePath}: ${result.violations.join(', ')}`)
      .join('; ') || 'ok',
  );

  assert(
    '02. profile-feature-map not scanned as blueprint shell',
    !sourceResults.some((result) => result.relativePath.includes('profile-feature-map')),
    'profile maps excluded from shell scan',
  );

  const testRoot = join(tmpdir(), `blueprint-purity-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    for (const scenario of SAMPLE_PROFILES) {
      const workspaceDir = materializeProfile(testRoot, scenario);
      const { shellResults, allowedDomainSources } = scanGeneratedWorkspaceShell(workspaceDir);
      const boundary = verifyGeneratedAppDomainBoundary({
        workspaceDir,
        profile: scenario.profile,
        prompt: scenario.prompt,
      });

      assert(
        `${scenario.profile}: generated AppShell domain-neutral`,
        shellResults.every((result) => result.passed),
        shellResults
          .filter((result) => !result.passed)
          .map((result) => `${result.relativePath}: ${result.violations.join(', ')}`)
          .join('; ') || 'ok',
      );

      const registrySource = readFileSync(join(workspaceDir, 'src/features/registry.ts'), 'utf8');
      assert(
        `${scenario.profile}: registry contains profile modules`,
        findBlueprintPurityViolations(registrySource).length > 0 || scenario.profile === 'GENERIC_CUSTOM_APP_V1',
        'registry has domain module ids',
      );

      const featureSample = readFileSync(
        join(workspaceDir, 'src/features', scenario.profile === 'CRM_WEB_V1' ? 'customers' : scenario.profile === 'TASK_TRACKER_WEB_V1' ? 'tasks' : 'expenses', `${scenario.profile === 'CRM_WEB_V1' ? 'Customers' : scenario.profile === 'TASK_TRACKER_WEB_V1' ? 'Tasks' : 'Expenses'}Feature.tsx`),
        'utf8',
      );
      assert(
        `${scenario.profile}: feature module contains domain language`,
        findBlueprintPurityViolations(featureSample).length > 0,
        findBlueprintPurityViolations(featureSample).join(', ') || 'missing domain terms',
      );

      assert(`${scenario.profile}: domain boundary verified`, boundary.passed, boundary.detail);

      const evidence = buildBlueprintPurityEvidence({
        projectRootDir: ROOT,
        workspaceDir,
        workspaceShellResults: shellResults,
        allowedDomainSources,
        domainBoundaryPassed: boundary.passed,
        domainBoundaryDetail: boundary.detail,
      });

      const manifestPath = join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as GeneratedAppManifest;
      writeFileSync(manifestPath, serializeGeneratedAppManifest(applyBlueprintPurityToManifest(manifest, evidence)));

      assert(
        `${scenario.profile}: manifest blueprint purity evidence`,
        evidence.blueprintPurityStatus === 'PASS' && evidence.shellPurityVerified,
        `${evidence.blueprintPurityViolationCount} violations`,
      );

      const traceEvents = buildBlueprintPurityTraceEvents(evidence, `purity-${scenario.id}`);
      for (const title of blueprintPurityTraceTitles()) {
        if (title === 'Blueprint purity failed') continue;
        assert(
          `${scenario.profile}: trace "${title}"`,
          traceEvents.some((event) => event.eventTitle === title),
          title,
        );
      }

      const sampleResult: OnePromptLivePreviewBuildResult = {
        readOnly: true,
        buildId: `purity-${scenario.id}`,
        projectId: scenario.id,
        projectName: scenario.id,
        status: 'READY',
        prompt: scenario.prompt,
        requestType: 'BUILD_FROM_PROMPT',
        workspaceId: scenario.id,
        workspacePath: workspaceDir.replace(/\\/g, '/'),
        generatedProfile: scenario.profile as GeneratedAppProfile,
        planningProofLevel: 'FULL',
        materializationProofLevel: 'FULL',
        buildResult: 'PASS',
        npmInstallOk: true,
        npmBuildOk: true,
        previewUrl: null,
        livePreviewAvailable: false,
        failureReason: null,
        featureSignals: null,
        materializationManifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
        updatedAt: evidence.scannedAt,
      };
      const buildTrace = buildOnePromptExecutionTraceEvents(sampleResult, scenario.prompt);
      assert(
        `${scenario.profile}: build trace includes blueprint purity`,
        buildTrace.some((event) => event.eventTitle === 'Blueprint purity scan started'),
        'trace linked',
      );
    }

    const prodScenario = SAMPLE_PROFILES[0]!;
    const prodEvidence = await runProductionValidation({
      projectRootDir: testRoot,
      workspaceId: `purity-prod-${prodScenario.id}`,
      profile: prodScenario.profile,
      prompt: prodScenario.prompt,
    });
    const prodShell = scanGeneratedWorkspaceShell(prodEvidence.workspaceDir);
    assert(
      '03. production validation passes with pure blueprint',
      prodEvidence.productionValidationStatus === 'PASS' && prodShell.shellResults.every((result) => result.passed),
      prodEvidence.failureReasons.join('; ') || 'ok',
    );

    assert(
      '04. anti-regression: no Project Management fallback in shell',
      !prodShell.shellResults.some((result) =>
        readFileSync(join(prodEvidence.workspaceDir, result.relativePath), 'utf8').match(
          /Project Management System|Welcome to Project Management/i,
        ),
      ),
      'generic PM fallback absent from shell',
    );
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  const failed = results.filter((result) => !result.passed);
  console.log('');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}`);
  }
  console.log('');

  if (failed.length) {
    console.error(`Blueprint Purity V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(BLUEPRINT_PURITY_V1_PASS_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
