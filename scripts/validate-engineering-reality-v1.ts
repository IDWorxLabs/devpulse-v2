/**
 * Engineering Reality Authority V1 — multi-app proof script.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildUniversalCrudWorkspaceFiles } from '../src/code-generation-engine/universal-crud-app-generator.js';
import {
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  ENGINEERING_REALITY_V1_PASS_TOKEN,
  ENGINEERING_SUITE_APPS,
  resetEngineeringRealityAssessmentForTests,
  runEngineeringRealityValidation,
} from '../src/engineering-reality-authority/index.js';
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
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { createRealFileOperation } from '../src/real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../src/real-file-workspace-execution/real-file-operation-executor.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.engineering-reality-authority');

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
    requestedBy: 'engineering-reality-authority-v1',
    sourceActionId: 'engineering-reality-app-generation',
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
  resetEngineeringRealityAssessmentForTests();
  await resetGeneratedDevServerManagerForTests();

  assert(
    'engineering reality module present',
    existsSync(join(ROOT, 'src/engineering-reality-authority/engineering-reality-runner.ts')),
    'runner module exists',
  );

  const playwrightReady = await ensurePlaywrightBrowsersInstalled();
  assert('playwright chromium available', playwrightReady, playwrightReady ? 'browser launched' : 'install failed');

  const suiteReports: unknown[] = [];
  let allAppsPassed = true;

  for (const app of ENGINEERING_SUITE_APPS) {
    resetRequirementsToPlanContractModuleForTests();
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

    const assessment = await runEngineeringRealityValidation({
      previewUrl: devServer.url,
      workspaceDir,
      contractId: contract.contractId,
      productName: app.productName,
      navLabel: app.navLabel,
    });

    suiteReports.push({
      profile: app.profile,
      contractId: contract.contractId,
      verdict: assessment.verdict,
      securityVerdict: assessment.security.verdict,
      performanceVerdict: assessment.performance.verdict,
      accessibilityVerdict: assessment.accessibility.verdict,
      overallScore: assessment.scores.overallEngineeringScore,
      passed: assessment.passed,
    });

    writeFileSync(
      join(REPORT_DIR, `${app.profile}-assessment.json`),
      JSON.stringify(assessment, null, 2),
      'utf8',
    );
    writeFileSync(join(REPORT_DIR, `${app.profile}-report.md`), assessment.reportMarkdown, 'utf8');

    assert(
      `${app.profile} engineering validation`,
      assessment.passed,
      `${assessment.verdict} — ${assessment.scores.overallEngineeringScore}/100`,
    );
    assert(
      `${app.profile} security verdict not FAIL`,
      assessment.security.verdict !== 'SECURITY_FAIL',
      assessment.security.verdict,
    );
    assert(
      `${app.profile} performance verdict not FAIL`,
      assessment.performance.verdict !== 'PERFORMANCE_FAIL',
      assessment.performance.verdict,
    );
    assert(
      `${app.profile} accessibility verdict not FAIL`,
      assessment.accessibility.verdict !== 'ACCESSIBILITY_FAIL',
      assessment.accessibility.verdict,
    );
    assert(
      `${app.profile} overall score >= 80`,
      assessment.scores.overallEngineeringScore >= 80,
      `${assessment.scores.overallEngineeringScore}/100`,
    );
    assert(
      `${app.profile} pass token`,
      assessment.passToken === ENGINEERING_REALITY_V1_PASS_TOKEN,
      assessment.passToken,
    );

    if (!assessment.passed) allAppsPassed = false;
    await stopAllGeneratedDevServers();
  }

  writeFileSync(join(REPORT_DIR, 'suite-summary.json'), JSON.stringify(suiteReports, null, 2), 'utf8');
  assert(
    'all five engineering reports generated',
    suiteReports.length === ENGINEERING_SUITE_APPS.length,
    `${suiteReports.length}/${ENGINEERING_SUITE_APPS.length}`,
  );

  const passed = results.every((result) => result.passed) && allAppsPassed;
  finish(passed);
  await settleEventLoop();
}

function finish(passed: boolean): void {
  const passToken = passed ? ENGINEERING_REALITY_V1_PASS_TOKEN : 'ENGINEERING_REALITY_V1_FAIL';
  console.log(`\nEngineering Reality Authority V1 — ${passed ? 'PASS' : 'FAIL'}`);
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
