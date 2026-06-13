/**
 * Phase 26.29 — Planning Gate Authority V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PLANNING_GATE_AUTHORITY_V1_PASS,
  MAX_PLANNING_GATE_HISTORY,
  COVERAGE_DIMENSIONS,
  PLANNING_GATE_DECISIONS,
  PLANNING_READINESS_CATEGORIES,
  assessPlanningGate,
  buildPlanningGateAuthorityArtifacts,
  detectPlanningRisks,
  evaluateEvidenceSufficiency,
  getPlanningGateHistorySize,
  mapPlanningReadinessCategory,
  resetPlanningGateAuthorityModuleForTests,
  runPlanningGateAuthority,
  buildPlanningGateEvidenceSnapshot,
  derivePlanningGateDecision,
  generatePlanningGateQuestions,
} from '../src/planning-gate-authority/index.js';
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
  'src/planning-gate-authority/planning-gate-types.ts',
  'src/planning-gate-authority/planning-gate-registry.ts',
  'src/planning-gate-authority/planning-readiness-analyzer.ts',
  'src/planning-gate-authority/evidence-sufficiency-evaluator.ts',
  'src/planning-gate-authority/planning-risk-detector.ts',
  'src/planning-gate-authority/gate-decision-engine.ts',
  'src/planning-gate-authority/planning-gate-history.ts',
  'src/planning-gate-authority/planning-gate-report-builder.ts',
  'src/planning-gate-authority/planning-gate-authority.ts',
  'src/planning-gate-authority/index.ts',
  'architecture/PLANNING_GATE_AUTHORITY_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildAlignedUnifiedIntakeFixture(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'unified-aligned-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: [
        'TYPED_PROMPT',
        'VOICE_NOTES_INTELLIGENCE',
        'VISUAL_REFERENCE_INTELLIGENCE',
        'REQUIREMENT_COMPLETENESS_INTELLIGENCE',
        'PROJECT_VAULT_CONTEXT',
      ],
      typedPromptExcerpt: 'Build a SaaS mobile app for iOS and Android',
      platforms: ['IOS', 'ANDROID'],
      screens: ['dashboard', 'onboarding', 'checkout', 'settings'],
      workflows: ['onboarding', 'checkout', 'authentication'],
      userRoles: ['admin', 'user'],
      integrations: ['Stripe', 'SendGrid'],
      notifications: ['email', 'push notification'],
      authentication: ['OAuth'],
      dataEntities: ['user', 'order'],
      businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
      visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
      inferredFlows: ['ONBOARDING', 'CHECKOUT'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 5,
      evidenceItemCount: 24,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MOBILE_APP',
      platformTargets: ['IOS', 'ANDROID'],
      primaryPurpose: 'Mobile SaaS product with checkout',
      targetUsers: ['founders', 'customers'],
      businessObjective: 'Subscription revenue through mobile checkout',
      confidence: 92,
      evidence: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP',
      platforms: ['IOS', 'ANDROID'],
      workflows: ['onboarding', 'checkout', 'authentication'],
      screens: ['dashboard', 'onboarding', 'checkout', 'settings'],
      userRoles: ['admin', 'user'],
      entities: ['user', 'order'],
      integrations: ['Stripe', 'SendGrid'],
      businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
      confidence: 92,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
    },
    evidenceConflicts: [],
    intakeGaps: [],
    unifiedIntakeConfidence: 92,
    intakeReadinessScore: 95,
    intakeReadinessCategory: 'READY_FOR_PLANNING',
    intakeReadiness: 'READY_FOR_PLANNING',
    intakeRecommendations: [],
  };
}

function buildConflictUnifiedIntakeFixture(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'unified-conflict-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
      typedPromptExcerpt: 'Build a web app dashboard for desktop users',
      platforms: ['WEB', 'IOS', 'ANDROID'],
      screens: ['dashboard', 'onboarding'],
      workflows: ['onboarding', 'checkout'],
      userRoles: ['user'],
      integrations: ['Stripe'],
      notifications: [],
      authentication: ['OAuth'],
      dataEntities: ['user'],
      businessRules: ['Users must complete onboarding before checkout'],
      visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
      inferredFlows: ['ONBOARDING'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 3,
      evidenceItemCount: 12,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'WEB_APP',
      platformTargets: ['WEB', 'IOS'],
      primaryPurpose: 'Conflicting platform evidence',
      targetUsers: ['users'],
      businessObjective: 'Unclear due to platform conflict',
      confidence: 55,
      evidence: ['TYPED_PROMPT', 'VISUAL_REFERENCE_INTELLIGENCE'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'WEB_APP',
      platforms: ['WEB', 'IOS', 'ANDROID'],
      workflows: ['onboarding', 'checkout'],
      screens: ['dashboard', 'onboarding'],
      userRoles: ['user'],
      entities: ['user'],
      integrations: ['Stripe'],
      businessRules: ['Users must complete onboarding before checkout'],
      confidence: 55,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    },
    evidenceConflicts: [
      {
        readOnly: true,
        conflictType: 'PLATFORM_CONFLICT',
        description: 'Typed prompt targets web/desktop while voice and visual evidence target mobile.',
        conflictingEvidence: ['TYPED_PROMPT:WEB', 'VOICE_NOTES:MOBILE', 'VISUAL:MOBILE'],
        confidence: 88,
        recommendedClarification: 'Confirm whether the primary launch platform is web or mobile.',
      },
    ],
    intakeGaps: [],
    unifiedIntakeConfidence: 80,
    intakeReadinessScore: 85,
    intakeReadinessCategory: 'HIGH_CONFIDENCE_UNDERSTANDING',
    intakeReadiness: 'HIGH_CONFIDENCE_UNDERSTANDING',
    intakeRecommendations: [
      {
        readOnly: true,
        recommendationId: 'rec-platform-1',
        title: 'Resolve platform conflict between web and mobile intake evidence.',
        rationale: 'Planning cannot proceed with conflicting platform targets.',
        priority: 'CRITICAL',
        evidence: ['PLATFORM_CONFLICT'],
      },
    ],
  };
}

const completenessFixture = {
  readOnly: true as const,
  analysisId: 'completeness-fixture',
  analyzedAt: new Date().toISOString(),
  evidence: {
    readOnly: true as const,
    sources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    screens: ['dashboard', 'settings', 'checkout', 'onboarding'],
    userRoles: ['user', 'admin'],
    workflows: ['onboarding', 'checkout', 'authentication'],
    businessRules: ['Admin must approve checkout', 'Users must authenticate before checkout'],
    integrations: ['Stripe', 'SendGrid'],
    notifications: ['email'],
    authentication: ['OAuth'],
    dataEntities: ['user', 'order'],
    platformTargets: ['IOS', 'ANDROID'],
    inferredFlows: ['CHECKOUT'],
    visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
    productType: 'MOBILE_APP',
  },
  domainResults: [],
  completenessScore: 90,
  completenessCategory: 'READY_WITH_GAPS' as const,
  readinessScore: 88,
  projectRequirementReadiness: 'READY_WITH_GAPS' as const,
  missingRequirements: [],
  riskLevel: 'LOW' as const,
  confidenceScore: 85,
  clarifyingQuestions: [],
  safeToProceed: true,
};

resetPlanningGateAuthorityModuleForTests();

assert('A missing unified intake rejected', assessPlanningGate({}) == null, 'null');

const rejectAssessment = runPlanningGateAuthority({});
assert('A reject orchestration failed', rejectAssessment.orchestrationState === 'PLANNING_GATE_AUTHORITY_FAILED', rejectAssessment.orchestrationState);
assert('A reject failure reason', rejectAssessment.failureReason === 'MISSING_UNIFIED_INTAKE_EVIDENCE', rejectAssessment.failureReason ?? 'none');

const conflictAnalysis = assessPlanningGate({
  unifiedIntakeAnalysis: buildConflictUnifiedIntakeFixture(),
  skipHistoryRecording: true,
});
assert('B conflict analysis produced', conflictAnalysis != null, String(conflictAnalysis != null));
assert(
  'B conflict decision',
  conflictAnalysis != null && conflictAnalysis.planningGateDecision === 'REQUEST_CLARIFICATION',
  conflictAnalysis?.planningGateDecision ?? 'none',
);
assert(
  'B conflict risks detected',
  conflictAnalysis != null && conflictAnalysis.planningRiskAnalysis.risks.some((r) => r.riskType === 'CONFLICTING_EVIDENCE'),
  conflictAnalysis?.planningRiskAnalysis.risks.map((r) => r.riskType).join(', ') ?? 'none',
);
assert(
  'B conflict questions generated',
  conflictAnalysis != null &&
    conflictAnalysis.planningGateQuestions.length > 0 &&
    conflictAnalysis.planningGateQuestions.some((q) => q.priority === 'CRITICAL'),
  `${conflictAnalysis?.planningGateQuestions.length ?? 0}`,
);
assert('B conflict not safe to plan', conflictAnalysis != null && conflictAnalysis.safeToPlan === false, String(conflictAnalysis?.safeToPlan));

const alignedAnalysis = assessPlanningGate({
  unifiedIntakeAnalysis: buildAlignedUnifiedIntakeFixture(),
  requirementCompletenessAnalysis: completenessFixture,
  projectVaultContext: {
    readOnly: true,
    projectName: 'Founder App',
    facts: [{ label: 'platform_target', value: 'iOS and Android mobile', source: 'FOUNDER' }],
  },
  skipHistoryRecording: true,
});
assert('C aligned analysis produced', alignedAnalysis != null, String(alignedAnalysis != null));
assert(
  'C evidence sufficiency bounded',
  alignedAnalysis != null &&
    alignedAnalysis.evidenceSufficiency.evidenceSufficiencyScore >= 0 &&
    alignedAnalysis.evidenceSufficiency.evidenceSufficiencyScore <= 100,
  String(alignedAnalysis?.evidenceSufficiency.evidenceSufficiencyScore),
);
assert(
  'C coverage dimensions',
  alignedAnalysis != null && alignedAnalysis.evidenceSufficiency.dimensions.length === COVERAGE_DIMENSIONS.length,
  `${alignedAnalysis?.evidenceSufficiency.dimensions.length ?? 0}`,
);
assert(
  'C readiness scoring',
  alignedAnalysis != null &&
    alignedAnalysis.planningReadiness.planningReadinessScore >= 70 &&
    mapPlanningReadinessCategory(alignedAnalysis.planningReadiness.planningReadinessScore) ===
      alignedAnalysis.planningReadiness.planningReadinessCategory,
  alignedAnalysis?.planningReadiness.planningReadinessCategory ?? 'none',
);
assert(
  'C readiness category valid',
  alignedAnalysis != null && PLANNING_READINESS_CATEGORIES.includes(alignedAnalysis.planningReadiness.planningReadinessCategory),
  alignedAnalysis?.planningReadiness.planningReadinessCategory ?? 'none',
);
assert(
  'C gate decision valid',
  alignedAnalysis != null && PLANNING_GATE_DECISIONS.includes(alignedAnalysis.planningGateDecision),
  alignedAnalysis?.planningGateDecision ?? 'none',
);
assert(
  'C allow planning decision',
  alignedAnalysis != null &&
    (alignedAnalysis.planningGateDecision === 'ALLOW_FULL_PLANNING' ||
      alignedAnalysis.planningGateDecision === 'ALLOW_LIMITED_PLANNING'),
  alignedAnalysis?.planningGateDecision ?? 'none',
);
assert(
  'C safe to plan when allowed',
  alignedAnalysis != null && alignedAnalysis.safeToPlan === true,
  String(alignedAnalysis?.safeToPlan),
);
assert(
  'C explanation populated',
  alignedAnalysis != null &&
    alignedAnalysis.planningGateExplanation.summary.length > 0 &&
    alignedAnalysis.planningGateExplanation.evidenceUsed.length > 0,
  alignedAnalysis?.planningGateExplanation.summary ?? 'none',
);

const snapshot = buildPlanningGateEvidenceSnapshot({
  unifiedIntakeAnalysis: buildAlignedUnifiedIntakeFixture(),
  requirementCompletenessAnalysis: completenessFixture,
});
assert('D evidence snapshot', snapshot != null, String(snapshot != null));

const sufficiency = evaluateEvidenceSufficiency(snapshot!);
assert('D sufficiency evaluator', sufficiency.evidenceSufficiencyScore >= 70, String(sufficiency.evidenceSufficiencyScore));

const risks = detectPlanningRisks({
  snapshot: snapshot!,
  gateInput: { unifiedIntakeAnalysis: buildAlignedUnifiedIntakeFixture(), requirementCompletenessAnalysis: completenessFixture },
});
assert('D risk detector', risks.riskCount >= 0, String(risks.riskCount));

const decision = derivePlanningGateDecision({
  planningReadiness: alignedAnalysis!.planningReadiness,
  planningRiskAnalysis: risks,
  evidenceSufficiency: sufficiency,
  snapshot: snapshot!,
});
assert('D decision engine', PLANNING_GATE_DECISIONS.includes(decision), decision);

const questions = generatePlanningGateQuestions({
  planningRiskAnalysis: buildConflictUnifiedIntakeFixture() ? detectPlanningRisks({
    snapshot: buildPlanningGateEvidenceSnapshot({ unifiedIntakeAnalysis: buildConflictUnifiedIntakeFixture() })!,
    gateInput: { unifiedIntakeAnalysis: buildConflictUnifiedIntakeFixture() },
  }) : risks,
  gateInput: { unifiedIntakeAnalysis: buildConflictUnifiedIntakeFixture() },
  decision: 'REQUEST_CLARIFICATION',
});
assert(
  'D clarification questions evidence-based',
  questions.length > 0 && questions.every((q) => q.evidence.length > 0),
  `${questions.length}`,
);

resetPlanningGateAuthorityModuleForTests();
for (let i = 0; i < MAX_PLANNING_GATE_HISTORY + 6; i += 1) {
  assessPlanningGate({
    unifiedIntakeAnalysis: {
      ...buildAlignedUnifiedIntakeFixture(),
      analysisId: `unified-history-${i}`,
    },
    skipHistoryRecording: false,
  });
}
assert(
  'E history bounded',
  getPlanningGateHistorySize() <= MAX_PLANNING_GATE_HISTORY,
  `${getPlanningGateHistorySize()}/${MAX_PLANNING_GATE_HISTORY}`,
);

const assessment = runPlanningGateAuthority({
  unifiedIntakeAnalysis: buildAlignedUnifiedIntakeFixture(),
  requirementCompletenessAnalysis: completenessFixture,
  skipHistoryRecording: true,
});
assert('F advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert(
  'F orchestration complete',
  assessment.orchestrationState === 'PLANNING_GATE_AUTHORITY_COMPLETE',
  assessment.orchestrationState,
);

const artifacts = buildPlanningGateAuthorityArtifacts({
  analyses: alignedAnalysis ? [alignedAnalysis] : [],
});
assert('G report markdown', artifacts.markdown.includes('Planning Gate Authority Report'), 'yes');
assert('G readiness in report', artifacts.markdown.includes('Readiness Findings'), 'yes');
assert('G risks in report', artifacts.markdown.includes('Risk Findings'), 'yes');
assert('G decision in report', artifacts.markdown.includes('Gate Decision'), 'yes');
assert('G explanation in report', artifacts.markdown.includes('Gate Explanation'), 'yes');
assert('G clarifications in report', artifacts.markdown.includes('Clarification Requests'), 'yes');

writeFileSync(join(ROOT, 'architecture/PLANNING_GATE_AUTHORITY_REPORT.md'), artifacts.markdown, 'utf8');
assert('G report written', existsSync(join(ROOT, 'architecture/PLANNING_GATE_AUTHORITY_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/planning-gate-authority/planning-gate-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/planning-gate-authority/planning-gate-registry.ts'), 'utf8');
assert(
  'H read-only safeguards',
  registrySource.includes('NO_PLANNING_EXECUTION') &&
    registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PROJECT_MODIFICATION') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('H advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/PLANNING_GATE_AUTHORITY_REPORT.md'), 'utf8');
assert('H pass token', arch.includes(PLANNING_GATE_AUTHORITY_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('I no validator recursion marker', !authoritySource.includes('validate-planning-gate-authority'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Planning Gate Authority V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getPlanningGateHistorySize()}`);
  console.log(`Report path: architecture/PLANNING_GATE_AUTHORITY_REPORT.md`);
  console.log(`\n${PLANNING_GATE_AUTHORITY_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
