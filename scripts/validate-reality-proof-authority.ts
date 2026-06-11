/**
 * Phase 25.14 — Reality-Proof Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithCompetitiveReality } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessLaunchReadinessAuthority,
  resetLaunchReadinessHistoryForTests,
} from '../src/launch-readiness-authority/index.js';
import { buildRealUserRealityAuthorityArtifacts } from '../src/real-user-reality-authority/index.js';
import { buildAdoptionPredictionAuthorityArtifacts } from '../src/adoption-prediction-authority/index.js';
import {
  assessRealityProofAuthority,
  buildRealityProofReportMarkdown,
  getRealityProofHistorySize,
  MAX_REALITY_PROOF_HISTORY,
  REALITY_PROOF_AUTHORITY_PASS_TOKEN,
  REALITY_PROOF_REPORT_TITLE,
  resetRealityProofHistoryForTests,
  validateEvidenceClassification,
  validateRealityLevelAssignment,
  validateRealityProofAdvisoryOnly,
  validateRealityProofDeterministicScoring,
  validateRealityProofLaunchBlocking,
  validateRealityProofRecommendationGeneration,
  validateRealityProofScoreCalculation,
  validateRealityRiskCalculation,
} from '../src/reality-proof-authority/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 60_000;

const REQUIRED_FILES = [
  'src/reality-proof-authority/reality-proof-bounds.ts',
  'src/reality-proof-authority/reality-proof-types.ts',
  'src/reality-proof-authority/reality-proof-classifier.ts',
  'src/reality-proof-authority/reality-proof-authority.ts',
  'src/reality-proof-authority/reality-proof-report-builder.ts',
  'src/reality-proof-authority/reality-proof-history.ts',
  'src/reality-proof-authority/reality-proof-validator.ts',
  'src/reality-proof-authority/index.ts',
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

function toWithCompetitiveReality(
  report: ReturnType<typeof runFounderTestingModeV4>,
): FounderTestV4ReportWithCompetitiveReality {
  const {
    reportMarkdown: _reportMarkdown,
    realityProofAuthority: _proof,
    realityProofAuthorityReportMarkdown: _proofMarkdown,
    realUserRealityAuthority: _realUser,
    realUserRealityAuthorityReportMarkdown: _realUserMarkdown,
    adoptionPredictionAuthority: _adoption,
    adoptionPredictionAuthorityReportMarkdown: _adoptionMarkdown,
    launchReadinessAuthority: _launchReadiness,
    launchReadinessAuthorityReportMarkdown: _launchReadinessMarkdown,
    launchCouncil: _launchCouncil,
    launchCouncilReport: _launchCouncilReport,
    launchCouncilReportMarkdown: _launchCouncilMarkdown,
    launchCouncilFinalization: _finalization,
    launchCouncilFinalizationReportMarkdown: _finalizationMarkdown,
    launchVerdictGovernance: _governance,
    launchVerdictGovernanceReportMarkdown: _governanceMarkdown,
    uiReviewerAuthority: _uiReviewer,
    uiReviewerAuthorityReportMarkdown: _uiReviewerMarkdown,
    clarifyingQuestionIntelligence: _clarifying,
    clarifyingQuestionIntelligenceReportMarkdown: _clarifyingMarkdown,
    ...withCompetitiveReality
  } = report;
  return withCompetitiveReality;
}

function main(): void {
  console.log('');
  console.log('Reality-Proof Authority — Validation (leaf mode)');
  console.log('==============================================');
  console.log('');

  resetRealityProofHistoryForTests();
  resetLaunchReadinessHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const v4 = runFounderTestingModeV4();
  const input = toWithCompetitiveReality(v4);
  resetRealityProofHistoryForTests();
  const first = assessRealityProofAuthority(input);
  resetRealityProofHistoryForTests();
  const second = assessRealityProofAuthority(input);

  assert(
    '01. scoring',
    first.realityProofScore >= 0 &&
      first.realityProofScore <= 100 &&
      first.realityRiskScore >= 0 &&
      first.realityRiskScore <= 100,
    `${first.realityProofScore}/${first.realityRiskScore}`,
  );

  const deterministic = validateRealityProofDeterministicScoring(first, second);
  assert('02. deterministic output', deterministic.passed, deterministic.detail);

  const classification = validateEvidenceClassification(first.findings);
  assert('03. evidence classification', classification.passed, classification.detail);

  const levels = validateRealityLevelAssignment(first);
  assert('04. reality level assignment', levels.passed, levels.detail);

  const scoreCalc = validateRealityProofScoreCalculation(first);
  assert('05. reality proof score calculation', scoreCalc.passed, scoreCalc.detail);

  const risk = validateRealityRiskCalculation(first);
  assert('06. risk calculation', risk.passed, risk.detail);

  const blocking = validateRealityProofLaunchBlocking(first);
  assert('07. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateRealityProofRecommendationGeneration(first);
  assert('08. recommendation generation', recommendations.passed, recommendations.detail);

  const advisory = validateRealityProofAdvisoryOnly(first);
  assert('09. advisory-only behavior', advisory.passed, advisory.detail);

  assert(
    '10. assumptions surfaced',
    first.assumedRealityCount >= 0 && first.findings.some((finding) => finding.evidenceLevel === 'INFERRED_REALITY'),
    `assumed=${first.assumedRealityCount}`,
  );

  const markdown = buildRealityProofReportMarkdown(first, input.generatedAt);
  assert('11. report generation', markdown.includes(`# ${REALITY_PROOF_REPORT_TITLE}`), 'title');
  assert(
    '12. report sections',
    markdown.includes('## Reality Proof Summary') &&
      markdown.includes('## Execution Proof') &&
      markdown.includes('## Reality Proof Verdict'),
    'sections',
  );

  resetRealityProofHistoryForTests();
  assessRealityProofAuthority(input);
  assessRealityProofAuthority(input);
  assert(
    '13. bounded history',
    getRealityProofHistorySize() <= MAX_REALITY_PROOF_HISTORY,
    String(getRealityProofHistorySize()),
  );
  assert('14. stable cache key prefix', first.cacheKey.startsWith('reality-proof-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('15. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '16. reality proof authority registered',
    authorities.some((entry) => entry.authorityId === 'reality-proof-authority'),
    'reality-proof-authority',
  );

  const withRealityProof = { ...input, realityProofAuthority: first, realityProofAuthorityReportMarkdown: markdown };
  const withRealUser = { ...withRealityProof, ...buildRealUserRealityAuthorityArtifacts(withRealityProof) };
  const withAdoption = { ...withRealUser, ...buildAdoptionPredictionAuthorityArtifacts(withRealUser) };
  resetLaunchReadinessHistoryForTests();
  const launchReadiness = assessLaunchReadinessAuthority(withAdoption);
  assert(
    '17. launch readiness integration',
    launchReadiness.recommendation !== 'READY_FOR_PUBLIC_LAUNCH' || !first.blocksLaunchReadiness,
    `${launchReadiness.recommendation}; proofBlocks=${first.blocksLaunchReadiness}`,
  );
  assert(
    '18. launch readiness consumes reality proof',
    launchReadiness.blockers.includes('Reality-Proof Authority') === first.blocksLaunchReadiness ||
      (!first.blocksLaunchReadiness && !launchReadiness.blockers.includes('Reality-Proof Authority')),
    String(launchReadiness.blockers.includes('Reality-Proof Authority')),
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const launchReadinessSource = readFileSync(join(ROOT, 'src/launch-readiness-authority/launch-readiness-authority.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/reality-proof-authority/reality-proof-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('19. founder test integration', reportBuilder.includes('buildRealityProofAuthorityArtifacts'), 'report builder');
  assert('20. founder test report section', reportBuilder.includes('## Reality-Proof Authority'), 'markdown section');
  assert('21. founder ui panel', appJs.includes('Reality-Proof Authority'), 'app.js');
  assert(
    '22. launch readiness reality gate',
    launchReadinessSource.includes('realityProofAuthority.blocksLaunchReadiness'),
    'gate',
  );
  assert('23. npm script', Boolean(pkg.scripts?.['validate:reality-proof-authority']), 'package script');
  assert('24. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('25. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('26. v4 report includes reality proof', Boolean(v4.realityProofAuthority), 'assembled report');

  checkpoint('complete');

  const failed = results.filter((item) => !item.passed);
  console.log(`Scenarios: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`  ✗ ${item.name}: ${item.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(REALITY_PROOF_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:reality-proof-authority');
}

main();
