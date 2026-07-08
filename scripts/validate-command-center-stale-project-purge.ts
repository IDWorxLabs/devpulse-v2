/**
 * Command Center Stale Project Purge V1 — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_PROJECT_LOCAL_STORAGE_KEYS,
  ACTIVE_PROJECT_SESSION_STORAGE_KEYS,
  COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE,
  COMMAND_CENTER_STALE_PROJECT_PURGE_V1_PASS_TOKEN,
  applyStaleCommandCenterProjectPurge,
  planStaleCommandCenterProjectPurge,
  pruneProjectChipsAgainstRegistry,
} from '../src/command-center-stale-project-purge/index.js';
import {
  listMultiProjectWorkspacesForRegistry,
  pruneWorkspaceSessionsNotInRegistry,
  registerProjectBuildResult,
  resetWorkspaceTabRegistryForTests,
} from '../src/one-prompt-live-preview/workspace-tab-registry.js';

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

function readRoot(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

class StorageHarness {
  localStorage: Record<string, string> = {};

  sessionStorage: Record<string, string> = {};

  consoleTraces: string[] = [];

  seedLisaCache(): void {
    this.localStorage['aidevengine.project-registry-cache.v1'] = JSON.stringify({
      cachedAt: '2026-06-30T00:00:00.000Z',
      payload: {
        ok: true,
        activeProjectId: 'lisa-deleted-1',
        projects: {
          items: [
            {
              projectId: 'lisa-deleted-1',
              name: 'LISA',
              status: 'ACTIVE',
            },
          ],
        },
        multiProjectWorkspaces: [
          {
            projectId: 'lisa-deleted-1',
            projectName: 'LISA',
            active: true,
            buildStatus: 'FAILED',
            workspacePath: '.generated-builder-workspaces/lisa-deleted-1',
            previewUrl: null,
          },
        ],
      },
    });
    this.sessionStorage['aidevengine.active-project-id.v1'] = 'lisa-deleted-1';
    this.sessionStorage['aidevengine.active-project-name.v1'] = 'LISA';
    this.sessionStorage['aidevengine.active-project-status.v1'] = 'FAILED';
    this.localStorage['aidevengine.project-workspace-explorer-state.v1'] = JSON.stringify({
      activeProjectId: 'lisa-deleted-1',
      activeProjectName: 'LISA',
    });
  }

  clearStorage(keys: readonly string[]): void {
    for (const key of keys) {
      delete this.localStorage[key];
      delete this.sessionStorage[key];
    }
  }
}

function simulateCommandCenterBootWithEmptyRegistry(harness: StorageHarness) {
  harness.seedLisaCache();

  const staleState = {
    activeProjectId: 'lisa-deleted-1',
    activeProjectName: 'LISA',
    activeProjectStatus: 'FAILED',
    multiProjectWorkspaces: [
      {
        projectId: 'lisa-deleted-1',
        projectName: 'LISA',
        active: true,
        buildStatus: 'FAILED',
        workspacePath: '.generated-builder-workspaces/lisa-deleted-1',
        previewUrl: null,
      },
    ],
    projectChatThreads: {
      'lisa-deleted-1': '<div class="chat-msg">stale lisa thread</div>',
    },
  };

  const plan = planStaleCommandCenterProjectPurge({
    registryProjects: [],
    state: staleState,
    reason: 'registry-empty-hydration',
  });

  const clearedKeys: string[] = [];
  const { state, result } = applyStaleCommandCenterProjectPurge({
    registryProjects: [],
    state: staleState,
    reason: 'registry-empty-hydration',
    clearStorage: (keys) => {
      clearedKeys.push(...keys);
      harness.clearStorage(keys);
    },
  });

  if (result) {
    harness.consoleTraces.push(result.trace);
  }

  return { plan, state, result, clearedKeys, harness };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Stale Project Purge V1 — Validation');
  console.log('==================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readRoot('public/founder-reality/app.js');
  const explorerJs = readRoot('public/founder-reality/workspace-explorer.js');
  const registryHandler = readRoot('server/project-registry-handler.ts');

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:command-center-stale-project-purge']),
    'script',
  );
  assert(
    '02. purge authority module exists',
    existsSync(join(ROOT, 'src/command-center-stale-project-purge/command-center-stale-project-purge-authority.ts')),
    'module',
  );
  assert(
    '03. app.js purge trace constant',
    appJs.includes("COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE = 'COMMAND_CENTER_STALE_PROJECT_PURGED'"),
    'trace',
  );
  assert(
    '04. app.js purge function wired',
    appJs.includes('function purgeStaleCommandCenterProjectState'),
    'purge fn',
  );
  assert(
    '05. app.js always rebuilds chips from registry',
    appJs.includes('syncRegistryChipsFromProjects(resolvedActiveProjectId)') &&
      !appJs.includes('normalized.multiProjectWorkspaces.length) {'),
    'registry chips',
  );
  assert(
    '06. app.js registry-authoritative workspace state',
    appJs.includes("purgeStaleCommandCenterProjectState('registry-empty-workspace-state')"),
    'workspace state',
  );
  assert(
    '07. app.js clears cached registry when empty',
    appJs.includes('function clearCachedProjectRegistry') && appJs.includes('clearCachedProjectRegistry()'),
    'cache clear',
  );
  assert(
    '08. workspace explorer clearActiveProject',
    explorerJs.includes('clearActiveProject: clearActiveProject'),
    'explorer clear',
  );
  assert(
    '09. server prunes workspace sessions against registry',
    registryHandler.includes('pruneWorkspaceSessionsNotInRegistry') &&
      registryHandler.includes('listMultiProjectWorkspacesForRegistry'),
    'server prune',
  );

  const pruned = pruneProjectChipsAgainstRegistry(
    [
      { projectId: 'lisa-deleted-1', projectName: 'LISA', buildStatus: 'FAILED' },
      { projectId: 'proj-keep', projectName: 'Keep', buildStatus: 'IDLE' },
    ],
    ['proj-keep'],
  );
  assert('10. prune removes deleted chip', pruned.length === 1 && pruned[0]?.projectId === 'proj-keep', pruned.map((c) => c.projectId).join(','));

  const harness = new StorageHarness();
  const simulation = simulateCommandCenterBootWithEmptyRegistry(harness);

  assert('11. purge plan detects stale LISA cache', simulation.plan.shouldPurge, simulation.plan.reason);
  assert(
    '12. purge plan marks registry empty',
    simulation.plan.registryEmpty && simulation.plan.staleChipProjectIds.includes('lisa-deleted-1'),
    simulation.plan.staleChipProjectIds.join(','),
  );
  assert(
    '13. Command Center renders no LISA chip',
    simulation.state.multiProjectWorkspaces.length === 0,
    String(simulation.state.multiProjectWorkspaces.length),
  );
  assert(
    '14. active project text cleared',
    simulation.state.activeProjectId === null &&
      simulation.state.activeProjectName === null &&
      simulation.state.activeProjectStatus === null,
    [
      simulation.state.activeProjectId,
      simulation.state.activeProjectName,
      simulation.state.activeProjectStatus,
    ].join(','),
  );
  assert(
    '15. Projects and Command Center agree on zero projects',
    simulation.state.multiProjectWorkspaces.length === 0,
    'zero chips',
  );
  assert(
    '16. reload does not restore stale deleted project from storage',
    !harness.localStorage['aidevengine.project-registry-cache.v1'] &&
      !harness.sessionStorage['aidevengine.active-project-id.v1'] &&
      !harness.sessionStorage['aidevengine.active-project-name.v1'] &&
      !harness.sessionStorage['aidevengine.active-project-status.v1'],
    'storage cleared',
  );
  assert(
    '17. startup stale-project purge trace emitted',
    simulation.result?.trace === COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE,
    String(simulation.result?.trace),
  );
  assert(
    '18. storage keys cover registry cache and active project session keys',
    ACTIVE_PROJECT_LOCAL_STORAGE_KEYS.includes('aidevengine.project-registry-cache.v1') &&
      ACTIVE_PROJECT_SESSION_STORAGE_KEYS.includes('aidevengine.active-project-id.v1'),
    'keys',
  );

  resetWorkspaceTabRegistryForTests();
  registerProjectBuildResult({
    projectId: 'lisa-deleted-1',
    projectName: 'LISA',
    build: {
      readOnly: true,
      buildId: 'build-lisa',
      projectId: 'lisa-deleted-1',
      projectName: 'LISA',
      status: 'FAILED',
      prompt: 'assistive communication app',
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: 'lisa-deleted-1',
      workspacePath: '.generated-builder-workspaces/lisa-deleted-1',
      generatedProfile: 'GENERIC_CUSTOM_APP_V1',
      planningProofLevel: 'L1',
      materializationProofLevel: 'L1',
      buildResult: 'FAIL',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: null,
      diagnosticPreviewUrl: null,
      limitedPreviewUrl: null,
      devServerRunning: false,
      livePreviewAvailable: false,
      failureReason: 'preview degraded',
      featureSignals: null,
      materializationManifest: null,
      livePreviewGate: null,
      autonomousSoftwareEngineering: null,
      aeeExecutiveDecision: null,
      aeeFinalReport: null,
      updatedAt: new Date().toISOString(),
    },
  });
  const removed = pruneWorkspaceSessionsNotInRegistry([]);
  assert(
    '19. server workspace tab registry purges deleted project sessions',
    removed.includes('lisa-deleted-1') && listMultiProjectWorkspacesForRegistry([]).length === 0,
    removed.join(','),
  );

  assert(
    '20. no app-specific hardcoding in purge authority',
    !readRoot('src/command-center-stale-project-purge/command-center-stale-project-purge-authority.ts').includes('LISA'),
    'generic',
  );

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }
  console.log('');
  console.log(`${passed}/${total} checks passed`);
  if (passed === total) {
    console.log(COMMAND_CENTER_STALE_PROJECT_PURGE_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

void main();
