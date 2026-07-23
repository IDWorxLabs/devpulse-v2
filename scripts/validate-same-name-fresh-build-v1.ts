/**
 * Focused regression: same-display-name fresh builds, identity consistency, and
 * Start-fresh isolation (unique project id + workspace; display name preserved).
 */
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyProjectIdentityForBuild,
  resolveProjectNameConflict,
} from '../src/project-name-conflict-resolution-v1/index.js';
import {
  createRegistryProject,
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  resetProjectRegistryV1ForTests,
  setDefaultProjectRegistryRootDir,
} from '../src/project-registry-v1/index.js';
import { extractPromptFeatures } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import { deriveProjectNameFromPrompt } from '../src/project-session-continuity-v1/project-session-authority.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed += 1;
    console.log(`PASS — ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL — ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

const TEST_ROOT = mkdtempSync(join(tmpdir(), 'aidev-same-name-build-'));
setDefaultProjectRegistryRootDir(TEST_ROOT);
resetProjectRegistryV1ForTests(TEST_ROOT);
invalidateProjectRegistryV1Cache();

try {
  const fixturePath = join(ROOT, 'scripts/fixtures/continuityhub-production-prompt.txt');
  const continuityPrompt = existsSync(fixturePath)
    ? readFileSync(fixturePath, 'utf8')
    : 'Build ContinuityHub — a production Continuity of Operations platform.\n\nPRODUCT IDENTITY\nContinuityHub is not a CRM.';

  const extracted = extractPromptFeatures(continuityPrompt);
  check('extractAppName is ContinuityHub (not PRODUCT IDENTITY)', extracted.appName === 'ContinuityHub', extracted.appName);
  check(
    'deriveProjectNameFromPrompt is ContinuityHub',
    deriveProjectNameFromPrompt(continuityPrompt) === 'ContinuityHub',
    deriveProjectNameFromPrompt(continuityPrompt),
  );

  const first = applyProjectIdentityForBuild({
    requestedName: 'ContinuityHub',
    rawPrompt: continuityPrompt,
    summary: 'first',
    rootDir: TEST_ROOT,
    repoRootDir: TEST_ROOT,
  });
  check('first build creates project', first.createdProject === true);
  check('first display name ContinuityHub', first.resolvedProjectName === 'ContinuityHub', first.resolvedProjectName);
  check('first projectId is ContinuityHub-derived', /^continuityhub-/i.test(first.projectId), first.projectId);
  check('first workspace path includes projectId', (first.workspacePath ?? '').includes(first.projectId));

  const firstId = first.projectId;
  const firstWorkspace = first.workspacePath;

  const planFresh = resolveProjectNameConflict({
    requestedName: 'ContinuityHub',
    rawPrompt: continuityPrompt,
    confirmFreshCopy: true,
    forceFreshRebuild: true,
    rootDir: TEST_ROOT,
  });
  check('fresh plan mode FRESH_ISOLATED_BUILD', planFresh.resolutionMode === 'FRESH_ISOLATED_BUILD', planFresh.resolutionMode);
  check('fresh plan keeps display name', planFresh.resolvedProjectName === 'ContinuityHub', planFresh.resolvedProjectName);
  check('fresh plan references existing id', planFresh.existingProjectId === firstId, String(planFresh.existingProjectId));

  const second = applyProjectIdentityForBuild({
    requestedName: 'ContinuityHub',
    rawPrompt: continuityPrompt,
    summary: 'second fresh',
    rootDir: TEST_ROOT,
    repoRootDir: TEST_ROOT,
    confirmFreshCopy: true,
    forceFreshRebuild: true,
  });
  check('second fresh creates project', second.createdProject === true);
  check('second display name still ContinuityHub', second.resolvedProjectName === 'ContinuityHub', second.resolvedProjectName);
  check('second projectId differs', second.projectId !== firstId, `${second.projectId} vs ${firstId}`);
  check('second workspace differs', second.workspacePath !== firstWorkspace, String(second.workspacePath));
  check('no ExpenseTracker contamination', !/expense/i.test(second.projectId) && !/expense/i.test(second.resolvedProjectName));

  invalidateProjectRegistryV1Cache();
  const state = readProjectRegistryState(TEST_ROOT);
  const activeSameName = state.projects.filter(
    (p) => p.status === 'ACTIVE' && p.name.trim().toLowerCase() === 'continuityhub',
  );
  check('both ContinuityHub projects remain ACTIVE', activeSameName.length === 2, String(activeSameName.length));
  check(
    'first project record unchanged',
    activeSameName.some((p) => p.projectId === firstId && p.name === 'ContinuityHub'),
    firstId,
  );

  // Explicit create API path still rejects duplicate display names (default allowDuplicate=false).
  let rejected = false;
  try {
    createRegistryProject({ name: 'ContinuityHub', rootDir: TEST_ROOT });
  } catch (err) {
    rejected = err instanceof Error && /already exists/i.test(err.message);
    check(
      'structured conflict mentions internal id',
      err instanceof Error && /internal id:/i.test(err.message),
      err instanceof Error ? err.message : String(err),
    );
  }
  check('manual create still rejects duplicate display name', rejected);

  const builderJs = readFileSync(join(ROOT, 'public/founder-reality/builder-home.js'), 'utf8');
  check(
    'Start fresh sends START_NEW_BUILD override',
    /confirmFreshCopy:\s*true[\s\S]*buildIntentOverride:\s*'START_NEW_BUILD'/.test(builderJs),
  );
  check('duplicate Build clicks blocked', /if\s*\(\s*state\.building\s*\)\s*return/.test(builderJs));

  const previewAuthority = readFileSync(
    join(ROOT, 'src/end-to-end-build-reality-engine-v1/preview-authority-audit.ts'),
    'utf8',
  );
  check(
    'preview authority recognizes data-direct-feature-app',
    previewAuthority.includes('data-direct-feature-app') && previewAuthority.includes('isDirectFeatureAppSurface'),
  );
  check(
    'preview authority distinguishes shell vs unhydrated mismatch',
    previewAuthority.includes('describeInitialDomMismatch'),
  );

  const bridgeAuthority = readFileSync(
    join(ROOT, 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts'),
    'utf8',
  );
  check(
    'fresh/new-build alignment clears active project name without id',
    /alignmentActiveProjectId == null\s*\?\s*null/.test(bridgeAuthority),
  );

  const productionPath = readFileSync(
    join(ROOT, 'src/production-surface-integration/real-production-path-response.ts'),
    'utf8',
  );
  check(
    'blocked projection preserves unlocked preview as diagnostic',
    productionPath.includes('Preserve an unlocked preview as diagnostic') &&
      productionPath.includes('diagnosticPreviewUrl'),
  );
} finally {
  resetProjectRegistryV1ForTests(TEST_ROOT);
  invalidateProjectRegistryV1Cache();
  try {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_SAME_NAME_FRESH_BUILD_V1_PASS');
