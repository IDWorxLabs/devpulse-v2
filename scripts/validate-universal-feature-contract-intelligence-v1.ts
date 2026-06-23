/**
 * Universal Feature Contract Intelligence V1 — multi-app proof script.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildUniversalCrudWorkspaceFiles } from '../src/code-generation-engine/universal-crud-app-generator.js';
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
import { createRealFileOperation } from '../src/real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../src/real-file-workspace-execution/real-file-operation-executor.js';
import {
  UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS_TOKEN,
  UNIVERSAL_FEATURE_CONTRACT_SUITE_APPS,
  buildUniversalFeatureContract,
  detectUniversalAppProfile,
  generateFeatureRealityValidationPlan,
  parseUniversalFeatureContract,
  resetUniversalFeatureContractAssessmentForTests,
  runUniversalFeatureValidation,
} from '../src/universal-feature-contract-intelligence/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.universal-feature-contract-intelligence');

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

function writeWorkspaceFile(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  content: string;
}): boolean {
  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'universal-feature-contract-intelligence-v1',
    sourceActionId: 'universal-crud-app-generation',
    payload: input.content,
  });
  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });
  return Boolean(executed.result?.success);
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
  resetUniversalFeatureContractAssessmentForTests();
  await resetGeneratedDevServerManagerForTests();

  assert(
    'module present',
    existsSync(join(ROOT, 'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts')),
    'builder module exists',
  );

  const playwrightReady = await ensurePlaywrightBrowsersInstalled();
  assert('playwright chromium available', playwrightReady, playwrightReady ? 'browser launched' : 'install failed');

  const suiteReports: unknown[] = [];
  let allAppsPassed = true;

  for (const app of UNIVERSAL_FEATURE_CONTRACT_SUITE_APPS) {
    resetRequirementsToPlanContractModuleForTests();
    const detectedProfile = detectUniversalAppProfile(app.prompt);
    assert(
      `${app.profile} profile detected from prompt`,
      detectedProfile === app.profile,
      `${detectedProfile ?? 'none'} from prompt`,
    );

    const dynamicContract = buildUniversalFeatureContract({
      contractId: 'dynamic-probe',
      rawPrompt: app.prompt,
    });
    assert(
      `${app.profile} contract generated dynamically`,
      dynamicContract.entities.length > 0 && dynamicContract.actions.length > 0,
      `${dynamicContract.entities.length} entities, ${dynamicContract.actions.length} actions`,
    );

    const plan = generateFeatureRealityValidationPlan(dynamicContract);
    assert(
      `${app.profile} validation plan generated`,
      plan.steps.length >= 5,
      `${plan.steps.length} runtime steps`,
    );

    const assessmentPlan = assessRequirementsToPlanExecutionContract({ rawPrompt: app.prompt });
    const contract = assessmentPlan.report.buildReadyContract;
    if (!contract) {
      assert(`${app.profile} build-ready contract`, false, 'missing contract');
      allAppsPassed = false;
      continue;
    }

    cleanupWorkspace(contract.contractId);
    materializeBuildProofGapArtifacts({
      projectRootDir: ROOT,
      contract,
      rawPrompt: app.prompt,
    });

    const files = buildUniversalCrudWorkspaceFiles({
      contractId: contract.contractId,
      ideaId: contract.ideaId,
      buildUnits: contract.buildUnits.map((unit) => unit.unitId),
      rawPrompt: app.prompt,
    });

    for (const file of files) {
      writeWorkspaceFile({
        projectRootDir: ROOT,
        workspaceId: contract.contractId,
        relativePath: file.relativePath,
        content: file.content,
      });
    }

    const workspaceDir = join(ROOT, WORKSPACE_ROOT_DIR, contract.contractId);
    const contractPath = join(workspaceDir, 'universal-feature-contract.json');
    assert(`${app.profile} universal-feature-contract.json`, existsSync(contractPath), contractPath);

    const universalContract = parseUniversalFeatureContract(readFileSync(contractPath, 'utf8'));
    assert(
      `${app.profile} contract profile matches`,
      universalContract.productProfile === app.profile,
      universalContract.productProfile,
    );

    const npmInstall = runNpmCommandSync({
      cwd: workspaceDir,
      args: ['install', '--ignore-scripts'],
      timeoutMs: 180_000,
    });
    assert(`${app.profile} npm install`, npmInstall.status === 0, npmInstall.status === 0 ? 'exit 0' : 'failed');

    const devServer = await startGeneratedAppDevServer({
      workspaceDir,
      workspaceId: contract.contractId,
      timeoutMs: 45_000,
    });
    assert(
      `${app.profile} dev server`,
      devServer.ok && Boolean(devServer.url),
      devServer.url ?? devServer.error ?? 'failed',
    );

    if (!devServer.ok || !devServer.url || !playwrightReady) {
      allAppsPassed = false;
      await stopAllGeneratedDevServers();
      continue;
    }

    const validation = await runUniversalFeatureValidation({
      previewUrl: devServer.url,
      contract: universalContract,
    });

    suiteReports.push({
      profile: app.profile,
      contractId: contract.contractId,
      verdict: validation.verdict,
      score: validation.scores.overallFeatureRealityScore,
      passed: validation.passed,
    });

    writeFileSync(
      join(REPORT_DIR, `${app.profile}-assessment.json`),
      JSON.stringify(validation, null, 2),
      'utf8',
    );
    writeFileSync(
      join(REPORT_DIR, `${app.profile}-report.md`),
      validation.reportMarkdown,
      'utf8',
    );

    assert(
      `${app.profile} runtime validation`,
      validation.passed,
      `${validation.verdict} — ${validation.scores.overallFeatureRealityScore}/100`,
    );
    assert(
      `${app.profile} score >= 80`,
      validation.scores.overallFeatureRealityScore >= 80,
      `${validation.scores.overallFeatureRealityScore}/100`,
    );

    if (!validation.passed) allAppsPassed = false;
    await stopAllGeneratedDevServers();
  }

  writeFileSync(join(REPORT_DIR, 'suite-summary.json'), JSON.stringify(suiteReports, null, 2), 'utf8');

  assert(
    'all five app categories validated',
    suiteReports.length === UNIVERSAL_FEATURE_CONTRACT_SUITE_APPS.length,
    `${suiteReports.length}/${UNIVERSAL_FEATURE_CONTRACT_SUITE_APPS.length}`,
  );

  const passed = results.every((result) => result.passed) && allAppsPassed;
  finish(passed);
  await settleEventLoop();
}

function finish(passed: boolean): void {
  const passToken = passed
    ? UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS_TOKEN
    : 'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_FAIL';
  console.log(`\nUniversal Feature Contract Intelligence V1 — ${passed ? 'PASS' : 'FAIL'}`);
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
