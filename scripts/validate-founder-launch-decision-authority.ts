/**
 * Phase 26.14 — Founder Launch Decision Authority validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  resetConnectedBuildExecutionModuleForTests,
} from '../src/connected-build-execution/index.js';
import {
  assessConnectedPreviewExperienceProof,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import type { PreviewSessionEvidence } from '../src/connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import {
  assessConnectedRuntimeActivationProof,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import type { RuntimeSessionEvidence } from '../src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import { resetConnectedVerificationExecutionProofModuleForTests } from '../src/connected-verification-execution-proof/index.js';
import type { VerificationEvidenceFixture } from '../src/connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import { resetConnectedLaunchReadinessProofModuleForTests } from '../src/connected-launch-readiness-proof/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import {
  resetLiveExecutionRunnerHistoryForTests,
  resetLiveIdeaToLaunchExecutionRunnerModuleForTests,
} from '../src/live-idea-to-launch-execution-runner/index.js';
import {
  FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN,
  analyzeBlockerPriority,
  analyzeLaunchRisk,
  analyzeProofChainSignals,
  assessFounderLaunchDecision,
  buildFounderLaunchDecisionHistorySummary,
  buildFounderLaunchDecisionReportMarkdown,
  computeFounderDecisionVerdict,
  getFounderLaunchDecisionHistorySize,
  resetFounderLaunchDecisionAuthorityModuleForTests,
  resetFounderLaunchDecisionHistoryForTests,
} from '../src/founder-launch-decision-authority/index.js';
import { MAX_FOUNDER_LAUNCH_DECISION_HISTORY } from '../src/founder-launch-decision-authority/founder-launch-decision-authority-registry.js';

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
  'src/founder-launch-decision-authority/founder-launch-decision-authority-types.ts',
  'src/founder-launch-decision-authority/founder-launch-decision-authority-registry.ts',
  'src/founder-launch-decision-authority/proof-chain-signal-analyzer.ts',
  'src/founder-launch-decision-authority/launch-risk-analyzer.ts',
  'src/founder-launch-decision-authority/blocker-priority-analyzer.ts',
  'src/founder-launch-decision-authority/founder-decision-verdict-engine.ts',
  'src/founder-launch-decision-authority/founder-launch-decision-authority.ts',
  'src/founder-launch-decision-authority/founder-launch-decision-history.ts',
  'src/founder-launch-decision-authority/founder-launch-decision-report-builder.ts',
  'src/founder-launch-decision-authority/index.ts',
  'architecture/FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getFullFixtureContext() {
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetConnectedRuntimeActivationProofModuleForTests();
  resetConnectedPreviewExperienceProofModuleForTests();
  resetConnectedVerificationExecutionProofModuleForTests();
  resetConnectedLaunchReadinessProofModuleForTests();
  resetAutonomousBuildExecutionProofModuleForTests();

  const crmAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: crmPrompt });
  const contract = crmAssessment.report.buildReadyContract!;
  const materialization = materializeBuildContractExpectations(contract);
  const buildReport = assessConnectedBuildExecution({
    rootDir: ROOT,
    buildReadyContract: contract,
    observedEvidence: {
      paths: materialization.expectedFiles,
      directories: materialization.workspaceTargets,
    },
  }).report;

  const workspacePath = (
    buildReport.workspaceMaterialization.workspacePath ??
    buildReport.buildMaterialization.workspaceTargets[0] ??
    `.generated-builder-workspaces/${buildReport.buildMaterialization.contractId}`
  ).replace(/\\/g, '/');

  const runtimeSession: RuntimeSessionEvidence = {
    runtimeSessionId: 'runtime-session-fixture-founder-decision',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '5252',
    processState: 'STARTED',
    port: 5173,
    host: 'localhost',
    url: 'http://localhost:5173',
    reachable: true,
    protocol: 'http',
    healthStatusCode: 200,
    healthResponseType: 'html',
  };

  const previewSession: PreviewSessionEvidence = {
    previewSessionId: 'preview-session-fixture-founder-decision',
    workspaceId: workspacePath,
    runtimeSessionId: 'runtime-session-fixture-founder-decision',
    previewUrl: 'http://localhost:5173',
    urlReachable: true,
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    interactiveElements: ['nav-dashboard'],
    interactionEvidence: ['click: add contact'],
  };

  const now = new Date().toISOString();
  const verificationFixture: VerificationEvidenceFixture = {
    previewSessionId: previewSession.previewSessionId,
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-run-founder-decision',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'founder-decision-fixture',
    command: 'npm run validate:founder-launch-decision-authority',
    scope: 'preview-e2e',
    passCount: 12,
    failCount: 0,
    warningCount: 0,
    skippedCount: 0,
    resultStatus: 'PASS',
    score: 100,
    summary: 'All verification checks passed',
    evidencePaths: ['.verification-evidence/run-report.json'],
    evidenceTypes: ['assertion_results'],
    testLogs: ['[verify] passed'],
  };

  return {
    crmAssessment,
    materialization,
    buildReport,
    runtimeSession,
    previewSession,
    verificationFixture,
  };
}

resetFounderLaunchDecisionAuthorityModuleForTests();
resetFounderLaunchDecisionHistoryForTests();
resetLiveIdeaToLaunchExecutionRunnerModuleForTests();
resetLiveExecutionRunnerHistoryForTests();

const empty = assessFounderLaunchDecision({
  rootDir: ROOT,
  liveExecutionRunner: null,
  launchReadinessProof: null,
  runtimeActivationProof: null,
  previewExperienceProof: null,
  buildMaterialization: null,
  verificationExecutionProof: null,
  founderTestLaunchReadiness: null,
  skipRealitySweep: true,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'FOUNDER_LAUNCH_DECISION_COMPLETE', empty.orchestrationState);
assert('A empty cannot LAUNCH', empty.report.founderLaunchDecision !== 'LAUNCH', empty.report.founderLaunchDecision);
assert(
  'A missing evidence reported',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);
assert(
  'A missing evidence → RUN_MORE_PROOF or WAIT',
  empty.report.founderLaunchDecision === 'RUN_MORE_PROOF' || empty.report.founderLaunchDecision === 'WAIT',
  empty.report.founderLaunchDecision,
);

const proofEmpty = analyzeProofChainSignals({
  snapshot: {
    liveExecutionRunner: null,
    launchReadinessProof: null,
    runtimeActivationProof: null,
    previewExperienceProof: null,
    buildMaterialization: null,
    verificationExecutionProof: null,
    founderTestLaunchReadiness: null,
    founderTestRealitySweep: null,
    launchCouncil: null,
    requirementsToPlanContract: null,
    autonomousBuildExecutionProof: null,
    founderTestAssessment: null,
  },
});
const blockersEmpty = analyzeBlockerPriority({
  launchReadinessProof: null,
  founderTestLaunchReadiness: null,
  founderTestRealitySweep: null,
  liveExecutionRunner: null,
  launchCouncil: null,
});
const riskEmpty = analyzeLaunchRisk({ proofSignals: proofEmpty, blockers: blockersEmpty });
const verdictUnit = computeFounderDecisionVerdict({
  proofSignals: proofEmpty,
  riskSignals: riskEmpty,
  blockers: blockersEmpty,
});
assert('B verdict engine executes', typeof verdictUnit.founderLaunchDecision === 'string', verdictUnit.founderLaunchDecision);

const scores = [
  empty.report.proofChainScore,
  empty.report.launchReadinessScore,
  empty.report.runtimeConfidenceScore,
  empty.report.riskScore,
  empty.report.decisionConfidence,
  empty.report.founderDecisionConfidence,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildFounderLaunchDecisionReportMarkdown(empty.report).includes('FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_FOUNDER_LAUNCH_DECISION_HISTORY + 2; i += 1) {
  assessFounderLaunchDecision({ rootDir: ROOT, skipRealitySweep: true, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getFounderLaunchDecisionHistorySize() <= MAX_FOUNDER_LAUNCH_DECISION_HISTORY,
  `${getFounderLaunchDecisionHistorySize()}/${MAX_FOUNDER_LAUNCH_DECISION_HISTORY}`,
);
const historySummary = buildFounderLaunchDecisionHistorySummary();
assert(
  'E history summary',
  historySummary.totalDecisions <= MAX_FOUNDER_LAUNCH_DECISION_HISTORY,
  String(historySummary.totalDecisions),
);

const sourceOnly = assessFounderLaunchDecision({
  rootDir: ROOT,
  sourceCodeOnlyFixture: true,
  skipRealitySweep: true,
  skipHistoryRecording: true,
});
assert(
  'F source code alone cannot LAUNCH',
  sourceOnly.report.founderLaunchDecision !== 'LAUNCH' && !sourceOnly.report.canLaunchNow,
  `${sourceOnly.report.founderLaunchDecision}/${sourceOnly.report.canLaunchNow}`,
);

const noRuntime = computeFounderDecisionVerdict({
  proofSignals: {
    ...proofEmpty,
    executionState: 'LAUNCH_READY',
    launchReadinessProven: true,
    runtimeProven: false,
    criticalBlockerCount: 0,
    executionVerdict: 'PROVEN',
    missingEvidence: [],
  },
  riskSignals: { ...riskEmpty, riskLevel: 'LOW', riskScore: 10 },
  blockers: blockersEmpty,
});
assert(
  'G LAUNCH requires runtime proof',
  noRuntime.founderLaunchDecision !== 'LAUNCH' && !noRuntime.canLaunchNow,
  noRuntime.founderLaunchDecision,
);

const withCritical = computeFounderDecisionVerdict({
  proofSignals: {
    ...proofEmpty,
    executionState: 'LAUNCH_READY',
    launchReadinessProven: true,
    runtimeProven: true,
    criticalBlockerCount: 2,
    executionVerdict: 'PROVEN',
    missingEvidence: [],
  },
  riskSignals: { ...riskEmpty, riskLevel: 'LOW', riskScore: 10 },
  blockers: {
    ...blockersEmpty,
    criticalCount: 2,
    actionableBlockers: [
      {
        readOnly: true,
        blockerId: 'crit-1',
        severity: 'CRITICAL',
        sourceAuthority: 'test',
        message: 'Critical blocker',
        recommendedFix: 'Fix it',
        priorityRank: 1,
      },
    ],
  },
});
assert(
  'H LAUNCH blocked by critical blockers',
  withCritical.founderLaunchDecision !== 'LAUNCH' && !withCritical.canLaunchNow,
  withCritical.founderLaunchDecision,
);

const noLaunchReadiness = computeFounderDecisionVerdict({
  proofSignals: {
    ...proofEmpty,
    executionState: 'LAUNCH_READY',
    launchReadinessProven: false,
    runtimeProven: true,
    criticalBlockerCount: 0,
    executionVerdict: 'PROVEN',
    missingEvidence: ['Launch readiness not proven'],
  },
  riskSignals: { ...riskEmpty, riskLevel: 'MEDIUM', riskScore: 40 },
  blockers: blockersEmpty,
});
assert(
  'I LAUNCH blocked by missing launch readiness',
  noLaunchReadiness.founderLaunchDecision !== 'LAUNCH' && !noLaunchReadiness.canLaunchNow,
  noLaunchReadiness.founderLaunchDecision,
);

const unsafeReject = computeFounderDecisionVerdict({
  proofSignals: {
    ...proofEmpty,
    executionState: 'NOT_STARTED',
    launchReadinessProven: false,
    runtimeProven: false,
    criticalBlockerCount: 3,
    executionVerdict: 'NOT_PROVEN',
    missingEvidence: ['Runtime', 'Launch readiness', 'Validation'],
  },
  riskSignals: { ...riskEmpty, riskLevel: 'CRITICAL', riskScore: 95 },
  blockers: {
    ...blockersEmpty,
    criticalCount: 3,
    actionableBlockers: [
      {
        readOnly: true,
        blockerId: 'crit-a',
        severity: 'CRITICAL',
        sourceAuthority: 'test',
        message: 'Unsafe',
        recommendedFix: 'Fix',
        priorityRank: 1,
      },
    ],
  },
});
assert(
  'J critical unsafe → REJECT_LAUNCH or FIX_BLOCKERS',
  unsafeReject.founderLaunchDecision === 'REJECT_LAUNCH' ||
    unsafeReject.founderLaunchDecision === 'FIX_BLOCKERS',
  unsafeReject.founderLaunchDecision,
);

resetFounderLaunchDecisionAuthorityModuleForTests();
resetLiveIdeaToLaunchExecutionRunnerModuleForTests();
const ctx = getFullFixtureContext();
const full = assessFounderLaunchDecision({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: ctx.previewSession,
  verificationEvidenceFixture: ctx.verificationFixture,
  launchReadinessFixture: { suppressBlockers: true, forceAcceptanceState: 'ACCEPTED' },
  skipRealitySweep: true,
  skipHistoryRecording: true,
});

assert('K full fixture executes', full.orchestrationState === 'FOUNDER_LAUNCH_DECISION_COMPLETE', full.orchestrationState);
assert(
  'K full fixture LAUNCH',
  full.report.founderLaunchDecision === 'LAUNCH',
  full.report.founderLaunchDecision,
);
assert('K full fixture canLaunchNow', full.report.canLaunchNow, String(full.report.canLaunchNow));
assert('K full fixture runtime proven', full.report.proofSignals.runtimeProven, 'yes');
assert('K full fixture launch readiness proven', full.report.proofSignals.launchReadinessProven, 'yes');
assert(
  'K full fixture execution LAUNCH_READY',
  full.report.proofSignals.executionState === 'LAUNCH_READY',
  full.report.proofSignals.executionState,
);

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-launch-decision-authority/founder-launch-decision-authority.ts'),
  'utf8',
);
assert('L authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('L no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Founder Launch Decision Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nFounder launch decision (full fixture): ${full.report.founderLaunchDecision}`);
  console.log(`Can launch now: ${full.report.canLaunchNow}`);
  console.log(`Decision confidence: ${full.report.decisionConfidence}/100`);
  console.log(`Report path: architecture/FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT.md`);
  console.log(`\n${FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
