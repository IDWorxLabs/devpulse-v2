/**
 * Phase 26.35 — Cross-System Orchestration Proof Engine V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS,
  MAX_ORCHESTRATION_PROOF_HISTORY,
  CHAIN_PROOF_SCENARIO_TYPES,
  ORCHESTRATION_PROOF_CATEGORIES,
  SAFETY_GUARANTEES,
  analyzeConfidencePropagation,
  analyzeIntegrationConsistency,
  analyzeReadinessPropagation,
  analyzeRoleConsistency,
  analyzeWorkflowConsistency,
  buildOrchestrationProofReport,
  buildOrchestrationProofReportMarkdown,
  detectInformationLosses,
  extractAuthoritySnapshots,
  getOrchestrationProofHistorySize,
  proveOrchestration,
  resetOrchestrationProofModuleForTests,
  resetOrchestrationProofHistoryForTests,
  runOrchestrationProof,
  runOrchestrationProofAuthority,
} from '../src/cross-system-orchestration-proof/index.js';
import type { UnifiedIntakeAnalysis } from '../src/unified-intake-intelligence/unified-intake-types.js';
import type { PlanningBrief } from '../src/planning-brief-generator/planning-brief-types.js';
import type { BuildPlan } from '../src/build-plan-generator/build-plan-types.js';

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
  'src/cross-system-orchestration-proof/orchestration-proof-types.ts',
  'src/cross-system-orchestration-proof/orchestration-proof-registry.ts',
  'src/cross-system-orchestration-proof/project-consistency-tracker.ts',
  'src/cross-system-orchestration-proof/evidence-propagation-analyzer.ts',
  'src/cross-system-orchestration-proof/workflow-consistency-analyzer.ts',
  'src/cross-system-orchestration-proof/role-consistency-analyzer.ts',
  'src/cross-system-orchestration-proof/integration-consistency-analyzer.ts',
  'src/cross-system-orchestration-proof/confidence-propagation-analyzer.ts',
  'src/cross-system-orchestration-proof/readiness-propagation-analyzer.ts',
  'src/cross-system-orchestration-proof/orchestration-failure-detector.ts',
  'src/cross-system-orchestration-proof/orchestration-proof-history.ts',
  'src/cross-system-orchestration-proof/orchestration-proof-report-builder.ts',
  'src/cross-system-orchestration-proof/orchestration-proof-authority.ts',
  'src/cross-system-orchestration-proof/index.ts',
  'architecture/CROSS_SYSTEM_ORCHESTRATION_PROOF_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildIntakeFixture(workflowCount: number): UnifiedIntakeAnalysis {
  const workflows = ['onboarding', 'checkout', 'authentication', 'administration', 'messaging'].slice(0, workflowCount);
  return {
    readOnly: true,
    analysisId: 'unified-orch-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
      typedPromptExcerpt: 'Build a marketplace app',
      platforms: ['WEB', 'MOBILE'],
      screens: ['dashboard', 'onboarding', 'checkout', 'catalog'],
      workflows,
      userRoles: ['vendor', 'buyer', 'admin'],
      integrations: ['Stripe', 'SendGrid'],
      notifications: ['email'],
      authentication: ['OAuth'],
      dataEntities: ['user', 'product', 'order'],
      businessRules: ['Admin must approve vendors', 'Buyers must authenticate before checkout'],
      visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
      inferredFlows: ['ONBOARDING', 'CHECKOUT'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 3,
      evidenceItemCount: 20,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MARKETPLACE',
      platformTargets: ['WEB', 'MOBILE'],
      primaryPurpose: 'Two-sided marketplace',
      targetUsers: ['vendors', 'buyers'],
      businessObjective: 'Marketplace revenue',
      confidence: 92,
      evidence: ['TYPED_PROMPT'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MARKETPLACE',
      platforms: ['WEB', 'MOBILE'],
      workflows,
      screens: ['dashboard', 'onboarding', 'checkout', 'catalog'],
      userRoles: ['vendor', 'buyer', 'admin'],
      entities: ['user', 'product', 'order'],
      integrations: ['Stripe', 'SendGrid'],
      businessRules: ['Admin must approve vendors', 'Buyers must authenticate before checkout'],
      confidence: 92,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    },
    evidenceConflicts: [],
    intakeGaps: [],
    unifiedIntakeConfidence: 92,
    intakeReadinessScore: 90,
    intakeReadinessCategory: 'READY_FOR_PLANNING',
    intakeReadiness: 'READY_FOR_PLANNING',
    intakeRecommendations: [],
  };
}

function buildPlanningBriefFixture(workflowCount: number): PlanningBrief {
  const allWorkflows = ['onboarding', 'checkout', 'authentication', 'administration', 'messaging'];
  const workflows = allWorkflows.slice(0, workflowCount);
  return {
    readOnly: true,
    briefId: 'planning-brief-fixture',
    generatedAt: new Date().toISOString(),
    projectSummary: {
      readOnly: true,
      productName: 'Marketplace',
      productType: 'MARKETPLACE',
      objective: 'Two-sided marketplace',
      targetUsers: ['vendors', 'buyers'],
    },
    platformTargets: ['WEB', 'MOBILE'],
    screenInventory: [
      { readOnly: true, screenId: 's1', name: 'dashboard', evidence: ['TYPED_PROMPT'] },
      { readOnly: true, screenId: 's2', name: 'onboarding', evidence: ['TYPED_PROMPT'] },
    ],
    workflowInventory: workflows.map((w, i) => ({
      readOnly: true,
      workflowId: `w${i}`,
      name: w,
      evidence: ['TYPED_PROMPT'],
    })),
    userRoles: ['vendor', 'buyer', 'admin'],
    businessRules: ['Admin must approve vendors'],
    integrations: ['Stripe'],
    knownGaps: [],
    planningBriefConfidence: 88,
    planningBriefQuality: 'COMPLETE',
    planningBriefReadiness: 'PLANNING_READY',
    evidenceSources: ['TYPED_PROMPT', 'UNIFIED_INTAKE_INTELLIGENCE'],
  };
}

function buildBuildPlanFixture(): BuildPlan {
  return {
    readOnly: true,
    planId: 'build-plan-fixture',
    generatedAt: new Date().toISOString(),
    architectureBriefId: 'arch-fixture',
    projectSummary: {
      readOnly: true,
      product: 'MARKETPLACE',
      platforms: ['WEB', 'MOBILE'],
      scope: 'Full marketplace build',
      complexity: 'HIGH',
    },
    milestones: [
      { readOnly: true, milestoneId: 'm1', name: 'Foundation', description: 'Core setup', evidence: ['ARCHITECTURE_BRIEF'] },
      { readOnly: true, milestoneId: 'm2', name: 'Checkout', description: 'Checkout flow', evidence: ['ARCHITECTURE_BRIEF'] },
    ],
    phases: [
      { readOnly: true, phaseNumber: 1, phaseId: 'p1', name: 'Foundation Phase', milestoneIds: ['m1'], evidence: ['ARCHITECTURE_BRIEF'] },
      { readOnly: true, phaseNumber: 2, phaseId: 'p2', name: 'Checkout Phase', milestoneIds: ['m2'], evidence: ['ARCHITECTURE_BRIEF'] },
    ],
    dependencyMap: {
      readOnly: true,
      dependencies: [],
      blockedPhases: [],
      criticalDependencies: [],
    },
    buildPriorityOrder: [],
    buildPlanRisks: [],
    buildComplexityScore: 75,
    buildComplexityCategory: 'HIGH',
    buildPlanReadiness: 'READY_FOR_EXECUTION_PLANNING',
    buildPlanConfidence: 20,
    evidenceSources: ['ARCHITECTURE_BRIEF_GENERATOR'],
  };
}

resetOrchestrationProofModuleForTests();
resetOrchestrationProofHistoryForTests();

const intake5 = buildIntakeFixture(5);
const brief2 = buildPlanningBriefFixture(2);
const lossProof = proveOrchestration({
  scenarioType: 'FIXTURE',
  scenarioName: 'Workflow Loss Fixture',
  unifiedIntakeAnalysis: intake5,
  planningBrief: brief2,
  skipHistoryRecording: true,
});

assert('A loss proof produced', lossProof != null, lossProof?.proofId ?? 'null');
assert(
  'A information loss detected',
  lossProof != null && lossProof.systemOrchestrationProof.informationLosses.some((l) => l.field === 'workflows'),
  `${lossProof?.systemOrchestrationProof.informationLosses.length ?? 0} losses`,
);

const snapshots = extractAuthoritySnapshots({
  unifiedIntakeAnalysis: intake5,
  planningBrief: brief2,
});
assert('A consistency tracking snapshots', snapshots.length >= 2, `${snapshots.length}`);
assert('A intake has 5 workflows', snapshots[0]?.workflows.length === 5, `${snapshots[0]?.workflows.length}`);

const workflowDrift = analyzeWorkflowConsistency(snapshots);
assert(
  'A workflow drift or loss detected',
  workflowDrift.length >= 1 || (lossProof?.systemOrchestrationProof.informationLosses.length ?? 0) >= 1,
  `${workflowDrift.length} drift`,
);

const roleDrift = analyzeRoleConsistency(snapshots);
assert('B role preservation tracked', snapshots[0]?.roles.includes('vendor') === true, snapshots[0]?.roles.join(',') ?? 'none');

const integrationDrift = analyzeIntegrationConsistency(snapshots);
assert(
  'B integration loss detected',
  integrationDrift.length >= 1 || lossProof?.systemOrchestrationProof.informationLosses.some((l) => l.field === 'integrations') === true,
  `${integrationDrift.length} drift`,
);

const confidenceSnapshots = extractAuthoritySnapshots({
  unifiedIntakeAnalysis: intake5,
  planningBrief: brief2,
  buildPlan: buildBuildPlanFixture(),
});
const confidenceAnalysis = analyzeConfidencePropagation(confidenceSnapshots);
assert(
  'C confidence collapse detected',
  confidenceAnalysis.collapseDetected === true,
  `${confidenceAnalysis.maxDrop} max drop`,
);
assert(
  'C collapse at build plan',
  confidenceAnalysis.collapseAuthority === 'BUILD_PLAN_GENERATOR',
  confidenceAnalysis.collapseAuthority ?? 'none',
);

const readinessSnapshots = extractAuthoritySnapshots({
  unifiedIntakeAnalysis: {
    ...intake5,
    intakeReadinessCategory: 'PARTIAL_UNDERSTANDING',
    unifiedIntakeConfidence: 55,
  },
  planningBrief: {
    ...brief2,
    planningBriefReadiness: 'NOT_READY',
    planningBriefConfidence: 50,
  },
  buildPlan: buildBuildPlanFixture(),
});
const readinessAnalysis = analyzeReadinessPropagation(readinessSnapshots);
assert(
  'C readiness inflation detected',
  readinessAnalysis.inflationDetected === true,
  readinessAnalysis.inflationAuthority ?? 'none',
);

const informationLosses = detectInformationLosses(snapshots);
assert('D drift detection information losses', informationLosses.length >= 1, `${informationLosses.length}`);

const authorityRun = runOrchestrationProofAuthority({
  unifiedIntakeAnalysis: intake5,
  planningBrief: brief2,
  skipHistoryRecording: false,
});
assert('E authority complete', authorityRun.orchestrationState === 'ORCHESTRATION_PROOF_COMPLETE', authorityRun.orchestrationState);
assert('E advisory only', authorityRun.advisoryOnly === true, String(authorityRun.advisoryOnly));
assert(
  'E proof score below fully proven when losses exist',
  authorityRun.analysis != null && authorityRun.analysis.orchestrationProofScore < 90,
  String(authorityRun.analysis?.orchestrationProofScore),
);

for (let i = 0; i < MAX_ORCHESTRATION_PROOF_HISTORY + 4; i += 1) {
  proveOrchestration({
    unifiedIntakeAnalysis: intake5,
    scenarioType: `history-${i}`,
    skipHistoryRecording: false,
  });
}
assert(
  'F history bounded',
  getOrchestrationProofHistorySize() <= MAX_ORCHESTRATION_PROOF_HISTORY,
  `${getOrchestrationProofHistorySize()}/${MAX_ORCHESTRATION_PROOF_HISTORY}`,
);

resetOrchestrationProofModuleForTests();
resetOrchestrationProofHistoryForTests();

const fullRun = runOrchestrationProof({ skipHistoryRecording: true });
assert('G full orchestration proof complete', fullRun.orchestrationState === 'ORCHESTRATION_PROOF_COMPLETE', fullRun.orchestrationState);
assert(
  'G six scenario types proved',
  fullRun.analysis != null && fullRun.analysis.chainConsistencyResults.length === CHAIN_PROOF_SCENARIO_TYPES.length,
  `${fullRun.analysis?.chainConsistencyResults.length ?? 0}/${CHAIN_PROOF_SCENARIO_TYPES.length}`,
);

for (const scenarioType of CHAIN_PROOF_SCENARIO_TYPES) {
  const result = fullRun.analysis?.chainConsistencyResults.find((r) => r.scenarioType === scenarioType);
  assert(`G chain result: ${scenarioType}`, result != null, result ? `${result.proofScore}/100` : 'missing');
}

const report = buildOrchestrationProofReport({
  analyses: fullRun.analysis ? [fullRun.analysis] : [],
  history: fullRun.analysis
    ? [{
        proofId: fullRun.analysis.proofId,
        timestamp: fullRun.analysis.analyzedAt,
        orchestrationProofScore: fullRun.analysis.orchestrationProofScore,
        orchestrationProofCategory: fullRun.analysis.orchestrationProofCategory,
        failureCount: fullRun.analysis.orchestrationFailures.length,
        scenarioCount: fullRun.analysis.chainConsistencyResults.length,
      }]
    : [],
});
const markdown = buildOrchestrationProofReportMarkdown(report, fullRun.analysis);
assert('H report markdown title', markdown.includes('Cross-System Orchestration Proof Report'), 'yes');
assert('H proof score in report', markdown.includes('Proof score'), 'yes');
assert('H drift findings section', markdown.includes('Drift Findings'), 'yes');
assert('H confidence propagation section', markdown.includes('Confidence Propagation'), 'yes');
assert('H readiness propagation section', markdown.includes('Readiness Propagation'), 'yes');
assert('H chain consistency results', markdown.includes('Chain Consistency Results'), 'yes');

writeFileSync(join(ROOT, 'architecture/CROSS_SYSTEM_ORCHESTRATION_PROOF_REPORT.md'), markdown, 'utf8');
assert('H report written', existsSync(join(ROOT, 'architecture/CROSS_SYSTEM_ORCHESTRATION_PROOF_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/cross-system-orchestration-proof/orchestration-proof-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/cross-system-orchestration-proof/orchestration-proof-registry.ts'), 'utf8');
assert(
  'I read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PROJECT_MODIFICATION') &&
    registrySource.includes('NO_FAKE_CONSISTENCY') &&
    SAFETY_GUARANTEES.length >= 7 &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('I proof categories defined', ORCHESTRATION_PROOF_CATEGORIES.length === 4, String(ORCHESTRATION_PROOF_CATEGORIES.length));

const arch = readFileSync(join(ROOT, 'architecture/CROSS_SYSTEM_ORCHESTRATION_PROOF_REPORT.md'), 'utf8');
assert('I pass token in report', arch.includes(CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('J no validator recursion marker', !authoritySource.includes('validate-cross-system-orchestration-proof'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Cross-System Orchestration Proof Engine V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nAggregate proof score: ${fullRun.analysis?.orchestrationProofScore ?? 0}/100`);
  console.log(`Proof category: ${fullRun.analysis?.orchestrationProofCategory ?? 'none'}`);
  console.log(`Scenarios proved: ${fullRun.analysis?.chainConsistencyResults.length ?? 0}`);
  console.log(`Information losses: ${fullRun.analysis?.systemOrchestrationProof.informationLosses.length ?? 0}`);
  console.log(`Drift findings: ${fullRun.analysis?.systemOrchestrationProof.driftFindings.length ?? 0}`);
  console.log(`Failing authorities: ${fullRun.analysis?.failingAuthorities.join(', ') || 'none'}`);
  console.log(`History size: ${getOrchestrationProofHistorySize()}/${MAX_ORCHESTRATION_PROOF_HISTORY}`);
  console.log(`Report path: architecture/CROSS_SYSTEM_ORCHESTRATION_PROOF_REPORT.md`);
  console.log(`\n${CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
