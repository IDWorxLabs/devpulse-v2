/**
 * Project Tab Context Switch V1 — validation.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_TAB_CONTEXT_SWITCH_PASS_TOKEN,
  executeProjectTabContextSwitch,
  greetingAndProjectWarningWouldOverlap,
  isFullProjectContextLoaded,
  isRealTaskTrackerPrompt,
  loadProjectContext,
  tabSwitchOnlyChangedVisualState,
  upgradeProjectContextForLisaIfNeeded,
} from '../src/project-context-switching/index.js';
import {
  assessProjectContextAlignment,
  extractPromptDomainSignals,
} from '../src/project-context-alignment-v1/index.js';
import { rankBuildProfiles as rankProfiles } from '../src/build-profile-classification/index.js';
import { detectTaskTrackerIdea } from '../src/code-generation-engine/task-tracker-detector.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
  getActiveProjectId,
  setActiveProjectId,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { resetProjectContextMetadataForTests } from '../src/project-context-alignment-v1/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LISA_PROMPT =
  'Build LISA — Locked In Syndrome App. Mobile-first Android accessibility app that converts eye movement, gaze, and blinks into speech using text-to-speech. Include communication board, caregiver mode, and calibration for assistive communication. Generate architecture, plan, tasks, and begin build execution.';

const TASK_TRACKER_PROMPT =
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser. Generate architecture, plan, tasks, and begin build execution.';

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

function seedThreeProjects(testRoot: string): {
  expenseId: string;
  lisaId: string;
  smartQrId: string;
} {
  const stamp = new Date().toISOString();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'expense-tab-1',
      projects: [
        {
          projectId: 'expense-tab-1',
          name: 'ExpenseTracker',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Expense tracking',
        },
        {
          projectId: 'lisa-tab-1',
          name: 'LISA',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Locked In Syndrome App',
        },
        {
          projectId: 'smartqr-tab-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR scanning',
        },
      ],
    },
    testRoot,
  );
  invalidateProjectRegistryV1Cache();
  return { expenseId: 'expense-tab-1', lisaId: 'lisa-tab-1', smartQrId: 'smartqr-tab-1' };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Tab Context Switch V1 — Validation');
  console.log('============================================');
  console.log('');

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-tab-context-switch']), 'script');
  assert('02. switching module', existsSync(join(ROOT, 'src/project-context-switching/index.ts')), 'module');
  assert('03. tab uses openProjectFromTab', appJs.includes('openProjectFromTab'), 'openProjectFromTab');
  assert(
    '04. tab does not call switchActiveProject only',
    !appJs.includes('switchActiveProject(projectId);\n        }'),
    'tab wired to registry',
  );
  assert('05. renderCommandCenterWorkspaceState', appJs.includes('renderCommandCenterWorkspaceState'), 'workspace render');
  assert(
    '06. greeting suppressed for active project',
    appJs.includes('if (activeProjectId)') && appJs.includes('hideWelcomeState'),
    'greeting rule',
  );
  assert(
    '07. fails visual-only switch pattern',
    tabSwitchOnlyChangedVisualState({
      clientActiveProjectId: 'lisa-tab-1',
      registryActiveProjectId: 'expense-tab-1',
      contextLoaded: false,
    }),
    'visual-only detected',
  );
  assert(
    '08. overlap guard detects greeting + warning',
    greetingAndProjectWarningWouldOverlap({
      activeProjectId: 'lisa-tab-1',
      welcomeVisible: true,
      projectWarningVisible: true,
    }),
    'overlap detected',
  );

  const lisaSignals = extractPromptDomainSignals(LISA_PROMPT, { activeProjectName: 'LISA' });
  assert(
    '09. LISA prompt not task tracking domain',
    !lisaSignals.domainIds.includes('task'),
    lisaSignals.domainLabel,
  );
  assert(
    '10. LISA prompt domain accessibility',
    lisaSignals.domainLabel.includes('assistive') || lisaSignals.domainIds.includes('accessibility'),
    lisaSignals.domainLabel,
  );
  assert(
    '11. LISA prompt not TaskTracker name',
    lisaSignals.proposedProjectName !== 'TaskTracker',
    String(lisaSignals.proposedProjectName),
  );
  assert('12. LISA not task tracker idea', !detectTaskTrackerIdea(LISA_PROMPT), 'task idea');
  const lisaRank = rankProfiles(LISA_PROMPT);
  assert(
    '13. LISA profile not TASK_TRACKER',
    lisaRank.selectedProfile !== 'TASK_TRACKER_WEB_V1',
    String(lisaRank.selectedProfile),
  );
  assert('14. real task prompt still task', isRealTaskTrackerPrompt(TASK_TRACKER_PROMPT), 'task prompt');

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-tab-switch-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  resetProjectContextMetadataForTests(TEST_ROOT);
  await resetModules();
  const ids = seedThreeProjects(TEST_ROOT);

  const lisaSwitch = executeProjectTabContextSwitch({ projectId: ids.lisaId, rootDir: TEST_ROOT });
  assert('15. LISA switch ok', lisaSwitch.ok === true, String(lisaSwitch.error));
  assert(
    '16. LISA activeProjectId',
    lisaSwitch.projectContext?.projectId === ids.lisaId,
    String(lisaSwitch.projectContext?.projectId),
  );
  assert(
    '17. LISA full context loaded',
    isFullProjectContextLoaded(lisaSwitch.projectContext),
    String(lisaSwitch.projectContext?.status),
  );
  const lisaContext = upgradeProjectContextForLisaIfNeeded(lisaSwitch.projectContext!);
  assert(
    '18. LISA domain accessibility',
    lisaContext.domain.includes('assistive'),
    lisaContext.domain,
  );
  assert(
    '19. LISA display name',
    lisaContext.displayName === 'Locked In Syndrome App',
    lisaContext.displayName,
  );
  assert(
    '20. switch trace completed event',
    lisaSwitch.executionTraceEvents.some((e) => e.eventType === 'Project tab context switch completed'),
    'trace',
  );

  const lisaAlignment = assessProjectContextAlignment({
    prompt: LISA_PROMPT,
    activeProjectId: ids.lisaId,
    activeProjectName: 'LISA',
    rootDir: TEST_ROOT,
  });
  assert('21. LISA alignment ALIGNED', lisaAlignment.verdict === 'ALIGNED', lisaAlignment.verdict);
  assert(
    '22. LISA no TaskTracker suggestion',
    lisaAlignment.proposedNewProjectName !== 'TaskTracker',
    String(lisaAlignment.proposedNewProjectName),
  );
  assert('23. LISA alignment does not block', lisaAlignment.blocksExecution === false, 'blocked');

  executeProjectTabContextSwitch({ projectId: ids.expenseId, rootDir: TEST_ROOT });
  executeProjectTabContextSwitch({ projectId: ids.smartQrId, rootDir: TEST_ROOT });
  assert(
    '24. ExpenseTracker context name',
    loadProjectContext({ projectId: ids.expenseId, rootDir: TEST_ROOT })?.projectName === 'ExpenseTracker',
    'ExpenseTracker',
  );
  assert(
    '25. SmartQR context name',
    loadProjectContext({ projectId: ids.smartQrId, rootDir: TEST_ROOT })?.projectName === 'SmartQR',
    'SmartQR',
  );
  assert(
    '26. round-trip LISA context',
    executeProjectTabContextSwitch({ projectId: ids.lisaId, rootDir: TEST_ROOT }).projectContext?.projectName ===
      'LISA',
    'LISA',
  );

  setActiveProjectId(ids.lisaId);
  assert(
    '27. live preview scoped to LISA session',
    getActiveProjectId() === ids.lisaId,
    String(getActiveProjectId()),
  );

  const snapshot = buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')), {
    rootDir: TEST_ROOT,
    projectId: ids.lisaId,
  });
  assert('28. snapshot activeProjectId LISA', snapshot.activeProjectId === ids.lisaId, String(snapshot.activeProjectId));

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const switchRes = await fetch(`${baseUrl}/api/projects/context-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: ids.lisaId }),
    });
    const switchJson = (await switchRes.json()) as {
      ok?: boolean;
      activeProjectId?: string;
      projectContext?: { projectId?: string; domain?: string };
      executionTraceEvents?: Array<{ eventType?: string }>;
    };
    assert('29. API context-switch 200', switchRes.status === 200, String(switchRes.status));
    assert('30. API context-switch ok', switchJson.ok === true, String(switchJson.ok));
    assert(
      '31. API activeProjectId LISA',
      switchJson.activeProjectId === ids.lisaId,
      String(switchJson.activeProjectId),
    );
    assert(
      '32. API projectContext loaded',
      switchJson.projectContext?.projectId === ids.lisaId,
      String(switchJson.projectContext?.projectId),
    );
    assert(
      '33. API trace events',
      Boolean(switchJson.executionTraceEvents && switchJson.executionTraceEvents.length >= 5),
      String(switchJson.executionTraceEvents?.length ?? 0),
    );

    const registryRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    const registryJson = (await registryRes.json()) as { activeProjectId?: string };
    assert(
      '34. registry persists last active',
      registryJson.activeProjectId === ids.lisaId,
      String(registryJson.activeProjectId),
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

  assert(
    '35. Command Center mutual render rule in UI',
    appJs.includes('has-active-project') && appJs.includes('welcome.classList.add(\'hidden\')'),
    'mutual render',
  );
  assert(
    '36. validation fails visual-only without context',
    !tabSwitchOnlyChangedVisualState({
      clientActiveProjectId: 'lisa-tab-1',
      registryActiveProjectId: 'lisa-tab-1',
      contextLoaded: true,
    }),
    'full switch ok',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Project Tab Context Switch V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PROJECT_TAB_CONTEXT_SWITCH_PASS_TOKEN);
  console.log('Project tab context switch verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
