/**
 * Autonomous Founder Launch Authority V1 — multi-app proof script.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runAutonomousFounderLaunchAuthority,
  AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN,
  FOUNDER_LAUNCH_MIN_SCORE,
  FOUNDER_LAUNCH_SUITE_APPS,
  resetAutonomousFounderLaunchAssessmentForTests,
  resetFounderRemediationPlanCounterForTests,
  runAiDevEngineEvidencePipeline,
} from '../src/autonomous-founder-launch-authority/index.js';
import { buildUniversalCrudWorkspaceFiles } from '../src/code-generation-engine/universal-crud-app-generator.js';
import {
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  resetBlueprintVisualAssessmentForTests,
} from '../src/universal-app-blueprint-visual/index.js';
import {
  resetFeatureRealityAssessmentForTests,
} from '../src/feature-reality-validation/index.js';
import {
  resetUniversalFeatureContractAssessmentForTests,
} from '../src/universal-feature-contract-intelligence/index.js';
import {
  resetEngineeringRealityAssessmentForTests,
} from '../src/engineering-reality-authority/index.js';
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
  buildBuildRealityEvidenceFromWorkspace,
} from '../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import { inspectUniversalAppBlueprint } from '../src/universal-app-blueprint/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.autonomous-founder-launch-authority');

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
    requestedBy: 'autonomous-founder-launch-authority-v1',
    sourceActionId: 'autonomous-founder-launch-app-generation',
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
  resetAutonomousFounderLaunchAssessmentForTests();
  resetFounderRemediationPlanCounterForTests();
  resetBlueprintVisualAssessmentForTests();
  resetFeatureRealityAssessmentForTests();
  resetUniversalFeatureContractAssessmentForTests();
  resetEngineeringRealityAssessmentForTests();
  await resetGeneratedDevServerManagerForTests();

  assert(
    'autonomous founder launch module present',
    existsSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts')),
    'verdict engine exists',
  );

  const playwrightReady = await ensurePlaywrightBrowsersInstalled();
  assert('playwright chromium available', playwrightReady, playwrightReady ? 'browser launched' : 'install failed');

  const suiteReports: unknown[] = [];
  let allAppsPassed = true;

  for (const app of FOUNDER_LAUNCH_SUITE_APPS) {
    await stopAllGeneratedDevServers();
    await resetGeneratedDevServerManagerForTests();
    await settleEventLoop();

    resetRequirementsToPlanContractModuleForTests();
    resetAutonomousFounderLaunchAssessmentForTests();
    resetBlueprintVisualAssessmentForTests();
    resetFeatureRealityAssessmentForTests();
    resetUniversalFeatureContractAssessmentForTests();
    resetEngineeringRealityAssessmentForTests();

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

    const npmBuild = runNpmCommandSync({
      cwd: workspaceDir,
      args: ['run', 'build'],
      timeoutMs: 180_000,
    });
    assert(`${app.profile} npm build`, npmBuild.status === 0, npmBuild.status === 0 ? 'exit 0' : 'failed');

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

    const blueprintStructure = inspectUniversalAppBlueprint(workspaceDir);
    const buildReality = buildBuildRealityEvidenceFromWorkspace({
      workspacePresent: existsSync(join(workspaceDir, 'build-manifest.json')),
      npmInstallOk: npmInstall.status === 0,
      npmBuildOk: npmBuild.status === 0,
      devServerOk: devServer.ok,
    });
    const blueprintStructureEvidence = {
      readOnly: true as const,
      sourceId: 'blueprint-structure',
      sourceName: 'Blueprint Structure',
      available: true,
      passed: blueprintStructure.passed,
      score: blueprintStructure.passed ? 100 : Math.max(0, 100 - blueprintStructure.missingArtifacts.length * 8),
      blockers: blueprintStructure.passed
        ? []
        : blueprintStructure.missingArtifacts.slice(0, 3).map((item) => `Missing artifact: ${item}`),
      warnings: [],
      findings: [`Checked artifacts: ${blueprintStructure.checkedArtifacts}`],
    };

    const pipeline = await runAiDevEngineEvidencePipeline({
      projectRootDir: ROOT,
      workspaceDir,
      contractId: contract.contractId,
      productName: app.productName,
      previewUrl: devServer.url,
      navLabel: app.navLabel,
      rawPrompt: app.prompt,
      playwrightReady: true,
      buildReality,
      blueprintStructureOverride: blueprintStructureEvidence,
    });

    assert(
      `${app.profile} evidence pipeline prerequisites`,
      pipeline.allPrerequisitesPassed,
      [
        `build=${pipeline.buildRealityPassed}`,
        `structure=${pipeline.blueprintStructurePassed}`,
        `visual=${pipeline.blueprintVisualPassed}`,
        `feature=${pipeline.featureRealityPassed}`,
        `contract=${pipeline.universalFeatureContractPassed}`,
        `engineering=${pipeline.engineeringRealityPassed}`,
      ].join(', '),
    );

    const founderAssessment = runAutonomousFounderLaunchAuthority({
      contractId: contract.contractId,
      productName: app.productName,
      workspaceDir,
      previewUrl: devServer.url,
      buildReality,
      blueprintStructure: blueprintStructureEvidence,
      skipAutofix: true,
    });

    suiteReports.push({
      profile: app.profile,
      contractId: contract.contractId,
      verdict: founderAssessment.verdict,
      overallFounderScore: founderAssessment.scores.overallFounderScore,
      passed: founderAssessment.passed,
      userLabel: founderAssessment.userLabel,
    });

    writeFileSync(
      join(REPORT_DIR, `${app.profile}-assessment.json`),
      JSON.stringify(founderAssessment, null, 2),
      'utf8',
    );
    writeFileSync(join(REPORT_DIR, `${app.profile}-report.md`), founderAssessment.reportMarkdown, 'utf8');

    assert(
      `${app.profile} founder launch verdict`,
      founderAssessment.passed,
      `${founderAssessment.verdict} — ${founderAssessment.scores.overallFounderScore}/100`,
    );
    assert(
      `${app.profile} overall founder score >= ${FOUNDER_LAUNCH_MIN_SCORE}`,
      founderAssessment.scores.overallFounderScore >= FOUNDER_LAUNCH_MIN_SCORE,
      `${founderAssessment.scores.overallFounderScore}/100`,
    );
    assert(
      `${app.profile} pass token`,
      founderAssessment.passToken === AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN,
      founderAssessment.passToken,
    );
    assert(
      `${app.profile} user surface launch ready label`,
      founderAssessment.userLabel.includes('Launch Ready'),
      founderAssessment.userLabel,
    );
    assert(
      `${app.profile} six reviewer scores present`,
      founderAssessment.reviewers.length === 6,
      `${founderAssessment.reviewers.length}/6`,
    );

    if (!founderAssessment.passed) allAppsPassed = false;
    await stopAllGeneratedDevServers();
  }

  writeFileSync(join(REPORT_DIR, 'suite-summary.json'), JSON.stringify(suiteReports, null, 2), 'utf8');
  assert(
    'all five founder launch reports generated',
    suiteReports.length === FOUNDER_LAUNCH_SUITE_APPS.length,
    `${suiteReports.length}/${FOUNDER_LAUNCH_SUITE_APPS.length}`,
  );

  const passed = results.every((result) => result.passed) && allAppsPassed;
  finish(passed);
  await settleEventLoop();
}

function finish(passed: boolean): void {
  const passToken = passed
    ? AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN
    : 'AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_FAIL';
  console.log(`\nAutonomous Founder Launch Authority V1 — ${passed ? 'PASS' : 'FAIL'}`);
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
