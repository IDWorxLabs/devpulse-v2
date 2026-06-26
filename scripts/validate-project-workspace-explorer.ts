/**
 * Project Workspace Explorer V1 — validation.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  PROJECT_WORKSPACE_EXPLORER_PASS_TOKEN,
  clearProjectWorkspaceFolderCache,
  getProjectWorkspaceFile,
  getProjectWorkspaceListing,
  getProjectWorkspaceSearch,
  listWorkspaceFolder,
  loadProjectWorkspaceContext,
  resolvePathWithinWorkspace,
  sanitizeRelativeWorkspacePath,
  validateProjectId,
} from '../src/project-workspace-explorer/index.js';
import {
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
  getRegistryProject,
} from '../src/project-registry-v1/index.js';
import { parseProjectWorkspaceApiPath } from '../server/project-workspace-explorer-handler.js';

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

function seedWorkspace(testRoot: string, projectIds: string[]): void {
  const stamp = new Date().toISOString();
  const projects = projectIds.map((projectId) => {
    const workspaceRoot = join(testRoot, '.aidev-projects', projectId);
    const sourceRoot = join(workspaceRoot, 'source');
    const aidevDir = join(workspaceRoot, '.aidev');
    mkdirSync(join(sourceRoot, 'src', 'features', 'dashboard'), { recursive: true });
    mkdirSync(aidevDir, { recursive: true });

    writeFileSync(
      join(sourceRoot, 'package.json'),
      JSON.stringify({ name: 'explorer-test', version: '1.0.0' }, null, 2),
      'utf8',
    );
    writeFileSync(
      join(sourceRoot, 'src', 'features', 'dashboard', 'DashboardFeature.tsx'),
      'export function DashboardFeature() { return null; }\n',
      'utf8',
    );
    writeFileSync(
      join(sourceRoot, '.generated-app-manifest.json'),
      JSON.stringify({ selectedProfile: 'EXPENSE_TRACKER_WEB_V1', status: 'PASS' }, null, 2),
      'utf8',
    );
    writeFileSync(
      join(aidevDir, 'feature-contract-reality.json'),
      JSON.stringify({ status: 'PASS' }, null, 2),
      'utf8',
    );
    writeFileSync(join(workspaceRoot, 'project.json'), JSON.stringify({ projectId }, null, 2), 'utf8');

    return {
      projectId,
      name: `Explorer ${projectId}`,
      status: 'ACTIVE' as const,
      createdAt: stamp,
      updatedAt: stamp,
      lastActivityAt: stamp,
      summary: 'Workspace explorer validation project',
      persistentWorkspacePath: `.aidev-projects/${projectId}`,
      sourceRoot: `.aidev-projects/${projectId}/source`,
      projectRealityStatus: 'PROMOTED' as const,
    };
  });

  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: projectIds[0] ?? null,
      projects,
    },
    testRoot,
  );
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Workspace Explorer V1 — Validation');
  console.log('==========================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const handlerSource = readFileSync(join(ROOT, 'server/project-workspace-explorer-handler.ts'), 'utf8');
  const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const uiSource = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const explorerUi = readFileSync(join(ROOT, 'public/founder-reality/workspace-explorer.js'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:project-workspace-explorer']),
    'validate:project-workspace-explorer',
  );
  assert('02. module exists', existsSync(join(ROOT, 'src/project-workspace-explorer/index.ts')), 'index.ts');
  assert(
    '03. server routes wired',
    serverSource.includes('handleProjectWorkspaceExplorerRequest'),
    'founder-reality-server.ts',
  );
  assert('04. read-only handler', handlerSource.includes('Read-only'), 'handler');
  assert('05. UI open files action', uiSource.includes('data-project-action="open-files"'), 'app.js');
  assert('06. explorer client module', explorerUi.includes('ProjectWorkspaceExplorer'), 'workspace-explorer.js');

  assert('07. projectId validation', validateProjectId('lisa-1') && !validateProjectId('../evil'), 'sanitize');
  assert('08. path sanitization rejects traversal', sanitizeRelativeWorkspacePath('../secret') === null, 'traversal');
  assert(
    '09. path sanitization allows nested',
    sanitizeRelativeWorkspacePath('source/src/App.tsx') === 'source/src/App.tsx',
    'nested',
  );

  const testRoot = mkdtempSync(join(tmpdir(), 'pwe-test-'));
  const projectA = 'explorer-alpha';
  const projectB = 'explorer-beta';
  seedWorkspace(testRoot, [projectA, projectB]);
  invalidateProjectRegistryV1Cache();

  const ctxA = loadProjectWorkspaceContext(testRoot, projectA);
  const ctxB = loadProjectWorkspaceContext(testRoot, projectB);
  assert('10. workspace context loads', Boolean(ctxA && ctxB), [
    ctxA ? 'ctxA ok' : 'ctxA missing',
    ctxB ? 'ctxB ok' : 'ctxB missing',
    getRegistryProject(projectA, testRoot)?.projectId ?? 'no registry',
  ].join(' | '));
  assert(
    '11. project isolation paths',
    Boolean(ctxA && ctxB && ctxA.workspaceRootAbs !== ctxB.workspaceRootAbs),
    ctxA && ctxB ? `${ctxA.workspaceRootAbs} vs ${ctxB.workspaceRootAbs}` : 'missing context',
  );

  if (!ctxA) {
    throw new Error('Workspace context failed to load — cannot continue validation');
  }

  const escape = resolvePathWithinWorkspace(ctxA.workspaceRootAbs, '../../etc/passwd');
  assert('12. filesystem escape blocked', !escape.ok, escape.ok ? 'allowed' : 'blocked');

  const rootListing = getProjectWorkspaceListing({ rootDir: testRoot, projectId: projectA });
  assert('13. root workspace listing', rootListing.ok && rootListing.folders.length > 0, String(rootListing.folders.length));
  assert('14. lazy folder listing', rootListing.lazyLoaded === true, 'lazy');

  const sourceFolder = rootListing.folders.find((f) => f.name === 'source');
  const nested = getProjectWorkspaceListing({
    rootDir: testRoot,
    projectId: projectA,
    folder: sourceFolder?.relativePath ?? 'source',
  });
  assert('15. nested folder traversal', nested.ok && nested.files.some((f) => f.name === 'package.json'), 'package.json');

  const file = getProjectWorkspaceFile({
    rootDir: testRoot,
    projectId: projectA,
    path: 'source/src/features/dashboard/DashboardFeature.tsx',
  });
  assert('16. file reading', file.ok && file.contents.includes('DashboardFeature'), file.language);

  const search = getProjectWorkspaceSearch({
    rootDir: testRoot,
    projectId: projectA,
    query: 'DashboardFeature',
  });
  assert('17. workspace search', search.ok && search.matches.length > 0, String(search.matches.length));

  clearProjectWorkspaceFolderCache(projectA);
  const cached = listWorkspaceFolder(ctxA, '');
  const cachedAgain = listWorkspaceFolder(ctxA, '');
  assert('18. folder cache', cached.cached === false && cachedAgain.cached === true, 'cache');

  const listingWithMeta = getProjectWorkspaceListing({ rootDir: testRoot, projectId: projectA });
  assert(
    '19. metadata shortcuts',
    Boolean(listingWithMeta.metadataShortcuts && listingWithMeta.metadataShortcuts.length >= 2),
    String(listingWithMeta.metadataShortcuts?.length ?? 0),
  );

  const { server, baseUrl } = await startTestServer(testRoot);
  try {
    const workspaceRes = await fetch(`${baseUrl}/api/projects/${projectA}/workspace`);
    const workspaceJson = (await workspaceRes.json()) as { ok?: boolean; projectId?: string };
    assert('20. GET workspace endpoint', workspaceRes.status === 200 && workspaceJson.ok === true, String(workspaceRes.status));

    const fileRes = await fetch(
      `${baseUrl}/api/projects/${projectA}/file?path=${encodeURIComponent('source/package.json')}`,
    );
    const fileJson = (await fileRes.json()) as { ok?: boolean; contents?: string };
    assert('21. GET file endpoint', fileRes.status === 200 && fileJson.ok === true && Boolean(fileJson.contents?.includes('explorer-test')), 'file');

    const postRes = await fetch(`${baseUrl}/api/projects/${projectA}/workspace`, { method: 'POST' });
    assert('22. read-only enforcement', postRes.status === 405, String(postRes.status));

    const parsed = parseProjectWorkspaceApiPath(`/api/projects/${projectB}/workspace`);
    assert('23. api path parser', parsed.kind === 'workspace' && parsed.projectId === projectB, projectB);

    const switchListing = getProjectWorkspaceListing({ rootDir: testRoot, projectId: projectB });
    assert(
      '24. multi-project switching',
      switchListing.ok && switchListing.projectId === projectB,
      switchListing.workspacePath,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  rmSync(testRoot, { recursive: true, force: true });
  resetProjectRegistryV1ForTests();
  delete process.env.AIDEVENGINE_REGISTRY_ROOT;

  assert(
    '25. performance guard constants',
    readFileSync(join(ROOT, 'src/project-workspace-explorer/project-workspace-types.ts'), 'utf8').includes(
      'MAX_WORKSPACE_FOLDER_CHILDREN',
    ),
    'limits',
  );

  const failed = results.filter((entry) => !entry.passed);
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(PROJECT_WORKSPACE_EXPLORER_PASS_TOKEN);
}

void main();
