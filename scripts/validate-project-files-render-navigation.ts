/**
 * Project Files Render + Navigation History Activation V1 — validation.
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
  snapshotWorkspaceNavigation,
} from '../src/workspace-navigation/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const PROJECT_FILES_RENDER_NAVIGATION_PASS_TOKEN =
  'PROJECT_FILES_RENDER_NAVIGATION_V1_PASS' as const;

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
  const sourceRoot = join(testRoot, '.aidev-projects', projectId, 'source');
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

function countRegex(haystack: string, pattern: RegExp): number {
  const matches = haystack.match(pattern);
  return matches ? matches.length : 0;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Files Render + Navigation Activation V1 — Validation');
  console.log('============================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const explorerJs = readFileSync(join(ROOT, 'public/founder-reality/workspace-explorer.js'), 'utf8');
  const navJs = readFileSync(join(ROOT, 'public/founder-reality/workspace-navigation.js'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:project-files-render-navigation']),
    'validate:project-files-render-navigation',
  );

  assert(
    '02. static whitelist removed',
    !serverTs.includes("const allowedStatic = ['/', '/index.html', '/styles.css', '/app.js']"),
    'founder-reality-server.ts serves public files via resolvePublicPath',
  );

  assert(
    '03. explorer + navigation scripts in HTML',
    indexHtml.includes('/workspace-explorer.js') && indexHtml.includes('/workspace-navigation.js'),
    'index.html',
  );

  assert(
    '04. project-files container in HTML',
    indexHtml.includes('id="project-files-surface"'),
    'index.html',
  );

  assert(
    '05. single explorer open call site',
    countRegex(appJs, /ProjectWorkspaceExplorer\.open\(/g) === 1,
    String(countRegex(appJs, /ProjectWorkspaceExplorer\.open\(/g)),
  );

  assert(
    '06. prime before open path',
    appJs.includes('primeProjectFilesSurface') &&
      appJs.includes('skipExplorerOpen: true') &&
      appJs.includes('openProjectFilesView'),
    'activateProjectAndNavigate + switchView',
  );

  assert(
    '07. missing explorer fallback',
    appJs.includes('renderProjectFilesMissingExplorer') &&
      appJs.includes('Project Files module failed to load'),
    'app.js fallback',
  );

  assert(
    '08. loading state in app + explorer',
    appJs.includes('Loading project workspace') && explorerJs.includes('pwe-loading-panel'),
    'loading markup',
  );

  assert(
    '09. not-promoted state visible',
    explorerJs.includes('does not have generated source files yet') &&
      explorerJs.includes('.aidev-projects/'),
    'workspace-explorer.js',
  );

  assert(
    '10. error state visible',
    explorerJs.includes('Project workspace failed to load') && explorerJs.includes('data-pwe-action="retry"'),
    'workspace-explorer.js',
  );

  assert(
    '11. empty workspace state visible',
    explorerJs.includes('Workspace exists but no files were found'),
    'workspace-explorer.js',
  );

  assert(
    '12. valid tree shell markup',
    explorerJs.includes('pwe-shell') && explorerJs.includes('pwe-tree'),
    'workspace-explorer.js',
  );

  const loadingHtml =
    '<section class="pwe-state-panel pwe-loading-panel card"><p>Loading project workspace…</p></section>';
  const missingHtml =
    '<section class="pwe-state-panel card"><p>does not have generated source files yet</p></section>';
  const errorHtml =
    '<section class="pwe-state-panel card"><h2>Project workspace failed to load</h2></section>';
  const emptyHtml =
    '<section class="pwe-state-panel card"><h2>Workspace exists but no files were found</h2></section>';
  const treeHtml = '<div class="pwe-shell"><div class="pwe-tree"></div></div>';
  const fallbackHtml =
    '<section class="pwe-state-panel card"><h2>Project Files module failed to load</h2></section>';

  assert('13. loading not blank', !workspaceNavigationWouldRenderBlankProjectFiles(loadingHtml), 'loading');
  assert('14. missing not blank', !workspaceNavigationWouldRenderBlankProjectFiles(missingHtml), 'missing');
  assert('15. error not blank', !workspaceNavigationWouldRenderBlankProjectFiles(errorHtml), 'error');
  assert('16. empty not blank', !workspaceNavigationWouldRenderBlankProjectFiles(emptyHtml), 'empty');
  assert('17. tree not blank', !workspaceNavigationWouldRenderBlankProjectFiles(treeHtml), 'tree');
  assert('18. fallback not blank', !workspaceNavigationWouldRenderBlankProjectFiles(fallbackHtml), 'fallback');
  assert('19. empty string is blank', workspaceNavigationWouldRenderBlankProjectFiles(''), 'guard');

  assert(
    '20. navigation controls wired',
    appJs.includes('wireWorkspaceNavigationControls') &&
      appJs.includes('Navigation back clicked') &&
      appJs.includes('Navigation forward clicked'),
    'app.js',
  );

  assert(
    '21. nav client exposes push/back/forward',
    navJs.includes('push:') && navJs.includes('back:') && navJs.includes('forward:'),
    'workspace-navigation.js',
  );

  const unpromotedRoot = mkdtempSync(join(tmpdir(), 'pfrn-unpromoted-'));
  const promotedRoot = mkdtempSync(join(tmpdir(), 'pfrn-promoted-'));
  const lisaUnpromoted = 'lisa-render-nav-1';
  const lisaPromoted = 'lisa-render-nav-2';
  seedRegistryOnly(unpromotedRoot, lisaUnpromoted);
  seedPromotedWorkspace(promotedRoot, lisaPromoted);

  const { server, baseUrl } = await startTestServer(unpromotedRoot);
  try {
    const explorerRes = await fetch(`${baseUrl}/workspace-explorer.js`);
    const navRes = await fetch(`${baseUrl}/workspace-navigation.js`);
    assert('22. explorer JS served HTTP 200', explorerRes.status === 200, String(explorerRes.status));
    assert('23. navigation JS served HTTP 200', navRes.status === 200, String(navRes.status));

    const workspaceRes = await fetch(`${baseUrl}/api/projects/${lisaUnpromoted}/workspace`);
    const workspaceJson = (await workspaceRes.json()) as { ok?: boolean; reason?: string };
    assert('24. workspace endpoint HTTP 200 missing', workspaceRes.status === 200, String(workspaceRes.status));
    assert(
      '25. workspace WORKSPACE_NOT_PROMOTED',
      workspaceJson.ok === false && workspaceJson.reason === 'WORKSPACE_NOT_PROMOTED',
      String(workspaceJson.reason),
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const listingOk = getProjectWorkspaceListing({ rootDir: promotedRoot, projectId: lisaPromoted });
  assert(
    '26. promoted workspace listing ok',
    listingOk.ok === true && (listingOk.folders.length > 0 || listingOk.files.length > 0),
    String(listingOk.folders.length),
  );

  const missing = assessProjectWorkspaceAvailability(unpromotedRoot, lisaUnpromoted);
  assert(
    '27. unpromoted availability reason',
    !missing.available && missing.reason === 'WORKSPACE_NOT_PROMOTED',
    String(missing.reason),
  );

  let nav = pushWorkspaceNavigationEntry(
    { readOnly: true, entries: [], index: -1 },
    { surfaceId: 'projects', projectId: null, label: 'Projects', timestamp: Date.now() },
  );
  assert(
    '28. initial projects entry pushed',
    nav.entries.length === 1 && nav.entries[0]?.surfaceId === 'projects',
    String(nav.entries.length),
  );

  nav = pushWorkspaceNavigationEntry(nav, {
    surfaceId: 'project-files',
    projectId: 'lisa-1',
    label: 'Project Files',
    timestamp: Date.now() + 1,
  });
  const snapAfterOpen = snapshotWorkspaceNavigation(nav, { projects: 'Projects', 'project-files': 'Project Files' });
  assert('29. back enabled after open files', snapAfterOpen.canGoBack, 'canGoBack');
  assert(
    '30. forward disabled at tip',
    !snapAfterOpen.canGoForward,
    String(snapAfterOpen.canGoForward),
  );

  const back = workspaceNavigationBack(nav);
  nav = back.state;
  assert('31. back returns projects', back.entry?.surfaceId === 'projects', String(back.entry?.surfaceId));
  const snapAfterBack = snapshotWorkspaceNavigation(nav, { projects: 'Projects', 'project-files': 'Project Files' });
  assert('32. forward enabled after back', snapAfterBack.canGoForward, 'canGoForward');

  const forward = workspaceNavigationForward(nav);
  nav = forward.state;
  assert(
    '33. forward returns project files',
    forward.entry?.surfaceId === 'project-files' && forward.entry?.projectId === 'lisa-1',
    String(forward.entry?.surfaceId),
  );

  const flowNav = simulateProjectsToFilesNavigation();
  assert('34. navigation sequence valid', validateWorkspaceNavigationSequence(flowNav), 'sequence');
  assert(
    '35. navigation preserves projectId',
    flowNav.entries.some((e) => e.surfaceId === 'project-files' && e.projectId === 'lisa-1'),
    'lisa-1',
  );

  const snapAtStart = snapshotWorkspaceNavigation(
    {
      readOnly: true,
      entries: [
        {
          readOnly: true,
          surfaceId: 'projects',
          projectId: null,
          label: 'Projects',
          timestamp: 1,
        },
      ],
      index: 0,
    },
    { projects: 'Projects' },
  );
  assert(
    '36. back disabled at projects root',
    !snapAtStart.canGoBack,
    String(snapAtStart.canGoBack),
  );

  assert(
    '37. nav buttons not readOnly in HTML',
    indexHtml.includes('workspace-nav-back') &&
      !indexHtml.includes('workspace-nav-back" readonly') &&
      appJs.includes('backBtn.disabled = !snap.canGoBack'),
    'disabled driven by history',
  );

  rmSync(unpromotedRoot, { recursive: true, force: true });
  rmSync(promotedRoot, { recursive: true, force: true });
  resetProjectRegistryV1ForTests();
  delete process.env.AIDEVENGINE_REGISTRY_ROOT;

  assert(
    '38. validation module exists',
    existsSync(join(ROOT, 'scripts/validate-project-files-render-navigation.ts')),
    'script',
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
  console.log(PROJECT_FILES_RENDER_NAVIGATION_PASS_TOKEN);
}

void main();
