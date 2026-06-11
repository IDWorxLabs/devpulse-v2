/**
 * Founder Testing Mode V4 — V3 + Execution Reality layer.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  buildPromiseRealityMatrix,
  detectRealityGaps,
  evaluateAutonomousBuilderReality,
  evaluateCreationJourney,
  evaluateIdeaToAppPrompts,
  evaluatePreviewReality,
  evaluateRunningAppVisibility,
  evaluateVerificationResultsVisibility,
  evaluateChangeIntelligenceVisibility,
  evaluateFounderActionCenterVisibility,
  evaluateProjectMemoryReality,
  evaluateVerificationReality,
  loadWorkspaceSnapshot,
  simulateCustomerOutcome,
  simulateFounderOutcome,
} from './execution-reality-engine.js';
import { runFounderTestingModeV3 } from './founder-testing-v3-orchestrator.js';
import { FOUNDER_TEST_V4_MAX_TOTAL_MS } from './founder-testing-v4-bounds.js';
import { assembleFounderTestV4Report } from './founder-testing-v4-report-builder.js';
import {
  assessChangeIntelligenceVisibility,
  getChangeIntelligenceHistory,
} from '../change-intelligence-visibility/index.js';
import { assessFounderActionCenter } from '../founder-action-center/index.js';
import { buildVerificationResultsFromV4Report } from '../verification-results-visibility/index.js';
import { computeLaunchReadinessReality, deriveV4Verdict } from './founder-testing-v4-scorer.js';
import type { FounderTestV4Report, RunFounderTestingModeV4Input } from './founder-testing-v4-types.js';
import { buildRecommendedFixOrder } from './founder-testing-scorer.js';
import type { ScreenCheckSources } from './founder-testing-screen-checker.js';
import type { FounderTestIssue } from './founder-testing-types.js';

function loadShellSources(rootDir: string): ScreenCheckSources {
  const publicDir = join(rootDir, 'public', 'founder-reality');
  return {
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
    css: readFileSync(join(publicDir, 'styles.css'), 'utf8'),
  };
}

function executionReadinessScore(input: {
  journeyScore: number;
  ideaScore: number;
  builderScore: number;
  memoryScore: number;
  previewScore: number;
  verificationScore: number;
}): number {
  return Math.round(
    (input.journeyScore * 0.25 +
      input.ideaScore * 0.2 +
      input.builderScore * 0.2 +
      input.memoryScore * 0.1 +
      input.previewScore * 0.12 +
      input.verificationScore * 0.13),
  );
}

function gapsToIssues(gaps: ReturnType<typeof detectRealityGaps>): FounderTestIssue[] {
  return gaps.map((g) => ({
    severity: g.gapType === 'EXECUTION_GAP' || g.gapType === 'LAUNCH_GAP' ? ('HIGH' as const) : ('MEDIUM' as const),
    screen: 'Execution Reality',
    problem: `[${g.gapType}] ${g.promise}`,
    userImpact: g.detail,
    likelyCause: g.reality,
    recommendedFix: `Close ${g.gapType.toLowerCase().replace('_', ' ')}: ${g.detail}`,
    copyPasteFixPrompt: `Fix AiDevEngine execution reality gap (${g.gapType}): ${g.detail}`,
  }));
}

export function runFounderTestingModeV4(input: RunFounderTestingModeV4Input = {}): FounderTestV4Report {
  const start = Date.now();
  const rootDir = input.rootDir ?? join(process.cwd());
  const validatorScripts = input.validatorScripts ?? [];

  const v3 = runFounderTestingModeV3({
    rootDir,
    validatorScripts,
    liveResults: input.liveResults,
    liveSection: input.liveSection,
  });

  const sources = loadShellSources(rootDir);
  const workspace = loadWorkspaceSnapshot(validatorScripts);
  const remaining = () => Math.max(0, start + FOUNDER_TEST_V4_MAX_TOTAL_MS - Date.now());

  const { stages: creationJourney, score: creationJourneyScore } = evaluateCreationJourney(sources, workspace);
  const ideaToAppResults = evaluateIdeaToAppPrompts(Math.min(remaining(), 20000));
  const ideaToAppScore =
    ideaToAppResults.length > 0
      ? Math.round(ideaToAppResults.reduce((s, r) => s + r.ideaToAppScore, 0) / ideaToAppResults.length)
      : 0;

  const autonomousBuilderReality = evaluateAutonomousBuilderReality(workspace);
  const projectMemoryReality = evaluateProjectMemoryReality(workspace);
  const previewReality = evaluatePreviewReality(workspace, sources);
  const runningAppVisibility = evaluateRunningAppVisibility(workspace, sources);
  const verificationReality = evaluateVerificationReality(workspace, sources);

  const promiseMatrix = buildPromiseRealityMatrix(workspace, sources, ideaToAppResults);
  const realityGaps = detectRealityGaps(promiseMatrix, workspace, creationJourney);

  const execReadiness = executionReadinessScore({
    journeyScore: creationJourneyScore,
    ideaScore: ideaToAppScore,
    builderScore: autonomousBuilderReality.score,
    memoryScore: projectMemoryReality.score,
    previewScore: previewReality.score,
    verificationScore: verificationReality.score,
  });

  const launchReadinessReality = computeLaunchReadinessReality({
    v3,
    creationJourneyScore,
    ideaToAppScore,
    executionReadiness: execReadiness,
    promiseMatrix,
  });

  const founderOutcome = simulateFounderOutcome(ideaToAppResults, workspace, realityGaps);
  const customerOutcome = simulateCustomerOutcome(workspace);

  const issues = [...v3.issues, ...gapsToIssues(realityGaps)];
  const recommendedFixOrder = buildRecommendedFixOrder(issues);
  const copyPasteFixPrompts = issues
    .filter((i) => i.copyPasteFixPrompt)
    .slice(0, 10)
    .map((i) => i.copyPasteFixPrompt!);

  const topProductRisks = realityGaps.slice(0, 6).map((g) => `${g.gapType}: ${g.detail}`);
  const topLaunchRisks = [
    v3.v2.architectureLeakageSummary !== 'NONE' && v3.v2.architectureLeakageSummary !== 'LOW'
      ? `Architecture leakage ${v3.v2.architectureLeakageSummary} undermines delivery trust`
      : null,
    !workspace.autonomousBuilder.executionConnected ? 'Autonomous execution not connected' : null,
    workspace.livePreview.reality?.validationReady !== true ? 'Live preview not validation-ready' : null,
    v3.verdict === 'NOT_READY_FOR_USERS' ? 'V3 human readiness: NOT_READY_FOR_USERS' : null,
    launchReadinessReality.executionReadiness < 50 ? 'Execution readiness below 50' : null,
  ].filter(Boolean) as string[];

  const verdict = deriveV4Verdict({
    v3,
    launch: launchReadinessReality,
    gaps: realityGaps,
    creationJourneyScore,
    ideaToAppScore,
  });

  const reportCore = {
    reportId: randomUUID(),
    generatedAt: Date.now(),
    durationMs: Date.now() - start,
    readOnly: true as const,
    mode: 'founder-testing-v4' as const,
    v3,
    creationJourneyScore,
    creationJourney,
    ideaToAppScore,
    ideaToAppResults,
    autonomousBuilderReality,
    projectMemoryReality,
    previewReality,
    runningAppVisibility,
    verificationReality,
    promiseMatrix,
    realityGaps,
    founderOutcome,
    customerOutcome,
    launchReadinessReality,
    topProductRisks,
    topLaunchRisks,
    verdict,
    issues,
    recommendedFixOrder,
    copyPasteFixPrompts,
    reportMarkdown: '',
    verificationResultsVisibility: {} as import('../verification-results-visibility/verification-results-visibility-types.js').VerificationResultsVisibilityAssessment,
    verificationResultsVisibilityScore: {} as import('./founder-testing-v4-types.js').VerificationResultsVisibility,
    changeIntelligenceVisibility: {} as import('../change-intelligence-visibility/change-intelligence-visibility-types.js').ChangeIntelligenceVisibilityAssessment,
    changeIntelligenceVisibilityScore: {} as import('./founder-testing-v4-types.js').ChangeIntelligenceVisibility,
    founderActionCenter: {} as import('../founder-action-center/founder-action-center-types.js').FounderActionCenterAssessment,
    founderActionCenterVisibilityScore: {} as import('./founder-testing-v4-types.js').FounderActionCenterVisibility,
  };

  const verificationResultsVisibility = buildVerificationResultsFromV4Report(reportCore);
  const verificationResultsVisibilityScore = evaluateVerificationResultsVisibility(
    verificationResultsVisibility,
    sources,
  );
  const changeIntelligenceVisibility = assessChangeIntelligenceVisibility(getChangeIntelligenceHistory());
  const changeIntelligenceVisibilityScore = evaluateChangeIntelligenceVisibility(
    changeIntelligenceVisibility,
    sources,
  );

  const founderActionCenter = assessFounderActionCenter({
    projectMemory: workspace.projectMemory,
    livePreview: workspace.livePreview,
    runningApplication: workspace.runningApplication,
    verificationResults: verificationResultsVisibility,
    changeIntelligence: changeIntelligenceVisibility,
    verification: workspace.verification,
  });
  const founderActionCenterVisibilityScore = evaluateFounderActionCenterVisibility(
    founderActionCenter,
    sources,
  );

  return assembleFounderTestV4Report({
    ...reportCore,
    verificationResultsVisibility,
    verificationResultsVisibilityScore,
    changeIntelligenceVisibility,
    changeIntelligenceVisibilityScore,
    founderActionCenter,
    founderActionCenterVisibilityScore,
  });
}
