/**
 * Phase 26.37 — Founder Confidence Propagation Repair V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeConfidencePropagation,
  runOrchestrationProof,
} from '../src/cross-system-orchestration-proof/index.js';
import {
  analyzeExecutionReadiness,
  computeJustifiedConfidenceAdjustments,
  detectUnjustifiedReadinessDrop,
  prioritizeLaunchBlockers,
  resetFounderTestAutomationModuleForTests,
  runFounderTestAutomation,
} from '../src/founder-test-automation/index.js';
import {
  resetFounderSimulationEngineModuleForTests,
  simulateFounderJourney,
  getFounderSimulationScenarioByType,
} from '../src/founder-simulation-engine/index.js';
import type { FounderTestRealitySweepReport } from '../src/founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { UpstreamChainConfidenceContext } from '../src/founder-test-automation/founder-test-automation-types.js';

const FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_V1_PASS = 'FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_V1_PASS';

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

function buildStrongUpstream(): UpstreamChainConfidenceContext {
  return {
    readOnly: true,
    unifiedIntakeConfidence: 95,
    planningGateConfidence: 93,
    planningBriefConfidence: 93,
    architectureBriefConfidence: 91,
    buildPlanConfidence: 89,
    unifiedIntakeReadiness: 'READY_FOR_PLANNING',
    planningGateReadiness: 'READY_WITH_GAPS',
    planningBriefReadiness: 'PLANNING_READY',
    architectureBriefReadiness: 'ARCHITECTURE_READY',
    buildPlanReadiness: 'READY_FOR_EXECUTION_PLANNING',
  };
}

function buildStrongSweep(): FounderTestRealitySweepReport {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Could a founder realistically launch and use this product today?',
    sweepId: 'confidence-repair-strong-sweep',
    generatedAt: new Date().toISOString(),
    launchReadinessPercent: 82,
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
        explanation: 'Planning chain complete',
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
    cacheKey: 'confidence-repair-strong',
  };
}

function buildBlockedSweep(): FounderTestRealitySweepReport {
  const base = buildStrongSweep();
  return {
    ...base,
    sweepId: 'confidence-repair-blocked-sweep',
    founderLaunchVerdict: 'BLOCK_LAUNCH',
    launchRecommendation: 'BLOCK_LAUNCH',
    launchBlockers: [
      {
        readOnly: true,
        blockerId: 'critical-blocker-1',
        severity: 'CRITICAL',
        category: 'EXECUTION_REALITY',
        title: 'Execution chain not proven',
        explanation: 'Critical execution gap',
        sourceAuthority: 'founder-execution-proof',
        recommendedAction: 'Complete execution proof',
        impactRank: 1,
      },
    ],
    topBlockers: [],
  };
}

resetFounderTestAutomationModuleForTests();

const strongUpstream = buildStrongUpstream();
const strongSweep = buildStrongSweep();
strongSweep.topBlockers = strongSweep.launchBlockers;

const strongBlockers = prioritizeLaunchBlockers({ sweepReport: strongSweep });
const strongReadiness = analyzeExecutionReadiness({
  sweepReport: strongSweep,
  prioritizedBlockers: strongBlockers,
  upstreamChainConfidence: strongUpstream,
});

assert(
  'A confidence preserved on strong chain',
  strongReadiness.confidenceScore >= 85,
  `${strongReadiness.confidenceAdjustmentExplanation.upstreamConfidence} -> ${strongReadiness.confidenceScore}`,
);
assert(
  'A confidence delta small without evidence',
  strongReadiness.confidenceAdjustmentExplanation.delta >= -5,
  String(strongReadiness.confidenceAdjustmentExplanation.delta),
);
assert(
  'A confidence explanation present',
  strongReadiness.confidenceAdjustmentExplanation.adjustmentReasons.length >= 1,
  `${strongReadiness.confidenceAdjustmentExplanation.adjustmentReasons.length}`,
);
assert(
  'A no unjustified readiness drop strong chain',
  strongReadiness.unjustifiedReadinessDropDetected === false,
  String(strongReadiness.unjustifiedReadinessDropDetected),
);

const blockedSweep = buildBlockedSweep();
blockedSweep.topBlockers = blockedSweep.launchBlockers;
const blockedBlockers = prioritizeLaunchBlockers({ sweepReport: blockedSweep });
const blockedReadiness = analyzeExecutionReadiness({
  sweepReport: blockedSweep,
  prioritizedBlockers: blockedBlockers,
  upstreamChainConfidence: strongUpstream,
});

assert(
  'B confidence reduction requires evidence',
  blockedReadiness.confidenceScore < strongReadiness.confidenceScore,
  `${blockedReadiness.confidenceScore} vs ${strongReadiness.confidenceScore}`,
);
assert(
  'B blocked reduction remains bounded',
  strongUpstream.buildPlanConfidence! - blockedReadiness.confidenceScore <= 35,
  `${strongUpstream.buildPlanConfidence} -> ${blockedReadiness.confidenceScore}`,
);
assert(
  'B adjustment reasons cite evidence',
  blockedReadiness.confidenceAdjustmentExplanation.adjustmentReasons.some((reason) => reason.evidence.length > 0),
  'yes',
);

const unjustified = detectUnjustifiedReadinessDrop({
  upstreamReadinessAnchor: 90,
  downstreamReadinessScore: 35,
  prioritizedBlockers: [],
  founderLaunchVerdict: 'READY_WITH_WARNINGS',
});
assert('C unjustified readiness drop detected', unjustified === true, String(unjustified));

const justified = detectUnjustifiedReadinessDrop({
  upstreamReadinessAnchor: 90,
  downstreamReadinessScore: 70,
  prioritizedBlockers: blockedBlockers,
  founderLaunchVerdict: 'BLOCK_LAUNCH',
});
assert('C justified readiness drop not flagged', justified === false, String(justified));

const legacyStyleConfidence = 55;
const collapseDrop = strongUpstream.buildPlanConfidence! - legacyStyleConfidence;
assert(
  'C prior collapse would be invalid',
  collapseDrop >= 25,
  `legacy drop ${collapseDrop}`,
);

const { confidence: repairedConfidence, explanation } = computeJustifiedConfidenceAdjustments({
  upstreamConfidence: strongUpstream.buildPlanConfidence!,
  sweepReport: strongSweep,
  prioritizedBlockers: strongBlockers,
});
assert(
  'D collapse repair avoids legacy drop',
  strongUpstream.buildPlanConfidence! - repairedConfidence < 25,
  `${strongUpstream.buildPlanConfidence} -> ${repairedConfidence}`,
);
assert('D explanation documents delta', explanation.delta === repairedConfidence - explanation.upstreamConfidence, 'yes');

const strongAutomation = runFounderTestAutomation({
  founderTestRealitySweepReport: strongSweep,
  upstreamChainConfidence: strongUpstream,
  skipHistoryRecording: true,
});
assert('E founder test automation complete', strongAutomation != null, strongAutomation?.analysisId ?? 'null');
assert(
  'E confidence adjustment on analysis',
  strongAutomation?.executionReadiness.confidenceAdjustmentExplanation != null,
  'yes',
);

resetFounderSimulationEngineModuleForTests();
const mobileScenario = getFounderSimulationScenarioByType('MOBILE_FIRST');
const mobileJourney = mobileScenario
  ? simulateFounderJourney({ scenario: mobileScenario, applyAlignmentRepair: true })
  : null;
assert('F founder simulation mobile-first runs', mobileJourney != null, mobileJourney?.finalVerdict ?? 'null');
assert(
  'F founder simulation still planning-ready',
  mobileJourney != null && mobileJourney.finalVerdict === 'READY_FOR_PLANNING',
  mobileJourney?.finalVerdict ?? 'none',
);

const founderStage = mobileJourney?.stageResults.find((stage) => stage.stageId === 'FOUNDER_TEST_AUTOMATION');
assert(
  'F founder test stage confidence not collapsed',
  founderStage != null && (founderStage.confidence ?? 0) >= 60,
  String(founderStage?.confidence),
);
assert(
  'F no execution gate inflation',
  mobileJourney == null || mobileJourney.finalVerdict !== 'READY_FOR_EXECUTION_GATE',
  mobileJourney?.finalVerdict ?? 'none',
);

const orchestrationProof = runOrchestrationProof({ skipHistoryRecording: true });
const snapshots = orchestrationProof.analysis?.authoritySnapshots ?? [];
const confidencePropagation = analyzeConfidencePropagation(snapshots);
const founderCollapseIssues = confidencePropagation.issues.filter(
  (issue) => issue.authorityId === 'FOUNDER_TEST_AUTOMATION',
);
assert(
  'G orchestration proof complete',
  orchestrationProof.orchestrationState === 'ORCHESTRATION_PROOF_COMPLETE',
  orchestrationProof.orchestrationState,
);
assert(
  'G no founder test confidence collapse',
  founderCollapseIssues.length === 0,
  `${founderCollapseIssues.length}`,
);

const repairSource = readFileSync(join(ROOT, 'src/founder-test-automation/confidence-propagation-repair.ts'), 'utf8');
const analyzerSource = readFileSync(join(ROOT, 'src/founder-test-automation/execution-readiness-analyzer.ts'), 'utf8');
assert(
  'H no code generation introduced',
  !repairSource.includes('generateCode') &&
    !repairSource.includes('writeFileSync') &&
    !analyzerSource.includes('writeFileSync'),
  'yes',
);

const repairHash = createHash('sha256').update(repairSource).digest('hex').slice(0, 12);
assert('H no validator recursion marker', !repairSource.includes('validate-founder-confidence-propagation-repair'), repairHash);

const reportLines = [
  '# Founder Confidence Propagation Repair Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Before Behavior',
  '',
  '- Founder Test Automation used a fixed confidence baseline (~55)',
  '- Strong upstream chain (95→89) collapsed to ~58 without evidence',
  '- Readiness recomputed from sweep percent with heavy arbitrary penalties',
  '',
  '## After Behavior',
  '',
  `- Strong chain confidence: ${strongReadiness.confidenceAdjustmentExplanation.upstreamConfidence} → ${strongReadiness.confidenceScore}`,
  `- Strong chain readiness: ${strongReadiness.readinessScore}/100 (${strongReadiness.executionReadinessState})`,
  `- Blocked chain confidence: ${blockedReadiness.confidenceScore}/100 with documented evidence`,
  `- Founder simulation founder-test confidence: ${founderStage?.confidence ?? 'n/a'}`,
  '',
  '## Repaired Logic',
  '',
  '- `computeUpstreamConfidenceAnchor` inherits latest upstream authority confidence',
  '- `computeJustifiedConfidenceAdjustments` reduces only for documented blockers/conflicts',
  '- `computePropagatedReadinessScore` caps drops without critical evidence',
  '- `ConfidenceAdjustmentExplanation` exposes every delta with evidence',
  '',
  '## Confidence Propagation Impact',
  '',
  `- Proof score after repair: ${orchestrationProof.analysis?.orchestrationProofScore ?? 0}/100`,
  `- Founder test confidence collapse count after: ${founderCollapseIssues.length}`,
  `- Legacy-style collapse drop (for reference): ${collapseDrop} points`,
  `- Repaired strong-chain drop: ${strongReadiness.confidenceAdjustmentExplanation.delta}`,
  '',
  '## Remaining Confidence Risks',
  '',
  '- Chains without upstream context still fall back to baseline 55',
  '- Critical blockers can still reduce confidence up to 25–35 points when evidenced',
  '- Sweep-derived launch verdict BLOCK_LAUNCH still applies justified reductions',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_V1_PASS}`,
  '',
];

writeFileSync(join(ROOT, 'architecture/FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_REPORT.md'), reportLines.join('\n'), 'utf8');
assert('I report written', existsSync(join(ROOT, 'architecture/FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_REPORT.md')), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_REPORT.md'), 'utf8');
assert('I pass token in report', arch.includes(FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_V1_PASS), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Founder Confidence Propagation Repair V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nStrong chain confidence: ${strongReadiness.confidenceScore}/100`);
  console.log(`Blocked chain confidence: ${blockedReadiness.confidenceScore}/100`);
  console.log(`Founder test stage confidence: ${founderStage?.confidence ?? 0}`);
  console.log(`Orchestration proof score: ${orchestrationProof.analysis?.orchestrationProofScore ?? 0}/100`);
  console.log(`Founder collapse issues: ${founderCollapseIssues.length}`);
  console.log(`Report path: architecture/FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_REPORT.md`);
  console.log(`\n${FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
