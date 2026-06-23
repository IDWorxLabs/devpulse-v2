/**
 * Validates canonical Live Preview status sync after one-prompt build success.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Server } from 'node:http';
import {
  ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN,
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  resolveCanonicalLivePreviewState,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';
import { runOnePromptLivePreviewBuild } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import {
  CHAT_BUILD_PROOF_PASS_TOKEN,
  runOnePromptChatBuildProofChecks,
} from './lib/one-prompt-chat-build-proof-core.js';

const LIVE_PREVIEW_STATUS_SYNC_PASS_TOKEN = `${ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN}_STATUS_SYNC`;

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
const snapshotSrc = readFileSync(join(ROOT, 'server/product-workspace-snapshot.ts'), 'utf8');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

assert('canonical module exists', snapshotSrc.includes('resolveCanonicalLivePreviewState'), 'snapshot import');
assert('client canonical resolver', appJs.includes('resolveCanonicalLivePreviewPanels'), 'app.js helper');
assert('client workspace sync apply', appJs.includes('livePreviewWorkspaceSync'), 'brain sync apply');
assert('client stale NO_PREVIEW override', appJs.includes("merged.state === 'NO_PREVIEW'"), 'override guard');
assert('footer connected running copy', appJs.includes('Live preview runtime connected'), 'footer status');
assert('package script', Boolean(pkg.scripts?.['validate:live-preview-status-sync']), 'package.json');

await resetModules();

const buildResult = await runOnePromptLivePreviewBuild({
  rawPrompt: TASK_TRACKER_IDEA,
  projectRootDir: ROOT,
  source: 'validator',
});

assert('one-prompt build READY', buildResult.status === 'READY', buildResult.status);
assert('preview URL present', Boolean(buildResult.previewUrl), buildResult.previewUrl ?? 'none');

const canonical = resolveCanonicalLivePreviewState(
  {
    sessions: [],
    activeSession: null,
    previewUrl: null,
    connected: false,
    diagnostics: {
      previewRuntimeActive: false,
      previewSessionCount: 0,
      registeredTargetCount: 0,
      readyPreviewCount: 0,
      blockedPreviewCount: 0,
    },
    targets: [],
  },
  {
    latestProjectId: null,
    projectCount: 0,
    projectName: null,
    recentChangeSummary: null,
  },
);

assert(
  'canonical livePreview connected',
  canonical.runtimeLivePreviewConnected === true,
  String(canonical.runtimeLivePreviewConnected),
);
assert(
  'canonical previewUrl merged',
  canonical.livePreview.previewUrl === buildResult.previewUrl,
  canonical.livePreview.previewUrl ?? 'none',
);
assert(
  'canonical reality PREVIEW_READY',
  canonical.livePreview.reality.state === 'PREVIEW_READY',
  canonical.livePreview.reality.state,
);
assert(
  'canonical running app not NO_RUNNING_APP',
  canonical.runningApplication.outputState !== 'NO_RUNNING_APP',
  canonical.runningApplication.outputState,
);
assert(
  'canonical test readiness TESTABLE',
  canonical.runningApplication.testReadiness === 'TESTABLE',
  canonical.runningApplication.testReadiness,
);
assert(
  'canonical running title not empty',
  !/no running application/i.test(canonical.runningApplication.runningAppTitle),
  canonical.runningApplication.runningAppTitle,
);

const snapshot = buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')));
assert(
  'snapshot livePreview connected after build',
  snapshot.livePreview.connected === true,
  String(snapshot.livePreview.connected),
);
assert(
  'snapshot reality PREVIEW_READY',
  snapshot.livePreview.reality.state === 'PREVIEW_READY',
  snapshot.livePreview.reality.state,
);
assert(
  'snapshot running app TESTABLE',
  snapshot.runningApplication.testReadiness === 'TESTABLE',
  snapshot.runningApplication.testReadiness,
);
assert(
  'snapshot runtime lists Live Preview connected',
  (snapshot.runtime.workspacesConnected ?? []).includes('Live Preview'),
  (snapshot.runtime.workspacesConnected ?? []).join(', '),
);

const { server, baseUrl } = await startTestServer();
try {
  const chatRes = await fetch(`${baseUrl}/api/brain/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: TASK_TRACKER_IDEA, timestamp: Date.now() }),
  });
  const chatJson = (await chatRes.json()) as {
    livePreviewWorkspaceSync?: {
      livePreview?: { previewUrl?: string | null; reality?: { state?: string }; connected?: boolean };
      runningApplication?: { outputState?: string; testReadiness?: string; runningAppTitle?: string };
      runtimeLivePreviewConnected?: boolean;
    };
  };

  const sync = chatJson.livePreviewWorkspaceSync;
  assert('chat livePreviewWorkspaceSync present', Boolean(sync), sync ? 'present' : 'absent');
  assert(
    'chat sync previewUrl present',
    Boolean(sync?.livePreview?.previewUrl),
    sync?.livePreview?.previewUrl ?? 'none',
  );
  assert(
    'chat sync reality PREVIEW_READY',
    sync?.livePreview?.reality?.state === 'PREVIEW_READY',
    sync?.livePreview?.reality?.state ?? 'none',
  );
  assert(
    'chat sync running app ready',
    sync?.runningApplication?.outputState === 'OUTPUT_READY_FOR_TESTING',
    sync?.runningApplication?.outputState ?? 'none',
  );
  assert(
    'chat sync test readiness TESTABLE',
    sync?.runningApplication?.testReadiness === 'TESTABLE',
    sync?.runningApplication?.testReadiness ?? 'none',
  );
  assert(
    'chat sync runtime connected flag',
    sync?.runtimeLivePreviewConnected === true,
    String(sync?.runtimeLivePreviewConnected),
  );

  const workspaceRes = await fetch(`${baseUrl}/api/product-workspace.json`);
  const workspaceJson = (await workspaceRes.json()) as {
    livePreview?: { connected?: boolean; reality?: { state?: string }; previewUrl?: string | null };
    runningApplication?: { outputState?: string; testReadiness?: string };
  };
  assert(
    'workspace API previewUrl after chat build',
    Boolean(workspaceJson.livePreview?.previewUrl),
    workspaceJson.livePreview?.previewUrl ?? 'none',
  );
  assert(
    'workspace API reality not NO_PREVIEW',
    workspaceJson.livePreview?.reality?.state !== 'NO_PREVIEW',
    workspaceJson.livePreview?.reality?.state ?? 'none',
  );
  assert(
    'workspace API running app TESTABLE',
    workspaceJson.runningApplication?.testReadiness === 'TESTABLE',
    workspaceJson.runningApplication?.testReadiness ?? 'none',
  );
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

await resetModules();
const chatProofServer = await startTestServer();
let chatProofPassed = false;
try {
  const chatProof = await runOnePromptChatBuildProofChecks({
    rootDir: ROOT,
    baseUrl: chatProofServer.baseUrl,
    includeParserCheck: false,
  });
  chatProofPassed = chatProof.passed && chatProof.passToken === CHAT_BUILD_PROOF_PASS_TOKEN;
  assert(
    'one-prompt chat build proof still passes',
    chatProofPassed,
    chatProof.passed ? chatProof.passToken : chatProof.results.find((r) => !r.passed)?.detail ?? 'failed',
  );
} finally {
  await new Promise<void>((resolve, reject) => {
    chatProofServer.server.close((err) => (err ? reject(err) : resolve()));
  });
  await resetModules();
  await settleEventLoop();
}

const failed = results.filter((r) => !r.passed);
const passToken = failed.length === 0 ? LIVE_PREVIEW_STATUS_SYNC_PASS_TOKEN : 'LIVE_PREVIEW_STATUS_SYNC_FAIL';

console.log(`\nLive Preview Status Sync — ${failed.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Pass token: ${passToken}`);
for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`);
}

process.exitCode = failed.length === 0 ? 0 : 1;
