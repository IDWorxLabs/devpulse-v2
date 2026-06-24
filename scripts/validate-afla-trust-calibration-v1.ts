/**
 * AFLA Trust Calibration V1 — validation (leaf mode).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAflaTrustCalibration,
  AFLA_TRUST_CALIBRATION_V1_PASS_TOKEN,
  detectFalsePositives,
  FOUNDER_TRUST_CALIBRATION_SUITE_APPS,
  getLastAflaTrustCalibrationAssessment,
  listAflaTrustCalibrationHistory,
  MAX_AFLA_TRUST_CALIBRATION_HISTORY,
  resetAflaTrustCalibrationHistoryForTests,
  runVerdictStabilityTest,
  TRUST_SCORE_MIN_SUITE_APPS,
  VERDICT_STABILITY_MAX_VARIANCE,
} from '../src/afla-trust-calibration-v1/index.js';
import { getAutonomousFounderLaunchConsolidationOwnership } from '../src/autonomous-founder-launch-authority/index.js';
import { buildTrustCalibrationPayload } from '../server/afla-trust-calibration-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, '.afla-trust-calibration-v1');
const START = Date.now();
const MAX_RUNTIME_MS = 25_000;

const REQUIRED_FILES = [
  'src/afla-trust-calibration-v1/afla-trust-calibration-types.ts',
  'src/afla-trust-calibration-v1/afla-trust-calibration-bounds.ts',
  'src/afla-trust-calibration-v1/afla-trust-calibration-suite-registry.ts',
  'src/afla-trust-calibration-v1/afla-trust-false-positive-detector.ts',
  'src/afla-trust-calibration-v1/afla-trust-false-negative-detector.ts',
  'src/afla-trust-calibration-v1/afla-trust-verdict-stability.ts',
  'src/afla-trust-calibration-v1/afla-trust-confidence-calibration.ts',
  'src/afla-trust-calibration-v1/afla-trust-reviewer-alignment.ts',
  'src/afla-trust-calibration-v1/afla-trust-score.ts',
  'src/afla-trust-calibration-v1/afla-trust-calibration-history.ts',
  'src/afla-trust-calibration-v1/afla-trust-calibration-assessor.ts',
  'src/autonomous-founder-launch-authority/founder-launch-decision-explainability.ts',
  'server/afla-trust-calibration-handler.ts',
] as const;

const REQUIRED_UI_STRINGS = [
  'Founder Trust Calibration',
  'Trust Score',
  'False Positives',
  'False Negatives',
  'Confidence Accuracy',
  'Reviewer Alignment',
  'Calibration History',
  'Decision Summary',
  'Reason For Verdict',
  '/api/founder/trust-calibration',
  'trust-calibration-profile-select',
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
  console.log('AFLA Trust Calibration V1 — Validation');
  console.log('========================================');
  console.log('');

  resetAflaTrustCalibrationHistoryForTests();
  checkpoint('start');

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 1_400_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  const ownership = getAutonomousFounderLaunchConsolidationOwnership();
  assert('01. AFLA canonical owner', ownership.status === 'CANONICAL', ownership.capability);
  assert('02. package script', Boolean(pkg.scripts?.['validate:afla-trust-calibration-v1']), 'script');
  assert('03. operator section', manifest.includes("'Founder Trust Calibration'"), 'manifest');
  assert('04. server route', serverTs.includes('/api/founder/trust-calibration'), 'route');
  assert(
    '05. no separate launch decision authority',
    !existsSync(join(ROOT, 'src/launch-decision-authority')),
    'absent',
  );

  for (const uiString of REQUIRED_UI_STRINGS) {
    assert(`06. UI string ${uiString}`, appJs.includes(uiString), uiString);
  }

  assert(
    '07. suite app count',
    FOUNDER_TRUST_CALIBRATION_SUITE_APPS.length >= TRUST_SCORE_MIN_SUITE_APPS,
    String(FOUNDER_TRUST_CALIBRATION_SUITE_APPS.length),
  );

  for (const suiteApp of FOUNDER_TRUST_CALIBRATION_SUITE_APPS) {
    resetAflaTrustCalibrationHistoryForTests();
    const calibration = assessAflaTrustCalibration({
      profile: suiteApp.profile,
      productPrompt: suiteApp.prompt,
    });

    assert(`${suiteApp.profile}: profile`, calibration.profile === suiteApp.profile, calibration.profile);
    assert(`${suiteApp.profile}: trust score bounded`, calibration.aflaTrustScore >= 0 && calibration.aflaTrustScore <= 100, String(calibration.aflaTrustScore));
    assert(`${suiteApp.profile}: stability runs`, calibration.verdictStability.runCount === 3, String(calibration.verdictStability.runCount));
    assert(`${suiteApp.profile}: verdict stable`, calibration.verdictStability.verdictStable === true, String(calibration.verdictStability.verdictStable));
    assert(
      `${suiteApp.profile}: score variance`,
      calibration.verdictStability.scoreVariance <= VERDICT_STABILITY_MAX_VARIANCE,
      String(calibration.verdictStability.scoreVariance),
    );
    assert(
      `${suiteApp.profile}: explainability`,
      Boolean(calibration.launchDecisionExplainability.decisionSummary),
      'summary',
    );
    assert(
      `${suiteApp.profile}: reason for verdict`,
      Boolean(calibration.launchDecisionExplainability.reasonForVerdict),
      'reason',
    );
    assert(
      `${suiteApp.profile}: no false positives on blocked verdict`,
      calibration.assessment.verdict === 'LAUNCH_READY' || calibration.assessment.verdict === 'LAUNCH_READY_WITH_WARNINGS'
        ? detectFalsePositives(calibration.assessment).length === calibration.falsePositiveCount
        : calibration.falsePositiveCount === 0,
      String(calibration.falsePositiveCount),
    );
    checkpoint(`suite ${suiteApp.profile}`);
  }

  resetAflaTrustCalibrationHistoryForTests();
  for (let i = 0; i < MAX_AFLA_TRUST_CALIBRATION_HISTORY + 5; i += 1) {
    assessAflaTrustCalibration({ profile: 'CRM_WEB_V1' });
  }
  assert(
    '08. history bounded',
    listAflaTrustCalibrationHistory().length <= MAX_AFLA_TRUST_CALIBRATION_HISTORY,
    String(listAflaTrustCalibrationHistory().length),
  );

  const stability = runVerdictStabilityTest({
    productPrompt: FOUNDER_TRUST_CALIBRATION_SUITE_APPS[0].prompt,
    profile: FOUNDER_TRUST_CALIBRATION_SUITE_APPS[0].profile,
  });
  assert('09. stability test verdicts', stability.verdicts.length === 3, String(stability.verdicts.length));
  assert('10. stability scores identical', stability.scoreVariance === 0, String(stability.scoreVariance));

  const payload = buildTrustCalibrationPayload({ profile: 'CRM_WEB_V1' });
  assert('11. payload read only', payload.readOnly === true, 'readOnly');
  assert('12. payload history', payload.history.length > 0, String(payload.history.length));

  const last = getLastAflaTrustCalibrationAssessment();
  if (last) {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), JSON.stringify(last, null, 2), 'utf8');
    assert('13. assessment artifact', existsSync(join(ARTIFACT_DIR, 'assessment.json')), 'written');
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
    console.error('AFLA Trust Calibration V1 — FAILED');
    process.exit(1);
  }

  console.log(AFLA_TRUST_CALIBRATION_V1_PASS_TOKEN);
  process.exit(0);
}

main();
