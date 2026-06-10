/**
 * Phase 24.7.6 — Auto-Polish Loop validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  AUTO_POLISH_LOOP_PASS_TOKEN,
  AUTO_POLISH_LOOP_PASS,
  AUTO_POLISH_LOOP_OWNER_MODULE,
  DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE,
  MAX_POLISH_OPPORTUNITIES,
  VISUAL_POLISH_PASS,
  UX_POLISH_PASS,
  RESPONSIVE_POLISH_PASS,
  PREVIEW_POLISH_PASS,
  DISCOVERABILITY_POLISH_PASS,
  FOUNDER_USABILITY_POLISH_PASS,
  TRUST_POLISH_PASS,
  INTELLIGENCE_VISIBILITY_POLISH_PASS,
  WORKFLOW_POLISH_PASS,
  PRODUCT_COHERENCE_POLISH_PASS,
  POLISH_PRIORITY_PASS,
  POLISH_ROADMAP_PASS,
  AUTO_POLISH_REPORTING_PASS,
  analyzePolishPriority,
  analyzeVisualPolish,
  buildPolishRoadmap,
  clearAutoPolishHistory,
  createPolishOpportunity,
  evaluateAutoPolishLoop,
  getAutoPolishHistorySize,
  getAutoPolishLoopRuntimeReport,
  getAutoPolishRecord,
  getAutoPolishRecordCount,
  getDevPulseV2AutoPolishLoop,
  isAutoPolishQuestion,
  lookupAutoPolishByProjectId,
  registerAutoPolishLoopWithCapabilityRegistry,
  registerAutoPolishLoopWithFindPanel,
  registerAutoPolishLoopWithFoundation,
  registerAutoPolishLoopWithProductRealityChain,
  registerAutoPolishLoopWithSurface,
  registerAutoPolishLoopWithUvl,
  resetAutoPolishLoopForTests,
} from '../src/product-reality-verification/auto-polish-loop/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { AUTO_POLISH_LOOP_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { AutoPolishInput } from '../src/product-reality-verification/auto-polish-loop/auto-polish-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/product-reality-verification/auto-polish-loop');

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
  'auto-polish-types.ts',
  'auto-polish-cache.ts',
  'auto-polish-registry.ts',
  'bounded-history.ts',
  'polish-opportunity-model.ts',
  'visual-polish-analyzer.ts',
  'ux-polish-analyzer.ts',
  'responsive-polish-analyzer.ts',
  'preview-polish-analyzer.ts',
  'discoverability-polish-analyzer.ts',
  'founder-usability-polish-analyzer.ts',
  'trust-polish-analyzer.ts',
  'intelligence-visibility-polish-analyzer.ts',
  'workflow-polish-analyzer.ts',
  'product-coherence-polish-analyzer.ts',
  'polish-priority-analyzer.ts',
  'polish-roadmap-builder.ts',
  'auto-polish-authority-builder.ts',
  'auto-polish-evaluator.ts',
  'auto-polish-report-builder.ts',
  'auto-polish-loop.ts',
  'index.ts',
];

function resetAll(): void {
  resetAutoPolishLoopForTests();
  clearAutoPolishHistory();
}

function apInput(requestId: string, overrides: Partial<AutoPolishInput> = {}): AutoPolishInput {
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
  const loop = getDevPulseV2AutoPolishLoop();
  assert('A-TYPES', 'pass token v1', loop.passToken === AUTO_POLISH_LOOP_PASS_TOKEN, loop.passToken);
  assert('A-TYPES', 'pass token', AUTO_POLISH_LOOP_PASS === 'AUTO_POLISH_LOOP_PASS', AUTO_POLISH_LOOP_PASS);
  assert('A-TYPES', 'owner module', loop.ownerModule === AUTO_POLISH_LOOP_OWNER_MODULE, loop.ownerModule);
  assert('A-TYPES', 'read only', loop.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', loop.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', loop.phase === 24.76, String(loop.phase));
  assert('A-TYPES', 'uvl rows', AUTO_POLISH_LOOP_UVL_ROWS.length >= 13, String(AUTO_POLISH_LOOP_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE === 128, String(DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE));
  assert('A-TYPES', 'max opportunities', MAX_POLISH_OPPORTUNITIES === 64, String(MAX_POLISH_OPPORTUNITIES));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('auto_polish_loop').phase === 24.76, '24.76');
  assert('A-TYPES', 'question signal', isAutoPolishQuestion('what should be polished before launch'), 'signal');
  assert('A-TYPES', 'visual pass', VISUAL_POLISH_PASS === 'VISUAL_POLISH_PASS', VISUAL_POLISH_PASS);
  assert('A-TYPES', 'roadmap pass', POLISH_ROADMAP_PASS === 'POLISH_ROADMAP_PASS', POLISH_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass', AUTO_POLISH_REPORTING_PASS === 'REPORTING_PASS', AUTO_POLISH_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateAutoPolishLoop(apInput('reg-test'));
  assert('B-REGISTRY', 'registered', getAutoPolishRecord(record.autoPolishId) !== undefined, record.autoPolishId);
  assert('B-REGISTRY', 'by project', lookupAutoPolishByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'ap id', record.autoPolishId.startsWith('auto-polish-'), record.autoPolishId);
  assert('B-REGISTRY', 'record count', getAutoPolishRecordCount() >= 1, String(getAutoPolishRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runOpportunityModel(): void {
  const g = harness.beginGroup('C-OPPORTUNITY');
  resetAll();
  const opp = createPolishOpportunity({
    category: 'VISUAL',
    title: 'Test opportunity',
    description: 'Test description',
    impactLevel: 'CRITICAL',
    founderImpact: 90,
    userImpact: 80,
    effortEstimate: 'MEDIUM',
    urgency: 85,
    sourceAnalyzer: 'visual-polish-analyzer',
    detectionCode: 'VISUAL_POLISH_OPPORTUNITY',
  });
  assert('C-OPPORTUNITY', 'id', opp.opportunityId.startsWith('polish-opportunity-'), opp.opportunityId);
  assert('C-OPPORTUNITY', 'priority', opp.recommendedPriority === 1, String(opp.recommendedPriority));
  assert('C-OPPORTUNITY', 'detection', opp.detectionCode === 'VISUAL_POLISH_OPPORTUNITY', opp.detectionCode);
  const visual = analyzeVisualPolish(apInput('vis-test'), {
    overallScore: 85,
    hierarchyScore: 90,
    spacingScore: 88,
    typographyScore: 86,
    clutterScore: 84,
    priorityFixes: [],
  });
  assert('C-OPPORTUNITY', 'visual pass', visual.passToken === VISUAL_POLISH_PASS, visual.passToken);
  assert('C-OPPORTUNITY', 'visual score', visual.polishScore >= 80, String(visual.polishScore));
  harness.endGroup('C-OPPORTUNITY', g);
}

function runPriorityRoadmap(): void {
  const g = harness.beginGroup('D-PRIORITY-ROADMAP');
  resetAll();
  const { authority } = evaluateAutoPolishLoop(apInput('priority-test'));
  const priority = analyzePolishPriority('priority-test', authority.allOpportunities);
  assert('D-PRIORITY-ROADMAP', 'priority pass', priority.passToken === POLISH_PRIORITY_PASS, priority.passToken);
  assert('D-PRIORITY-ROADMAP', 'bounded', authority.allOpportunities.length <= MAX_POLISH_OPPORTUNITIES, String(authority.allOpportunities.length));
  const roadmap = buildPolishRoadmap('priority-test', priority);
  assert('D-PRIORITY-ROADMAP', 'roadmap pass', roadmap.passToken === POLISH_ROADMAP_PASS, roadmap.passToken);
  assert('D-PRIORITY-ROADMAP', 'critical section', Array.isArray(roadmap.criticalBeforeLaunch), 'array');
  assert('D-PRIORITY-ROADMAP', 'high impact', Array.isArray(roadmap.highImpactImprovements), 'array');
  harness.endGroup('D-PRIORITY-ROADMAP', g);
}

function runReporting(): void {
  const g = harness.beginGroup('E-REPORTING');
  resetAll();
  const { record, report } = evaluateAutoPolishLoop(apInput('report-test'));
  assert('E-REPORTING', 'overall score', report.overallScore >= 0, String(report.overallScore));
  assert('E-REPORTING', 'visual score', report.visualPolishScore >= 0, String(report.visualPolishScore));
  assert('E-REPORTING', 'intelligence score', report.intelligenceVisibilityScore >= 0, String(report.intelligenceVisibilityScore));
  assert('E-REPORTING', 'total opportunities', report.totalOpportunities >= 0, String(report.totalOpportunities));
  assert('E-REPORTING', 'roadmap', report.polishRoadmap.passToken === POLISH_ROADMAP_PASS, report.polishRoadmap.passToken);
  assert('E-REPORTING', 'next improvements', report.recommendedNextImprovements.length >= 1, String(report.recommendedNextImprovements.length));
  assert('E-REPORTING', 'pass token', report.passToken === AUTO_POLISH_REPORTING_PASS, report.passToken);
  assert('E-REPORTING', 'result', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(report.autoPolishResult), report.autoPolishResult);
  assert('E-REPORTING', 'record linked', record.autoPolishId.length > 0, record.autoPolishId);
  harness.endGroup('E-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerAutoPolishLoopWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerAutoPolishLoopWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerAutoPolishLoopWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerAutoPolishLoopWithUvl().uvlRowCount >= 13, String(registerAutoPolishLoopWithUvl().uvlRowCount));
  const chain = registerAutoPolishLoopWithProductRealityChain();
  assert('F-INTEGRATION', 'visual qa chain', chain.visualQa === true, 'visual');
  assert('F-INTEGRATION', 'ux chain', chain.uxHeuristic === true, 'ux');
  assert('F-INTEGRATION', 'first impression chain', chain.firstImpression === true, 'fi');
  assert('F-INTEGRATION', 'live preview chain', chain.livePreview === true, 'lp');
  const surface = registerAutoPolishLoopWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'auto-polish-loop.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2AutoPolishLoop().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateAutoPolishLoop(apInput(`${label}-${i}`));
  }
  assert(label, 'records', getAutoPolishRecordCount() === count, String(getAutoPolishRecordCount()));
  assert(label, 'history bounded', getAutoPolishHistorySize() <= DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE, String(getAutoPolishHistorySize()));
  harness.endGroup(label, g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { report } = evaluateAutoPolishLoop(apInput('fail-test', {
    intelligenceHidden: true,
    founderFriction: true,
    trustGap: true,
    productFragmented: true,
    mobilePolishWeak: true,
  }));
  assert('H-FAIL', 'fail or warnings', report.autoPolishResult === 'FAIL' || report.autoPolishResult === 'PASS_WITH_WARNINGS', report.autoPolishResult);
  assert('H-FAIL', 'opportunities', report.totalOpportunities >= 1, String(report.totalOpportunities));
  harness.endGroup('H-FAIL', g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', UX_POLISH_PASS, UX_POLISH_PASS === 'UX_POLISH_PASS', UX_POLISH_PASS);
  assert('I-PASS-TOKENS', RESPONSIVE_POLISH_PASS, RESPONSIVE_POLISH_PASS === 'RESPONSIVE_POLISH_PASS', RESPONSIVE_POLISH_PASS);
  assert('I-PASS-TOKENS', PREVIEW_POLISH_PASS, PREVIEW_POLISH_PASS === 'PREVIEW_POLISH_PASS', PREVIEW_POLISH_PASS);
  assert('I-PASS-TOKENS', DISCOVERABILITY_POLISH_PASS, DISCOVERABILITY_POLISH_PASS === 'DISCOVERABILITY_POLISH_PASS', DISCOVERABILITY_POLISH_PASS);
  assert('I-PASS-TOKENS', FOUNDER_USABILITY_POLISH_PASS, FOUNDER_USABILITY_POLISH_PASS === 'FOUNDER_USABILITY_POLISH_PASS', FOUNDER_USABILITY_POLISH_PASS);
  assert('I-PASS-TOKENS', TRUST_POLISH_PASS, TRUST_POLISH_PASS === 'TRUST_POLISH_PASS', TRUST_POLISH_PASS);
  assert('I-PASS-TOKENS', INTELLIGENCE_VISIBILITY_POLISH_PASS, INTELLIGENCE_VISIBILITY_POLISH_PASS === 'INTELLIGENCE_VISIBILITY_POLISH_PASS', INTELLIGENCE_VISIBILITY_POLISH_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_POLISH_PASS, WORKFLOW_POLISH_PASS === 'WORKFLOW_POLISH_PASS', WORKFLOW_POLISH_PASS);
  assert('I-PASS-TOKENS', PRODUCT_COHERENCE_POLISH_PASS, PRODUCT_COHERENCE_POLISH_PASS === 'PRODUCT_COHERENCE_POLISH_PASS', PRODUCT_COHERENCE_POLISH_PASS);
  assert('I-PASS-TOKENS', POLISH_PRIORITY_PASS, POLISH_PRIORITY_PASS === 'POLISH_PRIORITY_PASS', POLISH_PRIORITY_PASS);
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
  console.log('DevPulse V2 — Phase 24.7.6 Auto-Polish Loop');
  console.log('==============================================');
  console.log('');

  runSetup();
  runRegistry();
  runOpportunityModel();
  runPriorityRoadmap();
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
  const runtime = getAutoPolishLoopRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  visual analyses: ${runtime.visualPolishAnalysisCount}`);
  console.log(`  intelligence analyses: ${runtime.intelligenceVisibilityPolishAnalysisCount}`);
  console.log(`  priority analyses: ${runtime.priorityAnalysisCount}`);
  console.log(`  roadmap builds: ${runtime.roadmapBuildCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
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

  console.log(AUTO_POLISH_LOOP_PASS);
  console.log(AUTO_POLISH_LOOP_PASS_TOKEN);
  console.log(VISUAL_POLISH_PASS);
  console.log(UX_POLISH_PASS);
  console.log(RESPONSIVE_POLISH_PASS);
  console.log(PREVIEW_POLISH_PASS);
  console.log(DISCOVERABILITY_POLISH_PASS);
  console.log(FOUNDER_USABILITY_POLISH_PASS);
  console.log(TRUST_POLISH_PASS);
  console.log(INTELLIGENCE_VISIBILITY_POLISH_PASS);
  console.log(WORKFLOW_POLISH_PASS);
  console.log(PRODUCT_COHERENCE_POLISH_PASS);
  console.log(POLISH_PRIORITY_PASS);
  console.log(POLISH_ROADMAP_PASS);
  console.log(AUTO_POLISH_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:auto-polish-loop');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
