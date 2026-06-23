/**
 * Code Generation Engine V1 validation.
 */

import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CODE_GENERATION_ENGINE_V1_PASS_TOKEN,
  detectTaskTrackerIdea,
  extractTaskTrackerRequirements,
  isTaskTrackerAppSource,
  isTaskTrackerMountEntry,
  materializeGeneratedApplication,
  usesViteReactRuntime,
} from '../src/code-generation-engine/index.js';
import {
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
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
    /* workspace may be locked by a prior dev server — materializer will overwrite key files */
  }
}

const REQUIRED = [
  'src/code-generation-engine/index.ts',
  'src/code-generation-engine/task-tracker-detector.ts',
  'src/code-generation-engine/task-tracker-generator.ts',
  'src/code-generation-engine/code-generation-engine-authority.ts',
  'scripts/validate-code-generation-engine-v1.ts',
  'scripts/direct-build-proof-task-tracker.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

assert('detect task tracker idea', detectTaskTrackerIdea(TASK_TRACKER_IDEA), 'prompt recognized');
const requirements = extractTaskTrackerRequirements(TASK_TRACKER_IDEA);
assert('extract add task requirement', requirements.addTask, 'addTask=true');
assert('extract complete requirement', requirements.completeTask, 'completeTask=true');
assert('extract delete requirement', requirements.deleteTask, 'deleteTask=true');
assert('extract filter requirement', requirements.filterAllActiveCompleted, 'filter=true');
assert('extract active count requirement', requirements.activeTaskCount, 'activeCount=true');

resetRequirementsToPlanContractModuleForTests();
resetConnectedBuildExecutionModuleForTests();
const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: TASK_TRACKER_IDEA });
const contract = assessment.report.buildReadyContract;
assert('build-ready contract produced', contract != null, contract?.contractId ?? 'missing');
assert(
  'planning readiness BUILD_READY',
  contract?.readinessState === 'BUILD_READY',
  contract?.readinessState ?? 'none',
);

if (contract) {
  cleanupWorkspace(contract.contractId);
  const materialization = materializeBuildProofGapArtifacts({
    projectRootDir: ROOT,
    contract,
    rawPrompt: TASK_TRACKER_IDEA,
  });
  assert(
    'materialization proof PROVEN',
    materialization.proofLevel === 'PROVEN',
    materialization.proofLevel,
  );

  const workspaceDir = join(ROOT, WORKSPACE_ROOT_DIR, contract.contractId);
  const appPath = join(workspaceDir, 'src/App.tsx');
  const mainPath = join(workspaceDir, 'src/main.tsx');
  const indexPath = join(workspaceDir, 'index.html');
  const packagePath = join(workspaceDir, 'package.json');
  const appSource = readFileSync(appPath, 'utf8');
  const mainSource = readFileSync(mainPath, 'utf8');
  const packageSource = readFileSync(packagePath, 'utf8');

  assert('App.tsx is not stub', !/return null/.test(appSource), 'real component generated');
  assert('App.tsx has task features', isTaskTrackerAppSource(appSource), 'feature patterns present');
  assert('main.tsx mounts React root', isTaskTrackerMountEntry(mainSource), 'createRoot present');
  assert('index.html exists', existsSync(indexPath), indexPath);
  assert('vite runtime configured', usesViteReactRuntime(packageSource), 'vite scripts/deps present');

  const materializerSource = readFileSync(
    join(ROOT, 'src/connected-build-execution/build-proof-gap-materializer.ts'),
    'utf8',
  );
  assert(
    'materializer invokes code generation engine',
    materializerSource.includes('materializeGeneratedApplication'),
    'wired',
  );

  const npmInstall = spawnSync('npm', ['install', '--ignore-scripts'], {
    cwd: workspaceDir,
    encoding: 'utf8',
    shell: true,
    timeout: 180_000,
  });
  assert('npm install succeeds', npmInstall.status === 0, npmInstall.status === 0 ? 'exit 0' : 'failed');

  const npmBuild = spawnSync('npm', ['run', 'build'], {
    cwd: workspaceDir,
    encoding: 'utf8',
    shell: true,
    timeout: 180_000,
  });
  assert('npm run build succeeds', npmBuild.status === 0, npmBuild.status === 0 ? 'exit 0' : (npmBuild.stderr ?? '').slice(0, 200));

  const distIndex = join(workspaceDir, 'dist/index.html');
  assert('build output index.html exists', existsSync(distIndex), distIndex);
  if (existsSync(distIndex)) {
    const distStat = statSync(distIndex);
    assert('build output non-empty', distStat.size > 100, `${distStat.size} bytes`);
  }

  const devServer = spawnSync('npm', ['run', 'dev'], {
    cwd: workspaceDir,
    encoding: 'utf8',
    shell: true,
    timeout: 20_000,
    env: { ...process.env, BROWSER: 'none' },
  });
  const devStdout = devServer.stdout ?? '';
  const portMatch = devStdout.match(/Local:\s+http:\/\/127\.0\.0\.1:(\d+)/i);
  assert('vite dev server starts', portMatch != null, portMatch ? `port ${portMatch[1]}` : devStdout.slice(0, 200));

  const engineResult = materializeGeneratedApplication({
    projectRootDir: ROOT,
    workspaceId: contract.contractId,
    contract,
    rawPrompt: TASK_TRACKER_IDEA,
  });
  assert('engine reports generated profile', engineResult.generated, engineResult.profile ?? 'none');
}

const failed = results.filter((r) => !r.passed);
const passToken =
  failed.length === 0 ? CODE_GENERATION_ENGINE_V1_PASS_TOKEN : 'CODE_GENERATION_ENGINE_V1_FAIL';

console.log(`\nCode Generation Engine V1 — ${failed.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Pass token: ${passToken}`);
for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`);
}

process.exit(failed.length === 0 ? 0 : 1);
