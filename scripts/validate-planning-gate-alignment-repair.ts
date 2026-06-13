/**
 * Phase 26.38 — Planning Gate Clarification Alignment Repair V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArchitectureBrief } from '../src/architecture-brief-generator/architecture-brief-validator.js';
import type { ArchitectureBrief } from '../src/architecture-brief-generator/architecture-brief-types.js';
import { buildKnownGaps } from '../src/planning-brief-generator/requirement-summary-builder.js';
import { validatePlanningBrief } from '../src/planning-brief-generator/planning-brief-validator.js';
import type { PlanningBrief } from '../src/planning-brief-generator/planning-brief-types.js';
import { validateBuildPlan } from '../src/build-plan-generator/build-plan-validator.js';
import type { BuildPlan } from '../src/build-plan-generator/build-plan-types.js';
import {
  capReadinessToGatePermission,
  isReadinessEscalation,
} from '../src/planning-gate-authority/readiness-permission-matrix.js';
import {
  analyzeReadinessPropagation,
  checkReadinessAlignment,
  compareReadinessInconsistencyCount,
  runOrchestrationProof,
} from '../src/cross-system-orchestration-proof/index.js';
import type { AuthorityProjectSnapshot } from '../src/cross-system-orchestration-proof/orchestration-proof-types.js';
import {
  analyzeExecutionReadiness,
  applyGateReadinessCap,
  prioritizeLaunchBlockers,
  resetFounderTestAutomationModuleForTests,
} from '../src/founder-test-automation/index.js';
import type { UpstreamChainConfidenceContext } from '../src/founder-test-automation/founder-test-automation-types.js';
import type { FounderTestRealitySweepReport } from '../src/founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import {
  getFounderSimulationScenarioByType,
  resetFounderSimulationEngineModuleForTests,
  simulateFounderJourney,
} from '../src/founder-simulation-engine/index.js';

const PLANNING_GATE_ALIGNMENT_REPAIR_V1_PASS = 'PLANNING_GATE_ALIGNMENT_REPAIR_V1_PASS';

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

function snapshot(
  authorityId: AuthorityProjectSnapshot['authorityId'],
  readiness: string,
): AuthorityProjectSnapshot {
  return {
    readOnly: true,
    authorityId,
    reached: true,
    productType: 'marketplace',
    platforms: ['WEB'],
    workflows: ['checkout'],
    screens: ['home'],
    roles: ['user'],
    integrations: [],
    businessRules: [],
    confidence: 85,
    readiness,
    evidenceSources: ['TYPED_PROMPT'],
  };
}

function buildMinimalPlanningBrief(): PlanningBrief {
  return {
    readOnly: true,
    briefId: 'pb-fixture',
    generatedAt: new Date().toISOString(),
    projectSummary: {
      readOnly: true,
      productType: 'marketplace',
      objective: 'Launch marketplace',
      complexity: 'MEDIUM',
    },
    platformTargets: ['WEB'],
    screenInventory: ['home'],
    workflowInventory: ['checkout'],
    userRoles: ['buyer'],
    businessRules: ['payments'],
    integrations: ['stripe'],
    knownGaps: [],
    evidenceSources: ['TYPED_PROMPT'],
    planningBriefConfidence: 0,
    planningBriefQuality: 'PARTIAL',
    planningBriefReadiness: 'NOT_READY',
  } as unknown as PlanningBrief;
}

function buildMinimalArchitectureBrief(): ArchitectureBrief {
  return {
    readOnly: true,
    briefId: 'ab-fixture',
    planningBriefId: 'pb-fixture',
    generatedAt: new Date().toISOString(),
    systemOverview: { readOnly: true, objective: 'Marketplace platform', scope: 'MVP' },
    frontendSummary: { readOnly: true, detectedNeeds: ['responsive UI'], frameworks: ['react'] },
    backendSummary: { readOnly: true, detectedNeeds: ['api'], services: ['auth'] },
    dataModelSummary: { readOnly: true, entities: ['User'], relationships: [] },
    integrationSummary: { readOnly: true, integrations: ['stripe'], thirdPartyApis: [] },
    securitySummary: { readOnly: true, userRoles: ['buyer'], authentication: ['oauth'] },
    architectureRiskAnalysis: {
      readOnly: true,
      riskCount: 1,
      risks: [{ readOnly: true, riskId: 'r1', severity: 'HIGH', category: 'SCALE', description: 'scale', evidence: [] }],
    },
    evidenceSources: ['TYPED_PROMPT'],
    architectureBriefConfidence: 0,
    architectureBriefQuality: 'PARTIAL',
    architectureBriefReadiness: 'NOT_READY',
  } as unknown as ArchitectureBrief;
}

function buildMinimalBuildPlan(): BuildPlan {
  return {
    readOnly: true,
    planId: 'bp-fixture',
    architectureBriefId: 'ab-fixture',
    generatedAt: new Date().toISOString(),
    projectSummary: { readOnly: true, productType: 'marketplace', objective: 'Build', complexity: 'MEDIUM' },
    phases: [{ readOnly: true, phaseId: 'p1', name: 'Foundation', order: 1, description: 'Core' }],
    milestones: [{ readOnly: true, milestoneId: 'm1', name: 'MVP', phaseId: 'p1', order: 1 }],
    dependencyMap: {
      readOnly: true,
      criticalDependencies: [],
      blockedPhases: [],
      dependencyEdges: [],
    },
    buildPriorityOrder: ['p1'],
    buildPlanRisks: [],
    buildComplexityScore: 0,
    buildComplexityCategory: 'LOW',
    buildPlanReadiness: 'NOT_READY',
    buildPlanConfidence: 0,
    evidenceSources: ['TYPED_PROMPT'],
  } as unknown as BuildPlan;
}

function buildStrongSweep(): FounderTestRealitySweepReport {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Could a founder realistically launch and use this product today?',
    sweepId: 'gate-alignment-sweep',
    generatedAt: new Date().toISOString(),
    launchReadinessPercent: 88,
    launchRecommendation: 'RECOMMEND_LAUNCH_WITH_WARNINGS',
    founderLaunchVerdict: 'READY_WITH_WARNINGS',
    categoryScores: [],
    launchBlockers: [],
    launchWarnings: [],
    launchStrengths: [
      {
        readOnly: true,
        strengthId: 'strength-1',
        category: 'EXECUTION_REALITY',
        explanation: 'Strong chain',
        sourceAuthority: 'planning-brief-generator',
        evidenceScore: 90,
      },
    ],
    missingCapabilities: [],
    competitiveGaps: [],
    topLaunchRisks: [],
    recommendedLaunchWork: [],
    topBlockers: [],
    topStrengths: [],
    topMissingCapabilities: [],
    mostImportantNextBuildItems: [],
    inputSnapshot: {
      readOnly: true,
      founderTestAssessment: null,
      founderExecutionProofAssessment: null,
      founderTestLaunchReadinessAssessment: null,
      founderAcceptanceAssessment: null,
      launchCouncilAssessment: null,
      firstTimeUserRealityAssessment: null,
      livePreviewRealityAssessment: null,
      verificationRealityAssessment: null,
      interactiveExplanationsEvaluation: null,
      uiReviewerAssessment: null,
      competitiveRealityAssessment: null,
      missingAuthorities: [],
    },
    blockingReasons: [],
    warningReasons: [],
    cacheKey: 'gate-alignment',
  };
}

const REQUIRED = [
  'src/planning-gate-authority/readiness-permission-matrix.ts',
  'src/cross-system-orchestration-proof/readiness-alignment-check.ts',
  'src/planning-brief-generator/planning-brief-validator.ts',
  'src/architecture-brief-generator/architecture-brief-validator.ts',
  'src/build-plan-generator/build-plan-validator.ts',
  'src/founder-test-automation/confidence-propagation-repair.ts',
  'src/cross-system-orchestration-proof/readiness-propagation-analyzer.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const rejectPlanningBrief = validatePlanningBrief({
  brief: buildMinimalPlanningBrief(),
  gateDecision: 'REJECT_PLANNING',
  gateConfidence: 80,
  intakeConfidence: 85,
});
assert(
  '1 REJECT_PLANNING caps planning brief',
  rejectPlanningBrief.planningBriefReadiness === 'NOT_READY',
  rejectPlanningBrief.planningBriefReadiness,
);

const rejectArchitecture = validateArchitectureBrief({
  brief: buildMinimalArchitectureBrief(),
  gateDecision: 'REJECT_PLANNING',
  planningBriefConfidence: 80,
  gateConfidence: 80,
});
assert(
  '1 REJECT_PLANNING caps architecture brief',
  rejectArchitecture.architectureBriefReadiness === 'NOT_READY',
  rejectArchitecture.architectureBriefReadiness,
);

const rejectBuildPlan = validateBuildPlan({
  plan: buildMinimalBuildPlan(),
  architectureReadiness: 'ARCHITECTURE_READY',
  architectureConfidence: 90,
  gateDecision: 'REJECT_PLANNING',
});
assert(
  '1 REJECT_PLANNING caps build plan',
  rejectBuildPlan.buildPlanReadiness === 'NOT_READY',
  rejectBuildPlan.buildPlanReadiness,
);

const clarifyPlanningBrief = validatePlanningBrief({
  brief: buildMinimalPlanningBrief(),
  gateDecision: 'REQUEST_CLARIFICATION',
  gateConfidence: 92,
  intakeConfidence: 90,
});
assert(
  '2 REQUEST_CLARIFICATION caps planning brief at DRAFT_READY',
  clarifyPlanningBrief.planningBriefReadiness === 'DRAFT_READY',
  clarifyPlanningBrief.planningBriefReadiness,
);
assert(
  '2 confidence preserved under clarification cap',
  clarifyPlanningBrief.planningBriefConfidence >= 85,
  String(clarifyPlanningBrief.planningBriefConfidence),
);

const clarifyArchitecture = validateArchitectureBrief({
  brief: buildMinimalArchitectureBrief(),
  gateDecision: 'REQUEST_CLARIFICATION',
  planningBriefConfidence: 90,
  gateConfidence: 92,
});
assert(
  '2 REQUEST_CLARIFICATION caps architecture at NOT_READY',
  clarifyArchitecture.architectureBriefReadiness === 'NOT_READY',
  clarifyArchitecture.architectureBriefReadiness,
);

const clarifyBuildPlanUncapped = validateBuildPlan({
  plan: buildMinimalBuildPlan(),
  architectureReadiness: 'READY_FOR_EXECUTION_PLANNING',
  architectureConfidence: 92,
});
const clarifyBuildPlan = validateBuildPlan({
  plan: buildMinimalBuildPlan(),
  architectureReadiness: 'READY_FOR_EXECUTION_PLANNING',
  architectureConfidence: 92,
  gateDecision: 'REQUEST_CLARIFICATION',
});
assert(
  '2 REQUEST_CLARIFICATION caps build plan below execution planning',
  clarifyBuildPlan.buildPlanReadiness === 'NOT_READY',
  clarifyBuildPlan.buildPlanReadiness,
);
assert(
  '2 build plan confidence not artificially reduced',
  clarifyBuildPlan.buildPlanConfidence === clarifyBuildPlanUncapped.buildPlanConfidence,
  `${clarifyBuildPlanUncapped.buildPlanConfidence} vs ${clarifyBuildPlan.buildPlanConfidence}`,
);

const limitedArchitecture = validateArchitectureBrief({
  brief: buildMinimalArchitectureBrief(),
  gateDecision: 'ALLOW_LIMITED_PLANNING',
  planningBriefConfidence: 75,
  gateConfidence: 72,
});
assert(
  '3 ALLOW_LIMITED_PLANNING permits architecture draft',
  limitedArchitecture.architectureBriefReadiness === 'ARCHITECTURE_DRAFT_READY',
  limitedArchitecture.architectureBriefReadiness,
);

const limitedBuildPlan = validateBuildPlan({
  plan: buildMinimalBuildPlan(),
  architectureReadiness: 'ARCHITECTURE_DRAFT_READY',
  architectureConfidence: 78,
  gateDecision: 'ALLOW_LIMITED_PLANNING',
});
assert(
  '3 ALLOW_LIMITED_PLANNING permits draft build plan only',
  limitedBuildPlan.buildPlanReadiness === 'DRAFT_BUILD_PLAN',
  limitedBuildPlan.buildPlanReadiness,
);
assert(
  '3 limited planning blocks execution planning',
  limitedBuildPlan.buildPlanReadiness !== 'READY_FOR_EXECUTION_PLANNING',
  limitedBuildPlan.buildPlanReadiness,
);

const fullBuildPlan = validateBuildPlan({
  plan: buildMinimalBuildPlan(),
  architectureReadiness: 'ARCHITECTURE_READY',
  architectureConfidence: 88,
  gateDecision: 'ALLOW_FULL_PLANNING',
});
assert(
  '4 ALLOW_FULL_PLANNING permits execution planning readiness',
  fullBuildPlan.buildPlanReadiness === 'READY_FOR_EXECUTION_PLANNING',
  fullBuildPlan.buildPlanReadiness,
);

const clarificationGaps = buildKnownGaps({
  gateInput: {
    unifiedIntakeAnalysis: null,
    requirementCompletenessAnalysis: null,
    planningGateAnalysis: {
      readOnly: true,
      analysisId: 'gate-fixture',
      analyzedAt: new Date().toISOString(),
      planningGateDecision: 'REQUEST_CLARIFICATION',
      planningReadiness: {
        readOnly: true,
        planningReadinessCategory: 'NEEDS_CLARIFICATION',
        planningReadinessScore: 55,
      },
      planningGateExplanation: {
        readOnly: true,
        confidence: 92,
        summary: 'Clarification required',
        evidenceUsed: [],
        risksFound: [],
        missingInformation: ['Missing scope'],
      },
      planningRiskAnalysis: {
        readOnly: true,
        riskCount: 1,
        risks: [],
        overallRiskLevel: 'HIGH',
      },
      planningGateQuestions: [
        {
          readOnly: true,
          questionId: 'q-critical',
          question: 'What is the primary monetization model?',
          priority: 'CRITICAL',
          category: 'BUSINESS',
          evidence: ['MISSING_MONETIZATION'],
        },
        {
          readOnly: true,
          questionId: 'q-high',
          question: 'Which mobile platforms are required at launch?',
          priority: 'HIGH',
          category: 'PLATFORM',
          evidence: ['PLATFORM_UNCLEAR'],
        },
      ],
      evidenceSufficiency: {
        readOnly: true,
        evidenceSufficiencyScore: 60,
        dimensions: [],
        activeSourceCount: 1,
      },
      safeToPlan: false,
    },
  },
  bundle: {
    readOnly: true,
    sources: ['TYPED_PROMPT'],
    screens: [],
    workflows: [],
    userRoles: [],
    businessRules: [],
    integrations: [],
    platforms: ['WEB'],
    productType: 'WEB_APP',
    productName: 'Fixture Product',
    objective: 'Validate planning gate alignment',
    targetUsers: ['founder'],
  },
});
const clarificationPreserved = clarificationGaps.filter((gap) => gap.category === 'CLARIFICATION_REQUEST');
assert(
  '5 clarification requests preserved downstream',
  clarificationPreserved.length >= 2,
  `${clarificationPreserved.length}`,
);

resetFounderTestAutomationModuleForTests();
const strongSweep = buildStrongSweep();
const strongBlockers = prioritizeLaunchBlockers({ sweepReport: strongSweep });
const highConfidenceUpstream: UpstreamChainConfidenceContext = {
  readOnly: true,
  unifiedIntakeConfidence: 92,
  planningGateConfidence: 92,
  planningBriefConfidence: 90,
  architectureBriefConfidence: 88,
  buildPlanConfidence: 86,
  unifiedIntakeReadiness: 'READY_FOR_PLANNING',
  planningGateReadiness: 'NEEDS_CLARIFICATION',
  planningGateDecision: 'REQUEST_CLARIFICATION',
  planningBriefReadiness: 'DRAFT_READY',
  architectureBriefReadiness: 'NOT_READY',
  buildPlanReadiness: 'NOT_READY',
};
const cappedFounderReadiness = analyzeExecutionReadiness({
  sweepReport: strongSweep,
  prioritizedBlockers: strongBlockers,
  upstreamChainConfidence: highConfidenceUpstream,
});
assert(
  '6 confidence not artificially reduced under gate cap',
  cappedFounderReadiness.confidenceScore >= 80,
  String(cappedFounderReadiness.confidenceScore),
);
assert(
  '6 readiness capped under clarification gate',
  cappedFounderReadiness.executionReadinessState === 'HIGH_RISK' ||
    cappedFounderReadiness.executionReadinessState === 'NOT_READY',
  cappedFounderReadiness.executionReadinessState,
);

const gateCapOnly = applyGateReadinessCap({
  gateDecision: 'REQUEST_CLARIFICATION',
  readinessScore: 94,
  executionReadinessState: 'READY_FOR_EXECUTION',
});
assert(
  '6 gate cap does not touch confidence path',
  gateCapOnly.readinessScore <= 45 && gateCapOnly.executionReadinessState === 'HIGH_RISK',
  `${gateCapOnly.readinessScore}/${gateCapOnly.executionReadinessState}`,
);

resetFounderSimulationEngineModuleForTests();
const mobileScenario = getFounderSimulationScenarioByType('MOBILE_FIRST');
const mobileJourney = mobileScenario
  ? simulateFounderJourney({ scenario: mobileScenario, applyAlignmentRepair: true })
  : null;
assert('7 founder simulation mobile-first runs', mobileJourney != null, mobileJourney?.finalVerdict ?? 'null');
assert(
  '7 founder simulation still planning-ready',
  mobileJourney != null && mobileJourney.finalVerdict === 'READY_FOR_PLANNING',
  mobileJourney?.finalVerdict ?? 'none',
);

const orchestrationProof = runOrchestrationProof({ skipHistoryRecording: true });
assert(
  '8 orchestration proof complete',
  orchestrationProof.orchestrationState === 'ORCHESTRATION_PROOF_COMPLETE',
  orchestrationProof.orchestrationState,
);
const proofScoreAfter = orchestrationProof.analysis?.orchestrationProofScore ?? 0;
assert('8 orchestration proof score healthy', proofScoreAfter >= 60, String(proofScoreAfter));

const escalationSnapshots: AuthorityProjectSnapshot[] = [
  snapshot('PLANNING_BRIEF_GENERATOR', 'READY_FOR_EXECUTION_PLANNING'),
  snapshot('BUILD_PLAN_GENERATOR', 'READY_FOR_EXECUTION_PLANNING'),
];
const escalationCheck = checkReadinessAlignment({
  gateDecision: 'REQUEST_CLARIFICATION',
  snapshots: escalationSnapshots,
  clarificationGapCount: 2,
});
assert(
  '9 readiness escalation detected',
  escalationCheck.escalations.length >= 2,
  `${escalationCheck.escalations.length}`,
);
assert(
  '9 escalation finding type valid',
  escalationCheck.escalations.every((finding) => finding.description.includes('READINESS_ESCALATION')),
  'yes',
);

const propagationWithGate = analyzeReadinessPropagation(escalationSnapshots, 'REQUEST_CLARIFICATION');
assert(
  '9 propagation analyzer flags gate escalation',
  propagationWithGate.issues.some((issue) => issue.issueType === 'READINESS_ESCALATION'),
  `${propagationWithGate.issues.length}`,
);
assert(
  '9 isReadinessEscalation helper',
  isReadinessEscalation('REQUEST_CLARIFICATION', 'BUILD_PLAN', 'READY_FOR_EXECUTION_PLANNING'),
  'true',
);
assert(
  '9 capReadinessToGatePermission helper',
  (capReadinessToGatePermission('REQUEST_CLARIFICATION', 'PLANNING_BRIEF', 'PLANNING_READY') as string) ===
    'DRAFT_READY',
  'DRAFT_READY',
);

const matrixSource = readFileSync(
  join(ROOT, 'src/planning-gate-authority/readiness-permission-matrix.ts'),
  'utf8',
);
assert(
  '10 no validator recursion marker',
  !matrixSource.includes('validate-planning-gate-alignment-repair'),
  createHash('sha256').update(matrixSource).digest('hex').slice(0, 12),
);

const inconsistentBefore = compareReadinessInconsistencyCount({
  gateDecision: 'REQUEST_CLARIFICATION',
  snapshots: escalationSnapshots,
});
const alignedSnapshots: AuthorityProjectSnapshot[] = [
  snapshot('PLANNING_BRIEF_GENERATOR', 'DRAFT_READY'),
  snapshot('ARCHITECTURE_BRIEF_GENERATOR', 'NOT_READY'),
  snapshot('BUILD_PLAN_GENERATOR', 'NOT_READY'),
  snapshot('FOUNDER_TEST_AUTOMATION', 'HIGH_RISK'),
];
const inconsistentAfter = compareReadinessInconsistencyCount({
  gateDecision: 'REQUEST_CLARIFICATION',
  snapshots: alignedSnapshots,
});

const failed = results.filter((result) => !result.passed);
const passToken = failed.length === 0 ? PLANNING_GATE_ALIGNMENT_REPAIR_V1_PASS : 'VALIDATION_FAILED';

const reportLines = [
  '# Planning Gate Alignment Repair Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Before Behavior',
  '',
  '- Planning Gate could emit REQUEST_CLARIFICATION while downstream authorities reported READY_FOR_EXECUTION_PLANNING',
  '- Readiness states were not capped to gate permission matrix',
  '- Founder test readiness could exceed clarification gate limits despite high confidence',
  '',
  '## After Behavior',
  '',
  '- Planning Gate is the highest authority for planning readiness permissions',
  '- Downstream validators cap readiness via `capReadinessToGatePermission`',
  '- Founder test applies `applyGateReadinessCap` without reducing confidence',
  '- `READINESS_ALIGNMENT_CHECK` detects READINESS_ESCALATION across the chain',
  '',
  '## Repaired Authorities',
  '',
  '- `planning-gate-authority/readiness-permission-matrix.ts` — permission matrix and caps',
  '- `planning-brief-generator/planning-brief-validator.ts`',
  '- `architecture-brief-generator/architecture-brief-validator.ts`',
  '- `build-plan-generator/build-plan-validator.ts` + `build-plan-builder.ts`',
  '- `founder-test-automation/confidence-propagation-repair.ts` + `execution-readiness-analyzer.ts`',
  '- `cross-system-orchestration-proof/readiness-alignment-check.ts`',
  '- `cross-system-orchestration-proof/readiness-propagation-analyzer.ts`',
  '',
  '## Readiness Alignment Findings',
  '',
  `- REQUEST_CLARIFICATION planning brief cap: ${clarifyPlanningBrief.planningBriefReadiness}`,
  `- REQUEST_CLARIFICATION build plan cap: ${clarifyBuildPlan.buildPlanReadiness}`,
  `- ALLOW_LIMITED build plan: ${limitedBuildPlan.buildPlanReadiness}`,
  `- ALLOW_FULL build plan: ${fullBuildPlan.buildPlanReadiness}`,
  `- Escalation detections (fixture): ${escalationCheck.escalations.length}`,
  '',
  '## Clarification Preservation Findings',
  '',
  `- Clarification gaps preserved: ${clarificationPreserved.length}`,
  `- Clarification preservation check: ${escalationCheck.clarificationPreservation?.preserved === true ? 'PASS' : 'FAIL'}`,
  '',
  '## READINESS_ALIGNMENT_IMPACT',
  '',
  `- Readiness inconsistencies before (fixture): ${inconsistentBefore}`,
  `- Readiness inconsistencies after (aligned fixture): ${inconsistentAfter}`,
  `- Proof score after repair: ${proofScoreAfter}/100`,
  `- Founder simulation verdict: ${mobileJourney?.finalVerdict ?? 'n/a'}`,
  `- Founder test readiness under clarification gate: ${cappedFounderReadiness.executionReadinessState} (confidence ${cappedFounderReadiness.confidenceScore})`,
  '',
  '## Remaining Readiness Risks',
  '',
  '- Gate decision must be threaded into every downstream authority input; missing gateDecision bypasses cap in build plan validator',
  '- Sequential readiness inflation heuristics may still flag valid limited-planning progressions',
  '- Clarification preservation depends on CRITICAL/HIGH gate questions flowing into planning brief knownGaps',
  '',
  '## Validation Summary',
  '',
  ...results.map((result) => `- [${result.passed ? 'x' : ' '}] ${result.name}: ${result.detail}`),
  '',
  passToken,
  '',
];

writeFileSync(join(ROOT, 'architecture/PLANNING_GATE_ALIGNMENT_REPAIR_REPORT.md'), reportLines.join('\n'), 'utf8');

console.log('Planning Gate Alignment Repair Validation');
console.log('=========================================');
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
}
console.log('');
console.log(`Checks: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
console.log(failed.length === 0 ? PLANNING_GATE_ALIGNMENT_REPAIR_V1_PASS : 'VALIDATION_FAILED');
process.exit(failed.length === 0 ? 0 : 1);
