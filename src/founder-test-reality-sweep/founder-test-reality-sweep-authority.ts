/**
 * Founder Test Reality Sweep — read-only authority.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { assessFounderAcceptanceGate } from '../founder-acceptance-gate/index.js';
import { assessFounderExecutionProof } from '../founder-execution-proof/index.js';
import { assessFirstTimeUserReality } from '../first-time-user-reality/index.js';
import { evaluateInteractiveExplanationsEngine } from '../interactive-explanations/index.js';
import { assessLaunchCouncil } from '../launch-council/index.js';
import type { LaunchCouncilAuthorityResult } from '../launch-council/index.js';
import {
  assessLivePreviewReality,
  assessLivePreviewRealityAuthority,
  buildPreviewWorkspaceSignalsFromLegacy,
  detectPreviewModulePresenceEvidence,
} from '../live-preview-reality/index.js';
import type { LivePreviewRealityInput } from '../live-preview-reality/index.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import { runFounderTestLaunchReadiness } from '../founder-test-launch-readiness/index.js';
import {
  assessVerificationReality,
  buildVerificationWorkspaceSignalsForValidation,
  detectVerificationModulePresenceEvidence,
} from '../verification-reality/index.js';
import {
  analyzeCompetitiveGaps,
  analyzeLaunchBlockers,
  analyzeLaunchStrengths,
  analyzeLaunchWarnings,
  analyzeMissingCapabilities,
  analyzeRecommendedLaunchWork,
  analyzeTopLaunchRisks,
  computeCategoryScores,
  computeHonestLaunchReadinessPercent,
  deriveFounderLaunchVerdict,
  deriveLaunchRecommendation,
  rankMostImportantNextBuildItems,
  rankTopBlockers,
  rankTopMissingCapabilities,
  rankTopStrengths,
  resetLaunchBlockerAnalyzerCountersForTests,
} from './launch-blocker-analyzer.js';
import {
  recordFounderTestRealitySweepAssessment,
  resetFounderTestRealitySweepHistoryForTests,
} from './founder-test-reality-sweep-history.js';
import { buildFounderTestRealitySweepReportMarkdown } from './founder-test-reality-sweep-report-builder.js';
import {
  FOUNDER_TEST_REALITY_SWEEP_CACHE_KEY_PREFIX,
  FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
  FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN,
  REQUIRED_INPUT_AUTHORITIES,
} from './founder-test-reality-sweep-registry.js';
import type {
  AssessFounderTestRealitySweepInput,
  FounderTestRealitySweepArtifacts,
  FounderTestRealitySweepAssessment,
  FounderTestRealitySweepInputSnapshot,
  FounderTestRealitySweepReport,
} from './founder-test-reality-sweep-types.js';

let sweepCounter = 0;

export function resetFounderTestRealitySweepCounterForTests(): void {
  sweepCounter = 0;
}

export function resetFounderTestRealitySweepModuleForTests(): void {
  resetFounderTestRealitySweepHistoryForTests();
  resetFounderTestRealitySweepCounterForTests();
  resetLaunchBlockerAnalyzerCountersForTests();
}

function nextSweepId(): string {
  sweepCounter += 1;
  return `founder-test-reality-sweep-${sweepCounter}`;
}

function stableCacheKey(sweepId: string, readiness: number, verdict: string): string {
  const digest = createHash('sha256')
    .update([FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN, sweepId, readiness, verdict].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_TEST_REALITY_SWEEP_CACHE_KEY_PREFIX}:${digest}`;
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function loadShellSources(rootDir: string): { appJs: string; html: string; css: string } {
  return {
    appJs: readFileSync(join(rootDir, 'public/founder-reality/app.js'), 'utf8'),
    html: readFileSync(join(rootDir, 'public/founder-reality/index.html'), 'utf8'),
    css: readFileSync(join(rootDir, 'public/founder-reality/styles.css'), 'utf8'),
  };
}

function defaultPreviewInput(): LivePreviewRealityInput {
  return {
    uiSurfacePresent: true,
    connected: false,
    previewUrl: null,
    activeSession: null,
    sessions: [],
    diagnostics: {
      previewRuntimeActive: false,
      previewSessionCount: 0,
      registeredTargetCount: 0,
      readyPreviewCount: 0,
      blockedPreviewCount: 0,
    },
    latestProjectId: null,
    projectCount: 0,
    generatedAt: Date.now(),
  };
}

function buildLaunchCouncilFromFounderTest(
  founderTest: NonNullable<AssessFounderTestRealitySweepInput['founderTestAssessment']>,
) {
  const portfolioResults = founderTest.run.authorityResults.filter(
    (result) => result.authorityId !== 'LAUNCH_COUNCIL',
  );
  const portfolioScore =
    portfolioResults.length === 0
      ? 0
      : Math.round(
          portfolioResults.reduce((sum, result) => sum + result.normalizedScore, 0) /
            portfolioResults.length,
        );

  const councilInput: LaunchCouncilAuthorityResult = {
    authorityId: 'founder-testing',
    authorityName: 'Founder Test Integration Portfolio',
    authorityCategory: 'FOUNDER_TESTING',
    score: portfolioScore,
    confidence: portfolioScore,
    status: portfolioScore >= 70 ? 'PASS' : portfolioScore >= 50 ? 'WARNING' : 'FAIL',
    launchBlocker: portfolioResults.some((result) => result.criticalBlockerCount > 0),
    findings: portfolioResults.flatMap((result) => result.blockers).slice(0, 8),
    recommendations: portfolioResults.flatMap((result) => result.recommendations).slice(0, 8),
  };

  return assessLaunchCouncil({
    authorityResults: [councilInput],
    generatedAt: Date.now(),
  });
}

function resolveInputSnapshot(input: AssessFounderTestRealitySweepInput): FounderTestRealitySweepInputSnapshot {
  const rootDir = input.rootDir ?? process.cwd();
  const shellSources = input.shellSources ?? loadShellSources(rootDir);
  const missingAuthorities: string[] = [];

  const founderTest =
    input.founderTestAssessment ??
    assessFounderTestIntegration({ rootDir });

  const founderExecutionProof =
    input.founderExecutionProofAssessment ??
    assessFounderExecutionProof({
      rootDir,
      founderTestAssessment: founderTest,
      founderAcceptanceAssessment: input.founderAcceptanceAssessment ?? undefined,
    });

  const founderTestLaunchReadiness =
    input.founderTestLaunchReadinessAssessment ??
    runFounderTestLaunchReadiness({
      rootDir,
      founderTestAssessment: founderTest,
    });

  const founderAcceptance = input.founderAcceptanceAssessment ?? assessFounderAcceptanceGate();

  const launchCouncil =
    input.launchCouncilAssessment ?? buildLaunchCouncilFromFounderTest(founderTest);

  let firstTimeUserReality = input.firstTimeUserRealityAssessment ?? null;
  if (!firstTimeUserReality) {
    try {
      firstTimeUserReality = assessFirstTimeUserReality({ shellSources });
    } catch {
      missingAuthorities.push('first-time-user-reality');
    }
  }

  let livePreviewReality = input.livePreviewRealityAssessment ?? null;
  if (!livePreviewReality) {
    try {
      const legacyInput = defaultPreviewInput();
      const legacyAssessment = assessLivePreviewReality(legacyInput);
      const executionConnected =
        founderExecutionProof.report.questionAnswers.founderExecutionProven === true;
      livePreviewReality = assessLivePreviewRealityAuthority({
        workspace: buildPreviewWorkspaceSignalsFromLegacy(
          legacyInput,
          executionConnected,
          legacyAssessment,
        ),
        moduleEvidence: detectPreviewModulePresenceEvidence(rootDir),
        legacyInput,
      });
    } catch {
      missingAuthorities.push('live-preview-reality');
    }
  }

  let verificationReality = input.verificationRealityAssessment ?? null;
  if (!verificationReality) {
    try {
      const executionConnected =
        founderExecutionProof.report.questionAnswers.founderExecutionProven === true;
      verificationReality = assessVerificationReality({
        workspace: buildVerificationWorkspaceSignalsForValidation(
          detectVerificationModulePresenceEvidence(rootDir),
          {
          executionConnected,
        }),
        moduleEvidence: detectVerificationModulePresenceEvidence(rootDir),
      });
    } catch {
      missingAuthorities.push('verification-reality');
    }
  }

  let interactiveExplanations = input.interactiveExplanationsEvaluation ?? null;
  if (!interactiveExplanations) {
    try {
      interactiveExplanations = evaluateInteractiveExplanationsEngine({
        requestId: `reality-sweep-${Date.now()}`,
        projectId: 'default_project',
        workspaceId: 'default_workspace',
      }).report.evaluation;
    } catch {
      missingAuthorities.push('interactive-explanations');
    }
  }

  const uiReviewer = input.uiReviewerAssessment ?? null;
  if (!uiReviewer) {
    missingAuthorities.push('ui-reviewer-authority');
  }

  const competitiveReality = input.competitiveRealityAssessment ?? null;
  if (!competitiveReality) {
    missingAuthorities.push('competitive-reality-engine');
  }

  if (!input.founderExecutionProofAssessment && !founderExecutionProof) {
    missingAuthorities.push('founder-execution-proof');
  }

  return {
    readOnly: true,
    founderExecutionProofAssessment: founderExecutionProof,
    founderTestLaunchReadinessAssessment: founderTestLaunchReadiness,
    founderTestAssessment: founderTest,
    founderAcceptanceAssessment: founderAcceptance,
    launchCouncilAssessment: launchCouncil,
    firstTimeUserRealityAssessment: firstTimeUserReality,
    livePreviewRealityAssessment: livePreviewReality,
    verificationRealityAssessment: verificationReality,
    interactiveExplanationsEvaluation: interactiveExplanations,
    uiReviewerAssessment: uiReviewer,
    competitiveRealityAssessment: competitiveReality,
    missingAuthorities: dedupeStrings(missingAuthorities),
  };
}

export function assessFounderTestRealitySweep(
  input: AssessFounderTestRealitySweepInput = {},
): FounderTestRealitySweepAssessment {
  const sweepId = nextSweepId();
  const generatedAt = new Date().toISOString();
  const inputSnapshot = resolveInputSnapshot(input);

  const categoryScores = computeCategoryScores(inputSnapshot);
  const launchBlockers = analyzeLaunchBlockers(inputSnapshot, categoryScores);
  const launchWarnings = analyzeLaunchWarnings(inputSnapshot);
  const launchStrengths = analyzeLaunchStrengths(inputSnapshot, categoryScores);
  const missingCapabilities = analyzeMissingCapabilities(inputSnapshot);
  const competitiveGaps = analyzeCompetitiveGaps(inputSnapshot);
  const topLaunchRisks = analyzeTopLaunchRisks(launchBlockers, inputSnapshot);
  const recommendedLaunchWork = analyzeRecommendedLaunchWork(launchBlockers, inputSnapshot);

  const launchReadinessPercent = computeHonestLaunchReadinessPercent(categoryScores, launchBlockers);
  const founderLaunchVerdict = deriveFounderLaunchVerdict(
    launchReadinessPercent,
    launchBlockers,
    inputSnapshot,
  );
  const launchRecommendation = deriveLaunchRecommendation(founderLaunchVerdict);

  const topBlockers = rankTopBlockers(launchBlockers);
  const topStrengths = rankTopStrengths(launchStrengths);
  const topMissingCapabilities = rankTopMissingCapabilities(missingCapabilities);
  const mostImportantNextBuildItems = rankMostImportantNextBuildItems(recommendedLaunchWork);

  const blockingReasons = dedupeStrings(launchBlockers.map((b) => b.explanation));
  const warningReasons = dedupeStrings(launchWarnings.map((w) => w.explanation));

  const report: FounderTestRealitySweepReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
    sweepId,
    generatedAt,
    launchReadinessPercent,
    launchRecommendation,
    founderLaunchVerdict,
    categoryScores,
    launchBlockers,
    launchWarnings,
    launchStrengths,
    missingCapabilities,
    competitiveGaps,
    topLaunchRisks,
    recommendedLaunchWork,
    topBlockers,
    topStrengths,
    topMissingCapabilities,
    mostImportantNextBuildItems,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(sweepId, launchReadinessPercent, founderLaunchVerdict),
  };

  const assessment: FounderTestRealitySweepAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState:
      founderLaunchVerdict === 'INSUFFICIENT_EVIDENCE'
        ? 'REALITY_SWEEP_FAILED'
        : 'REALITY_SWEEP_COMPLETE',
    report,
  };

  recordFounderTestRealitySweepAssessment(assessment);
  return assessment;
}

export function buildFounderTestRealitySweepArtifacts(
  input: AssessFounderTestRealitySweepInput = {},
): FounderTestRealitySweepArtifacts {
  const founderTestRealitySweepAssessment = assessFounderTestRealitySweep(input);
  return {
    founderTestRealitySweepAssessment,
    founderTestRealitySweepReportMarkdown: buildFounderTestRealitySweepReportMarkdown(
      founderTestRealitySweepAssessment,
    ),
  };
}

export { FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN, REQUIRED_INPUT_AUTHORITIES };
