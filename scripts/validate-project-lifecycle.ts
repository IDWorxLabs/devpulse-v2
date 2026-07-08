/**
 * Project Lifecycle Management V1 — validation.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_DELETED_SUCCESSFULLY,
  PROJECT_LIFECYCLE_MANAGEMENT_V1_PASS_TOKEN,
  auditProjectOwnership,
  deleteProjectLifecycle,
  discoverProjectArtifacts,
  duplicateProjectLifecycle,
  listGeneratedDevServers,
  readProjectOwnershipIndex,
  registerProjectOwnershipArtifact,
  resetProjectOwnershipIndexForTests,
  restoreProjectLifecycle,
} from '../src/project-lifecycle-management-v1/index.js';
import {
  createRegistryProject,
  getRegistryProject,
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { persistentProjectPaths } from '../src/persistent-project-reality/persistent-project-reality-paths.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { resetGeneratedDevServerManagerForTests, listGeneratedDevServers } from '../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetWorkspaceTabRegistryForTests, resolveProjectContext } from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { listPreviewSessions } from '../src/live-preview-runtime/preview-session-manager.js';

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

async function main(): Promise<void> {
  console.log('');
  console.log('Project Lifecycle Management V1 — Validation');
  console.log('============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const html = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');

  assert('01. package script', Boolean(pkg.scripts?.['validate:project-lifecycle']), 'script');
  assert('02. lifecycle module', existsSync(join(ROOT, 'src/project-lifecycle-management-v1/index.ts')), 'module');
  assert('03. lifecycle handler', existsSync(join(ROOT, 'server/project-lifecycle-handler.ts')), 'handler');
  assert('04. delete API route', serverTs.includes('/api/projects/delete'), 'delete route');
  assert('05. duplicate API route', serverTs.includes('/api/projects/duplicate'), 'duplicate route');
  assert('06. restore API route', serverTs.includes('/api/projects/restore'), 'restore route');
  assert('07. ownership audit route', serverTs.includes('/api/projects/lifecycle/ownership-audit'), 'audit route');
  assert('08. delete dialog UI', html.includes('id="project-delete-dialog"'), 'dialog');
  assert('09. delete confirm button', html.includes('id="project-delete-confirm"'), 'confirm');
  assert('10. UI delete action', appJs.includes("data-project-action=\"delete\""), 'delete action');
  assert('11. UI duplicate action', appJs.includes("data-project-action=\"duplicate\""), 'duplicate action');
  assert('12. UI restore action', appJs.includes("data-project-action=\"restore\""), 'restore action');
  assert('13. UI archived section', appJs.includes('project-archived-section'), 'archived section');

  const testRoot = mkdtempSync(join(tmpdir(), 'project-lifecycle-'));
  try {
    resetProjectRegistryV1ForTests(testRoot);
    resetProjectOwnershipIndexForTests(testRoot);
    resetWorkspaceTabRegistryForTests();
    resetPreviewSessionManagerForTests();
    await resetGeneratedDevServerManagerForTests();

    const created = createRegistryProject({ name: 'Lifecycle Test', rootDir: testRoot });
    const paths = persistentProjectPaths(testRoot, created.projectId);
    mkdirSync(paths.source, { recursive: true });
    writeFileSync(join(paths.source, 'App.tsx'), 'export default function App() { return null; }', 'utf8');
    writeFileSync(
      paths.projectJson,
      JSON.stringify(
        {
          projectId: created.projectId,
          projectName: created.name,
          immutableBuildLinks: [],
        },
        null,
        2,
      ),
      'utf8',
    );
    mkdirSync(join(testRoot, GENERATED_BUILDER_WORKSPACES_DIR, created.projectId), { recursive: true });

    registerProjectOwnershipArtifact({
      projectId: created.projectId,
      path: `.aidev-projects/${created.projectId}`,
      artifactType: 'PERSISTENT_WORKSPACE',
      rootDir: testRoot,
    });

    const discovery = discoverProjectArtifacts(created.projectId, testRoot);
    assert('14. artifact discovery', discovery.artifacts.length >= 2, String(discovery.artifacts.length));

    const dup = duplicateProjectLifecycle({
      sourceProjectId: created.projectId,
      rootDir: testRoot,
      newName: 'Lifecycle Test Copy',
    });
    assert('15. duplicate creates new project', dup.ok && dup.newProjectId !== created.projectId, dup.newProjectId);
    assert(
      '16. duplicate workspace copied',
      existsSync(join(testRoot, '.aidev-projects', dup.newProjectId)),
      dup.newProjectId,
    );

    resolveProjectContext({ projectId: created.projectId, projectName: created.name, createIfMissing: true });

    const deleted = await deleteProjectLifecycle({
      projectId: created.projectId,
      rootDir: testRoot,
      confirmed: true,
    });
    assert('17. delete succeeds', deleted.ok, deleted.token ?? deleted.error ?? '');
    assert('18. delete token', deleted.token === PROJECT_DELETED_SUCCESSFULLY, String(deleted.token));
    assert(
      '19. registry entry removed',
      !getRegistryProject(created.projectId, testRoot),
      'removed',
    );
    assert(
      '20. persistent workspace removed',
      !existsSync(paths.root),
      paths.root,
    );
    assert(
      '21. builder workspace removed',
      !existsSync(join(testRoot, GENERATED_BUILDER_WORKSPACES_DIR, created.projectId)),
      'removed',
    );
    assert('22. no preview sessions after delete', listPreviewSessions().length === 0, '0 sessions');
    assert('23. no dev servers after delete', listGeneratedDevServers().length === 0, '0 servers');

    const audit = auditProjectOwnership(testRoot);
    assert('24. ownership audit runs', audit.registeredProjectIds.includes(dup.newProjectId), 'audit ok');

    archiveForRestore: {
      const { archiveRegistryProject } = await import('../src/project-registry-v1/index.js');
      archiveRegistryProject({ projectId: dup.newProjectId, rootDir: testRoot });
      const restored = restoreProjectLifecycle({ projectId: dup.newProjectId, rootDir: testRoot });
      assert('25. restore archived project', restored.ok, restored.error ?? 'ok');
      const record = getRegistryProject(dup.newProjectId, testRoot);
      assert('26. restore sets ACTIVE', record?.status === 'ACTIVE', String(record?.status));
    }

    const index = readProjectOwnershipIndex(testRoot);
    assert('27. ownership index persisted', index.version === 1, 'v1');

    const { server, baseUrl } = await startTestServer(testRoot);
    try {
      const deletePreview = await postJson(baseUrl, '/api/projects/delete', {
        projectId: dup.newProjectId,
        confirmed: false,
      });
      assert(
        '28. delete preview requires confirmation',
        deletePreview.json?.requiresConfirmation === true,
        'preview',
      );

      const deleteRes = await postJson(baseUrl, '/api/projects/delete', {
        projectId: dup.newProjectId,
        confirmed: true,
      });
      assert('29. HTTP delete', deleteRes.json?.deleted === true || deleteRes.json?.message === PROJECT_DELETED_SUCCESSFULLY, 'http delete');

      const auditRes = await fetch(`${baseUrl}/api/projects/lifecycle/ownership-audit`);
      const auditJson = (await auditRes.json()) as { audit?: { orphanCount: number } };
      assert('30. HTTP ownership audit', typeof auditJson.audit?.orphanCount === 'number', 'audit');
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
    console.log(PROJECT_LIFECYCLE_MANAGEMENT_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

void main();
