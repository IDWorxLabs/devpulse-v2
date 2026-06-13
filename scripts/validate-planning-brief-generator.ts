/**
 * Phase 26.30 — Planning Brief Generator V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlanningGateAnalysis } from '../src/planning-gate-authority/planning-gate-types.js';
import {
  PLANNING_BRIEF_GENERATOR_V1_PASS,
  MAX_PLANNING_BRIEF_HISTORY,
  PLANNING_BRIEF_QUALITY_LEVELS,
  PLANNING_BRIEF_READINESS_LEVELS,
  buildPlanningBriefGeneratorArtifacts,
  buildScreenInventory,
  generatePlanningBrief,
  getPlanningBriefHistorySize,
  isPlanningBriefStructurallyValid,
  resetPlanningBriefGeneratorModuleForTests,
  runPlanningBriefGenerator,
  summarizeWorkflows,
  buildPlanningBriefEvidenceBundle,
} from '../src/planning-brief-generator/index.js';
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
  'src/planning-brief-generator/planning-brief-types.ts',
  'src/planning-brief-generator/planning-brief-registry.ts',
  'src/planning-brief-generator/planning-brief-builder.ts',
  'src/planning-brief-generator/project-scope-summarizer.ts',
  'src/planning-brief-generator/workflow-summarizer.ts',
  'src/planning-brief-generator/screen-inventory-builder.ts',
  'src/planning-brief-generator/requirement-summary-builder.ts',
  'src/planning-brief-generator/planning-brief-validator.ts',
  'src/planning-brief-generator/planning-brief-history.ts',
  'src/planning-brief-generator/planning-brief-report-builder.ts',
  'src/planning-brief-generator/planning-brief-authority.ts',
  'src/planning-brief-generator/index.ts',
  'architecture/PLANNING_BRIEF_GENERATOR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildGateFixture(decision: PlanningGateAnalysis['planningGateDecision'], confidence = 80): PlanningGateAnalysis {
  return {
    readOnly: true,
    analysisId: `gate-${decision}`,
    analyzedAt: new Date().toISOString(),
    evidenceSufficiency: {
      readOnly: true,
      evidenceSufficiencyScore: decision === 'REJECT_PLANNING' ? 25 : 85,
      dimensions: [],
      activeSourceCount: 4,
    },
    planningRiskAnalysis: {
      readOnly: true,
      risks: decision === 'REQUEST_CLARIFICATION'
        ? [{
            readOnly: true,
            riskId: 'risk-1',
            riskType: 'CONFLICTING_EVIDENCE',
            severity: 'CRITICAL',
            description: 'Platform conflict between web and mobile evidence.',
            evidence: ['PLATFORM_CONFLICT'],
          }]
        : [],
      overallRiskLevel: decision === 'REQUEST_CLARIFICATION' ? 'CRITICAL' : 'LOW',
      riskCount: decision === 'REQUEST_CLARIFICATION' ? 1 : 0,
    },
    planningReadiness: {
      readOnly: true,
      planningReadinessScore: decision === 'REJECT_PLANNING' ? 30 : 92,
      planningReadinessCategory: decision === 'REJECT_PLANNING' ? 'NOT_READY' : 'READY_FOR_PLANNING',
    },
    planningGateDecision: decision,
    planningGateExplanation: {
      readOnly: true,
      evidenceUsed: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
      risksFound: [],
      missingInformation: decision === 'REQUEST_CLARIFICATION' ? ['Resolve platform conflict'] : [],
      confidence,
      summary: 'Gate fixture summary.',
    },
    planningGateQuestions: decision === 'REQUEST_CLARIFICATION'
      ? [{
          readOnly: true,
          questionId: 'gate-q-1',
          question: 'Which platform should be treated as the primary launch target?',
          priority: 'CRITICAL',
          category: 'PLATFORM',
          evidence: ['PLATFORM_CONFLICT'],
        }]
      : [],
    safeToPlan: decision !== 'REJECT_PLANNING' && decision !== 'REQUEST_CLARIFICATION',
  };
}

function buildUnifiedIntakeFixture(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'unified-brief-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
      typedPromptExcerpt: 'Build a SaaS mobile app for iOS and Android',
      platforms: ['IOS', 'ANDROID'],
      screens: ['dashboard', 'onboarding', 'checkout', 'settings', 'profile'],
      workflows: ['onboarding', 'checkout', 'authentication', 'administration'],
      userRoles: ['admin', 'user', 'customer'],
      integrations: ['Stripe', 'OpenAI', 'Twilio'],
      notifications: ['email', 'push notification'],
      authentication: ['OAuth'],
      dataEntities: ['user', 'order'],
      businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
      visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
      inferredFlows: ['ONBOARDING', 'CHECKOUT'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 3,
      evidenceItemCount: 20,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MOBILE_APP',
      platformTargets: ['IOS', 'ANDROID'],
      primaryPurpose: 'Mobile SaaS product with checkout',
      targetUsers: ['founders', 'customers'],
      businessObjective: 'Subscription revenue through mobile checkout',
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
      entities: ['user', 'order'],
      integrations: ['Stripe', 'OpenAI', 'Twilio'],
      businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
      confidence: 90,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
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

resetPlanningBriefGeneratorModuleForTests();

const rejectResult = runPlanningBriefGenerator({
  planningGateAnalysis: buildGateFixture('REJECT_PLANNING'),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
});
assert('A gate reject blocked', rejectResult.orchestrationState === 'PLANNING_BRIEF_GENERATOR_FAILED', rejectResult.orchestrationState);
assert('A reject failure reason', rejectResult.failureReason === 'PLANNING_GATE_REJECTED', rejectResult.failureReason ?? 'none');
assert('A reject no brief', rejectResult.planningBrief == null, 'null');

const missingGate = runPlanningBriefGenerator({
  planningGateAnalysis: null,
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
});
assert('A missing gate blocked', missingGate.failureReason === 'MISSING_PLANNING_GATE_ANALYSIS', missingGate.failureReason ?? 'none');

const fullBrief = generatePlanningBrief({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING', 88),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
  founderContext: {
    readOnly: true,
    founderGoal: 'Launch mobile SaaS',
    businessObjective: 'Enable subscription checkout on mobile',
    targetUsers: ['founders', 'customers'],
    constraints: ['Must support Stripe'],
    priorities: ['onboarding', 'checkout'],
  },
  projectVaultContext: {
    readOnly: true,
    projectName: 'Founder App',
    facts: [{ label: 'platform_target', value: 'iOS and Android', source: 'FOUNDER' }],
  },
  skipHistoryRecording: true,
});
assert('B full brief generated', fullBrief != null, String(fullBrief != null));
assert('B product name', fullBrief != null && fullBrief.projectSummary.productName === 'Founder App', fullBrief?.projectSummary.productName ?? 'none');
assert('B product type', fullBrief != null && fullBrief.projectSummary.productType === 'MOBILE_APP', fullBrief?.projectSummary.productType ?? 'none');
assert('B platform targets', fullBrief != null && fullBrief.platformTargets.includes('MOBILE'), fullBrief?.platformTargets.join(', ') ?? 'none');
assert('B screen inventory', fullBrief != null && fullBrief.screenInventory.length >= 4, `${fullBrief?.screenInventory.length ?? 0}`);
assert('B workflow inventory', fullBrief != null && fullBrief.workflowInventory.length >= 3, `${fullBrief?.workflowInventory.length ?? 0}`);
assert('B user roles', fullBrief != null && fullBrief.userRoles.includes('admin'), fullBrief?.userRoles.join(', ') ?? 'none');
assert('B integrations', fullBrief != null && fullBrief.integrations.includes('Stripe'), fullBrief?.integrations.join(', ') ?? 'none');
assert('B business rules', fullBrief != null && fullBrief.businessRules.length >= 1, `${fullBrief?.businessRules.length ?? 0}`);
assert(
  'B confidence bounded',
  fullBrief != null && fullBrief.planningBriefConfidence >= 0 && fullBrief.planningBriefConfidence <= 100,
  String(fullBrief?.planningBriefConfidence),
);
assert(
  'B quality valid',
  fullBrief != null && PLANNING_BRIEF_QUALITY_LEVELS.includes(fullBrief.planningBriefQuality),
  fullBrief?.planningBriefQuality ?? 'none',
);
assert(
  'B readiness planning ready',
  fullBrief != null && fullBrief.planningBriefReadiness === 'PLANNING_READY',
  fullBrief?.planningBriefReadiness ?? 'none',
);
assert('B structurally valid', fullBrief != null && isPlanningBriefStructurallyValid(fullBrief), 'yes');

const draftBrief = generatePlanningBrief({
  planningGateAnalysis: buildGateFixture('REQUEST_CLARIFICATION', 62),
  unifiedIntakeAnalysis: {
    ...buildUnifiedIntakeFixture(),
    evidenceConflicts: [{
      readOnly: true,
      conflictType: 'PLATFORM_CONFLICT',
      description: 'Web and mobile platform conflict.',
      conflictingEvidence: ['TYPED_PROMPT:WEB', 'VOICE:MOBILE'],
      confidence: 80,
      recommendedClarification: 'Confirm primary platform.',
    }],
  },
  skipHistoryRecording: true,
});
assert('C draft brief generated', draftBrief != null, String(draftBrief != null));
assert(
  'C draft readiness',
  draftBrief != null && draftBrief.planningBriefReadiness === 'DRAFT_READY',
  draftBrief?.planningBriefReadiness ?? 'none',
);
assert(
  'C known gaps include conflict',
  draftBrief != null && draftBrief.knownGaps.some((g) => g.category === 'UNRESOLVED_CONFLICT'),
  draftBrief?.knownGaps.map((g) => g.category).join(', ') ?? 'none',
);
assert(
  'C clarification gaps',
  draftBrief != null && draftBrief.knownGaps.some((g) => g.category === 'CLARIFICATION_REQUEST'),
  `${draftBrief?.knownGaps.length ?? 0}`,
);

const bundle = buildPlanningBriefEvidenceBundle({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING'),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
});
assert('D evidence bundle', bundle != null, String(bundle != null));
assert('D screen builder', buildScreenInventory(bundle!).length >= 4, `${buildScreenInventory(bundle!).length}`);
assert('D workflow builder', summarizeWorkflows(bundle!).length >= 3, `${summarizeWorkflows(bundle!).length}`);

resetPlanningBriefGeneratorModuleForTests();
for (let i = 0; i < MAX_PLANNING_BRIEF_HISTORY + 6; i += 1) {
  generatePlanningBrief({
    planningGateAnalysis: buildGateFixture('ALLOW_LIMITED_PLANNING', 70),
    unifiedIntakeAnalysis: { ...buildUnifiedIntakeFixture(), analysisId: `unified-${i}` },
    skipHistoryRecording: false,
  });
}
assert(
  'E history bounded',
  getPlanningBriefHistorySize() <= MAX_PLANNING_BRIEF_HISTORY,
  `${getPlanningBriefHistorySize()}/${MAX_PLANNING_BRIEF_HISTORY}`,
);

const assessment = runPlanningBriefGenerator({
  planningGateAnalysis: buildGateFixture('ALLOW_FULL_PLANNING', 88),
  unifiedIntakeAnalysis: buildUnifiedIntakeFixture(),
  skipHistoryRecording: true,
});
assert('F advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert(
  'F orchestration complete',
  assessment.orchestrationState === 'PLANNING_BRIEF_GENERATOR_COMPLETE',
  assessment.orchestrationState,
);

const artifacts = buildPlanningBriefGeneratorArtifacts({
  briefs: fullBrief ? [fullBrief] : [],
});
assert('G report markdown', artifacts.markdown.includes('Planning Brief Generator Report'), 'yes');
assert('G project summary in report', artifacts.markdown.includes('Project Summary'), 'yes');
assert('G screens in report', artifacts.markdown.includes('Screen Inventory'), 'yes');
assert('G workflows in report', artifacts.markdown.includes('Workflow Inventory'), 'yes');
assert('G roles in report', artifacts.markdown.includes('User Roles'), 'yes');
assert('G integrations in report', artifacts.markdown.includes('Integrations'), 'yes');
assert('G gaps in report', artifacts.markdown.includes('Known Gaps'), 'yes');
assert('G confidence in report', artifacts.markdown.includes('Confidence & Readiness'), 'yes');
assert(
  'G readiness valid',
  fullBrief != null && PLANNING_BRIEF_READINESS_LEVELS.includes(fullBrief.planningBriefReadiness),
  fullBrief?.planningBriefReadiness ?? 'none',
);

writeFileSync(join(ROOT, 'architecture/PLANNING_BRIEF_GENERATOR_REPORT.md'), artifacts.markdown, 'utf8');
assert('G report written', existsSync(join(ROOT, 'architecture/PLANNING_BRIEF_GENERATOR_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/planning-brief-generator/planning-brief-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/planning-brief-generator/planning-brief-registry.ts'), 'utf8');
assert(
  'H read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_ARCHITECTURE_GENERATION') &&
    registrySource.includes('GATE_ENFORCED_GENERATION') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('H advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/PLANNING_BRIEF_GENERATOR_REPORT.md'), 'utf8');
assert('H pass token', arch.includes(PLANNING_BRIEF_GENERATOR_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('I no validator recursion marker', !authoritySource.includes('validate-planning-brief-generator'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Planning Brief Generator V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getPlanningBriefHistorySize()}`);
  console.log(`Report path: architecture/PLANNING_BRIEF_GENERATOR_REPORT.md`);
  console.log(`\n${PLANNING_BRIEF_GENERATOR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
