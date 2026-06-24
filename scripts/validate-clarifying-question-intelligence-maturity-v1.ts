/**
 * Clarifying Question Intelligence Maturity V1 — validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessCqiMaturity,
  CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN,
  detectCqiProductDomain,
  detectRequirementGaps,
  FORBIDDEN_GENERIC_QUESTIONS,
  generateAdaptiveQuestions,
  getClarifyingQuestionConsolidationOwnership,
  REQUIREMENT_CONFIDENCE_THRESHOLD,
  resetCqiMaturityHistoryForTests,
  validateQuestionQuality,
} from '../src/clarifying-question-intelligence/index.js';
import { buildRequirementDiscoveryPayload } from '../server/requirement-discovery-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 15_000;

const DOMAIN_PROMPTS: Record<string, string> = {
  CRM: 'Build me a CRM.',
  MARKETPLACE: 'Build me a marketplace for buyers and sellers.',
  INVENTORY: 'Build me an inventory system.',
  SCHOOL_MANAGEMENT: 'Build me a school management system.',
  PROJECT_MANAGEMENT: 'Build me a project management system.',
  BOOKING_PLATFORM: 'Build me a booking platform.',
  RESTAURANT_POS: 'Build me a restaurant POS.',
  LEARNING_PLATFORM: 'Build me a learning platform.',
};

const REQUIRED_FILES = [
  'src/clarifying-question-intelligence/cqi-maturity-types.ts',
  'src/clarifying-question-intelligence/cqi-maturity-bounds.ts',
  'src/clarifying-question-intelligence/cqi-domain-registry.ts',
  'src/clarifying-question-intelligence/cqi-requirement-gap-detector.ts',
  'src/clarifying-question-intelligence/cqi-coverage-matrix.ts',
  'src/clarifying-question-intelligence/cqi-adaptive-question-generator.ts',
  'src/clarifying-question-intelligence/cqi-maturity-assessor.ts',
  'server/requirement-discovery-handler.ts',
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

function main(): void {
  console.log('');
  console.log('Clarifying Question Intelligence Maturity V1 — Validation');
  console.log('=========================================================');
  console.log('');

  resetCqiMaturityHistoryForTests();
  checkpoint('start');

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 900_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  const ownership = getClarifyingQuestionConsolidationOwnership();
  assert('01. CQI canonical owner', ownership.status === 'CANONICAL', ownership.capability);
  assert('02. package script', Boolean(pkg.scripts?.['validate:clarifying-question-intelligence-maturity-v1']), 'script');
  assert('03. operator section', manifest.includes("'Requirement Discovery'"), 'manifest');
  assert('04. operator UI', appJs.includes('Requirement Discovery') && appJs.includes('/api/founder/requirement-discovery'), 'ui');
  assert('05. no new requirements authority', !existsSync(join(ROOT, 'src/requirements-authority')), 'absent');
  assert(
    '06. no requirement completeness v2 module',
    !existsSync(join(ROOT, 'src/requirement-completeness-v2')),
    'absent',
  );

  const domainQuestions = new Map<string, Set<string>>();
  for (const [domain, prompt] of Object.entries(DOMAIN_PROMPTS)) {
    resetCqiMaturityHistoryForTests();
    const assessment = assessCqiMaturity({ userPrompt: prompt });
    assert(`${domain}: domain detected`, detectCqiProductDomain(prompt) === domain, assessment.productDomain);
    assert(`${domain}: confidence bounded`, assessment.requirementConfidenceScore >= 0 && assessment.requirementConfidenceScore <= 100, String(assessment.requirementConfidenceScore));
    assert(`${domain}: coverage matrix`, assessment.coverageMatrix.length === 12, String(assessment.coverageMatrix.length));
    assert(`${domain}: gaps detected`, assessment.gaps.length > 0, String(assessment.gaps.length));
    assert(`${domain}: open questions`, assessment.openQuestions.length > 0, String(assessment.openQuestions.length));
    assert(`${domain}: questioning required initially`, assessment.questioningRequired === true, String(assessment.questioningRequired));
    assert(`${domain}: cannot proceed initially`, assessment.canProceedToPlanning === false, String(assessment.canProceedToPlanning));

    const quality = validateQuestionQuality(assessment.openQuestions);
    assert(`${domain}: question quality`, quality.valid, quality.forbidden.join('; ') || 'valid');

    domainQuestions.set(
      domain,
      new Set(assessment.openQuestions.map((question) => question.question)),
    );
    checkpoint(`domain ${domain}`);
  }

  const crmQuestions = domainQuestions.get('CRM') ?? new Set<string>();
  const marketplaceQuestions = domainQuestions.get('MARKETPLACE') ?? new Set<string>();
  const overlap = [...crmQuestions].filter((question) => marketplaceQuestions.has(question));
  assert('07. questions differ by domain', overlap.length < crmQuestions.size, `overlap=${overlap.length}`);

  const crmBaseline = assessCqiMaturity({ userPrompt: DOMAIN_PROMPTS.CRM });
  const crmEnriched = assessCqiMaturity({
    userPrompt:
      'Build me a CRM with admin and sales roles, lead management, customer notes, email integration, and sales pipeline stages.',
    resolvedAnswers: [
      'Need lead management',
      'Need customer notes',
      'Need email integration',
      'Need sales pipeline stages',
      'How many user roles exist? Three roles: admin, sales, support',
    ],
  });
  assert(
    '08. confidence improves with answers',
    crmEnriched.requirementConfidenceScore > crmBaseline.requirementConfidenceScore,
    `${crmBaseline.requirementConfidenceScore} -> ${crmEnriched.requirementConfidenceScore}`,
  );

  const fullySpecified = assessCqiMaturity({
    userPrompt:
      'Build a CRM for sales teams with admin manager member roles permissions lead management customer notes email integration sales pipeline stages notifications integrations deployment public launch payments subscription web mobile data storage files workflows business users',
    resolvedAnswers: FORBIDDEN_GENERIC_QUESTIONS.map(() => 'answered'),
  });
  assert(
    '09. planning after sufficient understanding',
    fullySpecified.requirementConfidenceScore >= REQUIREMENT_CONFIDENCE_THRESHOLD || fullySpecified.criticalGapCount === 0,
    `${fullySpecified.requirementConfidenceScore} critical=${fullySpecified.criticalGapCount}`,
  );

  const gaps = detectRequirementGaps({ evidenceText: 'Build me a CRM.', domain: 'CRM' });
  assert('10. detectRequirementGaps export', gaps.length > 0, String(gaps.length));

  const payload = buildRequirementDiscoveryPayload({ prompt: DOMAIN_PROMPTS.CRM });
  assert('11. operator payload', payload.canonicalOwner === 'Clarifying Question Intelligence', payload.canonicalOwner);
  assert('12. operator confidence', payload.confidenceScore >= 0, String(payload.confidenceScore));

  const elapsed = Date.now() - START;
  const failed = results.filter((result) => !result.passed);
  console.log(`Scenarios: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN);
}

try {
  main();
} catch (error) {
  console.error(error);
  console.log('CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_REQUIRES_FIXES');
  process.exit(1);
}
