/**
 * Project Context Alignment Guard V1 — validation.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_CONTEXT_ALIGNMENT_PASS_TOKEN,
  assessProjectContextAlignment,
  resetProjectContextMetadataForTests,
  upsertProjectContextMetadata,
  type ProjectContextAlignmentVerdict,
} from '../src/project-context-alignment-v1/index.js';
import {
  resetBuildIntentRunsForTests,
  listBuildIntentRuns,
} from '../src/build-intent-routing/index.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { BUILD_FROM_PROMPT_API_PATH } from '../src/one-prompt-live-preview/one-prompt-live-preview-registry.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const EXPENSE_PROMPT =
  'Build a modern expense tracking web application with categories, receipts, monthly budgets, and spending reports. Generate architecture, plan, tasks, and begin build execution.';

const QR_PROMPT =
  'Build a modern QR code scanning web application with camera scan, URL redirect, and scan history. Generate architecture, plan, tasks, and begin build execution.';

const GENERIC_PROMPT = 'What should I do next on this project?';

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

function seedRegistry(testRoot: string): {
  smartQrId: string;
  expenseId: string;
} {
  const stamp = new Date().toISOString();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'smartqr-test-1',
      projects: [
        {
          projectId: 'smartqr-test-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR code scanning product',
        },
        {
          projectId: 'expense-test-1',
          name: 'ExpenseTracker',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Expense tracking product',
        },
      ],
    },
    testRoot,
  );
  upsertProjectContextMetadata(
    {
      projectId: 'smartqr-test-1',
      name: 'SmartQR',
      prompt: QR_PROMPT,
      profileConfidence: 'HIGH',
    },
    testRoot,
  );
  upsertProjectContextMetadata(
    {
      projectId: 'expense-test-1',
      name: 'ExpenseTracker',
      prompt: EXPENSE_PROMPT,
      profile: 'PROJECT_MANAGEMENT_WEB_V1',
      summary: EXPENSE_PROMPT.slice(0, 120),
      profileConfidence: 'HIGH',
    },
    testRoot,
  );
  invalidateProjectRegistryV1Cache();
  return { smartQrId: 'smartqr-test-1', expenseId: 'expense-test-1' };
}

function writeMetadataKeywords(
  testRoot: string,
  projectId: string,
  name: string,
  keywords: string[],
  domain: string,
): void {
  const path = join(testRoot, '.aidevengine', 'project-context-metadata-v1.json');
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        version: 1,
        projects: {
          [projectId]: {
            readOnly: true,
            projectId,
            name,
            domain,
            appType: 'application',
            keywords,
            profile: null,
            lastBuildIntentSummary: null,
            profileConfidence: 'MEDIUM',
            updatedAt: new Date().toISOString(),
          },
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

function assertVerdict(
  label: string,
  expected: ProjectContextAlignmentVerdict,
  input: Parameters<typeof assessProjectContextAlignment>[0],
): void {
  const result = assessProjectContextAlignment(input);
  assert(label, result.verdict === expected, `${result.verdict} (score=${result.alignmentScore})`);
}

async function brainPost(
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseUrl}/api/brain/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { ...json, _httpStatus: res.status };
}

async function buildFromPromptPost(
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseUrl}${BUILD_FROM_PROMPT_API_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { ...json, _httpStatus: res.status, _alignmentHeader: res.headers.get('X-DevPulse-Alignment') };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Context Alignment Guard V1 — Validation');
  console.log('==============================================');
  console.log('');

  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const buildHandler = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-context-alignment']), 'script');
  assert('02. alignment module', existsSync(join(ROOT, 'src/project-context-alignment-v1/index.ts')), 'module');
  assert('03. brain handler runs guard', brainHandler.includes('assessProjectContextAlignment'), 'brain');
  assert(
    '04. brain handler blocks before build',
    /if \(isBuildIntentRequest\(body\.message\)\) \{[\s\S]*assessProjectContextAlignment[\s\S]*alignmentBlocksBuildExecution[\s\S]*runOnePromptLivePreviewBuild/.test(
      brainHandler,
    ),
    'brain order',
  );
  assert('05. build-from-prompt handler runs guard', buildHandler.includes('assessProjectContextAlignment'), 'build');
  assert(
    '06. build-from-prompt blocks before build',
    /assessProjectContextAlignment[\s\S]*alignmentBlocksBuildExecution[\s\S]*runOnePromptLivePreviewBuild/.test(
      buildHandler,
    ),
    'build order',
  );
  assert(
    '07. build-from-prompt honors confirm override',
    buildHandler.includes('confirmProjectContextAlignment'),
    'confirm',
  );
  assert('08. UI alignment actions', appJs.includes('appendChatAlignmentActions'), 'ui');
  assert('09. UI confirm continue', appJs.includes('confirmProjectContextAlignment'), 'ui confirm');

  const VERDICT_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-alignment-verdicts-'));
  resetProjectRegistryV1ForTests(VERDICT_ROOT);
  resetProjectContextMetadataForTests(VERDICT_ROOT);
  const stamp = new Date().toISOString();

  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'expense-test-1',
      projects: [
        {
          projectId: 'expense-test-1',
          name: 'ExpenseTracker',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Expense tracking product',
        },
      ],
    },
    VERDICT_ROOT,
  );
  upsertProjectContextMetadata(
    {
      projectId: 'expense-test-1',
      name: 'ExpenseTracker',
      prompt: EXPENSE_PROMPT,
      profileConfidence: 'HIGH',
    },
    VERDICT_ROOT,
  );
  assertVerdict('10. verdict ALIGNED', 'ALIGNED', {
    prompt: EXPENSE_PROMPT,
    activeProjectId: 'expense-test-1',
    activeProjectName: 'ExpenseTracker',
    rootDir: VERDICT_ROOT,
  });

  resetProjectRegistryV1ForTests(VERDICT_ROOT);
  resetProjectContextMetadataForTests(VERDICT_ROOT);
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'smartqr-test-1',
      projects: [
        {
          projectId: 'smartqr-test-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR code scanning product',
        },
        {
          projectId: 'expense-test-1',
          name: 'ExpenseTracker',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Expense tracking product',
        },
      ],
    },
    VERDICT_ROOT,
  );
  upsertProjectContextMetadata(
    { projectId: 'smartqr-test-1', name: 'SmartQR', prompt: QR_PROMPT, profileConfidence: 'HIGH' },
    VERDICT_ROOT,
  );
  upsertProjectContextMetadata(
    { projectId: 'expense-test-1', name: 'ExpenseTracker', prompt: EXPENSE_PROMPT, profileConfidence: 'HIGH' },
    VERDICT_ROOT,
  );
  assertVerdict('11. verdict BELONGS_TO_EXISTING_PROJECT', 'BELONGS_TO_EXISTING_PROJECT', {
    prompt: EXPENSE_PROMPT,
    activeProjectId: 'smartqr-test-1',
    activeProjectName: 'SmartQR',
    rootDir: VERDICT_ROOT,
  });

  resetProjectRegistryV1ForTests(VERDICT_ROOT);
  resetProjectContextMetadataForTests(VERDICT_ROOT);
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'smartqr-test-1',
      projects: [
        {
          projectId: 'smartqr-test-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR code scanning product',
        },
      ],
    },
    VERDICT_ROOT,
  );
  upsertProjectContextMetadata(
    { projectId: 'smartqr-test-1', name: 'SmartQR', prompt: QR_PROMPT, profileConfidence: 'HIGH' },
    VERDICT_ROOT,
  );
  assertVerdict('12. verdict DEFINITELY_MISPLACED', 'DEFINITELY_MISPLACED', {
    prompt: EXPENSE_PROMPT,
    activeProjectId: 'smartqr-test-1',
    activeProjectName: 'SmartQR',
    rootDir: VERDICT_ROOT,
  });

  resetProjectRegistryV1ForTests(VERDICT_ROOT);
  resetProjectContextMetadataForTests(VERDICT_ROOT);
  invalidateProjectRegistryV1Cache();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'generic-test-1',
      projects: [
        {
          projectId: 'generic-test-1',
          name: 'MyWorkspace',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Generic workspace',
        },
        {
          projectId: 'qr-peer-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR peer project',
        },
      ],
    },
    VERDICT_ROOT,
  );
  upsertProjectContextMetadata(
    { projectId: 'qr-peer-1', name: 'SmartQR', prompt: QR_PROMPT, profileConfidence: 'HIGH' },
    VERDICT_ROOT,
  );
  assertVerdict('13. verdict NEW_PROJECT_SUGGESTED', 'NEW_PROJECT_SUGGESTED', {
    prompt: EXPENSE_PROMPT,
    activeProjectId: 'generic-test-1',
    activeProjectName: 'MyWorkspace',
    rootDir: VERDICT_ROOT,
  });

  resetProjectRegistryV1ForTests(VERDICT_ROOT);
  resetProjectContextMetadataForTests(VERDICT_ROOT);
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'mixed-test-1',
      projects: [
        {
          projectId: 'mixed-test-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Mixed domain project',
        },
      ],
    },
    VERDICT_ROOT,
  );
  writeMetadataKeywords(
    VERDICT_ROOT,
    'mixed-test-1',
    'SmartQR',
    ['qr', 'expense', 'task'],
    'QR / barcode scanning',
  );
  assertVerdict('14. verdict POSSIBLY_MISPLACED', 'POSSIBLY_MISPLACED', {
    prompt: EXPENSE_PROMPT,
    activeProjectId: 'mixed-test-1',
    activeProjectName: 'SmartQR',
    rootDir: VERDICT_ROOT,
  });

  resetProjectRegistryV1ForTests(VERDICT_ROOT);
  resetProjectContextMetadataForTests(VERDICT_ROOT);
  invalidateProjectRegistryV1Cache();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'generic-summary-1',
      projects: [
        {
          projectId: 'generic-summary-1',
          name: 'ProjectX',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Generic project',
        },
      ],
    },
    VERDICT_ROOT,
  );
  writeFileSync(
    join(VERDICT_ROOT, '.aidevengine', 'project-context-metadata-v1.json'),
    `${JSON.stringify(
      {
        version: 1,
        projects: {
          'generic-summary-1': {
            readOnly: true,
            projectId: 'generic-summary-1',
            name: 'ProjectX',
            domain: 'general application',
            appType: 'application',
            keywords: [],
            profile: null,
            lastBuildIntentSummary: QR_PROMPT,
            profileConfidence: 'LOW',
            updatedAt: new Date().toISOString(),
          },
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  assertVerdict('15. lastBuildIntentSummary boosts alignment', 'ALIGNED', {
    prompt: QR_PROMPT,
    activeProjectId: 'generic-summary-1',
    activeProjectName: 'ProjectX',
    rootDir: VERDICT_ROOT,
  });

  rmSync(VERDICT_ROOT, { recursive: true, force: true });

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-alignment-test-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  resetProjectContextMetadataForTests(TEST_ROOT);
  resetBuildIntentRunsForTests(TEST_ROOT);
  await resetModules();
  const ids = seedRegistry(TEST_ROOT);

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const runsBefore = listBuildIntentRuns(TEST_ROOT).length;
    const misplaced = await brainPost(baseUrl, {
      message: EXPENSE_PROMPT,
      timestamp: Date.now(),
      activeProjectId: ids.smartQrId,
      projectName: 'SmartQR',
    });
    assert('16. SmartQR expense HTTP 200', misplaced._httpStatus === 200, String(misplaced._httpStatus));
    assert(
      '17. SmartQR expense blocked category',
      misplaced.category === 'PROJECT_CONTEXT_ALIGNMENT',
      String(misplaced.category),
    );
    assert('18. brain no buildRunId', !misplaced.buildRunId, String(misplaced.buildRunId));
    const runsAfterMisplaced = listBuildIntentRuns(TEST_ROOT).length;
    assert('19. brain no build run persisted', runsAfterMisplaced === runsBefore, `${runsBefore}->${runsAfterMisplaced}`);
    const workspaceProbe = join(TEST_ROOT, GENERATED_BUILDER_WORKSPACES_DIR, ids.smartQrId);
    assert('20. brain no workspace materialization', !existsSync(workspaceProbe), workspaceProbe);

    const directBlocked = await buildFromPromptPost(baseUrl, {
      prompt: EXPENSE_PROMPT,
      projectId: ids.smartQrId,
      projectName: 'SmartQR',
    });
    assert('21. direct build HTTP 200', directBlocked._httpStatus === 200, String(directBlocked._httpStatus));
    assert('22. direct build ok false', directBlocked.ok === false, String(directBlocked.ok));
    assert(
      '23. direct build alignment category',
      directBlocked.category === 'PROJECT_CONTEXT_ALIGNMENT',
      String(directBlocked.category),
    );
    assert(
      '24. direct build alignment header',
      Boolean(directBlocked._alignmentHeader),
      String(directBlocked._alignmentHeader),
    );
    assert('25. direct build no build payload', !directBlocked.build, String(directBlocked.build));
    assert(
      '26. direct build projectContextAlignment',
      Boolean(directBlocked.projectContextAlignment),
      'missing alignment',
    );
    const runsAfterDirectBlocked = listBuildIntentRuns(TEST_ROOT).length;
    assert(
      '27. direct build no build run persisted',
      runsAfterDirectBlocked === runsBefore,
      `${runsBefore}->${runsAfterDirectBlocked}`,
    );
    assert(
      '28. direct build no workspace materialization',
      !existsSync(workspaceProbe),
      workspaceProbe,
    );

    const directOverride = await buildFromPromptPost(baseUrl, {
      prompt: EXPENSE_PROMPT,
      projectId: ids.smartQrId,
      projectName: 'SmartQR',
      confirmProjectContextAlignment: true,
    });
    assert('29. direct override not alignment blocked', directOverride.category !== 'PROJECT_CONTEXT_ALIGNMENT', String(directOverride.category));
    assert('30. direct override starts build', Boolean(directOverride.build), String(directOverride.build));

    const generic = await brainPost(baseUrl, {
      message: GENERIC_PROMPT,
      timestamp: Date.now(),
      activeProjectId: ids.smartQrId,
      projectName: 'SmartQR',
    });
    assert(
      '31. generic chat not alignment blocked',
      generic.category !== 'PROJECT_CONTEXT_ALIGNMENT',
      String(generic.category),
    );

    const expenseActive = await brainPost(baseUrl, {
      message: EXPENSE_PROMPT,
      timestamp: Date.now(),
      activeProjectId: ids.expenseId,
      projectName: 'ExpenseTracker',
    });
    assert('32. ExpenseTracker build category', expenseActive.category === 'BUILD', String(expenseActive.category));
    assert('33. ExpenseTracker buildRunId', Boolean(expenseActive.buildRunId), String(expenseActive.buildRunId));

    const qrBuild = await brainPost(baseUrl, {
      message: QR_PROMPT,
      timestamp: Date.now(),
      activeProjectId: ids.smartQrId,
      projectName: 'SmartQR',
    });
    assert('34. SmartQR QR build category', qrBuild.category === 'BUILD', String(qrBuild.category));
    assert('35. SmartQR QR buildRunId', Boolean(qrBuild.buildRunId), String(qrBuild.buildRunId));
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
    console.error(`Project Context Alignment Guard V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PROJECT_CONTEXT_ALIGNMENT_PASS_TOKEN);
  console.log('Project context alignment guard verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
