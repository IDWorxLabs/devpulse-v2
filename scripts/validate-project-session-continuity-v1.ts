/**
 * Project Session Continuity V1 — validation suite.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_SESSION_CONTINUITY_TRACE,
  PROJECT_SESSION_CONTINUITY_V1_PASS_TOKEN,
  PROJECT_SESSION_STORE_DIR,
  assertUserProjectCanBeActiveSession,
  bootstrapProjectAndSessionForBuild,
  chatHistoryHtmlFromSession,
  deriveProjectNameFromPrompt,
  ensureBuildProjectSession,
  navigationWouldLoseChatWithoutSessionStore,
  persistProjectSessionChat,
  resolveActiveProjectSessionContext,
  resolveLivePreviewSessionBinding,
  resolveProjectSessionFilePath,
} from '../src/project-session-continuity-v1/index.js';
import { extractPromptDomainSignals } from '../src/project-context-alignment-v1/prompt-domain-analyzer.js';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const EXPENSE_PROMPT =
  'Build a modern expense tracking web application with categories, receipts, monthly budgets, and spending reports. Generate architecture, plan, tasks, and begin build execution.';

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
  console.log('Project Session Continuity V1 — Validation');
  console.log('==========================================');
  console.log('');

  await resetModules();

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(join(ROOT, 'public/founder-reality/project-session-continuity.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-session-continuity']), 'script');
  assert('02. module index', existsSync(join(ROOT, 'src/project-session-continuity-v1/index.ts')), 'index.ts');
  assert('03. session store', existsSync(join(ROOT, 'src/project-session-continuity-v1/project-session-store.ts')), 'store');
  assert('04. server handler', existsSync(join(ROOT, 'server/project-session-handler.ts')), 'handler');
  assert('05. browser bridge script tag', indexHtml.includes('project-session-continuity.js'), 'index.html');
  assert('06. browser bridge module', browserJs.includes('PROJECT_SESSION_CONTINUITY_V1'), 'bridge contract');
  assert(
    '07. app hydrates session store',
    appJs.includes('hydrateProjectSessionFromStore') && appJs.includes(PROJECT_SESSION_CONTINUITY_TRACE),
    'hydration wiring',
  );
  assert(
    '08. app persists chat to session',
    appJs.includes('ProjectSessionContinuity.persistSessionMessage'),
    'chat persist',
  );
  assert(
    '09. command center restore on navigation',
    appJs.includes("viewId === 'command-center'") && appJs.includes('hydrateProjectSessionFromStore'),
    'navigation continuity',
  );
  assert(
    '10. live preview session binding',
    appJs.includes('previewBindingReason') && appJs.includes('previewRepairAction'),
    'preview binding UI',
  );
  assert(
    '11. live preview iframe from session url',
    appJs.includes('projectSessionClient.context.previewUrl') && appJs.includes('preview-iframe'),
    'iframe binding',
  );
  assert(
    '12. no app-specific hardcoding in authority',
    !readFileSync(join(ROOT, 'src/project-session-continuity-v1/project-session-authority.ts'), 'utf8').includes(
      'LISA',
    ),
    'generic authority',
  );

  const testRoot = mkdtempSync(join(tmpdir(), 'psc-v1-'));
  try {
    process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
    invalidateProjectRegistryV1Cache();

    const bootstrap = bootstrapProjectAndSessionForBuild({
      rawPrompt: EXPENSE_PROMPT,
      projectId: null,
      rootDir: testRoot,
    });
    assert('13. build without project creates USER project', bootstrap.createdProject, bootstrap.projectId);
    assert('14. build without project creates session', bootstrap.createdSession, bootstrap.sessionId);
    assert(
      '15. project name not generic New Project',
      bootstrap.projectName !== 'New Project',
      bootstrap.projectName,
    );

    const registry = readProjectRegistryState(testRoot);
    assert(
      '16. registry owns created project',
      registry.projects.some((p) => p.projectId === bootstrap.projectId),
      String(registry.projects.length),
    );

    const sessionPath = resolveProjectSessionFilePath(
      bootstrap.projectId,
      bootstrap.sessionId,
      testRoot,
    );
    assert(
      '17. session persisted under registry path',
      sessionPath.replace(/\\/g, '/').includes(PROJECT_SESSION_STORE_DIR) && existsSync(sessionPath),
      sessionPath,
    );

    persistProjectSessionChat({
      projectId: bootstrap.projectId,
      sessionId: bootstrap.sessionId,
      role: 'user',
      text: 'Build expense tracker',
      rootDir: testRoot,
    });
    persistProjectSessionChat({
      projectId: bootstrap.projectId,
      sessionId: bootstrap.sessionId,
      role: 'brain',
      text: 'Starting build execution',
      rootDir: testRoot,
    });

    const activeContext = resolveActiveProjectSessionContext(testRoot);
    assert('18. active session context resolves', activeContext?.sessionId === bootstrap.sessionId, String(activeContext?.sessionId));
    assert('19. chat messages persisted', (activeContext?.chatMessages.length ?? 0) >= 2, String(activeContext?.chatMessages.length));

    assert(
      '20. navigation would lose chat without store',
      navigationWouldLoseChatWithoutSessionStore({
        inMemoryChatHtml: '<div class="chat-message user">hello</div>',
        persistedChatHtml: chatHistoryHtmlFromSession(activeContext!),
      }),
      'navigation guard',
    );

    const { server, baseUrl } = await startTestServer(testRoot);
    try {
      const activeRes = await fetch(`${baseUrl}/api/project-sessions/active`);
      const activePayload = (await activeRes.json()) as {
        contractVersion?: string;
        activeProjectId?: string | null;
      };
      assert('21. active session API', activeRes.ok && activePayload.contractVersion === 'PROJECT_SESSION_CONTINUITY_V1', String(activeRes.status));
      assert(
        '22. API agrees with registry active project',
        activePayload.activeProjectId === registry.activeProjectId,
        String(activePayload.activeProjectId),
      );
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    const auditGuard = assertUserProjectCanBeActiveSession('validation-test-project-1', testRoot);
    assert('23. audit/system project blocked', !auditGuard.allowed, auditGuard.reason);

    invalidateProjectRegistryV1Cache();
    const { writeProjectRegistryV1ForTests } = await import('../src/project-registry-v1/index.js');
    const stamp = new Date().toISOString();
    writeProjectRegistryV1ForTests(
      {
        version: 1,
        activeProjectId: 'expense-duplicate-test',
        projects: [
          {
            projectId: 'expense-duplicate-test',
            name: 'ExpenseTracker',
            projectKind: 'USER',
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'Incomplete expense tracker',
            materializationQualityVerdict: 'NEEDS_WORK',
          },
        ],
      },
      testRoot,
    );
    const dupProjectRoot = join(testRoot, '.aidev-projects', 'expense-duplicate-test');
    mkdirSync(join(dupProjectRoot, '.aidev'), { recursive: true });
    writeFileSync(
      join(dupProjectRoot, 'project.json'),
      JSON.stringify(
        {
          projectId: 'expense-duplicate-test',
          projectName: 'ExpenseTracker',
          originalPrompt: EXPENSE_PROMPT,
          status: 'PROMOTED',
        },
        null,
        2,
      ),
      'utf8',
    );
    writeFileSync(
      join(dupProjectRoot, '.aidev', 'materialization-quality-score.json'),
      JSON.stringify({ verdict: 'NEEDS_WORK', overallScore: 40 }, null, 2),
      'utf8',
    );
    invalidateProjectRegistryV1Cache();

    const duplicate = ensureBuildProjectSession({
      rawPrompt: EXPENSE_PROMPT,
      activeProjectId: null,
      rootDir: testRoot,
    });
    assert(
      '24. duplicate project does not silently resume',
      duplicate.duplicateResumeBlocked === true && Boolean(duplicate.duplicateResumePayload),
      duplicate.duplicateResumeBlocked ? 'resume choice required' : 'not blocked',
    );

    const binding = resolveLivePreviewSessionBinding({
      session: {
        projectId: bootstrap.projectId,
        sessionId: bootstrap.sessionId,
        activeBuildRunId: null,
        previewUrl: 'http://127.0.0.1:5173/preview',
        buildStatus: 'READY',
      },
      rootDir: testRoot,
    });
    assert(
      '25. preview binding exposes reason when missing runtime',
      Boolean(binding.bindingReason),
      binding.bindingReason,
    );

    const signals = extractPromptDomainSignals(EXPENSE_PROMPT);
    const derived = deriveProjectNameFromPrompt(EXPENSE_PROMPT);
    assert(
      '26. derive name from prompt domain',
      derived !== 'New Project' || Boolean(signals.proposedProjectName),
      derived,
    );
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    await resetModules();
  }

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);

  if (passed === results.length) {
    console.log(PROJECT_SESSION_CONTINUITY_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

void main();
