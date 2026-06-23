/**
 * Feature Reality Validation Authority V1 — rendered runtime proof script.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { materializeGeneratedApplication } from '../src/code-generation-engine/index.js';
import {
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import {
  runNpmCommandSync,
  settleEventLoop,
} from '../src/one-prompt-live-preview/child-process-teardown.js';
import {
  resetGeneratedDevServerManagerForTests,
  startGeneratedAppDevServer,
  stopAllGeneratedDevServers,
} from '../src/one-prompt-live-preview/generated-dev-server-manager.js';
import {
  FEATURE_REALITY_V1_PASS_TOKEN,
  parseFeatureContract,
  runFeatureRealityValidation,
  resetFeatureRealityAssessmentForTests,
} from '../src/feature-reality-validation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.feature-reality-validation');
const TASK_TRACKER_IDEA =
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function cleanupWorkspace(contractId: string): void {
  const workspacePath = join(ROOT, WORKSPACE_ROOT_DIR, contractId);
  if (!existsSync(workspacePath)) return;
  try {
    rmSync(workspacePath, { recursive: true, force: true });
  } catch {
    /* workspace may be locked */
  }
}

async function ensurePlaywrightBrowsersInstalled(): Promise<boolean> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    const install = runNpmCommandSync({
      cwd: ROOT,
      args: ['exec', 'playwright', 'install', 'chromium'],
      timeoutMs: 600_000,
    });
    if (install.status !== 0) return false;
    try {
      const playwright = await import('playwright');
      const browser = await playwright.chromium.launch({ headless: true });
      await browser.close();
      return true;
    } catch {
      return false;
    }
  }
}

async function main(): Promise<void> {
  mkdirSync(REPORT_DIR, { recursive: true });
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetFeatureRealityAssessmentForTests();
  await resetGeneratedDevServerManagerForTests();

  assert(
    'feature reality module present',
    existsSync(join(ROOT, 'src/feature-reality-validation/feature-reality-validation-runner.ts')),
    'runner module exists',
  );

  const assessmentPlan = assessRequirementsToPlanExecutionContract({ rawPrompt: TASK_TRACKER_IDEA });
  const contract = assessmentPlan.report.buildReadyContract;
  assert('build-ready contract produced', contract != null, contract?.contractId ?? 'missing');

  if (!contract) {
    finish(false);
    return;
  }

  cleanupWorkspace(contract.contractId);
  materializeBuildProofGapArtifacts({
    projectRootDir: ROOT,
    contract,
    rawPrompt: TASK_TRACKER_IDEA,
  });
  materializeGeneratedApplication({
    projectRootDir: ROOT,
    workspaceId: contract.contractId,
    contract,
    rawPrompt: TASK_TRACKER_IDEA,
  });

  const workspaceDir = join(ROOT, WORKSPACE_ROOT_DIR, contract.contractId);
  const featureContractPath = join(workspaceDir, 'feature-contract.json');
  assert('feature-contract.json materialized', existsSync(featureContractPath), featureContractPath);
  const featureContract = parseFeatureContract(readFileSync(featureContractPath, 'utf8'));
  assert(
    'feature contract lists core tasks',
    featureContract.features.some((feature) => feature.id === 'create-task'),
    `${featureContract.features.length} features`,
  );

  const npmInstall = runNpmCommandSync({
    cwd: workspaceDir,
    args: ['install', '--ignore-scripts'],
    timeoutMs: 180_000,
  });
  assert('npm install succeeds', npmInstall.status === 0, npmInstall.status === 0 ? 'exit 0' : 'failed');

  const devServer = await startGeneratedAppDevServer({
    workspaceDir,
    workspaceId: contract.contractId,
    timeoutMs: 45_000,
  });
  assert('vite dev server starts', devServer.ok && Boolean(devServer.url), devServer.url ?? devServer.error ?? 'failed');

  if (!devServer.ok || !devServer.url) {
    await stopAllGeneratedDevServers();
    finish(false);
    return;
  }

  const playwrightReady = await ensurePlaywrightBrowsersInstalled();
  assert('playwright chromium available', playwrightReady, playwrightReady ? 'browser launched' : 'install failed');

  const featureAssessment = await runFeatureRealityValidation({
    previewUrl: devServer.url,
    contract: featureContract,
  });

  writeFileSync(join(REPORT_DIR, 'FEATURE_REALITY_REPORT.md'), featureAssessment.reportMarkdown, 'utf8');
  writeFileSync(join(REPORT_DIR, 'assessment.json'), JSON.stringify(featureAssessment, null, 2), 'utf8');

  assert(
    'rendered feature validation passed',
    featureAssessment.passed,
    `${featureAssessment.verdict} — overall ${featureAssessment.scores.overallFeatureScore}/100`,
  );
  assert(
    'pass token',
    featureAssessment.passToken === FEATURE_REALITY_V1_PASS_TOKEN,
    featureAssessment.passToken,
  );
  assert(
    'overall feature score >= 80',
    featureAssessment.scores.overallFeatureScore >= 80,
    `${featureAssessment.scores.overallFeatureScore}/100`,
  );
  assert(
    'does not block launch readiness',
    !featureAssessment.blocksLaunchReadiness,
    featureAssessment.blocksLaunchReadinessReason ?? 'launch allowed',
  );

  await stopAllGeneratedDevServers();
  await settleEventLoop();
  finish(results.every((result) => result.passed));
}

function finish(passed: boolean): void {
  const passToken = passed ? FEATURE_REALITY_V1_PASS_TOKEN : 'FEATURE_REALITY_V1_FAIL';
  console.log(`\nFeature Reality Validation V1 — ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`Pass token: ${passToken}`);
  for (const result of results) {
    console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`);
  }
  process.exitCode = passed ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
