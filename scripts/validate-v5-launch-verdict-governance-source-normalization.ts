/**
 * Phase 27.04 — V5 Launch Verdict Governance Source Normalization validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  detectFounderSimulationCompletion,
} from '../src/founder-simulation-completion-boundary-repair/index.js';
import {
  assembleFounderTestV5Report,
} from '../src/founder-testing-mode/founder-testing-v5-report-builder.js';
import {
  deepDefaultPayloadArrays,
  defaultAuthorityArrayFields,
} from '../src/founder-simulation-payload-guard/founder-simulation-payload-normalizer.js';
import {
  V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  applyV5LaunchVerdictGovernanceSourceNormalizationSync,
  assessV5LaunchVerdictGovernanceSourceNormalization,
  auditLaunchVerdictGovernanceSource,
  normalizeLaunchVerdictGovernanceSourceSync,
  normalizeRawResultLaunchVerdictGovernanceSource,
  resetV5LaunchVerdictGovernanceSourceNormalizationModuleForTests,
  buildLaunchVerdictGovernanceNormalizationValidationMarkdown,
} from '../src/v5-launch-verdict-governance-source-normalization/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-v5-launch-verdict-governance-source-normalization';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/v5-launch-verdict-governance-source-normalization/v5-launch-verdict-governance-source-normalization-types.ts',
  'src/v5-launch-verdict-governance-source-normalization/v5-launch-verdict-governance-source-normalization-registry.ts',
  'src/v5-launch-verdict-governance-source-normalization/launch-verdict-governance-source-auditor.ts',
  'src/v5-launch-verdict-governance-source-normalization/launch-verdict-governance-shape-detector.ts',
  'src/v5-launch-verdict-governance-source-normalization/launch-verdict-governance-source-normalizer.ts',
  'src/v5-launch-verdict-governance-source-normalization/launch-verdict-governance-repair-planner.ts',
  'src/v5-launch-verdict-governance-source-normalization/launch-verdict-governance-normalization-report-builder.ts',
  'src/v5-launch-verdict-governance-source-normalization/launch-verdict-governance-normalization-history.ts',
  'src/v5-launch-verdict-governance-source-normalization/v5-launch-verdict-governance-source-normalization-authority.ts',
  'src/v5-launch-verdict-governance-source-normalization/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(
    ROOT,
    'src/v5-launch-verdict-governance-source-normalization/v5-launch-verdict-governance-source-normalization-authority.ts',
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
  v5ReportBuilderSource.includes('applyV5LaunchVerdictGovernanceSourceNormalizationSync'),
  'missing',
);
assert(
  'v5 orchestrator wired',
  v5OrchestratorSource.includes('applyV5LaunchVerdictGovernanceSourceNormalizationSync'),
  'missing',
);
assert(
  'payload guard wired',
  payloadGuardSource.includes('normalizeRawResultLaunchVerdictGovernanceSource'),
  'missing',
);
assert(
  'founder handler wired',
  handlerSource.includes('normalizeRawResultLaunchVerdictGovernanceSource'),
  'missing',
);
assert(
  'package script registered',
  packageJson.includes(`validate:v5-launch-verdict-governance-source-normalization": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

resetV5LaunchVerdictGovernanceSourceNormalizationModuleForTests();

const partialGovernance = {
  finalLaunchVerdict: 'NOT_READY' as const,
  governanceConfidence: 55,
  satisfiedRuleCount: 1,
  failedRuleCount: 2,
  requiredEvidenceMissing: undefined,
  blockingAuthorities: undefined,
};

const sourceAudit = auditLaunchVerdictGovernanceSource({
  governance: partialGovernance,
  sourcePath: 'report.v4.launchVerdictGovernance',
  producerAuthority: 'DEGRADED_FALLBACK_PAYLOAD',
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
  producerAuthority: 'DEGRADED_FALLBACK_PAYLOAD',
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
    normalized.record.producerAuthority === 'DEGRADED_FALLBACK_PAYLOAD',
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

const normalizedPartial = applyV5LaunchVerdictGovernanceSourceNormalizationSync({
  partial: defaultAuthorityArrayFields(deepDefaultPayloadArrays(makeV5Partial())),
  sourcePath: 'validate-v5-launch-verdict-governance-source-normalization',
  producerAuthority: 'V5_REPORT_ASSEMBLY',
}).partial;

const governance = normalizedPartial.v4.launchVerdictGovernance;
const missingEvidenceAccess = governance.requiredEvidenceMissing.length;
const blockingAuthoritiesAccess = governance.blockingAuthorities.length;
const satisfiedRulesAccess = governance.satisfiedRules.length;
const failedRulesAccess = governance.failedRules.length;
const governanceReasoningAccess = governance.governanceReasoning.length;
assert(
  '5. V5 governance fields normalized before report generation (no undefined .length)',
  missingEvidenceAccess >= 0 &&
    blockingAuthoritiesAccess >= 0 &&
    satisfiedRulesAccess >= 0 &&
    failedRulesAccess >= 0 &&
    governanceReasoningAccess >= 0,
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

const cleanCompletion = detectFounderSimulationCompletion({
  resultProduced: true,
  degraded: false,
  budgetExceeded: false,
  errorMessage: null,
  elapsedMs: 120000,
});
assert(
  '8. founder simulation can complete without governance-crash warning path',
  cleanCompletion.eventId === FOUNDER_SIMULATION_COMPLETE ||
    cleanCompletion.eventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  cleanCompletion.eventId,
);

const assessment = assessV5LaunchVerdictGovernanceSourceNormalization({
  governance: normalized.governance,
  sourcePath: 'report.v4.launchVerdictGovernance',
  producerAuthority: 'LAUNCH_VERDICT_GOVERNANCE_AUTHORITY',
});
assert(
  'assessment pass after normalization',
  assessment.report.passToken === V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS,
  assessment.report.shapeDetection.failureClass,
);

const failed = results.filter((entry) => !entry.passed);
const passToken =
  failed.length === 0 ? V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS : null;

const validationMarkdown = buildLaunchVerdictGovernanceNormalizationValidationMarkdown({
  passToken,
  checks: results,
});

writeFileSync(
  join(ROOT, 'architecture/V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_VALIDATION.md'),
  validationMarkdown,
);
writeFileSync(
  join(ROOT, 'architecture/V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_REPORT.md'),
  validationMarkdown,
);

if (failed.length > 0) {
  console.error('V5 launch verdict governance source normalization validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS);
