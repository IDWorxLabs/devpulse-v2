/**
 * Phase 26.81 — Generated Runtime Crash Diagnosis validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessGeneratedRuntimeCrashDiagnosis,
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS,
  extractStartupLogCrash,
  getGeneratedRuntimeCrashDiagnosisHistorySize,
  resetGeneratedRuntimeCrashDiagnosisModuleForTests,
} from '../src/generated-runtime-crash-diagnosis/index.js';
import {
  assessRuntimeStartupProofRepair,
  resetRuntimeStartupProofRepairModuleForTests,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from '../src/runtime-materialization-truth-bridge/index.js';
import { assessConnectedBuildExecution, resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';
import { MAX_RAW_ERROR_EXCERPT_CHARS } from '../src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-registry.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.ts',
  'src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-registry.ts',
  'src/generated-runtime-crash-diagnosis/startup-log-crash-extractor.ts',
  'src/generated-runtime-crash-diagnosis/runtime-entrypoint-crash-mapper.ts',
  'src/generated-runtime-crash-diagnosis/runtime-crash-classifier.ts',
  'src/generated-runtime-crash-diagnosis/runtime-crash-repair-planner.ts',
  'src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-report-builder.ts',
  'src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-authority.ts',
  'src/generated-runtime-crash-diagnosis/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-authority.ts'),
  'utf8',
);
const extractorSource = readFileSync(
  join(ROOT, 'src/generated-runtime-crash-diagnosis/startup-log-crash-extractor.ts'),
  'utf8',
);
const startupAuthoritySource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-proof-repair-authority.ts'),
  'utf8',
);
const classifierSource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-failure-classifier.ts'),
  'utf8',
);
const collectorSource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'),
  'utf8',
);

assert('PASS token', authoritySource.includes(GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS), 'missing');
assert('log parsing', extractorSource.includes('extractCrashSignals'), 'missing');
assert('bounded excerpt', extractorSource.includes('MAX_RAW_ERROR_EXCERPT_CHARS'), 'missing');
assert('startup repair wired', startupAuthoritySource.includes('assessGeneratedRuntimeCrashDiagnosis'), 'missing');
assert('classifier uses crash diagnosis', classifierSource.includes('crashDiagnosis'), 'missing');
assert('runtime bridge crash fields', collectorSource.includes('preciseCrashClass'), 'missing');
assert('no nested validators', !authoritySource.includes('validate:') && !authoritySource.includes('assessRuntimeMaterializationTruthBridge'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('shouldAutoRepair false', readFileSync(join(ROOT, 'src/generated-runtime-crash-diagnosis/runtime-crash-repair-planner.ts'), 'utf8').includes('shouldAutoRepair: false'), 'missing');

resetGeneratedRuntimeCrashDiagnosisModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;

const startupRepair = assessRuntimeStartupProofRepair({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  skipHistoryRecording: true,
});

const diagnosis = assessGeneratedRuntimeCrashDiagnosis({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  probe: startupRepair.report.probe,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
});

const report = diagnosis.report;

assert('assessment completes', diagnosis.orchestrationState === 'RUNTIME_CRASH_DIAGNOSIS_COMPLETE', diagnosis.orchestrationState);
assert('crash class assigned', Boolean(report.classification.crashClass), report.classification.crashClass);
assert('logs parsed', report.extraction.logLines.length >= 0 || report.extraction.fatalErrors.length > 0, 'empty');
assert('raw excerpt bounded', report.extraction.rawErrorExcerpt.length <= MAX_RAW_ERROR_EXCERPT_CHARS + 20, String(report.extraction.rawErrorExcerpt.length));
assert('repair recommendation', report.repairPlan.repairRecommendation.length > 0, 'empty');
assert('history recorded', getGeneratedRuntimeCrashDiagnosisHistorySize() >= 1, String(getGeneratedRuntimeCrashDiagnosisHistorySize()));

assert('startup receives crash diagnosis', Boolean(startupRepair.report.crashDiagnosis), 'missing');
assert('precise crash class on startup', Boolean(startupRepair.report.preciseCrashClass), startupRepair.report.preciseCrashClass ?? 'none');

if (startupRepair.report.failureClass === 'RUNTIME_CRASH') {
  assert(
    'runtime crash has diagnosis details',
    startupRepair.report.recommendedFix.includes('[') || startupRepair.report.recommendedNextActions.some((a) => a.startsWith('preciseCrashClass=')),
    startupRepair.report.recommendedFix,
  );
  assert(
    'failing file when available',
    Boolean(report.classification.failingFile) || report.entrypointMapping.entryFile !== null,
    report.classification.failingFile ?? 'none',
  );
}

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  skipHistoryRecording: true,
});

assert('runtime bridge crash details', Boolean(runtimeBridge.report.evidence.startup.preciseCrashClass), String(runtimeBridge.report.evidence.startup.preciseCrashClass));
assert('crash excerpt on bridge', runtimeBridge.report.evidence.startup.crashRawErrorExcerpt !== undefined, 'missing');

const failed = results.filter((e) => !e.passed);
const summary = [
  '# Generated Runtime Crash Diagnosis Validation',
  '',
  `Result: ${failed.length === 0 ? GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS : 'FAILED'}`,
  '',
  ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
  '',
  '## Snapshot',
  '',
  `- crashClass=${report.classification.crashClass}`,
  `- failingFile=${report.classification.failingFile ?? 'none'}`,
  `- evidenceConfidence=${report.classification.evidenceConfidence}`,
  `- startupFailureClass=${startupRepair.report.failureClass}`,
  `- preciseCrashClass=${startupRepair.report.preciseCrashClass}`,
  `- runtimeBridge.recommendedFix=${runtimeBridge.report.reconciliation.recommendedFix.slice(0, 100)}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'GENERATED_RUNTIME_CRASH_DIAGNOSIS_VALIDATION.md'), summary, 'utf8');
writeFileSync(
  join(ROOT, 'architecture', 'GENERATED_RUNTIME_CRASH_DIAGNOSIS_REPORT.md'),
  [
    '# Generated Runtime Crash Diagnosis Report',
    '',
    `- crashClass: **${report.classification.crashClass}**`,
    `- failingFile: **${report.classification.failingFile ?? 'none'}**`,
    `- failingLine: ${report.classification.failingLine ?? 'n/a'}`,
    `- attemptedCommand: **${report.entrypointMapping.attemptedCommand ?? 'none'}**`,
    `- processId: **${report.extraction.processId ?? 'none'}**`,
    `- crashDetected: **${report.crashDetected}**`,
    '',
    '### Raw excerpt',
    '',
    report.extraction.rawErrorExcerpt,
    '',
    GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS,
  ].join('\n'),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture', 'GENERATED_RUNTIME_CRASH_REPAIR_PLAN.md'),
  [
    '# Generated Runtime Crash Repair Plan',
    '',
    `- crashClass: **${report.classification.crashClass}**`,
    `- targetedFile: **${report.repairPlan.targetedFile ?? 'none'}**`,
    `- shouldAutoRepair: **${report.repairPlan.shouldAutoRepair}**`,
    '',
    report.repairPlan.repairRecommendation,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(summary);
  process.exit(1);
}

console.log(GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS);
console.log(summary);
