/**
 * Universal App Blueprint v1.0 validation — proves every generated app includes default structure.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  materializeGeneratedApplication,
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
import {
  UNIVERSAL_APP_BLUEPRINT_PASS_TOKEN,
  UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS,
  inspectUniversalAppBlueprint,
} from '../src/universal-app-blueprint/index.js';

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
    /* workspace may be locked */
  }
}

for (const artifact of UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS) {
  assert(
    `registry artifact: ${artifact}`,
    typeof artifact === 'string' && artifact.length > 0,
    'registered',
  );
}

assert(
  'blueprint module present',
  existsSync(join(ROOT, 'src/universal-app-blueprint/universal-app-blueprint-generator.ts')),
  'generator module exists',
);

resetRequirementsToPlanContractModuleForTests();
resetConnectedBuildExecutionModuleForTests();
const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: TASK_TRACKER_IDEA });
const contract = assessment.report.buildReadyContract;
assert('build-ready contract produced', contract != null, contract?.contractId ?? 'missing');

if (contract) {
  cleanupWorkspace(contract.contractId);
  materializeBuildProofGapArtifacts({
    projectRootDir: ROOT,
    contract,
    rawPrompt: TASK_TRACKER_IDEA,
  });

  const engineResult = materializeGeneratedApplication({
    projectRootDir: ROOT,
    workspaceId: contract.contractId,
    contract,
    rawPrompt: TASK_TRACKER_IDEA,
  });
  assert('engine generated app', engineResult.generated, engineResult.profile ?? 'none');

  const workspaceDir = join(ROOT, WORKSPACE_ROOT_DIR, contract.contractId);
  const inspection = inspectUniversalAppBlueprint(workspaceDir);
  assert(
    'Universal App Blueprint inspection',
    inspection.passed,
    inspection.passed
      ? `checked ${inspection.checkedArtifacts} artifacts`
      : [
          inspection.missingArtifacts.length > 0
            ? `missing: ${inspection.missingArtifacts.join(', ')}`
            : null,
          inspection.missingPatterns.length > 0
            ? `patterns: ${inspection.missingPatterns.join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join('; '),
  );

  const packagePath = join(workspaceDir, 'package.json');
  const packageSource = readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageSource) as {
    devpulseUniversalBlueprint?: string;
    aidevengineUniversalBlueprint?: string;
  };
  assert(
    'package.json blueprint marker',
    packageJson.devpulseUniversalBlueprint === 'v1',
    packageJson.devpulseUniversalBlueprint ?? 'missing',
  );
  assert(
    'package.json blueprint version',
    packageJson.aidevengineUniversalBlueprint === '1.0',
    packageJson.aidevengineUniversalBlueprint ?? 'missing',
  );

  const manifestPath = join(workspaceDir, 'blueprint-manifest.json');
  assert('blueprint-manifest.json exists', existsSync(manifestPath), manifestPath);
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      universalBlueprintEnabled?: boolean;
      universalBlueprintVersion?: string;
    };
    assert('blueprint manifest enabled', manifest.universalBlueprintEnabled === true, 'enabled');
    assert('blueprint manifest version', manifest.universalBlueprintVersion === '1.0', manifest.universalBlueprintVersion ?? 'missing');
  }

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
  assert(
    'npm run build succeeds',
    npmBuild.status === 0,
    npmBuild.status === 0 ? 'exit 0' : (npmBuild.stderr ?? '').slice(0, 200),
  );
}

const failed = results.filter((r) => !r.passed);
const passToken = failed.length === 0 ? UNIVERSAL_APP_BLUEPRINT_PASS_TOKEN : 'UNIVERSAL_APP_BLUEPRINT_V1_FAIL';

console.log(`\nUniversal App Blueprint v1.0 — ${failed.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Pass token: ${passToken}`);
for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`);
}

process.exit(failed.length === 0 ? 0 : 1);
