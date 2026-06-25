/**
 * Project Registry Consistency V1 — project creation, persistence, and UI sync.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Server } from 'node:http';
import {
  PROJECT_REGISTRY_V1_PASS_TOKEN,
  getProjectRegistryV1FilePath,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { resetWorkspaceTabRegistryForTests } from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { resetDevPulseV2ProjectVaultAuthorityForTests } from '../src/project-vault/project-vault-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function startTestServer(): Promise<{ server: Server; baseUrl: string }> {
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
  console.log('Project Registry Consistency V1 — Validation');
  console.log('============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const html = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-registry-consistency-v1']), 'script');
  assert('02. registry store module', existsSync(join(ROOT, 'src/project-registry-v1/project-registry-v1-store.ts')), 'store');
  assert('03. registry handler', existsSync(join(ROOT, 'server/project-registry-handler.ts')), 'handler');
  assert('04. project name dialog', html.includes('id="project-name-dialog"'), 'dialog');
  assert('05. create project form', html.includes('id="project-name-form"'), 'form');
  assert('06. registry API route', serverTs.includes('/api/projects/registry.json'), 'registry route');
  assert('07. create API route', serverTs.includes('/api/projects/create'), 'create route');
  assert('08. rename API route', serverTs.includes('/api/projects/rename'), 'rename route');
  assert('09. set-active API route', serverTs.includes('/api/projects/set-active'), 'set-active route');
  assert('10. UI createProjectViaRegistry', appJs.includes('createProjectViaRegistry'), 'client create');
  assert('11. UI mutateProjectRegistry', appJs.includes('mutateProjectRegistry'), 'client mutate');
  assert('12. UI project actions', appJs.includes('data-project-action'), 'actions');
  assert('13. UI registry load', appJs.includes('loadProjectRegistryState'), 'load');
  assert('14. projects page totals', appJs.includes('ws.projects.count'), 'totals');
  assert('15. no auto Project N on click', !appJs.includes("createNewProjectTab('Project ' + (projectTabCounter + 1))"), 'no auto name');

  resetProjectRegistryV1ForTests(ROOT);
  resetWorkspaceTabRegistryForTests();
  resetDevPulseV2ProjectVaultAuthorityForTests();

  const { server, baseUrl } = await startTestServer();
  try {
    const createRes = await fetch(`${baseUrl}/api/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'LISA' }),
    });
    const createJson = (await createRes.json()) as {
      ok?: boolean;
      project?: { projectId?: string; name?: string };
      activeProjectId?: string | null;
      projects?: { count?: number; activeCount?: number; items?: Array<{ name?: string; isActive?: boolean }> };
      multiProjectWorkspaces?: Array<{ projectId?: string; projectName?: string }>;
    };
    assert('20. create LISA status 200', createRes.status === 200, String(createRes.status));
    assert('21. create LISA ok', createJson.ok === true, String(createJson.ok));
    assert('22. project name LISA', createJson.project?.name === 'LISA', createJson.project?.name ?? 'missing');
    assert('23. LISA is active', createJson.project?.projectId === createJson.activeProjectId, String(createJson.activeProjectId));
    assert('24. projects count 1', createJson.projects?.count === 1, String(createJson.projects?.count));
    assert('25. active count 1', createJson.projects?.activeCount === 1, String(createJson.projects?.activeCount));
    assert(
      '26. workspace tab synced',
      (createJson.multiProjectWorkspaces ?? []).some((w) => w.projectName === 'LISA'),
      String(createJson.multiProjectWorkspaces?.length ?? 0),
    );

    const registryPath = getProjectRegistryV1FilePath(ROOT);
    assert('27. registry file persisted', existsSync(registryPath), registryPath);
    const registryFile = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      activeProjectId?: string | null;
      projects?: Array<{ name?: string; status?: string }>;
    };
    assert('28. registry file has LISA', registryFile.projects?.some((p) => p.name === 'LISA') === true, 'LISA');
    assert('29. registry activeProjectId set', Boolean(registryFile.activeProjectId), String(registryFile.activeProjectId));

    const renameRes = await fetch(`${baseUrl}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: createJson.project?.projectId, name: 'LISA Platform' }),
    });
    const renameJson = (await renameRes.json()) as { project?: { name?: string } };
    assert('30. rename status 200', renameRes.status === 200, String(renameRes.status));
    assert('31. renamed project', renameJson.project?.name === 'LISA Platform', renameJson.project?.name ?? 'missing');

    const renameBackRes = await fetch(`${baseUrl}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: createJson.project?.projectId, name: 'LISA' }),
    });
    assert('32. rename back 200', renameBackRes.status === 200, String(renameBackRes.status));

    const workspaceRes = await fetch(`${baseUrl}/api/product-workspace.json`);
    const workspaceJson = (await workspaceRes.json()) as {
      projects?: { count?: number; activeCount?: number; items?: Array<{ name?: string; isActive?: boolean }> };
      activeProjectId?: string | null;
      multiProjectWorkspaces?: Array<{ projectName?: string }>;
    };
    assert('33. workspace projects count 1', workspaceJson.projects?.count === 1, String(workspaceJson.projects?.count));
    assert('34. workspace active count 1', workspaceJson.projects?.activeCount === 1, String(workspaceJson.projects?.activeCount));
    assert(
      '35. workspace lists LISA',
      workspaceJson.projects?.items?.some((p) => p.name === 'LISA') === true,
      workspaceJson.projects?.items?.[0]?.name ?? 'none',
    );
    assert(
      '36. workspace activeProjectId synced',
      workspaceJson.activeProjectId === createJson.project?.projectId,
      String(workspaceJson.activeProjectId),
    );
    assert(
      '37. workspace multiProjectWorkspaces synced',
      (workspaceJson.multiProjectWorkspaces ?? []).some((w) => w.projectName === 'LISA'),
      String(workspaceJson.multiProjectWorkspaces?.length ?? 0),
    );

    const refreshRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    const refreshJson = (await refreshRes.json()) as {
      projects?: { count?: number; items?: Array<{ name?: string; isActive?: boolean }> };
      activeProjectId?: string | null;
    };
    assert('38. refresh registry 200', refreshRes.status === 200, String(refreshRes.status));
    assert('39. refresh retains LISA', refreshJson.projects?.items?.some((p) => p.name === 'LISA') === true, 'missing');
    assert(
      '40. refresh retains active',
      refreshJson.projects?.items?.some((p) => p.name === 'LISA' && p.isActive) === true,
      'inactive',
    );
    assert(
      '41. refresh activeProjectId',
      refreshJson.activeProjectId === createJson.project?.projectId,
      String(refreshJson.activeProjectId),
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Project Registry Consistency V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PROJECT_REGISTRY_V1_PASS_TOKEN);
  console.log('Project registry creation, persistence, and synchronization verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
