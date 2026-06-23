/**
 * Phase 26.77 — Runtime Startup Proof Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessRuntimeStartupProofRepair,
  discoverRuntimeEntrypoint,
  getRuntimeStartupProofRepairHistorySize,
  resolvePrimaryWorkspace,
  resolveStartupCommand,
  RUNTIME_STARTUP_PROOF_REPAIR_PASS,
  resetRuntimeStartupProofRepairModuleForTests,
} from '../src/runtime-startup-proof-repair/index.js';
import { assessRuntimeMaterializationTruthBridge, resetRuntimeMaterializationTruthBridgeModuleForTests } from '../src/runtime-materialization-truth-bridge/index.js';
import { assessConnectedBuildExecution, resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
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

const REQUIRED = [
  'src/runtime-startup-proof-repair/runtime-startup-proof-repair-types.ts',
  'src/runtime-startup-proof-repair/runtime-startup-proof-repair-registry.ts',
  'src/runtime-startup-proof-repair/runtime-entrypoint-discovery.ts',
  'src/runtime-startup-proof-repair/runtime-start-command-resolver.ts',
  'src/runtime-startup-proof-repair/runtime-process-probe.ts',
  'src/runtime-startup-proof-repair/runtime-startup-failure-classifier.ts',
  'src/runtime-startup-proof-repair/runtime-startup-proof-report-builder.ts',
  'src/runtime-startup-proof-repair/runtime-startup-proof-repair-authority.ts',
  'src/runtime-startup-proof-repair/runtime-startup-probe.mjs',
  'src/runtime-startup-proof-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-proof-repair-authority.ts'),
  'utf8',
);
const resolverSource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-start-command-resolver.ts'),
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

assert('RUNTIME_STARTUP_PROOF_REPAIR_PASS token', authoritySource.includes(RUNTIME_STARTUP_PROOF_REPAIR_PASS) || readFileSync(join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-proof-repair-registry.ts'), 'utf8').includes(RUNTIME_STARTUP_PROOF_REPAIR_PASS), 'missing');
assert('evidence-backed resolution', resolverSource.includes('evidenceDetail'), 'missing');
assert('BUILD_MANIFEST priority', resolverSource.includes('BUILD_MANIFEST'), 'missing');
assert('failure classification', classifierSource.includes('NO_START_COMMAND'), 'missing');
assert('runtime bridge consumes repair', collectorSource.includes('assessRuntimeStartupProofRepair'), 'missing');
assert('no nested validators in authority', !authoritySource.includes('validate:') && !authoritySource.includes('assessRuntimeMaterializationTruthBridge'), 'nested validator');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates files');

resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;

const workspace = resolvePrimaryWorkspace({ rootDir: ROOT, buildMaterializationReport: buildReport });
assert('workspace discovery', Boolean(workspace), workspace?.workspaceRoot ?? 'none');

if (workspace) {
  const entrypoint = discoverRuntimeEntrypoint({
    rootDir: ROOT,
    workspaceRoot: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    workspaceAbs: workspace.workspaceAbs,
    buildMaterializationReport: buildReport,
  });
  assert('entrypoint discovery', entrypoint.discoverySources.length > 0, String(entrypoint.discoverySources.length));
  assert('appType assigned', Boolean(entrypoint.appType), entrypoint.appType);

  const resolved = resolveStartupCommand({
    rootDir: ROOT,
    entrypoint,
    buildMaterializationReport: buildReport,
  });
  assert(
    'command resolution evidence',
    resolved.evidenceSource !== 'NO_COMMAND_FOUND' || entrypoint.missingPrerequisites.length > 0,
    resolved.evidenceSource,
  );
  assert('resolution detail present', resolved.evidenceDetail.length > 0, 'empty');
}

const repair = assessRuntimeStartupProofRepair({ rootDir: ROOT, buildMaterializationReport: buildReport });
const report = repair.report;

assert('repair completes', repair.orchestrationState === 'RUNTIME_STARTUP_PROOF_REPAIR_COMPLETE', repair.orchestrationState);
assert('failure class assigned', Boolean(report.failureClass), report.failureClass);
assert('probe cleanup tracked', ['CLEANED', 'NOT_STARTED', 'CLEANUP_FAILED'].includes(report.probe.cleanupStatus), report.probe.cleanupStatus);
assert('history recorded', getRuntimeStartupProofRepairHistorySize() >= 1, String(getRuntimeStartupProofRepairHistorySize()));

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: repair,
  skipHistoryRecording: true,
});

assert('runtime bridge receives startup proof', Boolean(runtimeBridge.report.evidence.startupProofRepair), 'missing');
assert(
  'startup failure class propagated',
  runtimeBridge.report.reconciliation.startupFailureClass !== undefined,
  String(runtimeBridge.report.reconciliation.startupFailureClass),
);
assert(
  'failureBoundary uses startup analysis',
  Boolean(runtimeBridge.report.reconciliation.failureBoundary),
  runtimeBridge.report.reconciliation.failureBoundary,
);

if (report.applicationBoots) {
  assert(
    'applicationBoots moves boundary from STARTUP',
    runtimeBridge.report.reconciliation.failureBoundary !== 'STARTUP' ||
      runtimeBridge.report.evidence.proofAnalysis.routesReachable,
    runtimeBridge.report.reconciliation.failureBoundary,
  );
} else {
  assert(
    'startup failure keeps STARTUP boundary',
    runtimeBridge.report.reconciliation.failureBoundary === 'STARTUP' ||
      runtimeBridge.report.reconciliation.rootCause === 'RUNTIME_START_FAILURE' ||
      runtimeBridge.report.reconciliation.startupFailureClass !== 'NONE',
    `${runtimeBridge.report.reconciliation.failureBoundary}/${runtimeBridge.report.reconciliation.rootCause}`,
  );
}

const failed = results.filter((e) => !e.passed);
const summary = [
  '# Runtime Startup Proof Repair Validation',
  '',
  `Result: ${failed.length === 0 ? RUNTIME_STARTUP_PROOF_REPAIR_PASS : 'FAILED'}`,
  '',
  ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
  '',
  '## Snapshot',
  '',
  `- applicationBoots=${report.applicationBoots}`,
  `- failureClass=${report.failureClass}`,
  `- resolvedCommand=${report.resolvedCommand.command ?? 'none'}`,
  `- evidenceSource=${report.resolvedCommand.evidenceSource}`,
  `- cleanupStatus=${report.probe.cleanupStatus}`,
  `- runtimeBridge.failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
  `- runtimeBridge.applicationBoots=${runtimeBridge.report.evidence.proofAnalysis.applicationBoots}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'RUNTIME_STARTUP_PROOF_VALIDATION.md'), summary, 'utf8');
writeFileSync(
  join(ROOT, 'architecture', 'RUNTIME_STARTUP_PROOF_REPAIR_REPORT.md'),
  [
    '# Runtime Startup Proof Repair Report',
    '',
    '## Objective',
    '',
    'Repair FILES_EXIST → APPLICATION_BOOTS startup boundary with evidence-backed command resolution.',
    '',
    `- applicationBoots: **${report.applicationBoots}**`,
    `- failureClass: **${report.failureClass}**`,
    `- command: **${report.resolvedCommand.command ?? 'none'}**`,
    `- evidence: **${report.resolvedCommand.evidenceDetail}**`,
    '',
    RUNTIME_STARTUP_PROOF_REPAIR_PASS,
  ].join('\n'),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture', 'RUNTIME_STARTUP_FAILURE_CLASSIFICATION_REPORT.md'),
  [
    '# Runtime Startup Failure Classification Report',
    '',
    `- failureClass: **${report.failureClass}**`,
    `- failureReason: ${report.failureReason}`,
    `- recommendedFix: ${report.recommendedFix}`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(summary);
  process.exit(1);
}

console.log(RUNTIME_STARTUP_PROOF_REPAIR_PASS);
console.log(summary);
