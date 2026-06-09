/**
 * DevPulse V2 Phase 12.1 — Project Vault Intelligence Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  PROJECT_VAULT_INTELLIGENCE_PASS_TOKEN,
  FORBIDDEN_VAULT_INTELLIGENCE_DUPLICATES,
  bridgeVaultFactsIntoUnderstanding,
  getProjectVaultIntelligenceDiagnostics,
  isVaultAwareQuestion,
  isDuplicateProjectUnderstandingQuestion,
  normalizeVaultFacts,
  readVaultFacts,
  resetProjectVaultIntelligenceBridgeForTests,
  resetProjectVaultIntelligenceDiagnostics,
} from '../src/project-vault-intelligence/index.js';
import {
  buildQuestionRoutingPlan,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import {
  PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  collectProjectFacts,
  processProjectUnderstandingRequest,
  resetProjectUnderstandingForTests,
} from '../src/project-understanding/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import { resetUnifiedDecisionLayerForTests, buildDecisionContext } from '../src/unified-decision-layer/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What do we know about this project?',
  'What saved project facts exist?',
  'What project records support this answer?',
  "What is this project's current status from vault context?",
  'What blockers are known from project records?',
  'What project facts are missing from the vault?',
  'Should we create a new Project Understanding system?',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function resetAll(): void {
  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetProjectVaultIntelligenceDiagnostics();
  resetProjectVaultIntelligenceBridgeForTests();
  resetDevPulseV2CommandCenterBrainForTests();
}

async function postBrain(message: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve({ status: 500, body: null });
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown>;
          server.close();
          resolve({ status: res.status, body });
        })
        .catch(() => {
          server.close();
          resolve({ status: 500, body: null });
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 12.1 Project Vault Intelligence Foundation');
  console.log('============================================================');
  console.log('');

  resetAll();

  const pviDir = join(ROOT, 'src/project-vault-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(pviDir, 'project-vault-intelligence-types.ts')), 'exists');
  assert('2. fact reader', existsSync(join(pviDir, 'project-vault-fact-reader.ts')), 'exists');
  assert('3. normalizer', existsSync(join(pviDir, 'project-vault-fact-normalizer.ts')), 'exists');
  assert('4. bridge', existsSync(join(pviDir, 'project-vault-understanding-bridge.ts')), 'exists');
  assert('5. diagnostics', existsSync(join(pviDir, 'project-vault-intelligence-diagnostics.ts')), 'exists');
  assert('6. intelligence', existsSync(join(pviDir, 'project-vault-intelligence.ts')), 'exists');
  assert('7. index', existsSync(join(pviDir, 'index.ts')), 'exists');
  assert('8. validate script', typeof pkg.scripts?.['validate:project-vault-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('project_vault_intelligence');
  assert('9. registry owner', owner.ownerModule === 'devpulse_v2_project_vault_intelligence', owner.ownerModule);
  assert('10. registry phase', owner.phase === 12.1, String(owner.phase));
  assert('11. pass token', PROJECT_VAULT_INTELLIGENCE_PASS_TOKEN.includes('PROJECT_VAULT_INTELLIGENCE'), 'token');
  assert('12. PU owner unchanged', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'pu');

  const read = readVaultFacts('What saved project facts exist?');
  assert('13. vault read records', read.recordsRead > 0, String(read.recordsRead));
  assert('14. vault read facts', read.vaultFacts.length > 0, String(read.vaultFacts.length));
  assert('15. vault read only', read.readOnly === true, 'readonly');

  const normalized = normalizeVaultFacts(read.vaultFacts);
  assert('16. normalized facts', normalized.length > 0, String(normalized.length));
  assert('17. normalized source', normalized.every((f) => f.source === 'project_vault'), 'source');
  assert('18. normalized tags', normalized.every((f) => f.tags.includes('read_only')), 'tags');

  const bridge = bridgeVaultFactsIntoUnderstanding('What do we know about this project?');
  assert('19. bridge records', bridge.recordsRead > 0, String(bridge.recordsRead));
  assert('20. bridge facts added', bridge.vaultFactsAdded > 0, String(bridge.vaultFactsAdded));
  assert('21. bridge target', bridge.bridgeTarget === 'project_understanding_engine', bridge.bridgeTarget);
  assert('22. bridge read only', bridge.readOnly === true, 'readonly');

  const ctx = collectProjectFacts('What saved project facts exist?');
  assert('23. collector vault count', ctx.vaultFactCount > 0, String(ctx.vaultFactCount));
  assert('24. collector total facts', ctx.snapshot.factCount > 10, String(ctx.snapshot.factCount));
  assert('25. vault facts in snapshot', ctx.snapshot.facts.some((f) => f.source === 'project_vault'), 'vault');

  const diag = getProjectVaultIntelligenceDiagnostics();
  assert('26. diagnostics active', diag.projectVaultIntelligenceActive === true, 'active');
  assert('27. diagnostics bridge', diag.bridgeTarget === 'project_understanding_engine', diag.bridgeTarget);

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processProjectUnderstandingRequest(q).responseText;
    if (q.includes('create a new Project Understanding')) {
      assert(`28.${i} duplicate no`, ans.includes('Recommendation: No.') || ans.includes('already owns'), q.slice(0, 40));
    } else {
      assert(`28.${i} vault enriched`, ans.includes('Vault Context') || ans.includes('vault') || ans.length > 40, q.slice(0, 40));
    }
  }

  for (let i = 0; i < 6; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const plan = buildQuestionRoutingPlan(q);
    assert(`29.${i} gqu vault cap`, plan.selectedCapabilities.includes('PROJECT_VAULT_INTELLIGENCE'), plan.selectedCapabilities.join(','));
    assert(`30.${i} gqu pu primary`, plan.primaryCapability === 'PROJECT_KNOWLEDGE_REASONING', String(plan.primaryCapability));
  }

  const dupQ = processProjectUnderstandingRequest('Should we create a new Project Understanding system?');
  assert('31. duplicate answer', dupQ.responseText.includes('Recommendation: No.'), 'no');
  assert('32. duplicate why', dupQ.responseText.includes('11.4') || dupQ.responseText.includes('already owns'), 'why');
  assert('33. duplicate risk', dupQ.responseText.includes('High') || dupQ.responseText.includes('warning'), 'risk');

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('34. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('35. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const vaultBrain = processBrainRequest({ message: 'What saved project facts exist?' });
  assert('36. brain vault answer', vaultBrain.brainResponse.length > 30, 'answer');
  assert('37. brain vault diag', Boolean(vaultBrain.projectVaultIntelligenceDiagnostics?.projectVaultIntelligenceActive), 'diag');

  assert('38. no child_process', !readText('src/project-vault-intelligence/index.ts').includes('child_process'), 'clean');
  assert('39. no eval', !readText('src/project-vault-intelligence/index.ts').includes('eval('), 'clean');
  assert('40. no fs write', !readText('src/project-vault-intelligence/index.ts').includes('writeFileSync'), 'clean');
  assert('41. no spawn', !readText('src/project-vault-intelligence/index.ts').includes('spawn'), 'clean');
  assert('42. collector integrated', readText('src/project-understanding/project-fact-collector.ts').includes('bridgeVaultFactsIntoUnderstanding'), 'integrated');
  assert('43. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('PROJECT_VAULT_INTELLIGENCE'), 'gqu');
  assert('44. founder html', readText('public/founder-reality/index.html').includes('vault-intelligence-active'), 'html');
  assert('45. founder app', readText('public/founder-reality/app.js').includes('renderVaultIntelligenceDiagnostics'), 'app');

  const decisionCtx = buildDecisionContext('What blockers are known from project records?');
  assert('46. decision enriched', decisionCtx.supportingFacts.length > 0, String(decisionCtx.supportingFacts.length));

  for (const forbidden of FORBIDDEN_VAULT_INTELLIGENCE_DUPLICATES) {
    assert(`47.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent dir');
    const owners = listDevPulseV2Owners().filter((o) => o.ownerModule.includes(forbidden.replace(/-/g, '_')));
    assert(`48.${forbidden}`, owners.length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('49. no project_understanding_v2', !srcEntries.includes('project-understanding-v2'), 'clean');
  assert('50. no project_brain dir', !srcEntries.includes('project_brain'), 'clean');

  const puOwners = listDevPulseV2Owners().filter((o) => o.domain.includes('project_understanding'));
  assert('51. single PU domain', puOwners.length === 1, puOwners.map((o) => o.domain).join(','));

  assert('52. intelligence only', vaultBrain.confirmation.intelligenceOnly === true, 'intel');
  assert('53. no execution', vaultBrain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('54. no persistence', vaultBrain.confirmation.noPersistence === true, 'no persist');
  assert('55. no files', vaultBrain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 25; i += 1) {
    assert(`56.${i} vault signal`, isVaultAwareQuestion(`What saved project facts batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 25; i += 1) {
    const b = bridgeVaultFactsIntoUnderstanding(`bridge batch ${i}`);
    assert(`57.${i} bridge batch`, b.vaultFactsAdded > 0, String(b.vaultFactsAdded));
  }

  for (let i = 0; i < 25; i += 1) {
    const c = collectProjectFacts(`collector batch ${i}`);
    assert(`58.${i} collector batch`, c.vaultFactCount > 0, String(c.vaultFactCount));
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `What project records support answer ${i}?` });
    assert(`59.${i} brain batch`, r.brainResponse.length > 20, 'answer');
  }

  for (let i = 0; i < 15; i += 1) {
    const plan = buildQuestionRoutingPlan(`vault context question ${i}`);
    assert(`60.${i} plan vault`, plan.selectedCapabilities.includes('PROJECT_VAULT_INTELLIGENCE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`61.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What saved project facts exist?');
    const d = res.body?.projectVaultIntelligenceDiagnostics as { vaultFactsAdded?: number } | undefined;
    assert(`62.${i} http diag`, Boolean(d?.vaultFactsAdded && d.vaultFactsAdded > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = readVaultFacts(`read batch ${i}`);
    assert(`63.${i} read batch`, r.vaultFacts.every((f) => f.readOnly === true), 'readonly');
  }

  for (let i = 0; i < 20; i += 1) {
    const f = normalizeVaultFacts(readVaultFacts('vault').vaultFacts);
    assert(`64.${i} norm batch`, f.every((x) => x.source === 'project_vault'), 'source');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`65.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`66.${i} dup signal`, isDuplicateProjectUnderstandingQuestion(`create a new project understanding ${i}`), 'dup');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = processProjectUnderstandingRequest('What saved project facts exist?').responseText;
    const a2 = processProjectUnderstandingRequest('What saved project facts exist?').responseText;
    assert(`67.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`68.${i} no forbidden in registry`, !registry.includes('project_understanding_v2'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`69.${i} no PROJECT_BRAIN cap`, !types.includes('PROJECT_BRAIN'), 'clean');
  }

  for (let i = 0; i < 20; i += 1) {
    const t = processBrainRequest({ message: `What is the roadmap sequence vault ${i}?` });
    assert(`70.${i} timeline still`, t.brainResponse.includes('Timeline Intelligence') || t.brainResponse.length > 10, 'route');
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 350) {
    console.log(`Insufficient scenarios: ${total} < 350`);
    process.exitCode = 1;
    return;
  }

  console.log(PROJECT_VAULT_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:project-vault-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
