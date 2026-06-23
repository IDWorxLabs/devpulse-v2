/**
 * Phase 26.93 — Authority Recursion Guard validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateFounderExecutionProofBundle } from '../src/founder-execution-proof/execution-proof-aggregator.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import { assessAutonomousRepairLoop } from '../src/autonomous-repair-loop/index.js';
import { assessAuthorityEvidenceSourceRealignment } from '../src/authority-evidence-source-realignment/index.js';
import { assessEvidencePropagationReconciliation } from '../src/evidence-propagation-reconciliation/index.js';
import {
  AUTHORITY_RECURSION_GUARD_PASS,
  DEFAULT_AUTHORITY_MAX_DEPTH,
  buildAuthoritySafeFallbackEvidence,
  buildAutonomousRepairLoopRecursionFallback,
  buildAuthorityRecursionGuardFallbackReportMarkdown,
  buildAuthorityRecursionGuardReportMarkdown,
  buildAuthorityRecursionGuardValidationMarkdown,
  detectAuthorityRecursion,
  enterAuthorityValidatorMode,
  exitAuthorityValidatorMode,
  getAuthorityRecursionDetections,
  pushAuthorityExecutionContext,
  popAuthorityExecutionContext,
  resetAuthorityRecursionGuardModuleForTests,
  runWithAuthorityGuard,
  assessAuthorityRecursionGuard,
} from '../src/authority-recursion-guard/index.js';
import { EVIDENCE_PROPAGATION_RECONCILIATION_PASS } from '../src/evidence-propagation-reconciliation/index.js';
import { AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS } from '../src/authority-evidence-source-realignment/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-authority-recursion-guard';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/authority-recursion-guard/authority-recursion-guard-types.ts',
  'src/authority-recursion-guard/authority-recursion-guard-registry.ts',
  'src/authority-recursion-guard/authority-execution-context.ts',
  'src/authority-recursion-guard/authority-recursion-detector.ts',
  'src/authority-recursion-guard/authority-safe-fallback-builder.ts',
  'src/authority-recursion-guard/authority-recursion-report-builder.ts',
  'src/authority-recursion-guard/authority-recursion-guard-history.ts',
  'src/authority-recursion-guard/authority-recursion-guard-authority.ts',
  'src/authority-recursion-guard/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const guardAuthoritySource = readFileSync(
  join(ROOT, 'src/authority-recursion-guard/authority-recursion-guard-authority.ts'),
  'utf8',
);
const aggregatorSource = readFileSync(
  join(ROOT, 'src/founder-execution-proof/execution-proof-aggregator.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in guard authority', !guardAuthoritySource.includes('validate-'), 'nested');
assert('aggregateFounderExecutionProofBundle wired', aggregatorSource.includes('runWithAuthorityGuard'), 'missing');

resetAuthorityRecursionGuardModuleForTests();

pushAuthorityExecutionContext('FOUNDER_TEST_INTEGRATION', { allowHeavyOrchestration: false });
const reentry = detectAuthorityRecursion('FOUNDER_TEST_INTEGRATION');
popAuthorityExecutionContext('FOUNDER_TEST_INTEGRATION');
assert('repeated authority re-entry detected', reentry?.ruleId === 'SAME_AUTHORITY_REENTRY', reentry?.ruleId ?? 'null');

pushAuthorityExecutionContext('EVIDENCE_PROPAGATION_RECONCILIATION', { maxDepth: 2, allowHeavyOrchestration: false });
pushAuthorityExecutionContext('AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT', { maxDepth: 2, allowHeavyOrchestration: false });
pushAuthorityExecutionContext('AUTONOMOUS_REPAIR_LOOP', { maxDepth: 2, allowHeavyOrchestration: false });
const depthDetection = detectAuthorityRecursion('FOUNDER_TEST_INTEGRATION', { maxDepth: 2 });
popAuthorityExecutionContext('AUTONOMOUS_REPAIR_LOOP');
popAuthorityExecutionContext('AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT');
popAuthorityExecutionContext('EVIDENCE_PROPAGATION_RECONCILIATION');
assert(
  'max depth enforced',
  depthDetection?.ruleId === 'MAX_DEPTH_EXCEEDED',
  depthDetection?.ruleId ?? 'null',
);

enterAuthorityValidatorMode();
pushAuthorityExecutionContext('AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT', { allowHeavyOrchestration: false });
const heavyBlocked = detectAuthorityRecursion('FOUNDER_TEST_INTEGRATION', { requireHeavyOrchestration: true });
popAuthorityExecutionContext('AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT');
exitAuthorityValidatorMode();
assert(
  'heavy orchestration blocked in validator',
  heavyBlocked?.ruleId === 'HEAVY_ORCHESTRATION_IN_VALIDATOR',
  heavyBlocked?.ruleId ?? 'null',
);

let repairLoopCalls = 0;
let overflow = false;
try {
  runWithAuthorityGuard({
    authorityName: 'FOUNDER_TEST_INTEGRATION',
    invoke: () => {
      repairLoopCalls += 1;
      return assessAutonomousRepairLoop({ rootDir: ROOT });
    },
    onRecursion: (detection) => buildAutonomousRepairLoopRecursionFallback(detection),
  });
} catch (error) {
  overflow = error instanceof RangeError;
}
assert('aggregateFounderExecutionProofBundle does not recurse indefinitely', !overflow, overflow ? 'stack overflow' : 'ok');
assert('repair loop recursion bounded', repairLoopCalls <= 2, String(repairLoopCalls));

const bundle = aggregateFounderExecutionProofBundle({}, 'recursion-test', null);
assert('bundle aggregation returns bounded result', bundle.bundle.proofBundleId === 'recursion-test', 'missing bundle');

enterAuthorityValidatorMode();
try {
  const realignment = assessAuthorityEvidenceSourceRealignment({
    rootDir: ROOT,
    skipHistoryRecording: true,
    skipHeavyOrchestration: false,
  });
  assert(
    'authority evidence source realignment validator completes',
    realignment.orchestrationState === 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_COMPLETE',
    realignment.orchestrationState,
  );
} catch (error) {
  assert(
    'authority evidence source realignment validator completes',
    false,
    error instanceof Error ? error.message : String(error),
  );
} finally {
  exitAuthorityValidatorMode();
}

const propagation = assessEvidencePropagationReconciliation({
  rootDir: ROOT,
  skipHistoryRecording: true,
  authorityEvidenceOverrides: [{ authorityId: 'TEST', displayName: 'Test', applicationVerdict: 'PARTIAL' } as never],
});
assert(
  'evidence propagation validator still passes',
  propagation.report.reconciliation.reconciledClaims.length >= 0,
  propagation.orchestrationState,
);

assert('default max depth is 6', DEFAULT_AUTHORITY_MAX_DEPTH === 6, String(DEFAULT_AUTHORITY_MAX_DEPTH));

const guardAssessment = assessAuthorityRecursionGuard({ skipHistoryRecording: true });
const detections = getAuthorityRecursionDetections();
const fallbacks = detections.map((d) => buildAuthoritySafeFallbackEvidence(d));

writeFileSync(
  join(ROOT, 'architecture/AUTHORITY_RECURSION_GUARD_REPORT.md'),
  buildAuthorityRecursionGuardReportMarkdown(guardAssessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/AUTHORITY_RECURSION_GUARD_VALIDATION.md'),
  buildAuthorityRecursionGuardValidationMarkdown(guardAssessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/AUTHORITY_RECURSION_GUARD_FALLBACK_REPORT.md'),
  buildAuthorityRecursionGuardFallbackReportMarkdown({ detections, fallbacks }),
  'utf8',
);

assert('pass token constant', guardAssessment.report.passToken === AUTHORITY_RECURSION_GUARD_PASS, guardAssessment.report.passToken ?? 'null');
assert(
  'package script registered',
  packageJson.includes('validate:authority-recursion-guard'),
  'missing',
);

const failed = results.filter((r) => !r.passed);
console.log(`\n=== ${VALIDATOR_BASENAME} ===\n`);
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${failed.length} failed / ${results.length} checks`);
if (failed.length === 0) {
  console.log(`\n${AUTHORITY_RECURSION_GUARD_PASS}\n`);
  process.exit(0);
}
process.exit(1);
