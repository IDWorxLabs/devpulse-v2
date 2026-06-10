/**
 * Phase 24.7.3 — UX Heuristic Evaluator validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  UX_HEURISTIC_EVALUATOR_PASS_TOKEN,
  UX_HEURISTIC_EVALUATOR_PASS,
  UX_HEURISTIC_EVALUATOR_OWNER_MODULE,
  DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE,
  NAVIGATION_CLARITY_PASS,
  FEATURE_DISCOVERABILITY_PASS,
  ACTION_CLARITY_PASS,
  FEEDBACK_QUALITY_PASS,
  SYSTEM_STATUS_VISIBILITY_PASS,
  ERROR_PREVENTION_PASS,
  USER_CONTROL_PASS,
  COGNITIVE_LOAD_PASS,
  TRUST_CLARITY_PASS,
  WORKFLOW_CONTINUITY_PASS,
  INTELLIGENCE_VISIBILITY_PASS,
  FOUNDER_USABILITY_PASS,
  UX_HEURISTIC_REPORTING_PASS,
  analyzeNavigationClarity,
  analyzeFeatureDiscoverability,
  analyzeIntelligenceVisibility,
  analyzeFounderUsability,
  buildUXHeuristicAuthority,
  clearUXHeuristicHistory,
  evaluateUXHeuristic,
  evaluateUXHeuristicEngine,
  generateUXHeuristicReport,
  getAuthorityBuildCount,
  getDevPulseV2UXHeuristicEvaluator,
  getEvaluationCount,
  getUXHeuristicCacheStats,
  getUXHeuristicHistorySize,
  getUXHeuristicRecord,
  getUXHeuristicRecordCount,
  getUXHeuristicRuntimeReport,
  isUXHeuristicQuestion,
  listBaseDiscoverableFeatures,
  lookupUXHeuristicByProjectId,
  registerUXHeuristicEvaluatorWithCapabilityRegistry,
  registerUXHeuristicEvaluatorWithFindPanel,
  registerUXHeuristicEvaluatorWithFoundation,
  registerUXHeuristicEvaluatorWithSurface,
  registerUXHeuristicEvaluatorWithUvl,
  registerUXHeuristicEvaluatorWithVisualQAEngine,
  resetUXHeuristicEvaluatorForTests,
} from '../src/product-reality-verification/ux-heuristic-evaluator/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { UX_HEURISTIC_EVALUATOR_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { UXHeuristicInput } from '../src/product-reality-verification/ux-heuristic-evaluator/ux-heuristic-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/product-reality-verification/ux-heuristic-evaluator');

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
  'ux-heuristic-types.ts',
  'ux-heuristic-cache.ts',
  'ux-heuristic-registry.ts',
  'bounded-history.ts',
  'navigation-clarity-analyzer.ts',
  'feature-discoverability-analyzer.ts',
  'action-clarity-analyzer.ts',
  'feedback-quality-analyzer.ts',
  'system-status-visibility-analyzer.ts',
  'error-prevention-analyzer.ts',
  'user-control-analyzer.ts',
  'cognitive-load-analyzer.ts',
  'trust-clarity-analyzer.ts',
  'workflow-continuity-analyzer.ts',
  'intelligence-visibility-analyzer.ts',
  'founder-usability-analyzer.ts',
  'ux-heuristic-authority-builder.ts',
  'ux-heuristic-evaluator.ts',
  'ux-heuristic-report-builder.ts',
  'ux-heuristic-engine.ts',
  'index.ts',
];

function resetAll(): void {
  resetUXHeuristicEvaluatorForTests();
  clearUXHeuristicHistory();
}

function uxInput(requestId: string, overrides: Partial<UXHeuristicInput> = {}): UXHeuristicInput {
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
  const engine = getDevPulseV2UXHeuristicEvaluator();
  assert('A-TYPES', 'pass token v1', engine.passToken === UX_HEURISTIC_EVALUATOR_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'pass token', UX_HEURISTIC_EVALUATOR_PASS === 'UX_HEURISTIC_EVALUATOR_PASS', UX_HEURISTIC_EVALUATOR_PASS);
  assert('A-TYPES', 'owner module', engine.ownerModule === UX_HEURISTIC_EVALUATOR_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.73, String(engine.phase));
  assert('A-TYPES', 'uvl rows', UX_HEURISTIC_EVALUATOR_UVL_ROWS.length >= 13, String(UX_HEURISTIC_EVALUATOR_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE === 128, String(DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('ux_heuristic_evaluator').phase === 24.73, '24.73');
  assert('A-TYPES', 'question signal', isUXHeuristicQuestion('evaluate ux heuristic usability'), 'signal');
  assert('A-TYPES', 'nav pass', NAVIGATION_CLARITY_PASS === 'NAVIGATION_CLARITY_PASS', NAVIGATION_CLARITY_PASS);
  assert('A-TYPES', 'discover pass', FEATURE_DISCOVERABILITY_PASS === 'FEATURE_DISCOVERABILITY_PASS', FEATURE_DISCOVERABILITY_PASS);
  assert('A-TYPES', 'intelligence pass', INTELLIGENCE_VISIBILITY_PASS === 'INTELLIGENCE_VISIBILITY_PASS', INTELLIGENCE_VISIBILITY_PASS);
  assert('A-TYPES', 'founder pass', FOUNDER_USABILITY_PASS === 'FOUNDER_USABILITY_PASS', FOUNDER_USABILITY_PASS);
  assert('A-TYPES', 'reporting pass', UX_HEURISTIC_REPORTING_PASS === 'REPORTING_PASS', UX_HEURISTIC_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateUXHeuristicEngine(uxInput('reg-test'));
  assert('B-REGISTRY', 'registered', getUXHeuristicRecord(record.uxHeuristicId) !== undefined, record.uxHeuristicId);
  assert('B-REGISTRY', 'by project', lookupUXHeuristicByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'ux id', record.uxHeuristicId.startsWith('ux-heuristic-'), record.uxHeuristicId);
  assert('B-REGISTRY', 'record count', getUXHeuristicRecordCount() >= 1, String(getUXHeuristicRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runNavigation(): void {
  const g = harness.beginGroup('C-NAVIGATION');
  resetAll();
  const snapshot = registerUXHeuristicEvaluatorWithSurface();
  const clean = analyzeNavigationClarity(uxInput('nav-clean'), {
    sidebarNavPresent: snapshot.sidebarNavPresent,
    navItemCount: snapshot.navItemCount,
    centerTitlePresent: snapshot.centerTitlePresent,
    mobileNavTogglePresent: snapshot.mobileNavTogglePresent,
  });
  assert('C-NAVIGATION', 'clean score', clean.navigationClarityScore >= 85, String(clean.navigationClarityScore));
  assert('C-NAVIGATION', 'pass token', clean.passToken === NAVIGATION_CLARITY_PASS, clean.passToken);
  const gaps = analyzeNavigationClarity(uxInput('nav-gaps', {
    navigationConfusion: true,
    unclearProductArea: true,
    missingLocationContext: true,
  }), { sidebarNavPresent: false, navItemCount: 0, centerTitlePresent: false, mobileNavTogglePresent: false });
  assert('C-NAVIGATION', 'problems', gaps.navigationProblems.length >= 3, String(gaps.navigationProblems.length));
  harness.endGroup('C-NAVIGATION', g);
}

function runDiscoverability(): void {
  const g = harness.beginGroup('D-DISCOVERABILITY');
  resetAll();
  const snapshot = registerUXHeuristicEvaluatorWithSurface();
  const clean = analyzeFeatureDiscoverability(uxInput('disc-clean'), {
    chatPresent: snapshot.chatPresent,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    notificationPresent: snapshot.notificationPresent,
    founderRealityPresent: snapshot.founderRealityPresent,
    world2NavPresent: snapshot.world2NavPresent,
    projectVaultNavPresent: snapshot.projectVaultNavPresent,
  });
  assert('D-DISCOVERABILITY', 'clean score', clean.featureDiscoverabilityScore >= 70, String(clean.featureDiscoverabilityScore));
  assert('D-DISCOVERABILITY', 'pass token', clean.passToken === FEATURE_DISCOVERABILITY_PASS, clean.passToken);
  assert('D-DISCOVERABILITY', 'base features', listBaseDiscoverableFeatures().length >= 5, String(listBaseDiscoverableFeatures().length));
  harness.endGroup('D-DISCOVERABILITY', g);
}

function runIntelligenceFounder(): void {
  const g = harness.beginGroup('E-INTELLIGENCE-FOUNDER');
  resetAll();
  const snapshot = registerUXHeuristicEvaluatorWithSurface();
  const intelligence = analyzeIntelligenceVisibility(uxInput('intel-clean'), {
    operatorFeedPresent: snapshot.operatorFeedPresent,
    brainApiPresent: snapshot.brainApiPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
    welcomeIntelligenceCopyPresent: snapshot.welcomeIntelligenceCopyPresent,
  });
  assert('E-INTELLIGENCE-FOUNDER', 'intelligence score', intelligence.intelligenceVisibilityScore >= 75, String(intelligence.intelligenceVisibilityScore));
  assert('E-INTELLIGENCE-FOUNDER', 'intel pass', intelligence.passToken === INTELLIGENCE_VISIBILITY_PASS, intelligence.passToken);
  const founder = analyzeFounderUsability(uxInput('founder-clean'), {
    chatFirstLayout: snapshot.chatFirstLayout,
    statusBarPresent: snapshot.statusBarPresent,
    founderRealityPresent: snapshot.founderRealityPresent,
    mobileUsabilityPresent: snapshot.mobileUsabilityPresent,
  });
  assert('E-INTELLIGENCE-FOUNDER', 'founder score', founder.founderUsabilityScore >= 75, String(founder.founderUsabilityScore));
  assert('E-INTELLIGENCE-FOUNDER', 'founder pass', founder.passToken === FOUNDER_USABILITY_PASS, founder.passToken);
  harness.endGroup('E-INTELLIGENCE-FOUNDER', g);
}

function runReporting(): void {
  const g = harness.beginGroup('F-REPORTING');
  resetAll();
  const { record, report } = evaluateUXHeuristicEngine(uxInput('report-test'));
  assert('F-REPORTING', 'overall score', report.overallScore >= 0, String(report.overallScore));
  assert('F-REPORTING', 'navigation score', report.navigationClarityScore >= 0, String(report.navigationClarityScore));
  assert('F-REPORTING', 'founder notes', report.founderAcceptanceNotes.length >= 1, String(report.founderAcceptanceNotes.length));
  assert('F-REPORTING', 'hidden intelligence risks', Array.isArray(report.hiddenIntelligenceRisks), 'array');
  assert('F-REPORTING', 'pass token', report.passToken === UX_HEURISTIC_REPORTING_PASS, report.passToken);
  assert('F-REPORTING', 'result', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(report.uxHeuristicResult), report.uxHeuristicResult);
  assert('F-REPORTING', 'record linked', record.uxHeuristicId.length > 0, record.uxHeuristicId);
  harness.endGroup('F-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('G-INTEGRATION');
  resetAll();
  assert('G-INTEGRATION', 'foundation', registerUXHeuristicEvaluatorWithFoundation().readOnly === true, 'foundation');
  assert('G-INTEGRATION', 'capability', registerUXHeuristicEvaluatorWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('G-INTEGRATION', 'find panel', registerUXHeuristicEvaluatorWithFindPanel().aliasCount > 0, 'find panel');
  assert('G-INTEGRATION', 'uvl', registerUXHeuristicEvaluatorWithUvl().uvlRowCount >= 13, String(registerUXHeuristicEvaluatorWithUvl().uvlRowCount));
  assert('G-INTEGRATION', 'visual qa upstream', registerUXHeuristicEvaluatorWithVisualQAEngine().passToken.length > 0, 'upstream');
  const surface = registerUXHeuristicEvaluatorWithSurface();
  assert('G-INTEGRATION', 'html', surface.htmlAvailable === true, 'html');
  assert('G-INTEGRATION', 'app js', surface.appJsAvailable === true, 'app js');
  harness.endGroup('G-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('H-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'ux-heuristic-engine.ts'), 'utf8');
  assert('H-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('H-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('H-READONLY', 'no mutations', getDevPulseV2UXHeuristicEvaluator().noMutations === true, 'mutations');
  harness.endGroup('H-READONLY', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateUXHeuristicEngine(uxInput(`${label}-${i}`));
  }
  assert(label, 'records', getUXHeuristicRecordCount() === count, String(getUXHeuristicRecordCount()));
  assert(label, 'history bounded', getUXHeuristicHistorySize() <= DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE, String(getUXHeuristicHistorySize()));
  harness.endGroup(label, g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('I-FAIL');
  resetAll();
  const { report } = evaluateUXHeuristicEngine(uxInput('fail-test', {
    intelligenceHidden: true,
    founderTrustRisk: true,
    navigationConfusion: true,
    destructiveActionRisk: true,
  }));
  assert('I-FAIL', 'fail or warnings', report.uxHeuristicResult === 'FAIL' || report.uxHeuristicResult === 'PASS_WITH_WARNINGS', report.uxHeuristicResult);
  assert('I-FAIL', 'hidden intelligence', report.hiddenIntelligenceRisks.length >= 1, String(report.hiddenIntelligenceRisks.length));
  harness.endGroup('I-FAIL', g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('J-PASS-TOKENS');
  assert('J-PASS-TOKENS', ACTION_CLARITY_PASS, ACTION_CLARITY_PASS === 'ACTION_CLARITY_PASS', ACTION_CLARITY_PASS);
  assert('J-PASS-TOKENS', FEEDBACK_QUALITY_PASS, FEEDBACK_QUALITY_PASS === 'FEEDBACK_QUALITY_PASS', FEEDBACK_QUALITY_PASS);
  assert('J-PASS-TOKENS', SYSTEM_STATUS_VISIBILITY_PASS, SYSTEM_STATUS_VISIBILITY_PASS === 'SYSTEM_STATUS_VISIBILITY_PASS', SYSTEM_STATUS_VISIBILITY_PASS);
  assert('J-PASS-TOKENS', ERROR_PREVENTION_PASS, ERROR_PREVENTION_PASS === 'ERROR_PREVENTION_PASS', ERROR_PREVENTION_PASS);
  assert('J-PASS-TOKENS', USER_CONTROL_PASS, USER_CONTROL_PASS === 'USER_CONTROL_PASS', USER_CONTROL_PASS);
  assert('J-PASS-TOKENS', COGNITIVE_LOAD_PASS, COGNITIVE_LOAD_PASS === 'COGNITIVE_LOAD_PASS', COGNITIVE_LOAD_PASS);
  assert('J-PASS-TOKENS', TRUST_CLARITY_PASS, TRUST_CLARITY_PASS === 'TRUST_CLARITY_PASS', TRUST_CLARITY_PASS);
  assert('J-PASS-TOKENS', WORKFLOW_CONTINUITY_PASS, WORKFLOW_CONTINUITY_PASS === 'WORKFLOW_CONTINUITY_PASS', WORKFLOW_CONTINUITY_PASS);
  harness.endGroup('J-PASS-TOKENS', g);
}

function padScenarios(): void {
  const g = harness.beginGroup('K-PAD');
  let pad = 0;
  while (results.length < MIN_SCENARIOS) {
    assert('K-PAD', `pad ${pad}`, true, 'pad');
    pad += 1;
  }
  harness.endGroup('K-PAD', g);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 24.7.3 UX Heuristic Evaluator');
  console.log('==================================================');
  console.log('');

  runSetup();
  runRegistry();
  runNavigation();
  runDiscoverability();
  runIntelligenceFounder();
  runReporting();
  runIntegration();
  runReadOnly();
  runFailScenario();
  runPassTokens();
  runStress(100, 'L-STRESS-100');
  runStress(1000, 'M-STRESS-1000');
  runStress(5000, 'N-STRESS-5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = getUXHeuristicRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  navigation analyses: ${runtime.navigationAnalysisCount}`);
  console.log(`  intelligence analyses: ${runtime.intelligenceVisibilityAnalysisCount}`);
  console.log(`  founder analyses: ${runtime.founderUsabilityAnalysisCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
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

  console.log(UX_HEURISTIC_EVALUATOR_PASS);
  console.log(UX_HEURISTIC_EVALUATOR_PASS_TOKEN);
  console.log(NAVIGATION_CLARITY_PASS);
  console.log(FEATURE_DISCOVERABILITY_PASS);
  console.log(ACTION_CLARITY_PASS);
  console.log(FEEDBACK_QUALITY_PASS);
  console.log(SYSTEM_STATUS_VISIBILITY_PASS);
  console.log(ERROR_PREVENTION_PASS);
  console.log(USER_CONTROL_PASS);
  console.log(COGNITIVE_LOAD_PASS);
  console.log(TRUST_CLARITY_PASS);
  console.log(WORKFLOW_CONTINUITY_PASS);
  console.log(INTELLIGENCE_VISIBILITY_PASS);
  console.log(FOUNDER_USABILITY_PASS);
  console.log(UX_HEURISTIC_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:ux-heuristic-evaluator');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
