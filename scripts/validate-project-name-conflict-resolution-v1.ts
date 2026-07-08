/**
 * Project Name Conflict Resolution V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH,
  PROJECT_NAME_CONFLICT_RESOLUTION_TRACE,
  PROJECT_NAME_CONFLICT_RESOLUTION_V1_PASS_TOKEN,
  ProjectNameConflictRejectedError,
  applyProjectIdentityForBuild,
  resolveProjectNameConflict,
} from '../src/project-name-conflict-resolution-v1/index.js';
import {
  createProjectRegistryTestRoot,
  createRegistryProject,
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { bootstrapProjectAndSessionForBuild } from '../src/project-session-continuity-v1/project-session-build-bridge.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const GENERIC_BUILD_PROMPT =
  'Build a modern web application with user accounts, dashboards, settings, and responsive UI. Generate architecture, plan, tasks, and begin build execution.';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function resetModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
  resetProjectRegistryV1ForTests();
}

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  invalidateProjectRegistryV1Cache();
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Name Conflict Resolution V1 — Validation');
  console.log('================================================');
  console.log('');

  await resetModules();

  const handlerTs = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const brainTs = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const bridgeTs = readFileSync(join(ROOT, 'src/project-session-continuity-v1/project-session-build-bridge.ts'), 'utf8');
  const routeTs = readFileSync(join(ROOT, 'src/runtime-truth-authority/route-contract-registry.ts'), 'utf8');
  const manifestTs = readFileSync(join(ROOT, 'src/runtime-truth-authority/capability-manifest.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-name-conflict-resolution']), 'script');
  assert('02. module index', existsSync(join(ROOT, 'src/project-name-conflict-resolution-v1/index.ts')), 'index');
  assert('03. conflict handler', existsSync(join(ROOT, 'server/project-name-conflict-handler.ts')), 'handler');
  assert('04. API path', PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH === '/api/projects/resolve-name-conflict', 'path');
  assert('05. build handler integrated', handlerTs.includes('applyProjectIdentityForBuild') || handlerTs.includes('bootstrapProjectAndSessionForBuild'), 'build');
  assert('06. build handler trace', handlerTs.includes('conflictResolutionTrace'), 'trace');
  assert('07. brain handler auto-continue', brainTs.includes('resumeRoute.shouldBlock && resumeRoute.resumingProjectId'), 'brain');
  assert('08. bootstrap uses conflict resolver', bridgeTs.includes('applyProjectIdentityForBuild'), 'bootstrap');
  assert('09. route registry entry', routeTs.includes('/api/projects/resolve-name-conflict'), 'route');
  assert('10. capability manifest entry', manifestTs.includes('projectNameConflictResolution'), 'manifest');
  assert('11. no LISA hardcoding', !readFileSync(join(ROOT, 'src/project-name-conflict-resolution-v1/project-name-conflict-resolver.ts'), 'utf8').match(/\bLISA\b/), 'generic');

  const TEST_ROOT = createProjectRegistryTestRoot(join(tmpdir(), 'devpulse-conflict-resolution-'));
  process.env.AIDEVENGINE_REGISTRY_ROOT = TEST_ROOT;
  resetProjectRegistryV1ForTests(TEST_ROOT);
  invalidateProjectRegistryV1Cache();

  const regressionName = 'RegressionApp';
  const seeded = createRegistryProject({
    name: regressionName,
    summary: 'Seeded project for conflict resolution regression',
    rootDir: TEST_ROOT,
    projectKind: 'USER',
  });
  invalidateProjectRegistryV1Cache();

  assert(
    '11b. seeded project visible',
    readProjectRegistryState(TEST_ROOT).projects.some((p) => p.projectId === seeded.projectId),
    seeded.projectId,
  );

  const scenario1Plan = resolveProjectNameConflict({
    requestedName: regressionName,
    rawPrompt: GENERIC_BUILD_PROMPT,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
  });
  assert(
    '12. scenario1 conflict detected',
    scenario1Plan.conflictFound === true,
    scenario1Plan.resolutionMode,
  );
  assert(
    '13. scenario1 continuation mode',
    scenario1Plan.resolutionMode === 'EXISTING_PROJECT_CONTINUATION' ||
      scenario1Plan.resolutionMode === 'EXISTING_PROJECT_RECOVERY',
    scenario1Plan.resolutionMode,
  );
  assert('14. scenario1 does not fail', scenario1Plan.shouldFail === false, String(scenario1Plan.shouldFail));

  let scenario1Identity = applyProjectIdentityForBuild({
    requestedName: regressionName,
    rawPrompt: GENERIC_BUILD_PROMPT,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
  });
  assert(
    '15. scenario1 same projectId',
    scenario1Identity.projectId === seeded.projectId,
    `${scenario1Identity.projectId} vs ${seeded.projectId}`,
  );
  assert('16. scenario1 continuation allowed', scenario1Identity.continuationAllowed === true, 'allowed');

  const bootstrap1 = bootstrapProjectAndSessionForBuild({
    rawPrompt: GENERIC_BUILD_PROMPT,
    projectName: regressionName,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
  });
  assert('17. scenario1 bootstrap succeeds', Boolean(bootstrap1.projectId), bootstrap1.projectId);
  assert(
    '18. scenario1 bootstrap reuses project',
    bootstrap1.projectId === seeded.projectId,
    bootstrap1.projectId,
  );
  assert(
    '19. scenario1 identity contract fields',
    Boolean(bootstrap1.projectIdentity?.requestedName && bootstrap1.projectIdentity?.resolutionMode),
    bootstrap1.projectIdentity?.resolutionMode ?? 'missing',
  );

  const scenario2Plan = resolveProjectNameConflict({
    requestedName: regressionName,
    rawPrompt: `${GENERIC_BUILD_PROMPT} Start a fresh rebuild from scratch.`,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
    forceFreshRebuild: true,
  });
  assert('20. scenario2 versioned rebuild', scenario2Plan.resolutionMode === 'VERSIONED_REBUILD', scenario2Plan.resolutionMode);
  assert('21. scenario2 new name', scenario2Plan.resolvedProjectName !== regressionName, scenario2Plan.resolvedProjectName);

  const scenario2Identity = applyProjectIdentityForBuild({
    requestedName: regressionName,
    rawPrompt: 'Fresh rebuild from scratch for versioned workspace.',
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
    forceFreshRebuild: true,
  });
  assert(
    '22. scenario2 new projectId',
    scenario2Identity.projectId !== seeded.projectId,
    scenario2Identity.projectId,
  );
  assert('23. scenario2 created project', scenario2Identity.createdProject === true, 'created');

  const scenario3Plan = resolveProjectNameConflict({
    requestedName: 'UniqueNewApp',
    rawPrompt: GENERIC_BUILD_PROMPT,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
  });
  assert('24. scenario3 no conflict', scenario3Plan.resolutionMode === 'NO_CONFLICT', scenario3Plan.resolutionMode);

  const scenario3Identity = applyProjectIdentityForBuild({
    requestedName: 'UniqueNewApp',
    rawPrompt: GENERIC_BUILD_PROMPT,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
  });
  assert('25. scenario3 creates project', scenario3Identity.createdProject === true, 'created');

  const scenario4Plan = resolveProjectNameConflict({
    requestedName: regressionName,
    rawPrompt: GENERIC_BUILD_PROMPT,
    rootDir: TEST_ROOT,
    repoRootDir: ROOT,
    rejectDuplicates: true,
  });
  assert('26. scenario4 explicit rejection plan', scenario4Plan.shouldFail === true, scenario4Plan.resolutionMode);

  let scenario4Rejected = false;
  try {
    applyProjectIdentityForBuild({
      requestedName: regressionName,
      rawPrompt: GENERIC_BUILD_PROMPT,
      rootDir: TEST_ROOT,
      repoRootDir: ROOT,
      rejectDuplicates: true,
    });
  } catch (err) {
    scenario4Rejected = err instanceof ProjectNameConflictRejectedError;
  }
  assert('27. scenario4 throws rejection', scenario4Rejected, 'rejected');

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const apiPlanRes = await fetch(`${baseUrl}${PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: regressionName, prompt: GENERIC_BUILD_PROMPT }),
    });
    const apiPlanJson = (await apiPlanRes.json()) as { plan?: { resolutionMode?: string } };
    assert('28. conflict API HTTP 200', apiPlanRes.status === 200, String(apiPlanRes.status));
    assert(
      '29. conflict API plan mode',
      apiPlanJson.plan?.resolutionMode === 'EXISTING_PROJECT_CONTINUATION' ||
        apiPlanJson.plan?.resolutionMode === 'EXISTING_PROJECT_RECOVERY',
      apiPlanJson.plan?.resolutionMode ?? 'missing',
    );

    const rejectRes = await fetch(`${baseUrl}/api/build/from-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: GENERIC_BUILD_PROMPT,
        projectName: regressionName,
        rejectDuplicates: true,
      }),
    });
    assert('30. scenario4 build API rejects duplicate', rejectRes.status === 409, String(rejectRes.status));
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  const evidenceDir = join(TEST_ROOT, '.aidevengine', 'project-name-conflict-resolution');
  assert('31. evidence recorded', existsSync(evidenceDir), evidenceDir);
  assert(
    '32. registry project count grew',
    readProjectRegistryState(TEST_ROOT).projects.filter((p) => p.status === 'ACTIVE').length >= 2,
    'count',
  );
  assert(
    '33. workspace path contract',
    scenario1Identity.workspacePath?.includes(GENERATED_BUILDER_WORKSPACES_DIR) === true,
    scenario1Identity.workspacePath ?? 'null',
  );

  rmSync(TEST_ROOT, { recursive: true, force: true });
  delete process.env.AIDEVENGINE_REGISTRY_ROOT;

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);

  if (failed.length === 0) {
    console.log('');
    console.log(PROJECT_NAME_CONFLICT_RESOLUTION_V1_PASS_TOKEN);
    process.exit(0);
  }

  console.error('');
  console.error(`${failed.length} check(s) failed`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
