/**
 * CONTRACT_BOUND_COMPOUND_MODULE_HARDENING_V1
 *
 * Data-driven regression proving compounds/renames over banned fallback terms
 * are classified from verified provenance + approval binding — never from
 * filename substring matching or forged approval alone.
 *
 * Does not hardcode product allowlists. Class A examples are fixtures for the
 * generic exact-identity rule. Class B uses BANNED_FALLBACK_MODULES as authority.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  BANNED_FALLBACK_MODULES,
  classifyModuleFallbackStatus,
  classifyWorkspaceBannedFallbackContamination,
  detectForbiddenBannedFallbackModulesInWorkspace,
  isDisguisedBannedForm,
  promptJustifiesBareBannedFallback,
  promptJustifiesExactModuleId,
} from '../src/prompt-faithful-generation/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AIDEVENGINE_CONTRACT_BOUND_COMPOUND_MODULE_HARDENING_V1_PASS';

interface Result {
  name: string;
  class: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: Result[] = [];

function record(
  cls: string,
  name: string,
  condition: boolean,
  expected: string,
  actual: string,
): void {
  results.push({ name, class: cls, passed: condition, expected, actual });
}

function phraseForCompound(moduleId: string): string {
  return moduleId.replace(/-/g, ' ');
}

function fakeWorkspace(moduleIds: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'compound-harden-'));
  const features = join(dir, 'src', 'features');
  mkdirSync(features, { recursive: true });
  for (const moduleId of moduleIds) {
    mkdirSync(join(features, moduleId), { recursive: true });
    writeFileSync(join(features, moduleId, 'index.ts'), `export const id = '${moduleId}';\n`, 'utf8');
  }
  return dir;
}

// ---------------------------------------------------------------------------
// A. Valid contract-bound compounds (pass only with verified ancestry + approval)
// ---------------------------------------------------------------------------

const VALID_COMPOUND_EXAMPLES = [
  'occupancy-timeline',
  'activity-timeline',
  'maintenance-timeline',
  'audit-timeline',
  'communication-timeline',
  'scheduling-timeline',
  'delivery-timeline',
  'case-timeline',
  'project-timeline',
  'incident-timeline',
] as const;

for (const moduleId of VALID_COMPOUND_EXAMPLES) {
  const phrase = phraseForCompound(moduleId);
  const ok = classifyModuleFallbackStatus({
    moduleId,
    approvedModuleIds: [moduleId],
    promptRequiredModules: [moduleId],
    rawPrompt: `Product requires ${phrase} as a first-class capability.`,
  });
  record(
    'A',
    `Valid compound accepted with ancestry+approval: ${moduleId}`,
    ok.fallbackStatus === 'CONTRACT_BOUND' && !ok.forbidden,
    'CONTRACT_BOUND forbidden=false',
    `${ok.fallbackStatus} forbidden=${ok.forbidden}`,
  );

  const approvalOnly = classifyModuleFallbackStatus({
    moduleId,
    approvedModuleIds: [moduleId],
    rawPrompt: 'Unrelated product without that capability phrase.',
  });
  record(
    'A',
    `Valid compound rejected on forged approval alone: ${moduleId}`,
    approvalOnly.forbidden === true,
    'forbidden=true',
    `forbidden=${approvalOnly.forbidden} status=${approvalOnly.fallbackStatus}`,
  );

  const ancestryOnly = classifyModuleFallbackStatus({
    moduleId,
    promptRequiredModules: [moduleId],
    rawPrompt: `Product requires ${phrase}.`,
  });
  record(
    'A',
    `Valid compound rejected without approval binding: ${moduleId}`,
    ancestryOnly.forbidden === true,
    'forbidden=true',
    `forbidden=${ancestryOnly.forbidden} status=${ancestryOnly.fallbackStatus}`,
  );
}

{
  const viaContract = classifyModuleFallbackStatus({
    moduleId: 'occupancy-timeline',
    approvedModuleIds: ['occupancy-timeline'],
    contractCapabilityIds: ['occupancy-timeline'],
    rawPrompt: 'No phrase in prompt; contract carries exact capability.',
  });
  record(
    'A',
    'Compound accepted via contract capability id + approval (no prompt phrase)',
    viaContract.fallbackStatus === 'CONTRACT_BOUND' && !viaContract.forbidden,
    'CONTRACT_BOUND',
    viaContract.fallbackStatus,
  );
}

// ---------------------------------------------------------------------------
// B. Unsupported bare fallback modules (canonical registry authority)
// ---------------------------------------------------------------------------

for (const banned of BANNED_FALLBACK_MODULES) {
  const bare = classifyModuleFallbackStatus({
    moduleId: banned,
    approvedModuleIds: ['notes', 'settings'],
    rawPrompt: 'Build a notes app without project management suites.',
  });
  record(
    'B',
    `Bare banned "${banned}" forbidden without ancestry`,
    bare.forbidden && bare.fallbackStatus === 'LEGACY_FALLBACK',
    'LEGACY_FALLBACK forbidden=true',
    `${bare.fallbackStatus} forbidden=${bare.forbidden}`,
  );
}

// Out-of-registry examples from the audit brief — must NOT invent a second banned list.
// They must also not pass as CONTRACT_BOUND without evidence when claimed.
for (const id of ['calendar', 'contacts', 'appointments', 'booking', 'dashboard', 'notes', 'reports'] as const) {
  const claimed = classifyModuleFallbackStatus({
    moduleId: id,
    claimedFallbackStatus: 'CONTRACT_BOUND',
    rawPrompt: 'Generic app shell.',
  });
  record(
    'B',
    `Non-registry bare "${id}" cannot claim CONTRACT_BOUND without ancestry`,
    claimed.forbidden === true && claimed.fallbackStatus === 'UNTRACED',
    'UNTRACED forbidden=true',
    `${claimed.fallbackStatus} forbidden=${claimed.forbidden}`,
  );
}

// ---------------------------------------------------------------------------
// C. Renamed / disguised fallback modules
// ---------------------------------------------------------------------------

const TIMELINE_DISGUISES = [
  'timeline-view',
  'timeline-module',
  'timeline-feature',
  'timeline-pack',
  'unified-timeline',
  'smart-timeline',
  'generic-timeline',
  'core-timeline',
  'timeline-manager',
  'timeline-workspace',
] as const;

for (const moduleId of TIMELINE_DISGUISES) {
  record(
    'C',
    `Disguise detector: ${moduleId}`,
    isDisguisedBannedForm(moduleId, 'timeline'),
    'isDisguised=true',
    `isDisguised=${isDisguisedBannedForm(moduleId, 'timeline')}`,
  );
  const c = classifyModuleFallbackStatus({
    moduleId,
    approvedModuleIds: [],
    rawPrompt: 'Show events over time in the product.',
  });
  record(
    'C',
    `Disguised timeline forbidden without ancestry: ${moduleId}`,
    c.forbidden === true,
    'forbidden=true',
    `forbidden=${c.forbidden} status=${c.fallbackStatus}`,
  );
}

const OTHER_DISGUISES: Array<{ id: string; banned: string }> = [
  { id: 'tasks-view', banned: 'tasks' },
  { id: 'smart-tasks', banned: 'tasks' },
  { id: 'inventory-module', banned: 'inventory' },
  { id: 'core-inventory', banned: 'inventory' },
  { id: 'deals-workspace', banned: 'deals' },
  { id: 'unified-leads', banned: 'leads' },
  { id: 'expenses-pack', banned: 'expenses' },
  { id: 'team-manager', banned: 'team' },
  { id: 'projects-feature', banned: 'projects' },
];

for (const { id, banned } of OTHER_DISGUISES) {
  record(
    'C',
    `Disguise detector (${banned}): ${id}`,
    isDisguisedBannedForm(id, banned),
    'isDisguised=true',
    `isDisguised=${isDisguisedBannedForm(id, banned)}`,
  );
  const c = classifyModuleFallbackStatus({
    moduleId: id,
    rawPrompt: `Mention of ${banned} somewhere in marketing copy.`,
  });
  record(
    'C',
    `Disguised ${banned} forbidden without ancestry: ${id}`,
    c.forbidden === true,
    'forbidden=true',
    `forbidden=${c.forbidden} status=${c.fallbackStatus}`,
  );
}

{
  // Disguised form WITH exact ancestry+approval may pass (generic rule, not name allowlist).
  const rescued = classifyModuleFallbackStatus({
    moduleId: 'timeline-view',
    approvedModuleIds: ['timeline-view'],
    promptRequiredModules: ['timeline-view'],
    rawPrompt: 'Explicitly require a Timeline View capability named timeline-view.',
  });
  record(
    'C',
    'Disguised form accepted only with exact ancestry+approval',
    rescued.fallbackStatus === 'CONTRACT_BOUND' && !rescued.forbidden,
    'CONTRACT_BOUND',
    rescued.fallbackStatus,
  );
}

// ---------------------------------------------------------------------------
// D. Stale physical contamination
// ---------------------------------------------------------------------------

{
  const dir = fakeWorkspace(['berths', 'timeline']);
  try {
    const scan = detectForbiddenBannedFallbackModulesInWorkspace({
      workspaceDir: dir,
      approvedModuleIds: ['berths'],
      promptRequiredModules: ['berths'],
      rawPrompt: 'Harbor berths only.',
    });
    record(
      'D',
      'Stale bare banned folder fails amid valid modules',
      !scan.passed && scan.forbiddenModuleIds.includes('timeline'),
      'forbidden includes timeline',
      scan.forbiddenModuleIds.join(',') || '(none)',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = fakeWorkspace(['occupancy-timeline', 'smart-timeline']);
  try {
    const scan = detectForbiddenBannedFallbackModulesInWorkspace({
      workspaceDir: dir,
      approvedModuleIds: ['occupancy-timeline'],
      promptRequiredModules: ['occupancy-timeline'],
      rawPrompt: 'Occupancy timeline for berths.',
    });
    record(
      'D',
      'Renamed banned folder without traceability fails',
      !scan.passed && scan.forbiddenModuleIds.includes('smart-timeline'),
      'forbidden includes smart-timeline',
      scan.forbiddenModuleIds.join(',') || '(none)',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = fakeWorkspace(['legacy-pack-tasks', 'notes']);
  try {
    // folder name containing banned term via compound disguise-ish: tasks-pack style
    const dir2 = fakeWorkspace(['tasks-pack', 'notes']);
    try {
      const scan = detectForbiddenBannedFallbackModulesInWorkspace({
        workspaceDir: dir2,
        approvedModuleIds: ['notes'],
        promptRequiredModules: ['notes'],
        rawPrompt: 'Notes app only.',
      });
      record(
        'D',
        'Copied legacy pack (tasks-pack) without ancestry fails',
        !scan.passed && scan.forbiddenModuleIds.includes('tasks-pack'),
        'forbidden includes tasks-pack',
        scan.forbiddenModuleIds.join(',') || '(none)',
      );
    } finally {
      rmSync(dir2, { recursive: true, force: true });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const orphan = classifyModuleFallbackStatus({
    moduleId: 'incident-timeline',
    approvedModuleIds: ['berths'],
    promptRequiredModules: ['berths'],
    rawPrompt: 'Berths only; no incident timeline capability.',
  });
  record(
    'D',
    'Orphaned compound absent from current contract fails',
    orphan.forbidden === true,
    'forbidden=true',
    `forbidden=${orphan.forbidden}`,
  );
}

{
  const removedAncestry = classifyModuleFallbackStatus({
    moduleId: 'activity-timeline',
    approvedModuleIds: [],
    promptRequiredModules: [],
    contractCapabilityIds: [],
    rawPrompt: 'Sources exist but ancestry was removed.',
  });
  record(
    'D',
    'Module with sources but removed manifest/contract ancestry fails',
    removedAncestry.forbidden === true,
    'forbidden=true',
    `forbidden=${removedAncestry.forbidden}`,
  );
}

// ---------------------------------------------------------------------------
// E. Prompt-language precision
// ---------------------------------------------------------------------------

record(
  'E',
  '"occupancy timeline" justifies occupancy-timeline',
  promptJustifiesExactModuleId('Manage occupancy timeline for berths.', 'occupancy-timeline'),
  'true',
  String(promptJustifiesExactModuleId('Manage occupancy timeline for berths.', 'occupancy-timeline')),
);

record(
  'E',
  '"activity timeline" justifies activity-timeline',
  promptJustifiesExactModuleId('Include an activity timeline.', 'activity-timeline'),
  'true',
  String(promptJustifiesExactModuleId('Include an activity timeline.', 'activity-timeline')),
);

record(
  'E',
  '"maintenance history" does not justify bare timeline',
  !promptJustifiesBareBannedFallback('Track maintenance history for assets.', 'timeline'),
  'false',
  String(promptJustifiesBareBannedFallback('Track maintenance history for assets.', 'timeline')),
);

{
  const soft = classifyModuleFallbackStatus({
    moduleId: 'timeline',
    approvedModuleIds: ['timeline'],
    rawPrompt: 'Show events over time for the marina.',
  });
  record(
    'E',
    '"show events over time" does not approve generic timeline fallback',
    soft.forbidden === true,
    'forbidden=true',
    `forbidden=${soft.forbidden} ancestry=${soft.hasAuthoritativeAncestry}`,
  );
}

{
  const sibling = classifyModuleFallbackStatus({
    moduleId: 'delivery-timeline',
    approvedModuleIds: ['occupancy-timeline'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Occupancy timeline for berths. The word timeline appears once.',
  });
  record(
    'E',
    'Word "timeline" + one approved compound does not approve sibling compound',
    sibling.forbidden === true,
    'forbidden=true',
    `forbidden=${sibling.forbidden}`,
  );
}

{
  const bareFromCompound = classifyModuleFallbackStatus({
    moduleId: 'timeline',
    approvedModuleIds: ['occupancy-timeline'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Occupancy timeline for berths.',
  });
  record(
    'E',
    'Approved compound does not approve bare banned term',
    bareFromCompound.forbidden === true,
    'forbidden=true',
    `forbidden=${bareFromCompound.forbidden}`,
  );
}

// ---------------------------------------------------------------------------
// F. Provenance tampering + project isolation
// ---------------------------------------------------------------------------

{
  const claim = classifyModuleFallbackStatus({
    moduleId: 'smart-timeline',
    claimedFallbackStatus: 'CONTRACT_BOUND',
    approvedModuleIds: [],
    rawPrompt: 'No supporting ancestry.',
  });
  record(
    'F',
    'Claimed CONTRACT_BOUND without ancestry fails',
    claim.forbidden && claim.fallbackStatus === 'UNTRACED',
    'UNTRACED forbidden=true',
    `${claim.fallbackStatus} forbidden=${claim.forbidden}`,
  );
}

{
  const forged = classifyModuleFallbackStatus({
    moduleId: 'occupancy-timeline',
    approvedModuleIds: ['occupancy-timeline'],
    rawPrompt: 'No occupancy phrase and no contract id.',
  });
  record(
    'F',
    'Manual approval-set insertion without corresponding contract fails',
    forged.forbidden === true,
    'forbidden=true',
    `forbidden=${forged.forbidden}`,
  );
}

{
  const missingFc = classifyModuleFallbackStatus({
    moduleId: 'case-timeline',
    approvedModuleIds: ['case-timeline'],
    contractCapabilityIds: [],
    promptRequiredModules: [],
    rawPrompt: 'Traceability points to a missing feature contract.',
  });
  record(
    'F',
    'Traceability to missing feature contract fails',
    missingFc.forbidden === true,
    'forbidden=true',
    `forbidden=${missingFc.forbidden}`,
  );
}

{
  const cross = classifyModuleFallbackStatus({
    moduleId: 'occupancy-timeline',
    approvedModuleIds: ['occupancy-timeline'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Occupancy timeline.',
    currentProjectId: 'project-harbor',
    ancestryProjectId: 'project-crm',
  });
  record(
    'F',
    'Ancestry from another project fails',
    cross.forbidden === true,
    'forbidden=true',
    `forbidden=${cross.forbidden}`,
  );
}

{
  const staleBuild = classifyModuleFallbackStatus({
    moduleId: 'activity-timeline',
    approvedModuleIds: ['activity-timeline'],
    promptRequiredModules: ['activity-timeline'],
    rawPrompt: 'Activity timeline.',
    currentBuildId: 'build-200',
    ancestryBuildId: 'build-199',
  });
  record(
    'F',
    'Stale ancestry from previous build fails',
    staleBuild.forbidden === true,
    'forbidden=true',
    `forbidden=${staleBuild.forbidden}`,
  );
}

{
  const renamed = classifyModuleFallbackStatus({
    moduleId: 'occupancy-timeline',
    approvedModuleIds: ['occupancy-timeline'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Occupancy timeline.',
    materializedFolderId: 'timeline-view',
  });
  record(
    'F',
    'Folder renamed after approval fails identity resolve',
    renamed.forbidden === true,
    'forbidden=true',
    `forbidden=${renamed.forbidden}`,
  );
}

{
  const mismatch = classifyModuleFallbackStatus({
    moduleId: 'occupancy-timeline',
    approvedModuleIds: ['occupancy_timeline'],
    contractCapabilityIds: ['Occupancy Timeline'],
    promptRequiredModules: [],
    rawPrompt: '',
  });
  // Normalization should align occupancy_timeline / Occupancy Timeline → occupancy-timeline
  record(
    'F',
    'Normalized identity resolves across approval + contract forms',
    mismatch.fallbackStatus === 'CONTRACT_BOUND' && !mismatch.forbidden,
    'CONTRACT_BOUND',
    mismatch.fallbackStatus,
  );
}

{
  const isolation = classifyWorkspaceBannedFallbackContamination({
    workspaceModuleIds: ['occupancy-timeline'],
    approvedModuleIds: ['occupancy-timeline'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Occupancy timeline.',
    currentProjectId: 'app-a',
    ancestryProjectId: 'app-b',
  });
  record(
    'F',
    'Project isolation: foreign ancestry cannot authorize module',
    !isolation.passed,
    'passed=false',
    `passed=${isolation.passed}`,
  );
}

{
  const sameProject = classifyWorkspaceBannedFallbackContamination({
    workspaceModuleIds: ['occupancy-timeline'],
    approvedModuleIds: ['occupancy-timeline'],
    promptRequiredModules: ['occupancy-timeline'],
    rawPrompt: 'Occupancy timeline.',
    currentProjectId: 'app-a',
    ancestryProjectId: 'app-a',
    currentBuildId: 'b1',
    ancestryBuildId: 'b1',
  });
  record(
    'F',
    'Project isolation: matching project/build binding still accepts',
    sameProject.passed && sameProject.allowedCompoundModuleIds.includes('occupancy-timeline'),
    'passed=true with occupancy-timeline',
    `passed=${sameProject.passed} allowed=${sameProject.allowedCompoundModuleIds.join(',')}`,
  );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const failed = results.filter((r) => !r.passed);
const byClass = (cls: string) => results.filter((r) => r.class === cls);

console.log('\n=== CONTRACT_BOUND_COMPOUND_MODULE_HARDENING_V1 ===\n');
for (const cls of ['A', 'B', 'C', 'D', 'E', 'F']) {
  const rows = byClass(cls);
  const pass = rows.filter((r) => r.passed).length;
  console.log(`Class ${cls}: ${pass}/${rows.length} passed`);
  for (const row of rows) {
    const mark = row.passed ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${row.name}`);
    if (!row.passed) {
      console.log(`         expected: ${row.expected}`);
      console.log(`         actual:   ${row.actual}`);
    }
  }
}

console.log(`\nTotal: ${results.filter((r) => r.passed).length}/${results.length}`);
console.log(`Canonical banned registry: ${BANNED_FALLBACK_MODULES.join(', ')}`);
console.log(`Root: ${ROOT}`);

if (failed.length === 0) {
  console.log(`\n${PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\nFAILED (${failed.length}):`);
for (const row of failed) console.log(` - [${row.class}] ${row.name}: ${row.actual}`);
process.exit(1);
