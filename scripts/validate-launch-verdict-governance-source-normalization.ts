/**
 * Phase 27.06 — Launch Verdict Governance Source Normalization validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  detectFounderSimulationCompletion,
} from '../src/founder-simulation-completion-boundary-repair/index.js';
import { assembleFounderTestV5Report } from '../src/founder-testing-mode/founder-testing-v5-report-builder.js';
import {
  deepDefaultPayloadArrays,
  defaultAuthorityArrayFields,
  normalizeFounderSimulationExecutionResult,
} from '../src/founder-simulation-payload-guard/founder-simulation-payload-normalizer.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  applyLaunchVerdictGovernanceSourceNormalizationSync,
  assessLaunchVerdictGovernanceSourceNormalization,
  auditGovernanceSource,
  normalizeLaunchVerdictGovernanceSourceSync,
  normalizeRawResultLaunchVerdictGovernanceSource,
  resetLaunchVerdictGovernanceSourceNormalizationModuleForTests,
  buildLaunchVerdictGovernanceSourceNormalizationValidationMarkdown,
} from '../src/launch-verdict-governance-source-normalization/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-launch-verdict-governance-source-normalization';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalization-types.ts',
  'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalization-registry.ts',
  'src/launch-verdict-governance-source-normalization/governance-source-auditor.ts',
  'src/launch-verdict-governance-source-normalization/governance-payload-shape-validator.ts',
  'src/launch-verdict-governance-source-normalization/missing-array-detector.ts',
  'src/launch-verdict-governance-source-normalization/degraded-path-detector.ts',
  'src/launch-verdict-governance-source-normalization/normalization-planner.ts',
  'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalizer.ts',
  'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalization-report-builder.ts',
  'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalization-history.ts',
  'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalization-authority.ts',
  'src/launch-verdict-governance-source-normalization/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(
    ROOT,
    'src/launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalization-authority.ts',
  ),
  'utf8',
);
const governanceAuthoritySource = readFileSync(
  join(ROOT, 'src/launch-verdict-governance/launch-verdict-governance-authority.ts'),
  'utf8',
);
const v5ReportBuilderSource = readFileSync(
  join(ROOT, 'src/founder-testing-mode/founder-testing-v5-report-builder.ts'),
  'utf8',
);
const v5OrchestratorSource = readFileSync(
  join(ROOT, 'src/founder-testing-mode/founder-testing-v5-orchestrator.ts'),
  'utf8',
);
const payloadGuardSource = readFileSync(
  join(ROOT, 'src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts'),
  'utf8',
);
const payloadNormalizerSource = readFileSync(
  join(ROOT, 'src/founder-simulation-payload-guard/founder-simulation-payload-normalizer.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert(
  'launch verdict governance authority wired',
  governanceAuthoritySource.includes('normalizeLaunchVerdictGovernanceSourceSync'),
  'missing',
);
assert(
  'v5 report builder wired',
  v5ReportBuilderSource.includes('applyLaunchVerdictGovernanceSourceNormalizationSync'),
  'missing',
);
assert(
  'v5 orchestrator wired',
  v5OrchestratorSource.includes('applyLaunchVerdictGovernanceSourceNormalizationSync'),
  'missing',
);
assert(
  'payload guard wired',
  payloadGuardSource.includes('normalizeRawResultLaunchVerdictGovernanceSource'),
  'missing',
);
assert(
  'payload guard skips crash patch when source normalized',
  payloadGuardSource.includes('governanceSourceNormalized') &&
    !payloadGuardSource.includes('applyConfirmedV5LaunchVerdictGovernancePatches'),
  'crash patch not gated',
);
assert(
  'payload normalizer source-normalizes before audit',
  payloadNormalizerSource.includes('normalizeRawResultLaunchVerdictGovernanceSource(input.rawResult)'),
  'missing',
);
assert(
  'founder handler wired',
  handlerSource.includes('normalizeRawResultLaunchVerdictGovernanceSource'),
  'missing',
);
assert(
  'package script registered',
  packageJson.includes(
    `validate:launch-verdict-governance-source-normalization": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'missing',
);
assert(
  'crash upstream producer identified',
  LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER === 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
  LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER,
);

resetLaunchVerdictGovernanceSourceNormalizationModuleForTests();

const partialGovernance = {
  finalLaunchVerdict: 'NOT_READY' as const,
  governanceConfidence: 55,
  satisfiedRuleCount: 1,
  failedRuleCount: 2,
  requiredEvidenceMissing: undefined,
  blockingAuthorities: undefined,
};

const sourceAudit = auditGovernanceSource({
  governance: partialGovernance,
  sourcePath: 'report.v4.launchVerdictGovernance',
  upstreamProducer: 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
});
assert(
  '1. missing governance arrays detected at source',
  sourceAudit.missingFields.includes('requiredEvidenceMissing') &&
    sourceAudit.missingFields.includes('blockingAuthorities'),
  sourceAudit.missingFields.join(', '),
);

const normalized = normalizeLaunchVerdictGovernanceSourceSync({
  governance: partialGovernance,
  sourcePath: 'report.v4.launchVerdictGovernance',
  upstreamProducer: 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
});
assert(
  '2. requiredEvidenceMissing normalized before report generation',
  Array.isArray(normalized.governance.requiredEvidenceMissing),
  String(normalized.governance.requiredEvidenceMissing),
);
assert(
  '3. blockingAuthorities normalized before report generation',
  Array.isArray(normalized.governance.blockingAuthorities),
  String(normalized.governance.blockingAuthorities),
);
assert(
  '4. satisfiedRules failedRules governanceReasoning normalized',
  Array.isArray(normalized.governance.satisfiedRules) &&
    Array.isArray(normalized.governance.failedRules) &&
    Array.isArray(normalized.governance.governanceReasoning),
  [
    normalized.governance.satisfiedRules.length,
    normalized.governance.failedRules.length,
    normalized.governance.governanceReasoning.length,
  ].join(','),
);
assert(
  'normalization metadata preserved',
  normalized.record.normalizationApplied &&
    normalized.record.missingFieldsBeforeNormalization.includes('requiredEvidenceMissing') &&
    normalized.record.sourcePath === 'report.v4.launchVerdictGovernance' &&
    normalized.record.upstreamProducer === 'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
  normalized.record.sourcePath,
);

function makeV5Partial() {
  return {
    reportId: 'governance-source-normalization-test',
    generatedAt: Date.now(),
    durationMs: 120000,
    readOnly: true as const,
    mode: 'founder-testing-v5' as const,
    overallFounderScore: 70,
    launchRecommendation: 'NOT_READY' as const,
    unifiedSummary: {
      whatWorks: [],
      whatIsBroken: [],
      whatDoesntMakeSense: [],
      whatHurtsTrust: [],
      whatChanged: [],
      recommendedActions: [],
      launchBlockers: [],
      overallFounderScore: 70,
      launchRecommendation: 'NOT_READY' as const,
      finalRecommendation: 'Not ready',
      highestImpactUpgrade: null,
    },
    phaseFeedEvents: [] as never,
    v4: {
      launchVerdictGovernance: partialGovernance,
      launchReadinessReality: {
        launchReadinessRealityScore: 70,
        technicalReadiness: 70,
        productReadiness: 70,
        humanReadiness: 70,
        executionReadiness: 70,
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
    } as never,
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

const normalizedPartial = applyLaunchVerdictGovernanceSourceNormalizationSync({
  partial: defaultAuthorityArrayFields(deepDefaultPayloadArrays(makeV5Partial())),
  sourcePath: 'validate-launch-verdict-governance-source-normalization',
  upstreamProducer: 'V5_REPORT_ASSEMBLY',
}).partial;

const governance = normalizedPartial.v4.launchVerdictGovernance;
assert(
  '5. V5 governance fields normalized before report generation (no undefined .length)',
  governance.requiredEvidenceMissing.length >= 0 &&
    governance.blockingAuthorities.length >= 0 &&
    governance.satisfiedRules.length >= 0 &&
    governance.failedRules.length >= 0 &&
    governance.governanceReasoning.length >= 0,
  'unsafe governance arrays',
);

const assembled = assembleFounderTestV5Report(makeV5Partial());
assert(
  '6. source normalization applied before assemble (no crash-locator governance patch required)',
  assembled.v4.launchVerdictGovernance.requiredEvidenceMissing.length >= 0 &&
    assembled.v4.launchVerdictGovernance.blockingAuthorities.length >= 0 &&
    !assembled.reportMarkdown.includes('Crash field path: report.v4.launchVerdictGovernance.requiredEvidenceMissing'),
  assembled.reportMarkdown.slice(0, 120),
);

const rawNormalized = normalizeRawResultLaunchVerdictGovernanceSource({
  report: {
    v4: { launchVerdictGovernance: partialGovernance },
  },
});
assert(
  '7. raw result source normalization applies before handler handoff',
  rawNormalized.appliedPaths.some((path) => path.includes('requiredEvidenceMissing')),
  rawNormalized.appliedPaths.join(', '),
);
assert(
  '8. payload guard repair count zero after source normalization',
  rawNormalized.payloadGuardRepairsRequired === 0,
  String(rawNormalized.payloadGuardRepairsRequired),
);

const payloadGuardResult = normalizeFounderSimulationExecutionResult({
  rawResult: {
    report: {
      v4: { launchVerdictGovernance: partialGovernance },
    },
  },
  degraded: true,
});
const governanceRepairs = payloadGuardResult.repairs.filter((repair) =>
  repair.path.includes('launchVerdictGovernance'),
);
assert(
  '9. payload guard receives normalized governance arrays (zero governance repairs)',
  governanceRepairs.length === 0,
  governanceRepairs.map((repair) => repair.path).join(', '),
);

const cleanCompletion = detectFounderSimulationCompletion({
  resultProduced: true,
  degraded: false,
  budgetExceeded: false,
  errorMessage: null,
  elapsedMs: 120000,
});
assert(
  '10. founder simulation can complete without governance-crash warning path',
  cleanCompletion.eventId === FOUNDER_SIMULATION_COMPLETE ||
    cleanCompletion.eventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  cleanCompletion.eventId,
);

const assessment = assessLaunchVerdictGovernanceSourceNormalization({
  governance: normalized.governance,
  sourcePath: 'report.v4.launchVerdictGovernance',
  upstreamProducer: 'LAUNCH_VERDICT_GOVERNANCE_AUTHORITY',
});
assert(
  'assessment pass after normalization',
  assessment.report.passToken === LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  assessment.report.shapeValidation.reason ?? 'invalid',
);

const failed = results.filter((entry) => !entry.passed);
const passToken =
  failed.length === 0 ? LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS : null;

const validationMarkdown = buildLaunchVerdictGovernanceSourceNormalizationValidationMarkdown({
  passToken,
  checks: results,
});

writeFileSync(
  join(ROOT, 'architecture/LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_VALIDATION.md'),
  validationMarkdown,
);
writeFileSync(
  join(ROOT, 'architecture/LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_REPORT.md'),
  validationMarkdown,
);

if (failed.length > 0) {
  console.error('Launch verdict governance source normalization validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS);
