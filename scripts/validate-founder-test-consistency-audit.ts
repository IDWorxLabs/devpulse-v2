/**
 * Phase 26.70 — Founder Test Consistency Audit validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUDITED_CLAIM_DEFINITIONS,
  FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION,
  FOUNDER_TEST_CONSISTENCY_AUDIT_PASS,
  analyzeAllConsistencyClaims,
  assessFounderTestConsistencyAudit,
  buildFounderTestConsistencyAuditReportMarkdown,
  buildFounderTruthMatrix,
  getFounderTestConsistencyAuditHistorySize,
  resetFounderTestConsistencyAuditModuleForTests,
  scoreToConsistencyVerdict,
} from '../src/founder-test-consistency-audit/index.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import type { CollectedConsistencyEvidence } from '../src/founder-test-consistency-audit/claim-evidence-collector.js';
import { resolveConsistencyAuthoritativeEvidence } from '../src/founder-test-consistency-audit/resolve-consistency-authoritative-evidence.js';

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
  'src/founder-test-consistency-audit/founder-test-consistency-audit-types.ts',
  'src/founder-test-consistency-audit/founder-test-consistency-audit-registry.ts',
  'src/founder-test-consistency-audit/claim-evidence-collector.ts',
  'src/founder-test-consistency-audit/consistency-analyzers.ts',
  'src/founder-test-consistency-audit/founder-test-consistency-audit-authority.ts',
  'src/founder-test-consistency-audit/founder-test-consistency-audit-report-builder.ts',
  'src/founder-test-consistency-audit/founder-test-consistency-audit-history.ts',
  'src/founder-test-consistency-audit/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const analyzerSource = readFileSync(
  join(ROOT, 'src/founder-test-consistency-audit/consistency-analyzers.ts'),
  'utf8',
);
const registrySource = readFileSync(
  join(ROOT, 'src/founder-test-consistency-audit/founder-test-consistency-audit-registry.ts'),
  'utf8',
);

assert('nine audited claims registered', AUDITED_CLAIM_DEFINITIONS.length === 9, String(AUDITED_CLAIM_DEFINITIONS.length));
assert('core question registered', registrySource.includes(FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION), 'missing');
assert('SCORING_DEFECT rule', analyzerSource.includes("'SCORING_DEFECT'"), 'missing');
assert('EVIDENCE_PROPAGATION_FAILURE rule', analyzerSource.includes('EVIDENCE_PROPAGATION_FAILURE'), 'missing');
assert('FOUNDER_TRUTH_MATRIX builder', analyzerSource.includes('buildFounderTruthMatrix'), 'missing');
assert('scoreToConsistencyVerdict thresholds', scoreToConsistencyVerdict(75) === 'PROVEN', scoreToConsistencyVerdict(75));
assert('scoreToConsistencyVerdict partial', scoreToConsistencyVerdict(55) === 'PARTIAL', scoreToConsistencyVerdict(55));
assert('scoreToConsistencyVerdict not proven', scoreToConsistencyVerdict(20) === 'NOT_PROVEN', scoreToConsistencyVerdict(20));

function buildMockEvidence(overrides: Partial<CollectedConsistencyEvidence['input']> = {}): CollectedConsistencyEvidence {
  const { authoritative: authoritativeOverride, ...restOverrides } = overrides;
  const founderTestAssessment = assessFounderTestIntegration({ rootDir: ROOT });
  const chainTruth = founderTestAssessment.run.executionChainTruth!;
  const baseLaunch = {
    readOnly: true as const,
    advisoryOnly: true as const,
    orchestrationState: 'FOUNDER_TEST_COMPLETE' as const,
    report: {
      readOnly: true as const,
      advisoryOnly: true as const,
      coreQuestion: 'mock',
      runId: 'mock',
      generatedAt: new Date().toISOString(),
      panelState: 'COMPLETE' as const,
      founderReadinessScore: 72,
      founderAcceptanceState: 'ACCEPTED_WITH_WARNINGS' as never,
      launchReadinessVerdict: 'LAUNCH_READY_WITH_WARNINGS' as const,
      preReconciliationVerdict: 'LAUNCH_READY_WITH_WARNINGS' as const,
      confidenceLevel: 'MEDIUM' as const,
      executionProofSummary: 'mock',
      founderExecutionProofSummary: 'mock',
      runtimeProofHydrationSummary: 'mock',
      runtimeProofHydration: { readOnly: true, hydrated: false, detail: 'mock' } as never,
      founderSimulationSummary: 'mock',
      requirementRealitySummary: 'mock',
      verificationRealitySummary: 'mock',
      livePreviewSummary: 'mock',
      mobileRuntimeSummary: 'mock',
      launchCouncilSummary: 'mock',
      orchestratorVerdict: founderTestAssessment.verdict,
      orchestratorScore: founderTestAssessment.score.overall,
      topBlockers: [],
      launchBlockersProduct: [],
      launchBlockersTesting: [],
      launchBlockersAuthorityDisagreement: [],
      topWarnings: [],
      topRecommendedActions: [],
      topMissingCapabilities: [],
      chatStressSimulation: null,
      chatStressSummary: null,
      chatBlocksLaunchReadiness: false,
      productReadinessSimulation: null,
      productReadinessSummary: null,
      productReadinessScore: null,
      autonomousBuildExecutionProof: null,
      autonomousBuildExecutionProofSummary: null,
      executionChainConnected: chainTruth.chainConnected,
      executionChainBlocksLaunch: false,
      firstBrokenExecutionStage: null,
      connectedBuildExecution: null,
      connectedBuildExecutionSummary: null,
      connectedRuntimeActivationProof: null,
      connectedRuntimeActivationProofSummary: null,
      connectedPreviewExperienceProof: null,
      connectedPreviewExperienceProofSummary: null,
      connectedVerificationExecutionProof: null,
      connectedVerificationExecutionProofSummary: null,
      connectedLaunchReadinessProof: null,
      connectedLaunchReadinessProofSummary: null,
      truthMatrixReconciliation: null,
      founderTruthSummary: null,
      inputSnapshot: {} as never,
      cacheKey: 'mock',
    },
  };

  const input = {
    rootDir: ROOT,
    founderTestAssessment,
    chatIntelligenceReality: {
      readOnly: true as const,
      chatIntelligenceScore: 0,
      chatLaunchVerdict: 'LAUNCH_BLOCKED' as const,
      blocksLaunchReadiness: true,
      scenariosRun: 4,
      scenariosPassed: 4,
      failedScenarios: [],
      scenarioResults: [],
      requiredFixesBeforeLaunch: [],
      founderProofNotes: [],
      selfEvolution: {
        triggered: false,
        repeatedCategory: null,
        failureCountInCategory: 0,
        stopRepeatingFixPath: false,
        missingCapabilities: [],
        improvementPlan: [],
        launchBlocked: true,
        advisoryOnly: true as const,
      },
      operationalSelfAwarenessStandard: 'mock',
      operationalEvidenceSnapshot: {} as never,
      cognitiveArchitecture: {} as never,
      cacheKey: 'mock',
    },
    promiseRealityEngine: null,
    founderExecutionProof: {
      readOnly: true as const,
      advisoryOnly: true as const,
      orchestrationState: 'FOUNDER_EXECUTION_PROOF_COMPLETE' as const,
      report: {
        readOnly: true as const,
        advisoryOnly: true as const,
        coreQuestion: 'mock',
        proofId: 'mock',
        generatedAt: new Date().toISOString(),
        founderExecutionScore: 55,
        founderExecutionState: 'FOUNDER_EXECUTION_NOT_PROVEN' as const,
        launchRecommendation: 'DO_NOT_RECOMMEND_LAUNCH' as const,
        launchConfidence: 50,
        executionCompleteness: {
          readOnly: true as const,
          workspaceProofPercent: 50,
          buildProofPercent: 40,
          runtimeProofPercent: 50,
          previewProofPercent: 50,
          verificationProofPercent: 50,
          executionChainPercent: 45,
          launchReadinessPercent: 45,
          overallFounderProofPercent: 45,
        },
        topEvidence: [],
        topBlockers: ['build not proven'],
        topWarnings: [],
        missingProofAreas: [],
        recommendedNextActions: [],
        questionAnswers: {} as never,
        proofBundle: {
          readOnly: true as const,
          proofBundleId: 'mock',
          workspaceEvidence: { readOnly: true as const, stage: 'WORKSPACE' as const, proven: false, state: 'mock', score: 0, proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock', artifactPaths: [] },
          buildEvidence: { readOnly: true as const, stage: 'BUILD' as const, proven: false, state: 'mock', score: 0, proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock', artifactPaths: [] },
          runtimeEvidence: { readOnly: true as const, stage: 'RUNTIME' as const, proven: false, state: 'mock', score: 0, proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock', artifactPaths: [] },
          previewEvidence: { readOnly: true as const, stage: 'PREVIEW' as const, proven: false, state: 'mock', score: 0, proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock', artifactPaths: [] },
          verificationEvidence: { readOnly: true as const, stage: 'VERIFICATION' as const, proven: false, state: 'mock', score: 0, proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock', artifactPaths: [] },
          executionChainEvidence: { readOnly: true as const, connected: false, state: 'mock', score: 0, proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock' },
          launchEvidence: { readOnly: true as const, launchReadinessProven: false, launchCouncilVerdict: 'mock', founderAcceptanceState: 'mock', proofPercent: 0, sourceAuthority: 'mock', evidenceSummary: 'mock' },
          proofArtifacts: [],
          proofWarnings: [],
          proofBlockers: [],
        },
        inputSnapshot: {} as never,
        blockingReasons: [],
        warningReasons: [],
        cacheKey: 'mock',
      },
    },
    launchReadiness: baseLaunch,
    productReadiness: null,
    chatStressSimulation: {
      readOnly: true as const,
      advisoryOnly: true as const,
      runId: 'mock',
      generatedAt: new Date().toISOString(),
      totalScenarios: 12,
      scenariosRequested: 12,
      scenariosExecuted: 12,
      scenariosSkipped: 0,
      scenariosTimedOut: 0,
      passedCount: 12,
      failedCount: 0,
      weakCount: 0,
      overallScore: 85,
      chatBlocksLaunchReadiness: false,
      selfEvolutionRequired: false,
      runtimeHealth: 'HEALTHY' as const,
      budgetElapsedMs: 1000,
      degradedPartialResult: false,
      budgetNotes: [],
      strongestAnswers: [],
      worstAnswers: [],
      weakAnswers: [],
      failedAnswers: [],
      repeatedFailurePatterns: [],
      missingCapabilities: [],
      recommendedNextChatImprovements: [],
      categoryScores: {} as never,
      evaluations: [],
      scenarioRuns: [],
      settlementSummary: {} as never,
    },
    autonomousBuildExecutionProof: {
      readOnly: true as const,
      advisoryOnly: true as const,
      coreQuestion: 'mock',
      proofId: 'mock',
      generatedAt: new Date().toISOString(),
      chainConnected: false,
      firstBrokenStage: 'BUILD' as const,
      launchBlockedByChain: true,
      stageProofs: [],
      chainAnalysis: { readOnly: true as const, chainConnected: false, firstBrokenStage: 'BUILD' as const, chainLinks: [], missingLinks: [], downstreamBlockedFrom: 'BUILD' as const },
      founderQuestions: {
        readOnly: true as const,
        canActuallyBuildSoftware: false,
        canActuallyRunSoftware: false,
        canActuallyPreviewSoftware: false,
        canActuallyVerifySoftware: false,
        canFounderGoFromIdeaToLaunch: false,
        exactBreakStage: 'BUILD' as const,
        missingEvidenceSummary: [],
        mustBuildNext: [],
      },
      missingEvidence: [],
      launchImpact: 'mock',
      recommendedFix: 'mock',
      recommendedNextActions: [],
      inputSnapshot: {} as never,
      cacheKey: 'mock',
    },
    executionChainTruth: { ...chainTruth, buildProven: true },
    capabilityTruthRegistry: {
      readOnly: true as const,
      generatedAt: new Date().toISOString(),
      entries: [],
      provenCount: 0,
      partiallyProvenCount: 0,
      notProvenCount: 0,
      unknownCount: 0,
    } as CollectedConsistencyEvidence['input']['capabilityTruthRegistry'],
    executionProofSync: founderTestAssessment.run.executionProofSynchronization ?? {
      readOnly: true as const,
      truthSource: chainTruth,
      authoritiesConsumingTruthSource: [],
      contradictionCount: 1,
      staleAuthorities: ['Founder Reality'],
      contradictions: [],
    },
    ...restOverrides,
  };

  const evidenceInput: CollectedConsistencyEvidence['input'] = {
    ...input,
    authoritative:
      authoritativeOverride ??
      resolveConsistencyAuthoritativeEvidence({
        rootDir: ROOT,
        executionChainTruth: input.executionChainTruth,
        skipBridgeAssessment: true,
      }),
  };

  return {
    readOnly: true,
    input: evidenceInput,
    snapshot: {
      readOnly: true,
      founderTestAvailable: true,
      chatIntelligenceAvailable: true,
      promiseRealityAvailable: false,
      executionProofAvailable: true,
      launchReadinessAvailable: true,
      productReadinessAvailable: false,
      chatStressAvailable: true,
      autonomousBuildProofAvailable: true,
      executionChainTruthAvailable: true,
    },
  };
}

const mockAudits = analyzeAllConsistencyClaims(buildMockEvidence());
const chatAudit = mockAudits.find((a) => a.claimId === 'CHAT_INTELLIGENCE_READINESS')!;
assert(
  'scoring defect detected for chat intelligence 0 with all scenarios passed',
  chatAudit.failureKinds.includes('SCORING_DEFECT'),
  chatAudit.failureKinds.join(', '),
);
assert('chat scoring defect root cause', chatAudit.rootCause === 'SCORING_DEFECT', chatAudit.rootCause);

const buildAudit = mockAudits.find((a) => a.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS')!;
assert(
  'stale evidence / contradiction when chain build proven but founder not proven',
  buildAudit.contradictionDetected || buildAudit.rootCause === 'STALE_EVIDENCE' || buildAudit.rootCause === 'AUTHORITY_DISAGREEMENT',
  `${buildAudit.rootCause} contradiction=${buildAudit.contradictionDetected}`,
);

const matrix = buildFounderTruthMatrix(mockAudits);
assert('truth matrix generated', matrix.rows.length === 9, String(matrix.rows.length));
assert('truth matrix authoritative note', matrix.authoritativeNote.includes('FOUNDER_TRUTH_MATRIX'), 'missing');

resetFounderTestConsistencyAuditModuleForTests();
const mockEvidence = buildMockEvidence();
const live = await assessFounderTestConsistencyAudit({
  rootDir: ROOT,
  founderTestAssessment: mockEvidence.input.founderTestAssessment,
  chatIntelligenceReality: mockEvidence.input.chatIntelligenceReality,
  founderExecutionProof: mockEvidence.input.founderExecutionProof,
  launchReadiness: mockEvidence.input.launchReadiness,
  chatStressSimulation: mockEvidence.input.chatStressSimulation,
  autonomousBuildExecutionProof: mockEvidence.input.autonomousBuildExecutionProof,
  executionChainTruth: mockEvidence.input.executionChainTruth,
  capabilityTruthRegistry: mockEvidence.input.capabilityTruthRegistry,
  executionProofSync: mockEvidence.input.executionProofSync,
});
assert('live audit produces nine claims', live.report.claimAudits.length === 9, String(live.report.claimAudits.length));
assert('live audit truth matrix', live.report.truthMatrix.rows.length === 9, String(live.report.truthMatrix.rows.length));
assert('live audit records history', getFounderTestConsistencyAuditHistorySize() === 1, String(getFounderTestConsistencyAuditHistorySize()));
assert('final truth assigned on all claims', live.report.claimAudits.every((a) => a.finalTruth !== 'UNKNOWN' || a.confidence > 0), 'missing');
assert('root cause assigned on all claims', live.report.claimAudits.every((a) => a.rootCause), 'missing');

const markdown = buildFounderTestConsistencyAuditReportMarkdown(live.report);
assert('report markdown sections', markdown.includes('## Contradictions Detected'), 'missing');
assert('report markdown truth matrix', markdown.includes('## FOUNDER_TRUTH_MATRIX'), 'missing');
assert('report markdown per-claim', markdown.includes('### Chat Intelligence readiness'), 'missing');

writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TEST_CONSISTENCY_AUDIT_REPORT.md'),
  markdown,
  'utf8',
);

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Founder Test Consistency Audit Validation',
  '',
  `Result: ${failed.length === 0 ? FOUNDER_TEST_CONSISTENCY_AUDIT_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Sample FOUNDER_TRUTH_MATRIX',
  '',
  ...matrix.rows.slice(0, 5).map((row) => `- ${row.claim}: ${row.finalTruth} (${row.rootCause})`),
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TEST_CONSISTENCY_AUDIT_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(FOUNDER_TEST_CONSISTENCY_AUDIT_PASS);
console.log(validationSummary);
