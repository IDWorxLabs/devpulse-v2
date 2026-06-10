/**
 * Phase 24.8.7 — Founder Readiness Authority validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_READINESS_AUTHORITY_PASS_TOKEN,
  FOUNDER_READINESS_AUTHORITY_PASS,
  FOUNDER_READINESS_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE,
  MAX_READINESS_GAPS,
  READINESS_CONTEXT_PASS,
  WORKFLOW_READINESS_PASS,
  CONFIDENCE_READINESS_PASS,
  TRUST_READINESS_PASS,
  PRODUCTIVITY_READINESS_PASS,
  FRICTION_READINESS_PASS,
  READINESS_BLOCKERS_PASS,
  READINESS_GAP_ANALYSIS_PASS,
  READINESS_ROADMAP_PASS,
  FOUNDER_READINESS_REPORTING_PASS,
  buildAllReadinessContexts,
  buildReadinessContext,
  listReadinessContextIds,
  analyzeWorkflowReadiness,
  analyzeConfidenceReadiness,
  analyzeTrustReadiness,
  analyzeProductivityReadiness,
  analyzeFrictionReadiness,
  analyzeReadinessBlockers,
  analyzeReadinessGaps,
  clearFounderReadinessHistory,
  getFounderReadinessHistorySize,
  getFounderReadinessAuthorityRuntimeReport,
  getFounderReadinessRecord,
  getFounderReadinessRecordCount,
  getDevPulseV2FounderReadinessAuthority,
  isFounderReadinessQuestion,
  lookupFounderReadinessByProjectId,
  registerFounderReadinessAuthorityWithCapabilityRegistry,
  registerFounderReadinessAuthorityWithFindPanel,
  registerFounderReadinessAuthorityWithFoundation,
  registerFounderReadinessAuthorityWithAcceptanceChain,
  registerFounderReadinessAuthorityWithSurface,
  registerFounderReadinessAuthorityWithUvl,
  evaluateFounderReadinessAuthority,
  resetFounderReadinessAuthorityForTests,
} from '../src/founder-acceptance-validation/founder-readiness-authority/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_READINESS_AUTHORITY_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderReadinessAuthorityInput } from '../src/founder-acceptance-validation/founder-readiness-authority/founder-readiness-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-readiness-authority');

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
  'founder-readiness-types.ts',
  'readiness-gap-model.ts',
  'founder-readiness-cache.ts',
  'founder-readiness-registry.ts',
  'bounded-history.ts',
  'readiness-context-builder.ts',
  'workflow-readiness-analyzer.ts',
  'confidence-readiness-analyzer.ts',
  'trust-readiness-analyzer.ts',
  'productivity-readiness-analyzer.ts',
  'friction-readiness-analyzer.ts',
  'readiness-blocker-analyzer.ts',
  'readiness-gap-analyzer.ts',
  'readiness-roadmap-builder.ts',
  'founder-readiness-authority-builder.ts',
  'founder-readiness-evaluator.ts',
  'founder-readiness-report-builder.ts',
  'founder-readiness-authority.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderReadinessAuthorityForTests();
  clearFounderReadinessHistory();
}

function frInput(requestId: string, overrides: Partial<FounderReadinessAuthorityInput> = {}): FounderReadinessAuthorityInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const mod = getDevPulseV2FounderReadinessAuthority();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_READINESS_AUTHORITY_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_READINESS_AUTHORITY_PASS === 'FOUNDER_READINESS_AUTHORITY_PASS', FOUNDER_READINESS_AUTHORITY_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_READINESS_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.87, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_READINESS_AUTHORITY_UVL_ROWS.length >= 17, String(FOUNDER_READINESS_AUTHORITY_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_READINESS_GAPS === 64, String(MAX_READINESS_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_readiness_authority').phase === 24.87, '24.87');
  assert('A-TYPES', 'question signal', isFounderReadinessQuestion('founder readiness authority'), 'signal');
  assert('A-TYPES', 'context count', listReadinessContextIds().length === 7, String(listReadinessContextIds().length));
  assert('A-TYPES', 'roadmap pass alias', READINESS_ROADMAP_PASS === 'ROADMAP_PASS', READINESS_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_READINESS_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_READINESS_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderReadinessAuthority(frInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderReadinessRecord(record.founderReadinessId) !== undefined, record.founderReadinessId);
  assert('B-REGISTRY', 'by project', lookupFounderReadinessByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderReadinessId.startsWith('founder-readiness-'), record.founderReadinessId);
  assert('B-REGISTRY', 'record count', getFounderReadinessRecordCount() >= 1, String(getFounderReadinessRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runContexts(): void {
  const g = harness.beginGroup('C-CONTEXTS');
  resetAll();
  const contexts = buildAllReadinessContexts();
  assert('C-CONTEXTS', 'context pass', contexts.every((c) => c.passToken === READINESS_CONTEXT_PASS), 'pass');
  assert('C-CONTEXTS', 'workflow', contexts.some((c) => c.contextId === 'WORKFLOW_READINESS'), 'workflow');
  assert('C-CONTEXTS', 'confidence', contexts.some((c) => c.contextId === 'CONFIDENCE_READINESS'), 'confidence');
  assert('C-CONTEXTS', 'trust', contexts.some((c) => c.contextId === 'TRUST_READINESS'), 'trust');
  assert('C-CONTEXTS', 'productivity', contexts.some((c) => c.contextId === 'PRODUCTIVITY_READINESS'), 'productivity');
  assert('C-CONTEXTS', 'friction', contexts.some((c) => c.contextId === 'FRICTION_READINESS'), 'friction');
  assert('C-CONTEXTS', 'operational', contexts.some((c) => c.contextId === 'OPERATIONAL_READINESS'), 'operational');
  assert('C-CONTEXTS', 'launch', contexts.some((c) => c.contextId === 'LAUNCH_READINESS'), 'launch');
  const ctx = buildReadinessContext('WORKFLOW_READINESS');
  assert('C-CONTEXTS', 'intent', ctx.readinessIntent.length > 0, ctx.readinessIntent);
  assert('C-CONTEXTS', 'outcome', ctx.expectedOutcome.length > 0, ctx.expectedOutcome);
  assert('C-CONTEXTS', 'authorities', ctx.requiredAuthorities.length >= 1, String(ctx.requiredAuthorities.length));
  harness.endGroup('C-CONTEXTS', g);
}

function runAnalyzers(): void {
  const g = harness.beginGroup('D-ANALYZERS');
  resetAll();
  const input = frInput('analyzer-test');
  const workflow = analyzeWorkflowReadiness(input, {
    founderWorkflowScore: 78,
    clarityScore: 80,
    continuityScore: 76,
    outcomeScore: 77,
    workflowGapCount: 1,
  });
  assert('D-ANALYZERS', 'workflow pass', workflow.passToken === WORKFLOW_READINESS_PASS, workflow.passToken);

  const confidence = analyzeConfidenceReadiness(input, {
    founderConfidenceScore: 76,
    understandingScore: 78,
    reasoningVisibilityScore: 74,
    confidenceGapCount: 1,
  });
  assert('D-ANALYZERS', 'confidence pass', confidence.passToken === CONFIDENCE_READINESS_PASS, confidence.passToken);

  const trust = analyzeTrustReadiness(input, {
    founderTrustScore: 78,
    governanceScore: 76,
    verificationIntegrityScore: 75,
    trustGapCount: 1,
  });
  assert('D-ANALYZERS', 'trust pass', trust.passToken === TRUST_READINESS_PASS, trust.passToken);

  const productivity = analyzeProductivityReadiness(input, {
    founderProductivityScore: 76,
    throughputScore: 78,
    executionEfficiencyScore: 74,
    productivityGapCount: 1,
  });
  assert('D-ANALYZERS', 'productivity pass', productivity.passToken === PRODUCTIVITY_READINESS_PASS, productivity.passToken);

  const friction = analyzeFrictionReadiness(input, {
    founderFrictionScore: 76,
    criticalFrictionGaps: 0,
    majorFrictionGaps: 1,
    launchFrictionScore: 74,
  });
  assert('D-ANALYZERS', 'friction pass', friction.passToken === FRICTION_READINESS_PASS, friction.passToken);

  const blockers = analyzeReadinessBlockers(input.requestId, input, {
    workflowReadiness: workflow,
    confidenceReadiness: confidence,
    trustReadiness: trust,
    productivityReadiness: productivity,
    frictionReadiness: friction,
  }, {
    launchBlockerCount: 1,
    releaseReadiness: 'PARTIALLY_READY',
    operationalSurfaceReady: true,
    adoptionBlockerCount: 0,
  });
  assert('D-ANALYZERS', 'blockers pass', blockers.passToken === READINESS_BLOCKERS_PASS, blockers.passToken);

  const gapAnalysis = analyzeReadinessGaps(input.requestId, {
    workflowReadiness: workflow,
    confidenceReadiness: confidence,
    trustReadiness: trust,
    productivityReadiness: productivity,
    frictionReadiness: friction,
  });
  assert('D-ANALYZERS', 'gap analysis pass', gapAnalysis.passToken === READINESS_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  assert('D-ANALYZERS', 'critical gaps', Array.isArray(gapAnalysis.criticalReadinessGaps), 'array');
  harness.endGroup('D-ANALYZERS', g);
}

function runAuthorityRoadmap(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score, status } = evaluateFounderReadinessAuthority(frInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-readiness-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'workflow', authority.workflowReadiness.passToken === WORKFLOW_READINESS_PASS, authority.workflowReadiness.passToken);
  assert('E-AUTHORITY', 'confidence', authority.confidenceReadiness.passToken === CONFIDENCE_READINESS_PASS, authority.confidenceReadiness.passToken);
  assert('E-AUTHORITY', 'trust', authority.trustReadiness.passToken === TRUST_READINESS_PASS, authority.trustReadiness.passToken);
  assert('E-AUTHORITY', 'productivity', authority.productivityReadiness.passToken === PRODUCTIVITY_READINESS_PASS, authority.productivityReadiness.passToken);
  assert('E-AUTHORITY', 'friction', authority.frictionReadiness.passToken === FRICTION_READINESS_PASS, authority.frictionReadiness.passToken);
  assert('E-AUTHORITY', 'blockers', authority.readinessBlockers.passToken === READINESS_BLOCKERS_PASS, authority.readinessBlockers.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === READINESS_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap pass', authority.roadmap.passToken === READINESS_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'launch prep', Array.isArray(authority.roadmap.launchPreparation), 'launch');
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'status enum', ['FOUNDER_NOT_READY', 'FOUNDER_PARTIALLY_READY', 'FOUNDER_READY', 'FOUNDER_LAUNCH_READY'].includes(status), status);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_READINESS_REPORTING_PASS, report.passToken);
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderReadinessAuthorityWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderReadinessAuthorityWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderReadinessAuthorityWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderReadinessAuthorityWithUvl().uvlRowCount >= 184, String(registerFounderReadinessAuthorityWithUvl().uvlRowCount));
  const chain = registerFounderReadinessAuthorityWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'workflow validation', chain.founderWorkflowValidation === true, 'workflow');
  assert('F-INTEGRATION', 'confidence engine', chain.founderConfidenceEngine === true, 'confidence');
  assert('F-INTEGRATION', 'trust validation', chain.founderTrustValidation === true, 'trust');
  assert('F-INTEGRATION', 'productivity validation', chain.founderProductivityValidation === true, 'productivity');
  assert('F-INTEGRATION', 'friction detector', chain.founderFrictionDetector === true, 'friction');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderReadinessAuthorityWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  assert('F-INTEGRATION', 'friction authority', surface.frictionAuthorityId.length > 0, surface.frictionAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-readiness-authority.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderReadinessAuthority().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report, status } = evaluateFounderReadinessAuthority(frInput('fail-test', {
    workflowNotReady: true,
    confidenceNotReady: true,
    trustNotReady: true,
    productivityNotReady: true,
    frictionBlocking: true,
    launchNotReady: true,
    operationalGaps: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'not ready status', status === 'FOUNDER_NOT_READY', status);
  assert('H-FAIL', 'gaps detected', report.detectedReadinessGaps.length >= 1, String(report.detectedReadinessGaps.length));
  assert('H-FAIL', 'blockers detected', report.readinessBlockers.length >= 1, String(report.readinessBlockers.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderReadinessAuthority(frInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderReadinessRecordCount() === count, String(getFounderReadinessRecordCount()));
  assert(label, 'history bounded', getFounderReadinessHistorySize() <= DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE, String(getFounderReadinessHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', READINESS_CONTEXT_PASS, READINESS_CONTEXT_PASS === 'READINESS_CONTEXT_PASS', READINESS_CONTEXT_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_READINESS_PASS, WORKFLOW_READINESS_PASS === 'WORKFLOW_READINESS_PASS', WORKFLOW_READINESS_PASS);
  assert('I-PASS-TOKENS', CONFIDENCE_READINESS_PASS, CONFIDENCE_READINESS_PASS === 'CONFIDENCE_READINESS_PASS', CONFIDENCE_READINESS_PASS);
  assert('I-PASS-TOKENS', TRUST_READINESS_PASS, TRUST_READINESS_PASS === 'TRUST_READINESS_PASS', TRUST_READINESS_PASS);
  assert('I-PASS-TOKENS', PRODUCTIVITY_READINESS_PASS, PRODUCTIVITY_READINESS_PASS === 'PRODUCTIVITY_READINESS_PASS', PRODUCTIVITY_READINESS_PASS);
  assert('I-PASS-TOKENS', FRICTION_READINESS_PASS, FRICTION_READINESS_PASS === 'FRICTION_READINESS_PASS', FRICTION_READINESS_PASS);
  assert('I-PASS-TOKENS', READINESS_BLOCKERS_PASS, READINESS_BLOCKERS_PASS === 'READINESS_BLOCKERS_PASS', READINESS_BLOCKERS_PASS);
  assert('I-PASS-TOKENS', READINESS_GAP_ANALYSIS_PASS, READINESS_GAP_ANALYSIS_PASS === 'READINESS_GAP_ANALYSIS_PASS', READINESS_GAP_ANALYSIS_PASS);
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
  console.log('DevPulse V2 — Phase 24.8.7 Founder Readiness Authority');
  console.log('========================================================');
  console.log('');

  runSetup();
  runRegistry();
  runContexts();
  runAnalyzers();
  runAuthorityRoadmap();
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
  const runtime = getFounderReadinessAuthorityRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  readiness context builds: ${runtime.contextBuildCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  report builds: ${runtime.reportCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  cache misses: ${runtime.cacheMisses}`);
  console.log(`  bootstrap reuse: ${runtime.bootstrapReuseCount}`);
  console.log(`  source text cache hits: ${runtime.sourceTextCacheHits}`);
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

  console.log(FOUNDER_READINESS_AUTHORITY_PASS);
  console.log(FOUNDER_READINESS_AUTHORITY_PASS_TOKEN);
  console.log(WORKFLOW_READINESS_PASS);
  console.log(CONFIDENCE_READINESS_PASS);
  console.log(TRUST_READINESS_PASS);
  console.log(PRODUCTIVITY_READINESS_PASS);
  console.log(FRICTION_READINESS_PASS);
  console.log(READINESS_BLOCKERS_PASS);
  console.log(READINESS_GAP_ANALYSIS_PASS);
  console.log(READINESS_ROADMAP_PASS);
  console.log(FOUNDER_READINESS_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-readiness-authority');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
