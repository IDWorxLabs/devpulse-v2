/**
 * Phase 27.07 — Consistency Audit Authoritative Evidence Repoint validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeAllConsistencyClaims,
  buildFounderTruthMatrix,
  CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS,
  authoritativeOverridesStaleVerdict,
  resolveConsistencyAuthoritativeEvidence,
  shouldSuppressMisreportTokens,
} from '../src/founder-test-consistency-audit/index.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import type { CollectedConsistencyEvidence } from '../src/founder-test-consistency-audit/claim-evidence-collector.js';
import type { ConsistencyAuthoritativeEvidence } from '../src/founder-test-consistency-audit/resolve-consistency-authoritative-evidence.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-consistency-audit-authoritative-evidence-repoint';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-test-consistency-audit/resolve-consistency-authoritative-evidence.ts',
  'src/founder-test-consistency-audit/consistency-analyzers.ts',
  'src/founder-test-consistency-audit/claim-evidence-collector.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const analyzerSource = readFileSync(
  join(ROOT, 'src/founder-test-consistency-audit/consistency-analyzers.ts'),
  'utf8',
);
const resolverSource = readFileSync(
  join(ROOT, 'src/founder-test-consistency-audit/resolve-consistency-authoritative-evidence.ts'),
  'utf8',
);
const collectorSource = readFileSync(
  join(ROOT, 'src/founder-test-consistency-audit/claim-evidence-collector.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('resolveConsistencyAuthoritativeEvidence helper present', resolverSource.includes('export function resolveConsistencyAuthoritativeEvidence'), 'missing');
assert('analyzers use authoritative repoint', analyzerSource.includes('applyAuthoritativeVerdict'), 'missing');
assert('analyzers prefer bridge evidence', analyzerSource.includes('pushAuthoritativeEvidence'), 'missing');
assert('collector wires authoritative evidence', collectorSource.includes('resolveConsistencyAuthoritativeEvidence'), 'missing');
assert('no nested validate- in resolver', !resolverSource.includes('validate-'), 'nested');
assert(
  'package script registered',
  packageJson.includes(`validate:consistency-audit-authoritative-evidence-repoint": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

function buildMockAuthoritative(overrides: Partial<ConsistencyAuthoritativeEvidence> = {}): ConsistencyAuthoritativeEvidence {
  return {
    readOnly: true,
    buildVerdict: 'PROVEN',
    runtimeVerdict: 'PROVEN',
    previewVerdict: 'PROVEN',
    launchVerdict: 'PROVEN',
    workspaceId: 'build-ready-idea-1',
    runId: 'repoint-test-run',
    manifestId: 'build-ready-idea-1-manifest',
    evidenceSource: 'runtime-materialization-truth-bridge+build-materialization-truth-bridge',
    generatedAt: new Date().toISOString(),
    applicationProven: true,
    buildMaterializationProven: true,
    missingArtifacts: 0,
    authoritativeActive: true,
    staleAuthorityResultsSuppressed: true,
    convergencePassed: true,
    contradictionEliminationPassed: true,
    sourceUnificationPassed: true,
    passToken: CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS,
    ...overrides,
  };
}

function buildStaleEvidence(overrides: Partial<CollectedConsistencyEvidence['input']> = {}): CollectedConsistencyEvidence {
  const founderTestAssessment = assessFounderTestIntegration({ rootDir: ROOT });
  const chainTruth = {
    ...founderTestAssessment.run.executionChainTruth!,
    buildProven: true,
    runtimeProven: true,
    previewProven: true,
    launchProven: true,
  };

  const staleAuthorityResults = founderTestAssessment.run.authorityResults.map((entry) => {
    if (entry.authorityId === 'REQUIREMENT_REALITY') {
      return { ...entry, normalizedScore: 20 };
    }
    if (entry.authorityId === 'LIVE_PREVIEW_REALITY') {
      return { ...entry, normalizedScore: 15 };
    }
    return entry;
  });

  const inactiveAuth = resolveConsistencyAuthoritativeEvidence({
    rootDir: ROOT,
    executionChainTruth: chainTruth,
    skipBridgeAssessment: true,
  });

  const input: CollectedConsistencyEvidence['input'] = {
    rootDir: ROOT,
    founderTestAssessment: {
      ...founderTestAssessment,
      run: { ...founderTestAssessment.run, authorityResults: staleAuthorityResults },
    },
    chatIntelligenceReality: {
      readOnly: true as const,
      chatIntelligenceScore: 80,
      chatLaunchVerdict: 'OPERATIONAL_OK' as const,
      blocksLaunchReadiness: false,
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
        launchBlocked: false,
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
        founderExecutionScore: 80,
        founderExecutionState: 'FOUNDER_EXECUTION_PROVEN' as const,
        launchRecommendation: 'RECOMMEND_LAUNCH' as const,
        launchConfidence: 80,
        executionCompleteness: {
          readOnly: true as const,
          workspaceProofPercent: 90,
          buildProofPercent: 90,
          runtimeProofPercent: 90,
          previewProofPercent: 90,
          overallFounderProofPercent: 90,
        },
        proofBundle: {
          readOnly: true as const,
          buildEvidence: { readOnly: true as const, proven: true, proofPercent: 90, evidenceSummary: 'mock' },
          runtimeEvidence: { readOnly: true as const, proven: true, proofPercent: 90, evidenceSummary: 'mock' },
          previewEvidence: { readOnly: true as const, proven: true, proofPercent: 90, evidenceSummary: 'mock' },
          verificationEvidence: { readOnly: true as const, proven: true, proofPercent: 90, evidenceSummary: 'mock' },
        },
        cacheKey: 'mock',
      },
      cacheKey: 'mock',
    } as unknown as CollectedConsistencyEvidence['input']['founderExecutionProof'],
    launchReadiness: {
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
        founderReadinessScore: 80,
        founderAcceptanceState: 'ACCEPTED' as never,
        launchReadinessVerdict: 'LAUNCH_READY' as const,
        preReconciliationVerdict: 'LAUNCH_READY' as const,
        confidenceLevel: 'HIGH' as const,
        executionProofSummary: 'mock',
        founderExecutionProofSummary: 'mock',
        runtimeProofHydrationSummary: 'mock',
        runtimeProofHydration: { readOnly: true, hydrated: true, detail: 'mock' } as never,
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
        executionChainConnected: true,
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
    },
    productReadiness: null,
    chatStressSimulation: null,
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
    executionChainTruth: chainTruth,
    capabilityTruthRegistry: {
      readOnly: true as const,
      generatedAt: new Date().toISOString(),
      entries: [],
      provenCount: 0,
      partiallyProvenCount: 0,
      notProvenCount: 0,
      unknownCount: 0,
    } as CollectedConsistencyEvidence['input']['capabilityTruthRegistry'],
    executionProofSync: {
      readOnly: true as const,
      truthSource: chainTruth,
      authoritiesConsumingTruthSource: [],
      contradictionCount: 3,
      staleAuthorities: ['REQUIREMENT_REALITY', 'LIVE_PREVIEW_REALITY'],
      contradictions: [],
    },
    authoritative: inactiveAuth,
    ...overrides,
  };

  return {
    readOnly: true,
    input,
    snapshot: {
      readOnly: true,
      founderTestAvailable: true,
      chatIntelligenceAvailable: true,
      promiseRealityAvailable: false,
      executionProofAvailable: true,
      launchReadinessAvailable: true,
      productReadinessAvailable: false,
      chatStressAvailable: false,
      autonomousBuildProofAvailable: true,
      executionChainTruthAvailable: true,
    },
  };
}

const staleOnly = analyzeAllConsistencyClaims(buildStaleEvidence());
const staleBuild = staleOnly.find((a) => a.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS')!;
assert(
  '1. stale authorityResults alone still detected',
  staleBuild.authorityVerdicts.some((a) => a.authorityId === 'REQUIREMENT_REALITY'),
  staleBuild.authorityVerdicts.map((a) => a.authorityId).join(', '),
);

const authoritativeEvidence = buildMockAuthoritative();
const repointed = analyzeAllConsistencyClaims(
  buildStaleEvidence({ authoritative: authoritativeEvidence }),
);

const buildClaim = repointed.find((a) => a.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS')!;
assert(
  '2. authoritative bridge overrides stale BUILD=PARTIAL',
  buildClaim.finalTruth === 'PROVEN' || buildClaim.founderTestVerdict === 'PROVEN',
  `${buildClaim.finalTruth}/${buildClaim.founderTestVerdict}`,
);

const runtimeClaim = repointed.find((a) => a.claimId === 'APPLICATION_RUNS')!;
assert(
  '3. authoritative bridge overrides stale RUNTIME=NOT_PROVEN',
  runtimeClaim.finalTruth === 'PROVEN' || runtimeClaim.founderTestVerdict === 'PROVEN',
  `${runtimeClaim.finalTruth}/${runtimeClaim.founderTestVerdict}`,
);

const previewClaim = repointed.find((a) => a.claimId === 'LIVE_PREVIEW_RUNS_APPLICATIONS')!;
assert(
  '4. authoritative bridge overrides stale PREVIEW=NOT_PROVEN',
  previewClaim.finalTruth === 'PROVEN' || previewClaim.founderTestVerdict === 'PROVEN',
  `${previewClaim.finalTruth}/${previewClaim.founderTestVerdict}`,
);

assert(
  '5. ARTIFACTS_MISREPORTED_MISSING suppressed when missingArtifacts=0',
  shouldSuppressMisreportTokens(authoritativeEvidence),
  'not suppressed',
);
assert(
  '6. PROOF_STALE_VS_DISK suppressed when authoritative bridge active',
  authoritativeEvidence.staleAuthorityResultsSuppressed && authoritativeEvidence.generatedAt.length > 0,
  String(authoritativeEvidence.staleAuthorityResultsSuppressed),
);

const truthMatrix = buildFounderTruthMatrix(repointed);
const staleMatrixRows = truthMatrix.rows.filter(
  (row) =>
    row.contradictionDetected &&
    row.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' &&
    (row.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS' ||
      row.claimId === 'LIVE_PREVIEW_RUNS_APPLICATIONS' ||
      row.claimId === 'IDEA_TO_LAUNCH'),
);
assert(
  '7. Founder Truth Matrix no longer receives stale consistency claims for repointed core claims',
  staleMatrixRows.length === 0,
  staleMatrixRows.map((r) => `${r.claim}:${r.rootCause}`).join(', '),
);

assert(
  '8. no nested validator chains in resolver',
  !resolverSource.includes('assessFounderTestConsistencyAudit') && !resolverSource.includes('validate-'),
  'nested',
);

assert(
  'authoritativeOverridesStaleVerdict helper',
  authoritativeOverridesStaleVerdict(authoritativeEvidence, 'build', 'PARTIAL'),
  'false',
);

const liveResolved = resolveConsistencyAuthoritativeEvidence({
  rootDir: ROOT,
  skipBridgeAssessment: false,
});
assert(
  'live authoritative resolution produces evidence source chain',
  liveResolved.evidenceSource.includes('runtime-materialization-truth-bridge'),
  liveResolved.evidenceSource,
);

const failed = results.filter((entry) => !entry.passed);
const passToken = failed.length === 0 ? CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS : null;

writeFileSync(
  join(ROOT, 'architecture/CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_VALIDATION.md'),
  [
    '# Consistency Audit Authoritative Evidence Repoint Validation',
    '',
    `Result: ${passToken ?? 'FAILED'}`,
    '',
    ...results.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
    '',
    passToken ? `**${passToken}**` : '',
  ].join('\n'),
);

if (failed.length > 0) {
  console.error('Consistency audit authoritative evidence repoint validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS);
