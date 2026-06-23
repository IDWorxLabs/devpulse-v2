/**
 * Phase 26.97 — Founder Simulation Payload Guard validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS } from '../src/founder-simulation-completion-boundary-repair/index.js';
import {
  FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS,
  applyFounderSimulationPayloadGuard,
  buildFounderSimulationPayloadGuardReportMarkdown,
  buildFounderSimulationPayloadGuardValidationMarkdown,
  buildGuardedDiagnosticMarkdown,
  detectUndefinedLengthRisks,
  guardFounderSimulationHandlerResult,
  normalizeFounderSimulationExecutionResult,
  resetFounderSimulationPayloadGuardModuleForTests,
} from '../src/founder-simulation-payload-guard/index.js';
import { buildFounderTestV5ReportMarkdown, assembleFounderTestV5Report } from '../src/founder-testing-mode/founder-testing-v5-report-builder.js';
import { buildFounderTestRuntimeFailureReport } from '../src/founder-test-runtime-monitor/runtime-failure-report-builder.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-simulation-payload-guard';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-simulation-payload-guard/founder-simulation-payload-guard-types.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-guard-registry.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-shape-auditor.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-normalizer.ts',
  'src/founder-simulation-payload-guard/undefined-length-access-detector.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-repair-planner.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-guard-report-builder.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-guard-history.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts',
  'src/founder-simulation-payload-guard/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const v5ReportSource = readFileSync(
  join(ROOT, 'src/founder-testing-mode/founder-testing-v5-report-builder.ts'),
  'utf8',
);

assert('no nested runFounderTest in guard authority', !authoritySource.includes('runFounderTest'), 'nested chain');
assert('no nested validate: in guard authority', !authoritySource.includes('validate:'), 'nested chain');
assert('handler wired to payload guard', handlerSource.includes('guardFounderSimulationHandlerResult'), 'missing wire');
assert('v5 report builder guards listSection', v5ReportSource.includes('Array.isArray(items)'), 'missing guard');

resetFounderSimulationPayloadGuardModuleForTests();

const riskyPayload = {
  report: {
    reportMarkdown: undefined,
    unifiedSummary: {
      whatWorks: undefined,
      whatIsBroken: undefined,
      launchBlockers: undefined,
    },
    v4: {
      chatIntelligenceReality: {
        chatIntelligenceScore: 95,
        chatLaunchVerdict: 'OPERATIONAL_OK',
        blocksLaunchReadiness: false,
        scenariosPassed: 4,
        scenariosRun: 4,
        founderProofNotes: undefined,
        failedScenarios: undefined,
        requiredFixesBeforeLaunch: undefined,
      },
      repositoryTypecheckReality: {
        readinessState: 'NOT_RUN',
        typecheckClean: true,
        blocksLaunchReadiness: false,
        errorCount: 0,
        warningCount: 0,
        founderProofNotes: undefined,
        findings: undefined,
      },
      skepticalFounderSimulator: {
        skepticalFounderScore: 80,
        launchRiskScore: 20,
        readinessState: 'READY',
        blocksLaunchReadiness: false,
        objectionCount: 0,
        objections: undefined,
      },
      launchReadinessReality: {
        launchReadinessRealityScore: 80,
        technicalReadiness: 80,
        productReadiness: 80,
        humanReadiness: 80,
        executionReadiness: 80,
      },
    },
  },
  phaseFeedEvents: undefined,
};

const risksBefore = detectUndefinedLengthRisks(riskyPayload);
assert('undefined fields detected before guard', risksBefore.length > 0, String(risksBefore.length));

const normalized = normalizeFounderSimulationExecutionResult({
  rawResult: riskyPayload,
  degraded: true,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  originalError: 'V5 exceeded stage budget',
});

const summary = normalized.guarded.report?.unifiedSummary as Record<string, unknown>;
assert('undefined arrays normalized to []', Array.isArray(summary?.whatWorks), String(summary?.whatWorks));
assert('undefined strings normalized to ""', typeof normalized.guarded.report?.reportMarkdown === 'string', 'not string');

const chat = (normalized.guarded.report?.v4 as Record<string, unknown>)?.chatIntelligenceReality as Record<
  string,
  unknown
>;
assert('undefined scenarios normalized', Array.isArray(chat?.failedScenarios), 'not array');
assert('.length cannot crash on guarded payload', (chat?.failedScenarios as unknown[]).length >= 0, 'crash');

const guardedHandler = guardFounderSimulationHandlerResult({
  rawResult: riskyPayload,
  degraded: true,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  originalError: 'V5 exceeded stage budget',
  elapsedMs: 252460,
});

assert(
  'completion-with-warnings preserves metadata',
  guardedHandler.result.simulationPayloadGuard.degraded &&
    guardedHandler.result.simulationPayloadGuard.completionEvent === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  guardedHandler.result.simulationPayloadGuard.completionEvent ?? 'null',
);
assert('missingFields recorded', guardedHandler.result.simulationPayloadGuard.missingFields.length > 0, 'empty');
assert('diagnostic markdown stored', Boolean(guardedHandler.diagnosticMarkdown?.trim()), 'missing');

let reportMarkdown = '';
try {
  const assembled = assembleFounderTestV5Report({
    reportId: 'guard-test',
    generatedAt: Date.now(),
    durationMs: 252460,
    readOnly: true,
    mode: 'founder-testing-v5',
    overallFounderScore: 80,
    launchRecommendation: 'NOT_READY',
    unifiedSummary: normalized.guarded.report?.unifiedSummary as never,
    phaseFeedEvents: normalized.guarded.phaseFeedEvents as never,
    v4: normalized.guarded.report?.v4 as never,
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
  });
  reportMarkdown = assembled.reportMarkdown;
} catch (err) {
  reportMarkdown = '';
  assert(
    'report generation succeeds with degraded result',
    false,
    err instanceof Error ? err.message : 'crash',
  );
}
assert(
  'report generation succeeds with degraded result',
  reportMarkdown.includes('Founder Test Report') || reportMarkdown.includes('Degraded'),
  String(reportMarkdown.length),
);

const failureReport = buildFounderTestRuntimeFailureReport({
  snapshot: {
    readOnly: true,
    runId: 'guard-test',
    state: 'FAILED',
    publicState: 'FAILED',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    elapsedMs: 252460,
    lastHeartbeatAt: new Date().toISOString(),
    secondsSinceLastHeartbeat: 0,
    handlerAlive: false,
    progress: {
      readOnly: true,
      currentStage: 'FOUNDER_SIMULATION_ENGINE',
      currentStageLabel: 'Founder Simulation Engine',
      currentStageOrder: 7,
      totalStages: 11,
      completedStages: 6,
      remainingStages: 5,
      percentComplete: 60,
      elapsedMs: 252460,
      estimatedRemainingMs: null,
    },
    stages: [],
    feed: undefined as never,
    traceEvents: undefined as never,
    stallAnalysis: {
      readOnly: true,
      health: 'SLOW',
      currentStageId: 'FOUNDER_SIMULATION_ENGINE',
      stageElapsedMs: 252460,
      stageAverageMs: 12000,
      warningMessage: null,
      stallReason: null,
      currentStageTimeoutMs: 300000,
      secondsSinceLastHeartbeat: 0,
    },
    stallReason: null,
  } as never,
  errorMessage: 'Cannot read properties of undefined (reading length)',
});
assert('runtime failure report tolerates undefined feed/trace', failureReport.length > 50, 'crash');

const assessment = applyFounderSimulationPayloadGuard({
  rawResult: riskyPayload,
  degraded: true,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  originalError: 'V5 exceeded stage budget',
  skipHistoryRecording: true,
});
assert('pass token issued', assessment.report.passToken === FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS, assessment.report.passToken ?? 'null');

const diagnostic = buildGuardedDiagnosticMarkdown({
  guard: guardedHandler.result.simulationPayloadGuard,
  elapsedMs: 252460,
});
assert('guarded diagnostic includes warning metadata', diagnostic.includes('FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS'), 'missing event');

writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_PAYLOAD_GUARD_REPORT.md'),
  buildFounderSimulationPayloadGuardReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_PAYLOAD_GUARD_VALIDATION.md'),
  buildFounderSimulationPayloadGuardValidationMarkdown(results, assessment.report.passToken),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
const pass = failed.length === 0;

console.log(`\n=== ${VALIDATOR_BASENAME} ===\n`);
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${failed.length} failed / ${results.length} checks`);
if (pass) {
  console.log(`\n${FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS}\n`);
  process.exit(0);
}
process.exit(1);
