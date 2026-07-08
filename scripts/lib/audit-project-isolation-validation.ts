/**
 * Audit Project Isolation and Cleanup V1 — shared validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN,
  getIsolatedAuditRegistryFilePath,
  resolveRegistryRootForPersistentProject,
} from '../../src/audit-project-isolation/index.js';
import { REGISTRY_TIER_AUDIT_DIR, REGISTRY_TIER_SYSTEM_DIR } from '../../src/registry-sovereignty/registry-sovereignty-types.js';
import {
  countRegistryTierProjects,
  executeRegistrySovereigntyCleanup,
  resolveAuditRegistryRoot,
} from '../../src/registry-sovereignty/index.js';
import { getSystemRegistryFilePath, resolveSystemRegistryRoot } from '../../src/registry-sovereignty/registry-tier-paths.js';
import {
  createProjectRegistryTestRoot,
  createRegistryProject,
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../../src/project-registry-v1/index.js';
import {
  inferProjectKindFromProjectId,
  isUserFacingRegistryProject,
} from '../../src/project-registry-v1/project-kind.js';
import { routeDuplicateProjectResume } from '../../src/project-resume-state/duplicate-project-resume-router.js';
import { ensureRegistryProjectRecord } from '../../src/persistent-project-reality/persistent-project-reality-registry.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';

export const VALIDATION_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

export interface AuditProjectIsolationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertAuditProjectIsolationCheck(
  checks: AuditProjectIsolationCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

async function startEphemeralServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
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

export async function runAuditProjectIsolationValidation(): Promise<{
  checks: AuditProjectIsolationCheck[];
  allPassed: boolean;
}> {
  const checks: AuditProjectIsolationCheck[] = [];
  const appJs = readFileSync(join(VALIDATION_ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(VALIDATION_ROOT, 'public/founder-reality/index.html'), 'utf8');
  const auditLib = readFileSync(
    join(VALIDATION_ROOT, 'scripts/lib/one-prompt-build-readiness-audit.ts'),
    'utf8',
  );
  const pkg = JSON.parse(readFileSync(join(VALIDATION_ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assertAuditProjectIsolationCheck(
    checks,
    'module.audit registry root',
    existsSync(join(VALIDATION_ROOT, 'src/audit-project-isolation/audit-registry-root.ts')),
    'audit-registry-root.ts',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'module.project-kind exists',
    existsSync(join(VALIDATION_ROOT, 'src/project-registry-v1/project-kind.ts')),
    'project-kind.ts',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'module.cleanup exists',
    existsSync(join(VALIDATION_ROOT, 'src/audit-project-isolation/test-project-cleanup.ts')),
    'test-project-cleanup.ts',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'npm validate script',
    Boolean(pkg.scripts?.['validate:audit-project-isolation-and-cleanup']),
    'validate:audit-project-isolation-and-cleanup',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'ui.compact project switcher',
    indexHtml.includes('active-project-switcher') && indexHtml.includes('active-project-name'),
    'compact switcher markup',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'ui.no chip strip in command center',
    indexHtml.includes('workspace-tabs hidden') || appJs.includes("container.classList.add('hidden')"),
    'chip strip hidden',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'ui.filters user-facing projects',
    appJs.includes('isUserFacingProjectRecord') && appJs.includes('includeSystemProjects'),
    'user project filter',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'ui.resume choice actions',
    appJs.includes('appendChatResumeActions') && appJs.includes('confirmFreshCopy'),
    'resume/fresh/cancel wiring',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'audit.isolated registry root',
    auditLib.includes('AIDEVENGINE_REGISTRY_ROOT') && auditLib.includes('createProjectRegistryTestRoot'),
    'isolated audit registry',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'audit.projectKind AUDIT',
    auditLib.includes("projectKind: 'AUDIT'"),
    'AUDIT kind on builds',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'kind.infer readiness-audit',
    inferProjectKindFromProjectId('readiness-audit-expense-tracker-123') === 'AUDIT',
    'AUDIT',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'kind.user project default',
    inferProjectKindFromProjectId('my-product-123') === 'USER',
    'USER',
  );
  assertAuditProjectIsolationCheck(
    checks,
    'no app-specific hardcoding',
    !readFileSync(join(VALIDATION_ROOT, 'src/project-registry-v1/project-kind.ts'), 'utf8').includes(
      'expense track',
    ),
    'generic prefixes only',
  );

  const testRoot = mkdtempSync(join(tmpdir(), 'audit-project-isolation-'));
  resetProjectRegistryV1ForTests(testRoot);
  let server: Server | null = null;

  try {
    createRegistryProject({ name: 'Founder App', rootDir: testRoot, projectKind: 'USER' });
    const auditRecord = {
      projectId: 'readiness-audit-demo-1',
      name: 'Audit Demo',
      projectKind: 'AUDIT' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      summary: 'audit',
    };
    const state = readProjectRegistryState(testRoot);
    state.projects.push(auditRecord);
    writeProjectRegistryV1ForTests(state, testRoot);
    invalidateProjectRegistryV1Cache();

    const started = await startEphemeralServer(testRoot);
    server = started.server;

    const userRegistryRes = await fetch(`${started.baseUrl}/api/projects/registry`);
    const userRegistryJson = (await userRegistryRes.json()) as {
      projects?: { items?: Array<{ projectId?: string }> };
      hiddenSystemProjectCount?: number;
      registrySovereignty?: { user?: number; audit?: number; system?: number };
    };
    const visibleIds = (userRegistryJson.projects?.items ?? []).map((item) => item.projectId);
    assertAuditProjectIsolationCheck(
      checks,
      'api.registry hides audit projects by default',
      visibleIds.indexOf('readiness-audit-demo-1') < 0 && visibleIds.length === 1,
      visibleIds.join(','),
    );
    assertAuditProjectIsolationCheck(
      checks,
      'api.registry reports sovereign tier counts',
      (userRegistryJson.registrySovereignty?.user ?? 0) === 1 &&
        (userRegistryJson.registrySovereignty?.audit ?? 0) >= 1,
      JSON.stringify(userRegistryJson.registrySovereignty),
    );

    const cleanupPreviewRes = await fetch(`${started.baseUrl}/api/projects/cleanup-test-projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview: true }),
    });
    const cleanupPreviewJson = (await cleanupPreviewRes.json()) as {
      cleanup?: { candidates?: Array<{ projectId?: string }> };
      registrySovereignty?: {
        migration?: { counts?: { user?: number; audit?: number } };
        counts?: { user?: number; audit?: number };
      };
    };
    const auditInTierRegistry = readProjectRegistryState(resolveAuditRegistryRoot(testRoot)).projects.some(
      (project) => project.projectId === 'readiness-audit-demo-1',
    );
    assertAuditProjectIsolationCheck(
      checks,
      'api.cleanup preview keeps audit in sovereign tier',
      auditInTierRegistry &&
        (cleanupPreviewJson.registrySovereignty?.migration?.counts?.user ??
          cleanupPreviewJson.registrySovereignty?.counts?.user ??
          0) === 1,
      String(auditInTierRegistry),
    );

    const isolatedAuditRoot = createProjectRegistryTestRoot(join(tmpdir(), 'audit-registry-only-'));
    const priorEnv = process.env.AIDEVENGINE_REGISTRY_ROOT;
    const priorValidationRun = process.env.AIDEVENGINE_VALIDATION_RUN;
    process.env.AIDEVENGINE_REGISTRY_ROOT = isolatedAuditRoot;
    process.env.AIDEVENGINE_VALIDATION_RUN = '1';
    invalidateProjectRegistryV1Cache();
    try {
      const isolated = resolveRegistryRootForPersistentProject({ projectRootDir: isolatedAuditRoot });
      assertAuditProjectIsolationCheck(
        checks,
        'registry.validation uses isolated root',
        isolated.registryRoot === resolveSystemRegistryRoot(isolatedAuditRoot) &&
          isolated.projectKind === 'SYSTEM_TEST',
        `${isolated.registryRoot}`,
      );
      ensureRegistryProjectRecord({
        rootDir: isolated.registryRoot,
        projectId: 'validation-isolated-write-1',
        projectName: 'Validation Isolated Write',
        projectKind: isolated.projectKind,
      });
      assertAuditProjectIsolationCheck(
        checks,
        'registry.validation writes outside user registry file',
        !readProjectRegistryState(isolatedAuditRoot).projects.some(
          (project) => project.projectId === 'validation-isolated-write-1',
        ) &&
          readProjectRegistryState(resolveSystemRegistryRoot(isolatedAuditRoot)).projects.some(
            (project) => project.projectId === 'validation-isolated-write-1',
          ) &&
          existsSync(getSystemRegistryFilePath(isolatedAuditRoot)),
        REGISTRY_TIER_SYSTEM_DIR,
      );

      const matrixPrompt = UNIVERSAL_BUILD_PIPELINE_MATRIX[0]!.prompt;
      const duplicate = routeDuplicateProjectResume({
        rawPrompt: matrixPrompt,
        rootDir: testRoot,
      });
      assertAuditProjectIsolationCheck(
        checks,
        'resume.does not auto-bind active project on fresh prompt',
        duplicate.resumingProjectId === null,
        String(duplicate.resumingProjectId),
      );

      const incompleteState = readProjectRegistryState(testRoot);
      const userProject = incompleteState.projects.find((project) => project.projectId !== 'readiness-audit-demo-1');
      if (userProject) {
        userProject.materializationQualityVerdict = 'NEEDS_WORK';
        writeProjectRegistryV1ForTests(incompleteState, testRoot);
        invalidateProjectRegistryV1Cache();
      }
      const duplicateNamed = routeDuplicateProjectResume({
        rawPrompt: 'Build a new version with improved reporting.',
        projectName: userProject?.name ?? 'Founder App',
        rootDir: testRoot,
      });
      assertAuditProjectIsolationCheck(
        checks,
        'resume.blocks duplicate name until explicit choice',
        duplicateNamed.shouldBlock === true && duplicateNamed.resumingExistingProject === false,
        `block=${duplicateNamed.shouldBlock}`,
      );
    } finally {
      if (priorEnv) process.env.AIDEVENGINE_REGISTRY_ROOT = priorEnv;
      else delete process.env.AIDEVENGINE_REGISTRY_ROOT;
      if (priorValidationRun) process.env.AIDEVENGINE_VALIDATION_RUN = priorValidationRun;
      else delete process.env.AIDEVENGINE_VALIDATION_RUN;
      invalidateProjectRegistryV1Cache();
      rmSync(isolatedAuditRoot, { recursive: true, force: true });
    }

    const tierCounts = countRegistryTierProjects(testRoot);
    assertAuditProjectIsolationCheck(
      checks,
      'cleanup.detects audit in sovereign tier',
      tierCounts.audit >= 1 &&
        readProjectRegistryState(resolveAuditRegistryRoot(testRoot)).projects.some(
          (project) => project.projectId === 'readiness-audit-demo-1',
        ),
      `audit=${tierCounts.audit}`,
    );

    const cleanupResult = await executeRegistrySovereigntyCleanup({ rootDir: testRoot, confirmed: true });
    assertAuditProjectIsolationCheck(
      checks,
      'cleanup preserves user registry sovereignty',
      cleanupResult.preservedUserProjectIds.length >= 1 &&
        readProjectRegistryState(testRoot).projects.every((project) =>
          isUserFacingRegistryProject(project),
        ) &&
        readProjectRegistryState(resolveAuditRegistryRoot(testRoot)).projects.some(
          (project) => project.projectId === 'readiness-audit-demo-1',
        ),
      cleanupResult.preservedUserProjectIds.join(','),
    );
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    rmSync(testRoot, { recursive: true, force: true });
    invalidateProjectRegistryV1Cache();
  }

  return {
    checks,
    allPassed: checks.every((check) => check.passed),
  };
}

export function printAuditProjectIsolationResults(checks: AuditProjectIsolationCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export { AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN };
