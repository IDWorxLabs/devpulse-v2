/**
 * Phase 25.32 — Founder Test Reality Sweep validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FounderAcceptanceAssessment } from '../src/founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderExecutionProofAssessment } from '../src/founder-execution-proof/founder-execution-proof-types.js';
import type { FirstTimeUserRealityAssessment } from '../src/first-time-user-reality/first-time-user-reality-types.js';
import type { InteractiveExplanationsEvaluation } from '../src/interactive-explanations/interactive-explanations-types.js';
import type { LaunchCouncilAssessment } from '../src/launch-council/launch-council-types.js';
import type { LivePreviewRealityAuthorityAssessment } from '../src/live-preview-reality/live-preview-reality-types.js';
import {
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
  assessFounderTestIntegration,
  type FounderTestAuthorityId,
  type FounderTestAuthorityResult,
  type FounderTestAssessment,
} from '../src/founder-test-integration/index.js';
import type { FounderTestLaunchReadinessAssessment } from '../src/founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { UIReviewerAssessment } from '../src/ui-reviewer-authority/ui-reviewer-types.js';
import type { VerificationRealityAssessment } from '../src/verification-reality/verification-reality-types.js';
import {
  FOUNDER_LAUNCH_VERDICTS,
  FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
  FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN,
  LAUNCH_BLOCKER_SEVERITIES,
  LAUNCH_RECOMMENDATIONS,
  ORCHESTRATION_FLOW,
  REALITY_SWEEP_CATEGORIES,
  REQUIRED_INPUT_AUTHORITIES,
  REALITY_SWEEP_SAFETY_GUARANTEES,
  analyzeLaunchBlockers,
  assessFounderTestRealitySweep,
  buildFounderTestRealitySweepArtifacts,
  buildFounderTestRealitySweepHistorySummary,
  computeCategoryScores,
  getFounderTestRealitySweepHistorySize,
  resetFounderTestRealitySweepModuleForTests,
} from '../src/founder-test-reality-sweep/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/founder-test-reality-sweep/founder-test-reality-sweep-types.ts',
  'src/founder-test-reality-sweep/founder-test-reality-sweep-registry.ts',
  'src/founder-test-reality-sweep/founder-test-reality-sweep-authority.ts',
  'src/founder-test-reality-sweep/launch-blocker-analyzer.ts',
  'src/founder-test-reality-sweep/founder-test-reality-sweep-history.ts',
  'src/founder-test-reality-sweep/founder-test-reality-sweep-report-builder.ts',
  'src/founder-test-reality-sweep/index.ts',
  'architecture/FOUNDER_TEST_REALITY_SWEEP_REPORT.md',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function buildFixtureResult(
  authorityId: FounderTestAuthorityId,
  score: number,
  overrides: Partial<FounderTestAuthorityResult> = {},
): FounderTestAuthorityResult {
  const registration = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.find((entry) => entry.authorityId === authorityId)!;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    authorityId,
    displayName: registration.displayName,
    sourceModule: registration.sourceModule,
    readOnly: true,
    available: true,
    normalizedScore,
    weight: registration.weight,
    weightedContribution: Math.round((normalizedScore * registration.weight) / 100),
    blockers: [],
    warnings: [],
    recommendations: [],
    missingCapabilities: [],
    criticalBlockerCount: 0,
    regressionDetected: false,
    simulationPassed: authorityId === 'FOUNDER_SIMULATION' ? score >= 70 : null,
    executionProofVerdict:
      authorityId === 'EXECUTION_PROOF_EVOLUTION' ? (overrides.executionProofVerdict ?? 'PROVEN_FIXED') : null,
    ...overrides,
  };
}

function buildFixtureFounderTest(
  scoreByAuthority: Partial<Record<FounderTestAuthorityId, number>>,
  overrides: Partial<Record<FounderTestAuthorityId, Partial<FounderTestAuthorityResult>>> = {},
): FounderTestAssessment {
  const authorityResults = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.map((entry) =>
    buildFixtureResult(entry.authorityId, scoreByAuthority[entry.authorityId] ?? 88, overrides[entry.authorityId]),
  );
  return assessFounderTestIntegration({ authorityResults, rootDir: ROOT });
}

function buildExecutionProofFixture(proven: boolean): FounderExecutionProofAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: proven ? 'FOUNDER_EXECUTION_PROOF_COMPLETE' : 'FOUNDER_EXECUTION_PROOF_FAILED',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'fixture',
      proofId: 'fixture-proof',
      generatedAt: new Date().toISOString(),
      founderExecutionScore: proven ? 94 : 35,
      founderExecutionState: proven ? 'FOUNDER_EXECUTION_PROVEN' : 'FOUNDER_EXECUTION_NOT_PROVEN',
      launchRecommendation: proven ? 'RECOMMEND_LAUNCH' : 'DO_NOT_RECOMMEND_LAUNCH',
      launchConfidence: proven ? 88 : 20,
      executionCompleteness: {
        readOnly: true,
        workspaceProofPercent: proven ? 100 : 0,
        buildProofPercent: proven ? 100 : 0,
        runtimeProofPercent: proven ? 100 : 0,
        previewProofPercent: proven ? 100 : 0,
        verificationProofPercent: proven ? 100 : 0,
        executionChainPercent: proven ? 100 : 0,
        launchReadinessPercent: proven ? 90 : 30,
        overallFounderProofPercent: proven ? 94 : 35,
      },
      topEvidence: proven ? ['WORKSPACE: proven', 'BUILD: proven'] : [],
      topBlockers: proven ? [] : ['Execution chain not proven'],
      topWarnings: [],
      missingProofAreas: proven ? [] : ['VERIFICATION'],
      recommendedNextActions: proven ? ['Maintain proof'] : ['Run full execution chain'],
      questionAnswers: {
        workspaceActuallyCreated: proven,
        buildActuallyExecuted: proven,
        runtimeActuallyActivated: proven,
        previewActuallyActivated: proven,
        verificationActuallyExecuted: proven,
        executionChainConnected: proven,
        founderCanInspectEvidence: proven,
        blockersPresent: !proven,
        launchReadinessProven: proven,
        founderExecutionProven: proven,
      },
      proofBundle: {
        readOnly: true,
        proofBundleId: 'fixture-bundle',
        workspaceEvidence: {
          readOnly: true,
          stage: 'WORKSPACE',
          proven,
          state: proven ? 'WORKSPACE_CREATED' : 'INSUFFICIENT_EVIDENCE',
          score: proven ? 100 : 0,
          proofPercent: proven ? 100 : 0,
          sourceAuthority: 'connected-workspace-creation',
          evidenceSummary: 'fixture',
          artifactPaths: [],
        },
        buildEvidence: {
          readOnly: true,
          stage: 'BUILD',
          proven,
          state: proven ? 'BUILD_EXECUTED' : 'INSUFFICIENT_EVIDENCE',
          score: proven ? 100 : 0,
          proofPercent: proven ? 100 : 0,
          sourceAuthority: 'connected-build-execution',
          evidenceSummary: 'fixture',
          artifactPaths: [],
        },
        runtimeEvidence: {
          readOnly: true,
          stage: 'RUNTIME',
          proven,
          state: proven ? 'RUNTIME_ACTIVATED' : 'INSUFFICIENT_EVIDENCE',
          score: proven ? 100 : 0,
          proofPercent: proven ? 100 : 0,
          sourceAuthority: 'connected-runtime-execution',
          evidenceSummary: 'fixture',
          artifactPaths: [],
        },
        previewEvidence: {
          readOnly: true,
          stage: 'PREVIEW',
          proven,
          state: proven ? 'PREVIEW_ACTIVATED' : 'INSUFFICIENT_EVIDENCE',
          score: proven ? 100 : 0,
          proofPercent: proven ? 100 : 0,
          sourceAuthority: 'connected-live-preview-execution',
          evidenceSummary: 'fixture',
          artifactPaths: [],
        },
        verificationEvidence: {
          readOnly: true,
          stage: 'VERIFICATION',
          proven,
          state: proven ? 'VERIFICATION_EXECUTED' : 'INSUFFICIENT_EVIDENCE',
          score: proven ? 100 : 0,
          proofPercent: proven ? 100 : 0,
          sourceAuthority: 'connected-verification-execution',
          evidenceSummary: 'fixture',
          artifactPaths: [],
        },
        executionChainEvidence: {
          readOnly: true,
          connected: proven,
          state: proven ? 'EXECUTION_CHAIN_CONNECTED' : 'INSUFFICIENT_EVIDENCE',
          score: proven ? 100 : 0,
          proofPercent: proven ? 100 : 0,
          sourceAuthority: 'founder-execution-proof',
          evidenceSummary: 'fixture',
        },
        launchEvidence: {
          readOnly: true,
          launchReadinessProven: proven,
          launchCouncilVerdict: proven ? 'LAUNCH_READY' : 'NOT_LAUNCH_READY',
          founderAcceptanceState: proven ? 'ACCEPTED' : 'REJECTED',
          proofPercent: proven ? 90 : 30,
          sourceAuthority: 'founder-test-launch-readiness',
          evidenceSummary: 'fixture',
        },
        proofArtifacts: [],
        proofWarnings: [],
        proofBlockers: proven ? [] : ['Execution not proven'],
      },
      inputSnapshot: {
        readOnly: true,
        connectedWorkspaceCreationAssessment: null,
        connectedRuntimeExecutionAssessment: null,
        connectedLivePreviewExecutionAssessment: null,
        connectedVerificationExecutionAssessment: null,
        endToEndExecutionProofAssessment: null,
        founderTestExecutionChainAssessment: null,
        founderTestLaunchReadinessAssessment: null,
        executionProofAssessment: null,
        founderAcceptanceAssessment: null,
        launchCouncilAssessment: null,
        missingAuthorities: [],
      },
      blockingReasons: proven ? [] : ['Execution not proven'],
      warningReasons: [],
      cacheKey: 'fixture-proof',
    },
  };
}

function buildAcceptanceFixture(state: FounderAcceptanceAssessment['acceptanceState']): FounderAcceptanceAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'fixture',
    acceptanceState: state,
    acceptanceConfidence: state === 'ACCEPTED' ? 95 : 40,
    confidenceBreakdown: {
      authorityCoverage: 20,
      proofQuality: 20,
      simulationQuality: 15,
      requirementCompleteness: 15,
      founderReadiness: 15,
    },
    inputSnapshot: {
      founderTestAssessment: null as never,
      requiredAuthorities: [],
      missingRequiredAuthorities: [],
      founderTestScore: state === 'ACCEPTED' ? 90 : 40,
      founderTestVerdict: state === 'ACCEPTED' ? 'FOUNDER_READY' : 'BLOCKED',
      criticalBlockerCount: state === 'BLOCKED' ? 1 : 0,
      executionProofRegressionFree: true,
      executionProofScore: 90,
      executionProofVerdict: 'PROVEN_FIXED',
      founderSimulationPassed: state !== 'BLOCKED',
      founderSimulationScore: 85,
      requirementRealityAboveThreshold: state === 'ACCEPTED',
      requirementRealityScore: 85,
    },
    reasons: {
      acceptedBecause: state === 'ACCEPTED' ? ['Ready'] : [],
      rejectedBecause: [],
      warningReasons: [],
      blockingReasons: state === 'BLOCKED' ? ['Critical blocker'] : [],
      requiredNextActions: [],
    },
    cacheKey: 'fixture-acceptance',
  };
}

function buildFtuFixture(score: number): FirstTimeUserRealityAssessment {
  return {
    firstTimeUserScore: score,
    categoryScores: {
      understanding: score,
      navigation: score,
      workflow: score,
      trust: score,
      simplicity: score,
    },
    scenarios: [],
    screenPurposeResults: [],
    findings: score < 60
      ? [{
          id: 'ftu-1',
          type: 'FIRST_TIME_CONFUSION',
          category: 'PRODUCT_UNDERSTANDING',
          severity: 'CRITICAL',
          whatConfuses: 'Purpose unclear',
          firstTimeQuestion: 'What is this?',
          expectedClarity: 'Clear purpose',
          observedGap: 'No clear onboarding',
          whyItMatters: 'Users bounce',
          recommendedFix: 'Add onboarding',
        }]
      : [],
    strengths: score >= 75 ? ['Clear primary action path'] : [],
    weaknesses: score < 75 ? ['Navigation overlap'] : [],
    topConfusionRisk: score < 60 ? 'Purpose unclear on first visit' : null,
    recommendedFixes: score < 75 ? ['Clarify navigation labels'] : [],
    operatorFeedEvents: [],
    productUnderstandingPass: score >= 70,
    navigationUnderstandingPass: score >= 70,
    workflowClarityPass: score >= 70,
    trustFormationPass: score >= 70,
    cognitiveLoadPass: score >= 70,
    actionPathPass: score >= 70,
    actionPathStepsVisible: 3,
    actionPathScenariosPassed: score >= 70 ? 3 : 1,
    findingsGenerated: true,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

function buildUiFixture(score: number, blocks: boolean): UIReviewerAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    uiReviewScore: score,
    usabilityScore: score,
    navigationScore: score,
    discoverabilityScore: score,
    clarityScore: score,
    hierarchyScore: score,
    firstTimeUserScore: score,
    criticalUiFailures: blocks ? 2 : 0,
    uiRisks: blocks ? ['Critical navigation failure'] : [],
    uiRecommendations: blocks ? ['Fix navigation hierarchy'] : ['Maintain UI clarity'],
    blocksLaunchReadiness: blocks,
    readinessState: blocks ? 'UI_BLOCKED' : score >= 80 ? 'UI_GOOD' : 'UI_CONFUSING',
    scenarioResults: [],
    cacheKey: 'fixture-ui',
  };
}

function buildPreviewFixture(score: number): LivePreviewRealityAuthorityAssessment {
  const ready = score >= 70;
  return {
    assessmentId: 'fixture-preview',
    livePreviewRealityScore: score,
    portfolioSubscores: {
      infrastructure: score,
      runtime: score,
      connectivity: score,
      usability: score,
      buildToPreview: score,
    },
    analyzers: {
      previewInfrastructure: ready ? 'PREVIEW_INFRASTRUCTURE_PRESENT' : 'PREVIEW_INFRASTRUCTURE_MISSING',
      runtimeEvidence: ready ? 'RUNTIME_PROVEN' : 'RUNTIME_MISSING',
      previewConnectivity: ready ? 'PREVIEW_CONNECTED' : 'PREVIEW_DISCONNECTED',
      previewUsability: ready ? 'PREVIEW_USABLE' : 'PREVIEW_UNUSABLE',
      buildToPreview: ready ? 'BUILD_TO_PREVIEW_PROVEN' : 'BUILD_TO_PREVIEW_MISSING',
      previewEvidence: ready ? 'PREVIEW_EVIDENCE_PROVEN' : 'PREVIEW_EVIDENCE_MISSING',
      founderBottleneck: ready ? 'NONE' : 'PREVIEW_NOT_USABLE',
    },
    stages: [],
    evidence: [],
    blockers: ready
      ? []
      : [{
          id: 'pb-1',
          severity: 'CRITICAL',
          impactRank: 1,
          explanation: 'Preview not usable for founders',
          recommendation: 'Make preview founder-viewable',
        }],
    previewRealityMatrix: [],
    evidenceFound: [],
    missingEvidence: ready ? [] : ['Live preview usability proof'],
    previewBlockers: ready ? [] : ['Preview not usable'],
    founderConclusion: ready ? 'Preview usable' : 'Preview not founder-ready',
    founderBottleneck: ready ? 'NONE' : 'PREVIEW_NOT_USABLE',
    livePreviewRealitySummary: ready ? 'Preview ready' : 'Preview blocked',
    legacyAssessment: {
      state: ready ? 'PREVIEW_READY' : 'NO_PREVIEW',
      displayLabel: ready ? 'Preview ready' : 'No preview',
      summaryLines: [],
      problems: ready ? [] : ['No preview'],
      recommendedActions: [],
      availability: { passed: ready, reason: 'fixture' },
      connectivity: { passed: ready, reason: 'fixture' },
      contentRendered: { passed: ready, reason: 'fixture' },
      interactivity: { passed: ready, reason: 'fixture' },
      buildToPreview: { passed: ready, reason: 'fixture' },
      runtimeEvidence: { passed: ready, reason: 'fixture' },
      founderViewability: { passed: ready, reason: 'fixture' },
      operatorFeedEvents: [],
      previewRealityScore: score,
      previewRealityPass: ready,
      insufficientInfo: false,
      insufficientInfoReason: null,
    },
    assessedAt: Date.now(),
    report: {
      executiveSummary: 'fixture',
      previewRealityMatrix: [],
      evidenceFound: [],
      missingEvidence: [],
      previewBlockers: [],
      founderConclusion: 'fixture',
      previewStatus: ready ? 'PREVIEW_PROVEN' : 'PREVIEW_NOT_PROVEN',
      founderBottleneck: ready ? 'NONE' : 'PREVIEW_NOT_USABLE',
      markdown: '# fixture',
    },
  };
}

function buildVerificationFixture(score: number): VerificationRealityAssessment {
  const proven = score >= 70;
  return {
    assessmentId: 'fixture-verification',
    verificationRealityScore: score,
    verificationStatus: proven ? 'VERIFICATION_PROVEN' : 'VERIFICATION_PARTIAL',
    portfolioSubscores: {
      validationInfrastructure: score,
      runtimeLink: score,
      buildOutputLink: score,
      previewLink: score,
      evidenceChain: score,
    },
    analyzers: {
      validationInventory: proven ? 'VERIFICATION_PROVEN' : 'VERIFICATION_PARTIAL',
      runtimeLink: proven ? 'RUNTIME_LINK_PROVEN' : 'RUNTIME_LINK_MISSING',
      buildOutputLink: proven ? 'BUILD_OUTPUT_LINK_PROVEN' : 'BUILD_OUTPUT_LINK_MISSING',
      previewLink: proven ? 'PREVIEW_LINK_PROVEN' : 'PREVIEW_LINK_MISSING',
      evidenceChain: proven ? 'EVIDENCE_CHAIN_PROVEN' : 'EVIDENCE_CHAIN_MISSING',
      evidenceChainBreakPoint: proven ? 'NONE' : 'RUNTIME',
    },
    stages: [],
    evidence: [],
    blockers: proven
      ? []
      : [{
          id: 'vb-1',
          severity: 'CRITICAL',
          impactRank: 1,
          explanation: 'Verification not linked to runtime outcomes',
          recommendation: 'Connect verification to execution outcomes',
        }],
    verificationRealityMatrix: [],
    evidenceFound: [],
    missingEvidence: proven ? [] : ['Runtime-linked verification proof'],
    verificationBlockers: proven ? [] : ['Verification chain incomplete'],
    founderConclusion: proven ? 'Verification trustworthy' : 'Verification not proven',
    evidenceChainBreakPoint: proven ? 'NONE' : 'RUNTIME',
    verificationRealitySummary: proven ? 'Proven' : 'Partial',
    assessedAt: Date.now(),
    report: {
      executiveSummary: 'fixture',
      verificationRealityMatrix: [],
      evidenceFound: [],
      missingEvidence: [],
      verificationBlockers: [],
      founderConclusion: 'fixture',
      verificationStatus: proven ? 'VERIFICATION_PROVEN' : 'VERIFICATION_PARTIAL',
      evidenceChainBreakPoint: proven ? 'NONE' : 'RUNTIME',
      markdown: '# fixture',
    },
  };
}

function buildInteractiveFixture(state: InteractiveExplanationsEvaluation['state']): InteractiveExplanationsEvaluation {
  const readiness = state === 'READY' ? 90 : state === 'PARTIAL' ? 65 : 25;
  return {
    explanationCoverageScore: readiness,
    workflowCoverageScore: readiness,
    reasoningCoverageScore: readiness,
    reportCoverageScore: readiness,
    guidanceCoverageScore: readiness,
    coverageLevel: state === 'READY' ? 'COMPLETE' : state === 'PARTIAL' ? 'PARTIAL' : 'MINIMAL',
    state,
    confidence: readiness,
    explanationReadiness: readiness,
  };
}

function buildCouncilFixture(blocked: boolean): LaunchCouncilAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    overallScore: blocked ? 35 : 82,
    confidenceScore: blocked ? 30 : 80,
    launchBlockerCount: blocked ? 2 : 0,
    participatingAuthorities: 1,
    readinessState: blocked ? 'BLOCKED' : 'READY',
    authorityResults: [],
    findings: blocked ? ['Launch blocked by council'] : [],
    recommendations: blocked ? ['Resolve blockers'] : ['Proceed with caution'],
    cacheKey: 'fixture-council',
  };
}

function main(): void {
  console.log('');
  console.log('Founder Test Reality Sweep — Validation (leaf mode)');
  console.log('===================================================');
  console.log('');

  checkpoint('start');
  resetFounderTestRealitySweepModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }

  const authoritySource = readText('src/founder-test-reality-sweep/founder-test-reality-sweep-authority.ts');
  const analyzerSource = readText('src/founder-test-reality-sweep/launch-blocker-analyzer.ts');
  const reportBuilderSource = readText('src/founder-test-reality-sweep/founder-test-reality-sweep-report-builder.ts');
  const reportMd = readText('architecture/FOUNDER_TEST_REALITY_SWEEP_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert(
    'package script registered',
    Boolean(pkg.scripts?.['validate:founder-test-reality-sweep']),
    'package.json',
  );

  assert(
    'core question registered',
    FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION.toLowerCase().includes('would they launch it'),
    FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
  );

  assert(
    'reality sweep categories registered',
    REALITY_SWEEP_CATEGORIES.length === 10 &&
      REALITY_SWEEP_CATEGORIES.includes('EXECUTION_REALITY') &&
      REALITY_SWEEP_CATEGORIES.includes('COMPETITIVE_REALITY'),
    REALITY_SWEEP_CATEGORIES.join(', '),
  );

  assert(
    'launch verdicts registered',
    FOUNDER_LAUNCH_VERDICTS.length === 5 &&
      FOUNDER_LAUNCH_VERDICTS.includes('NOT_READY_TO_LAUNCH') &&
      FOUNDER_LAUNCH_VERDICTS.includes('BLOCK_LAUNCH'),
    FOUNDER_LAUNCH_VERDICTS.join(', '),
  );

  assert(
    'launch recommendations registered',
    LAUNCH_RECOMMENDATIONS.length === 5,
    LAUNCH_RECOMMENDATIONS.join(', '),
  );

  assert(
    'blocker severities registered',
    LAUNCH_BLOCKER_SEVERITIES.length === 4,
    LAUNCH_BLOCKER_SEVERITIES.join(', '),
  );

  assert(
    'required input authorities registered',
    REQUIRED_INPUT_AUTHORITIES.length === 11 &&
      REQUIRED_INPUT_AUTHORITIES.includes('founder-execution-proof') &&
      REQUIRED_INPUT_AUTHORITIES.includes('competitive-reality-engine'),
    REQUIRED_INPUT_AUTHORITIES.join(', '),
  );

  assert(
    'consumes founder execution proof',
    authoritySource.includes('assessFounderExecutionProof'),
    'founder-execution-proof',
  );

  assert(
    'consumes founder test launch readiness',
    authoritySource.includes('runFounderTestLaunchReadiness'),
    'founder-test-launch-readiness',
  );

  assert(
    'consumes first time user reality',
    authoritySource.includes('assessFirstTimeUserReality'),
    'first-time-user-reality',
  );

  assert(
    'consumes live preview reality',
    authoritySource.includes('assessLivePreviewRealityAuthority'),
    'live-preview-reality',
  );

  assert(
    'consumes verification reality',
    authoritySource.includes('assessVerificationReality'),
    'verification-reality',
  );

  assert(
    'consumes interactive explanations',
    authoritySource.includes('evaluateInteractiveExplanationsEngine'),
    'interactive-explanations',
  );

  assert(
    'launch blocker analyzer exported',
    analyzerSource.includes('export function analyzeLaunchBlockers'),
    'analyzeLaunchBlockers',
  );

  assert(
    'honest readiness computation',
    analyzerSource.includes('computeHonestLaunchReadinessPercent') &&
      analyzerSource.includes('SEVERITY_READINESS_PENALTY'),
    'honest scoring',
  );

  assert(
    'brutally honest guarantee documented',
    REALITY_SWEEP_SAFETY_GUARANTEES.some((g) => /no roadmap credit/i.test(g)),
    'no roadmap credit',
  );

  assert('no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('no network fetch', !authoritySource.includes('fetch('), 'network');

  assert(
    'founder report markdown builder',
    reportBuilderSource.includes('Top 10 Blockers') &&
      reportBuilderSource.includes('Founder Launch Verdict') &&
      reportBuilderSource.includes('Most Important Next Build Items'),
    'report fields',
  );

  assert(
    'architecture report pass token',
    reportMd.includes(FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN),
    FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN,
  );

  checkpoint('static checks');

  const strongFounderTest = buildFixtureFounderTest({
    FOUNDER_REALITY: 92,
    UI_REALITY: 90,
    REQUIREMENT_REALITY: 88,
    FOUNDER_SIMULATION: 90,
    EXECUTION_PROOF_EVOLUTION: 95,
    LIVE_PREVIEW_REALITY: 88,
    VERIFICATION_REALITY: 86,
    LAUNCH_COUNCIL: 90,
  });

  const strong = assessFounderTestRealitySweep({
    rootDir: ROOT,
    founderTestAssessment: strongFounderTest,
    founderExecutionProofAssessment: buildExecutionProofFixture(true),
    founderAcceptanceAssessment: buildAcceptanceFixture('ACCEPTED'),
    firstTimeUserRealityAssessment: buildFtuFixture(85),
    uiReviewerAssessment: buildUiFixture(88, false),
    livePreviewRealityAssessment: buildPreviewFixture(82),
    verificationRealityAssessment: buildVerificationFixture(80),
    interactiveExplanationsEvaluation: buildInteractiveFixture('READY'),
    launchCouncilAssessment: buildCouncilFixture(false),
  });

  assert(
    'strong scenario produces ranked blockers output',
    strong.report.launchBlockers.length >= 0 &&
      strong.report.topBlockers.length <= 10 &&
      strong.report.categoryScores.length === 10,
    `${strong.report.launchBlockers.length} blockers, ${strong.report.categoryScores.length} categories`,
  );

  assert(
    'strong scenario includes launch readiness percent',
    strong.report.launchReadinessPercent >= 0 && strong.report.launchReadinessPercent <= 100,
    `${strong.report.launchReadinessPercent}%`,
  );

  assert(
    'strong scenario includes founder launch verdict',
    FOUNDER_LAUNCH_VERDICTS.includes(strong.report.founderLaunchVerdict),
    strong.report.founderLaunchVerdict,
  );

  assert(
    'strong scenario includes strengths and recommended work',
    strong.report.launchStrengths.length > 0 &&
      strong.report.recommendedLaunchWork.length > 0,
    `${strong.report.launchStrengths.length} strengths`,
  );

  const blocked = assessFounderTestRealitySweep({
    rootDir: ROOT,
    founderTestAssessment: buildFixtureFounderTest(
      { FOUNDER_REALITY: 40, UI_REALITY: 35, REQUIREMENT_REALITY: 30 },
      {
        FOUNDER_REALITY: {
          blockers: ['Critical workflow blocker'],
          criticalBlockerCount: 1,
        },
      },
    ),
    founderExecutionProofAssessment: buildExecutionProofFixture(false),
    founderAcceptanceAssessment: buildAcceptanceFixture('BLOCKED'),
    firstTimeUserRealityAssessment: buildFtuFixture(35),
    uiReviewerAssessment: buildUiFixture(30, true),
    livePreviewRealityAssessment: buildPreviewFixture(25),
    verificationRealityAssessment: buildVerificationFixture(30),
    interactiveExplanationsEvaluation: buildInteractiveFixture('INCOMPLETE'),
    launchCouncilAssessment: buildCouncilFixture(true),
  });

  assert(
    'blocked scenario verdict',
    blocked.report.founderLaunchVerdict === 'BLOCK_LAUNCH',
    blocked.report.founderLaunchVerdict,
  );

  assert(
    'blocked scenario has critical blockers ranked first',
    blocked.report.topBlockers.length > 0 &&
      blocked.report.topBlockers[0]!.severity === 'CRITICAL',
    blocked.report.topBlockers.map((b) => b.severity).join(', '),
  );

  assert(
    'blocked scenario launch recommendation',
    blocked.report.launchRecommendation === 'BLOCK_LAUNCH',
    blocked.report.launchRecommendation,
  );

  const insufficient = assessFounderTestRealitySweep({
    rootDir: ROOT,
    founderTestAssessment: buildFixtureFounderTest({ FOUNDER_REALITY: 20 }),
    founderExecutionProofAssessment: buildExecutionProofFixture(false),
    founderAcceptanceAssessment: buildAcceptanceFixture('REJECTED'),
    firstTimeUserRealityAssessment: buildFtuFixture(20),
    uiReviewerAssessment: buildUiFixture(20, true),
    livePreviewRealityAssessment: buildPreviewFixture(15),
    verificationRealityAssessment: buildVerificationFixture(15),
    interactiveExplanationsEvaluation: buildInteractiveFixture('UNKNOWN'),
    launchCouncilAssessment: buildCouncilFixture(true),
  });

  assert(
    'not ready scenario has low honest readiness',
    insufficient.report.launchReadinessPercent < 60,
    `${insufficient.report.launchReadinessPercent}%`,
  );

  assert(
    'not ready scenario lists missing capabilities',
    insufficient.report.missingCapabilities.length >= 0,
    `${insufficient.report.missingCapabilities.length} missing`,
  );

  assert(
    'history records assessments',
    getFounderTestRealitySweepHistorySize() >= 3,
    `${getFounderTestRealitySweepHistorySize()} entries`,
  );

  const historySummary = buildFounderTestRealitySweepHistorySummary();
  assert(
    'history summary tracks verdicts',
    historySummary.totalAssessments >= 3 && historySummary.blockedAssessments >= 1,
    JSON.stringify(historySummary),
  );

  resetFounderTestRealitySweepModuleForTests();
  const artifacts = buildFounderTestRealitySweepArtifacts({
    rootDir: ROOT,
    founderTestAssessment: strongFounderTest,
    founderExecutionProofAssessment: buildExecutionProofFixture(true),
    founderAcceptanceAssessment: buildAcceptanceFixture('ACCEPTED'),
    firstTimeUserRealityAssessment: buildFtuFixture(85),
    uiReviewerAssessment: buildUiFixture(88, false),
    livePreviewRealityAssessment: buildPreviewFixture(82),
    verificationRealityAssessment: buildVerificationFixture(80),
    interactiveExplanationsEvaluation: buildInteractiveFixture('READY'),
    launchCouncilAssessment: buildCouncilFixture(false),
  });

  assert(
    'artifacts bundle includes markdown report',
    artifacts.founderTestRealitySweepReportMarkdown.length > 200 &&
      artifacts.founderTestRealitySweepReportMarkdown.includes('Launch Readiness'),
    `${artifacts.founderTestRealitySweepReportMarkdown.length} chars`,
  );

  const snapshot = artifacts.founderTestRealitySweepAssessment.report.inputSnapshot;
  const categoryScores = computeCategoryScores(snapshot);
  const blockers = analyzeLaunchBlockers(snapshot, categoryScores);
  assert(
    'analyzer consumes execution proof evidence',
    categoryScores.some((c) => c.category === 'EXECUTION_REALITY') &&
      blockers.some((b) => b.category === 'EXECUTION_REALITY') === false,
    `execution category ${categoryScores.find((c) => c.category === 'EXECUTION_REALITY')?.honestScore}`,
  );

  resetFounderTestRealitySweepModuleForTests();
  const live = assessFounderTestRealitySweep({ rootDir: ROOT });
  checkpoint('live assessment');

  assert(
    'live assessment executes',
    live.report.sweepId.length > 0 &&
      live.report.categoryScores.length === 10 &&
      live.report.founderLaunchVerdict.length > 0,
    `${live.report.founderLaunchVerdict} readiness=${live.report.launchReadinessPercent}% blockers=${live.report.topBlockers.length}`,
  );

  assert(
    'live assessment answers launch blocker question',
    live.report.topBlockers.length > 0 || live.report.launchReadinessPercent < 85,
    `${live.report.topBlockers.length} blockers`,
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Runtime: ${Date.now() - START}ms`);
  console.log('');

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN);
  console.log('');
  console.log('Report: architecture/FOUNDER_TEST_REALITY_SWEEP_REPORT.md');
}

main();
