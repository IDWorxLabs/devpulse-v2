/**
 * Phase 26.31 — Architecture Brief Generator V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARCHITECTURE_BRIEF_GENERATOR_V1_PASS,
  MAX_ARCHITECTURE_BRIEF_HISTORY,
  ARCHITECTURE_BRIEF_QUALITY_LEVELS,
  ARCHITECTURE_BRIEF_READINESS_LEVELS,
  buildArchitectureBriefGeneratorArtifacts,
  buildArchitectureEvidenceBundle,
  detectArchitectureRisks,
  generateArchitectureBrief,
  getArchitectureBriefHistorySize,
  isArchitectureBriefStructurallyValid,
  resetArchitectureBriefGeneratorModuleForTests,
  runArchitectureBriefGenerator,
  summarizeBackendArchitecture,
  summarizeDataModel,
  summarizeFrontendArchitecture,
} from '../src/architecture-brief-generator/index.js';
import type { PlanningGateAnalysis } from '../src/planning-gate-authority/planning-gate-types.js';
import type { PlanningBrief } from '../src/planning-brief-generator/planning-brief-types.js';
import type { UnifiedIntakeAnalysis } from '../src/unified-intake-intelligence/unified-intake-types.js';

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
  'src/architecture-brief-generator/architecture-brief-types.ts',
  'src/architecture-brief-generator/architecture-brief-registry.ts',
  'src/architecture-brief-generator/architecture-brief-builder.ts',
  'src/architecture-brief-generator/frontend-architecture-summarizer.ts',
  'src/architecture-brief-generator/backend-architecture-summarizer.ts',
  'src/architecture-brief-generator/data-model-summarizer.ts',
  'src/architecture-brief-generator/integration-architecture-summarizer.ts',
  'src/architecture-brief-generator/architecture-risk-detector.ts',
  'src/architecture-brief-generator/architecture-brief-validator.ts',
  'src/architecture-brief-generator/architecture-brief-history.ts',
  'src/architecture-brief-generator/architecture-brief-report-builder.ts',
  'src/architecture-brief-generator/architecture-brief-authority.ts',
  'src/architecture-brief-generator/index.ts',
  'architecture/ARCHITECTURE_BRIEF_GENERATOR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildGateFixture(decision: PlanningGateAnalysis['planningGateDecision'], confidence = 80): PlanningGateAnalysis {
  return {
    readOnly: true,
    analysisId: `gate-${decision}`,
    analyzedAt: new Date().toISOString(),
    evidenceSufficiency: { readOnly: true, evidenceSufficiencyScore: 85, dimensions: [], activeSourceCount: 4 },
    planningRiskAnalysis: { readOnly: true, risks: [], overallRiskLevel: 'LOW', riskCount: 0 },
    planningReadiness: {
      readOnly: true,
      planningReadinessScore: decision === 'REJECT_PLANNING' ? 30 : 92,
      planningReadinessCategory: decision === 'REJECT_PLANNING' ? 'NOT_READY' : 'READY_FOR_PLANNING',
    },
    planningGateDecision: decision,
    planningGateExplanation: {
      readOnly: true,
      evidenceUsed: ['TYPED_PROMPT'],
      risksFound: [],
      missingInformation: [],
      confidence,
      summary: 'Gate fixture.',
    },
    planningGateQuestions: [],
    safeToPlan: decision === 'ALLOW_FULL_PLANNING' || decision === 'ALLOW_LIMITED_PLANNING',
  };
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
      { readOnly: true, screenId: 's1', name: 'onboarding', evidence: ['SCREEN:onboarding'] },
      { readOnly: true, screenId: 's2', name: 'dashboard', evidence: ['SCREEN:dashboard'] },
      { readOnly: true, screenId: 's3', name: 'checkout', evidence: ['SCREEN:checkout'] },
      { readOnly: true, screenId: 's4', name: 'settings', evidence: ['SCREEN:settings'] },
      { readOnly: true, screenId: 's5', name: 'profile', evidence: ['SCREEN:profile'] },
    ],
    workflowInventory: [
      { readOnly: true, workflowId: 'w1', name: 'authentication', evidence: ['WORKFLOW:authentication'] },
      { readOnly: true, workflowId: 'w2', name: 'onboarding', evidence: ['WORKFLOW:onboarding'] },
      { readOnly: true, workflowId: 'w3', name: 'checkout', evidence: ['WORKFLOW:checkout'] },
      { readOnly: true, workflowId: 'w4', name: 'administration', evidence: ['WORKFLOW:administration'] },
    ],
    userRoles: ['admin', 'user', 'customer'],
    businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
    integrations: ['Stripe', 'OpenAI', 'Twilio'],
    knownGaps: [],
    planningBriefConfidence: 91,
    planningBriefQuality: 'HIGH_CONFIDENCE',
    planningBriefReadiness: 'PLANNING_READY',
    evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
  };
}

function buildUnifiedIntakeFixture(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'unified-arch-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
      typedPromptExcerpt: 'Build mobile SaaS app',
      platforms: ['IOS', 'ANDROID'],
      screens: ['dashboard', 'onboarding', 'checkout', 'settings', 'profile'],
      workflows: ['onboarding', 'checkout', 'authentication', 'administration'],
      userRoles: ['admin', 'user', 'customer'],
      integrations: ['Stripe', 'OpenAI', 'Twilio'],
      notifications: ['email', 'push notification'],
      authentication: ['OAuth'],
      dataEntities: ['user', 'order', 'product'],
      businessRules: ['Admin must approve checkout'],
      visualComponents: [],
      inferredFlows: ['CHECKOUT'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 2,
      evidenceItemCount: 18,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MOBILE_APP',
      platformTargets: ['IOS', 'ANDROID'],
      primaryPurpose: 'Mobile SaaS',
      targetUsers: ['founders', 'customers'],
      businessObjective: 'Subscription checkout',
      confidence: 90,
      evidence: ['TYPED_PROMPT'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP',
      platforms: ['IOS', 'ANDROID'],
      workflows: ['onboarding', 'checkout', 'authentication', 'administration'],
      screens: ['dashboard', 'onboarding', 'checkout', 'settings', 'profile'],
      userRoles: ['admin', 'user', 'customer'],
      entities: ['user', 'order', 'product'],
      integrations: ['Stripe', 'OpenAI', 'Twilio'],
      businessRules: ['Admin must approve checkout'],
      confidence: 90,
      evidenceSources: ['TYPED_PROMPT'],
    },
    evidenceConflicts: [],
    intakeGaps: [],
    unifiedIntakeConfidence: 90,
    intakeReadinessScore: 92,
    intakeReadinessCategory: 'READY_FOR_PLANNING',
    intakeReadiness: 'READY_FOR_PLANNING',
    intakeRecommendations: [],
  };
}

resetArchitectureBriefGeneratorModuleForTests();

const rejectResult = runArchitectureBriefGenerator({
  planningGateAnalysis: buildGateFixture('REJECT_PLANNING'),
  planningBrief: buildPlanningBriefFixture(),
});
assert('A gate reject blocked', rejectResult.orchestrationState === 'ARCHITECTURE_BRIEF_GENERATOR_FAILED', rejectResult.orchestrationState);
assert('A reject failure reason', rejectResult.failureReason === 'PLANNING_GATE_REJECTED', rejectResult.failureReason ?? 'none');

const clarificationResult = runArchitectureBriefGenerator({
  planningGateAnalysis: buildGateFixture('REQUEST_CLARIFICATION'),
  planningBrief: buildPlanningBriefFixture(),
});
assert(
  'A clarification blocked',
  clarificationResult.failureReason === 'PLANNING_GATE_NOT_ALLOWED_FOR_ARCHITECTURE',
  clarificationResult.failureReason ?? 'none',
);

const missingBrief = runArchitectureBriefGenerator({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING'),
  planningBrief: null,
});
assert('A missing planning brief blocked', missingBrief.failureReason === 'MISSING_PLANNING_BRIEF', missingBrief.failureReason ?? 'none');

const fullBrief = generateArchitectureBrief({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING', 88),
  planningBrief: buildPlanningBriefFixture(),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
  founderContext: {
    readOnly: true,
    founderGoal: 'Launch mobile SaaS',
    businessObjective: 'Enable subscription checkout',
    targetUsers: ['founders', 'customers'],
    constraints: ['Must support Stripe'],
    priorities: ['onboarding', 'checkout'],
  },
  skipHistoryRecording: true,
});
assert('B architecture brief generated', fullBrief != null, String(fullBrief != null));
assert('B planning brief linked', fullBrief != null && fullBrief.planningBriefId === 'planning-brief-fixture', fullBrief?.planningBriefId ?? 'none');
assert('B system overview', fullBrief != null && fullBrief.systemOverview.productType === 'MOBILE_APP', fullBrief?.systemOverview.productType ?? 'none');
assert('B frontend mobile UI', fullBrief != null && fullBrief.frontendSummary.mobileUi === true, String(fullBrief?.frontendSummary.mobileUi));
assert('B backend APIs', fullBrief != null && fullBrief.backendSummary.apis === true, String(fullBrief?.backendSummary.apis));
assert('B backend services', fullBrief != null && fullBrief.backendSummary.businessServices === true, String(fullBrief?.backendSummary.businessServices));
assert('B data entities', fullBrief != null && fullBrief.dataModelSummary.entities.length >= 2, `${fullBrief?.dataModelSummary.entities.length ?? 0}`);
assert('B integrations', fullBrief != null && fullBrief.integrationSummary.integrations.some((i) => i.name === 'Stripe'), 'yes');
assert('B security roles', fullBrief != null && fullBrief.securitySummary.userRoles.includes('admin'), fullBrief?.securitySummary.userRoles.join(', ') ?? 'none');
assert(
  'B confidence bounded',
  fullBrief != null && fullBrief.architectureBriefConfidence >= 0 && fullBrief.architectureBriefConfidence <= 100,
  String(fullBrief?.architectureBriefConfidence),
);
assert(
  'B quality valid',
  fullBrief != null && ARCHITECTURE_BRIEF_QUALITY_LEVELS.includes(fullBrief.architectureBriefQuality),
  fullBrief?.architectureBriefQuality ?? 'none',
);
assert(
  'B architecture ready',
  fullBrief != null && fullBrief.architectureBriefReadiness === 'ARCHITECTURE_READY',
  fullBrief?.architectureBriefReadiness ?? 'none',
);
assert('B structurally valid', fullBrief != null && isArchitectureBriefStructurallyValid(fullBrief), 'yes');

const draftBrief = generateArchitectureBrief({
  planningGateAnalysis: buildGateFixture('ALLOW_LIMITED_PLANNING', 68),
  planningBrief: buildPlanningBriefFixture(),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
  skipHistoryRecording: true,
});
assert('C limited planning brief', draftBrief != null, String(draftBrief != null));
assert(
  'C draft readiness',
  draftBrief != null && draftBrief.architectureBriefReadiness === 'ARCHITECTURE_DRAFT_READY',
  draftBrief?.architectureBriefReadiness ?? 'none',
);

const bundle = buildArchitectureEvidenceBundle({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING'),
  planningBrief: buildPlanningBriefFixture(),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
});
assert('D evidence bundle', bundle != null, String(bundle != null));
assert('D frontend summarizer', summarizeFrontendArchitecture(bundle!).mobileUi === true, 'yes');
assert('D backend summarizer', summarizeBackendArchitecture(bundle!).workflowOrchestration === true, 'yes');
assert('D data summarizer', summarizeDataModel(bundle!).entities.length >= 2, `${summarizeDataModel(bundle!).entities.length}`);

const risks = detectArchitectureRisks({
  bundle: bundle!,
  gateInput: {
    planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING'),
    planningBrief: buildPlanningBriefFixture(),
  },
});
assert('D risk analysis', risks.riskCount >= 0, `${risks.riskCount}`);

resetArchitectureBriefGeneratorModuleForTests();
for (let i = 0; i < MAX_ARCHITECTURE_BRIEF_HISTORY + 6; i += 1) {
  generateArchitectureBrief({
    planningGateAnalysis: buildGateFixture('ALLOW_LIMITED_PLANNING', 70),
    planningBrief: { ...buildPlanningBriefFixture(), briefId: `planning-brief-${i}` },
    unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
    skipHistoryRecording: false,
  });
}
assert(
  'E history bounded',
  getArchitectureBriefHistorySize() <= MAX_ARCHITECTURE_BRIEF_HISTORY,
  `${getArchitectureBriefHistorySize()}/${MAX_ARCHITECTURE_BRIEF_HISTORY}`,
);

const assessment = runArchitectureBriefGenerator({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING', 88),
  planningBrief: buildPlanningBriefFixture(),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
  skipHistoryRecording: true,
});
assert('F advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert(
  'F orchestration complete',
  assessment.orchestrationState === 'ARCHITECTURE_BRIEF_GENERATOR_COMPLETE',
  assessment.orchestrationState,
);

const artifacts = buildArchitectureBriefGeneratorArtifacts({
  briefs: fullBrief ? [fullBrief] : [],
});
assert('G report markdown', artifacts.markdown.includes('Architecture Brief Generator Report'), 'yes');
assert('G system overview in report', artifacts.markdown.includes('System Overview'), 'yes');
assert('G frontend in report', artifacts.markdown.includes('Frontend Summary'), 'yes');
assert('G backend in report', artifacts.markdown.includes('Backend Summary'), 'yes');
assert('G data in report', artifacts.markdown.includes('Data Model Summary'), 'yes');
assert('G integration in report', artifacts.markdown.includes('Integration Summary'), 'yes');
assert('G risk in report', artifacts.markdown.includes('Risk Analysis'), 'yes');
assert('G confidence in report', artifacts.markdown.includes('Confidence & Readiness'), 'yes');
assert(
  'G readiness valid',
  fullBrief != null && ARCHITECTURE_BRIEF_READINESS_LEVELS.includes(fullBrief.architectureBriefReadiness),
  fullBrief?.architectureBriefReadiness ?? 'none',
);

writeFileSync(join(ROOT, 'architecture/ARCHITECTURE_BRIEF_GENERATOR_REPORT.md'), artifacts.markdown, 'utf8');
assert('G report written', existsSync(join(ROOT, 'architecture/ARCHITECTURE_BRIEF_GENERATOR_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/architecture-brief-generator/architecture-brief-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/architecture-brief-generator/architecture-brief-registry.ts'), 'utf8');
assert(
  'H read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_ARCHITECTURE_IMPLEMENTATION') &&
    registrySource.includes('GATE_ENFORCED_GENERATION') &&
    registrySource.includes('PLANNING_BRIEF_REQUIRED') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('H advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/ARCHITECTURE_BRIEF_GENERATOR_REPORT.md'), 'utf8');
assert('H pass token', arch.includes(ARCHITECTURE_BRIEF_GENERATOR_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('I no validator recursion marker', !authoritySource.includes('validate-architecture-brief-generator'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Architecture Brief Generator V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getArchitectureBriefHistorySize()}`);
  console.log(`Report path: architecture/ARCHITECTURE_BRIEF_GENERATOR_REPORT.md`);
  console.log(`\n${ARCHITECTURE_BRIEF_GENERATOR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
