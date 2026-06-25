/**
 * Project Registry Consistency V1 — project creation, persistence, and UI sync.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Server } from 'node:http';
import {
  PROJECT_REGISTRY_DUPLICATES_REPAIRED,
  PROJECT_REGISTRY_LOADED,
  PROJECT_REGISTRY_PROJECT_PERSISTED,
  PROJECT_REGISTRY_V1_PASS_TOKEN,
  bootstrapProjectRegistryV1,
  getProjectRegistryOperatorLogPath,
  getProjectRegistryV1FilePath,
  invalidateProjectRegistryV1Cache,
  isProjectRegistryTestRoot,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import { resetWorkspaceTabRegistryForTests, listMultiProjectWorkspaces } from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import { resetDevPulseV2ProjectVaultAuthorityForTests } from '../src/project-vault/project-vault-authority.js';

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

async function main(): Promise<void> {
  console.log('');
  console.log('Project Registry Consistency V1 — Validation');
  console.log('============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const createProjectViaRegistryFn =
    appJs.match(/function createProjectViaRegistry\([\s\S]*?\n  \}/)?.[0] ?? '';
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
  assert('14. projects page unified registry', appJs.includes('getProjectRegistrySummaryForUi'), 'unified summary');
  assert('15. no auto Project N on click', !appJs.includes("createNewProjectTab('Project ' + (projectTabCounter + 1))"), 'no auto name');
  assert('16. project create error element', html.includes('id="project-name-error"'), 'error element');
  assert('17. form submit preventDefault', appJs.includes("projectNameForm.addEventListener('submit'") && appJs.includes('e.preventDefault()'), 'submit handler');
  assert('18. submitProjectCreateForm wiring', appJs.includes('submitProjectCreateForm'), 'submit helper');
  assert('19. create loading state', appJs.includes('setProjectCreateBusy') && appJs.includes('Creating…'), 'loading state');
  assert('20. visible create error', appJs.includes('showProjectCreateError'), 'inline error');
  assert('21. duplicate name pre-check', appJs.includes('findActiveProjectByName'), 'client duplicate check');
  assert('22. duplicate name error copy', appJs.includes('already exists. Choose a different name or open the existing project.'), 'duplicate message');
  assert('23. switchView after create', /switchView\('command-center'\)/.test(createProjectViaRegistryFn), 'active view');
  assert(
    '24. create updates registry from response',
    /mutateProjectRegistry/.test(createProjectViaRegistryFn) &&
      /mutateProjectRegistry[\s\S]*applyProjectRegistryResponse/.test(appJs),
    'response apply',
  );
  assert(
    '24b. create does not reload registry',
    !createProjectViaRegistryFn.includes('loadProjectRegistryState'),
    'no registry reload',
  );
  assert('25. dialog closes on success', /hideProjectNameDialog/.test(createProjectViaRegistryFn), 'close dialog');
  assert('26. preserve workspaces on empty snapshot', appJs.includes('data.multiProjectWorkspaces.length'), 'workspace guard');
  assert('27. UI skips archived duplicates', appJs.includes("items[i].status === 'ARCHIVED'"), 'archived guard');
  assert(
    '28. handler returns 409',
    readFileSync(join(ROOT, 'server/project-registry-handler.ts'), 'utf8').includes('sendJson(res, 409'),
    '409 conflict',
  );
  assert(
    '29. store duplicate enforcement',
    readFileSync(join(ROOT, 'src/project-registry-v1/project-registry-v1-store.ts'), 'utf8').includes(
      'assertActiveProjectNameAvailable',
    ),
    'store guard',
  );
  const storeTs = readFileSync(join(ROOT, 'src/project-registry-v1/project-registry-v1-store.ts'), 'utf8');
  assert('30. boot-time duplicate repair', storeTs.includes('repairDuplicateActiveProjects'), 'repair');
  assert('31. repair operator log', storeTs.includes(PROJECT_REGISTRY_DUPLICATES_REPAIRED), 'operator log');
  assert('32. create busy finally reset', /setProjectCreateBusy\(false\)/.test(createProjectViaRegistryFn), 'busy reset');
  assert(
    '33. create does not block on workspace refresh',
    !createProjectViaRegistryFn.includes('loadProductWorkspace'),
    'no workspace block',
  );
  assert(
    '34. submit form finally resets busy',
    /submitProjectCreateForm[\s\S]*\.finally\(function \(\) \{[\s\S]*setProjectCreateBusy\(false\)/.test(appJs),
    'submit finally',
  );
  const handlerTs = readFileSync(join(ROOT, 'server/project-registry-handler.ts'), 'utf8');
  assert(
    '35. instant submit duplicate guard',
    /function submitProjectCreateForm[\s\S]*guardProjectCreateSubmit[\s\S]*if \(!guard\.ok\)[\s\S]*return Promise\.resolve\(\)[\s\S]*setProjectCreateBusy\(true\)/.test(
      appJs,
    ),
    'pre-busy guard',
  );
  assert('36. registry hydration state', appJs.includes('projectRegistryHydrationState'), 'hydration state');
  assert('37. loading projects gate', appJs.includes('Loading projects...'), 'loading gate');
  assert(
    '38. handler validates before materialize',
    handlerTs.includes('validateCreateRegistryProjectName(name, rootDir)') &&
      handlerTs.indexOf('validateCreateRegistryProjectName(name, rootDir)') <
        handlerTs.indexOf('createRegistryProject({ name, summary, rootDir })'),
    'fast api guard',
  );
  assert(
    '39. submit skips create on duplicate',
    /function guardProjectCreateSubmit[\s\S]*showProjectCreateError\(buildDuplicateProjectNameError/.test(appJs),
    'inline duplicate',
  );
  assert(
    '40. submit does not call create on guard fail',
    /if \(!guard\.ok\) \{\s*return Promise\.resolve\(\);\s*\}/.test(appJs),
    'early return',
  );
  assert('41. registry loads before workspace', /loadProjectRegistryState\(\)[\s\S]*loadProductWorkspace/.test(appJs), 'registry first');
  assert('42. projects page loading state', appJs.includes("renderProductCard('Projects', '<p class=\"hint\">Loading projects..."), 'projects loading');
  assert('43. startup registry log', storeTs.includes(PROJECT_REGISTRY_LOADED), 'loaded log');
  assert('44. create persist log', storeTs.includes(PROJECT_REGISTRY_PROJECT_PERSISTED), 'persist log');
  assert('45. test root guard', storeTs.includes('isProjectRegistryTestRoot'), 'test root guard');
  assert('46. fast registry response', handlerTs.includes('buildFastRegistryResponse'), 'fast response');
  assert('47. deferred materialization', storeTs.includes('scheduleRegistryProjectMaterialization'), 'background materialize');
  assert('48. registry root override env', storeTs.includes('AIDEVENGINE_REGISTRY_ROOT'), 'registry root');
  assert('48a. unified projectRegistryClient', appJs.includes('var projectRegistryClient'), 'client state');
  assert('48b. client loaded log', appJs.includes('PROJECT_REGISTRY_CLIENT_LOADED'), 'client log');
  assert('48c. applyProjectRegistryPayload', appJs.includes('function applyProjectRegistryPayload'), 'payload apply');
  assert('48d. chip fallback for create', appJs.includes('canUseProjectRegistryForCreate'), 'create fallback');
  assert('48e. chip fallback items', appJs.includes('buildProjectSummaryFromChips'), 'chip summary');
  assert('48f. registry load timeout', appJs.includes('scheduleProjectRegistryLoadTimeout'), 'timeout');
  assert('48g. registry timeout message', appJs.includes('Project registry failed to load. Check server registry endpoint.'), 'timeout copy');
  assert('48h. workspace merge preserves registry', appJs.includes('preservedRegistry'), 'workspace merge');
  assert(
    '48i. duplicate guard chip fallback',
    /function guardProjectCreateSubmit[\s\S]*canUseProjectRegistryForCreate/.test(appJs),
    'chip guard',
  );
  assert(
    '48j. registry endpoint constant',
    appJs.includes("endpoint: '/api/projects/registry.json'"),
    'registry endpoint',
  );

  const realRegistryPath = join(ROOT, '.aidevengine', 'project-registry-v1.json');
  const realRegistryBefore = existsSync(realRegistryPath) ? readFileSync(realRegistryPath, 'utf8') : null;
  assert(
    '49. reset skips real runtime root',
    !isProjectRegistryTestRoot(ROOT),
    ROOT,
  );
  resetProjectRegistryV1ForTests(ROOT);
  assert(
    '50. real registry untouched by reset',
    realRegistryBefore === null || readFileSync(realRegistryPath, 'utf8') === realRegistryBefore,
    'wiped',
  );

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-registry-test-'));
  assert('51. temp test root marker', isProjectRegistryTestRoot(TEST_ROOT), TEST_ROOT);

  resetProjectRegistryV1ForTests(TEST_ROOT);
  resetWorkspaceTabRegistryForTests();
  resetDevPulseV2ProjectVaultAuthorityForTests();

  const seedStamp = '2020-01-01T00:00:00.000Z';
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: 'lisa-duplicate-3',
      projects: [
        {
          projectId: 'lisa-duplicate-1',
          name: 'LISA',
          status: 'ACTIVE',
          createdAt: seedStamp,
          updatedAt: seedStamp,
          lastActivityAt: seedStamp,
          summary: 'seed primary',
        },
        {
          projectId: 'lisa-duplicate-2',
          name: ' lisa ',
          status: 'ACTIVE',
          createdAt: '2020-01-02T00:00:00.000Z',
          updatedAt: '2020-01-02T00:00:00.000Z',
          lastActivityAt: '2020-01-02T00:00:00.000Z',
          summary: 'seed duplicate',
        },
        {
          projectId: 'lisa-duplicate-3',
          name: 'Lisa',
          status: 'ACTIVE',
          createdAt: '2020-01-03T00:00:00.000Z',
          updatedAt: '2020-01-03T00:00:00.000Z',
          lastActivityAt: '2020-01-03T00:00:00.000Z',
          summary: 'seed duplicate',
        },
      ],
    },
    TEST_ROOT,
  );
  invalidateProjectRegistryV1Cache();

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  const registryPath = getProjectRegistryV1FilePath(TEST_ROOT);
  try {
    const repairRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    const repairJson = (await repairRes.json()) as {
      projects?: { count?: number; items?: Array<{ name?: string; projectId?: string; status?: string }> };
      registry?: { projects?: Array<{ name?: string; projectId?: string; status?: string }> };
    };
    const repairedFile = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      activeProjectId?: string | null;
      projects?: Array<{ name?: string; projectId?: string; status?: string }>;
    };
    const activeLisa = (repairedFile.projects ?? []).filter(
      (p) => p.status === 'ACTIVE' && String(p.name ?? '').trim().toLowerCase() === 'lisa',
    );
    const archivedLisa = (repairedFile.projects ?? []).filter(
      (p) => p.status === 'ARCHIVED' && String(p.name ?? '').trim().toLowerCase() === 'lisa',
    );
    assert('40. seeded duplicate repair status 200', repairRes.status === 200, String(repairRes.status));
    assert('41. one active LISA after repair', activeLisa.length === 1, String(activeLisa.length));
    assert(
      '42. primary LISA kept',
      activeLisa[0]?.projectId === 'lisa-duplicate-1',
      activeLisa[0]?.projectId ?? 'missing',
    );
    assert('43. duplicate LISAs archived', archivedLisa.length === 2, String(archivedLisa.length));
    assert(
      '44. repair persisted to storage',
      (repairedFile.projects ?? []).filter((p) => p.status === 'ARCHIVED').length === 2,
      String((repairedFile.projects ?? []).filter((p) => p.status === 'ARCHIVED').length),
    );
    assert(
      '45. summary exposes one active LISA',
      repairJson.projects?.count === 1 &&
        repairJson.projects?.items?.filter((p) => String(p.name ?? '').trim().toLowerCase() === 'lisa').length === 1,
      String(repairJson.projects?.count),
    );
    const operatorLogPath = getProjectRegistryOperatorLogPath(TEST_ROOT);
    const operatorLog = existsSync(operatorLogPath) ? readFileSync(operatorLogPath, 'utf8') : '';
    assert(
      '46. operator repair log written',
      operatorLog.includes(PROJECT_REGISTRY_DUPLICATES_REPAIRED),
      operatorLogPath,
    );

    const archiveRes = await fetch(`${baseUrl}/api/projects/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'lisa-duplicate-1' }),
    });
    assert('47. archive remaining LISA 200', archiveRes.status === 200, String(archiveRes.status));

    const reuseRes = await fetch(`${baseUrl}/api/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'LISA' }),
    });
    const reuseJson = (await reuseRes.json()) as { ok?: boolean; project?: { name?: string }; projects?: { count?: number } };
    assert('48. archived LISA does not block reuse', reuseRes.status === 200, String(reuseRes.status));
    assert('49. reused LISA created', reuseJson.project?.name === 'LISA', reuseJson.project?.name ?? 'missing');
    assert('50. active project count after reuse', reuseJson.projects?.count === 1, String(reuseJson.projects?.count));

    resetProjectRegistryV1ForTests(TEST_ROOT);
    resetWorkspaceTabRegistryForTests();
    resetDevPulseV2ProjectVaultAuthorityForTests();
    invalidateProjectRegistryV1Cache();

    const createStartedAt = Date.now();
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
    const createElapsedMs = Date.now() - createStartedAt;
    assert('30. create LISA status 200', createRes.status === 200, String(createRes.status));
    assert('31. create LISA ok', createJson.ok === true, String(createJson.ok));
    assert('32. create LISA fast', createElapsedMs < 2000, `${createElapsedMs}ms`);
    assert('32. project name LISA', createJson.project?.name === 'LISA', createJson.project?.name ?? 'missing');
    assert('33. LISA is active', createJson.project?.projectId === createJson.activeProjectId, String(createJson.activeProjectId));
    assert('34. projects count 1', createJson.projects?.count === 1, String(createJson.projects?.count));
    assert('35. active count 1', createJson.projects?.activeCount === 1, String(createJson.projects?.activeCount));
    assert(
      '36. create returns active project immediately',
      createJson.project?.projectId === createJson.activeProjectId,
      String(createJson.activeProjectId),
    );

    assert('37. registry file persisted', existsSync(registryPath), registryPath);
    const registryFile = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      activeProjectId?: string | null;
      projects?: Array<{ name?: string; status?: string }>;
    };
    assert('38. registry file has LISA', registryFile.projects?.some((p) => p.name === 'LISA') === true, 'LISA');
    assert('39. registry activeProjectId set', Boolean(registryFile.activeProjectId), String(registryFile.activeProjectId));

    invalidateProjectRegistryV1Cache();
    const reloaded = bootstrapProjectRegistryV1(TEST_ROOT);
    assert(
      '66. reload LISA from disk',
      reloaded.projects.some((p) => p.name === 'LISA' && p.status === 'ACTIVE') === true,
      String(reloaded.projects.length),
    );
    assert(
      '67. reload activeProjectId',
      reloaded.activeProjectId === createJson.project?.projectId,
      String(reloaded.activeProjectId),
    );

    const workspaceCountBeforeDuplicate = listMultiProjectWorkspaces().length;
    const activeCountBeforeDuplicate = (registryFile.projects ?? []).filter((p) => p.status === 'ACTIVE').length;
    const duplicateStartedAt = Date.now();
    const apiDuplicateRes = await fetch(`${baseUrl}/api/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'LISA' }),
    });
    const apiDuplicateElapsedMs = Date.now() - duplicateStartedAt;
    const apiDuplicateJson = (await apiDuplicateRes.json()) as {
      ok?: boolean;
      error?: string;
      code?: string;
    };
    assert('62. API duplicate 409 fast', apiDuplicateRes.status === 409 && apiDuplicateElapsedMs < 2000, `${apiDuplicateElapsedMs}ms`);
    assert('63. API duplicate error code', apiDuplicateJson.code === 'DUPLICATE_PROJECT_NAME', apiDuplicateJson.code ?? 'missing');
    const registryAfterApiDuplicate = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      projects?: Array<{ status?: string }>;
    };
    const activeCountAfterApiDuplicate = (registryAfterApiDuplicate.projects ?? []).filter(
      (p) => p.status === 'ACTIVE',
    ).length;
    assert(
      '64. API duplicate no registry side effects',
      activeCountAfterApiDuplicate === activeCountBeforeDuplicate,
      `${activeCountBeforeDuplicate} -> ${activeCountAfterApiDuplicate}`,
    );
    assert(
      '65. API duplicate no workspace side effects',
      listMultiProjectWorkspaces().length === workspaceCountBeforeDuplicate,
      String(listMultiProjectWorkspaces().length),
    );

    const duplicateNames = ['LISA', ' lisa ', 'lisa'];
    for (const duplicateName of duplicateNames) {
      const duplicateRes = await fetch(`${baseUrl}/api/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: duplicateName }),
      });
      const duplicateJson = (await duplicateRes.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        projects?: { count?: number };
      };
      const label = JSON.stringify(duplicateName);
      assert(`40. duplicate ${label} status 409`, duplicateRes.status === 409, String(duplicateRes.status));
      assert(`41. duplicate ${label} ok false`, duplicateJson.ok === false, String(duplicateJson.ok));
      assert(
        `42. duplicate ${label} error code`,
        duplicateJson.code === 'DUPLICATE_PROJECT_NAME',
        duplicateJson.code ?? 'missing',
      );
      assert(
        `43. duplicate ${label} error message`,
        duplicateJson.error?.includes('already exists') === true,
        duplicateJson.error ?? 'missing',
      );
    }

    const registryAfterDuplicates = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      projects?: Array<{ name?: string; status?: string }>;
    };
    const activeProjects = (registryAfterDuplicates.projects ?? []).filter((p) => p.status === 'ACTIVE');
    const activeNames = activeProjects.map((p) => String(p.name ?? '').trim().toLowerCase());
    const uniqueActiveNames = new Set(activeNames);
    assert('44. project count unchanged after duplicates', activeProjects.length === 1, String(activeProjects.length));
    assert(
      '45. no duplicate active names',
      activeNames.length === uniqueActiveNames.size,
      `${activeNames.length} active / ${uniqueActiveNames.size} unique`,
    );

    const renameRes = await fetch(`${baseUrl}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: createJson.project?.projectId, name: 'LISA Platform' }),
    });
    const renameJson = (await renameRes.json()) as { project?: { name?: string } };
    assert('50. rename status 200', renameRes.status === 200, String(renameRes.status));
    assert('51. renamed project', renameJson.project?.name === 'LISA Platform', renameJson.project?.name ?? 'missing');

    const renameBackRes = await fetch(`${baseUrl}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: createJson.project?.projectId, name: 'LISA' }),
    });
    assert('52. rename back 200', renameBackRes.status === 200, String(renameBackRes.status));

    const workspaceRes = await fetch(`${baseUrl}/api/product-workspace.json`);
    const workspaceJson = (await workspaceRes.json()) as {
      projects?: { count?: number; activeCount?: number; items?: Array<{ name?: string; isActive?: boolean }> };
      activeProjectId?: string | null;
      multiProjectWorkspaces?: Array<{ projectName?: string }>;
    };
    assert('53. workspace projects count 1', workspaceJson.projects?.count === 1, String(workspaceJson.projects?.count));
    assert('54. workspace active count 1', workspaceJson.projects?.activeCount === 1, String(workspaceJson.projects?.activeCount));
    assert(
      '55. workspace lists LISA',
      workspaceJson.projects?.items?.some((p) => p.name === 'LISA') === true,
      workspaceJson.projects?.items?.[0]?.name ?? 'none',
    );
    assert(
      '56. workspace activeProjectId synced',
      workspaceJson.activeProjectId === createJson.project?.projectId,
      String(workspaceJson.activeProjectId),
    );
    assert(
      '57. workspace multiProjectWorkspaces synced',
      (workspaceJson.multiProjectWorkspaces ?? []).some((w) => w.projectName === 'LISA'),
      String(workspaceJson.multiProjectWorkspaces?.length ?? 0),
    );

    const refreshRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    const refreshJson = (await refreshRes.json()) as {
      projects?: { count?: number; items?: Array<{ name?: string; isActive?: boolean }> };
      activeProjectId?: string | null;
    };
    assert('58. refresh registry 200', refreshRes.status === 200, String(refreshRes.status));
    assert('59. refresh retains LISA', refreshJson.projects?.items?.some((p) => p.name === 'LISA') === true, 'missing');
    assert(
      '60. refresh retains active',
      refreshJson.projects?.items?.some((p) => p.name === 'LISA' && p.isActive) === true,
      'inactive',
    );
    assert(
      '61. refresh activeProjectId',
      refreshJson.activeProjectId === createJson.project?.projectId,
      String(refreshJson.activeProjectId),
    );

    const registryShapeRes = await fetch(`${baseUrl}/api/projects/registry.json`);
    const registryShapeJson = (await registryShapeRes.json()) as {
      ok?: boolean;
      projects?: { count?: number; activeCount?: number; items?: unknown[]; activeProjectId?: string | null };
      activeProjectId?: string | null;
      multiProjectWorkspaces?: unknown[];
    };
    assert('69. fast registry endpoint 200', registryShapeRes.status === 200, String(registryShapeRes.status));
    assert('70. fast registry projects.items', Array.isArray(registryShapeJson.projects?.items), 'items');
    assert(
      '71. fast registry count matches items',
      registryShapeJson.projects?.count === registryShapeJson.projects?.items?.length,
      String(registryShapeJson.projects?.count),
    );
    assert(
      '72. fast registry activeCount',
      typeof registryShapeJson.projects?.activeCount === 'number',
      String(registryShapeJson.projects?.activeCount),
    );
    assert(
      '73. fast registry activeProjectId',
      registryShapeJson.activeProjectId === registryShapeJson.projects?.activeProjectId,
      String(registryShapeJson.activeProjectId),
    );
    assert(
      '74. fast registry lists LISA',
      registryShapeJson.projects?.items?.some(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          String((item as { name?: string }).name ?? '').trim().toLowerCase() === 'lisa',
      ) === true,
      'missing LISA',
    );
    const chipCount = registryShapeJson.multiProjectWorkspaces?.length ?? 0;
    assert(
      '75. registry count matches chip count',
      registryShapeJson.projects?.count === chipCount || chipCount === 0,
      `projects=${registryShapeJson.projects?.count} chips=${chipCount}`,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }

  assert(
    '68. real registry preserved after validation',
    realRegistryBefore === null || readFileSync(realRegistryPath, 'utf8') === realRegistryBefore,
    realRegistryPath,
  );

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
