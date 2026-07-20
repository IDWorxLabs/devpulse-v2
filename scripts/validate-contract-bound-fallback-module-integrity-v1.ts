/**
 * CONTRACT_BOUND_FALLBACK_MODULE_INTEGRITY_V1 — ambiguous generic module names.
 *
 * Proves Build Integrity Validation rejects genuine banned fallbacks while accepting
 * contract-bound compounds (occupancy-timeline) and other legitimate history capabilities.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  classifyModuleFallbackStatus,
  classifyWorkspaceBannedFallbackContamination,
  detectForbiddenBannedFallbackModulesInWorkspace,
  promptJustifiesBareBannedFallback,
  promptJustifiesExactModuleId,
  BANNED_FALLBACK_MODULES,
} from '../src/prompt-faithful-generation/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AIDEVENGINE_CONTRACT_BOUND_FALLBACK_MODULE_INTEGRITY_V1_PASS';

interface Result {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Result[] = [];

function assert(name: string, condition: boolean, detail = ''): void {
  results.push({ name, passed: condition, detail });
}

function fakeWorkspace(moduleIds: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'fallback-integrity-'));
  const features = join(dir, 'src', 'features');
  mkdirSync(features, { recursive: true });
  for (const moduleId of moduleIds) {
    mkdirSync(join(features, moduleId), { recursive: true });
    writeFileSync(join(features, moduleId, 'index.ts'), `export const id = '${moduleId}';\n`, 'utf8');
  }
  return dir;
}

// ---------------------------------------------------------------------------
// Unit classification matrix
// ---------------------------------------------------------------------------

{
  const harbor = classifyModuleFallbackStatus({
    moduleId: 'occupancy-timeline',
    approvedModuleIds: ['occupancy-timeline', 'berths', 'docks'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Manage docks, berths, occupancy timeline, expected arrivals.',
  });
  assert('1. HarborFlow Occupancy Timeline is CONTRACT_BOUND', harbor.fallbackStatus === 'CONTRACT_BOUND' && !harbor.forbidden, harbor.reason);
}

{
  const resilience = classifyModuleFallbackStatus({
    moduleId: 'shared-operational-timeline',
    approvedModuleIds: ['shared-operational-timeline'],
    rawPrompt: 'ResilienceOS includes a Shared Operational Timeline for agencies.',
  });
  assert('2. ResilienceOS Shared Operational Timeline accepted', !resilience.forbidden && resilience.isCompoundOverBannedTerm, resilience.reason);
}

{
  const expedition = classifyModuleFallbackStatus({
    moduleId: 'activity-timeline',
    approvedModuleIds: ['activity-timeline'],
    rawPrompt: 'ExpeditionOS Activity Timeline for field operations.',
  });
  assert('3. ExpeditionOS Activity Timeline accepted', !expedition.forbidden, expedition.reason);
}

{
  const crm = classifyModuleFallbackStatus({
    moduleId: 'activity-timeline',
    approvedModuleIds: ['activity-timeline', 'contacts', 'deals'],
    rawPrompt: 'CRM with genuine Activity Timeline for customer interactions.',
  });
  assert('4. CRM Activity Timeline accepted', !crm.forbidden && crm.fallbackStatus === 'CONTRACT_BOUND', crm.reason);
}

{
  const unsupported = classifyModuleFallbackStatus({
    moduleId: 'timeline',
    approvedModuleIds: ['tasks', 'notes'],
    rawPrompt: 'Build a simple notes app. Do not include project management.',
  });
  assert('5. Unsupported bare Timeline fallback forbidden', unsupported.forbidden && unsupported.fallbackStatus === 'LEGACY_FALLBACK', unsupported.reason);
}

{
  const audit = classifyModuleFallbackStatus({
    moduleId: 'audit-history',
    approvedModuleIds: ['audit-history'],
    rawPrompt: 'Include Audit History for every operational decision.',
  });
  assert('6. Audit History accepted (not banned-term fallback)', !audit.forbidden, audit.reason);
}

{
  const comms = classifyModuleFallbackStatus({
    moduleId: 'communication-log',
    approvedModuleIds: ['communication-log'],
    rawPrompt: 'Communication Log for all public alerts and notices.',
  });
  assert('7. Communication Log accepted', !comms.forbidden, comms.reason);
}

{
  const maintenance = classifyModuleFallbackStatus({
    moduleId: 'maintenance-history',
    approvedModuleIds: ['maintenance-history'],
    rawPrompt: 'Maintenance History for infrastructure recovery.',
  });
  assert('8. Maintenance History accepted', !maintenance.forbidden, maintenance.reason);
}

{
  const dir = fakeWorkspace(['timeline', 'notes']);
  try {
    const scan = detectForbiddenBannedFallbackModulesInWorkspace({
      workspaceDir: dir,
      approvedModuleIds: ['notes'],
      rawPrompt: 'Build notes only.',
    });
    assert(
      '9. Stale bare timeline file without request is forbidden',
      !scan.passed && scan.forbiddenModuleIds.includes('timeline'),
      scan.forbiddenModuleIds.join(','),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const prior = classifyModuleFallbackStatus({
    moduleId: 'timeline',
    approvedModuleIds: ['alpha'],
    rawPrompt: 'Unrelated new build with alpha records.',
  });
  assert('10. Prior-build bare timeline rejected on unrelated build', prior.forbidden, prior.reason);
}

{
  const genericName = classifyModuleFallbackStatus({
    moduleId: 'incident-timeline',
    approvedModuleIds: ['incident-timeline'],
    rawPrompt: 'Incident timeline for port emergencies.',
  });
  assert('11. Contract-bound generic filename accepted', !genericName.forbidden && genericName.isCompoundOverBannedTerm, genericName.reason);
}

{
  const renamed = classifyModuleFallbackStatus({
    moduleId: 'timeline-view',
    approvedModuleIds: [],
    rawPrompt: 'Build a weather dashboard.',
    originHint: 'PROFILE_FALLBACK',
  });
  assert(
    '12. Renamed legacy fallback timeline-view still forbidden without ancestry',
    renamed.forbidden,
    renamed.reason,
  );
}

assert(
  'timeline remains on banned fallback list',
  (BANNED_FALLBACK_MODULES as readonly string[]).includes('timeline'),
  BANNED_FALLBACK_MODULES.join(','),
);

assert(
  'occupancy timeline does not justify bare timeline',
  !promptJustifiesBareBannedFallback('Manage occupancy timeline and berths.', 'timeline'),
  'bare justified',
);

assert(
  'occupancy timeline justifies occupancy-timeline exact id',
  promptJustifiesExactModuleId('Manage occupancy timeline and berths.', 'occupancy-timeline'),
  'exact',
);

assert(
  'project timeline still justifies bare timeline',
  promptJustifiesBareBannedFallback('Include a project timeline and gantt view.', 'timeline'),
  'project timeline',
);

{
  const batch = classifyWorkspaceBannedFallbackContamination({
    workspaceModuleIds: ['occupancy-timeline', 'timeline', 'inventory'],
    approvedModuleIds: ['occupancy-timeline', 'inventory'],
    promptRequiredModules: ['occupancy-timeline', 'inventory'],
    rawPrompt: 'occupancy timeline and warehouse inventory management',
  });
  assert(
    'mixed workspace: compound+approved inventory pass, bare timeline fails',
    batch.allowedCompoundModuleIds.includes('occupancy-timeline') &&
      batch.forbiddenModuleIds.includes('timeline') &&
      !batch.forbiddenModuleIds.includes('inventory'),
    JSON.stringify(batch),
  );
}

// HarborFlow workspace regression (if present)
const harborWs = join(ROOT, '.generated-builder-workspaces', 'harborflow-1784407680359-41');
const harborProject = join(ROOT, '.aidev-projects', 'harborflow-1784407680359-41', 'project.json');
if (existsSync(harborWs) && existsSync(harborProject)) {
  const prompt = (JSON.parse(readFileSync(harborProject, 'utf8')) as { originalPrompt: string }).originalPrompt;
  const scan = detectForbiddenBannedFallbackModulesInWorkspace({
    workspaceDir: harborWs,
    approvedModuleIds: ['occupancy-timeline', 'inventory', 'berths', 'docks'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: prompt,
  });
  assert(
    'HarborFlow workspace: occupancy-timeline not forbidden',
    scan.passed || !scan.forbiddenModuleIds.includes('occupancy-timeline'),
    scan.forbiddenModuleIds.join(','),
  );
  assert(
    'HarborFlow workspace: allowed compounds include occupancy-timeline',
    scan.allowedCompoundModuleIds.includes('occupancy-timeline'),
    scan.allowedCompoundModuleIds.join(','),
  );
}

const packageScripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts as Record<
  string,
  string
>;
assert(
  'validator script registered',
  packageScripts['validate:contract-bound-fallback-module-integrity-v1'] ===
    'tsx scripts/validate-contract-bound-fallback-module-integrity-v1.ts',
  'package.json',
);

for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.passed ? '' : ` :: ${result.detail}`}`);
}
const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) {
  process.exit(1);
}
console.log(PASS_TOKEN);
