/**
 * Founder Test Integration — orchestrates participating read-only authorities.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessAutonomousBuilderReality, detectModulePresenceEvidence } from '../autonomous-builder-reality/index.js';
import { assessFounderWorkflowReality } from '../end-to-end-founder-workflow-reality/index.js';
import { assessExecutionProofEvolution } from '../execution-proof-evolution/index.js';
import type { AssessExecutionProofEvolutionInput } from '../execution-proof-evolution/index.js';
import { assessFounderInteractionSimulation } from '../founder-interaction-simulation/index.js';
import { assessLaunchCouncil } from '../launch-council/index.js';
import type { LaunchCouncilAuthorityResult } from '../launch-council/index.js';
import {
  assessLivePreviewReality,
  assessLivePreviewRealityAuthority,
  buildPreviewWorkspaceSignalsFromLegacy,
  detectPreviewModulePresenceEvidence,
} from '../live-preview-reality/index.js';
import type { LivePreviewRealityInput } from '../live-preview-reality/index.js';
import { assessMobileRuntimeExperienceReality } from '../mobile-runtime-experience-reality/index.js';
import { assessVisualQualityAuthority } from '../visual-quality-authority/index.js';
import {
  assessVerificationReality,
  buildVerificationWorkspaceSignalsForValidation,
  detectVerificationModulePresenceEvidence,
} from '../verification-reality/index.js';
import { getFounderTestAuthorityWeight, normalizeAuthorityScore } from './founder-test-integration-registry.js';
import type {
  FounderTestAuthorityId,
  FounderTestAuthorityResult,
  FounderTestRun,
  FounderTestShellSources,
  RunFounderTestIntegrationInput,
} from './founder-test-integration-types.js';

let runCounter = 0;

export function resetFounderTestIntegrationRunCounterForTests(): void {
  runCounter = 0;
}

function nextRunId(): string {
  runCounter += 1;
  return `founder-test-run-${runCounter}`;
}

function clampWeightContribution(score: number, weight: number): number {
  return Math.round((normalizeAuthorityScore(score) * weight) / 100);
}

function buildAuthorityResult(
  authorityId: FounderTestAuthorityId,
  displayName: string,
  sourceModule: string,
  score: number,
  options: {
    available?: boolean;
    blockers?: string[];
    warnings?: string[];
    recommendations?: string[];
    missingCapabilities?: string[];
    criticalBlockerCount?: number;
    regressionDetected?: boolean;
    simulationPassed?: boolean | null;
    executionProofVerdict?: string | null;
  } = {},
): FounderTestAuthorityResult {
  const weight = getFounderTestAuthorityWeight(authorityId);
  const normalizedScore = normalizeAuthorityScore(score);
  return {
    authorityId,
    displayName,
    sourceModule,
    readOnly: true,
    available: options.available ?? true,
    normalizedScore,
    weight,
    weightedContribution: clampWeightContribution(normalizedScore, weight),
    blockers: options.blockers ?? [],
    warnings: options.warnings ?? [],
    recommendations: options.recommendations ?? [],
    missingCapabilities: options.missingCapabilities ?? [],
    criticalBlockerCount: options.criticalBlockerCount ?? 0,
    regressionDetected: options.regressionDetected ?? false,
    simulationPassed: options.simulationPassed ?? null,
    executionProofVerdict: options.executionProofVerdict ?? null,
  };
}

export function loadFounderTestShellSources(rootDir: string): FounderTestShellSources {
  const publicDir = join(rootDir, 'public', 'founder-reality');
  return {
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
    css: readFileSync(join(publicDir, 'styles.css'), 'utf8'),
  };
}

function buildLeafPreviewInput(): LivePreviewRealityInput {
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
    latestProjectId: 'founder-test-leaf',
    projectCount: 1,
    generatedAt: Date.now(),
  };
}

function collectFounderReality(rootDir: string): FounderTestAuthorityResult {
  const assessment = assessFounderWorkflowReality(rootDir);
  const criticalBlockers = assessment.blockers.filter((b) => b.severity === 'CRITICAL');
  return buildAuthorityResult(
    'FOUNDER_REALITY',
    'Founder Reality',
    'end-to-end-founder-workflow-reality',
    assessment.founderWorkflowRealityScore,
    {
      blockers: assessment.founderBlockers,
      warnings: assessment.missingEvidence.slice(0, 8),
      recommendations: [assessment.founderConclusion],
      missingCapabilities: assessment.missingEvidence.slice(0, 6),
      criticalBlockerCount: criticalBlockers.length,
    },
  );
}

function collectUiReality(shellSources: FounderTestShellSources): FounderTestAuthorityResult {
  const assessment = assessVisualQualityAuthority({ shellSources });
  const criticalFindings = assessment.findings.filter((f) => f.severity === 'CRITICAL');
  return buildAuthorityResult(
    'UI_REALITY',
    'UI Reality',
    'visual-quality-authority',
    assessment.visualQualityScore,
    {
      blockers: assessment.topVisualRisks.map((f) => f.explanation),
      warnings: assessment.weaknesses,
      recommendations: assessment.findings.map((f) => f.recommendation).slice(0, 8),
      missingCapabilities: assessment.insufficientInfo ? [assessment.insufficientInfoReason ?? 'Insufficient UI evidence'] : [],
      criticalBlockerCount: criticalFindings.length,
    },
  );
}

function collectRequirementReality(rootDir: string): FounderTestAuthorityResult {
  const moduleEvidence = detectModulePresenceEvidence(rootDir);
  const assessment = assessAutonomousBuilderReality({
    workspace: {
      world2FoundationComplete: true,
      executionConnected: false,
      readiness: 'foundation',
      readinessLabel: 'Foundation complete — isolated workspace execution not fully active',
      livePreviewConnected: false,
    },
    moduleEvidence,
  });
  const criticalBlockers = assessment.blockers.filter((b) => b.severity === 'CRITICAL');
  return buildAuthorityResult(
    'REQUIREMENT_REALITY',
    'Requirement Reality',
    'autonomous-builder-reality',
    assessment.builderRealityScore,
    {
      blockers: assessment.builderBottlenecks,
      warnings: assessment.missingEvidence.slice(0, 8),
      recommendations: [assessment.founderConclusion],
      missingCapabilities: assessment.missingEvidence.slice(0, 6),
      criticalBlockerCount: criticalBlockers.length,
    },
  );
}

function collectFounderSimulation(shellSources: FounderTestShellSources): FounderTestAuthorityResult {
  const assessment = assessFounderInteractionSimulation({ shellSources });
  const criticalFindings = assessment.findings.filter((f) => f.severity === 'CRITICAL');
  const simulationPassed =
    assessment.interactionScore >= 70 &&
    assessment.scenarios.every((s) => s.passed) &&
    criticalFindings.length === 0;
  return buildAuthorityResult(
    'FOUNDER_SIMULATION',
    'Founder Simulation',
    'founder-interaction-simulation',
    assessment.interactionScore,
    {
      blockers: assessment.blockedWorkflows.map((f) => f.whatFailed),
      warnings: assessment.hiddenContentIssues
        .concat(assessment.recoveryIssues)
        .map((f) => f.whatFailed),
      recommendations: assessment.recommendedFixes,
      missingCapabilities: assessment.findings
        .filter((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL')
        .map((f) => f.recommendedFix)
        .slice(0, 6),
      criticalBlockerCount: criticalFindings.length,
      simulationPassed,
    },
  );
}

function collectLivePreviewReality(rootDir: string): FounderTestAuthorityResult {
  const legacyInput = buildLeafPreviewInput();
  const legacyAssessment = assessLivePreviewReality(legacyInput);
  const assessment = assessLivePreviewRealityAuthority({
    workspace: buildPreviewWorkspaceSignalsFromLegacy(legacyInput, false, legacyAssessment),
    moduleEvidence: detectPreviewModulePresenceEvidence(rootDir),
    legacyInput,
  });
  const criticalBlockers = assessment.blockers.filter((b) => b.severity === 'CRITICAL');
  return buildAuthorityResult(
    'LIVE_PREVIEW_REALITY',
    'Live Preview Reality',
    'live-preview-reality',
    assessment.livePreviewRealityScore,
    {
      blockers: assessment.previewBlockers,
      warnings: assessment.missingEvidence.slice(0, 8),
      recommendations: [assessment.founderConclusion],
      missingCapabilities: assessment.missingEvidence.slice(0, 6),
      criticalBlockerCount: criticalBlockers.length,
    },
  );
}

function collectMobileRuntimeReality(rootDir: string): FounderTestAuthorityResult {
  const assessment = assessMobileRuntimeExperienceReality(rootDir);
  const criticalBlockers = assessment.mobileRuntimeBlockers.filter((b) => b.severity === 'CRITICAL');
  return buildAuthorityResult(
    'MOBILE_RUNTIME_REALITY',
    'Mobile Runtime Reality',
    'mobile-runtime-experience-reality',
    assessment.mobileRuntimeExperienceScore,
    {
      blockers: assessment.mobileRuntimeBlockers.map((b) => b.explanation),
      warnings: assessment.missingEvidence.slice(0, 8),
      recommendations: [assessment.founderConclusion],
      missingCapabilities: assessment.nextRequiredCapability ? [assessment.nextRequiredCapability] : [],
      criticalBlockerCount: criticalBlockers.length,
    },
  );
}

function collectVerificationReality(rootDir: string): FounderTestAuthorityResult {
  const moduleEvidence = detectVerificationModulePresenceEvidence(rootDir);
  const assessment = assessVerificationReality({
    workspace: buildVerificationWorkspaceSignalsForValidation(moduleEvidence),
    moduleEvidence,
  });
  const criticalBlockers = assessment.blockers.filter((b) => b.severity === 'CRITICAL');
  return buildAuthorityResult(
    'VERIFICATION_REALITY',
    'Verification Reality',
    'verification-reality',
    assessment.verificationRealityScore,
    {
      blockers: assessment.verificationBlockers,
      warnings: assessment.missingEvidence.slice(0, 8),
      recommendations: [assessment.founderConclusion],
      missingCapabilities: assessment.missingEvidence.slice(0, 6),
      criticalBlockerCount: criticalBlockers.length,
    },
  );
}

function buildExecutionProofInput(
  partialResults: FounderTestAuthorityResult[],
): AssessExecutionProofEvolutionInput {
  const available = partialResults.filter((r) => r.available);
  const avgScore =
    available.length === 0
      ? 0
      : Math.round(available.reduce((sum, r) => sum + r.normalizedScore, 0) / available.length);
  const topBlocker = partialResults.flatMap((r) => r.blockers)[0] ?? 'Founder readiness not yet proven';

  return {
    problem: {
      problemId: 'founder-test-integration-portfolio',
      problemType: 'FOUNDER_TEST_PORTFOLIO',
      originalFailingSignal: topBlocker,
      description: 'Portfolio-level founder test proof across participating authorities',
    },
    attempt: {
      attemptId: nextRunId(),
      problemId: 'founder-test-integration-portfolio',
      claimedFixType: 'FOUNDER_TEST_INTEGRATION',
      claimedFixDescription: 'Unified founder test orchestration — read-only portfolio assessment',
      snapshot: {
        beforeState: 'Pre-integration founder authority results unavailable',
        afterState: `Post-integration portfolio score ${avgScore}/100 across ${available.length} authorities`,
        metricBefore: null,
        metricAfter: avgScore,
        originalFailureStillPresent: avgScore < 70,
        regressionObserved: partialResults.some((r) => r.regressionDetected),
      },
      evidence: available.slice(0, 9).map((result) => ({
        evidenceId: `ev-${result.authorityId.toLowerCase()}`,
        source:
          result.authorityId === 'FOUNDER_SIMULATION'
            ? 'FOUNDER_SIMULATION_RESULT'
            : result.authorityId === 'LIVE_PREVIEW_REALITY'
              ? 'LIVE_PREVIEW_RESULT'
              : result.authorityId === 'UI_REALITY'
                ? 'UI_REALITY_RESULT'
                : result.authorityId === 'MOBILE_RUNTIME_REALITY'
                  ? 'MOBILE_RUNTIME_RESULT'
                  : result.authorityId === 'VERIFICATION_REALITY'
                    ? 'VALIDATOR_RESULT'
                    : result.authorityId === 'LAUNCH_COUNCIL'
                      ? 'LAUNCH_COUNCIL_RESULT'
                      : 'RUNTIME_OBSERVATION',
        summary: `${result.displayName}: ${result.normalizedScore}/100`,
        supportsImprovement: result.normalizedScore >= 70,
        supportsRegression: result.regressionDetected,
        capturedAt: new Date().toISOString(),
      })),
      originalFailureRetested: available.length >= 7,
      causalLinkToFix: false,
    },
  };
}

function collectExecutionProofEvolution(partialResults: FounderTestAuthorityResult[]): FounderTestAuthorityResult {
  const assessment = assessExecutionProofEvolution(buildExecutionProofInput(partialResults));
  const regressionDetected =
    assessment.verdict === 'REGRESSION_DETECTED' || assessment.regressionDetected;
  return buildAuthorityResult(
    'EXECUTION_PROOF_EVOLUTION',
    'Execution Proof Evolution',
    'execution-proof-evolution',
    assessment.executionProofScore,
    {
      blockers: assessment.regressionDetected ? assessment.recommendations.slice(0, 4) : [],
      warnings: assessment.recommendations.slice(0, 6),
      recommendations: assessment.recommendations,
      regressionDetected,
      executionProofVerdict: assessment.verdict,
      criticalBlockerCount: assessment.verdict === 'REGRESSION_DETECTED' ? 1 : 0,
    },
  );
}

function collectLaunchCouncil(authorityResults: FounderTestAuthorityResult[]): FounderTestAuthorityResult {
  const portfolioResults = authorityResults.filter((r) => r.authorityId !== 'LAUNCH_COUNCIL');
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

  const assessment = assessLaunchCouncil({
    authorityResults: [councilInput],
    generatedAt: Date.now(),
  });

  return buildAuthorityResult(
    'LAUNCH_COUNCIL',
    'Launch Council',
    'launch-council',
    assessment.overallScore,
    {
      blockers: assessment.findings.filter((f) => /block/i.test(f)).slice(0, 6),
      warnings: assessment.findings.slice(0, 8),
      recommendations: assessment.recommendations,
      criticalBlockerCount: assessment.launchBlockerCount,
    },
  );
}

function executeParticipatingAuthorities(
  rootDir: string,
  shellSources: FounderTestShellSources,
): FounderTestAuthorityResult[] {
  const partial: FounderTestAuthorityResult[] = [
    collectFounderReality(rootDir),
    collectUiReality(shellSources),
    collectRequirementReality(rootDir),
    collectFounderSimulation(shellSources),
    collectLivePreviewReality(rootDir),
    collectMobileRuntimeReality(rootDir),
    collectVerificationReality(rootDir),
  ];

  partial.push(collectExecutionProofEvolution(partial));
  partial.push(collectLaunchCouncil(partial));

  return partial;
}

export function runFounderTestIntegration(
  input: RunFounderTestIntegrationInput = {},
): FounderTestRun {
  const startedAt = new Date().toISOString();
  const rootDir = input.rootDir ?? process.cwd();
  const shellSources = input.shellSources ?? loadFounderTestShellSources(rootDir);

  const authorityResults =
    input.authorityResults ??
    executeParticipatingAuthorities(rootDir, shellSources);

  return {
    readOnly: true,
    runId: nextRunId(),
    startedAt,
    completedAt: new Date().toISOString(),
    rootDir,
    authorityResults,
  };
}
