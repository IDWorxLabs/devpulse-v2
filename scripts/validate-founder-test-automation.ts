/**
 * Phase 26.26 — Founder Test Reality Sweep Automation V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FounderTestRealitySweepReport } from '../src/founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import {
  FOUNDER_TEST_AUTOMATION_V1_PASS,
  MAX_FOUNDER_TEST_AUTOMATION_HISTORY,
  assessFounderTestAutomation,
  buildFounderTestAutomationArtifacts,
  buildImprovementPath,
  generateImprovementRecommendations,
  getFounderTestAutomationHistorySize,
  mapReadinessCategory,
  prioritizeLaunchBlockers,
  resetFounderTestAutomationHistoryForTests,
  resetFounderTestAutomationModuleForTests,
  runFounderTestAutomation,
} from '../src/founder-test-automation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-test-automation/founder-test-automation-types.ts',
  'src/founder-test-automation/founder-test-automation-registry.ts',
  'src/founder-test-automation/launch-blocker-prioritizer.ts',
  'src/founder-test-automation/recommendation-generator.ts',
  'src/founder-test-automation/improvement-path-builder.ts',
  'src/founder-test-automation/execution-readiness-analyzer.ts',
  'src/founder-test-automation/founder-test-automation-history.ts',
  'src/founder-test-automation/founder-test-automation-report-builder.ts',
  'src/founder-test-automation/founder-test-automation-authority.ts',
  'src/founder-test-automation/index.ts',
  'architecture/FOUNDER_TEST_AUTOMATION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildMockSweep(overrides: Partial<FounderTestRealitySweepReport> = {}): FounderTestRealitySweepReport {
  const base: FounderTestRealitySweepReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Could a founder realistically launch and use this product today?',
    sweepId: 'founder-test-reality-sweep-fixture-1',
    generatedAt: new Date().toISOString(),
    launchReadinessPercent: 58,
    launchRecommendation: 'DO_NOT_RECOMMEND_LAUNCH',
    founderLaunchVerdict: 'NOT_READY_TO_LAUNCH',
    categoryScores: [],
    launchBlockers: [
      {
        readOnly: true,
        blockerId: 'launch-blocker-1',
        severity: 'CRITICAL',
        category: 'EXECUTION_REALITY',
        title: 'Full execution chain not proven',
        explanation: 'Founder execution state: PARTIAL. Missing onboarding and auth proof.',
        sourceAuthority: 'founder-execution-proof',
        recommendedAction: 'Complete real workspace → build → runtime → preview → verification chain before launch.',
        impactRank: 1,
      },
      {
        readOnly: true,
        blockerId: 'launch-blocker-2',
        severity: 'HIGH',
        category: 'FIRST_TIME_USER_EXPERIENCE',
        title: 'Missing onboarding flow',
        explanation: 'First-time users lack onboarding guidance.',
        sourceAuthority: 'first-time-user-reality',
        recommendedAction: 'Create onboarding flow before founder testing again.',
        impactRank: 2,
      },
      {
        readOnly: true,
        blockerId: 'launch-blocker-3',
        severity: 'HIGH',
        category: 'NAVIGATION_REALITY',
        title: 'Navigation score below launch threshold',
        explanation: 'Navigation score 48/100.',
        sourceAuthority: 'ui-reviewer-authority',
        recommendedAction: 'Improve navigation clarity and discoverability.',
        impactRank: 2,
      },
    ],
    launchWarnings: [],
    launchStrengths: [
      {
        readOnly: true,
        strengthId: 'launch-strength-1',
        category: 'FOUNDER_EXPERIENCE',
        explanation: 'Founder test portfolio partially complete.',
        sourceAuthority: 'founder-testing-authority',
        evidenceScore: 72,
      },
    ],
    missingCapabilities: [
      {
        readOnly: true,
        capabilityId: 'missing-capability-1',
        capability: 'OAuth authentication flow',
        category: 'MISSING_CAPABILITY_REALITY',
        sourceAuthority: 'founder-testing-authority',
        launchImpact: 'HIGH',
      },
    ],
    competitiveGaps: [],
    topLaunchRisks: [],
    recommendedLaunchWork: [
      {
        readOnly: true,
        workId: 'launch-work-1',
        action: 'Resolve authentication gap',
        category: 'MISSING_CAPABILITY_REALITY',
        priorityScore: 90,
        sourceAuthority: 'founder-testing-authority',
        founderImpact: 'Unblocks login/signup for founder testing.',
      },
    ],
    topBlockers: [],
    topStrengths: [],
    topMissingCapabilities: [],
    mostImportantNextBuildItems: [],
    inputSnapshot: {
      readOnly: true,
      founderExecutionProofAssessment: null,
      founderTestLaunchReadinessAssessment: null,
      founderTestAssessment: null,
      founderAcceptanceAssessment: null,
      launchCouncilAssessment: null,
      firstTimeUserRealityAssessment: null,
      livePreviewRealityAssessment: null,
      verificationRealityAssessment: null,
      interactiveExplanationsEvaluation: null,
      uiReviewerAssessment: null,
      competitiveRealityAssessment: null,
      missingAuthorities: ['ui-reviewer-authority'],
    },
    blockingReasons: ['Founder execution state: PARTIAL'],
    warningReasons: [],
    cacheKey: 'fixture-cache-key',
  };

  base.topBlockers = base.launchBlockers.slice(0, 2);
  base.topMissingCapabilities = base.missingCapabilities;
  base.mostImportantNextBuildItems = base.recommendedLaunchWork;

  return { ...base, ...overrides };
}

const requirementCompletenessFixture = {
  readOnly: true as const,
  analysisId: 'req-completeness-fixture',
  analyzedAt: new Date().toISOString(),
  evidence: {
    readOnly: true as const,
    sources: ['TYPED_PROMPT'],
    screens: ['dashboard'],
    userRoles: ['user'],
    workflows: [],
    businessRules: [],
    integrations: ['Stripe'],
    notifications: [],
    authentication: ['OAuth'],
    dataEntities: ['user'],
    platformTargets: ['WEB'],
    inferredFlows: [],
    visualComponents: [],
    productType: 'WEB_APP',
  },
  domainResults: [],
  completenessScore: 52,
  completenessCategory: 'PARTIAL' as const,
  readinessScore: 48,
  projectRequirementReadiness: 'NEEDS_CLARIFICATION' as const,
  missingRequirements: [
    {
      readOnly: true as const,
      domain: 'UI_REQUIREMENTS' as const,
      gapId: 'gap-login',
      description: 'LOGIN_OR_SIGNIN_SCREEN_FOR_ONBOARDING_FLOW',
      severity: 'HIGH' as const,
      evidence: ['LOGIN_NOT_DEFINED'],
    },
    {
      readOnly: true as const,
      domain: 'WORKFLOW' as const,
      gapId: 'gap-checkout',
      description: 'CHECKOUT_WORKFLOW_UNDEFINED',
      severity: 'HIGH' as const,
      evidence: ['CHECKOUT_NOT_DEFINED'],
    },
  ],
  riskLevel: 'HIGH' as const,
  confidenceScore: 64,
  clarifyingQuestions: [
    {
      readOnly: true as const,
      question: 'Will users create accounts?',
      category: 'AUTHENTICATION' as const,
      priority: 'CRITICAL' as const,
      evidence: ['LOGIN_NOT_DEFINED'],
    },
  ],
  safeToProceed: false,
} as import('../src/requirement-completeness-intelligence/requirement-completeness-types.js').RequirementCompletenessAnalysis;

resetFounderTestAutomationModuleForTests();
resetFounderTestAutomationHistoryForTests();

const missingSweep = runFounderTestAutomation({});
assert('A missing sweep rejected', missingSweep == null, 'null');

const sweep = buildMockSweep();
const analysis = runFounderTestAutomation({
  founderTestRealitySweepReport: sweep,
  requirementCompletenessAnalysis: requirementCompletenessFixture,
});
assert('B analysis produced', analysis != null, String(analysis != null));

const blockers = prioritizeLaunchBlockers({
  sweepReport: sweep,
  requirementCompletenessAnalysis: requirementCompletenessFixture,
});
assert('C blocker prioritization', blockers.length >= 3, `${blockers.length}`);
assert('C critical blocker present', blockers.some((b) => b.priority === 'CRITICAL'), 'yes');
assert(
  'C impact scores bounded',
  blockers.every(
    (b) =>
      b.launchImpact >= 0 &&
      b.launchImpact <= 100 &&
      b.userImpact >= 0 &&
      b.founderImpact >= 0 &&
      b.confidence >= 0,
  ),
  'yes',
);

const recommendations = generateImprovementRecommendations({
  sweepReport: sweep,
  prioritizedBlockers: blockers,
  requirementCompletenessAnalysis: requirementCompletenessFixture,
});
assert('D recommendations generated', recommendations.length >= 3, `${recommendations.length}`);
assert(
  'D onboarding recommendation',
  recommendations.some((r) => /onboarding/i.test(r.title)),
  recommendations.map((r) => r.title).join(', '),
);
assert(
  'D recommendation groups',
  recommendations.some((r) => r.group === 'UX' || r.group === 'AUTHENTICATION'),
  'yes',
);
assert(
  'D evidence on recommendations',
  recommendations.every((r) => r.rationale.length > 0 && r.expectedImpact.length > 0),
  'yes',
);

const path = buildImprovementPath({
  sweepReport: sweep,
  prioritizedBlockers: blockers,
  recommendations,
});
assert('E improvement path', path.length >= 3, `${path.length}`);
assert('E ordered steps', path[0]?.stepNumber === 1 && path.every((s, i) => s.stepNumber === i + 1), 'yes');
assert('E includes retest step', path.some((s) => /re-run founder testing/i.test(s.action)), 'yes');

assert(
  'F readiness scoring bounded',
  analysis != null &&
    analysis.executionReadiness.readinessScore >= 0 &&
    analysis.executionReadiness.readinessScore <= 100,
  String(analysis?.executionReadiness.readinessScore),
);
assert(
  'F readiness state',
  analysis != null &&
    (analysis.executionReadiness.executionReadinessState === 'NOT_READY' ||
      analysis.executionReadiness.executionReadinessState === 'HIGH_RISK' ||
      analysis.executionReadiness.executionReadinessState === 'READY_WITH_ACTIONS'),
  analysis?.executionReadiness.executionReadinessState ?? 'none',
);
assert(
  'F category mapping',
  analysis != null &&
    mapReadinessCategory(analysis.executionReadiness.readinessScore) ===
      analysis.executionReadiness.readinessCategory,
  analysis?.executionReadiness.readinessCategory ?? 'none',
);

assert(
  'G required information requests',
  analysis != null && analysis.requiredInformationRequests.length >= 1,
  `${analysis?.requiredInformationRequests.length ?? 0}`,
);
assert(
  'G critical question detected',
  analysis != null && analysis.requiredInformationRequests.some((r) => r.priority === 'CRITICAL'),
  'yes',
);

const readySweep = buildMockSweep({
  sweepId: 'founder-test-reality-sweep-fixture-ready',
  launchReadinessPercent: 88,
  founderLaunchVerdict: 'READY_WITH_WARNINGS',
  launchRecommendation: 'RECOMMEND_LAUNCH_WITH_WARNINGS',
  launchBlockers: [
    {
      readOnly: true,
      blockerId: 'launch-blocker-low',
      severity: 'MEDIUM',
      category: 'AI_INTERACTION_REALITY',
      title: 'AI explanations could improve',
      explanation: 'Explanation coverage at 78/100.',
      sourceAuthority: 'interactive-explanations',
      recommendedAction: 'Polish AI explanations before launch.',
      impactRank: 3,
    },
  ],
  topBlockers: [],
  missingCapabilities: [],
  topMissingCapabilities: [],
});
readySweep.topBlockers = readySweep.launchBlockers;

const readyAnalysis = runFounderTestAutomation({
  founderTestRealitySweepReport: readySweep,
  skipHistoryRecording: true,
});
assert(
  'H higher readiness fixture',
  readyAnalysis != null && readyAnalysis.executionReadiness.readinessScore >= 70,
  String(readyAnalysis?.executionReadiness.readinessScore),
);

resetFounderTestAutomationHistoryForTests();
for (let i = 0; i < MAX_FOUNDER_TEST_AUTOMATION_HISTORY + 4; i += 1) {
  runFounderTestAutomation({
    founderTestRealitySweepReport: buildMockSweep({ sweepId: `sweep-${i}` }),
  });
}
assert(
  'I history bounded',
  getFounderTestAutomationHistorySize() <= MAX_FOUNDER_TEST_AUTOMATION_HISTORY,
  `${getFounderTestAutomationHistorySize()}/${MAX_FOUNDER_TEST_AUTOMATION_HISTORY}`,
);

const assessment = assessFounderTestAutomation({
  founderTestRealitySweepReport: sweep,
  skipHistoryRecording: true,
});
assert('J advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert('J orchestration complete', assessment.orchestrationState === 'FOUNDER_TEST_AUTOMATION_COMPLETE', assessment.orchestrationState);

const artifacts = buildFounderTestAutomationArtifacts({
  analyses: analysis ? [analysis] : [],
});
assert('K report markdown', artifacts.markdown.includes('Founder Test Automation Report'), 'yes');
assert('K blockers in report', artifacts.markdown.includes('Prioritized Blockers'), 'yes');
assert('K improvement path in report', artifacts.markdown.includes('Improvement Path'), 'yes');
assert('K required requests in report', artifacts.markdown.includes('Required Information Requests'), 'yes');

writeFileSync(join(ROOT, 'architecture/FOUNDER_TEST_AUTOMATION_REPORT.md'), artifacts.markdown, 'utf8');
assert('K report written', existsSync(join(ROOT, 'architecture/FOUNDER_TEST_AUTOMATION_REPORT.md')), 'yes');

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-test-automation/founder-test-automation-authority.ts'),
  'utf8',
);
const registrySource = readFileSync(join(ROOT, 'src/founder-test-automation/founder-test-automation-registry.ts'), 'utf8');
assert(
  'L read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PLANNING_EXECUTION') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('L advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/FOUNDER_TEST_AUTOMATION_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(FOUNDER_TEST_AUTOMATION_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('M no validator recursion marker', !authoritySource.includes('validate-founder-test-automation'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Founder Test Automation V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getFounderTestAutomationHistorySize()}`);
  console.log(`Report path: architecture/FOUNDER_TEST_AUTOMATION_REPORT.md`);
  console.log(`\n${FOUNDER_TEST_AUTOMATION_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
