/**
 * Validates Multi-Project Workspace Tabs V1 — isolated chat/preview/build state per project.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Server } from 'node:http';
import {
  MULTI_PROJECT_WORKSPACE_TABS_PASS_TOKEN,
  getBuildResultForProject,
  getOnePromptLivePreviewPublicState,
  listGeneratedDevServers,
  listMultiProjectWorkspaces,
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  runOnePromptLivePreviewBuild,
  setActiveProjectId,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const TASK_TRACKER_IDEA =
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';
const PROJECT_A_ID = 'project-task-tracker-a';
const PROJECT_B_ID = 'project-notes-placeholder-b';

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
}

async function startTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const html = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

assert('UI workspace tabs container', html.includes('id="workspace-tabs"'), 'index.html');
assert('UI preview tabs hook', appJs.includes('preview-workspace-tabs'), 'app.js');
assert('UI per-project chat threads', appJs.includes('projectChatThreads'), 'app.js');
assert('UI switchActiveProject', appJs.includes('switchActiveProject'), 'app.js');
assert('package script', Boolean(pkg.scripts?.['validate:multi-project-workspace-tabs']), 'package.json');

await resetModules();

const buildA = await runOnePromptLivePreviewBuild({
  rawPrompt: TASK_TRACKER_IDEA,
  projectRootDir: ROOT,
  source: 'validator',
  projectId: PROJECT_A_ID,
  projectName: 'Task Tracker A',
});

assert('project A build READY', buildA.status === 'READY', buildA.status);
assert('project A id preserved', buildA.projectId === PROJECT_A_ID, buildA.projectId);
assert('project A preview URL', Boolean(buildA.previewUrl), buildA.previewUrl ?? 'none');

const buildB = await runOnePromptLivePreviewBuild({
  rawPrompt: TASK_TRACKER_IDEA,
  projectRootDir: ROOT,
  source: 'validator',
  projectId: PROJECT_B_ID,
  projectName: 'Notes Placeholder B',
});

assert('project B build READY', buildB.status === 'READY', buildB.status);
assert('project B id preserved', buildB.projectId === PROJECT_B_ID, buildB.projectId);
assert('project B preview URL', Boolean(buildB.previewUrl), buildB.previewUrl ?? 'none');
assert(
  'separate workspace paths',
  Boolean(buildA.workspacePath && buildB.workspacePath && buildA.workspacePath !== buildB.workspacePath),
  `${buildA.workspacePath ?? 'none'} vs ${buildB.workspacePath ?? 'none'}`,
);
assert(
  'separate preview URLs',
  Boolean(buildA.previewUrl && buildB.previewUrl && buildA.previewUrl !== buildB.previewUrl),
  `${buildA.previewUrl ?? 'none'} vs ${buildB.previewUrl ?? 'none'}`,
);

const workspaces = listMultiProjectWorkspaces();
assert('two project sessions registered', workspaces.length === 2, String(workspaces.length));
assert(
  'project A metadata isolated',
  workspaces.some((session) => session.projectId === PROJECT_A_ID && session.projectName === 'Task Tracker A'),
  PROJECT_A_ID,
);
assert(
  'project B metadata isolated',
  workspaces.some((session) => session.projectId === PROJECT_B_ID && session.projectName === 'Notes Placeholder B'),
  PROJECT_B_ID,
);

const devServers = listGeneratedDevServers();
assert('two preview runtimes active', devServers.length === 2, String(devServers.length));

setActiveProjectId(PROJECT_A_ID);
const activeA = getOnePromptLivePreviewPublicState(PROJECT_A_ID);
assert('active switch exposes project A preview', activeA.previewUrl === buildA.previewUrl, activeA.previewUrl ?? 'none');

setActiveProjectId(PROJECT_B_ID);
const activeB = getOnePromptLivePreviewPublicState(PROJECT_B_ID);
assert('active switch exposes project B preview', activeB.previewUrl === buildB.previewUrl, activeB.previewUrl ?? 'none');
assert(
  'project A build retained after switching to B',
  getBuildResultForProject(PROJECT_A_ID)?.previewUrl === buildA.previewUrl,
  getBuildResultForProject(PROJECT_A_ID)?.previewUrl ?? 'none',
);

const snapshot = buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')));
assert(
  'snapshot exposes multiProjectWorkspaces',
  Array.isArray(snapshot.multiProjectWorkspaces) && snapshot.multiProjectWorkspaces.length === 2,
  String(snapshot.multiProjectWorkspaces?.length ?? 0),
);
assert('snapshot exposes activeProjectId', snapshot.activeProjectId === PROJECT_B_ID, snapshot.activeProjectId ?? 'none');

const { server, baseUrl } = await startTestServer();
try {
  const listRes = await fetch(`${baseUrl}/api/build/live-preview`);
  const listJson = (await listRes.json()) as {
    sessions?: Array<{ projectId?: string; previewUrl?: string | null }>;
    previewRuntimes?: Array<{ projectId?: string; url?: string }>;
  };
  assert('live preview API lists sessions', (listJson.sessions?.length ?? 0) === 2, String(listJson.sessions?.length ?? 0));
  assert(
    'live preview API lists runtimes',
    (listJson.previewRuntimes?.length ?? 0) === 2,
    String(listJson.previewRuntimes?.length ?? 0),
  );

  const projectARes = await fetch(`${baseUrl}/api/build/live-preview?projectId=${PROJECT_A_ID}`);
  const projectAJson = (await projectARes.json()) as { livePreview?: { previewUrl?: string | null } };
  assert(
    'live preview API by projectId A',
    projectAJson.livePreview?.previewUrl === buildA.previewUrl,
    projectAJson.livePreview?.previewUrl ?? 'none',
  );

  const brainRes = await fetch(`${baseUrl}/api/brain/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: TASK_TRACKER_IDEA,
      timestamp: Date.now(),
      activeProjectId: PROJECT_A_ID,
      projectName: 'Task Tracker A',
    }),
  });
  const brainJson = (await brainRes.json()) as {
    activeProjectId?: string;
    multiProjectWorkspaces?: Array<{ projectId?: string; previewUrl?: string | null }>;
    onePromptLivePreview?: { projectId?: string; previewUrl?: string | null };
  };
  assert('brain respond keeps active project A', brainJson.activeProjectId === PROJECT_A_ID, brainJson.activeProjectId ?? 'none');
  assert(
    'brain respond returns multiProjectWorkspaces',
    Array.isArray(brainJson.multiProjectWorkspaces) && brainJson.multiProjectWorkspaces.length >= 2,
    String(brainJson.multiProjectWorkspaces?.length ?? 0),
  );
  assert(
    'brain build attaches to project A only',
    brainJson.onePromptLivePreview?.projectId === PROJECT_A_ID,
    brainJson.onePromptLivePreview?.projectId ?? 'none',
  );
  assert(
    'project B preview unchanged after A rebuild',
    getBuildResultForProject(PROJECT_B_ID)?.previewUrl === buildB.previewUrl,
    getBuildResultForProject(PROJECT_B_ID)?.previewUrl ?? 'none',
  );

  const workspaceRes = await fetch(`${baseUrl}/api/product-workspace.json`);
  const workspaceJson = (await workspaceRes.json()) as {
    multiProjectWorkspaces?: unknown[];
    activeProjectId?: string | null;
  };
  assert(
    'workspace API multiProjectWorkspaces',
    Array.isArray(workspaceJson.multiProjectWorkspaces) && workspaceJson.multiProjectWorkspaces.length >= 2,
    String(workspaceJson.multiProjectWorkspaces?.length ?? 0),
  );
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

await resetModules();
await settleEventLoop();

const failed = results.filter((r) => !r.passed);
const passToken = failed.length === 0 ? MULTI_PROJECT_WORKSPACE_TABS_PASS_TOKEN : 'MULTI_PROJECT_WORKSPACE_TABS_FAIL';

console.log(`\nMulti-Project Workspace Tabs — ${failed.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Pass token: ${passToken}`);
for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`);
}

process.exitCode = failed.length === 0 ? 0 : 1;
