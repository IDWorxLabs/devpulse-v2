/**
 * Project Lifecycle Delete Route V1 — regression validation.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_DELETED_SUCCESSFULLY,
  PROJECT_LIFECYCLE_DELETE_ROUTE_V1_PASS_TOKEN,
} from '../src/project-lifecycle-management-v1/project-lifecycle-types.js';
import {
  createRegistryProject,
  getRegistryProject,
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { persistentProjectPaths } from '../src/persistent-project-reality/persistent-project-reality-paths.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
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

async function postJson(baseUrl: string, path: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function requestMethod(baseUrl: string, path: string, method: string) {
  const res = await fetch(`${baseUrl}${path}`, { method });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }
  }
  return { status: res.status, json };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Lifecycle Delete Route V1 — Validation');
  console.log('================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const routerTs = readFileSync(join(ROOT, 'server/project-api-router.ts'), 'utf8');

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-lifecycle-delete-route']), 'script');
  assert('02. project api router', existsSync(join(ROOT, 'server/project-api-router.ts')), 'router');
  assert('03. router registers delete', routerTs.includes('/api/projects/delete'), 'delete path');
  assert('04. server uses router', serverTs.includes('tryHandleProjectApiRequest'), 'router wired');
  assert('05. UI uses POST delete', appJs.includes("fetch('/api/projects/delete'"), 'POST delete');
  assert('06. UI not GET delete', !appJs.includes("fetch('/api/projects/delete', { method: 'GET'"), 'no GET');

  const testRoot = mkdtempSync(join(tmpdir(), 'project-delete-route-'));
  try {
    resetProjectRegistryV1ForTests(testRoot);
    const created = createRegistryProject({ name: 'Delete Route Test', rootDir: testRoot });
    const paths = persistentProjectPaths(testRoot, created.projectId);
    mkdirSync(paths.source, { recursive: true });
    writeFileSync(join(paths.source, 'App.tsx'), 'export default function App() { return null; }', 'utf8');
    mkdirSync(join(testRoot, GENERATED_BUILDER_WORKSPACES_DIR, created.projectId), { recursive: true });

    const { server, baseUrl } = await startTestServer(testRoot);
    try {
      const getDelete = await requestMethod(baseUrl, '/api/projects/delete', 'GET');
      assert('07. GET delete returns 405', getDelete.status === 405, String(getDelete.status));

      const putDelete = await requestMethod(baseUrl, '/api/projects/delete', 'PUT');
      assert('08. PUT delete returns 405', putDelete.status === 405, String(putDelete.status));

      const preview = await postJson(baseUrl, '/api/projects/delete', {
        projectId: created.projectId,
        confirmed: false,
      });
      assert('09. preview HTTP 200', preview.status === 200, String(preview.status));
      assert('10. preview ok true', preview.json?.ok === true, String(preview.json?.ok));
      assert('11. preview deleted false', preview.json?.deleted === false, String(preview.json?.deleted));
      assert(
        '12. preview requires confirmation',
        preview.json?.requiresConfirmation === true,
        String(preview.json?.requiresConfirmation),
      );
      assert(
        '13. preview audit steps',
        Array.isArray(preview.json?.auditSteps) && preview.json.auditSteps.length > 0,
        String(preview.json?.auditSteps?.length),
      );
      assert(
        '14. project still exists after preview',
        Boolean(getRegistryProject(created.projectId, testRoot)),
        'exists',
      );

      const deleted = await postJson(baseUrl, '/api/projects/delete', {
        projectId: created.projectId,
        confirmed: true,
      });
      assert('15. delete HTTP 200', deleted.status === 200, String(deleted.status));
      assert('16. delete ok true', deleted.json?.ok === true, String(deleted.json?.ok));
      assert('17. delete deleted true', deleted.json?.deleted === true, String(deleted.json?.deleted));
      assert(
        '18. delete message token',
        deleted.json?.message === PROJECT_DELETED_SUCCESSFULLY,
        String(deleted.json?.message),
      );
      assert(
        '19. delete audit steps',
        Array.isArray(deleted.json?.auditSteps) && deleted.json.auditSteps.length > 0,
        String(deleted.json?.auditSteps?.length),
      );
      assert('20. orphan count number', typeof deleted.json?.orphanCount === 'number', 'orphanCount');
      assert(
        '21. registry entry removed',
        !getRegistryProject(created.projectId, testRoot),
        'removed',
      );
      assert('22. persistent workspace removed', !existsSync(paths.root), paths.root);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    invalidateProjectRegistryV1Cache();
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }
  console.log('');
  console.log(`${passed}/${total} checks passed`);
  if (passed === total) {
    console.log(PROJECT_LIFECYCLE_DELETE_ROUTE_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

void main();
