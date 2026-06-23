/**
 * Phase 27.08 — Founder Simulation Guarded Diagnostic Source Patch validation (V1).
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
  FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS,
  guardFounderSimulationHandlerResult,
  isLaunchVerdictGovernanceGuardedDiagnosticPath,
  resetFounderSimulationPayloadGuardModuleForTests,
} from '../src/founder-simulation-payload-guard/index.js';
import { normalizeRawResultLaunchVerdictGovernanceSource } from '../src/launch-verdict-governance-source-normalization/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-simulation-guarded-diagnostic-source-patch';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-simulation-payload-guard/founder-simulation-guarded-diagnostic-source-patch.ts',
  'src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const guardAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert(
  'guard normalizes raw before diagnostic markdown',
  guardAuthoritySource.includes('mergeGovernanceSourceNormalizationIntoRaw(input.rawResult)'),
  'missing source normalize before guard',
);
assert(
  'guard no longer uses crash-locator governance fallback',
  !guardAuthoritySource.includes('applyConfirmedV5LaunchVerdictGovernancePatches'),
  'crash-locator governance fallback still present',
);
assert(
  'handler passes reportBuildError for length crashes',
  handlerSource.includes('reportBuildError'),
  'missing reportBuildError wire',
);
assert(
  'package script registered',
  packageJson.includes(
    `validate:founder-simulation-guarded-diagnostic-source-patch": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'missing',
);
assert(
  'no new broad authority directory added',
  !existsSync(join(ROOT, 'src/founder-simulation-guarded-diagnostic-source-patch-authority')),
  'unexpected authority directory',
);

const partialGovernance = {
  launchVerdictReady: false,
  launchVerdict: 'NOT_READY',
  governanceVerdict: 'BLOCKED',
};

const degradedRaw = {
  report: {
    reportMarkdown: '# Degraded partial report',
    unifiedSummary: {
      whatWorks: [],
      whatIsBroken: ['Governance arrays omitted upstream'],
      launchBlockers: [],
    },
    v4: {
      launchVerdictGovernance: partialGovernance,
    },
  },
  phaseFeedEvents: [],
};

resetFounderSimulationPayloadGuardModuleForTests();

const sourcePrep = normalizeRawResultLaunchVerdictGovernanceSource(degradedRaw);
assert(
  '1. raw degraded result governance arrays normalized before diagnostic',
  sourcePrep.appliedPaths.some((path) => path.includes('requiredEvidenceMissing')) &&
    sourcePrep.appliedPaths.some((path) => path.includes('blockingAuthorities')),
  sourcePrep.appliedPaths.join(', '),
);

const lengthCrashError = "Cannot read properties of undefined (reading 'length')";
const guarded = guardFounderSimulationHandlerResult({
  rawResult: degradedRaw,
  degraded: true,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  originalError: lengthCrashError,
  reportBuildError: new Error(lengthCrashError),
  elapsedMs: 252460,
  skipHistoryRecording: true,
});

const diagnostic = guarded.diagnosticMarkdown ?? '';
const governance = (
  guarded.result.report?.v4 as { launchVerdictGovernance?: Record<string, unknown> } | undefined
)?.launchVerdictGovernance;

assert(
  '2. guarded diagnostic does not report Missing fields repaired: 2',
  !diagnostic.includes('Missing fields repaired: 2'),
  diagnostic.split('\n').find((line) => line.includes('Missing fields repaired')) ?? 'line missing',
);
assert(
  '3. crash locator not required for requiredEvidenceMissing',
  !diagnostic.includes('Crash field path: report.v4.launchVerdictGovernance.requiredEvidenceMissing'),
  diagnostic,
);
assert(
  '4. crash locator not required for blockingAuthorities',
  !diagnostic.includes('Crash field path: report.v4.launchVerdictGovernance.blockingAuthorities'),
  diagnostic,
);
assert(
  '5. diagnostic does not include Patch applied: yes for governance fields',
  !diagnostic.includes('Patch applied: yes'),
  diagnostic.split('\n').find((line) => line.includes('Patch applied')) ?? 'line missing',
);
assert(
  'governance arrays materialized on guarded result',
  Array.isArray(governance?.requiredEvidenceMissing) &&
    Array.isArray(governance?.blockingAuthorities) &&
    Array.isArray(governance?.satisfiedRules) &&
    Array.isArray(governance?.failedRules) &&
    Array.isArray(governance?.governanceReasoning),
  JSON.stringify(governance ?? null),
);

const governanceRepairCount = guarded.guardAssessment.guardedResult.guard.missingFields.filter((path) =>
  isLaunchVerdictGovernanceGuardedDiagnosticPath(path),
).length;
assert(
  'governance fields absent from guard missingFields after source patch',
  governanceRepairCount === 0,
  guarded.guardAssessment.guardedResult.guard.missingFields.join(', '),
);

const unrelatedWarnings = guardFounderSimulationHandlerResult({
  rawResult: {
    report: {
      reportMarkdown: '',
      unifiedSummary: {
        whatWorks: undefined,
        whatIsBroken: undefined,
        launchBlockers: undefined,
      },
      v4: {
        launchVerdictGovernance: {
          launchVerdictReady: true,
          launchVerdict: 'READY',
          governanceVerdict: 'SATISFIED',
          requiredEvidenceMissing: [],
          blockingAuthorities: [],
          satisfiedRules: [],
          failedRules: [],
          governanceReasoning: [],
        },
        chatIntelligenceReality: {
          failedScenarios: undefined,
          founderProofNotes: undefined,
        },
      },
    },
  },
  degraded: true,
  completionEvent: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  originalError: 'V5 exceeded stage budget',
  elapsedMs: 120000,
  skipHistoryRecording: true,
});

assert(
  '6. founder simulation can still complete with warnings for unrelated reasons',
  unrelatedWarnings.guardAssessment.guardedResult.guard.degraded &&
    unrelatedWarnings.guardAssessment.guardedResult.guard.completionEvent ===
      FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS &&
    (unrelatedWarnings.diagnosticMarkdown?.includes('V5 exceeded stage budget') ?? false),
  unrelatedWarnings.guardAssessment.guardedResult.guard.originalError ?? 'null',
);

const cleanCompletion = detectFounderSimulationCompletion({
  resultProduced: true,
  degraded: false,
  budgetExceeded: false,
  errorMessage: null,
  elapsedMs: 90000,
});
assert(
  'founder simulation clean completion still available',
  cleanCompletion.eventId === FOUNDER_SIMULATION_COMPLETE ||
    cleanCompletion.eventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  cleanCompletion.eventId,
);

const failed = results.filter((entry) => !entry.passed);
const passToken =
  failed.length === 0 ? FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS : null;

const validationMarkdown = [
  '# Founder Simulation Guarded Diagnostic Source Patch Validation',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `Pass token: ${passToken ?? 'NONE'}`,
  '',
  '## Checks',
  '',
  ...results.map(
    (entry) => `- [${entry.passed ? 'x' : ' '}] **${entry.name}** — ${entry.detail}`,
  ),
].join('\n');

writeFileSync(
  join(ROOT, 'architecture/FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_VALIDATION.md'),
  validationMarkdown,
);

if (failed.length > 0) {
  console.error('Founder simulation guarded diagnostic source patch validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS);
