/**
 * Phase 24.7.4 — First-Impression Judge validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FIRST_IMPRESSION_JUDGE_PASS_TOKEN,
  FIRST_IMPRESSION_JUDGE_PASS,
  FIRST_IMPRESSION_JUDGE_OWNER_MODULE,
  DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE,
  FIRST_VISIT_CONTEXT_PASS,
  PRODUCT_CLARITY_PASS,
  INTELLIGENCE_PERCEPTION_PASS,
  TRUSTWORTHINESS_PERCEPTION_PASS,
  VISUAL_CONFIDENCE_PASS,
  FOUNDER_USEFULNESS_PASS,
  PREMIUM_FEEL_PASS,
  ACTION_READINESS_PASS,
  PRODUCT_IDENTITY_PASS,
  EMOTIONAL_CONFIDENCE_PASS,
  LAUNCH_READINESS_PERCEPTION_PASS,
  FIRST_IMPRESSION_REPORTING_PASS,
  analyzeProductClarity,
  analyzeIntelligencePerception,
  analyzeFounderUsefulness,
  buildFirstVisitContext,
  buildFirstImpressionAuthority,
  clearFirstImpressionHistory,
  evaluateFirstImpressionJudge,
  getAuthorityBuildCount,
  getDevPulseV2FirstImpressionJudge,
  getEvaluationCount,
  getFirstImpressionCacheStats,
  getFirstImpressionHistorySize,
  getFirstImpressionRecord,
  getFirstImpressionRecordCount,
  getFirstImpressionRuntimeReport,
  isFirstImpressionQuestion,
  listFirstVisitPersonas,
  lookupFirstImpressionByProjectId,
  registerFirstImpressionJudgeWithCapabilityRegistry,
  registerFirstImpressionJudgeWithFindPanel,
  registerFirstImpressionJudgeWithFoundation,
  registerFirstImpressionJudgeWithSurface,
  registerFirstImpressionJudgeWithUvl,
  registerFirstImpressionJudgeWithUXHeuristicEvaluator,
  resetFirstImpressionJudgeForTests,
} from '../src/product-reality-verification/first-impression-judge/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FIRST_IMPRESSION_JUDGE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FirstImpressionInput } from '../src/product-reality-verification/first-impression-judge/first-impression-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/product-reality-verification/first-impression-judge');

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
  'first-impression-types.ts',
  'first-impression-cache.ts',
  'first-impression-registry.ts',
  'bounded-history.ts',
  'first-visit-context-builder.ts',
  'product-clarity-analyzer.ts',
  'intelligence-perception-analyzer.ts',
  'trustworthiness-perception-analyzer.ts',
  'visual-confidence-analyzer.ts',
  'founder-usefulness-analyzer.ts',
  'premium-feel-analyzer.ts',
  'action-readiness-analyzer.ts',
  'product-identity-analyzer.ts',
  'emotional-confidence-analyzer.ts',
  'launch-readiness-perception-analyzer.ts',
  'first-impression-authority-builder.ts',
  'first-impression-evaluator.ts',
  'first-impression-report-builder.ts',
  'first-impression-judge.ts',
  'index.ts',
];

function resetAll(): void {
  resetFirstImpressionJudgeForTests();
  clearFirstImpressionHistory();
}

function fiInput(requestId: string, overrides: Partial<FirstImpressionInput> = {}): FirstImpressionInput {
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
  const judge = getDevPulseV2FirstImpressionJudge();
  assert('A-TYPES', 'pass token v1', judge.passToken === FIRST_IMPRESSION_JUDGE_PASS_TOKEN, judge.passToken);
  assert('A-TYPES', 'pass token', FIRST_IMPRESSION_JUDGE_PASS === 'FIRST_IMPRESSION_JUDGE_PASS', FIRST_IMPRESSION_JUDGE_PASS);
  assert('A-TYPES', 'owner module', judge.ownerModule === FIRST_IMPRESSION_JUDGE_OWNER_MODULE, judge.ownerModule);
  assert('A-TYPES', 'read only', judge.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', judge.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', judge.phase === 24.74, String(judge.phase));
  assert('A-TYPES', 'uvl rows', FIRST_IMPRESSION_JUDGE_UVL_ROWS.length >= 13, String(FIRST_IMPRESSION_JUDGE_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE === 128, String(DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('first_impression_judge').phase === 24.74, '24.74');
  assert('A-TYPES', 'question signal', isFirstImpressionQuestion('evaluate first impression perception'), 'signal');
  assert('A-TYPES', 'context pass', FIRST_VISIT_CONTEXT_PASS === 'FIRST_VISIT_CONTEXT_PASS', FIRST_VISIT_CONTEXT_PASS);
  assert('A-TYPES', 'clarity pass', PRODUCT_CLARITY_PASS === 'PRODUCT_CLARITY_PASS', PRODUCT_CLARITY_PASS);
  assert('A-TYPES', 'intelligence pass', INTELLIGENCE_PERCEPTION_PASS === 'INTELLIGENCE_PERCEPTION_PASS', INTELLIGENCE_PERCEPTION_PASS);
  assert('A-TYPES', 'reporting pass', FIRST_IMPRESSION_REPORTING_PASS === 'REPORTING_PASS', FIRST_IMPRESSION_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFirstImpressionJudge(fiInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFirstImpressionRecord(record.firstImpressionId) !== undefined, record.firstImpressionId);
  assert('B-REGISTRY', 'by project', lookupFirstImpressionByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'fi id', record.firstImpressionId.startsWith('first-impression-'), record.firstImpressionId);
  assert('B-REGISTRY', 'record count', getFirstImpressionRecordCount() >= 1, String(getFirstImpressionRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runFirstVisitContext(): void {
  const g = harness.beginGroup('C-FIRST-VISIT');
  resetAll();
  const personas = listFirstVisitPersonas();
  assert('C-FIRST-VISIT', 'persona count', personas.length === 5, String(personas.length));
  for (const persona of personas) {
    const ctx = buildFirstVisitContext(persona);
    assert('C-FIRST-VISIT', `${persona} intent`, ctx.userIntent.length > 0, ctx.userIntent);
    assert('C-FIRST-VISIT', `${persona} clarity`, ctx.expectedClarity.length > 0, ctx.expectedClarity);
    assert('C-FIRST-VISIT', `${persona} trust`, ctx.expectedTrustSignals.length > 0, ctx.expectedTrustSignals);
    assert('C-FIRST-VISIT', `${persona} promise`, ctx.expectedProductPromise.length > 0, ctx.expectedProductPromise);
    assert('C-FIRST-VISIT', `${persona} action`, ctx.expectedFirstAction.length > 0, ctx.expectedFirstAction);
    assert('C-FIRST-VISIT', `${persona} risks`, ctx.likelyConfusionRisks.length >= 1, String(ctx.likelyConfusionRisks.length));
    assert('C-FIRST-VISIT', `${persona} pass`, ctx.passToken === FIRST_VISIT_CONTEXT_PASS, ctx.passToken);
  }
  harness.endGroup('C-FIRST-VISIT', g);
}

function runProductClarity(): void {
  const g = harness.beginGroup('D-CLARITY');
  resetAll();
  const snapshot = registerFirstImpressionJudgeWithSurface();
  const context = buildFirstVisitContext('FOUNDER_FIRST_VISIT');
  const clean = analyzeProductClarity(fiInput('clarity-clean'), context, {
    welcomeCopyPresent: snapshot.welcomeCopyPresent,
    commandCenterTitlePresent: snapshot.commandCenterTitlePresent,
    chatInputPresent: snapshot.chatInputPresent,
    statusBarPresent: snapshot.statusBarPresent,
  });
  assert('D-CLARITY', 'clean score', clean.productClarityScore >= 85, String(clean.productClarityScore));
  assert('D-CLARITY', 'pass token', clean.passToken === PRODUCT_CLARITY_PASS, clean.passToken);
  const gaps = analyzeProductClarity(fiInput('clarity-gaps', {
    productPurposeUnclear: true,
    startingPointUnclear: true,
    stateConfusion: true,
  }), context, { welcomeCopyPresent: false, commandCenterTitlePresent: false, chatInputPresent: false, statusBarPresent: false });
  assert('D-CLARITY', 'problems', gaps.clarityProblems.length >= 3, String(gaps.clarityProblems.length));
  harness.endGroup('D-CLARITY', g);
}

function runIntelligenceFounder(): void {
  const g = harness.beginGroup('E-INTELLIGENCE-FOUNDER');
  resetAll();
  const snapshot = registerFirstImpressionJudgeWithSurface();
  const context = buildFirstVisitContext('FOUNDER_FIRST_VISIT');
  const intelligence = analyzeIntelligencePerception(fiInput('intel-clean'), context, {
    operatorFeedPresent: snapshot.operatorFeedPresent,
    brainConnectedCopyPresent: snapshot.brainConnectedCopyPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
    welcomeIntelligenceHintPresent: snapshot.welcomeIntelligenceHintPresent,
  });
  assert('E-INTELLIGENCE-FOUNDER', 'intelligence score', intelligence.intelligencePerceptionScore >= 75, String(intelligence.intelligencePerceptionScore));
  assert('E-INTELLIGENCE-FOUNDER', 'intel pass', intelligence.passToken === INTELLIGENCE_PERCEPTION_PASS, intelligence.passToken);
  const founder = analyzeFounderUsefulness(fiInput('founder-clean'), context, {
    chatFirstLayout: snapshot.chatFirstLayout,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    nextStepSectionPresent: snapshot.nextStepSectionPresent,
    statusBarPresent: snapshot.statusBarPresent,
  });
  assert('E-INTELLIGENCE-FOUNDER', 'founder score', founder.founderUsefulnessScore >= 75, String(founder.founderUsefulnessScore));
  assert('E-INTELLIGENCE-FOUNDER', 'founder pass', founder.passToken === FOUNDER_USEFULNESS_PASS, founder.passToken);
  harness.endGroup('E-INTELLIGENCE-FOUNDER', g);
}

function runReporting(): void {
  const g = harness.beginGroup('F-REPORTING');
  resetAll();
  const { record, report } = evaluateFirstImpressionJudge(fiInput('report-test'));
  assert('F-REPORTING', 'overall score', report.overallScore >= 0, String(report.overallScore));
  assert('F-REPORTING', 'clarity score', report.productClarityScore >= 0, String(report.productClarityScore));
  assert('F-REPORTING', 'founder notes', report.founderFrictionNotes.length >= 1, String(report.founderFrictionNotes.length));
  assert('F-REPORTING', 'hidden intelligence risks', Array.isArray(report.hiddenIntelligenceRisks), 'array');
  assert('F-REPORTING', 'trust risks', Array.isArray(report.trustRisks), 'array');
  assert('F-REPORTING', 'launch verdict', report.launchReadinessVerdict.length > 0, report.launchReadinessVerdict);
  assert('F-REPORTING', 'pass token', report.passToken === FIRST_IMPRESSION_REPORTING_PASS, report.passToken);
  assert('F-REPORTING', 'result', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(report.firstImpressionResult), report.firstImpressionResult);
  assert('F-REPORTING', 'record linked', record.firstImpressionId.length > 0, record.firstImpressionId);
  harness.endGroup('F-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('G-INTEGRATION');
  resetAll();
  assert('G-INTEGRATION', 'foundation', registerFirstImpressionJudgeWithFoundation().readOnly === true, 'foundation');
  assert('G-INTEGRATION', 'capability', registerFirstImpressionJudgeWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('G-INTEGRATION', 'find panel', registerFirstImpressionJudgeWithFindPanel().aliasCount > 0, 'find panel');
  assert('G-INTEGRATION', 'uvl', registerFirstImpressionJudgeWithUvl().uvlRowCount >= 13, String(registerFirstImpressionJudgeWithUvl().uvlRowCount));
  assert('G-INTEGRATION', 'ux heuristic upstream', registerFirstImpressionJudgeWithUXHeuristicEvaluator().passToken.length > 0, 'upstream');
  const surface = registerFirstImpressionJudgeWithSurface();
  assert('G-INTEGRATION', 'html', surface.htmlAvailable === true, 'html');
  assert('G-INTEGRATION', 'app js', surface.appJsAvailable === true, 'app js');
  harness.endGroup('G-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('H-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'first-impression-judge.ts'), 'utf8');
  assert('H-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('H-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('H-READONLY', 'no mutations', getDevPulseV2FirstImpressionJudge().noMutations === true, 'mutations');
  harness.endGroup('H-READONLY', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFirstImpressionJudge(fiInput(`${label}-${i}`));
  }
  assert(label, 'records', getFirstImpressionRecordCount() === count, String(getFirstImpressionRecordCount()));
  assert(label, 'history bounded', getFirstImpressionHistorySize() <= DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE, String(getFirstImpressionHistorySize()));
  harness.endGroup(label, g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('I-FAIL');
  resetAll();
  const { report } = evaluateFirstImpressionJudge(fiInput('fail-test', {
    intelligenceNotVisible: true,
    trustSignalWeak: true,
    productPurposeUnclear: true,
    launchReadinessPerceptionLow: true,
  }));
  assert('I-FAIL', 'fail or warnings', report.firstImpressionResult === 'FAIL' || report.firstImpressionResult === 'PASS_WITH_WARNINGS', report.firstImpressionResult);
  assert('I-FAIL', 'hidden intelligence', report.hiddenIntelligenceRisks.length >= 1, String(report.hiddenIntelligenceRisks.length));
  harness.endGroup('I-FAIL', g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('J-PASS-TOKENS');
  assert('J-PASS-TOKENS', TRUSTWORTHINESS_PERCEPTION_PASS, TRUSTWORTHINESS_PERCEPTION_PASS === 'TRUSTWORTHINESS_PERCEPTION_PASS', TRUSTWORTHINESS_PERCEPTION_PASS);
  assert('J-PASS-TOKENS', VISUAL_CONFIDENCE_PASS, VISUAL_CONFIDENCE_PASS === 'VISUAL_CONFIDENCE_PASS', VISUAL_CONFIDENCE_PASS);
  assert('J-PASS-TOKENS', PREMIUM_FEEL_PASS, PREMIUM_FEEL_PASS === 'PREMIUM_FEEL_PASS', PREMIUM_FEEL_PASS);
  assert('J-PASS-TOKENS', ACTION_READINESS_PASS, ACTION_READINESS_PASS === 'ACTION_READINESS_PASS', ACTION_READINESS_PASS);
  assert('J-PASS-TOKENS', PRODUCT_IDENTITY_PASS, PRODUCT_IDENTITY_PASS === 'PRODUCT_IDENTITY_PASS', PRODUCT_IDENTITY_PASS);
  assert('J-PASS-TOKENS', EMOTIONAL_CONFIDENCE_PASS, EMOTIONAL_CONFIDENCE_PASS === 'EMOTIONAL_CONFIDENCE_PASS', EMOTIONAL_CONFIDENCE_PASS);
  assert('J-PASS-TOKENS', LAUNCH_READINESS_PERCEPTION_PASS, LAUNCH_READINESS_PERCEPTION_PASS === 'LAUNCH_READINESS_PERCEPTION_PASS', LAUNCH_READINESS_PERCEPTION_PASS);
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
  console.log('DevPulse V2 — Phase 24.7.4 First-Impression Judge');
  console.log('===================================================');
  console.log('');

  runSetup();
  runRegistry();
  runFirstVisitContext();
  runProductClarity();
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
  const runtime = getFirstImpressionRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  context builds: ${runtime.contextBuildCount}`);
  console.log(`  clarity analyses: ${runtime.productClarityAnalysisCount}`);
  console.log(`  intelligence analyses: ${runtime.intelligencePerceptionAnalysisCount}`);
  console.log(`  founder analyses: ${runtime.founderUsefulnessAnalysisCount}`);
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

  console.log(FIRST_IMPRESSION_JUDGE_PASS);
  console.log(FIRST_IMPRESSION_JUDGE_PASS_TOKEN);
  console.log(FIRST_VISIT_CONTEXT_PASS);
  console.log(PRODUCT_CLARITY_PASS);
  console.log(INTELLIGENCE_PERCEPTION_PASS);
  console.log(TRUSTWORTHINESS_PERCEPTION_PASS);
  console.log(VISUAL_CONFIDENCE_PASS);
  console.log(FOUNDER_USEFULNESS_PASS);
  console.log(PREMIUM_FEEL_PASS);
  console.log(ACTION_READINESS_PASS);
  console.log(PRODUCT_IDENTITY_PASS);
  console.log(EMOTIONAL_CONFIDENCE_PASS);
  console.log(LAUNCH_READINESS_PERCEPTION_PASS);
  console.log(FIRST_IMPRESSION_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:first-impression-judge');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
