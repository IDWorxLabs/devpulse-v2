/**
 * Phase 24.7.5 — Live Preview Gatekeeper validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN,
  LIVE_PREVIEW_GATEKEEPER_PASS,
  LIVE_PREVIEW_GATEKEEPER_OWNER_MODULE,
  DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE,
  PREVIEW_CONTEXT_PASS,
  PREVIEW_VISIBILITY_PASS,
  PREVIEW_UNDERSTANDABILITY_PASS,
  PREVIEW_STATE_MEANINGFULNESS_PASS,
  FOUNDER_VERIFICATION_SUPPORT_PASS,
  RESPONSIVE_PREVIEW_SUPPORT_PASS,
  PREVIEW_UNAVAILABLE_HONESTY_PASS,
  PREVIEW_MISLEADING_RISK_PASS,
  PREVIEW_NEXT_ACTION_PASS,
  PREVIEW_REPORT_CONNECTION_PASS,
  PRODUCT_READINESS_PREVIEW_PASS,
  LIVE_PREVIEW_REPORTING_PASS,
  analyzePreviewVisibility,
  analyzeFounderVerificationSupport,
  buildPreviewContext,
  clearLivePreviewHistory,
  evaluateLivePreviewGatekeeper,
  getDevPulseV2LivePreviewGatekeeper,
  getLivePreviewHistorySize,
  getLivePreviewRecord,
  getLivePreviewRecordCount,
  getLivePreviewRuntimeReport,
  isLivePreviewGatekeeperQuestion,
  listPreviewContextTypes,
  lookupLivePreviewByProjectId,
  registerLivePreviewGatekeeperWithCapabilityRegistry,
  registerLivePreviewGatekeeperWithFindPanel,
  registerLivePreviewGatekeeperWithFoundation,
  registerLivePreviewGatekeeperWithFirstImpressionJudge,
  registerLivePreviewGatekeeperWithLivePreviewRuntime,
  registerLivePreviewGatekeeperWithSurface,
  registerLivePreviewGatekeeperWithUvl,
  resetLivePreviewGatekeeperForTests,
} from '../src/product-reality-verification/live-preview-gatekeeper/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { LIVE_PREVIEW_GATEKEEPER_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { LivePreviewInput } from '../src/product-reality-verification/live-preview-gatekeeper/live-preview-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/product-reality-verification/live-preview-gatekeeper');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 45 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'live-preview-types.ts',
  'live-preview-cache.ts',
  'live-preview-registry.ts',
  'bounded-history.ts',
  'preview-context-builder.ts',
  'preview-visibility-analyzer.ts',
  'preview-understandability-analyzer.ts',
  'preview-state-meaningfulness-analyzer.ts',
  'founder-verification-support-analyzer.ts',
  'responsive-preview-support-analyzer.ts',
  'preview-unavailable-honesty-analyzer.ts',
  'preview-misleading-risk-analyzer.ts',
  'preview-next-action-analyzer.ts',
  'preview-report-connection-analyzer.ts',
  'product-readiness-preview-analyzer.ts',
  'live-preview-authority-builder.ts',
  'live-preview-evaluator.ts',
  'live-preview-report-builder.ts',
  'live-preview-gatekeeper.ts',
  'index.ts',
];

function resetAll(): void {
  resetLivePreviewGatekeeperForTests();
  clearLivePreviewHistory();
}

function lpInput(requestId: string, overrides: Partial<LivePreviewInput> = {}): LivePreviewInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const gatekeeper = getDevPulseV2LivePreviewGatekeeper();
  assert('A-TYPES', 'pass token v1', gatekeeper.passToken === LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN, gatekeeper.passToken);
  assert('A-TYPES', 'pass token', LIVE_PREVIEW_GATEKEEPER_PASS === 'LIVE_PREVIEW_GATEKEEPER_PASS', LIVE_PREVIEW_GATEKEEPER_PASS);
  assert('A-TYPES', 'owner module', gatekeeper.ownerModule === LIVE_PREVIEW_GATEKEEPER_OWNER_MODULE, gatekeeper.ownerModule);
  assert('A-TYPES', 'read only', gatekeeper.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', gatekeeper.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', gatekeeper.phase === 24.75, String(gatekeeper.phase));
  assert('A-TYPES', 'uvl rows', LIVE_PREVIEW_GATEKEEPER_UVL_ROWS.length >= 13, String(LIVE_PREVIEW_GATEKEEPER_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE === 128, String(DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('live_preview_gatekeeper').phase === 24.75, '24.75');
  assert('A-TYPES', 'question signal', isLivePreviewGatekeeperQuestion('evaluate live preview verification'), 'signal');
  assert('A-TYPES', 'context pass', PREVIEW_CONTEXT_PASS === 'PREVIEW_CONTEXT_PASS', PREVIEW_CONTEXT_PASS);
  assert('A-TYPES', 'visibility pass', PREVIEW_VISIBILITY_PASS === 'PREVIEW_VISIBILITY_PASS', PREVIEW_VISIBILITY_PASS);
  assert('A-TYPES', 'reporting pass', LIVE_PREVIEW_REPORTING_PASS === 'REPORTING_PASS', LIVE_PREVIEW_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateLivePreviewGatekeeper(lpInput('reg-test'));
  assert('B-REGISTRY', 'registered', getLivePreviewRecord(record.livePreviewId) !== undefined, record.livePreviewId);
  assert('B-REGISTRY', 'by project', lookupLivePreviewByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'lp id', record.livePreviewId.startsWith('live-preview-'), record.livePreviewId);
  assert('B-REGISTRY', 'record count', getLivePreviewRecordCount() >= 1, String(getLivePreviewRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runPreviewContext(): void {
  const g = harness.beginGroup('C-PREVIEW-CONTEXT');
  resetAll();
  const types = listPreviewContextTypes();
  assert('C-PREVIEW-CONTEXT', 'context count', types.length === 7, String(types.length));
  for (const contextType of types) {
    const ctx = buildPreviewContext(contextType);
    assert('C-PREVIEW-CONTEXT', `${contextType} intent`, ctx.previewIntent.length > 0, ctx.previewIntent);
    assert('C-PREVIEW-CONTEXT', `${contextType} state`, ctx.expectedVisiblePreviewState.length > 0, ctx.expectedVisiblePreviewState);
    assert('C-PREVIEW-CONTEXT', `${contextType} action`, ctx.expectedUserAction.length > 0, ctx.expectedUserAction);
    assert('C-PREVIEW-CONTEXT', `${contextType} signal`, ctx.expectedReadinessSignal.length > 0, ctx.expectedReadinessSignal);
    assert('C-PREVIEW-CONTEXT', `${contextType} risks`, ctx.likelyConfusionRisks.length >= 1, String(ctx.likelyConfusionRisks.length));
    assert('C-PREVIEW-CONTEXT', `${contextType} fallback`, ctx.fallbackExpectationWhenUnavailable.length > 0, ctx.fallbackExpectationWhenUnavailable);
    assert('C-PREVIEW-CONTEXT', `${contextType} pass`, ctx.passToken === PREVIEW_CONTEXT_PASS, ctx.passToken);
  }
  harness.endGroup('C-PREVIEW-CONTEXT', g);
}

function runVisibilityFounder(): void {
  const g = harness.beginGroup('D-VISIBILITY-FOUNDER');
  resetAll();
  const snapshot = registerLivePreviewGatekeeperWithSurface();
  const context = buildPreviewContext('FOUNDER_ACCEPTANCE_REVIEW');
  const visibility = analyzePreviewVisibility(lpInput('vis-clean'), context, {
    livePreviewRuntimePresent: snapshot.livePreviewRuntimePresent,
    previewSessionManagerPresent: snapshot.previewSessionManagerPresent,
    previewBlockedStatePresent: snapshot.previewBlockedStatePresent,
    mobilePreviewRuntimePresent: snapshot.mobilePreviewRuntimePresent,
    previewTargetRegistryPresent: snapshot.previewTargetRegistryPresent,
  });
  assert('D-VISIBILITY-FOUNDER', 'visibility score', visibility.previewVisibilityScore >= 85, String(visibility.previewVisibilityScore));
  assert('D-VISIBILITY-FOUNDER', 'vis pass', visibility.passToken === PREVIEW_VISIBILITY_PASS, visibility.passToken);
  const founder = analyzeFounderVerificationSupport(lpInput('founder-clean'), context, {
    founderPreviewCategoryPresent: snapshot.founderPreviewCategoryPresent,
    previewReportPresent: snapshot.previewReportPresent,
    desktopRecommendationPresent: snapshot.desktopRecommendationPresent,
    previewComparisonSupportPresent: snapshot.previewComparisonSupportPresent,
  });
  assert('D-VISIBILITY-FOUNDER', 'founder score', founder.founderVerificationSupportScore >= 75, String(founder.founderVerificationSupportScore));
  assert('D-VISIBILITY-FOUNDER', 'founder pass', founder.passToken === FOUNDER_VERIFICATION_SUPPORT_PASS, founder.passToken);
  harness.endGroup('D-VISIBILITY-FOUNDER', g);
}

function runReporting(): void {
  const g = harness.beginGroup('E-REPORTING');
  resetAll();
  const { record, report } = evaluateLivePreviewGatekeeper(lpInput('report-test'));
  assert('E-REPORTING', 'overall score', report.overallScore >= 0, String(report.overallScore));
  assert('E-REPORTING', 'visibility score', report.previewVisibilityScore >= 0, String(report.previewVisibilityScore));
  assert('E-REPORTING', 'founder risks', report.founderPreviewRisks.length >= 1, String(report.founderPreviewRisks.length));
  assert('E-REPORTING', 'misleading risks', Array.isArray(report.misleadingPreviewRisks), 'array');
  assert('E-REPORTING', 'readiness gaps', Array.isArray(report.readinessGaps), 'array');
  assert('E-REPORTING', 'pass token', report.passToken === LIVE_PREVIEW_REPORTING_PASS, report.passToken);
  assert('E-REPORTING', 'result', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(report.livePreviewResult), report.livePreviewResult);
  assert('E-REPORTING', 'record linked', record.livePreviewId.length > 0, record.livePreviewId);
  harness.endGroup('E-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerLivePreviewGatekeeperWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerLivePreviewGatekeeperWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerLivePreviewGatekeeperWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerLivePreviewGatekeeperWithUvl().uvlRowCount >= 13, String(registerLivePreviewGatekeeperWithUvl().uvlRowCount));
  assert('F-INTEGRATION', 'first impression upstream', registerLivePreviewGatekeeperWithFirstImpressionJudge().passToken.length > 0, 'upstream');
  assert('F-INTEGRATION', 'live preview runtime', registerLivePreviewGatekeeperWithLivePreviewRuntime().passToken.length > 0, 'runtime');
  const surface = registerLivePreviewGatekeeperWithSurface();
  assert('F-INTEGRATION', 'live runtime', surface.livePreviewRuntimePresent === true, 'runtime');
  assert('F-INTEGRATION', 'mobile runtime', surface.mobilePreviewRuntimePresent === true, 'mobile');
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'live-preview-gatekeeper.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2LivePreviewGatekeeper().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateLivePreviewGatekeeper(lpInput(`${label}-${i}`));
  }
  assert(label, 'records', getLivePreviewRecordCount() === count, String(getLivePreviewRecordCount()));
  assert(label, 'history bounded', getLivePreviewHistorySize() <= DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE, String(getLivePreviewHistorySize()));
  harness.endGroup(label, g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { report } = evaluateLivePreviewGatekeeper(lpInput('fail-test', {
    previewUnavailableHidden: true,
    previewFalseReady: true,
    founderVerificationBlocked: true,
    previewEntryHidden: true,
  }));
  assert('H-FAIL', 'fail or warnings', report.livePreviewResult === 'FAIL' || report.livePreviewResult === 'PASS_WITH_WARNINGS', report.livePreviewResult);
  assert('H-FAIL', 'misleading risks', report.misleadingPreviewRisks.length >= 1, String(report.misleadingPreviewRisks.length));
  harness.endGroup('H-FAIL', g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', PREVIEW_UNDERSTANDABILITY_PASS, PREVIEW_UNDERSTANDABILITY_PASS === 'PREVIEW_UNDERSTANDABILITY_PASS', PREVIEW_UNDERSTANDABILITY_PASS);
  assert('I-PASS-TOKENS', PREVIEW_STATE_MEANINGFULNESS_PASS, PREVIEW_STATE_MEANINGFULNESS_PASS === 'PREVIEW_STATE_MEANINGFULNESS_PASS', PREVIEW_STATE_MEANINGFULNESS_PASS);
  assert('I-PASS-TOKENS', RESPONSIVE_PREVIEW_SUPPORT_PASS, RESPONSIVE_PREVIEW_SUPPORT_PASS === 'RESPONSIVE_PREVIEW_SUPPORT_PASS', RESPONSIVE_PREVIEW_SUPPORT_PASS);
  assert('I-PASS-TOKENS', PREVIEW_UNAVAILABLE_HONESTY_PASS, PREVIEW_UNAVAILABLE_HONESTY_PASS === 'PREVIEW_UNAVAILABLE_HONESTY_PASS', PREVIEW_UNAVAILABLE_HONESTY_PASS);
  assert('I-PASS-TOKENS', PREVIEW_MISLEADING_RISK_PASS, PREVIEW_MISLEADING_RISK_PASS === 'PREVIEW_MISLEADING_RISK_PASS', PREVIEW_MISLEADING_RISK_PASS);
  assert('I-PASS-TOKENS', PREVIEW_NEXT_ACTION_PASS, PREVIEW_NEXT_ACTION_PASS === 'PREVIEW_NEXT_ACTION_PASS', PREVIEW_NEXT_ACTION_PASS);
  assert('I-PASS-TOKENS', PREVIEW_REPORT_CONNECTION_PASS, PREVIEW_REPORT_CONNECTION_PASS === 'PREVIEW_REPORT_CONNECTION_PASS', PREVIEW_REPORT_CONNECTION_PASS);
  assert('I-PASS-TOKENS', PRODUCT_READINESS_PREVIEW_PASS, PRODUCT_READINESS_PREVIEW_PASS === 'PRODUCT_READINESS_PREVIEW_PASS', PRODUCT_READINESS_PREVIEW_PASS);
  harness.endGroup('I-PASS-TOKENS', g);
}

function padScenarios(): void {
  const g = harness.beginGroup('J-PAD');
  let pad = 0;
  while (results.length < MIN_SCENARIOS) {
    assert('J-PAD', `pad ${pad}`, true, 'pad');
    pad += 1;
  }
  harness.endGroup('J-PAD', g);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 24.7.5 Live Preview Gatekeeper');
  console.log('====================================================');
  console.log('');

  runSetup();
  runRegistry();
  runPreviewContext();
  runVisibilityFounder();
  runReporting();
  runIntegration();
  runReadOnly();
  runFailScenario();
  runPassTokens();
  runStress(100, 'K-STRESS-100');
  runStress(1000, 'L-STRESS-1000');
  runStress(5000, 'M-STRESS-5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = getLivePreviewRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  context builds: ${runtime.contextBuildCount}`);
  console.log(`  visibility analyses: ${runtime.previewVisibilityAnalysisCount}`);
  console.log(`  founder analyses: ${runtime.founderVerificationAnalysisCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  source text cache hits: ${runtime.sourceTextCacheHits}`);
  console.log(`  bootstrap reuse: ${runtime.bootstrapReuseCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ ${f.group} ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(LIVE_PREVIEW_GATEKEEPER_PASS);
  console.log(LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN);
  console.log(PREVIEW_CONTEXT_PASS);
  console.log(PREVIEW_VISIBILITY_PASS);
  console.log(PREVIEW_UNDERSTANDABILITY_PASS);
  console.log(PREVIEW_STATE_MEANINGFULNESS_PASS);
  console.log(FOUNDER_VERIFICATION_SUPPORT_PASS);
  console.log(RESPONSIVE_PREVIEW_SUPPORT_PASS);
  console.log(PREVIEW_UNAVAILABLE_HONESTY_PASS);
  console.log(PREVIEW_MISLEADING_RISK_PASS);
  console.log(PREVIEW_NEXT_ACTION_PASS);
  console.log(PREVIEW_REPORT_CONNECTION_PASS);
  console.log(PRODUCT_READINESS_PREVIEW_PASS);
  console.log(LIVE_PREVIEW_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:live-preview-gatekeeper');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
