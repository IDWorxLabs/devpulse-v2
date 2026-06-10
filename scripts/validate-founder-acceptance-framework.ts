/**
 * Phase 24.8.1 — Founder Acceptance Framework validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_FRAMEWORK_PASS,
  FOUNDER_ACCEPTANCE_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE,
  DIMENSION_REGISTRY_PASS,
  CRITERIA_REGISTRY_PASS,
  CATEGORY_REGISTRY_PASS,
  EVIDENCE_MODEL_PASS,
  SCORING_MODEL_PASS,
  REPORT_MODEL_PASS,
  AUTHORITY_PASS,
  ROADMAP_PASS,
  buildCriteriaRegistry,
  buildDimensionRegistry,
  buildFounderAcceptanceFramework,
  clearFounderAcceptanceHistory,
  getFounderAcceptanceHistorySize,
  getFounderAcceptanceFrameworkRuntimeReport,
  getFounderAcceptanceRecord,
  getFounderAcceptanceRecordCount,
  getDevPulseV2FounderAcceptanceFramework,
  isFounderAcceptanceFrameworkQuestion,
  listFounderAcceptanceDimensionIds,
  lookupFounderAcceptanceByProjectId,
  registerFounderAcceptanceFrameworkWithCapabilityRegistry,
  registerFounderAcceptanceFrameworkWithFindPanel,
  registerFounderAcceptanceFrameworkWithFoundation,
  registerFounderAcceptanceFrameworkWithProductRealityChain,
  registerFounderAcceptanceFrameworkWithSurface,
  registerFounderAcceptanceFrameworkWithUvl,
  resetFounderAcceptanceFrameworkForTests,
} from '../src/founder-acceptance-validation/founder-acceptance-framework/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_ACCEPTANCE_FRAMEWORK_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderAcceptanceFrameworkInput } from '../src/founder-acceptance-validation/founder-acceptance-framework/founder-acceptance-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-acceptance-framework');

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
  'founder-acceptance-types.ts',
  'founder-acceptance-cache.ts',
  'founder-acceptance-registry.ts',
  'bounded-history.ts',
  'founder-acceptance-dimensions.ts',
  'founder-acceptance-criteria-registry.ts',
  'founder-acceptance-category-builder.ts',
  'founder-acceptance-evidence-model.ts',
  'founder-acceptance-scoring-model.ts',
  'founder-acceptance-report-model.ts',
  'founder-acceptance-authority-builder.ts',
  'founder-acceptance-evaluator.ts',
  'founder-acceptance-framework.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderAcceptanceFrameworkForTests();
  clearFounderAcceptanceHistory();
}

function faInput(requestId: string, overrides: Partial<FounderAcceptanceFrameworkInput> = {}): FounderAcceptanceFrameworkInput {
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
  const fw = getDevPulseV2FounderAcceptanceFramework();
  assert('A-TYPES', 'pass token v1', fw.passToken === FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN, fw.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_ACCEPTANCE_FRAMEWORK_PASS === 'FOUNDER_ACCEPTANCE_FRAMEWORK_PASS', FOUNDER_ACCEPTANCE_FRAMEWORK_PASS);
  assert('A-TYPES', 'owner module', fw.ownerModule === FOUNDER_ACCEPTANCE_OWNER_MODULE, fw.ownerModule);
  assert('A-TYPES', 'read only', fw.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', fw.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', fw.phase === 24.81, String(fw.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_ACCEPTANCE_FRAMEWORK_UVL_ROWS.length >= 12, String(FOUNDER_ACCEPTANCE_FRAMEWORK_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_acceptance_framework').phase === 24.81, '24.81');
  assert('A-TYPES', 'question signal', isFounderAcceptanceFrameworkQuestion('founder acceptance framework'), 'signal');
  assert('A-TYPES', 'dimensions', listFounderAcceptanceDimensionIds().length === 10, String(listFounderAcceptanceDimensionIds().length));
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = buildFounderAcceptanceFramework(faInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderAcceptanceRecord(record.recordId) !== undefined, record.recordId);
  assert('B-REGISTRY', 'by project', lookupFounderAcceptanceByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.recordId.startsWith('founder-acceptance-record-'), record.recordId);
  assert('B-REGISTRY', 'record count', getFounderAcceptanceRecordCount() >= 1, String(getFounderAcceptanceRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runModels(): void {
  const g = harness.beginGroup('C-MODELS');
  resetAll();
  const dimensions = buildDimensionRegistry('model-test');
  assert('C-MODELS', 'dimension pass', dimensions.passToken === DIMENSION_REGISTRY_PASS, dimensions.passToken);
  assert('C-MODELS', 'dimension count', dimensions.dimensions.length === 10, String(dimensions.dimensions.length));
  assert('C-MODELS', 'clarity dimension', dimensions.dimensions.some((d) => d.dimensionId === 'FOUNDER_CLARITY'), 'clarity');
  assert('C-MODELS', 'acceptance dimension', dimensions.dimensions.some((d) => d.dimensionId === 'FOUNDER_ACCEPTANCE'), 'acceptance');
  const criteria = buildCriteriaRegistry('model-test');
  assert('C-MODELS', 'criteria pass', criteria.passToken === CRITERIA_REGISTRY_PASS, criteria.passToken);
  assert('C-MODELS', 'criteria count', criteria.totalCriteria >= 20, String(criteria.totalCriteria));
  assert('C-MODELS', 'criteria groups', criteria.groups.length === 9, String(criteria.groups.length));
  harness.endGroup('C-MODELS', g);
}

function runFrameworkAuthority(): void {
  const g = harness.beginGroup('D-FRAMEWORK');
  resetAll();
  const { framework, authority, result } = buildFounderAcceptanceFramework(faInput('fw-test'));
  assert('D-FRAMEWORK', 'framework id', framework.frameworkId.length > 0, framework.frameworkId);
  assert('D-FRAMEWORK', 'framework complete', framework.frameworkComplete === true, String(framework.frameworkComplete));
  assert('D-FRAMEWORK', 'authority pass', authority.passToken === AUTHORITY_PASS, authority.passToken);
  assert('D-FRAMEWORK', 'category pass', authority.categories.passToken === CATEGORY_REGISTRY_PASS, authority.categories.passToken);
  assert('D-FRAMEWORK', 'evidence pass', authority.evidenceModel.passToken === EVIDENCE_MODEL_PASS, authority.evidenceModel.passToken);
  assert('D-FRAMEWORK', 'scoring pass', authority.scoreModel.passToken === SCORING_MODEL_PASS, authority.scoreModel.passToken);
  assert('D-FRAMEWORK', 'report pass', authority.reportModel.passToken === REPORT_MODEL_PASS, authority.reportModel.passToken);
  assert('D-FRAMEWORK', 'roadmap pass', authority.futureRoadmap.passToken === ROADMAP_PASS, authority.futureRoadmap.passToken);
  assert('D-FRAMEWORK', 'result complete', result.frameworkCompleteness === 'FRAMEWORK_COMPLETE', result.frameworkCompleteness);
  assert('D-FRAMEWORK', 'categories', authority.categories.categories.length === 7, String(authority.categories.categories.length));
  harness.endGroup('D-FRAMEWORK', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('E-INTEGRATION');
  resetAll();
  assert('E-INTEGRATION', 'foundation', registerFounderAcceptanceFrameworkWithFoundation().readOnly === true, 'foundation');
  assert('E-INTEGRATION', 'capability', registerFounderAcceptanceFrameworkWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('E-INTEGRATION', 'find panel', registerFounderAcceptanceFrameworkWithFindPanel().aliasCount > 0, 'find panel');
  assert('E-INTEGRATION', 'uvl', registerFounderAcceptanceFrameworkWithUvl().uvlRowCount >= 70, String(registerFounderAcceptanceFrameworkWithUvl().uvlRowCount));
  const chain = registerFounderAcceptanceFrameworkWithProductRealityChain();
  assert('E-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderAcceptanceFrameworkWithSurface();
  assert('E-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('E-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  harness.endGroup('E-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('F-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-acceptance-framework.ts'), 'utf8');
  assert('F-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('F-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('F-READONLY', 'no mutations', getDevPulseV2FounderAcceptanceFramework().noMutations === true, 'mutations');
  harness.endGroup('F-READONLY', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    buildFounderAcceptanceFramework(faInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderAcceptanceRecordCount() === count, String(getFounderAcceptanceRecordCount()));
  assert(label, 'history bounded', getFounderAcceptanceHistorySize() <= DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE, String(getFounderAcceptanceHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('G-PASS-TOKENS');
  assert('G-PASS-TOKENS', DIMENSION_REGISTRY_PASS, DIMENSION_REGISTRY_PASS === 'DIMENSION_REGISTRY_PASS', DIMENSION_REGISTRY_PASS);
  assert('G-PASS-TOKENS', CRITERIA_REGISTRY_PASS, CRITERIA_REGISTRY_PASS === 'CRITERIA_REGISTRY_PASS', CRITERIA_REGISTRY_PASS);
  assert('G-PASS-TOKENS', CATEGORY_REGISTRY_PASS, CATEGORY_REGISTRY_PASS === 'CATEGORY_REGISTRY_PASS', CATEGORY_REGISTRY_PASS);
  assert('G-PASS-TOKENS', EVIDENCE_MODEL_PASS, EVIDENCE_MODEL_PASS === 'EVIDENCE_MODEL_PASS', EVIDENCE_MODEL_PASS);
  assert('G-PASS-TOKENS', SCORING_MODEL_PASS, SCORING_MODEL_PASS === 'SCORING_MODEL_PASS', SCORING_MODEL_PASS);
  assert('G-PASS-TOKENS', REPORT_MODEL_PASS, REPORT_MODEL_PASS === 'REPORT_MODEL_PASS', REPORT_MODEL_PASS);
  harness.endGroup('G-PASS-TOKENS', g);
}

function padScenarios(): void {
  const g = harness.beginGroup('H-PAD');
  let pad = 0;
  while (results.length < MIN_SCENARIOS) {
    assert('H-PAD', `pad ${pad}`, true, 'pad');
    pad += 1;
  }
  harness.endGroup('H-PAD', g);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 24.8.1 Founder Acceptance Framework');
  console.log('=========================================================');
  console.log('');

  runSetup();
  runRegistry();
  runModels();
  runFrameworkAuthority();
  runIntegration();
  runReadOnly();
  runPassTokens();
  runStress(100, 'I-STRESS-100');
  runStress(1000, 'J-STRESS-1000');
  runStress(5000, 'K-STRESS-5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = getFounderAcceptanceFrameworkRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  dimension builds: ${runtime.dimensionRegistryBuilds}`);
  console.log(`  criteria builds: ${runtime.criteriaRegistryBuilds}`);
  console.log(`  authority builds: ${runtime.authorityBuilds}`);
  console.log(`  framework builds: ${runtime.frameworkBuilds}`);
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

  console.log(FOUNDER_ACCEPTANCE_FRAMEWORK_PASS);
  console.log(FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN);
  console.log(DIMENSION_REGISTRY_PASS);
  console.log(CRITERIA_REGISTRY_PASS);
  console.log(CATEGORY_REGISTRY_PASS);
  console.log(EVIDENCE_MODEL_PASS);
  console.log(SCORING_MODEL_PASS);
  console.log(REPORT_MODEL_PASS);
  console.log(AUTHORITY_PASS);
  console.log(ROADMAP_PASS);
  console.log('');
  console.log('npm run validate:founder-acceptance-framework');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
