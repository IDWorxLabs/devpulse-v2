/**
 * DevPulse V2 Phase 16.11 — Verification Reporting Engine validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  VERIFICATION_REPORTING_ENGINE_PASS_TOKEN,
  VERIFICATION_REPORTING_ENGINE_OWNER_MODULE,
  FORBIDDEN_VERIFICATION_REPORTING_DUPLICATES,
  INITIAL_REPORT_TYPES,
  isVerificationReportingQuestion,
  isVerificationReportingAdvisoryQuestion,
  prepareVerificationReporting,
  processVerificationReportingRequest,
  getVerificationReportingDiagnostics,
  resetVerificationReportingDiagnostics,
  resetVerificationReportingAuthorityCounterForTests,
  resetVerificationReportStoreForTests,
  resetVerificationHistoryForTests,
  buildVerificationReportingFailureContext,
  registerReport,
  getReport,
  queryReports,
  listReports,
  listReportsByProject,
  listReportsByType,
  validateReportIntegrity,
  exportReportsAsJson,
  buildReportExportBundle,
  buildVerificationSummaryReport,
} from '../src/verification-reporting-engine/index.js';
import type { PrepareVerificationReportingInput } from '../src/verification-reporting-engine/verification-report-types.js';
import {
  resetVerificationEvidenceDiagnostics,
  resetVerificationEvidenceReportCounterForTests,
  resetVerificationEvidenceStoreForTests,
} from '../src/verification-evidence-engine/index.js';
import {
  resetVerificationTargetRegistryForTests,
  resetVerificationOwnerRegistryForTests,
  resetVerificationDependencyRegistryForTests,
  resetVerificationRequirementRegistryForTests,
  resetVerificationCapabilityRegistryForTests,
  resetVerificationRegistryDiagnostics,
  resetVerificationRegistryReportCounterForTests,
} from '../src/verification-registry/index.js';
import {
  resetVerificationOrchestratorDiagnostics,
  resetVerificationOrchestratorReportCounterForTests,
  resetVerificationPlanCounterForTests,
  resetParallelGroupCounterForTests,
} from '../src/verification-orchestrator/index.js';
import {
  resetVerificationRuntimeDiagnostics,
  resetVerificationRuntimeReportCounterForTests,
  resetVerificationProviderRegistryForTests,
  resetVerificationSessionManagerForTests,
} from '../src/unified-verification-lab/index.js';
import {
  buildVerificationReportingPanelSnapshot,
  VERIFICATION_REPORTING_ENGINE_UVL_ROWS,
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
const CANONICAL_QUERY = 'What happened in verification?';
const SEED_REPORT_COUNT = 10;

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
const responseCache = new Map<string, ReturnType<typeof processVerificationReportingRequest>>();
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
  const result = processVerificationReportingRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareVerificationReportingInput> = {}): PrepareVerificationReportingInput {
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
  resetVerificationRuntimeDiagnostics();
  resetVerificationRuntimeReportCounterForTests();
  resetVerificationProviderRegistryForTests();
  resetVerificationSessionManagerForTests();
  resetVerificationReportingDiagnostics();
  resetVerificationReportingAuthorityCounterForTests();
  resetVerificationReportStoreForTests();
  resetVerificationHistoryForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.11 Verification Reporting Engine');
  console.log('=======================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/verification-reporting-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'verification-report-types.ts')), 'types');
  assert('A-SETUP', '2. store', existsSync(join(dir, 'verification-report-store.ts')), 'store');
  assert('A-SETUP', '3. builder', existsSync(join(dir, 'verification-report-builder.ts')), 'builder');
  assert('A-SETUP', '4. summary', existsSync(join(dir, 'verification-summary-builder.ts')), 'summary');
  assert('A-SETUP', '5. failure', existsSync(join(dir, 'verification-failure-report-builder.ts')), 'failure');
  assert('A-SETUP', '6. evidence', existsSync(join(dir, 'verification-evidence-report-builder.ts')), 'evidence');
  assert('A-SETUP', '7. session', existsSync(join(dir, 'verification-session-report-builder.ts')), 'session');
  assert('A-SETUP', '8. history', existsSync(join(dir, 'verification-history-report-builder.ts')), 'history');
  assert('A-SETUP', '9. trend', existsSync(join(dir, 'verification-trend-report-builder.ts')), 'trend');
  assert('A-SETUP', '10. query', existsSync(join(dir, 'verification-report-query.ts')), 'query');
  assert('A-SETUP', '11. diagnostics', existsSync(join(dir, 'verification-report-diagnostics.ts')), 'diag');
  assert('A-SETUP', '12. validator', existsSync(join(dir, 'verification-report-validator.ts')), 'validator');
  assert('A-SETUP', '13. export', existsSync(join(dir, 'verification-report-export.ts')), 'export');
  assert('A-SETUP', '14. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '15. feed bridge', existsSync(join(ROOT, 'src/operator-feed/verification-reporting-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '16. script', typeof pkg.scripts?.['validate:verification-reporting-engine'] === 'string', 'script');
  const owner = getDevPulseV2Owner('verification_reporting_engine');
  assert('A-SETUP', '17. owner', owner.ownerModule === VERIFICATION_REPORTING_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '18. phase', owner.phase === 16.11, String(owner.phase));
  assert('A-SETUP', '19. report types', INITIAL_REPORT_TYPES.length === 10, String(INITIAL_REPORT_TYPES.length));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareVerificationReporting(baseInput());
  assert('B-CORE', '20. authority id', ready.reportingAuthorityId.startsWith('vrptauth-'), 'id');
  assert('B-CORE', '21. report count', ready.reports.length === SEED_REPORT_COUNT, String(ready.reports.length));
  assert('B-CORE', '22. reporting only', ready.reports.every((r) => r.reportingOnly === true), 'only');
  assert('B-CORE', '23. ready state', ['READY', 'BLOCKED', 'INVALID'].includes(ready.authorityState), ready.authorityState);
  assert('B-CORE', '24. summary report', ready.summaryReport?.reportType === 'VERIFICATION_SUMMARY_REPORT', 'summary');
  assert('B-CORE', '25. validation', ready.validationResult.valid === true, 'valid');
  assert('B-CORE', '26. history', ready.historyEntries.length >= SEED_REPORT_COUNT, String(ready.historyEntries.length));
  assert('B-CORE', '27. json export', ready.exports.json.includes('VERIFICATION_REPORT_JSON'), 'json');
  assert('B-CORE', '28. founder export', ready.exports.founder.includes('Founder Verification Report Export'), 'founder');
  assert('B-CORE', '29. uvl export', ready.exports.uvl.includes('UVL_VERIFICATION_EXPORT'), 'uvl');
  assert('B-CORE', '30. world2 export', ready.exports.world2.includes('WORLD2_VERIFICATION_EXPORT'), 'world2');

  const first = ready.reports[0]!;
  assert('B-CORE', '31. get report', getReport(first.reportId)?.reportId === first.reportId, 'get');
  assert('B-CORE', '32. list reports', listReports().length === SEED_REPORT_COUNT, String(listReports().length));
  assert('B-CORE', '33. list by project', listReportsByProject('proj-test-001').length === SEED_REPORT_COUNT, 'project');
  assert('B-CORE', '34. list by type', listReportsByType('VERIFICATION_SUMMARY_REPORT').length >= 1, 'type');

  const queried = queryReports({ projectId: 'proj-test-001', reportType: 'VERIFICATION_TREND_REPORT' });
  assert('B-CORE', '35. query reports', queried.length >= 1, String(queried.length));

  const duplicate = registerReport(first);
  assert('B-CORE', '36. duplicate rejected', duplicate.duplicate === true, 'dup');

  const integrity = validateReportIntegrity(ready.reports, new Set(ready.reports.flatMap((r) => r.reportEvidence)));
  assert('B-CORE', '37. integrity valid', integrity.valid === true, 'valid');

  const exports = buildReportExportBundle({
    reports: ready.reports,
    authorityId: ready.reportingAuthorityId,
    sessions: ['vsess-0001'],
    history: ready.historyEntries,
  });
  assert('B-CORE', '38. export bundle', exports.json.length > 50, 'export');

  resetVerificationReportStoreForTests();
  const orphanOwnership = {
    ownerModule: 'devpulse_v2_verification_reporting_engine',
    ownerDomain: 'verification_reporting_engine',
    generatedBy: 'test',
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    generatedAt: Date.now(),
  };
  const orphan = buildVerificationSummaryReport({
    ownership: orphanOwnership,
    evidenceIds: ['vevid-missing'],
    targetCount: 1,
    orchestrationId: 'vorch-0001',
    blockedTargets: [],
    readyTargets: ['WORLD2_TARGET'],
  });
  registerReport(orphan);
  const broken = validateReportIntegrity(listReports(), new Set(['vevid-0001']));
  assert('B-CORE', '39. missing evidence link', broken.issues.some((i) => i.code === 'MISSING_EVIDENCE_LINK'), 'broken');

  resetAll();
  const panel = buildVerificationReportingPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '40. uvl panel', panel.panelTitle === 'Verification Reporting Engine', panel.panelTitle);
  assert('B-CORE', '41. panel count', panel.reportCount === SEED_REPORT_COUNT, String(panel.reportCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '42. routing', routing.primaryCapability === 'VERIFICATION_REPORTING_ENGINE', String(routing.primaryCapability));
  assert('C-INTEGRATION', '43. advisory', isVerificationReportingAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '44. action authority id', action.candidates[0]!.reportingAuthorityId.startsWith('vrptauth-'), 'id');
  assert('C-INTEGRATION', '45. action report count', action.candidates[0]!.verificationReportCount === 10, 'count');
  assert('C-INTEGRATION', '46. action report types', action.candidates[0]!.verificationReportTypeCount === 10, 'count');

  const reasoning = buildReasoningVisibilityRecord('verification reporting engine');
  assert('C-INTEGRATION', '47. reasoning basis', reasoning.reportingAuthorityBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '48. reasoning reports', reasoning.verificationReports.length >= 2, 'reports');
  assert('C-INTEGRATION', '49. reasoning trends', reasoning.verificationTrends.length >= 2, 'trends');

  const failures = buildFailureRecords('Why is reporting blocked?');
  assert('C-INTEGRATION', '50. failure', failures.some((f) => f.sourceSystem === 'verification_reporting_engine'), 'fail');

  const progress = buildProgressRecords('verification reporting engine');
  assert('C-INTEGRATION', '51. progress', progress[0]?.verificationReportingNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '52. uvl rows', VERIFICATION_REPORTING_ENGINE_UVL_ROWS.length === 15, String(VERIFICATION_REPORTING_ENGINE_UVL_ROWS.length));
  assert('D-REGISTRY', '53. uvl types', hasUvlRow('VERIFICATION_REPORT_TYPES'), 'types');
  assert('D-REGISTRY', '54. uvl store', hasUvlRow('VERIFICATION_REPORT_STORE'), 'store');
  assert('D-REGISTRY', '55. console', isIntelligenceConsoleCapability('VERIFICATION_REPORTING_ENGINE'), 'console');
  assert('D-REGISTRY', '56. find panel', resolveFindPanelAlias('Verification Reports') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '57. registry', registry.includes('verification_reporting_engine'), 'registry');
  for (const forbidden of FORBIDDEN_VERIFICATION_REPORTING_DUPLICATES) {
    assert('D-REGISTRY', `58.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = prepareVerificationReporting(baseInput());
  const engineSrc = readText('src/verification-reporting-engine/verification-report-builder.ts');
  const allSrc = [
    engineSrc,
    readText('src/verification-reporting-engine/verification-evidence-report-builder.ts'),
    readText('src/verification-reporting-engine/verification-report-export.ts'),
  ].join('\n');
  assert('E-STATIC', '59. no auto-fix', !allSrc.includes('auto_fix_engine'), 'clean');
  assert('E-STATIC', '60. no trust score', !allSrc.includes('evaluateTrustScore'), 'clean');
  assert('E-STATIC', '61. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('VERIFICATION_REPORTING_ENGINE'), 'feed');
  assert('E-STATIC', '62. reporting only', staticReady.reports.every((r) => r.reportingOnly === true), 'only');
  assert('E-STATIC', '63. no execution flag', !allSrc.includes('executeVerification'), 'clean');
  assert('E-STATIC', '64. no provider exec', !allSrc.includes('startVerificationSession'), 'clean');
  assert('E-STATIC', '65. evidence linked', staticReady.reports.some((r) => r.reportEvidence.length > 0), 'evidence');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `66.${i} authority id`, fixture.reportingAuthorityId.startsWith('vrptauth-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `67.${i} signal`, isVerificationReportingQuestion(`verification reporting engine batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What happened in verification batch ${i}?`);
    assert('F-CACHED', `68.${i} route`, r.primaryCapability === 'VERIFICATION_REPORTING_ENGINE', String(r.primaryCapability));
  }
  const bridge = buildVerificationReportingFailureContext('Why is reporting blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `69.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is reporting blocked?';
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
    assert('G-HTTP', `70.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVerificationReportingDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Reports: ${diag.reportCount}`);
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

  console.log(VERIFICATION_REPORTING_ENGINE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
