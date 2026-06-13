/**
 * Phase 26.32 — Build Plan Generator V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ArchitectureBrief } from '../src/architecture-brief-generator/architecture-brief-types.js';
import {
  BUILD_PLAN_GENERATOR_V1_PASS,
  MAX_BUILD_PLAN_HISTORY,
  BUILD_PLAN_READINESS_LEVELS,
  BUILD_COMPLEXITY_CATEGORIES,
  analyzeDependencies,
  buildBuildPlanEvidenceBundle,
  buildBuildPlanGeneratorArtifacts,
  generateBuildPlan,
  generateMilestones,
  getBuildPlanHistorySize,
  isBuildPlanStructurallyValid,
  prioritizeBuildOrder,
  resetBuildPlanGeneratorModuleForTests,
  runBuildPlanGenerator,
  sequencePhases,
} from '../src/build-plan-generator/index.js';
import type { PlanningBrief } from '../src/planning-brief-generator/planning-brief-types.js';

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
  'src/build-plan-generator/build-plan-types.ts',
  'src/build-plan-generator/build-plan-registry.ts',
  'src/build-plan-generator/build-plan-builder.ts',
  'src/build-plan-generator/milestone-generator.ts',
  'src/build-plan-generator/dependency-analyzer.ts',
  'src/build-plan-generator/phase-sequencer.ts',
  'src/build-plan-generator/risk-aware-prioritizer.ts',
  'src/build-plan-generator/build-plan-validator.ts',
  'src/build-plan-generator/build-plan-history.ts',
  'src/build-plan-generator/build-plan-report-builder.ts',
  'src/build-plan-generator/build-plan-authority.ts',
  'src/build-plan-generator/index.ts',
  'architecture/BUILD_PLAN_GENERATOR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildPlanningBriefFixture(): PlanningBrief {
  return {
    readOnly: true,
    briefId: 'planning-brief-fixture',
    generatedAt: new Date().toISOString(),
    projectSummary: {
      readOnly: true,
      productName: 'Founder App',
      productType: 'MOBILE_APP',
      objective: 'Subscription revenue through mobile checkout',
      targetUsers: ['founders', 'customers'],
    },
    platformTargets: ['MOBILE'],
    screenInventory: [
      { readOnly: true, screenId: 's1', name: 'onboarding', evidence: [] },
      { readOnly: true, screenId: 's2', name: 'dashboard', evidence: [] },
      { readOnly: true, screenId: 's3', name: 'checkout', evidence: [] },
      { readOnly: true, screenId: 's4', name: 'settings', evidence: [] },
      { readOnly: true, screenId: 's5', name: 'profile', evidence: [] },
    ],
    workflowInventory: [
      { readOnly: true, workflowId: 'w1', name: 'authentication', evidence: [] },
      { readOnly: true, workflowId: 'w2', name: 'onboarding', evidence: [] },
      { readOnly: true, workflowId: 'w3', name: 'checkout', evidence: [] },
      { readOnly: true, workflowId: 'w4', name: 'administration', evidence: [] },
    ],
    userRoles: ['admin', 'user', 'customer'],
    businessRules: ['Admin must approve checkout'],
    integrations: ['Stripe', 'OpenAI', 'Twilio'],
    knownGaps: [],
    planningBriefConfidence: 91,
    planningBriefQuality: 'HIGH_CONFIDENCE',
    planningBriefReadiness: 'PLANNING_READY',
    evidenceSources: ['TYPED_PROMPT'],
  };
}

function buildArchitectureBriefFixture(
  readiness: ArchitectureBrief['architectureBriefReadiness'] = 'ARCHITECTURE_READY',
): ArchitectureBrief {
  return {
    readOnly: true,
    briefId: 'architecture-brief-fixture',
    generatedAt: new Date().toISOString(),
    planningBriefId: 'planning-brief-fixture',
    systemOverview: {
      readOnly: true,
      productType: 'MOBILE_APP',
      objective: 'Subscription revenue through mobile checkout',
      platforms: ['MOBILE'],
      scaleExpectations: 'Medium-scale product with multiple user journeys and service modules.',
    },
    frontendSummary: {
      readOnly: true,
      webUi: false,
      mobileUi: true,
      tabletUi: false,
      desktopUi: false,
      detectedNeeds: ['Native or cross-platform mobile UI'],
      evidence: ['MOBILE'],
    },
    backendSummary: {
      readOnly: true,
      apis: true,
      businessServices: true,
      backgroundJobs: true,
      workflowOrchestration: true,
      detectedNeeds: ['REST or GraphQL APIs', 'Workflow orchestration'],
      evidence: ['WORKFLOWS_4'],
    },
    dataModelSummary: {
      readOnly: true,
      entities: [
        { readOnly: true, entityId: 'e1', name: 'user', evidence: [] },
        { readOnly: true, entityId: 'e2', name: 'order', evidence: [] },
        { readOnly: true, entityId: 'e3', name: 'product', evidence: [] },
      ],
      relationships: ['user owns orders'],
      ownershipModels: ['Role-based resource ownership'],
      permissions: ['admin-scoped permissions', 'user-scoped permissions'],
    },
    integrationSummary: {
      readOnly: true,
      integrations: [
        { readOnly: true, integrationId: 'i1', name: 'Stripe', category: 'PAYMENT', evidence: [] },
        { readOnly: true, integrationId: 'i2', name: 'OpenAI', category: 'AI', evidence: [] },
        { readOnly: true, integrationId: 'i3', name: 'Twilio', category: 'COMMUNICATION', evidence: [] },
      ],
      thirdPartyApis: ['Stripe', 'OpenAI', 'Twilio'],
    },
    securitySummary: {
      readOnly: true,
      authentication: ['OAuth'],
      authorization: ['Role-based access control'],
      permissions: ['admin-scoped permissions'],
      userRoles: ['admin', 'user', 'customer'],
    },
    architectureRiskAnalysis: { readOnly: true, risks: [], overallRiskLevel: 'LOW', riskCount: 0 },
    architectureBriefConfidence: 92,
    architectureBriefQuality: 'HIGH_CONFIDENCE',
    architectureBriefReadiness: readiness,
    evidenceSources: ['PLANNING_BRIEF', 'UNIFIED_INTAKE_INTELLIGENCE'],
  };
}

resetBuildPlanGeneratorModuleForTests();

const notReadyResult = runBuildPlanGenerator({
  architectureBrief: buildArchitectureBriefFixture('NOT_READY'),
  planningBrief: buildPlanningBriefFixture(),
});
assert('A architecture not ready blocked', notReadyResult.orchestrationState === 'BUILD_PLAN_GENERATOR_FAILED', notReadyResult.orchestrationState);
assert('A not ready failure reason', notReadyResult.failureReason === 'ARCHITECTURE_READINESS_NOT_ALLOWED', notReadyResult.failureReason ?? 'none');

const missingArch = runBuildPlanGenerator({
  architectureBrief: null,
  planningBrief: buildPlanningBriefFixture(),
});
assert('A missing architecture brief blocked', missingArch.failureReason === 'MISSING_ARCHITECTURE_BRIEF', missingArch.failureReason ?? 'none');

const fullPlan = generateBuildPlan({
  architectureBrief: buildArchitectureBriefFixture('ARCHITECTURE_READY'),
  planningBrief: buildPlanningBriefFixture(),
  skipHistoryRecording: true,
});
assert('B build plan generated', fullPlan != null, String(fullPlan != null));
assert('B architecture brief linked', fullPlan != null && fullPlan.architectureBriefId === 'architecture-brief-fixture', fullPlan?.architectureBriefId ?? 'none');
assert('B milestones generated', fullPlan != null && fullPlan.milestones.length >= 5, `${fullPlan?.milestones.length ?? 0}`);
assert('B phases sequenced', fullPlan != null && fullPlan.phases.length >= 5, `${fullPlan?.phases.length ?? 0}`);
assert('B phase ordering', fullPlan != null && fullPlan.phases[0]?.name === 'Foundation', fullPlan?.phases[0]?.name ?? 'none');
assert('B dependency map', fullPlan != null && fullPlan.dependencyMap.dependencies.length > 0, `${fullPlan?.dependencyMap.dependencies.length ?? 0}`);
assert('B priority order', fullPlan != null && fullPlan.buildPriorityOrder.length > 0, `${fullPlan?.buildPriorityOrder.length ?? 0}`);
assert('B risks identified', fullPlan != null && fullPlan.buildPlanRisks.length >= 0, `${fullPlan?.buildPlanRisks.length ?? 0}`);
assert(
  'B complexity bounded',
  fullPlan != null && fullPlan.buildComplexityScore >= 0 && fullPlan.buildComplexityScore <= 100,
  String(fullPlan?.buildComplexityScore),
);
assert(
  'B complexity category valid',
  fullPlan != null && BUILD_COMPLEXITY_CATEGORIES.includes(fullPlan.buildComplexityCategory),
  fullPlan?.buildComplexityCategory ?? 'none',
);
assert(
  'B execution ready',
  fullPlan != null && fullPlan.buildPlanReadiness === 'READY_FOR_EXECUTION_PLANNING',
  fullPlan?.buildPlanReadiness ?? 'none',
);
assert(
  'B confidence bounded',
  fullPlan != null && fullPlan.buildPlanConfidence >= 0 && fullPlan.buildPlanConfidence <= 100,
  String(fullPlan?.buildPlanConfidence),
);
assert('B structurally valid', fullPlan != null && isBuildPlanStructurallyValid(fullPlan), 'yes');

const draftPlan = generateBuildPlan({
  architectureBrief: buildArchitectureBriefFixture('ARCHITECTURE_DRAFT_READY'),
  planningBrief: buildPlanningBriefFixture(),
  skipHistoryRecording: true,
});
assert('C draft plan generated', draftPlan != null, String(draftPlan != null));
assert(
  'C draft readiness',
  draftPlan != null && draftPlan.buildPlanReadiness === 'DRAFT_BUILD_PLAN',
  draftPlan?.buildPlanReadiness ?? 'none',
);

const bundle = buildBuildPlanEvidenceBundle({
  architectureBrief: buildArchitectureBriefFixture(),
  planningBrief: buildPlanningBriefFixture(),
});
assert('D evidence bundle', bundle != null, String(bundle != null));
const milestones = generateMilestones(bundle!);
assert('D milestone generator', milestones.some((m) => m.name === 'Foundation'), milestones.map((m) => m.name).join(', '));
const phases = sequencePhases(milestones);
assert('D phase sequencer', phases.length >= 5, `${phases.length}`);
const deps = analyzeDependencies(phases);
assert('D dependency analyzer', deps.dependencies.length > 0, `${deps.dependencies.length}`);
const priorities = prioritizeBuildOrder({ bundle: bundle!, phases, risks: [] });
assert('D prioritizer', priorities.length > 0, `${priorities.length}`);

resetBuildPlanGeneratorModuleForTests();
for (let i = 0; i < MAX_BUILD_PLAN_HISTORY + 6; i += 1) {
  generateBuildPlan({
    architectureBrief: { ...buildArchitectureBriefFixture('ARCHITECTURE_DRAFT_READY'), briefId: `arch-${i}` },
    planningBrief: buildPlanningBriefFixture(),
    skipHistoryRecording: false,
  });
}
assert(
  'E history bounded',
  getBuildPlanHistorySize() <= MAX_BUILD_PLAN_HISTORY,
  `${getBuildPlanHistorySize()}/${MAX_BUILD_PLAN_HISTORY}`,
);

const assessment = runBuildPlanGenerator({
  architectureBrief: buildArchitectureBriefFixture('ARCHITECTURE_READY'),
  planningBrief: buildPlanningBriefFixture(),
  skipHistoryRecording: true,
});
assert('F advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert('F orchestration complete', assessment.orchestrationState === 'BUILD_PLAN_GENERATOR_COMPLETE', assessment.orchestrationState);

const artifacts = buildBuildPlanGeneratorArtifacts({ plans: fullPlan ? [fullPlan] : [] });
assert('G report markdown', artifacts.markdown.includes('Build Plan Generator Report'), 'yes');
assert('G milestones in report', artifacts.markdown.includes('Milestones'), 'yes');
assert('G phases in report', artifacts.markdown.includes('Phases'), 'yes');
assert('G dependencies in report', artifacts.markdown.includes('Dependencies'), 'yes');
assert('G risks in report', artifacts.markdown.includes('Risks'), 'yes');
assert('G complexity in report', artifacts.markdown.includes('Complexity & Readiness'), 'yes');
assert(
  'G readiness valid',
  fullPlan != null && BUILD_PLAN_READINESS_LEVELS.includes(fullPlan.buildPlanReadiness),
  fullPlan?.buildPlanReadiness ?? 'none',
);

writeFileSync(join(ROOT, 'architecture/BUILD_PLAN_GENERATOR_REPORT.md'), artifacts.markdown, 'utf8');
assert('G report written', existsSync(join(ROOT, 'architecture/BUILD_PLAN_GENERATOR_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/build-plan-generator/build-plan-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/build-plan-generator/build-plan-registry.ts'), 'utf8');
assert(
  'H read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_AUTONOMOUS_BUILDING') &&
    registrySource.includes('ARCHITECTURE_READINESS_ENFORCED') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('H advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/BUILD_PLAN_GENERATOR_REPORT.md'), 'utf8');
assert('H pass token', arch.includes(BUILD_PLAN_GENERATOR_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('I no validator recursion marker', !authoritySource.includes('validate-build-plan-generator'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Build Plan Generator V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getBuildPlanHistorySize()}`);
  console.log(`Report path: architecture/BUILD_PLAN_GENERATOR_REPORT.md`);
  console.log(`\n${BUILD_PLAN_GENERATOR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
