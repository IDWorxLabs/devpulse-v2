/**
 * UVL Maturity & Verification Hub V1 — validation (leaf mode).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import {
  assessUvlMaturity,
  detectVerificationGaps,
  getLastUvlMaturityAssessment,
  getUnifiedVerificationLabConsolidationOwnership,
  listUvlMaturityHistory,
  MAX_UVL_MATURITY_HISTORY,
  resetUvlMaturityHistoryForTests,
  UVL_MATURITY_VERIFICATION_HUB_V1_PASS_TOKEN,
  UVL_VERIFICATION_SUITE_APPS,
} from '../src/unified-verification-lab/index.js';
import { buildVerificationHubPayload } from '../server/verification-hub-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, '.unified-verification-lab-v1');
const START = Date.now();
const MAX_RUNTIME_MS = 20_000;

const REQUIRED_FILES = [
  'src/unified-verification-lab/uvl-maturity-types.ts',
  'src/unified-verification-lab/uvl-maturity-bounds.ts',
  'src/unified-verification-lab/uvl-maturity-suite-registry.ts',
  'src/unified-verification-lab/uvl-verification-coverage-assessor.ts',
  'src/unified-verification-lab/uvl-verification-gap-detector.ts',
  'src/unified-verification-lab/uvl-verification-confidence.ts',
  'src/unified-verification-lab/uvl-maturity-history.ts',
  'src/unified-verification-lab/uvl-maturity-assessor.ts',
  'server/verification-hub-handler.ts',
] as const;

const REQUIRED_UI_STRINGS = [
  'Verification Hub',
  'Coverage %',
  'Confidence %',
  'Verification Timeline',
  'Verification Gaps',
  'Verification History',
  'Unified Verification Lab',
  '/api/founder/verification-hub',
  'verification-hub-profile-select',
];

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

function main(): void {
  console.log('');
  console.log('UVL Maturity & Verification Hub V1 — Validation');
  console.log('===============================================');
  console.log('');

  resetUvlMaturityHistoryForTests();
  checkpoint('start');

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 1_200_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  const ownership = getUnifiedVerificationLabConsolidationOwnership();
  assert('01. UVL canonical owner', ownership.status === 'CANONICAL', ownership.capability);
  assert('02. package script', Boolean(pkg.scripts?.['validate:uvl-maturity-verification-hub-v1']), 'script');
  assert('03. operator section', manifest.includes("'Verification Hub'"), 'manifest');
  assert('04. server route', serverTs.includes('/api/founder/verification-hub'), 'route');
  assert(
    '05. no separate verification authority module',
    !existsSync(join(ROOT, 'src/verification-authority')),
    'absent',
  );

  for (const uiString of REQUIRED_UI_STRINGS) {
    assert(`06. UI string ${uiString}`, appJs.includes(uiString), uiString);
  }

  assert('07. suite app count', UVL_VERIFICATION_SUITE_APPS.length === 12, String(UVL_VERIFICATION_SUITE_APPS.length));

  for (const suiteApp of UVL_VERIFICATION_SUITE_APPS) {
    resetUvlMaturityHistoryForTests();
    const assessment = assessUvlMaturity({
      profile: suiteApp.profile,
      productPrompt: suiteApp.prompt,
    });
    assert(`${suiteApp.profile}: profile`, assessment.profile === suiteApp.profile, assessment.profile);
    assert(`${suiteApp.profile}: product name`, assessment.productName === suiteApp.productName, assessment.productName);
    assert(
      `${suiteApp.profile}: category count`,
      assessment.categoryCoverage.length === 6,
      String(assessment.categoryCoverage.length),
    );
    assert(
      `${suiteApp.profile}: coverage bounded`,
      assessment.overallCoveragePercent >= 0 && assessment.overallCoveragePercent <= 100,
      String(assessment.overallCoveragePercent),
    );
    assert(
      `${suiteApp.profile}: confidence bounded`,
      assessment.verificationConfidenceScore >= 0 && assessment.verificationConfidenceScore <= 100,
      String(assessment.verificationConfidenceScore),
    );
    assert(
      `${suiteApp.profile}: timeline`,
      assessment.timeline.length === 6,
      String(assessment.timeline.length),
    );
    assert(
      `${suiteApp.profile}: gaps detected`,
      assessment.verificationGapReport.gaps.length > 0,
      String(assessment.verificationGapReport.gaps.length),
    );
    assert(
      `${suiteApp.profile}: detectVerificationGaps`,
      detectVerificationGaps({
        categoryCoverage: assessment.categoryCoverage,
        timeline: assessment.timeline,
      }).gaps.length > 0,
      'gaps',
    );
    checkpoint(`suite ${suiteApp.profile}`);
  }

  resetUvlMaturityHistoryForTests();
  for (let i = 0; i < MAX_UVL_MATURITY_HISTORY + 5; i += 1) {
    assessUvlMaturity({ profile: 'CRM_WEB_V1' });
  }
  assert(
    '08. history bounded',
    listUvlMaturityHistory().length <= MAX_UVL_MATURITY_HISTORY,
    String(listUvlMaturityHistory().length),
  );

  const hubPayload = buildVerificationHubPayload({ profile: 'CRM_WEB_V1' });
  assert('09. hub payload read only', hubPayload.readOnly === true, 'readOnly');
  assert('10. hub history present', hubPayload.history.length > 0, String(hubPayload.history.length));
  assert('11. hub assessment cached', Boolean(getLastUvlMaturityAssessment()), 'assessment');

  const aflaEvidence = collectFounderLaunchEvidence({
    productPrompt: UVL_VERIFICATION_SUITE_APPS[0].prompt,
    profile: UVL_VERIFICATION_SUITE_APPS[0].profile,
  });
  assert('12. AFLA consumes verification hub', Boolean(aflaEvidence.verificationHub), 'hub');
  assert(
    '13. AFLA gap summary',
    (aflaEvidence.verificationHub?.gapSummary.length ?? 0) > 0,
    String(aflaEvidence.verificationHub?.gapSummary.length ?? 0),
  );
  assert(
    '14. AFLA incomplete flag',
    aflaEvidence.verificationHub?.incompleteVerification === true,
    String(aflaEvidence.verificationHub?.incompleteVerification),
  );

  const lastAssessment = getLastUvlMaturityAssessment();
  if (lastAssessment) {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), JSON.stringify(lastAssessment, null, 2), 'utf8');
    assert('15. assessment artifact', existsSync(join(ARTIFACT_DIR, 'assessment.json')), 'written');
  }

  const failed = results.filter((result) => !result.passed);
  console.log('');
  for (const result of results) {
    const mark = result.passed ? '✓' : '✗';
    console.log(`${mark} ${result.name} — ${result.detail}`);
  }
  console.log('');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  console.log('');

  if (failed.length > 0) {
    console.error('UVL Maturity & Verification Hub V1 — FAILED');
    process.exit(1);
  }

  console.log(UVL_MATURITY_VERIFICATION_HUB_V1_PASS_TOKEN);
  process.exit(0);
}

main();
