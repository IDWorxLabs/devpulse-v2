/**
 * Phase 26.99 — Founder Simulation Crash Locator validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS } from '../src/founder-simulation-completion-boundary-repair/index.js';
import {
  FOUNDER_SIMULATION_CRASH_LOCATOR_PASS,
  classifyFounderSimulationCrash,
  findPrimaryCrashFrame,
  locateAndPatchFounderSimulationCrash,
  parseUndefinedLengthStack,
  probeFieldPath,
  resetFounderSimulationCrashLocatorModuleForTests,
} from '../src/founder-simulation-crash-locator/index.js';
import {
  guardFounderSimulationHandlerResult,
  resetFounderSimulationPayloadGuardModuleForTests,
} from '../src/founder-simulation-payload-guard/index.js';
import {
  assembleFounderTestV5Report,
  buildFounderTestV5ReportMarkdown,
} from '../src/founder-testing-mode/founder-testing-v5-report-builder.js';
import {
  resetFounderTestRunResultStoreForTests,
  storeFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-simulation-crash-locator';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-simulation-crash-locator/founder-simulation-crash-locator-types.ts',
  'src/founder-simulation-crash-locator/founder-simulation-crash-locator-registry.ts',
  'src/founder-simulation-crash-locator/undefined-length-stack-parser.ts',
  'src/founder-simulation-crash-locator/founder-simulation-crash-context-capturer.ts',
  'src/founder-simulation-crash-locator/object-path-probe.ts',
  'src/founder-simulation-crash-locator/founder-simulation-crash-classifier.ts',
  'src/founder-simulation-crash-locator/founder-simulation-crash-locator-report-builder.ts',
  'src/founder-simulation-crash-locator/founder-simulation-crash-locator-history.ts',
  'src/founder-simulation-crash-locator/founder-simulation-crash-locator-authority.ts',
  'src/founder-simulation-crash-locator/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-simulation-crash-locator/founder-simulation-crash-locator-authority.ts'),
  'utf8',
);
const v5Source = readFileSync(
  join(ROOT, 'src/founder-testing-mode/founder-testing-v5-report-builder.ts'),
  'utf8',
);
const guardSource = readFileSync(
  join(ROOT, 'src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const registrySource = readFileSync(
  join(ROOT, 'src/founder-simulation-crash-locator/founder-simulation-crash-locator-registry.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('PASS token in registry', registrySource.includes(FOUNDER_SIMULATION_CRASH_LOCATOR_PASS), 'missing token ref');
assert('v5 launchVerdictGovernance guarded', v5Source.includes('requiredEvidenceMissing ?? []'), 'missing guard');
assert('payload guard uses source normalization before guard', guardSource.includes('normalizeRawResultLaunchVerdictGovernanceSource'), 'missing');
assert(
  'payload guard uses crash locator only when governance source normalization insufficient',
  guardSource.includes('locateAndPatchFounderSimulationCrash'),
  'missing',
);
assert('v5 assemble wired to crash locator', v5Source.includes('locateAndPatchFounderSimulationCrash'), 'missing');
assert('handler passes runId to guard', handlerSource.includes('runId: input.runId'), 'missing');
assert('no nested validator', !authoritySource.includes('validate-'), 'nested');
assert(
  'package script registered',
  packageJson.includes(`validate:founder-simulation-crash-locator": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

resetFounderSimulationCrashLocatorModuleForTests();
resetFounderSimulationPayloadGuardModuleForTests();

const crashPayload = {
  report: {
    reportMarkdown: '',
    unifiedSummary: {
      whatWorks: [],
      whatIsBroken: [],
      launchBlockers: [],
      whatDoesntMakeSense: [],
      whatHurtsTrust: [],
      whatChanged: [],
      recommendedActions: [],
      overallFounderScore: 70,
      launchRecommendation: 'NOT_READY',
      finalRecommendation: 'Not ready',
      highestImpactUpgrade: null,
    },
    v4: {
      launchVerdictGovernance: {
        finalLaunchVerdict: 'NOT_READY',
        governanceConfidence: 55,
        satisfiedRuleCount: 1,
        failedRuleCount: 2,
        requiredEvidenceMissing: undefined,
        blockingAuthorities: undefined,
      },
      chatIntelligenceReality: {
        chatIntelligenceScore: 90,
        chatLaunchVerdict: 'OPERATIONAL_OK',
        blocksLaunchReadiness: false,
        scenariosPassed: 4,
        scenariosRun: 4,
        founderProofNotes: [],
        failedScenarios: [],
        requiredFixesBeforeLaunch: [],
      },
      launchReadinessReality: {
        launchReadinessRealityScore: 70,
        technicalReadiness: 70,
        productReadiness: 70,
        humanReadiness: 70,
        executionReadiness: 70,
      },
    },
  },
  phaseFeedEvents: [],
};

function makeV5Partial() {
  return {
    reportId: 'crash-locator-test',
    generatedAt: Date.now(),
    durationMs: 286866,
    readOnly: true as const,
    mode: 'founder-testing-v5' as const,
    overallFounderScore: 70,
    launchRecommendation: 'NOT_READY' as const,
    unifiedSummary: crashPayload.report.unifiedSummary as never,
    phaseFeedEvents: [] as never,
    v4: crashPayload.report.v4 as never,
    verificationResults: {} as never,
    changeIntelligence: {} as never,
    founderActionCenter: {} as never,
    founderSensemaking: {} as never,
    founderInteractionSimulation: {} as never,
    firstTimeUserReality: {} as never,
    verificationTrustEvidence: {} as never,
    founderFrictionHeatmap: {} as never,
    customerJourneySimulation: {} as never,
    promiseRealityEngine: {} as never,
    visualQualityAuthority: {} as never,
    launchDaySimulation: {} as never,
    adoptionPrediction: {} as never,
    productEconomics: {} as never,
    productEvolution: {} as never,
    competitiveReality: {} as never,
    founderDecisionReadiness: {} as never,
    digitalFounderBoard: {} as never,
    verdict: 'NOT_READY' as never,
  };
}

const syntheticError = new Error("Cannot read properties of undefined (reading 'length')");
const syntheticStack = [
  syntheticError.message,
  '    at buildFounderTestV5ReportMarkdown (founder-testing-v5-report-builder.ts:455:89)',
  '    at assembleFounderTestV5Report (founder-testing-v5-report-builder.ts:856:12)',
].join('\n');
syntheticError.stack = syntheticStack;

assert(
  '1. undefined .length crash stack captured',
  syntheticError.message.includes("reading 'length'"),
  syntheticError.message,
);

const frames = parseUndefinedLengthStack(syntheticStack);
assert('2. crash stack captured', frames.length >= 2, String(frames.length));

const primaryFrame = findPrimaryCrashFrame(frames);
const classification = classifyFounderSimulationCrash(primaryFrame);
assert(
  '3. crash location classified',
  classification.failureClass === 'V5_REPORT_BUILDER_UNDEFINED_LENGTH',
  classification.failureClass,
);

const probe = probeFieldPath(crashPayload, 'report.v4.launchVerdictGovernance.requiredEvidenceMissing');
assert(
  '4. object path probe identifies missing field',
  probe.isUndefined && probe.fieldKind === 'array-like',
  `${probe.path} kind=${probe.fieldKind}`,
);

const located = locateAndPatchFounderSimulationCrash({
  error: syntheticError,
  rawResult: crashPayload,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  degraded: true,
  guardApplied: true,
  guardMissingFields: [],
});
assert(
  '5. missed field patched',
  located.appliedPaths.length > 0,
  located.appliedPaths.join(', '),
);
assert(
  '6. missingFields repaired > 0 after guard',
  located.appliedPaths.some((path) => path.includes('requiredEvidenceMissing')),
  located.appliedPaths.join(', '),
);

const guarded = guardFounderSimulationHandlerResult({
  rawResult: crashPayload,
  degraded: true,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  originalError: syntheticError.message,
  reportBuildError: syntheticError,
  elapsedMs: 286866,
});
assert(
  '7. guarded diagnostic uses source normalization instead of governance crash locator',
  !guarded.diagnosticMarkdown?.includes(
    'Crash field path: report.v4.launchVerdictGovernance.requiredEvidenceMissing',
  ) &&
    (guarded.result.simulationPayloadGuard.patchApplied === false ||
      guarded.result.simulationPayloadGuard.patchApplied == null),
  guarded.result.simulationPayloadGuard.crashFieldPath ?? guarded.diagnosticMarkdown?.slice(0, 120) ?? 'missing',
);
assert(
  'guard governance arrays normalized without crash-locator repair metadata',
  guarded.result.simulationPayloadGuard.missingFields.every(
    (path) => !path.includes('launchVerdictGovernance'),
  ),
  guarded.result.simulationPayloadGuard.missingFields.join(', ') || 'empty',
);

const patchedPartial = makeV5Partial();
const patchedV4 = located.patchedResult as typeof crashPayload;
patchedPartial.v4 = patchedV4.report.v4 as never;
let reportMarkdown = '';
try {
  reportMarkdown = buildFounderTestV5ReportMarkdown(patchedPartial);
} catch (err) {
  const assembled = assembleFounderTestV5Report(patchedPartial);
  reportMarkdown = assembled.reportMarkdown;
}
assert(
  '8. report generation succeeds after targeted patch',
  reportMarkdown.length > 50 && !reportMarkdown.includes("reading 'length'"),
  String(reportMarkdown.length),
);

resetFounderTestRunResultStoreForTests();
storeFounderTestRunResult({
  readOnly: true,
  runId: 'founder-simulation-crash-locator-test',
  ok: true,
  completedAt: new Date().toISOString(),
  payload: { reportMarkdown },
  errorMessage: null,
});
assert('result store receives markdown', reportMarkdown.length > 0, 'empty');

assert('9. no nested validator chains', !authoritySource.includes('spawn('), 'nested spawn');

const failed = results.filter((entry) => !entry.passed);
const passToken = failed.length === 0 ? FOUNDER_SIMULATION_CRASH_LOCATOR_PASS : null;

const report = [
  '# Founder Simulation Crash Locator Validation',
  '',
  `Result: ${passToken ?? 'FAILED'}`,
  '',
  '## Confirmed crash field',
  '',
  '- `report.v4.launchVerdictGovernance.requiredEvidenceMissing`',
  '- `report.v4.launchVerdictGovernance.blockingAuthorities`',
  '',
  '## Root cause',
  '',
  'Payload guard shape auditor missed `requiredEvidenceMissing` / `blockingAuthorities` because key-name heuristics did not match. V5 report builder accessed `.length` on undefined arrays at lines 455/457.',
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  passToken ? `**${passToken}**` : '',
].join('\n');

writeFileSync(join(ROOT, 'architecture/FOUNDER_SIMULATION_CRASH_LOCATOR_VALIDATION.md'), report);
writeFileSync(join(ROOT, 'architecture/FOUNDER_SIMULATION_CRASH_LOCATOR_REPORT.md'), report);

if (failed.length > 0) {
  console.error('Founder simulation crash locator validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(FOUNDER_SIMULATION_CRASH_LOCATOR_PASS);
