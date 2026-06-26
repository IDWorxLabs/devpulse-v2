/**
 * Project Registry Endpoint Restore V1 — validation.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import {
  PROJECT_REGISTRY_GET_PATHS,
  isProjectRegistryGetPath,
} from '../server/project-registry-handler.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';

export const PROJECT_REGISTRY_ENDPOINTS_PASS_TOKEN = 'PROJECT_REGISTRY_ENDPOINTS_V1_PASS' as const;

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

function seedRegistry(testRoot: string): { lisaId: string; names: string[]; totalActive: number } {
  const stamp = new Date().toISOString();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'lisa-endpoint-1',
      projects: [
        {
          projectId: 'expense-endpoint-1',
          name: 'ExpenseTracker',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Expense tracking',
        },
        {
          projectId: 'lisa-endpoint-1',
          name: 'LISA',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Locked In Syndrome App',
        },
        {
          projectId: 'smartqr-endpoint-1',
          name: 'SmartQR',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'QR scanning',
        },
        {
          projectId: 'archived-endpoint-1',
          name: 'ArchivedProject',
          status: 'ARCHIVED',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Archived',
        },
      ],
    },
    testRoot,
  );
  invalidateProjectRegistryV1Cache();
  return {
    lisaId: 'lisa-endpoint-1',
    names: ['ExpenseTracker', 'LISA', 'SmartQR'],
    totalActive: 3,
  };
}

type RegistryJson = {
  ok?: boolean;
  projects?: { count?: number; items?: Array<{ name?: string; projectId?: string }> };
  activeProjectId?: string | null;
  total?: number;
  active?: number;
  registry?: { projects?: Array<{ name?: string; status?: string }> };
  registryPath?: string;
  updatedAt?: string;
};

function projectNamesFromPayload(json: RegistryJson): string[] {
  if (json.projects && Array.isArray((json.projects as unknown as Array<{ name?: string }>))) {
    return (json.projects as unknown as Array<{ name?: string }>).map((p) => p.name ?? '');
  }
  if (json.projects?.items) {
    return json.projects.items.map((p) => p.name ?? '');
  }
  if (json.registry?.projects) {
    return json.registry.projects
      .filter((p) => p.status === 'ACTIVE')
      .map((p) => p.name ?? '');
  }
  return [];
}

function normalizeRegistryPayloadLikeFrontend(payload: RegistryJson | null): boolean {
  if (!payload) return false;
  if (Array.isArray(payload.projects)) return payload.projects.length > 0;
  if (payload.projects && Array.isArray(payload.projects.items) && payload.projects.items.length) return true;
  if (payload.registry && Array.isArray(payload.registry.projects) && payload.registry.projects.length) return true;
  return false;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Registry Endpoint Restore V1 — Validation');
  console.log('=================================================');
  console.log('');

  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-registry-endpoints']), 'script');
  assert('02. GET /api/projects/registry route', serverTs.includes('/api/projects/registry'), 'registry route');
  assert('03. GET /api/projects alias route', serverTs.includes('/api/projects'), 'projects alias');
  assert(
    '04. registry.json retained',
    PROJECT_REGISTRY_GET_PATHS.includes('/api/projects/registry.json'),
    'registry.json',
  );
  assert('05. isProjectRegistryGetPath helper', isProjectRegistryGetPath('/api/projects/registry'), 'helper');
  assert(
    '06. frontend primary endpoint',
    appJs.includes("endpoint: '/api/projects/registry'"),
    'frontend endpoint',
  );
  assert('07. frontend fallback endpoints', appJs.includes('/api/projects/registry.json'), 'fallback');
  assert('08. frontend normalize projects.items', appJs.includes('Array.isArray(projectsField.items)'), 'normalize');

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-registry-endpoints-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  await resetModules();
  const fixture = seedRegistry(TEST_ROOT);
  const diskState = readProjectRegistryState(TEST_ROOT);

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const registryRes = await fetch(`${baseUrl}/api/projects/registry`);
    const registryJson = (await registryRes.json()) as RegistryJson;
    assert('09. GET /api/projects/registry 200', registryRes.status === 200, String(registryRes.status));
    assert('10. registry ok true', registryJson.ok === true, String(registryJson.ok));
    assert(
      '11. registry projects consumable',
      normalizeRegistryPayloadLikeFrontend(registryJson),
      'projects shape',
    );
    assert(
      '12. registry activeProjectId',
      registryJson.activeProjectId === fixture.lisaId,
      String(registryJson.activeProjectId),
    );
    assert(
      '13. registry total matches disk active count',
      (registryJson.total ?? registryJson.projects?.count) === fixture.totalActive,
      String(registryJson.total ?? registryJson.projects?.count),
    );
    const registryNames = projectNamesFromPayload(registryJson);
    assert('14. ExpenseTracker returned', registryNames.includes('ExpenseTracker'), registryNames.join(','));
    assert('15. LISA returned', registryNames.includes('LISA'), registryNames.join(','));
    assert('16. SmartQR returned', registryNames.includes('SmartQR'), registryNames.join(','));
    assert('17. registryPath present', Boolean(registryJson.registryPath), String(registryJson.registryPath));
    assert('18. updatedAt present', Boolean(registryJson.updatedAt), String(registryJson.updatedAt));

    const projectsRes = await fetch(`${baseUrl}/api/projects`);
    const projectsJson = (await projectsRes.json()) as RegistryJson;
    assert('19. GET /api/projects 200', projectsRes.status === 200, String(projectsRes.status));
    assert('20. /api/projects ok true', projectsJson.ok === true, String(projectsJson.ok));
    assert(
      '21. /api/projects count matches registry file',
      (projectsJson.total ?? projectsJson.projects?.count) === fixture.totalActive,
      String(projectsJson.total ?? projectsJson.projects?.count),
    );

    const jsonRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    assert('22. GET /api/projects/registry.json 200', jsonRes.status === 200, String(jsonRes.status));

    const setActiveRes = await fetch(`${baseUrl}/api/projects/set-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'expense-endpoint-1' }),
    });
    const setActiveJson = (await setActiveRes.json()) as RegistryJson;
    assert('23. POST set-active 200', setActiveRes.status === 200, String(setActiveRes.status));
    assert(
      '24. set-active activeProjectId',
      setActiveJson.activeProjectId === 'expense-endpoint-1',
      String(setActiveJson.activeProjectId),
    );

    const contextRes = await fetch(`${baseUrl}/api/projects/context-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: fixture.lisaId }),
    });
    const contextJson = (await contextRes.json()) as RegistryJson & {
      projectContext?: { projectId?: string };
    };
    assert('25. POST context-switch 200', contextRes.status === 200, String(contextRes.status));
    assert(
      '26. context-switch activeProjectId',
      contextJson.activeProjectId === fixture.lisaId,
      String(contextJson.activeProjectId),
    );
    assert(
      '27. context-switch projectContext',
      contextJson.projectContext?.projectId === fixture.lisaId,
      String(contextJson.projectContext?.projectId),
    );

    assert(
      '28. internal registry loaded but route would 404 without handler',
      diskState.projects.filter((p) => p.status === 'ACTIVE').length === fixture.totalActive &&
        registryRes.status !== 404,
      String(diskState.projects.length),
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
    console.error(`Project Registry Endpoint Restore V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PROJECT_REGISTRY_ENDPOINTS_PASS_TOKEN);
  console.log('Project registry endpoints verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
