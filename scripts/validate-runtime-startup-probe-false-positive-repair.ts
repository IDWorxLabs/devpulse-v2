/**
 * Phase 26.82 — Runtime Startup Probe False-Positive Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessConnectedBuildExecution, resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
import {
  assessGeneratedRuntimeCrashDiagnosis,
  resetGeneratedRuntimeCrashDiagnosisModuleForTests,
} from '../src/generated-runtime-crash-diagnosis/index.js';
import {
  assessRuntimeStartupProofRepair,
  isSuccessfulHealthResponse,
  reconcileStartupProbeVerdict,
  resetRuntimeStartupProofRepairModuleForTests,
  RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from '../src/runtime-materialization-truth-bridge/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';

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

const probeSource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-probe.mjs'),
  'utf8',
);
const processProbeSource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-process-probe.ts'),
  'utf8',
);
const classifierSource = readFileSync(
  join(ROOT, 'src/generated-runtime-crash-diagnosis/runtime-crash-classifier.ts'),
  'utf8',
);

assert('PASS token in registry', readFileSync(join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-proof-repair-registry.ts'), 'utf8').includes(RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS), 'missing');
assert('health success override in probe', probeSource.includes('healthSuccess'), 'missing');
assert('numeric exitCode check', probeSource.includes('typeof ready.exitCode'), 'missing');
assert('reconcileStartupProbeVerdict', processProbeSource.includes('reconcileStartupProbeVerdict'), 'missing');
assert('crash NONE class', classifierSource.includes("crashClass: 'NONE'"), 'missing');
assert('no loose port.*in use', !probeSource.includes('port.*in use'), 'still loose');

const reconciled = reconcileStartupProbeVerdict({
  processStarted: true,
  portBound: true,
  healthResponded: true,
  firstResponseStatus: 200,
  timedOut: false,
  fatalErrors: ['RUNTIME_CRASH exitCode=undefined', 'PORT_CONFLICT detected in startup logs'],
  applicationBoots: false,
});

assert('HTTP 200 sets applicationBoots=true', reconciled.applicationBoots === true, String(reconciled.applicationBoots));
assert('fatalErrors suppressed on health success', !reconciled.fatalErrors?.some((e) => e.includes('RUNTIME_CRASH')), String(reconciled.fatalErrors));
assert('PORT_CONFLICT suppressed when health ok', !reconciled.fatalErrors?.some((e) => e.startsWith('PORT_CONFLICT')), String(reconciled.fatalErrors));
assert('isSuccessfulHealthResponse 200', isSuccessfulHealthResponse(200), 'false');
assert('undefined exitCode not success alone', !isSuccessfulHealthResponse(undefined as unknown as number), 'true');

resetRuntimeStartupProofRepairModuleForTests();
resetGeneratedRuntimeCrashDiagnosisModuleForTests();
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

const probe = startupRepair.report.probe;

assert('live probe applicationBoots=true', probe.applicationBoots === true, String(probe.applicationBoots));
assert('startupFailureClass=NONE', startupRepair.report.failureClass === 'NONE', startupRepair.report.failureClass);
assert('cleanupStatus=CLEANED ok', probe.cleanupStatus === 'CLEANED', probe.cleanupStatus);
assert('healthResponded true', probe.healthResponded === true, String(probe.healthResponded));
assert('firstResponseStatus 2xx', isSuccessfulHealthResponse(probe.firstResponseStatus), String(probe.firstResponseStatus));
assert('preciseCrashClass=NONE', startupRepair.report.preciseCrashClass === 'NONE', String(startupRepair.report.preciseCrashClass));

const crashDiagnosis = assessGeneratedRuntimeCrashDiagnosis({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  probe,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

assert(
  'crash diagnosis not PROCESS_EXITED_EARLY on health success',
  crashDiagnosis.report.classification.crashClass !== 'PROCESS_EXITED_EARLY',
  crashDiagnosis.report.classification.crashClass,
);
assert('crashDetected false on boot', crashDiagnosis.report.crashDetected === false, String(crashDiagnosis.report.crashDetected));

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  skipHistoryRecording: true,
});

assert(
  'runtime bridge beyond STARTUP',
  runtimeBridge.report.reconciliation.failureBoundary !== 'STARTUP',
  runtimeBridge.report.reconciliation.failureBoundary,
);
assert(
  'rootCause not RUNTIME_START_FAILURE',
  runtimeBridge.report.reconciliation.rootCause !== 'RUNTIME_START_FAILURE',
  runtimeBridge.report.reconciliation.rootCause,
);
assert(
  'bridge applicationBoots true',
  runtimeBridge.report.evidence.proofAnalysis.applicationBoots === true,
  String(runtimeBridge.report.evidence.proofAnalysis.applicationBoots),
);

const failed = results.filter((e) => !e.passed);
const summary = [
  '# Runtime Startup Probe False-Positive Repair Validation',
  '',
  `Result: ${failed.length === 0 ? RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS : 'FAILED'}`,
  '',
  ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
  '',
  '## Snapshot',
  '',
  `- applicationBoots=${probe.applicationBoots}`,
  `- failureClass=${startupRepair.report.failureClass}`,
  `- preciseCrashClass=${startupRepair.report.preciseCrashClass}`,
  `- fatalErrors=${probe.fatalErrors.join('; ') || 'none'}`,
  `- failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
  `- rootCause=${runtimeBridge.report.reconciliation.rootCause}`,
  `- cleanupStatus=${probe.cleanupStatus}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_VALIDATION.md'), summary, 'utf8');
writeFileSync(
  join(ROOT, 'architecture', 'RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_REPORT.md'),
  [
    '# Runtime Startup Probe False-Positive Repair Report',
    '',
    '## Fix',
    '',
    'Health response (HTTP 2xx/3xx) + portBound overrides undefined exitCode and post-proof cleanup.',
    '',
    `- applicationBoots: **${probe.applicationBoots}**`,
    `- healthResponded: **${probe.healthResponded}**`,
    `- firstResponseStatus: **${probe.firstResponseStatus}**`,
    `- fatalErrors after repair: **${probe.fatalErrors.join('; ') || 'none'}**`,
    '',
    RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS,
  ].join('\n'),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture', 'RUNTIME_STARTUP_SUCCESS_RECONCILIATION_REPORT.md'),
  [
    '# Runtime Startup Success Reconciliation Report',
    '',
    `- applicationBoots: **${probe.applicationBoots}**`,
    `- startupFailureClass: **${startupRepair.report.failureClass}**`,
    `- preciseCrashClass: **${startupRepair.report.preciseCrashClass}**`,
    `- failureBoundary: **${runtimeBridge.report.reconciliation.failureBoundary}**`,
    `- rootCause: **${runtimeBridge.report.reconciliation.rootCause}**`,
    `- dependenciesReady: **${startupRepair.report.dependencyMaterialization?.dependenciesReady ?? 'n/a'}**`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(summary);
  process.exit(1);
}

console.log(RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS);
console.log(summary);
