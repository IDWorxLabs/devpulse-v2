/**
 * One-Prompt Live Preview Proof validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Server } from 'node:http';
import {
  ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN,
  getLastOnePromptLivePreviewBuildResult,
  getOnePromptLivePreviewPublicState,
  resetOnePromptLivePreviewForTests,
  resetGeneratedDevServerManagerForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

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

async function readJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  return JSON.parse(text) as unknown;
}

async function resetBuildModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function startTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server');
  }
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

const REQUIRED = [
  'src/one-prompt-live-preview/index.ts',
  'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
  'server/build-from-prompt-handler.ts',
  'scripts/validate-one-prompt-live-preview-proof.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

await resetBuildModules();
const { server, baseUrl } = await startTestServer();

try {
  const buildRes = await fetch(`${baseUrl}/api/build/from-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: TASK_TRACKER_IDEA }),
  });
  const buildJson = (await readJsonResponse(buildRes)) as {
    ok?: boolean;
    build?: {
      status?: string;
      workspacePath?: string | null;
      generatedProfile?: string | null;
      buildResult?: string | null;
      previewUrl?: string | null;
      featureSignals?: Record<string, boolean> | null;
    };
    livePreview?: { connected?: boolean; previewUrl?: string | null };
  };

  assert('API build/from-prompt HTTP ok', buildRes.ok, `status ${buildRes.status}`);
  assert('build status READY', buildJson.build?.status === 'READY', buildJson.build?.status ?? 'missing');
  assert(
    'workspace created',
    Boolean(buildJson.build?.workspacePath?.includes(GENERATED_BUILDER_WORKSPACES_DIR)),
    buildJson.build?.workspacePath ?? 'none',
  );
  assert(
    'generated profile TASK_TRACKER_WEB_V1',
    buildJson.build?.generatedProfile === 'TASK_TRACKER_WEB_V1',
    buildJson.build?.generatedProfile ?? 'none',
  );
  assert('npm build pass recorded', buildJson.build?.buildResult === 'PASS', buildJson.build?.buildResult ?? 'none');

  const workspaceRel = buildJson.build?.workspacePath ?? '';
  const appPath = join(ROOT, workspaceRel.replace(/\//g, '\\'), 'src', 'App.tsx');
  const appSource = existsSync(appPath) ? readFileSync(appPath, 'utf8') : '';
  assert('generated App.tsx non-stub', appSource.length > 200 && !/return null/.test(appSource), `${appSource.length} chars`);
  assert('feature signal addTask', Boolean(buildJson.build?.featureSignals?.addTask), 'missing');
  assert('feature signal markComplete', Boolean(buildJson.build?.featureSignals?.markComplete), 'missing');
  assert('feature signal deleteTask', Boolean(buildJson.build?.featureSignals?.deleteTask), 'missing');
  assert('feature signal filter', Boolean(buildJson.build?.featureSignals?.filter), 'missing');
  assert('feature signal activeCount', Boolean(buildJson.build?.featureSignals?.activeCount), 'missing');
  assert('feature signal reactMount', Boolean(buildJson.build?.featureSignals?.reactMount), 'missing');

  const previewUrl = buildJson.build?.previewUrl ?? buildJson.livePreview?.previewUrl ?? null;
  assert('runtime preview URL present', Boolean(previewUrl), previewUrl ?? 'none');

  if (previewUrl) {
    const htmlRes = await fetch(previewUrl);
    const html = await htmlRes.text();
    assert('runtime URL returns HTML', htmlRes.ok && /id="root"|Task Tracker|main\.tsx/i.test(html), `status ${htmlRes.status}`);
  }

  const statusRes = await fetch(`${baseUrl}/api/build/live-preview`);
  const statusJson = (await readJsonResponse(statusRes)) as {
    livePreview?: { connected?: boolean; previewUrl?: string | null; generatedProfile?: string | null };
  };
  assert('live preview metadata endpoint ok', statusRes.ok, `status ${statusRes.status}`);
  assert(
    'live preview metadata connected',
    statusJson.livePreview?.connected === true,
    String(statusJson.livePreview?.connected),
  );
  assert(
    'live preview metadata profile',
    statusJson.livePreview?.generatedProfile === 'TASK_TRACKER_WEB_V1' ||
      getLastOnePromptLivePreviewBuildResult()?.generatedProfile === 'TASK_TRACKER_WEB_V1',
    statusJson.livePreview?.generatedProfile ?? 'none',
  );

  await resetBuildModules();
  const chatRes = await fetch(`${baseUrl}/api/brain/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: TASK_TRACKER_IDEA, timestamp: Date.now() }),
  });
  const chatJson = (await readJsonResponse(chatRes)) as {
    category?: string;
    onePromptLivePreview?: { status?: string; previewUrl?: string | null };
    buildLivePreview?: { connected?: boolean; previewUrl?: string | null };
  };
  assert('chat path triggers build', chatJson.onePromptLivePreview?.status === 'READY', chatJson.onePromptLivePreview?.status ?? 'none');
  assert('chat category BUILD', chatJson.category === 'BUILD', chatJson.category ?? 'none');
  assert(
    'chat live preview URL',
    Boolean(chatJson.onePromptLivePreview?.previewUrl || chatJson.buildLivePreview?.previewUrl),
    'missing preview URL in chat response',
  );

  const publicState = getOnePromptLivePreviewPublicState();
  assert('public live preview state READY', publicState.status === 'READY', publicState.status);
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await resetBuildModules();
  await settleEventLoop();
}

const failed = results.filter((r) => !r.passed);
const passToken = failed.length === 0 ? ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN : 'ONE_PROMPT_LIVE_PREVIEW_PROOF_FAIL';

console.log(`\nOne-Prompt Live Preview Proof — ${failed.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Pass token: ${passToken}`);
for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`);
}

process.exitCode = failed.length === 0 ? 0 : 1;
