/**
 * Project Files Empty State + Workspace Navigation V1 — validation.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  getProjectWorkspaceListing,
  assessProjectWorkspaceAvailability,
} from '../src/project-workspace-explorer/index.js';
import {
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import {
  pushWorkspaceNavigationEntry,
  simulateProjectsToFilesNavigation,
  validateWorkspaceNavigationSequence,
  workspaceNavigationBack,
  workspaceNavigationForward,
  workspaceNavigationWouldRenderBlankProjectFiles,
  WORKSPACE_NAVIGATION_PASS_TOKEN,
} from '../src/workspace-navigation/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const PROJECT_FILES_EMPTY_STATE_NAVIGATION_PASS_TOKEN =
  'PROJECT_FILES_EMPTY_STATE_NAVIGATION_V1_PASS' as const;

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

function seedRegistryOnly(testRoot: string, projectId: string): void {
  const stamp = new Date().toISOString();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: projectId,
      projects: [
        {
          projectId,
          name: 'LISA',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'No workspace yet',
        },
      ],
    },
    testRoot,
  );
}

function seedPromotedWorkspace(testRoot: string, projectId: string): void {
  const workspaceRoot = join(testRoot, '.aidev-projects', projectId);
  const sourceRoot = join(workspaceRoot, 'source');
  mkdirSync(join(sourceRoot, 'src'), { recursive: true });
  writeFileSync(join(sourceRoot, 'package.json'), '{"name":"lisa"}', 'utf8');
  writeFileSync(join(sourceRoot, 'src', 'App.tsx'), 'export default function App(){return null}', 'utf8');
  const stamp = new Date().toISOString();
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: projectId,
      projects: [
        {
          projectId,
          name: 'LISA',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Promoted',
          persistentWorkspacePath: `.aidev-projects/${projectId}`,
          sourceRoot: `.aidev-projects/${projectId}/source`,
          projectRealityStatus: 'PROMOTED',
        },
      ],
    },
    testRoot,
  );
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Files Empty State + Navigation V1 — Validation');
  console.log('======================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const explorerJs = readFileSync(join(ROOT, 'public/founder-reality/workspace-explorer.js'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:project-files-empty-state-navigation']),
    'validate:project-files-empty-state-navigation',
  );
  assert(
    '02. loading state markup',
    explorerJs.includes('Loading project workspace') && explorerJs.includes('pwe-loading-panel'),
    'workspace-explorer.js',
  );
  assert(
    '03. not promoted copy',
    explorerJs.includes('does not have generated source files yet'),
    'workspace-explorer.js',
  );
  assert(
    '04. expected source path in UI',
    explorerJs.includes('expectedSourceRoot') && explorerJs.includes('.aidev-projects/'),
    'workspace-explorer.js',
  );
  assert(
    '05. build + command center actions',
    explorerJs.includes('data-pwe-action="build-project"') &&
      explorerJs.includes('data-pwe-action="go-command-center"'),
    'actions',
  );
  assert(
    '06. error diagnostics + retry',
    explorerJs.includes('Project workspace failed to load') &&
      explorerJs.includes('data-pwe-action="retry"') &&
      explorerJs.includes('copy-diagnostics'),
    'error state',
  );
  assert(
    '07. empty workspace state',
    explorerJs.includes('Workspace exists but no files were found'),
    'empty state',
  );
  assert(
    '08. trace events',
    explorerJs.includes('emitTrace') &&
      explorerJs.includes('Project files opened') &&
      explorerJs.includes('Workspace load started'),
    'trace',
  );
  assert(
    '09. back forward controls',
    indexHtml.includes('workspace-nav-back') && indexHtml.includes('workspace-nav-forward'),
    'index.html',
  );
  assert(
    '10. navigation wiring',
    appJs.includes('wireWorkspaceNavigationControls') && appJs.includes('WorkspaceNavigation'),
    'app.js',
  );
  assert(
    '11. blank guard',
    !workspaceNavigationWouldRenderBlankProjectFiles(
      '<section class="pwe-state-panel card"><h2>Project Files</h2></section>',
    ),
    'state panel',
  );
  assert(
    '16. blank detection fails empty string',
    workspaceNavigationWouldRenderBlankProjectFiles(''),
    'empty html',
  );

  const unpromotedRoot = mkdtempSync(join(tmpdir(), 'pwe-empty-'));
  const promotedRoot = mkdtempSync(join(tmpdir(), 'pwe-full-'));
  const lisaUnpromoted = 'lisa-empty-1';
  const lisaPromoted = 'lisa-full-1';
  seedRegistryOnly(unpromotedRoot, lisaUnpromoted);
  seedPromotedWorkspace(promotedRoot, lisaPromoted);

  const missing = assessProjectWorkspaceAvailability(unpromotedRoot, lisaUnpromoted);
  assert(
    '12. missing workspace reason',
    !missing.available && missing.reason === 'WORKSPACE_NOT_PROMOTED',
    String(missing.reason),
  );
  assert(
    '13. missing workspace message',
    missing.message.includes('Run a build first'),
    missing.message.slice(0, 40),
  );

  const listingMissing = getProjectWorkspaceListing({
    rootDir: unpromotedRoot,
    projectId: lisaUnpromoted,
  });
  assert(
    '14. listing ok:false for missing',
    listingMissing.ok === false && listingMissing.reason === 'WORKSPACE_NOT_PROMOTED',
    String(listingMissing.reason),
  );
  assert(
    '15. expected source root path',
    listingMissing.expectedSourceRoot === `.aidev-projects/${lisaUnpromoted}/source`,
    listingMissing.expectedSourceRoot ?? '',
  );

  const listingOk = getProjectWorkspaceListing({ rootDir: promotedRoot, projectId: lisaPromoted });
  assert(
    '17. valid workspace folders',
    listingOk.ok === true && (listingOk.folders.length > 0 || listingOk.files.length > 0),
    String(listingOk.folders.length),
  );

  const { server, baseUrl } = await startTestServer(unpromotedRoot);
  try {
    const res = await fetch(`${baseUrl}/api/projects/${lisaUnpromoted}/workspace`);
    const json = (await res.json()) as { ok?: boolean; reason?: string; status?: number };
    assert('18. endpoint returns 200 for missing', res.status === 200, String(res.status));
    assert(
      '19. endpoint structured missing payload',
      json.ok === false && json.reason === 'WORKSPACE_NOT_PROMOTED',
      String(json.reason),
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  let nav = simulateProjectsToFilesNavigation();
  assert('20. navigation sequence valid', validateWorkspaceNavigationSequence(nav), 'sequence');
  const back = workspaceNavigationBack(nav);
  nav = back.state;
  assert('21. back to projects', back.entry?.surfaceId === 'projects', String(back.entry?.surfaceId));
  const forward = workspaceNavigationForward(nav);
  nav = forward.state;
  assert(
    '22. forward to project files',
    forward.entry?.surfaceId === 'project-files',
    String(forward.entry?.surfaceId),
  );

  let dedupe = pushWorkspaceNavigationEntry(
    { readOnly: true, entries: [], index: -1 },
    { surfaceId: 'projects', projectId: null, label: 'Projects', timestamp: Date.now() },
  );
  dedupe = pushWorkspaceNavigationEntry(dedupe, {
    surfaceId: 'projects',
    projectId: null,
    label: 'Projects',
    timestamp: Date.now() + 1,
  });
  assert('23. dedupe consecutive', dedupe.entries.length === 1, String(dedupe.entries.length));

  rmSync(unpromotedRoot, { recursive: true, force: true });
  rmSync(promotedRoot, { recursive: true, force: true });
  resetProjectRegistryV1ForTests();
  delete process.env.AIDEVENGINE_REGISTRY_ROOT;

  assert('24. workspace navigation module', existsSync(join(ROOT, 'src/workspace-navigation/index.ts')), 'module');
  assert('25. navigation pass token export', Boolean(WORKSPACE_NAVIGATION_PASS_TOKEN), 'token');

  const failed = results.filter((entry) => !entry.passed);
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(PROJECT_FILES_EMPTY_STATE_NAVIGATION_PASS_TOKEN);
}

void main();
