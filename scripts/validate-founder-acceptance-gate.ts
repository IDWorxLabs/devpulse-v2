/**
 * Phase 24G — Founder Acceptance Gate validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCEPTED_MIN_FOUNDER_TEST_SCORE,
  ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE,
  FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_STATES,
  REQUIRED_ACCEPTANCE_AUTHORITY_IDS,
  assessFounderAcceptanceGate,
  deriveFounderAcceptanceState,
  resetFounderAcceptanceGateModuleForTests,
} from '../src/founder-acceptance-gate/index.js';
import {
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
} from '../src/founder-test-integration/index.js';
import type {
  FounderTestAssessment,
  FounderTestAuthorityId,
  FounderTestAuthorityResult,
  FounderTestVerdict,
} from '../src/founder-test-integration/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/founder-acceptance-gate/founder-acceptance-gate-types.ts',
  'src/founder-acceptance-gate/founder-acceptance-gate-registry.ts',
  'src/founder-acceptance-gate/founder-acceptance-gate-authority.ts',
  'src/founder-acceptance-gate/founder-acceptance-gate-history.ts',
  'src/founder-acceptance-gate/founder-acceptance-gate-report-builder.ts',
  'src/founder-acceptance-gate/index.ts',
  'architecture/FOUNDER_ACCEPTANCE_GATE_REPORT.md',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function buildFixtureAuthorityResult(
  authorityId: FounderTestAuthorityId,
  score: number,
  overrides: Partial<FounderTestAuthorityResult> = {},
): FounderTestAuthorityResult {
  const registration = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.find((entry) => entry.authorityId === authorityId)!;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    authorityId,
    displayName: registration.displayName,
    sourceModule: registration.sourceModule,
    readOnly: true,
    available: true,
    normalizedScore,
    weight: registration.weight,
    weightedContribution: Math.round((normalizedScore * registration.weight) / 100),
    blockers: [],
    warnings: [],
    recommendations: [],
    missingCapabilities: [],
    criticalBlockerCount: 0,
    regressionDetected: false,
    simulationPassed: authorityId === 'FOUNDER_SIMULATION' ? score >= 70 : null,
    executionProofVerdict:
      authorityId === 'EXECUTION_PROOF_EVOLUTION' ? (overrides.executionProofVerdict ?? 'PROVEN_FIXED') : null,
    ...overrides,
  };
}

function buildFixtureAssessment(options: {
  score: number;
  verdict: FounderTestVerdict;
  criticalBlockerCount?: number;
  executionProofRegressionFree?: boolean;
  founderSimulationPassed?: boolean;
  requirementScore?: number;
  authorityOverrides?: Partial<Record<FounderTestAuthorityId, Partial<FounderTestAuthorityResult>>>;
}): FounderTestAssessment {
  const authorityResults = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.map((entry) =>
    buildFixtureAuthorityResult(
      entry.authorityId,
      options.authorityOverrides?.[entry.authorityId]?.normalizedScore ??
        (entry.authorityId === 'REQUIREMENT_REALITY' ? (options.requirementScore ?? 80) : 88),
      options.authorityOverrides?.[entry.authorityId],
    ),
  );

  const weightedOverall = authorityResults.reduce((sum, result) => sum + result.weightedContribution, 0);

  return {
    readOnly: true,
    advisoryOnly: true,
    run: {
      readOnly: true,
      runId: 'fixture-run',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      rootDir: ROOT,
      authorityResults,
    },
    score: {
      overall: options.score ?? weightedOverall,
      byAuthority: Object.fromEntries(authorityResults.map((r) => [r.authorityId, r.normalizedScore])) as FounderTestAssessment['score']['byAuthority'],
      weightedBreakdown: Object.fromEntries(authorityResults.map((r) => [r.authorityId, r.weightedContribution])) as FounderTestAssessment['score']['weightedBreakdown'],
    },
    summary: {
      participatingAuthorities: authorityResults.length,
      availableAuthorities: authorityResults.filter((r) => r.available).length,
      missingAuthorities: authorityResults.filter((r) => !r.available).map((r) => r.displayName),
      criticalBlockerCount: options.criticalBlockerCount ?? 0,
      warningCount: 2,
      recommendationCount: 2,
      founderSimulationPassed: options.founderSimulationPassed ?? true,
      executionProofRegressionFree: options.executionProofRegressionFree ?? true,
      requirementRealityAboveThreshold: (options.requirementScore ?? 80) >= 60,
    },
    verdict: options.verdict,
    findings: [],
    blockers: [],
    warnings: [],
    recommendations: [],
    missingCapabilities: [],
    cacheKey: 'fixture-cache',
  };
}

function main(): void {
  console.log('');
  console.log('Founder Acceptance Gate — Validation (leaf mode)');
  console.log('================================================');
  console.log('');

  checkpoint('start');
  resetFounderAcceptanceGateModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/founder-acceptance-gate/founder-acceptance-gate-authority.ts');
  const registrySource = readText('src/founder-acceptance-gate/founder-acceptance-gate-registry.ts');
  const reportMd = readText('architecture/FOUNDER_ACCEPTANCE_GATE_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:founder-acceptance-gate']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessFounderAcceptanceGate'), 'authority');
  assert('03. five acceptance states', FOUNDER_ACCEPTANCE_STATES.length === 5, String(FOUNDER_ACCEPTANCE_STATES.length));
  assert(
    '04. required authority registrations',
    REQUIRED_ACCEPTANCE_AUTHORITY_IDS.length === 6,
    String(REQUIRED_ACCEPTANCE_AUTHORITY_IDS.length),
  );
  assert('05. report pass token', reportMd.includes(FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN), 'report token');
  assert('06. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('07. no network fetch', !authoritySource.includes('fetch('), 'network');
  assert(
    '08. core question defined',
    registrySource.includes('Would a reasonable founder accept') || authoritySource.includes('FOUNDER_ACCEPTANCE_CORE_QUESTION'),
    'question',
  );
  checkpoint('static checks');

  const acceptedAssessment = buildFixtureAssessment({
    score: 91,
    verdict: 'FOUNDER_READY',
    requirementScore: 88,
    founderSimulationPassed: true,
    executionProofRegressionFree: true,
  });
  const accepted = assessFounderAcceptanceGate({ founderTestAssessment: acceptedAssessment });
  assert(
    '09. accepted scenario',
    accepted.acceptanceState === 'ACCEPTED' &&
      accepted.acceptanceConfidence > 0 &&
      accepted.reasons.acceptedBecause.length > 0,
    `${accepted.acceptanceState} confidence=${accepted.acceptanceConfidence}`,
  );

  resetFounderAcceptanceGateModuleForTests();
  const warningAssessment = buildFixtureAssessment({
    score: 78,
    verdict: 'FOUNDER_READY_WITH_WARNINGS',
    requirementScore: 72,
    founderSimulationPassed: true,
    executionProofRegressionFree: true,
  });
  const warning = assessFounderAcceptanceGate({ founderTestAssessment: warningAssessment });
  assert(
    '10. warning scenario',
    warning.acceptanceState === 'ACCEPTED_WITH_WARNINGS' &&
      warning.acceptanceConfidence > 0 &&
      warning.reasons.warningReasons.length > 0,
    `${warning.acceptanceState} confidence=${warning.acceptanceConfidence}`,
  );

  resetFounderAcceptanceGateModuleForTests();
  const rejectedAssessment = buildFixtureAssessment({
    score: 55,
    verdict: 'NOT_FOUNDER_READY',
    requirementScore: 50,
    founderSimulationPassed: false,
    executionProofRegressionFree: true,
  });
  const rejected = assessFounderAcceptanceGate({ founderTestAssessment: rejectedAssessment });
  assert(
    '11. rejected scenario',
    rejected.acceptanceState === 'NOT_ACCEPTED' && rejected.reasons.rejectedBecause.length > 0,
    rejected.acceptanceState,
  );

  resetFounderAcceptanceGateModuleForTests();
  const blockedAssessment = buildFixtureAssessment({
    score: 88,
    verdict: 'BLOCKED',
    criticalBlockerCount: 1,
    authorityOverrides: {
      FOUNDER_REALITY: {
        criticalBlockerCount: 1,
        blockers: ['Critical workflow continuity break'],
      },
    },
  });
  const blocked = assessFounderAcceptanceGate({ founderTestAssessment: blockedAssessment });
  assert(
    '12. blocked scenario',
    blocked.acceptanceState === 'BLOCKED' && blocked.reasons.blockingReasons.length > 0,
    blocked.acceptanceState,
  );

  resetFounderAcceptanceGateModuleForTests();
  const insufficientAssessment = buildFixtureAssessment({
    score: 80,
    verdict: 'INSUFFICIENT_EVIDENCE',
    authorityOverrides: {
      FOUNDER_SIMULATION: { available: false },
      EXECUTION_PROOF_EVOLUTION: { available: false },
      REQUIREMENT_REALITY: { available: false },
    },
  });
  const insufficient = assessFounderAcceptanceGate({ founderTestAssessment: insufficientAssessment });
  assert(
    '13. insufficient evidence scenario',
    insufficient.acceptanceState === 'INSUFFICIENT_EVIDENCE',
    insufficient.acceptanceState,
  );

  assert(
    '14. acceptance thresholds in registry',
    registrySource.includes(String(ACCEPTED_MIN_FOUNDER_TEST_SCORE)) &&
      registrySource.includes(String(ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE)),
    'thresholds',
  );

  assert(
    '15. derive acceptance state exported',
    deriveFounderAcceptanceState({
      founderTestVerdict: 'FOUNDER_READY',
      founderTestScore: 91,
      criticalBlockerCount: 0,
      executionProofRegressionFree: true,
      founderSimulationPassed: true,
      requirementRealityAboveThreshold: true,
      missingRequiredAuthorities: [],
    }) === 'ACCEPTED',
    'derive',
  );

  resetFounderAcceptanceGateModuleForTests();
  const live = assessFounderAcceptanceGate({ rootDir: ROOT });
  checkpoint('live assessment');
  assert(
    '16. live assessment executes',
    FOUNDER_ACCEPTANCE_STATES.includes(live.acceptanceState) &&
      live.acceptanceConfidence >= 0 &&
      live.acceptanceConfidence <= 100,
    `${live.acceptanceState} confidence=${live.acceptanceConfidence}`,
  );
  assert(
    '17. live required authorities consumed',
    live.inputSnapshot.requiredAuthorities.length === REQUIRED_ACCEPTANCE_AUTHORITY_IDS.length,
    String(live.inputSnapshot.requiredAuthorities.length),
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('FOUNDER_ACCEPTANCE_GATE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN);
  console.log('');
  console.log('Scenario states:');
  console.log(`  ACCEPTED:               ${accepted.acceptanceState} (${accepted.acceptanceConfidence}/100)`);
  console.log(`  ACCEPTED_WITH_WARNINGS: ${warning.acceptanceState} (${warning.acceptanceConfidence}/100)`);
  console.log(`  NOT_ACCEPTED:           ${rejected.acceptanceState}`);
  console.log(`  BLOCKED:                ${blocked.acceptanceState}`);
  console.log(`  INSUFFICIENT_EVIDENCE:  ${insufficient.acceptanceState}`);
  console.log(`  Live repo:              ${live.acceptanceState} (${live.acceptanceConfidence}/100)`);
  console.log('');
  console.log('Report: architecture/FOUNDER_ACCEPTANCE_GATE_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
