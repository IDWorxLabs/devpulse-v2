/**
 * Phase 25.18 — Launch Verdict Governance validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithLaunchCouncilFinalization } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessLaunchVerdictGovernance,
  buildLaunchVerdictGovernanceArtifacts,
  buildLaunchVerdictGovernanceReportMarkdown,
  getLaunchVerdictGovernanceHistorySize,
  LAUNCH_VERDICT_GOVERNANCE_PASS_TOKEN,
  LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE,
  MAX_GOVERNANCE_HISTORY,
  resetLaunchVerdictGovernanceHistoryForTests,
  validateBlockerEnforcement,
  validateEscalationRules,
  validateGovernanceAdvisoryOnly,
  validateGovernanceConfidenceRange,
  validateGovernanceDeterministicScoring,
  validateGovernanceReportGeneration,
  validateGovernanceScoreRange,
  validateMissingEvidenceDetection,
  validateOnlyGovernanceDeclaresPublicLaunch,
  validateRuleEvaluationCounts,
  validateVerdictDerivation,
} from '../src/launch-verdict-governance/index.js';

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
  'src/launch-verdict-governance/launch-verdict-governance-bounds.ts',
  'src/launch-verdict-governance/launch-verdict-governance-types.ts',
  'src/launch-verdict-governance/launch-verdict-governance-authority.ts',
  'src/launch-verdict-governance/launch-verdict-governance-rules.ts',
  'src/launch-verdict-governance/launch-verdict-governance-report-builder.ts',
  'src/launch-verdict-governance/launch-verdict-governance-history.ts',
  'src/launch-verdict-governance/launch-verdict-governance-validator.ts',
  'src/launch-verdict-governance/index.ts',
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

function toWithFinalization(
  report: ReturnType<typeof runFounderTestingModeV4>,
): FounderTestV4ReportWithLaunchCouncilFinalization {
  const {
    reportMarkdown: _reportMarkdown,
    launchVerdictGovernance: _governance,
    launchVerdictGovernanceReportMarkdown: _governanceMarkdown,
    uiReviewerAuthority: _uiReviewer,
    uiReviewerAuthorityReportMarkdown: _uiReviewerMarkdown,
    clarifyingQuestionIntelligence: _clarifying,
    clarifyingQuestionIntelligenceReportMarkdown: _clarifyingMarkdown,
    ...withFinalization
  } = report;
  return withFinalization as FounderTestV4ReportWithLaunchCouncilFinalization;
}

function main(): void {
  console.log('');
  console.log('Launch Verdict Governance — Validation (leaf mode)');
  console.log('================================================');
  console.log('');

  resetLaunchVerdictGovernanceHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const authorities = listLaunchCouncilAuthorities();
  assert('01. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '02. governance authority registered',
    authorities.some((entry) => entry.authorityId === 'launch-verdict-governance'),
    'launch-verdict-governance',
  );
  assert('03. registry count 22', authorities.length === 22, String(authorities.length));

  const v4 = runFounderTestingModeV4();
  const input = toWithFinalization(v4);
  resetLaunchVerdictGovernanceHistoryForTests();
  const first = assessLaunchVerdictGovernance(input);
  resetLaunchVerdictGovernanceHistoryForTests();
  const second = assessLaunchVerdictGovernance(input);

  assert('04. verdict derivation', validateVerdictDerivation(first).passed, first.finalLaunchVerdict);
  assert('05. escalation rules', validateEscalationRules(first).passed, `${first.finalLaunchVerdict}<=${first.verdictEligibility}`);
  assert('06. blocker enforcement', validateBlockerEnforcement(first).passed, first.finalLaunchVerdict);
  assert('07. missing evidence detection', validateMissingEvidenceDetection(first).passed, String(first.requiredEvidenceMissing.length));
  assert('08. governance confidence', validateGovernanceConfidenceRange(first).passed, String(first.governanceConfidence));
  assert('09. governance score', validateGovernanceScoreRange(first).passed, String(first.governanceScore));
  assert('10. rule evaluation counts', validateRuleEvaluationCounts(first).passed, String(first.satisfiedRuleCount));
  assert(
    '11. deterministic output',
    validateGovernanceDeterministicScoring(first, second).passed,
    first.cacheKey,
  );
  assert('12. advisory only', validateGovernanceAdvisoryOnly(first).passed, String(first.advisoryOnly));
  assert(
    '13. only governance public launch',
    validateOnlyGovernanceDeclaresPublicLaunch(first).passed,
    first.finalLaunchVerdict,
  );
  assert(
    '14. public launch not earned without real users',
    first.finalLaunchVerdict !== 'READY_FOR_PUBLIC_LAUNCH' ||
      input.realUserRealityAuthority.realUserEvidenceCount > 0,
    String(input.realUserRealityAuthority.realUserEvidenceCount),
  );

  const markdown = buildLaunchVerdictGovernanceReportMarkdown(first, input);
  assert('15. report generation', validateGovernanceReportGeneration(markdown).passed, LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE);

  resetLaunchVerdictGovernanceHistoryForTests();
  assessLaunchVerdictGovernance(input);
  assessLaunchVerdictGovernance(input);
  assert(
    '16. bounded history',
    getLaunchVerdictGovernanceHistorySize() <= MAX_GOVERNANCE_HISTORY,
    String(getLaunchVerdictGovernanceHistorySize()),
  );
  assert('17. stable cache key prefix', first.cacheKey.startsWith('launch-verdict-governance-v1:'), first.cacheKey);

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/launch-verdict-governance/launch-verdict-governance-authority.ts'), 'utf8');
  const rulesSource = readFileSync(join(ROOT, 'src/launch-verdict-governance/launch-verdict-governance-rules.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('18. founder test integration', reportBuilder.includes('buildLaunchVerdictGovernanceArtifacts'), 'report builder');
  assert('19. founder test report section', reportBuilder.includes('## Launch Verdict Governance'), 'markdown section');
  assert('20. founder ui panel', appJs.includes('Launch Verdict Governance'), 'app.js');
  assert('21. npm script', Boolean(pkg.scripts?.['validate:launch-verdict-governance']), 'package script');
  assert('22. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('23. no random generation', !authoritySource.includes('Math.random') && !rulesSource.includes('Math.random'), 'deterministic');
  assert('24. v4 report includes governance', Boolean(v4.launchVerdictGovernance), 'assembled report');
  assert(
    '25. consumes finalization and readiness',
    first.ruleEvaluations.some((entry) => entry.group === 'READINESS'),
    'readiness rules',
  );
  assert(
    '26. blocking authorities force BLOCKED',
    first.blockingAuthorities.length === 0 || first.finalLaunchVerdict === 'BLOCKED',
    first.finalLaunchVerdict,
  );

  const artifacts = buildLaunchVerdictGovernanceArtifacts(input);
  assert(
    '27. artifact builder',
    artifacts.launchVerdictGovernance.finalLaunchVerdict === first.finalLaunchVerdict,
    artifacts.launchVerdictGovernance.finalLaunchVerdict,
  );

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

  console.log(LAUNCH_VERDICT_GOVERNANCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:launch-verdict-governance');
}

main();
