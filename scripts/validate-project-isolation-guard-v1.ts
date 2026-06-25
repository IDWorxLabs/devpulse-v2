/**
 * Project Isolation Guard V1 — validation.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_ISOLATION_GUARD_PASS_TOKEN,
  assessProjectIsolationForViewer,
  assertWorkspacePathBelongsToProject,
  filterBuildRunsByProject,
  filterChatMessagesByProject,
  filterFounderTestReportsByProject,
  filterInsightsByProject,
  filterLivePreviewsByProject,
  filterMemoryByProject,
  filterNotificationsByProject,
  filterOperatorEventsByProject,
  filterPlansByProject,
  filterRuntimeStateByProject,
  filterValidationReportsByProject,
  filterWorkspacesByProject,
  requireProjectIdForWrite,
  resolveProjectIdentity,
  workspacePathForProject,
} from '../src/project-isolation-guard-v1/index.js';
import {
  listBuildIntentRuns,
  listBuildIntentRunsForProject,
  recordBuildIntentRun,
  resetBuildIntentRunsForTests,
} from '../src/build-intent-routing/index.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import {
  listMultiProjectWorkspaces,
  listMultiProjectWorkspacesForProject,
  registerProjectBuildResult,
  resetWorkspaceTabRegistryForTests,
} from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import {
  resetProjectContextMetadataForTests,
  upsertProjectContextMetadata,
} from '../src/project-context-alignment-v1/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

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
  resetWorkspaceTabRegistryForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  invalidateProjectRegistryV1Cache();
  const { createFounderRealityServer } = await import('../server/founder-reality-server.js');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

function seedProjects(testRoot: string): { smartQrId: string; expenseId: string } {
  const stamp = new Date().toISOString();
  const smartQrId = 'smartqr-isolation-1';
  const expenseId = 'expense-isolation-1';
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: smartQrId,
      projects: [
        {
          projectId: smartQrId,
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR product',
        },
        {
          projectId: expenseId,
          name: 'ExpenseTracker',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Expense product',
        },
      ],
    },
    testRoot,
  );
  upsertProjectContextMetadata(
    { projectId: smartQrId, name: 'SmartQR', prompt: 'QR scanning app', profileConfidence: 'HIGH' },
    testRoot,
  );
  upsertProjectContextMetadata(
    {
      projectId: expenseId,
      name: 'ExpenseTracker',
      prompt: 'Expense tracking app',
      profileConfidence: 'HIGH',
    },
    testRoot,
  );
  invalidateProjectRegistryV1Cache();
  return { smartQrId, expenseId };
}

function seedIsolationFixtures(ids: { smartQrId: string; expenseId: string }, testRoot: string): void {
  const stamp = new Date().toISOString();
  recordBuildIntentRun(
    {
      readOnly: true,
      buildRunId: 'run-smartqr-1',
      projectId: ids.smartQrId,
      projectName: 'SmartQR',
      prompt: 'Build QR app',
      profile: 'QR_APP',
      status: 'READY',
      stage: 'LIVE_PREVIEW',
      workspacePath: workspacePathForProject(ids.smartQrId),
      previewUrl: 'http://127.0.0.1:9101',
      activeProjectId: ids.smartQrId,
      planTaskCount: 3,
      architectureSummary: 'QR architecture',
      failureReason: null,
      createdAt: stamp,
      updatedAt: stamp,
    },
    testRoot,
  );
  recordBuildIntentRun(
    {
      readOnly: true,
      buildRunId: 'run-expense-1',
      projectId: ids.expenseId,
      projectName: 'ExpenseTracker',
      prompt: 'Build expense app',
      profile: 'EXPENSE_APP',
      status: 'READY',
      stage: 'LIVE_PREVIEW',
      workspacePath: workspacePathForProject(ids.expenseId),
      previewUrl: 'http://127.0.0.1:9102',
      activeProjectId: ids.expenseId,
      planTaskCount: 4,
      architectureSummary: 'Expense architecture',
      failureReason: null,
      createdAt: stamp,
      updatedAt: stamp,
    },
    testRoot,
  );

  registerProjectBuildResult({
    projectId: ids.smartQrId,
    projectName: 'SmartQR',
    build: {
      readOnly: true,
      buildId: 'run-smartqr-1',
      projectId: ids.smartQrId,
      projectName: 'SmartQR',
      status: 'READY',
      prompt: 'Build QR app',
      requestType: 'CHAT_BUILD',
      workspaceId: ids.smartQrId,
      workspacePath: workspacePathForProject(ids.smartQrId),
      generatedProfile: 'PROJECT_MANAGEMENT_WEB_V1',
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: 'http://127.0.0.1:9101',
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: null,
      updatedAt: stamp,
    },
  });
  registerProjectBuildResult({
    projectId: ids.expenseId,
    projectName: 'ExpenseTracker',
    build: {
      readOnly: true,
      buildId: 'run-expense-1',
      projectId: ids.expenseId,
      projectName: 'ExpenseTracker',
      status: 'READY',
      prompt: 'Build expense app',
      requestType: 'CHAT_BUILD',
      workspaceId: ids.expenseId,
      workspacePath: workspacePathForProject(ids.expenseId),
      generatedProfile: 'PROJECT_MANAGEMENT_WEB_V1',
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: 'http://127.0.0.1:9102',
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: null,
      updatedAt: stamp,
    },
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Isolation Guard V1 — Validation');
  console.log('========================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-isolation-guard']), 'script');
  assert(
    '02. isolation module',
    existsSync(join(ROOT, 'src/project-isolation-guard-v1/index.ts')),
    'module',
  );
  assert('03. workspace write guard', orchestrator.includes('assertWorkspacePathBelongsToProject'), 'orchestrator');
  assert('04. UI notification scoping', appJs.includes('getNotificationsForActiveProject'), 'ui');
  assert('05. UI chat isolation', appJs.includes('projectChatThreads'), 'chat');

  const chatMessages = [
    { projectId: 'smartqr-isolation-1', text: 'QR generation discussion' },
    { projectId: 'expense-isolation-1', text: 'Expense dashboard discussion' },
  ];
  const smartQrChat = filterChatMessagesByProject(chatMessages, 'smartqr-isolation-1');
  const expenseChat = filterChatMessagesByProject(chatMessages, 'expense-isolation-1');
  assert(
    '06. SmartQR chat invisible from ExpenseTracker',
    !expenseChat.some((m) => m.text.includes('QR generation')),
    String(expenseChat.length),
  );
  assert(
    '07. ExpenseTracker chat invisible from SmartQR',
    !smartQrChat.some((m) => m.text.includes('Expense dashboard')),
    String(smartQrChat.length),
  );

  const plans = [
    { projectId: 'smartqr-isolation-1', title: 'QR roadmap' },
    { projectId: 'expense-isolation-1', title: 'Expense roadmap' },
  ];
  assert(
    '08. plans isolated',
    filterPlansByProject(plans, 'smartqr-isolation-1').every((p) => p.projectId === 'smartqr-isolation-1'),
    'plans',
  );

  const memories = [
    { projectId: 'smartqr-isolation-1', domain: 'qr' },
    { projectId: 'expense-isolation-1', domain: 'expense' },
  ];
  assert(
    '09. memory isolated',
    filterMemoryByProject(memories, 'expense-isolation-1').length === 1,
    'memory',
  );

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-isolation-test-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  resetProjectContextMetadataForTests(TEST_ROOT);
  resetBuildIntentRunsForTests(TEST_ROOT);
  await resetModules();
  const ids = seedProjects(TEST_ROOT);
  seedIsolationFixtures(ids, TEST_ROOT);

  const allRuns = listBuildIntentRuns(TEST_ROOT);
  const smartQrRuns = listBuildIntentRunsForProject(ids.smartQrId, TEST_ROOT);
  const expenseRuns = listBuildIntentRunsForProject(ids.expenseId, TEST_ROOT);
  assert('10. build runs isolated', smartQrRuns.every((r) => r.projectId === ids.smartQrId), 'smartqr runs');
  assert(
    '11. ExpenseTracker runs invisible from SmartQR',
    !smartQrRuns.some((r) => r.projectId === ids.expenseId),
    String(smartQrRuns.length),
  );
  assert(
    '12. SmartQR runs invisible from ExpenseTracker',
    !expenseRuns.some((r) => r.projectId === ids.smartQrId),
    String(expenseRuns.length),
  );

  const workspaces = listMultiProjectWorkspaces();
  assert(
    '13. workspaces isolated',
    filterWorkspacesByProject(workspaces, ids.smartQrId).every((w) => w.projectId === ids.smartQrId),
    'workspaces',
  );
  assert(
    '14. scoped workspace list',
    listMultiProjectWorkspacesForProject(ids.expenseId).length === 1,
    'workspace list',
  );

  const previews = [
    { projectId: ids.smartQrId, previewUrl: 'http://127.0.0.1:9101' },
    { projectId: ids.expenseId, previewUrl: 'http://127.0.0.1:9102' },
  ];
  assert(
    '15. live previews isolated',
    filterLivePreviewsByProject(previews, ids.smartQrId).every((p) => p.projectId === ids.smartQrId),
    'previews',
  );

  const founderTests = [
    { projectId: ids.smartQrId, runId: 'ft-smartqr' },
    { projectId: ids.expenseId, runId: 'ft-expense' },
  ];
  assert(
    '16. founder test reports isolated',
    filterFounderTestReportsByProject(founderTests, ids.expenseId).length === 1,
    'founder test',
  );

  const validations = [
    { projectId: ids.smartQrId, report: 'uvl-smartqr' },
    { projectId: ids.expenseId, report: 'uvl-expense' },
  ];
  assert(
    '17. validation reports isolated',
    filterValidationReportsByProject(validations, ids.smartQrId).length === 1,
    'validation',
  );

  const operatorEvents = [
    { projectId: ids.smartQrId, scope: 'PROJECT', eventType: 'Build', timestamp: Date.now(), details: 'QR build' },
    { projectId: ids.expenseId, scope: 'PROJECT', eventType: 'Build', timestamp: Date.now(), details: 'Expense build' },
    { projectId: null, scope: 'GLOBAL', eventType: 'System', timestamp: Date.now(), details: 'Engine online' },
  ];
  const smartQrEvents = filterOperatorEventsByProject(operatorEvents, ids.smartQrId, { includeGlobal: true });
  assert(
    '18. operator events isolated',
    !smartQrEvents.some((e) => e.projectId === ids.expenseId),
    String(smartQrEvents.length),
  );

  const notifications = [
    { projectId: ids.smartQrId, scope: 'PROJECT', text: 'SmartQR ready' },
    { projectId: ids.expenseId, scope: 'PROJECT', text: 'Expense ready' },
    { projectId: null, scope: 'GLOBAL', text: 'System update' },
  ];
  assert(
    '19. notifications isolated',
    !filterNotificationsByProject(notifications, ids.smartQrId, { includeGlobal: true }).some(
      (n) => n.projectId === ids.expenseId,
    ),
    'notifications',
  );

  const insights = [
    { projectId: ids.smartQrId, metric: 'qr-scans' },
    { projectId: ids.expenseId, metric: 'expense-total' },
  ];
  assert(
    '20. project insights isolated',
    filterInsightsByProject(insights, ids.expenseId).length === 1,
    'insights',
  );

  const runtimeStates = [
    { projectId: ids.smartQrId, status: 'READY' },
    { projectId: ids.expenseId, status: 'BUILDING' },
  ];
  assert(
    '21. runtime state isolated',
    filterRuntimeStateByProject(runtimeStates, ids.smartQrId).length === 1,
    'runtime',
  );

  assert(
    '22. workspace path guard rejects cross-project path',
    (() => {
      try {
        assertWorkspacePathBelongsToProject(
          `${GENERATED_BUILDER_WORKSPACES_DIR}/${ids.expenseId}`,
          ids.smartQrId,
        );
        return false;
      } catch {
        return true;
      }
    })(),
    'guard',
  );

  assert(
    '23. write guard requires projectId',
    (() => {
      try {
        requireProjectIdForWrite(null, { domain: 'BUILD_RUN' });
        return false;
      } catch {
        return true;
      }
    })(),
    'write guard',
  );

  const smartQrIsolation = assessProjectIsolationForViewer({
    viewerProjectId: ids.smartQrId,
    rootDir: TEST_ROOT,
    chatMessages: smartQrChat,
    plans: filterPlansByProject(plans, ids.smartQrId),
    founderTestReports: filterFounderTestReportsByProject(founderTests, ids.smartQrId),
    validationReports: filterValidationReportsByProject(validations, ids.smartQrId),
    operatorEvents: smartQrEvents,
    notifications: filterNotificationsByProject(notifications, ids.smartQrId, { includeGlobal: true }),
    insights: filterInsightsByProject(insights, ids.smartQrId),
    runtimeStates: filterRuntimeStateByProject(runtimeStates, ids.smartQrId),
  });
  assert('24. assessor SmartQR ISOLATED', smartQrIsolation.verdict === 'ISOLATED', smartQrIsolation.verdict);
  assert(
    '25. no cross-project leakage detected',
    smartQrIsolation.violations.length === 0,
    String(smartQrIsolation.violations.length),
  );

  const identity = resolveProjectIdentity(ids.smartQrId, TEST_ROOT);
  assert('26. project identity record', identity?.projectId === ids.smartQrId, identity?.projectId ?? 'none');
  assert(
    '27. identity workspace path',
    identity?.workspacePath?.includes(ids.smartQrId) === true,
    identity?.workspacePath ?? 'none',
  );

  const snapshot = buildProductWorkspaceSnapshot([], { rootDir: TEST_ROOT, projectId: ids.smartQrId });
  assert(
    '28. product snapshot scoped memory',
    snapshot.projectMemory.projects.every((p) => p.projectId === ids.smartQrId),
    String(snapshot.projectMemory.projects.length),
  );
  assert(
    '29. product snapshot scoped workspaces',
    snapshot.multiProjectWorkspaces.every((w) => w.projectId === ids.smartQrId),
    String(snapshot.multiProjectWorkspaces.length),
  );

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const res = await fetch(`${baseUrl}/api/product-workspace.json?projectId=${ids.expenseId}`);
    const json = (await res.json()) as {
      projectMemory?: { projects?: Array<{ projectId?: string }> };
      multiProjectWorkspaces?: Array<{ projectId?: string }>;
    };
    assert('30. HTTP snapshot scoped', res.status === 200, String(res.status));
    assert(
      '31. HTTP snapshot excludes SmartQR memory',
      !(json.projectMemory?.projects ?? []).some((p) => p.projectId === ids.smartQrId),
      String(json.projectMemory?.projects?.length),
    );
    assert(
      '32. HTTP snapshot excludes SmartQR workspace tab',
      !(json.multiProjectWorkspaces ?? []).some((w) => w.projectId === ids.smartQrId),
      String(json.multiProjectWorkspaces?.length),
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    await resetModules();
    await settleEventLoop();
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Project Isolation Guard V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PROJECT_ISOLATION_GUARD_PASS_TOKEN);
  console.log('Project isolation guard verified — no cross-project leakage detected.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
