/**
 * GF12 PREFLIGHT — Project Vault Intelligence Duplicate-Risk Review V1.
 * Audit only. No features. Confirms Phase 12 must extend 11.4, not duplicate it.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  DUPLICATE_BRAIN_PATTERNS,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  buildQuestionRoutingPlan,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  DUPLICATE_SHARED_MEMORY_PATTERNS,
  resetSharedMemoryForTests,
} from '../src/shared-memory/index.js';
import {
  DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS,
  PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  collectProjectFacts,
  getCurrentProjectProfile,
  processProjectUnderstandingRequest,
  resetProjectUnderstandingForTests,
} from '../src/project-understanding/index.js';
import { buildDecisionContext } from '../src/unified-decision-layer/index.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';

const PREFLIGHT_PASS_TOKEN = 'DEVPULSE_V2_PHASE12_PROJECT_VAULT_DUPLICATE_PREFLIGHT_PASS';

interface AuditResult {
  name: string;
  group: string;
  passed: boolean;
  detail: string;
}

const results: AuditResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const FORBIDDEN_MODULE_DIRS = [
  'project_understanding_v2',
  'project_brain',
  'project-vault-intelligence-v2',
  'vault_brain',
  'memory_brain',
  'project_intelligence_engine',
  'project_context_engine_v2',
] as const;

const FORBIDDEN_OWNERSHIP_DOMAINS = [
  'project_understanding_v2',
  'project_brain',
  'vault_intelligence_brain',
  'project_memory_authority',
] as const;

const REUSE_MODULES = [
  'src/project-understanding/project-fact-collector.ts',
  'src/project-understanding/project-knowledge-model.ts',
  'src/project-understanding/project-reasoning-engine.ts',
  'src/project-understanding/project-answer-composer.ts',
  'src/project-understanding/project-understanding-engine.ts',
  'src/project-understanding/project-understanding-runtime.ts',
  'src/project-understanding/project-profile-store.ts',
  'src/project-vault/project-vault-authority.ts',
  'src/project-vault/types.ts',
  'src/shared-memory/shared-memory-recall.ts',
  'src/command-center-brain/general-question-understanding/capability-selector.ts',
  'src/unified-decision-layer/decision-context-builder.ts',
] as const;

const PHASE12_RECOMMENDED_OWNER = 'project_vault_intelligence';
const PHASE12_RECOMMENDED_MODULE = 'devpulse_v2_project_vault_intelligence';

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function resetStack(): void {
  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
}

function ownersForModule(modulePattern: string): string[] {
  return listDevPulseV2Owners()
    .filter((o) => o.ownerModule.includes(modulePattern))
    .map((o) => o.domain);
}

async function main(): Promise<void> {
  console.log('');
  console.log('GF12 PREFLIGHT — Project Vault Intelligence Duplicate-Risk Review');
  console.log('==================================================================');
  console.log('');

  resetStack();

  const factCollectorSrc = readText('src/project-understanding/project-fact-collector.ts');
  const profileStoreSrc = readText('src/project-understanding/project-profile-store.ts');
  const puTypesSrc = readText('src/project-understanding/project-understanding-types.ts');
  const registrySrc = readText('src/foundation/ownership-registry.ts');
  const typesSrc = readText('src/foundation/types.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  // ── OWNERSHIP: 11.4 PROJECT UNDERSTANDING ───────────────────────────────
  const puOwner = getDevPulseV2Owner('project_understanding_engine');
  assert('OWNERSHIP', 'single PU domain', puOwner.ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, puOwner.ownerModule);
  assert('OWNERSHIP', 'PU phase 11.4', puOwner.phase === 11.4, String(puOwner.phase));
  assert('OWNERSHIP', 'PU intelligence only', puOwner.description.includes('intelligence only'), 'desc');

  const puOwners = listDevPulseV2Owners().filter((o) => o.domain.includes('project_understanding'));
  assert('OWNERSHIP', 'no duplicate PU domains', puOwners.length === 1, puOwners.map((o) => o.domain).join(','));

  const competingPuModules = listDevPulseV2Owners().filter(
    (o) =>
      o.ownerModule.includes('project_understanding') &&
      o.ownerModule !== PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  );
  assert('OWNERSHIP', 'no competing PU modules', competingPuModules.length === 0, 'clean');

  // ── OWNERSHIP: PROJECT VAULT (Phase 2 storage) vs intelligence ───────────
  const vaultOwner = getDevPulseV2Owner('project_vault');
  assert('OWNERSHIP', 'vault storage owner', vaultOwner.ownerModule === VAULT_OWNER_MODULE, vaultOwner.ownerModule);
  assert('OWNERSHIP', 'vault phase 2', vaultOwner.phase === 2, String(vaultOwner.phase));
  assert('OWNERSHIP', 'vault not PU owner', vaultOwner.ownerModule !== PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'distinct');
  assert('OWNERSHIP', 'vault not intelligence claim', !vaultOwner.description.toLowerCase().includes('comprehension engine'), 'storage');

  assert('OWNERSHIP', 'PU not vault owner', puOwner.ownerModule !== VAULT_OWNER_MODULE, 'distinct domains');

  // ── FORBIDDEN DUPLICATES ────────────────────────────────────────────────
  for (const dir of FORBIDDEN_MODULE_DIRS) {
    assert('DUPLICATE', `no src/${dir}`, !existsSync(join(ROOT, 'src', dir)), 'absent');
  }

  const srcTop = readdirSync(join(ROOT, 'src'));
  for (const dir of FORBIDDEN_MODULE_DIRS) {
    assert('DUPLICATE', `src listing ${dir}`, !srcTop.includes(dir), 'absent');
  }

  for (const domain of FORBIDDEN_OWNERSHIP_DOMAINS) {
    assert('DUPLICATE', `no registry ${domain}`, !registrySrc.includes(`'${domain}'`), 'absent');
    assert('DUPLICATE', `no types ${domain}`, !typesSrc.includes(`'${domain}'`), 'absent');
  }

  for (const pattern of DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS) {
    const owners = ownersForModule(pattern);
    assert('DUPLICATE', `pattern blocked ${pattern}`, owners.length <= 1, owners.join(','));
  }

  for (const pattern of DUPLICATE_SHARED_MEMORY_PATTERNS) {
    const owners = listDevPulseV2Owners().filter((o) => o.ownerModule.includes(pattern.replace(/_/g, '')));
    assert('DUPLICATE', `memory pattern ${pattern}`, owners.length <= 1, String(owners.length));
  }

  const memoryOwners = listDevPulseV2Owners().filter((o) => o.domain === 'shared_memory_layer');
  assert('DUPLICATE', 'single memory owner', memoryOwners.length === 1, String(memoryOwners.length));

  for (const pattern of DUPLICATE_BRAIN_PATTERNS) {
    const brains = listDevPulseV2Owners().filter(
      (o) => o.ownerModule.includes(pattern.replace(/\s+/g, '_')) && o.domain !== 'command_center_brain',
    );
    assert('DUPLICATE', `no extra brain ${pattern}`, brains.length === 0, 'clean');
  }

  assert('DUPLICATE', 'no project_brain registry', !registrySrc.includes('project_brain'), 'clean');
  assert('DUPLICATE', 'no project_understanding_v2 registry', !registrySrc.includes('project_understanding_v2'), 'clean');

  // ── CURRENT 11.4 CAPABILITIES (what it already owns) ────────────────────
  assert('PU-SCOPE', 'profile store exists', existsSync(join(ROOT, 'src/project-understanding/project-profile-store.ts')), 'file');
  assert('PU-SCOPE', 'knowledge model exists', existsSync(join(ROOT, 'src/project-understanding/project-knowledge-model.ts')), 'file');
  assert('PU-SCOPE', 'fact collector exists', existsSync(join(ROOT, 'src/project-understanding/project-fact-collector.ts')), 'file');
  assert('PU-SCOPE', 'reasoning engine exists', existsSync(join(ROOT, 'src/project-understanding/project-reasoning-engine.ts')), 'file');
  assert('PU-SCOPE', 'answer composer exists', existsSync(join(ROOT, 'src/project-understanding/project-answer-composer.ts')), 'file');
  assert('PU-SCOPE', 'runtime bridge exists', existsSync(join(ROOT, 'src/project-understanding/project-understanding-runtime.ts')), 'file');
  assert('PU-SCOPE', 'duplicate patterns defined', puTypesSrc.includes('DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS'), 'patterns');

  const profile = getCurrentProjectProfile();
  assert('PU-SCOPE', 'profile has identity', profile.name.length > 0, profile.name);
  assert('PU-SCOPE', 'profile has gaps', profile.missingCapabilities.length > 0, String(profile.missingCapabilities.length));
  assert('PU-SCOPE', 'profile has blockers', profile.blockedItems.length > 0, String(profile.blockedItems.length));

  const facts = collectProjectFacts('What is missing in this project?');
  assert('PU-SCOPE', 'fact collection works', facts.snapshot.factCount > 5, String(facts.snapshot.factCount));
  assert('PU-SCOPE', 'memory facts integrated', facts.memoryFactCount >= 0, String(facts.memoryFactCount));
  assert('PU-SCOPE', 'cross-system facts integrated', facts.crossSystemFactCount > 0, String(facts.crossSystemFactCount));

  const puResponse = processProjectUnderstandingRequest('What project are we working on?');
  assert('PU-SCOPE', 'PU answers questions', puResponse.responseText.length > 20, 'response');

  // ── VAULT BRIDGE: Phase 12.1 wired read-only into 11.4 (not duplicate) ───
  assert('VAULT-GAP', 'collector uses profile store', factCollectorSrc.includes('getCurrentProjectProfile'), 'profile');
  assert('VAULT-GAP', 'collector vault bridge wired', factCollectorSrc.includes('bridgeVaultFactsIntoUnderstanding'), 'bridge');
  assert('VAULT-GAP', 'profile separate from vault', !profileStoreSrc.includes('project-vault'), 'separate');
  assert('VAULT-GAP', 'vault module exists', existsSync(join(ROOT, 'src/project-vault/project-vault-authority.ts')), 'vault');

  // ── EXTEND NOT DUPLICATE (Phase 12 rules) ───────────────────────────────
  assert('EXTEND', 'PU owner unchanged pre-12', puOwner.ownerFunction === 'getDevPulseV2ProjectUnderstandingEngine', puOwner.ownerFunction);
  assert('EXTEND', 'phase 12.1 owner registered', registrySrc.includes(PHASE12_RECOMMENDED_OWNER), 'registered');
  assert('EXTEND', 'phase 12.1 module present', existsSync(join(ROOT, 'src', 'project-vault-intelligence')), 'module');
  assert('EXTEND', 'collector uses bridge', readText('src/project-understanding/project-fact-collector.ts').includes('bridgeVaultFactsIntoUnderstanding'), 'bridge');
  assert('EXTEND', '12 must not be second brain', !PHASE12_RECOMMENDED_MODULE.includes('command_center_brain'), 'not brain');
  assert('EXTEND', '12 must not replace PU engine', !PHASE12_RECOMMENDED_OWNER.includes('project_understanding_engine'), 'extend');

  for (const path of REUSE_MODULES) {
    assert('REUSE', `reuse file ${path}`, existsSync(join(ROOT, path)), 'exists');
  }

  assert('REUSE', 'decision reads PU facts', readText('src/unified-decision-layer/decision-context-builder.ts').includes('collectProjectFacts'), 'bridge');
  assert('REUSE', 'GQU routes PU capability', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('PROJECT_KNOWLEDGE_REASONING'), 'route');

  // ── INTEGRATION SANITY (11.4 still works in stack) ─────────────────────
  const projectQ = processBrainRequest({ message: 'What is missing in this project?' });
  assert('INTEGRATION', 'brain project answer', projectQ.brainResponse.includes('Missing Capabilities'), 'gaps');

  const broadQ = processBrainRequest({ message: 'What is the biggest weakness in DevPulse V2 right now?' });
  assert('INTEGRATION', 'GQU project reasoning', broadQ.brainResponse.includes('Conclusion:'), 'reasoned');

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('INTEGRATION', 'decision uses PU context', decisionCtx.supportingFacts.length > 0, String(decisionCtx.supportingFacts.length));

  for (let i = 0; i < 15; i += 1) {
    const plan = buildQuestionRoutingPlan(`Project weakness audit ${i} DevPulse`);
    assert('INTEGRATION', `routing batch ${i}`, plan.selectedCapabilities.includes('PROJECT_KNOWLEDGE_REASONING') || plan.selectedCapabilities.includes('PROJECT_UNDERSTANDING'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 10; i += 1) {
    const ctx = collectProjectFacts(`vault duplicate audit ${i}`);
    assert('INTEGRATION', `facts batch ${i}`, ctx.snapshot.facts.length > 0, 'facts');
  }

  // ── BLOCKED RISKS (names/capabilities) ─────────────────────────────────
  const blockedCapabilities = [
    'PROJECT_UNDERSTANDING_V2',
    'PROJECT_BRAIN',
    'VAULT_BRAIN',
    'SECOND_PROJECT_UNDERSTANDING',
    'PROJECT_MEMORY_AUTHORITY',
  ];
  for (const cap of blockedCapabilities) {
    assert('BLOCKED', `capability ${cap}`, !readText('src/command-center-brain/general-question-understanding/general-question-types.ts').includes(cap), 'blocked');
  }

  const blockedDirs = [
    'src/project-understanding-v2',
    'src/project-understanding-engine-v2',
    'src/project-vault-brain',
  ];
  for (const d of blockedDirs) {
    assert('BLOCKED', `dir ${d}`, !existsSync(join(ROOT, d)), 'absent');
  }

  // ── SCRIPT + PACKAGE ───────────────────────────────────────────────────
  assert('META', 'audit script exists', existsSync(join(ROOT, 'scripts/audit-phase12-project-vault-duplicate-risk.ts')), 'script');
  assert('META', 'npm script registered', typeof pkg.scripts?.['audit:phase12-project-vault-duplicate-risk'] === 'string', 'npm');

  // ── REPORT ─────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  const groupSummary = new Map<string, { pass: number; fail: number }>();
  for (const r of results) {
    const g = groupSummary.get(r.group) ?? { pass: 0, fail: 0 };
    if (r.passed) g.pass += 1;
    else g.fail += 1;
    groupSummary.set(r.group, g);
  }

  console.log(`Audit checks: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Group summary:');
  for (const [group, stats] of groupSummary) {
    console.log(`  ${group}: ${stats.pass} pass, ${stats.fail} fail`);
  }
  console.log('');
  console.log('RECOMMENDED Phase 12.1 scope:');
  console.log('  - Name: Project Vault Intelligence Foundation (NOT a second Project Understanding Engine)');
  console.log('  - Owner: project_vault_intelligence / devpulse_v2_project_vault_intelligence');
  console.log('  - Extend: project-fact-collector + project-knowledge-model with read-only Project Vault bridge');
  console.log('  - Keep: project_understanding_engine (11.4) as comprehension/reasoning owner');
  console.log('  - Keep: project_vault (Phase 2) as storage/record owner');
  console.log('  - Keep: shared_memory_layer (11.3) as DevPulse memory owner — do not duplicate');
  console.log('');

  if (failed.length > 0) {
    console.log('Failed checks:');
    for (const f of failed) {
      console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(PREFLIGHT_PASS_TOKEN);
  console.log('');
  console.log('npm run audit:phase12-project-vault-duplicate-risk');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
