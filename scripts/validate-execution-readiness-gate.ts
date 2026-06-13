/**
 * Phase 26.39 — Execution Readiness Gate V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OrchestrationProofAnalysis } from '../src/cross-system-orchestration-proof/orchestration-proof-types.js';
import {
  EXECUTION_READINESS_GATE_V1_PASS,
  MAX_EXECUTION_READINESS_HISTORY,
  EXECUTION_GATE_DECISIONS,
  EXECUTION_READINESS_CATEGORIES,
  SAFETY_GUARANTEES,
  assessExecutionReadiness,
  analyzeExecutionBlockers,
  buildExecutionReadinessGateArtifacts,
  consolidateExecutionEvidence,
  detectExecutionRisks,
  evaluateExecutionPermission,
  getExecutionReadinessHistorySize,
  hasMinimumExecutionEvidence,
  mapExecutionReadinessCategory,
  resetExecutionReadinessGateModuleForTests,
  runExecutionReadinessGate,
  scoreExecutionReadiness,
} from '../src/execution-readiness-gate/index.js';
import type { PlanningGateAnalysis } from '../src/planning-gate-authority/planning-gate-types.js';
import type { UnifiedIntakeAnalysis } from '../src/unified-intake-intelligence/unified-intake-types.js';
import type { FounderSimulationResult } from '../src/founder-simulation-engine/founder-simulation-types.js';
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
  'src/execution-readiness-gate/execution-readiness-types.ts',
  'src/execution-readiness-gate/execution-readiness-registry.ts',
  'src/execution-readiness-gate/execution-evidence-consolidator.ts',
  'src/execution-readiness-gate/execution-risk-detector.ts',
  'src/execution-readiness-gate/execution-blocker-analyzer.ts',
  'src/execution-readiness-gate/execution-readiness-scorer.ts',
  'src/execution-readiness-gate/execution-decision-engine.ts',
  'src/execution-readiness-gate/execution-history.ts',
  'src/execution-readiness-gate/execution-report-builder.ts',
  'src/execution-readiness-gate/execution-readiness-gate.ts',
  'src/execution-readiness-gate/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildStrongIntake(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'exec-gate-strong-intake',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
      typedPromptExcerpt: 'Build a SaaS mobile app',
      platforms: ['IOS', 'ANDROID'],
      screens: ['dashboard', 'onboarding', 'checkout'],
      workflows: ['onboarding', 'checkout', 'authentication'],
      userRoles: ['admin', 'user'],
      integrations: ['Stripe'],
      notifications: ['push'],
      authentication: ['OAuth'],
      dataEntities: ['user'],
      businessRules: ['Users must authenticate'],
      visualComponents: [],
      inferredFlows: ['ONBOARDING'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 3,
      evidenceItemCount: 18,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MOBILE_APP',
      platformTargets: ['IOS', 'ANDROID'],
      primaryPurpose: 'Mobile SaaS',
      targetUsers: ['founders'],
      businessObjective: 'Subscription revenue',
      confidence: 92,
      evidence: ['TYPED_PROMPT'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP',
      platforms: ['IOS', 'ANDROID'],
      workflows: ['onboarding', 'checkout'],
      screens: ['dashboard', 'onboarding'],
      userRoles: ['admin', 'user'],
      entities: ['user'],
      integrations: ['Stripe'],
      businessRules: ['Users must authenticate'],
      confidence: 92,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
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

function buildMinimalOrchestrationProof(score: number): OrchestrationProofAnalysis {
  return {
    readOnly: true,
    proofId: `orch-fixture-${score}`,
    analyzedAt: new Date().toISOString(),
    orchestrationProofScore: score,
    orchestrationProofCategory: score >= 90 ? 'FULLY_PROVEN_CHAIN' : score >= 70 ? 'CONSISTENT_CHAIN' : 'PARTIAL_CHAIN',
    systemOrchestrationProof: {
      readOnly: true,
      authoritiesEvaluated: ['UNIFIED_INTAKE_INTELLIGENCE', 'PLANNING_GATE_AUTHORITY'],
      authoritiesConsistent: ['UNIFIED_INTAKE_INTELLIGENCE'],
      authoritiesInconsistent: score < 70 ? ['PLANNING_GATE_AUTHORITY'] : [],
      informationLosses: score < 70 ? [{ readOnly: true, lossId: 'loss-1', field: 'workflows', upstreamAuthority: 'UNIFIED_INTAKE_INTELLIGENCE', downstreamAuthority: 'PLANNING_BRIEF_GENERATOR', lostItems: ['checkout'], upstreamCount: 3, downstreamCount: 2, severity: 'HIGH', evidence: ['LOST'] }] : [],
      driftFindings: [],
      confidenceFindings: [],
      readinessFindings: [],
    },
    evidencePropagation: { readOnly: true, preservedCount: 3, expandedCount: 0, inventedCount: 0, lostCount: score < 70 ? 1 : 0, preservedSources: ['TYPED_PROMPT'], inventedSources: [], lostSources: [], issues: [] },
    confidencePropagation: { readOnly: true, steps: [], collapseDetected: false, collapseAuthority: null, maxDrop: 5, issues: [] },
    readinessPropagation: { readOnly: true, steps: [], inflationDetected: false, inflationAuthority: null, issues: [] },
    orchestrationFailures: score < 40 ? [{ readOnly: true, failureId: 'f-1', failingAuthority: 'PLANNING_GATE_AUTHORITY', issueType: 'READINESS_ESCALATION', lostEvidence: [], severity: 'CRITICAL', launchImpact: 'Broken chain', recommendedRepair: 'Fix alignment', evidence: ['BROKEN'] }] : [],
    chainConsistencyResults: [],
    authoritySnapshots: [],
    repairRecommendations: [],
    strongestAuthorities: ['UNIFIED_INTAKE_INTELLIGENCE'],
    failingAuthorities: score < 70 ? ['PLANNING_GATE_AUTHORITY'] : [],
  };
}

function buildFullPlanningGate(): PlanningGateAnalysis {
  return {
    readOnly: true,
    analysisId: 'gate-full-planning',
    analyzedAt: new Date().toISOString(),
    evidenceSufficiency: {
      readOnly: true,
      evidenceSufficiencyScore: 88,
      dimensions: [],
      activeSourceCount: 4,
    },
    planningRiskAnalysis: { readOnly: true, risks: [], overallRiskLevel: 'LOW', riskCount: 0 },
    planningReadiness: {
      readOnly: true,
      planningReadinessScore: 88,
      planningReadinessCategory: 'READY_FOR_PLANNING',
    },
    planningGateDecision: 'ALLOW_FULL_PLANNING',
    planningGateExplanation: {
      readOnly: true,
      evidenceUsed: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
      risksFound: [],
      missingInformation: [],
      confidence: 90,
      summary: 'Full planning permitted — evidence sufficient.',
    },
    planningGateQuestions: [],
    safeToPlan: true,
  };
}

function buildHealthySimulation(): FounderSimulationResult {
  return {
    readOnly: true,
    simulationId: 'sim-healthy',
    scenarioName: 'Mobile First',
    scenarioType: 'MOBILE_FIRST',
    simulatedAt: new Date().toISOString(),
    stageResults: [],
    failedStages: [],
    skippedStages: [],
    readinessScore: 92,
    readinessCategory: 'READY_FOR_PLANNING',
    finalVerdict: 'READY_FOR_PLANNING',
    founderFacingExplanation: 'Strong chain supports planning readiness.',
    nextBestAction: 'Proceed with planning',
    systemIntegrationProof: {
      readOnly: true,
      authoritiesReached: ['UNIFIED_INTAKE_INTELLIGENCE'],
      authoritiesPassed: ['UNIFIED_INTAKE_INTELLIGENCE'],
      authoritiesFailed: [],
      missingIntegrations: [],
      weakLinks: [],
      strongestEvidence: ['TYPED_PROMPT'],
      launchBlockers: [],
    },
    failureAnalysis: [],
  };
}

function buildWeakSimulation(): FounderSimulationResult {
  return {
    ...buildHealthySimulation(),
    simulationId: 'sim-weak',
    readinessScore: 25,
    readinessCategory: 'NOT_READY',
    finalVerdict: 'NOT_READY',
    nextBestAction: 'Resolve intake gaps',
  };
}

function buildPlanningBrief(readiness: PlanningBrief['planningBriefReadiness']): PlanningBrief {
  return {
    readOnly: true,
    briefId: 'pb-exec-gate',
    generatedAt: new Date().toISOString(),
    projectSummary: {
      readOnly: true,
      productName: 'SaaS App',
      productType: 'MOBILE_APP',
      objective: 'Launch mobile SaaS',
      targetUsers: ['founders'],
    },
    platformTargets: ['IOS', 'ANDROID'],
    screenInventory: [{ readOnly: true, screenId: 's1', name: 'dashboard', evidence: ['TYPED_PROMPT'] }],
    workflowInventory: [{ readOnly: true, workflowId: 'w1', name: 'onboarding', evidence: ['TYPED_PROMPT'] }],
    userRoles: ['user'],
    businessRules: ['auth required'],
    integrations: ['Stripe'],
    knownGaps: [],
    evidenceSources: ['TYPED_PROMPT'],
    planningBriefConfidence: 88,
    planningBriefQuality: 'COMPLETE',
    planningBriefReadiness: readiness,
  };
}

function buildClarificationGate(): PlanningGateAnalysis {
  return {
    readOnly: true,
    analysisId: 'gate-clarification',
    analyzedAt: new Date().toISOString(),
    evidenceSufficiency: {
      readOnly: true,
      evidenceSufficiencyScore: 65,
      dimensions: [],
      activeSourceCount: 2,
    },
    planningRiskAnalysis: { readOnly: true, risks: [], overallRiskLevel: 'MEDIUM', riskCount: 1 },
    planningReadiness: {
      readOnly: true,
      planningReadinessScore: 55,
      planningReadinessCategory: 'NEEDS_CLARIFICATION',
    },
    planningGateDecision: 'REQUEST_CLARIFICATION',
    planningGateExplanation: {
      readOnly: true,
      evidenceUsed: ['TYPED_PROMPT'],
      risksFound: ['Missing scope'],
      missingInformation: ['Monetization model'],
      confidence: 72,
      summary: 'Clarification required before full planning.',
    },
    planningGateQuestions: [
      {
        readOnly: true,
        questionId: 'q1',
        question: 'What is the monetization model?',
        priority: 'CRITICAL',
        category: 'BUSINESS',
        evidence: ['MISSING_MONETIZATION'],
      },
    ],
    safeToPlan: false,
  };
}

function buildRejectedGate(): PlanningGateAnalysis {
  return {
    ...buildClarificationGate(),
    analysisId: 'gate-rejected',
    planningGateDecision: 'REJECT_PLANNING',
    planningReadiness: {
      readOnly: true,
      planningReadinessScore: 20,
      planningReadinessCategory: 'NOT_READY',
    },
    planningGateExplanation: {
      readOnly: true,
      evidenceUsed: ['TYPED_PROMPT'],
      risksFound: ['Insufficient evidence'],
      missingInformation: ['Product scope'],
      confidence: 30,
      summary: 'Planning rejected — insufficient evidence.',
    },
    safeToPlan: false,
  };
}

resetExecutionReadinessGateModuleForTests();

const strongIntake = buildStrongIntake();
const strongGate = buildFullPlanningGate();
assert('A strong planning gate produced', strongGate != null, strongGate.planningGateDecision);

const strongInput = {
  unifiedIntakeAnalysis: strongIntake,
  planningGateAnalysis: strongGate,
  planningBrief: buildPlanningBrief('PLANNING_READY'),
  orchestrationProofAnalysis: buildMinimalOrchestrationProof(88),
  founderSimulationResult: buildHealthySimulation(),
  skipHistoryRecording: true,
};

assert('A minimum evidence satisfied', hasMinimumExecutionEvidence(strongInput), 'yes');
const strongSnapshot = consolidateExecutionEvidence(strongInput);
assert('A evidence consolidation', strongSnapshot.readinessSignals.length >= 3, `${strongSnapshot.readinessSignals.length}`);
assert('A sources collected', strongSnapshot.sources.length >= 1, `${strongSnapshot.sources.length}`);

const strongRisks = detectExecutionRisks(strongSnapshot);
assert('B risk detection runs', strongRisks.riskCount >= 0, `${strongRisks.riskCount}`);
assert('B strong chain low critical risks', strongRisks.criticalRiskCount === 0, `${strongRisks.criticalRiskCount}`);

const strongBlockers = analyzeExecutionBlockers(strongInput);
assert('C blocker analysis runs', strongBlockers.blockers.length >= 0, `${strongBlockers.blockers.length}`);
assert('C strong chain no critical blockers', strongBlockers.unresolvedCriticalCount === 0, `${strongBlockers.unresolvedCriticalCount}`);

const strongScore = scoreExecutionReadiness({
  snapshot: strongSnapshot,
  riskAnalysis: strongRisks,
  blockerSummary: strongBlockers,
});
assert('D readiness score generated', strongScore.executionReadinessScore >= 70, `${strongScore.executionReadinessScore}`);
assert(
  'D readiness category valid',
  EXECUTION_READINESS_CATEGORIES.includes(strongScore.executionReadinessCategory),
  strongScore.executionReadinessCategory,
);
assert('D map category 95', mapExecutionReadinessCategory(95) === 'EXECUTION_READY', 'EXECUTION_READY');

const strongAnalysis = assessExecutionReadiness(strongInput);
assert('E strong analysis complete', strongAnalysis != null, strongAnalysis?.executionGateDecision ?? 'null');
assert(
  'E strong chain can progress',
  strongAnalysis != null &&
    (strongAnalysis.executionGateDecision === 'ALLOW_EXECUTION' ||
      strongAnalysis.executionGateDecision === 'ALLOW_EXECUTION_PREPARATION'),
  strongAnalysis?.executionGateDecision ?? 'null',
);
assert('E strong safe to proceed', strongAnalysis?.safeToProceed === true, String(strongAnalysis?.safeToProceed));

const weakInput = {
  unifiedIntakeAnalysis: strongIntake,
  planningGateAnalysis: buildRejectedGate(),
  orchestrationProofAnalysis: buildMinimalOrchestrationProof(30),
  founderSimulationResult: buildWeakSimulation(),
  skipHistoryRecording: true,
};
const weakAnalysis = assessExecutionReadiness(weakInput);
assert('F weak chain blocked', weakAnalysis?.executionGateDecision === 'REJECT_EXECUTION', weakAnalysis?.executionGateDecision ?? 'null');
assert('F weak not safe to proceed', weakAnalysis?.safeToProceed === false, String(weakAnalysis?.safeToProceed));

const clarifyInput = {
  unifiedIntakeAnalysis: strongIntake,
  planningGateAnalysis: buildClarificationGate(),
  planningBrief: buildPlanningBrief('DRAFT_READY'),
  orchestrationProofAnalysis: buildMinimalOrchestrationProof(72),
  founderSimulationResult: buildHealthySimulation(),
  skipHistoryRecording: true,
};
const clarifyAnalysis = assessExecutionReadiness(clarifyInput);
assert(
  'G clarification recommends remediation',
  clarifyAnalysis != null &&
    (clarifyAnalysis.executionGateDecision === 'REQUEST_REMEDIATION' ||
      clarifyAnalysis.executionGateDecision === 'ALLOW_EXECUTION_PREPARATION'),
  clarifyAnalysis?.executionGateDecision ?? 'null',
);
assert(
  'G clarification blockers detected',
  (clarifyAnalysis?.blockerSummary.unresolvedCriticalCount ?? 0) >= 1,
  `${clarifyAnalysis?.blockerSummary.unresolvedCriticalCount}`,
);

const orchFailInput = {
  unifiedIntakeAnalysis: strongIntake,
  planningGateAnalysis: strongGate,
  orchestrationProofAnalysis: buildMinimalOrchestrationProof(35),
  founderSimulationResult: buildHealthySimulation(),
  skipHistoryRecording: true,
};
const orchFailAnalysis = assessExecutionReadiness(orchFailInput);
assert(
  'H orchestration failure blocks execution',
  orchFailAnalysis != null && orchFailAnalysis.executionGateDecision !== 'ALLOW_EXECUTION',
  orchFailAnalysis?.executionGateDecision ?? 'null',
);

const permissionBlocked = evaluateExecutionPermission({
  snapshot: {
    ...strongSnapshot,
    planningGateAligned: false,
    readinessEscalationCount: 2,
    orchestrationProofScore: 75,
  },
  blockerSummary: { readOnly: true, blockers: [], criticalCount: 0, highCount: 0, unresolvedCount: 0, unresolvedCriticalCount: 0 },
  proposedDecision: 'ALLOW_EXECUTION',
});
assert('I permission matrix blocks misaligned gate', permissionBlocked.permitted === false, String(permissionBlocked.permitted));
assert(
  'I permission caps decision',
  permissionBlocked.cappedDecision !== 'ALLOW_EXECUTION',
  permissionBlocked.cappedDecision,
);

const permissionAllowed = evaluateExecutionPermission({
  snapshot: {
    ...strongSnapshot,
    planningGateAligned: true,
    readinessEscalationCount: 0,
    orchestrationProofScore: 85,
    founderSimulationVerdict: 'READY_FOR_PLANNING',
  },
  blockerSummary: { readOnly: true, blockers: [], criticalCount: 0, highCount: 0, unresolvedCount: 0, unresolvedCriticalCount: 0 },
  proposedDecision: 'ALLOW_EXECUTION',
});
assert('I permission matrix allows healthy chain', permissionAllowed.permitted === true, String(permissionAllowed.permitted));

for (let i = 0; i < MAX_EXECUTION_READINESS_HISTORY + 4; i += 1) {
  assessExecutionReadiness({ ...strongInput, skipHistoryRecording: false });
}
assert(
  'J history bounded',
  getExecutionReadinessHistorySize() <= MAX_EXECUTION_READINESS_HISTORY,
  `${getExecutionReadinessHistorySize()}/${MAX_EXECUTION_READINESS_HISTORY}`,
);

const gateRun = runExecutionReadinessGate({ skipHistoryRecording: true });
assert('K gate rejects empty input', gateRun.orchestrationState === 'EXECUTION_READINESS_GATE_FAILED', gateRun.orchestrationState);

const artifacts = buildExecutionReadinessGateArtifacts({
  analyses: strongAnalysis ? [strongAnalysis] : [],
});
assert('L report generated', artifacts.report.latestAnalysis != null, 'yes');
assert('L report markdown includes decision', artifacts.markdown.includes('Execution gate decision'), 'yes');
assert('L report markdown includes blockers', artifacts.markdown.includes('## Blockers'), 'yes');
assert('L pass token in markdown', artifacts.markdown.includes(EXECUTION_READINESS_GATE_V1_PASS), 'yes');

writeFileSync(join(ROOT, 'architecture/EXECUTION_READINESS_GATE_REPORT.md'), artifacts.markdown, 'utf8');
assert('L report written', existsSync(join(ROOT, 'architecture/EXECUTION_READINESS_GATE_REPORT.md')), 'yes');

const gateSource = readFileSync(join(ROOT, 'src/execution-readiness-gate/execution-readiness-gate.ts'), 'utf8');
assert(
  'M read-only safeguards',
  !gateSource.includes('writeFileSync') &&
    !gateSource.includes('generateCode') &&
    SAFETY_GUARANTEES.length >= 5,
  'yes',
);
assert('M decision values defined', EXECUTION_GATE_DECISIONS.length === 4, `${EXECUTION_GATE_DECISIONS.length}`);
assert(
  'M no validator recursion marker',
  !gateSource.includes('validate-execution-readiness-gate'),
  createHash('sha256').update(gateSource).digest('hex').slice(0, 12),
);

const failed = results.filter((result) => !result.passed);
const passToken = failed.length === 0 ? EXECUTION_READINESS_GATE_V1_PASS : 'VALIDATION_FAILED';

console.log('Execution Readiness Gate Validation');
console.log('===================================');
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
}
console.log('');
console.log(`Checks: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
if (strongAnalysis) {
  console.log(`Strong chain: score=${strongAnalysis.readinessScore.executionReadinessScore} decision=${strongAnalysis.executionGateDecision}`);
}
if (weakAnalysis) {
  console.log(`Weak chain: score=${weakAnalysis.readinessScore.executionReadinessScore} decision=${weakAnalysis.executionGateDecision}`);
}
if (clarifyAnalysis) {
  console.log(`Clarification: score=${clarifyAnalysis.readinessScore.executionReadinessScore} decision=${clarifyAnalysis.executionGateDecision}`);
}
console.log(failed.length === 0 ? EXECUTION_READINESS_GATE_V1_PASS : 'VALIDATION_FAILED');
process.exit(failed.length === 0 ? 0 : 1);
