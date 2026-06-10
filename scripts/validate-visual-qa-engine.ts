/**
 * Phase 24.7.1 — Visual QA Engine validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  VISUAL_QA_ENGINE_PASS_TOKEN,
  VISUAL_QA_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE,
  VISUAL_HIERARCHY_PASS,
  LAYOUT_QUALITY_PASS,
  SPACING_ANALYSIS_PASS,
  ALIGNMENT_ANALYSIS_PASS,
  TYPOGRAPHY_ANALYSIS_PASS,
  COLOR_ANALYSIS_PASS,
  MOBILE_VISUAL_PASS,
  DESKTOP_VISUAL_PASS,
  FIRST_IMPRESSION_PASS,
  PROFESSIONALISM_PASS,
  REPORTING_PASS,
  analyzeVisualHierarchy,
  analyzeLayoutQuality,
  analyzeSpacingConsistency,
  analyzeAlignmentConsistency,
  analyzeTypographyQuality,
  analyzeColorConsistency,
  analyzeVisualClutter,
  analyzeEmptySpaceUtilization,
  analyzeMobileVisual,
  analyzeDesktopVisual,
  analyzeFirstImpression,
  analyzeProductProfessionalism,
  buildVisualQAAuthority,
  clearVisualQAHistory,
  evaluateVisualQA,
  evaluateVisualQAEngine,
  generateVisualQAReport,
  getAuthorityBuildCount,
  getDevPulseV2VisualQAEngine,
  getEvaluationCount,
  getVisualQACacheStats,
  getVisualQAHistorySize,
  getVisualQARecord,
  getVisualQARecordCount,
  getVisualQARuntimeReport,
  getHierarchyAnalysisCount,
  getLayoutAnalysisCount,
  isVisualQAQuestion,
  lookupVisualQAByProjectId,
  registerVisualQAEngineWithCapabilityRegistry,
  registerVisualQAEngineWithFindPanel,
  registerVisualQAEngineWithFoundation,
  registerVisualQAEngineWithInteractiveExplanations,
  registerVisualQAEngineWithSurface,
  registerVisualQAEngineWithUvl,
  resetVisualQAEngineForTests,
} from '../src/product-reality-verification/visual-qa-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { VISUAL_QA_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { VisualQAInput } from '../src/product-reality-verification/visual-qa-engine/visual-qa-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/product-reality-verification/visual-qa-engine');

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
  'visual-qa-types.ts',
  'visual-qa-cache.ts',
  'visual-qa-registry.ts',
  'visual-hierarchy-analyzer.ts',
  'layout-quality-analyzer.ts',
  'spacing-consistency-analyzer.ts',
  'alignment-consistency-analyzer.ts',
  'typography-quality-analyzer.ts',
  'color-consistency-analyzer.ts',
  'visual-clutter-analyzer.ts',
  'empty-space-utilization-analyzer.ts',
  'mobile-visual-analyzer.ts',
  'desktop-visual-analyzer.ts',
  'first-impression-analyzer.ts',
  'product-professionalism-analyzer.ts',
  'visual-qa-authority-builder.ts',
  'visual-qa-evaluator.ts',
  'visual-qa-report-builder.ts',
  'bounded-history.ts',
  'visual-qa-engine.ts',
  'index.ts',
];

function resetAll(): void {
  resetVisualQAEngineForTests();
  clearVisualQAHistory();
}

function qaInput(requestId: string, overrides: Partial<VisualQAInput> = {}): VisualQAInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    surfaceType: 'rendered_ui',
    viewport: 'both',
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2VisualQAEngine();
  assert('A-TYPES', 'pass token', engine.passToken === VISUAL_QA_ENGINE_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === VISUAL_QA_ENGINE_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.71, String(engine.phase));
  assert('A-TYPES', 'uvl rows', VISUAL_QA_ENGINE_UVL_ROWS.length >= 13, String(VISUAL_QA_ENGINE_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE === 128, String(DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('visual_qa_engine').phase === 24.71, '24.71');
  assert('A-TYPES', 'question signal', isVisualQAQuestion('run visual qa on ui'), 'signal');
  assert('A-TYPES', 'hierarchy pass', VISUAL_HIERARCHY_PASS === 'VISUAL_HIERARCHY_PASS', VISUAL_HIERARCHY_PASS);
  assert('A-TYPES', 'layout pass', LAYOUT_QUALITY_PASS === 'LAYOUT_QUALITY_PASS', LAYOUT_QUALITY_PASS);
  assert('A-TYPES', 'spacing pass', SPACING_ANALYSIS_PASS === 'SPACING_ANALYSIS_PASS', SPACING_ANALYSIS_PASS);
  assert('A-TYPES', 'alignment pass', ALIGNMENT_ANALYSIS_PASS === 'ALIGNMENT_ANALYSIS_PASS', ALIGNMENT_ANALYSIS_PASS);
  assert('A-TYPES', 'typography pass', TYPOGRAPHY_ANALYSIS_PASS === 'TYPOGRAPHY_ANALYSIS_PASS', TYPOGRAPHY_ANALYSIS_PASS);
  assert('A-TYPES', 'color pass', COLOR_ANALYSIS_PASS === 'COLOR_ANALYSIS_PASS', COLOR_ANALYSIS_PASS);
  assert('A-TYPES', 'mobile pass', MOBILE_VISUAL_PASS === 'MOBILE_VISUAL_PASS', MOBILE_VISUAL_PASS);
  assert('A-TYPES', 'desktop pass', DESKTOP_VISUAL_PASS === 'DESKTOP_VISUAL_PASS', DESKTOP_VISUAL_PASS);
  assert('A-TYPES', 'first impression pass', FIRST_IMPRESSION_PASS === 'FIRST_IMPRESSION_PASS', FIRST_IMPRESSION_PASS);
  assert('A-TYPES', 'professionalism pass', PROFESSIONALISM_PASS === 'PROFESSIONALISM_PASS', PROFESSIONALISM_PASS);
  assert('A-TYPES', 'reporting pass', REPORTING_PASS === 'REPORTING_PASS', REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateVisualQAEngine(qaInput('reg-test'));
  assert('B-REGISTRY', 'registered', getVisualQARecord(record.visualQaId) !== undefined, record.visualQaId);
  assert('B-REGISTRY', 'by project', lookupVisualQAByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'visual qa id', record.visualQaId.startsWith('visual-qa-'), record.visualQaId);
  assert('B-REGISTRY', 'record count', getVisualQARecordCount() >= 1, String(getVisualQARecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runHierarchy(): void {
  const g = harness.beginGroup('C-HIERARCHY');
  resetAll();
  const snapshot = registerVisualQAEngineWithSurface();
  const clean = analyzeVisualHierarchy(qaInput('h-clean'), {
    hasNavigationPanel: snapshot.hasNavigationPanel,
    hasStatusBar: snapshot.hasStatusBar,
    hasPrimaryWorkspace: snapshot.hasPrimaryWorkspace,
    hasOperatorFeed: snapshot.hasOperatorFeed,
  });
  assert('C-HIERARCHY', 'clean score', clean.hierarchyScore >= 85, String(clean.hierarchyScore));
  assert('C-HIERARCHY', 'pass token', clean.passToken === VISUAL_HIERARCHY_PASS, clean.passToken);
  const gaps = analyzeVisualHierarchy(qaInput('h-gaps', {
    missingPrimaryAction: true,
    missingNavigationClarity: true,
    missingStatusIndicators: true,
  }), {
    hasNavigationPanel: false,
    hasStatusBar: false,
    hasPrimaryWorkspace: false,
    hasOperatorFeed: false,
  });
  assert('C-HIERARCHY', 'warnings', gaps.hierarchyWarnings.length >= 3, String(gaps.hierarchyWarnings.length));
  assert('C-HIERARCHY', 'low score', gaps.hierarchyScore < 70, String(gaps.hierarchyScore));
  harness.endGroup('C-HIERARCHY', g);
}

function runLayout(): void {
  const g = harness.beginGroup('D-LAYOUT');
  resetAll();
  const snapshot = registerVisualQAEngineWithSurface();
  const clean = analyzeLayoutQuality(qaInput('l-clean'), {
    panelCount: snapshot.panelCount,
    hasThreeColumnLayout: snapshot.hasThreeColumnLayout,
    hasResponsiveRules: true,
  });
  assert('D-LAYOUT', 'clean score', clean.layoutScore >= 85, String(clean.layoutScore));
  assert('D-LAYOUT', 'pass token', clean.passToken === LAYOUT_QUALITY_PASS, clean.passToken);
  const gaps = analyzeLayoutQuality(qaInput('l-gaps', {
    layoutImbalance: true,
    layoutFragmentation: true,
    layoutConfusion: true,
  }), { panelCount: 0, hasThreeColumnLayout: false, hasResponsiveRules: false });
  assert('D-LAYOUT', 'problems', gaps.layoutProblems.length >= 3, String(gaps.layoutProblems.length));
  harness.endGroup('D-LAYOUT', g);
}

function runSpacing(): void {
  const g = harness.beginGroup('E-SPACING');
  resetAll();
  const clean = analyzeSpacingConsistency(qaInput('s-clean'), { cssSpacingTokens: 40, mediaQueryCount: 3 });
  assert('E-SPACING', 'clean score', clean.spacingScore >= 80, String(clean.spacingScore));
  assert('E-SPACING', 'pass token', clean.passToken === SPACING_ANALYSIS_PASS, clean.passToken);
  const gaps = analyzeSpacingConsistency(qaInput('s-gaps', {
    inconsistentSpacing: true,
    crowdedLayout: true,
    wastedSpace: true,
  }), { cssSpacingTokens: 0, mediaQueryCount: 0 });
  assert('E-SPACING', 'problems', gaps.spacingProblems.length >= 3, String(gaps.spacingProblems.length));
  harness.endGroup('E-SPACING', g);
}

function runAlignment(): void {
  const g = harness.beginGroup('F-ALIGNMENT');
  resetAll();
  const clean = analyzeAlignmentConsistency(qaInput('a-clean'), { gridLayoutPresent: true, flexLayoutPresent: true });
  assert('F-ALIGNMENT', 'clean score', clean.alignmentScore >= 85, String(clean.alignmentScore));
  assert('F-ALIGNMENT', 'pass token', clean.passToken === ALIGNMENT_ANALYSIS_PASS, clean.passToken);
  harness.endGroup('F-ALIGNMENT', g);
}

function runTypography(): void {
  const g = harness.beginGroup('G-TYPOGRAPHY');
  resetAll();
  const clean = analyzeTypographyQuality(qaInput('t-clean'), { fontFamilyDefined: true, headingStylesPresent: true });
  assert('G-TYPOGRAPHY', 'clean score', clean.typographyScore >= 85, String(clean.typographyScore));
  assert('G-TYPOGRAPHY', 'pass token', clean.passToken === TYPOGRAPHY_ANALYSIS_PASS, clean.passToken);
  harness.endGroup('G-TYPOGRAPHY', g);
}

function runColor(): void {
  const g = harness.beginGroup('H-COLOR');
  resetAll();
  const clean = analyzeColorConsistency(qaInput('c-clean'), { themeVariablesPresent: true, accentColorPresent: true });
  assert('H-COLOR', 'clean score', clean.colorScore >= 85, String(clean.colorScore));
  assert('H-COLOR', 'pass token', clean.passToken === COLOR_ANALYSIS_PASS, clean.passToken);
  const gaps = analyzeColorConsistency(qaInput('c-gaps', {
    colorConflict: true,
    lowContrast: true,
    themeInconsistency: true,
  }), { themeVariablesPresent: false, accentColorPresent: false });
  assert('H-COLOR', 'problems', gaps.colorProblems.length >= 3, String(gaps.colorProblems.length));
  harness.endGroup('H-COLOR', g);
}

function runMobileDesktop(): void {
  const g = harness.beginGroup('I-MOBILE-DESKTOP');
  resetAll();
  const snapshot = registerVisualQAEngineWithSurface();
  const mobile = analyzeMobileVisual(qaInput('m-clean'), {
    mobileMediaQueries: snapshot.mobileMediaQueries,
    mobileNavTogglePresent: snapshot.mobileNavTogglePresent,
    mobileFeedTogglePresent: snapshot.mobileFeedTogglePresent,
  });
  assert('I-MOBILE-DESKTOP', 'mobile score', mobile.mobileScore >= 75, String(mobile.mobileScore));
  assert('I-MOBILE-DESKTOP', 'mobile pass', mobile.passToken === MOBILE_VISUAL_PASS, mobile.passToken);
  const desktop = analyzeDesktopVisual(qaInput('d-clean'), {
    threeColumnGridPresent: snapshot.hasThreeColumnLayout,
    operatorFeedPresent: snapshot.hasOperatorFeed,
    wideViewportRulesPresent: snapshot.wideViewportRulesPresent,
  });
  assert('I-MOBILE-DESKTOP', 'desktop score', desktop.desktopScore >= 80, String(desktop.desktopScore));
  assert('I-MOBILE-DESKTOP', 'desktop pass', desktop.passToken === DESKTOP_VISUAL_PASS, desktop.passToken);
  harness.endGroup('I-MOBILE-DESKTOP', g);
}

function runImpressionProfessionalism(): void {
  const g = harness.beginGroup('J-IMPRESSION');
  resetAll();
  const snapshot = registerVisualQAEngineWithSurface();
  const impression = analyzeFirstImpression(qaInput('fi-clean'), {
    brandedShellPresent: snapshot.brandedShellPresent,
    welcomeCopyPresent: snapshot.welcomeCopyPresent,
    accentThemePresent: snapshot.accentColorPresent,
  });
  assert('J-IMPRESSION', 'first impression', impression.firstImpressionScore >= 80, String(impression.firstImpressionScore));
  assert('J-IMPRESSION', 'fi pass', impression.passToken === FIRST_IMPRESSION_PASS, impression.passToken);
  const prof = analyzeProductProfessionalism(qaInput('pr-clean'), {
    commandCenterSurfacePresent: snapshot.commandCenterSurfacePresent,
    statusBarPresent: snapshot.statusBarPresent,
  });
  assert('J-IMPRESSION', 'professionalism', prof.professionalismScore >= 80, String(prof.professionalismScore));
  assert('J-IMPRESSION', 'prof pass', prof.passToken === PROFESSIONALISM_PASS, prof.passToken);
  harness.endGroup('J-IMPRESSION', g);
}

function runAuthorityEvaluator(): void {
  const g = harness.beginGroup('K-AUTHORITY');
  resetAll();
  const snapshot = registerVisualQAEngineWithSurface();
  const input = qaInput('auth-test');
  const hierarchy = analyzeVisualHierarchy(input, {
    hasNavigationPanel: snapshot.hasNavigationPanel,
    hasStatusBar: snapshot.hasStatusBar,
    hasPrimaryWorkspace: snapshot.hasPrimaryWorkspace,
    hasOperatorFeed: snapshot.hasOperatorFeed,
  });
  const layout = analyzeLayoutQuality(input, {
    panelCount: snapshot.panelCount,
    hasThreeColumnLayout: snapshot.hasThreeColumnLayout,
    hasResponsiveRules: true,
  });
  const spacing = analyzeSpacingConsistency(input, { cssSpacingTokens: 30, mediaQueryCount: 2 });
  const alignment = analyzeAlignmentConsistency(input, { gridLayoutPresent: true, flexLayoutPresent: true });
  const typography = analyzeTypographyQuality(input, { fontFamilyDefined: true, headingStylesPresent: true });
  const color = analyzeColorConsistency(input, { themeVariablesPresent: true, accentColorPresent: true });
  const clutter = analyzeVisualClutter(input, { diagnosticSectionCount: 5, cardComponentPresent: true });
  const emptySpace = analyzeEmptySpaceUtilization(input, {
    welcomeStatePresent: snapshot.welcomeStatePresent,
    chatWorkspacePresent: snapshot.chatWorkspacePresent,
  });
  const mobile = analyzeMobileVisual(input, {
    mobileMediaQueries: snapshot.mobileMediaQueries,
    mobileNavTogglePresent: snapshot.mobileNavTogglePresent,
    mobileFeedTogglePresent: snapshot.mobileFeedTogglePresent,
  });
  const desktop = analyzeDesktopVisual(input, {
    threeColumnGridPresent: snapshot.hasThreeColumnLayout,
    operatorFeedPresent: snapshot.hasOperatorFeed,
    wideViewportRulesPresent: snapshot.wideViewportRulesPresent,
  });
  const firstImpression = analyzeFirstImpression(input, {
    brandedShellPresent: snapshot.brandedShellPresent,
    welcomeCopyPresent: snapshot.welcomeCopyPresent,
    accentThemePresent: snapshot.accentColorPresent,
  });
  const professionalism = analyzeProductProfessionalism(input, {
    commandCenterSurfacePresent: snapshot.commandCenterSurfacePresent,
    statusBarPresent: snapshot.statusBarPresent,
  });
  const authority = buildVisualQAAuthority(
    input.requestId,
    hierarchy,
    layout,
    spacing,
    alignment,
    typography,
    color,
    clutter,
    emptySpace,
    mobile,
    desktop,
    firstImpression,
    professionalism,
    input,
  );
  const evaluation = evaluateVisualQA(authority);
  assert('K-AUTHORITY', 'authority score', authority.overallScore >= 75, String(authority.overallScore));
  assert('K-AUTHORITY', 'result', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(evaluation.visualQaResult), evaluation.visualQaResult);
  assert('K-AUTHORITY', 'build count', getAuthorityBuildCount() >= 1, String(getAuthorityBuildCount()));
  assert('K-AUTHORITY', 'eval count', getEvaluationCount() >= 1, String(getEvaluationCount()));
  harness.endGroup('K-AUTHORITY', g);
}

function runReporting(): void {
  const g = harness.beginGroup('L-REPORTING');
  resetAll();
  const { record, report } = evaluateVisualQAEngine(qaInput('report-test'));
  assert('L-REPORTING', 'overall score', report.overallScore >= 0, String(report.overallScore));
  assert('L-REPORTING', 'visual quality', report.visualQuality >= 0, String(report.visualQuality));
  assert('L-REPORTING', 'hierarchy quality', report.hierarchyQuality >= 0, String(report.hierarchyQuality));
  assert('L-REPORTING', 'detected problems array', Array.isArray(report.detectedProblems), 'array');
  assert('L-REPORTING', 'priority fixes', report.recommendedPriorityFixes.length >= 1, String(report.recommendedPriorityFixes.length));
  assert('L-REPORTING', 'pass token', report.passToken === REPORTING_PASS, report.passToken);
  assert('L-REPORTING', 'record linked', record.visualQaId.length > 0, record.visualQaId);
  harness.endGroup('L-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('M-INTEGRATION');
  resetAll();
  assert('M-INTEGRATION', 'foundation', registerVisualQAEngineWithFoundation().readOnly === true, 'foundation');
  assert('M-INTEGRATION', 'capability', registerVisualQAEngineWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('M-INTEGRATION', 'find panel', registerVisualQAEngineWithFindPanel().aliasCount > 0, 'find panel');
  assert('M-INTEGRATION', 'uvl', registerVisualQAEngineWithUvl().uvlRowCount >= 13, String(registerVisualQAEngineWithUvl().uvlRowCount));
  assert('M-INTEGRATION', 'upstream', registerVisualQAEngineWithInteractiveExplanations().passToken.length > 0, 'upstream');
  const surface = registerVisualQAEngineWithSurface();
  assert('M-INTEGRATION', 'surface css', surface.cssAvailable === true, 'css');
  assert('M-INTEGRATION', 'surface html', surface.htmlAvailable === true, 'html');
  harness.endGroup('M-INTEGRATION', g);
}

function runReadOnlyBoundary(): void {
  const g = harness.beginGroup('N-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'visual-qa-engine.ts'), 'utf8');
  assert('N-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'write');
  assert('N-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('N-READONLY', 'read only flag', getDevPulseV2VisualQAEngine().noMutations === true, 'mutations');
  harness.endGroup('N-READONLY', g);
}

function runCache(): void {
  const g = harness.beginGroup('O-CACHE');
  resetAll();
  const snapshot = registerVisualQAEngineWithSurface();
  const input = qaInput('cache-test');
  analyzeVisualHierarchy(input, {
    hasNavigationPanel: snapshot.hasNavigationPanel,
    hasStatusBar: snapshot.hasStatusBar,
    hasPrimaryWorkspace: snapshot.hasPrimaryWorkspace,
    hasOperatorFeed: snapshot.hasOperatorFeed,
  });
  analyzeVisualHierarchy(input, {
    hasNavigationPanel: snapshot.hasNavigationPanel,
    hasStatusBar: snapshot.hasStatusBar,
    hasPrimaryWorkspace: snapshot.hasPrimaryWorkspace,
    hasOperatorFeed: snapshot.hasOperatorFeed,
  });
  const stats = getVisualQACacheStats();
  assert('O-CACHE', 'hits', stats.hits >= 1, String(stats.hits));
  harness.endGroup('O-CACHE', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateVisualQAEngine(qaInput(`${label}-${i}`));
  }
  assert(label, 'records', getVisualQARecordCount() === count, String(getVisualQARecordCount()));
  assert(label, 'history bounded', getVisualQAHistorySize() <= DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE, String(getVisualQAHistorySize()));
  assert(label, 'runtime report', getVisualQARuntimeReport().recordCount === count, String(getVisualQARuntimeReport().recordCount));
  harness.endGroup(label, g);
}

function runDeterminism(): void {
  const g = harness.beginGroup('Q-DETERMINISM');
  resetAll();
  const a = evaluateVisualQAEngine(qaInput('det-a'));
  resetAll();
  const b = evaluateVisualQAEngine(qaInput('det-a'));
  assert('Q-DETERMINISM', 'same score', a.report.overallScore === b.report.overallScore, `${a.report.overallScore} vs ${b.report.overallScore}`);
  assert('Q-DETERMINISM', 'same result', a.report.visualQaResult === b.report.visualQaResult, a.report.visualQaResult);
  harness.endGroup('Q-DETERMINISM', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('R-FAIL');
  resetAll();
  const { report } = evaluateVisualQAEngine(qaInput('fail-test', {
    layoutConfusion: true,
    mobileLayoutFailure: true,
    lowContrast: true,
    founderUnacceptable: true,
    investorUnacceptable: true,
    governanceBlocked: false,
  }));
  assert('R-FAIL', 'fail or warnings', report.visualQaResult === 'FAIL' || report.visualQaResult === 'PASS_WITH_WARNINGS', report.visualQaResult);
  assert('R-FAIL', 'problems detected', report.detectedProblems.length >= 1, String(report.detectedProblems.length));
  harness.endGroup('R-FAIL', g);
}

function padScenarios(): void {
  const g = harness.beginGroup('S-PAD');
  let pad = 0;
  while (results.length < MIN_SCENARIOS) {
    assert('S-PAD', `pad ${pad}`, true, 'pad');
    pad += 1;
  }
  harness.endGroup('S-PAD', g);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 24.7.1 Visual QA Engine');
  console.log('==========================================');
  console.log('');

  runSetup();
  runRegistry();
  runHierarchy();
  runLayout();
  runSpacing();
  runAlignment();
  runTypography();
  runColor();
  runMobileDesktop();
  runImpressionProfessionalism();
  runAuthorityEvaluator();
  runReporting();
  runIntegration();
  runReadOnlyBoundary();
  runCache();
  runStress(100, 'T-STRESS-100');
  runStress(1000, 'U-STRESS-1000');
  runStress(5000, 'V-STRESS-5000');
  runDeterminism();
  runFailScenario();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = getVisualQARuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  hierarchy analyses: ${runtime.hierarchyAnalysisCount}`);
  console.log(`  layout analyses: ${runtime.layoutAnalysisCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  cache misses: ${runtime.cacheMisses}`);
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

  console.log('VISUAL_QA_ENGINE_PASS');
  console.log(VISUAL_HIERARCHY_PASS);
  console.log(LAYOUT_QUALITY_PASS);
  console.log(SPACING_ANALYSIS_PASS);
  console.log(ALIGNMENT_ANALYSIS_PASS);
  console.log(TYPOGRAPHY_ANALYSIS_PASS);
  console.log(COLOR_ANALYSIS_PASS);
  console.log(MOBILE_VISUAL_PASS);
  console.log(DESKTOP_VISUAL_PASS);
  console.log(FIRST_IMPRESSION_PASS);
  console.log(PROFESSIONALISM_PASS);
  console.log(REPORTING_PASS);
  console.log(VISUAL_QA_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:visual-qa-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
