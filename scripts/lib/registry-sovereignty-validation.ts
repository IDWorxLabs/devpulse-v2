/**
 * Registry Sovereignty V1 — shared validation suite.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  assertUserRegistryContainsOnlyUserProjects,
  countRegistryTierProjects,
  executeRegistrySovereigntyCleanup,
  getAuditRegistryFilePath,
  getSystemRegistryFilePath,
  getUserRegistryFilePath,
  migratePollutedUserRegistry,
  normalizeProjectRegistryName,
  REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN,
  REGISTRY_TIER_AUDIT_DIR,
  REGISTRY_TIER_SYSTEM_DIR,
  runRegistrySovereigntyStartupRepair,
} from '../../src/project-registry-sovereignty/index.js';
import { routeDuplicateProjectResume } from '../../src/project-resume-state/duplicate-project-resume-router.js';
import { resolveRegistryRootForPersistentProject } from '../../src/audit-project-isolation/index.js';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  writeProjectRegistryV1ForTests,
} from '../../src/project-registry-v1/index.js';
import {
  PROJECT_KIND_AUDIT,
  PROJECT_KIND_SYSTEM_TEST,
  PROJECT_KIND_USER,
  resolveProjectKind,
} from '../../src/project-registry-v1/project-kind.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { runProjectRegistryStartupHydration } from '../../src/project-registry-startup-hydration/index.js';

export const VALIDATION_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

export interface RegistrySovereigntyCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertRegistrySovereigntyCheck(
  checks: RegistrySovereigntyCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

async function startEphemeralServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  invalidateProjectRegistryV1Cache();
  const { createFounderRealityServer } = await import('../../server/founder-reality-server.js');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind ephemeral server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

export async function runRegistrySovereigntyValidation(): Promise<{
  checks: RegistrySovereigntyCheck[];
  allPassed: boolean;
}> {
  const checks: RegistrySovereigntyCheck[] = [];
  const pkg = JSON.parse(readFileSync(join(VALIDATION_ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assertRegistrySovereigntyCheck(
    checks,
    'module.project-registry-sovereignty exists',
    existsSync(join(VALIDATION_ROOT, 'src/project-registry-sovereignty/registry-sovereignty-engine.ts')),
    'registry-sovereignty-engine.ts',
  );
  assertRegistrySovereigntyCheck(
    checks,
    'npm validate script',
    Boolean(pkg.scripts?.['validate:registry-sovereignty']),
    'validate:registry-sovereignty',
  );
  assertRegistrySovereigntyCheck(
    checks,
    'tier audit dir',
    REGISTRY_TIER_AUDIT_DIR === '.aidevengine-audit',
    REGISTRY_TIER_AUDIT_DIR,
  );
  assertRegistrySovereigntyCheck(
    checks,
    'tier system dir',
    REGISTRY_TIER_SYSTEM_DIR === '.aidevengine-system',
    REGISTRY_TIER_SYSTEM_DIR,
  );
  assertRegistrySovereigntyCheck(
    checks,
    'canonical normalization collapses variants',
    normalizeProjectRegistryName('Expense Tracker') === normalizeProjectRegistryName('ExpenseTracker') &&
      normalizeProjectRegistryName('expense tracker') === normalizeProjectRegistryName('EXPENSE-TRACKER'),
    normalizeProjectRegistryName('Expense Tracker'),
  );

  const testRoot = mkdtempSync(join(tmpdir(), 'registry-sovereignty-'));
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  invalidateProjectRegistryV1Cache();
  let server: Server | null = null;

  try {
    const stamp = new Date().toISOString();
    writeProjectRegistryV1ForTests(
      {
        version: 1,
        activeProjectId: 'readiness-audit-sovereignty-1',
        projects: [
          {
            projectId: 'user-sovereignty-1',
            name: 'Founder Workspace',
            projectKind: PROJECT_KIND_USER,
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'Real user project',
          },
          {
            projectId: 'readiness-audit-sovereignty-1',
            name: 'Readiness Audit',
            projectKind: PROJECT_KIND_AUDIT,
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'audit artifact',
          },
          {
            projectId: 'validation-sovereignty-1',
            name: 'Validation Run',
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'validation artifact',
          },
          {
            projectId: 'user-expense-a',
            name: 'Expense Tracker',
            projectKind: PROJECT_KIND_USER,
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'user duplicate A',
          },
          {
            projectId: 'user-expense-b',
            name: 'ExpenseTracker',
            projectKind: PROJECT_KIND_USER,
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'user duplicate B',
          },
        ],
      },
      testRoot,
    );

    const migration = migratePollutedUserRegistry(testRoot);
    assertRegistrySovereigntyCheck(
      checks,
      'migration.moves audit and system out of user registry',
      migration.migrated.length >= 2 &&
        migration.repairedActiveProjectId === 'user-sovereignty-1' &&
        migration.counts.userActive === 2,
      `migrated=${migration.migrated.length} active=${migration.repairedActiveProjectId}`,
    );
    assertRegistrySovereigntyCheck(
      checks,
      'duplicate normalized names repaired',
      (() => {
        const userState = readProjectRegistryState(testRoot);
        const activeExpense = userState.projects.filter(
          (project) =>
            project.status === 'ACTIVE' &&
            normalizeProjectRegistryName(project.name) === normalizeProjectRegistryName('Expense Tracker'),
        );
        const archivedExpense = userState.projects.filter(
          (project) =>
            project.status === 'ARCHIVED' &&
            normalizeProjectRegistryName(project.name) === normalizeProjectRegistryName('ExpenseTracker'),
        );
        return activeExpense.length === 1 && archivedExpense.length >= 1;
      })(),
      String(migration.duplicateRepairs.length),
    );

    const userAssertion = assertUserRegistryContainsOnlyUserProjects(testRoot);
    assertRegistrySovereigntyCheck(
      checks,
      'user registry contains only USER projects',
      userAssertion.ok,
      userAssertion.violations.join(','),
    );

    const auditState = readProjectRegistryState(join(testRoot, REGISTRY_TIER_AUDIT_DIR));
    const systemState = readProjectRegistryState(join(testRoot, REGISTRY_TIER_SYSTEM_DIR));
    assertRegistrySovereigntyCheck(
      checks,
      'audit registry holds audit projects only',
      auditState.projects.every((project) => resolveProjectKind(project) === PROJECT_KIND_AUDIT),
      String(auditState.projects.length),
    );
    assertRegistrySovereigntyCheck(
      checks,
      'system registry holds system projects only',
      systemState.projects.every((project) => resolveProjectKind(project) === PROJECT_KIND_SYSTEM_TEST),
      String(systemState.projects.length),
    );

    process.env.AIDEVENGINE_VALIDATION_RUN = '1';
    const isolated = resolveRegistryRootForPersistentProject({ projectRootDir: testRoot });
    mkdirSync(join(isolated.artifactRoot, GENERATED_BUILDER_WORKSPACES_DIR, 'validation-workspace-1'), {
      recursive: true,
    });
    assertRegistrySovereigntyCheck(
      checks,
      'audit workspace stays out of user root',
      !existsSync(join(testRoot, GENERATED_BUILDER_WORKSPACES_DIR, 'validation-workspace-1')) &&
        existsSync(
          join(isolated.artifactRoot, GENERATED_BUILDER_WORKSPACES_DIR, 'validation-workspace-1'),
        ),
      isolated.artifactRoot,
    );
    delete process.env.AIDEVENGINE_VALIDATION_RUN;

    const repair = runRegistrySovereigntyStartupRepair(testRoot);
    assertRegistrySovereigntyCheck(
      checks,
      'startup repair restores user activeProjectId',
      repair.migration.repairedActiveProjectId === 'user-sovereignty-1',
      String(repair.migration.repairedActiveProjectId),
    );

    invalidateProjectRegistryV1Cache();
    runProjectRegistryStartupHydration(testRoot);
    const tierCounts = countRegistryTierProjects(testRoot);
    assertRegistrySovereigntyCheck(
      checks,
      'startup hydration reports sovereign counts',
      tierCounts.userActive === 2 && tierCounts.audit >= 1 && tierCounts.system >= 1,
      `user=${tierCounts.user} userActive=${tierCounts.userActive} audit=${tierCounts.audit} system=${tierCounts.system}`,
    );

    const resumeResult = routeDuplicateProjectResume({
      rootDir: testRoot,
      rawPrompt: 'Build an expense tracker app',
      projectName: 'Expense Tracker',
    });
    assertRegistrySovereigntyCheck(
      checks,
      'resume logic ignores audit projects',
      !resumeResult.resumingProjectId?.includes('readiness-audit') &&
        !resumeResult.resumingProjectId?.includes('validation-sovereignty'),
      String(resumeResult.resumingProjectId),
    );

    const started = await startEphemeralServer(testRoot);
    server = started.server;

    const registryRes = await fetch(`${started.baseUrl}/api/projects/registry`);
    const registryJson = (await registryRes.json()) as {
      activeProjectId?: string;
      projects?: { items?: Array<{ projectId?: string }> };
      registrySovereignty?: { user?: number };
    };
    assertRegistrySovereigntyCheck(
      checks,
      'command center active project is USER',
      registryJson.activeProjectId === 'user-sovereignty-1' &&
        (registryJson.projects?.items?.length ?? 0) === 2,
      String(registryJson.activeProjectId),
    );
    assertRegistrySovereigntyCheck(
      checks,
      'audit projects never appear in user dropdown',
      !(registryJson.projects?.items ?? []).some((item) =>
        String(item.projectId ?? '').includes('readiness-audit'),
      ),
      String(registryJson.projects?.items?.length),
    );

    const cleanupPreview = await executeRegistrySovereigntyCleanup({
      rootDir: testRoot,
      preview: true,
    });
    assertRegistrySovereigntyCheck(
      checks,
      'cleanup preview migrates rather than hides',
      cleanupPreview.preview === true && cleanupPreview.migration.counts.userActive === 2,
      String(cleanupPreview.migration.migrated.length),
    );

    assertRegistrySovereigntyCheck(
      checks,
      'tier registry files exist at flat paths',
      existsSync(getUserRegistryFilePath(testRoot)) &&
        existsSync(getAuditRegistryFilePath(testRoot)) &&
        existsSync(getSystemRegistryFilePath(testRoot)) &&
        getAuditRegistryFilePath(testRoot).replace(/\\/g, '/').endsWith(
          '.aidevengine-audit/project-registry-v1.json',
        ),
      getAuditRegistryFilePath(testRoot),
    );
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    delete process.env.AIDEVENGINE_VALIDATION_RUN;
    invalidateProjectRegistryV1Cache();
    rmSync(testRoot, { recursive: true, force: true });
  }

  return {
    checks,
    allPassed: checks.every((check) => check.passed),
  };
}

export function printRegistrySovereigntyResults(checks: RegistrySovereigntyCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export { REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN };
