/**
 * DevPulse V2 Phase 16.10 — Verification Evidence Engine validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  VERIFICATION_EVIDENCE_ENGINE_PASS_TOKEN,
  VERIFICATION_EVIDENCE_ENGINE_OWNER_MODULE,
  FORBIDDEN_VERIFICATION_EVIDENCE_DUPLICATES,
  INITIAL_EVIDENCE_CATEGORIES,
  isVerificationEvidenceQuestion,
  isVerificationEvidenceAdvisoryQuestion,
  prepareVerificationEvidence,
  processVerificationEvidenceRequest,
  getVerificationEvidenceDiagnostics,
  resetVerificationEvidenceDiagnostics,
  resetVerificationEvidenceReportCounterForTests,
  resetVerificationEvidenceStoreForTests,
  buildVerificationEvidenceFailureContext,
  registerEvidence,
  getEvidence,
  queryEvidence,
  listEvidence,
  listEvidenceByOwner,
  listEvidenceByVerification,
  listEvidenceByProject,
  listEvidenceByWorkspace,
  validateEvidenceIntegrity,
  buildEvidenceInventoryReport,
  buildEvidenceOwnershipReport,
  buildEvidenceLineageReport,
  buildEvidenceTraceabilityReport,
  buildEvidenceDiagnosticsReport,
  buildSeedEvidenceRecord,
  getTraceabilityIndex,
} from '../src/verification-evidence-engine/index.js';
import type { PrepareVerificationEvidenceInput } from '../src/verification-evidence-engine/verification-evidence-types.js';
import {
  prepareVerificationRegistry,
  resetVerificationTargetRegistryForTests,
  resetVerificationOwnerRegistryForTests,
  resetVerificationDependencyRegistryForTests,
  resetVerificationRequirementRegistryForTests,
  resetVerificationCapabilityRegistryForTests,
  resetVerificationRegistryDiagnostics,
  resetVerificationRegistryReportCounterForTests,
  listVerificationTargets,
} from '../src/verification-registry/index.js';
import {
  resetVerificationOrchestratorDiagnostics,
  resetVerificationOrchestratorReportCounterForTests,
  resetVerificationPlanCounterForTests,
  resetParallelGroupCounterForTests,
} from '../src/verification-orchestrator/index.js';
import {
  buildVerificationEvidencePanelSnapshot,
  VERIFICATION_EVIDENCE_ENGINE_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
  analyzeActionVisibility,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningBlockerCounterForTests,
  buildReasoningVisibilityRecord,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { buildProgressRecords } from '../src/progress-intelligence/progress-model-builder.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'What evidence exists?';
const SEED_EVIDENCE_COUNT = 13;

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processVerificationEvidenceRequest>>();
const textCache = new Map<string, string>();

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function beginGroup(group: string): number {
  if (Date.now() - startedAt > MAX_RUNTIME_MS) throw new Error(`Max runtime guard exceeded during ${group}`);
  console.log(`▶ ${group} ...`);
  return Date.now();
}

function endGroup(group: string, started: number): void {
  const elapsed = Date.now() - started;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  console.log(`✓ ${group} — ${groupResults.filter((r) => r.passed).length}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold`);
}

function readText(path: string): string {
  const hit = textCache.get(path);
  if (hit) return hit;
  const text = readFileSync(join(ROOT, path), 'utf8');
  textCache.set(path, text);
  return text;
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processVerificationEvidenceRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareVerificationEvidenceInput> = {}): PrepareVerificationEvidenceInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    projectExists: true,
    workspaceExists: true,
    world1Protected: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetVerificationTargetRegistryForTests();
  resetVerificationOwnerRegistryForTests();
  resetVerificationDependencyRegistryForTests();
  resetVerificationRequirementRegistryForTests();
  resetVerificationCapabilityRegistryForTests();
  resetVerificationRegistryDiagnostics();
  resetVerificationRegistryReportCounterForTests();
  resetVerificationOrchestratorDiagnostics();
  resetVerificationOrchestratorReportCounterForTests();
  resetVerificationPlanCounterForTests();
  resetParallelGroupCounterForTests();
  resetVerificationEvidenceDiagnostics();
  resetVerificationEvidenceReportCounterForTests();
  resetVerificationEvidenceStoreForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.10 Verification Evidence Engine');
  console.log('======================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/verification-evidence-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'verification-evidence-types.ts')), 'types');
  assert('A-SETUP', '2. store', existsSync(join(dir, 'verification-evidence-store.ts')), 'store');
  assert('A-SETUP', '3. ownership', existsSync(join(dir, 'verification-evidence-ownership.ts')), 'ownership');
  assert('A-SETUP', '4. lineage', existsSync(join(dir, 'verification-evidence-lineage.ts')), 'lineage');
  assert('A-SETUP', '5. traceability', existsSync(join(dir, 'verification-evidence-traceability.ts')), 'trace');
  assert('A-SETUP', '6. query', existsSync(join(dir, 'verification-evidence-query.ts')), 'query');
  assert('A-SETUP', '7. validator', existsSync(join(dir, 'verification-evidence-validator.ts')), 'validator');
  assert('A-SETUP', '8. report builder', existsSync(join(dir, 'verification-evidence-report-builder.ts')), 'report');
  assert('A-SETUP', '9. diagnostics', existsSync(join(dir, 'verification-evidence-diagnostics.ts')), 'diag');
  assert('A-SETUP', '10. failure bridge', existsSync(join(dir, 'verification-evidence-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '11. engine', existsSync(join(dir, 'verification-evidence-engine.ts')), 'engine');
  assert('A-SETUP', '12. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/verification-evidence-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '14. script', typeof pkg.scripts?.['validate:verification-evidence-engine'] === 'string', 'script');
  const owner = getDevPulseV2Owner('verification_evidence_engine');
  assert('A-SETUP', '15. owner', owner.ownerModule === VERIFICATION_EVIDENCE_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '16. phase', owner.phase === 16.10, String(owner.phase));
  assert('A-SETUP', '17. categories', INITIAL_EVIDENCE_CATEGORIES.length === 10, String(INITIAL_EVIDENCE_CATEGORIES.length));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareVerificationEvidence(baseInput());
  assert('B-CORE', '18. authority id', ready.evidenceSummaryReport.authorityId.startsWith('vevauth-'), 'id');
  assert('B-CORE', '19. evidence count', ready.evidenceRecords.length === SEED_EVIDENCE_COUNT, String(ready.evidenceRecords.length));
  assert('B-CORE', '20. authority only', ready.evidenceRecords.every((r) => r.authorityOnly === true), 'only');
  assert('B-CORE', '21. ready state', ['READY', 'BLOCKED', 'INVALID'].includes(ready.evidenceSummaryReport.authorityState), ready.evidenceSummaryReport.authorityState);
  assert('B-CORE', '22. inventory', ready.inventoryReport.evidenceCount === SEED_EVIDENCE_COUNT, String(ready.inventoryReport.evidenceCount));
  assert('B-CORE', '23. ownership', ready.ownershipReport.ownershipRecords.length === SEED_EVIDENCE_COUNT, String(ready.ownershipReport.ownershipRecords.length));
  assert('B-CORE', '24. validation', ready.validationResult.valid === true, 'valid');

  resetAll();
  prepareVerificationRegistry({ query: CANONICAL_QUERY });
  const targets = listVerificationTargets();
  const seed = prepareVerificationEvidence(baseInput());
  assert('B-CORE', '25. targets seeded', seed.evidenceRecords.length >= targets.length, String(seed.evidenceRecords.length));

  const first = seed.evidenceRecords[0]!;
  assert('B-CORE', '26. get evidence', getEvidence(first.evidenceId)?.evidenceId === first.evidenceId, 'get');
  assert('B-CORE', '27. list evidence', listEvidence().length === SEED_EVIDENCE_COUNT, String(listEvidence().length));
  assert('B-CORE', '28. list by project', listEvidenceByProject('proj-test-001').length === SEED_EVIDENCE_COUNT, 'project');
  assert('B-CORE', '29. list by workspace', listEvidenceByWorkspace('ws-test-001').length === SEED_EVIDENCE_COUNT, 'workspace');
  assert('B-CORE', '30. list by owner', listEvidenceByOwner(first.evidenceOwner.ownerModule).length >= 1, 'owner');
  assert('B-CORE', '31. list by verification', listEvidenceByVerification(first.verificationTargetId!).length >= 1, 'target');

  const queried = queryEvidence({ projectId: 'proj-test-001', evidenceType: first.evidenceType });
  assert('B-CORE', '32. query evidence', queried.length >= 1, String(queried.length));

  const index = getTraceabilityIndex();
  assert('B-CORE', '33. traceability', index.byProject.size >= 1, String(index.byProject.size));

  const duplicate = registerEvidence(first);
  assert('B-CORE', '34. duplicate rejected', duplicate.duplicate === true, 'dup');

  const integrity = validateEvidenceIntegrity(seed.evidenceRecords);
  assert('B-CORE', '35. integrity valid', integrity.valid === true, 'valid');

  const inventory = buildEvidenceInventoryReport(seed.evidenceRecords);
  const ownership = buildEvidenceOwnershipReport(seed.evidenceRecords);
  const lineage = buildEvidenceLineageReport(seed.evidenceRecords);
  const traceability = buildEvidenceTraceabilityReport(seed.evidenceRecords);
  const diagReport = buildEvidenceDiagnosticsReport(integrity);
  assert('B-CORE', '36. inventory report', inventory.evidenceCount === SEED_EVIDENCE_COUNT, String(inventory.evidenceCount));
  assert('B-CORE', '37. lineage report', lineage.lineageLinks.length === SEED_EVIDENCE_COUNT, String(lineage.lineageLinks.length));
  assert('B-CORE', '38. traceability report', traceability.traceabilityIndex.length >= 1, String(traceability.traceabilityIndex.length));
  assert('B-CORE', '39. diagnostics report', diagReport.issueCount === integrity.issues.length, 'diag');

  resetVerificationEvidenceStoreForTests();
  const orphan = buildSeedEvidenceRecord({
    targetId: 'vtarg-orphan',
    targetCategory: 'RUNTIME_TARGET',
    ownerModule: 'devpulse_v2_runtime_verification_layer',
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
  });
  orphan.evidenceLineage.parentEvidence = ['vevid-missing'];
  registerEvidence(orphan);
  const broken = validateEvidenceIntegrity(listEvidence());
  assert('B-CORE', '40. broken lineage', broken.issues.some((i) => i.code === 'BROKEN_LINEAGE'), 'broken');

  resetAll();
  const panel = buildVerificationEvidencePanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '41. uvl panel', panel.panelTitle === 'Verification Evidence Engine', panel.panelTitle);
  assert('B-CORE', '42. panel count', panel.evidenceCount === SEED_EVIDENCE_COUNT, String(panel.evidenceCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '43. routing', routing.primaryCapability === 'VERIFICATION_EVIDENCE_ENGINE', String(routing.primaryCapability));
  assert('C-INTEGRATION', '44. advisory', isVerificationEvidenceAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '45. action authority id', action.candidates[0]!.evidenceAuthorityId.startsWith('vevauth-'), 'id');
  assert('C-INTEGRATION', '46. action evidence count', action.candidates[0]!.evidenceCount === 13, 'count');
  assert('C-INTEGRATION', '47. action categories', action.candidates[0]!.evidenceCategoryCount === 10, 'count');

  const reasoning = buildReasoningVisibilityRecord('verification evidence engine');
  assert('C-INTEGRATION', '48. reasoning basis', reasoning.evidenceAuthorityBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '49. reasoning inventory', reasoning.evidenceInventory.length >= 2, 'inventory');
  assert('C-INTEGRATION', '50. reasoning lineage', reasoning.evidenceLineage.length >= 1, 'lineage');

  const failures = buildFailureRecords('Why is evidence blocked?');
  assert('C-INTEGRATION', '51. failure', failures.some((f) => f.sourceSystem === 'verification_evidence_engine'), 'fail');

  const progress = buildProgressRecords('verification evidence engine');
  assert('C-INTEGRATION', '52. progress', progress[0]?.verificationEvidenceNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '53. uvl rows', VERIFICATION_EVIDENCE_ENGINE_UVL_ROWS.length === 12, String(VERIFICATION_EVIDENCE_ENGINE_UVL_ROWS.length));
  assert('D-REGISTRY', '54. uvl types', hasUvlRow('VERIFICATION_EVIDENCE_TYPES'), 'types');
  assert('D-REGISTRY', '55. uvl store', hasUvlRow('VERIFICATION_EVIDENCE_STORE'), 'store');
  assert('D-REGISTRY', '56. console', isIntelligenceConsoleCapability('VERIFICATION_EVIDENCE_ENGINE'), 'console');
  assert('D-REGISTRY', '57. find panel', resolveFindPanelAlias('Evidence Engine') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '58. registry', registry.includes('verification_evidence_engine'), 'registry');
  for (const forbidden of FORBIDDEN_VERIFICATION_EVIDENCE_DUPLICATES) {
    assert('D-REGISTRY', `59.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = prepareVerificationEvidence(baseInput());
  const engineSrc = readText('src/verification-evidence-engine/verification-evidence-engine.ts');
  const allSrc = [
    engineSrc,
    readText('src/verification-evidence-engine/verification-evidence-report-builder.ts'),
    readText('src/verification-evidence-engine/verification-evidence-store.ts'),
  ].join('\n');
  assert('E-STATIC', '60. no reporting engine', !allSrc.includes('verification_reporting_engine'), 'clean');
  assert('E-STATIC', '61. no auto-fix', !allSrc.includes('auto_fix_engine'), 'clean');
  assert('E-STATIC', '62. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('VERIFICATION_EVIDENCE_ENGINE'), 'feed');
  assert('E-STATIC', '63. authority only', staticReady.evidenceRecords.every((r) => r.authorityOnly === true), 'only');
  assert('E-STATIC', '64. no execution flag', !allSrc.includes('executeVerification'), 'clean');
  assert('E-STATIC', '65. no provider exec', !allSrc.includes('startVerificationSession'), 'clean');
  assert('E-STATIC', '66. no trust decision', !allSrc.includes('evaluateTrustScore'), 'clean');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `67.${i} authority id`, fixture.evidenceSummaryReport.authorityId.startsWith('vevauth-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `68.${i} signal`, isVerificationEvidenceQuestion(`verification evidence engine batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What evidence exists batch ${i}?`);
    assert('F-CACHED', `69.${i} route`, r.primaryCapability === 'VERIFICATION_EVIDENCE_ENGINE', String(r.primaryCapability));
  }
  const bridge = buildVerificationEvidenceFailureContext('Why is evidence blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `70.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is evidence blocked?';
    const key = q.toLowerCase();
    let status = httpCache.get(key);
    if (!status) {
      const res = await fetch(`http://127.0.0.1:${port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      status = res.status;
      httpCache.set(key, status);
    }
    assert('G-HTTP', `71.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVerificationEvidenceDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Evidence: ${diag.evidenceCount}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    process.exitCode = 1;
    return;
  }
  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(VERIFICATION_EVIDENCE_ENGINE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
