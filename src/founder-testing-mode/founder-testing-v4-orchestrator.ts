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
  evaluateFounderSensemakingVisibility,
  evaluateFounderInteractionSimulationVisibility,
  evaluateFirstTimeUserRealityVisibility,
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
import {
  assessFounderInteractionSimulation,
  enrichAssessmentsWithInteractionSimulation,
} from '../founder-interaction-simulation/index.js';
import {
  assessFirstTimeUserReality,
  enrichAssessmentsWithFirstTimeUserReality,
} from '../first-time-user-reality/index.js';
import {
  assessVerificationTrustEvidence,
  evaluateVerificationTrustEvidenceVisibility,
} from '../verification-trust-evidence/index.js';
import {
  assessFounderFrictionHeatmap,
  evaluateFounderFrictionHeatmapVisibility,
} from '../founder-friction-heatmap/index.js';
import {
  assessCustomerJourneySimulation,
  enrichAssessmentsWithCustomerJourney,
  evaluateCustomerJourneySimulationVisibility,
} from '../customer-journey-simulation/index.js';
import {
  assessPromiseRealityEngine,
  enrichAssessmentsWithPromiseReality,
  evaluatePromiseRealityVisibility,
} from '../promise-reality-engine/index.js';
import {
  assessVisualQualityAuthority,
  enrichAssessmentsWithVisualQuality,
  evaluateVisualQualityVisibility,
} from '../visual-quality-authority/index.js';
import {
  assessLaunchDaySimulation,
  enrichAssessmentsWithLaunchDaySimulation,
  evaluateLaunchDaySimulationVisibility,
} from '../launch-day-simulation-engine/index.js';
import {
  assessAdoptionPrediction,
  enrichAssessmentsWithAdoptionPrediction,
  evaluateAdoptionPredictionVisibility,
} from '../adoption-prediction-engine/index.js';
import {
  assessProductEconomics,
  enrichAssessmentsWithProductEconomics,
  evaluateProductEconomicsVisibility,
} from '../product-economics-engine/index.js';
import {
  assessProductEvolution,
  enrichAssessmentsWithProductEvolution,
  evaluateProductEvolutionVisibility,
} from '../product-evolution-engine/index.js';
import {
  assessCompetitiveReality,
  enrichAssessmentsWithCompetitiveReality,
  evaluateCompetitiveRealityVisibility,
} from '../competitive-reality-engine/index.js';
import {
  assessFounderDecisionReadiness,
  enrichAssessmentsWithFounderDecisionReadiness,
  evaluateFounderDecisionReadinessVisibility,
} from '../founder-decision-readiness/index.js';
import {
  assembleDigitalFounderBoard,
  enrichSensemakingWithDigitalFounderBoard,
  evaluateDigitalFounderBoardVisibility,
} from '../digital-founder-board/index.js';
import { assessFounderSensemaking } from '../founder-sensemaking-engine/index.js';
import {
  assessChatIntelligenceReality,
  evaluateChatIntelligenceVisibility,
} from '../chat-intelligence-reality/index.js';
import {
  assessRepositoryTypecheckReality,
  evaluateRepositoryTypecheckVisibility,
  runRepositoryTypecheckBaseline,
} from '../repository-typecheck-reality/index.js';
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

  const chatIntelligenceReality = assessChatIntelligenceReality({
    deadlineMs: Math.min(remaining(), 18000),
    rootDir,
  });
  const chatIntelligenceRealityScore = evaluateChatIntelligenceVisibility(chatIntelligenceReality);

  const repositoryTypecheckReality =
    input.repositoryTypecheckReality ??
    (input.skipRepositoryTypecheckBaseline
      ? assessRepositoryTypecheckReality({ source: 'NOT_RUN' })
      : runRepositoryTypecheckBaseline({ projectRootDir: rootDir }).assessment);
  const repositoryTypecheckRealityScore = evaluateRepositoryTypecheckVisibility(repositoryTypecheckReality);

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
    chatIntelligence: chatIntelligenceReality,
    repositoryTypecheck: repositoryTypecheckReality,
  });

  const founderOutcome = simulateFounderOutcome(ideaToAppResults, workspace, realityGaps);
  const customerOutcome = simulateCustomerOutcome(workspace);

  const issues = [
    ...v3.issues,
    ...gapsToIssues(realityGaps),
    ...chatIntelligenceReality.failedScenarios.map((s) => ({
      severity: 'HIGH' as const,
      screen: 'Chat Intelligence',
      problem: `Chat scenario failed: "${s.prompt}"`,
      userImpact: s.whyFailed.join('; ') || 'Chat response not useful or grounded',
      likelyCause: s.failureCategories.join(', ') || 'CHAT_INTELLIGENCE_GAP',
      recommendedFix: chatIntelligenceReality.requiredFixesBeforeLaunch[0] ?? 'Improve chat intelligence and operational self-awareness',
      copyPasteFixPrompt: `Fix AiDevEngine chat intelligence for "${s.prompt}": ${s.whyFailed.join('; ')}`,
    })),
    ...(repositoryTypecheckReality.blocksLaunchReadiness
      ? [{
          severity: 'BLOCKER' as const,
          screen: 'Repository Typecheck',
          problem: `Repository typecheck ${repositoryTypecheckReality.readinessState}`,
          userImpact: `${repositoryTypecheckReality.errorCount} compile error(s); launch readiness cannot be trusted`,
          likelyCause: 'TYPECHECK_INTEGRITY_GAP',
          recommendedFix: repositoryTypecheckReality.recommendations[0] ?? 'Fix repository TypeScript errors',
          copyPasteFixPrompt: `Fix repository typecheck failures before launch: ${repositoryTypecheckReality.recommendations[0] ?? 'run npx tsc --noEmit'}`,
        }]
      : []),
  ];
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
    chatIntelligenceReality.blocksLaunchReadiness
      ? `Chat intelligence blocks launch (${chatIntelligenceReality.chatLaunchVerdict}, score ${chatIntelligenceReality.chatIntelligenceScore}/100)`
      : null,
    repositoryTypecheckReality.blocksLaunchReadiness
      ? `Repository typecheck blocks launch (${repositoryTypecheckReality.readinessState}, ${repositoryTypecheckReality.errorCount} error(s))`
      : null,
  ].filter(Boolean) as string[];

  const verdict = deriveV4Verdict({
    v3,
    launch: launchReadinessReality,
    gaps: realityGaps,
    creationJourneyScore,
    ideaToAppScore,
    chatIntelligence: chatIntelligenceReality,
    repositoryTypecheck: repositoryTypecheckReality,
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
    chatIntelligenceReality,
    chatIntelligenceRealityScore,
    repositoryTypecheckReality,
    repositoryTypecheckRealityScore,
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
    founderSensemaking: {} as import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
    founderSensemakingVisibilityScore: {} as import('./founder-testing-v4-types.js').FounderSensemakingVisibility,
    founderInteractionSimulation: {} as import('../founder-interaction-simulation/founder-interaction-simulation-types.js').FounderInteractionSimulationAssessment,
    founderInteractionSimulationScore: {} as import('./founder-testing-v4-types.js').FounderInteractionSimulationVisibility,
    firstTimeUserReality: {} as import('../first-time-user-reality/first-time-user-reality-types.js').FirstTimeUserRealityAssessment,
    firstTimeUserRealityScore: {} as import('./founder-testing-v4-types.js').FirstTimeUserRealityVisibility,
    verificationTrustEvidence: {} as import('../verification-trust-evidence/verification-trust-evidence-types.js').VerificationTrustEvidenceAssessment,
    verificationTrustEvidenceScore: {} as import('../verification-trust-evidence/verification-trust-evidence-types.js').VerificationTrustEvidenceVisibility,
    founderFrictionHeatmap: {} as import('../founder-friction-heatmap/founder-friction-heatmap-types.js').FounderFrictionHeatmapAssessment,
    founderFrictionHeatmapScore: {} as import('../founder-friction-heatmap/founder-friction-heatmap-types.js').FounderFrictionHeatmapVisibility,
    customerJourneySimulation: {} as import('../customer-journey-simulation/customer-journey-simulation-types.js').CustomerJourneySimulationAssessment,
    customerJourneySimulationScore: {} as import('../customer-journey-simulation/customer-journey-simulation-types.js').CustomerJourneySimulationVisibility,
    promiseRealityEngine: {} as import('../promise-reality-engine/promise-reality-engine-types.js').PromiseRealityEngineAssessment,
    promiseRealityEngineScore: {} as import('../promise-reality-engine/promise-reality-engine-types.js').PromiseRealityVisibility,
    visualQualityAuthority: {} as import('../visual-quality-authority/visual-quality-authority-types.js').VisualQualityAuthorityAssessment,
    visualQualityAuthorityScore: {} as import('../visual-quality-authority/visual-quality-authority-types.js').VisualQualityVisibility,
    launchDaySimulation: {} as import('../launch-day-simulation-engine/launch-day-simulation-engine-types.js').LaunchDaySimulationAssessment,
    launchDaySimulationScore: {} as import('../launch-day-simulation-engine/launch-day-simulation-engine-types.js').LaunchDaySimulationVisibility,
    adoptionPrediction: {} as import('../adoption-prediction-engine/adoption-prediction-engine-types.js').AdoptionPredictionAssessment,
    adoptionPredictionScore: {} as import('../adoption-prediction-engine/adoption-prediction-engine-types.js').AdoptionPredictionVisibility,
    productEconomics: {} as import('../product-economics-engine/product-economics-engine-types.js').ProductEconomicsAssessment,
    productEconomicsScore: {} as import('../product-economics-engine/product-economics-engine-types.js').ProductEconomicsVisibility,
    productEvolution: {} as import('../product-evolution-engine/product-evolution-engine-types.js').ProductEvolutionAssessment,
    productEvolutionScore: {} as import('../product-evolution-engine/product-evolution-engine-types.js').ProductEvolutionVisibility,
    competitiveReality: {} as import('../competitive-reality-engine/competitive-reality-engine-types.js').CompetitiveRealityAssessment,
    competitiveRealityScore: {} as import('../competitive-reality-engine/competitive-reality-engine-types.js').CompetitiveRealityVisibility,
    founderDecisionReadiness: {} as import('../founder-decision-readiness/founder-decision-readiness-types.js').FounderDecisionReadinessAssessment,
    founderDecisionReadinessScore: {} as import('../founder-decision-readiness/founder-decision-readiness-types.js').FounderDecisionReadinessVisibility,
    digitalFounderBoard: {} as import('../digital-founder-board/digital-founder-board-types.js').DigitalFounderBoardAssessment,
    digitalFounderBoardScore: {} as import('../digital-founder-board/digital-founder-board-types.js').DigitalFounderBoardVisibility,
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

  const founderActionCenterBase = assessFounderActionCenter({
    projectMemory: workspace.projectMemory,
    livePreview: workspace.livePreview,
    runningApplication: workspace.runningApplication,
    verificationResults: verificationResultsVisibility,
    changeIntelligence: changeIntelligenceVisibility,
    verification: workspace.verification,
  });

  const founderSensemakingBase = assessFounderSensemaking(
    {
      projectMemory: workspace.projectMemory,
      livePreview: workspace.livePreview,
      runningApplication: workspace.runningApplication,
      verificationResults: verificationResultsVisibility,
      changeIntelligence: changeIntelligenceVisibility,
      founderActionCenter: founderActionCenterBase,
      verification: workspace.verification,
      autonomousBuilder: workspace.autonomousBuilder,
      portfolioInsights: workspace.portfolioInsights,
      shellSources: sources,
    },
    {
      launchReadinessReality: reportCore.launchReadinessReality,
      verdict: reportCore.verdict,
      humanReadiness: reportCore.launchReadinessReality.humanReadiness,
      previewRealityScore: reportCore.previewReality.score,
    },
  );

  const founderInteractionSimulation = assessFounderInteractionSimulation({
    shellSources: sources,
    liveResults: input.liveResults,
  });

  let firstTimeUserReality = assessFirstTimeUserReality({
    shellSources: sources,
  });

  const enrichedInteraction = enrichAssessmentsWithInteractionSimulation(
    founderActionCenterBase,
    founderSensemakingBase,
    founderInteractionSimulation,
  );

  const enriched = enrichAssessmentsWithFirstTimeUserReality(
    enrichedInteraction.founderActionCenter,
    enrichedInteraction.founderSensemaking,
    firstTimeUserReality,
  );

  let founderActionCenter = enriched.founderActionCenter;
  let founderSensemaking = enriched.founderSensemaking;
  const founderActionCenterVisibilityScore = evaluateFounderActionCenterVisibility(
    founderActionCenter,
    sources,
  );
  const founderSensemakingVisibilityScore = evaluateFounderSensemakingVisibility(
    founderSensemaking,
    sources,
  );
  const founderInteractionSimulationScore = evaluateFounderInteractionSimulationVisibility(
    founderInteractionSimulation,
    sources,
  );
  const firstTimeUserRealityScore = evaluateFirstTimeUserRealityVisibility(
    firstTimeUserReality,
    sources,
  );

  const verificationTrustEvidence = assessVerificationTrustEvidence({
    verificationResults: verificationResultsVisibility,
    shellSources: sources,
    durationMs: reportCore.durationMs,
  });
  const verificationTrustEvidenceScore = evaluateVerificationTrustEvidenceVisibility(
    verificationTrustEvidence,
    sources,
  );

  const founderFrictionHeatmap = assessFounderFrictionHeatmap({
    shellSources: sources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderSensemaking,
    founderActionCenter,
    verificationResults: verificationResultsVisibility,
  });
  const founderFrictionHeatmapScore = evaluateFounderFrictionHeatmapVisibility(
    founderFrictionHeatmap,
    sources,
  );

  const customerJourneySimulation = assessCustomerJourneySimulation({
    shellSources: sources,
    firstTimeUserReality,
    founderInteractionSimulation,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    projectMemoryScore: projectMemoryReality.score,
    previewValidationReady: previewReality.validationReadyPass,
    autonomousBuilderConnected: autonomousBuilderReality.canExecuteBuilds,
  });

  const customerEnriched = enrichAssessmentsWithCustomerJourney(
    founderActionCenter,
    founderSensemaking,
    customerJourneySimulation,
  );
  founderActionCenter = customerEnriched.founderActionCenter;
  founderSensemaking = customerEnriched.founderSensemaking;

  const customerJourneySimulationScore = evaluateCustomerJourneySimulationVisibility(
    customerJourneySimulation,
  );

  const visualQualityAuthority = assessVisualQualityAuthority({
    shellSources: sources,
    firstTimeUserReality,
  });

  const launchDaySimulation = assessLaunchDaySimulation({
    shellSources: sources,
    firstTimeUserReality,
    customerJourneySimulation,
    visualQualityAuthority,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    founderInteractionSimulation,
    founderActionCenter,
    verificationResults: verificationResultsVisibility,
  });

  const adoptionPrediction = assessAdoptionPrediction({
    shellSources: sources,
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    visualQualityAuthority,
    founderFrictionHeatmap,
  });

  const promiseRealityEngine = assessPromiseRealityEngine({
    workspace,
    shellSources: sources,
    ideaToAppResults,
    creationJourney,
    promiseMatrix,
    realityGaps,
    firstTimeUserReality,
    verificationTrustEvidence,
    customerJourneySimulation,
    founderSensemaking,
    founderFrictionHeatmap,
    verificationResults: verificationResultsVisibility,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
  });

  const promiseEnriched = enrichAssessmentsWithPromiseReality(
    founderActionCenter,
    founderSensemaking,
    promiseRealityEngine,
    firstTimeUserReality,
  );
  founderActionCenter = promiseEnriched.founderActionCenter;
  founderSensemaking = promiseEnriched.founderSensemaking;
  if (promiseEnriched.firstTimeUserReality) {
    firstTimeUserReality = promiseEnriched.firstTimeUserReality;
  }

  const promiseRealityEngineScore = evaluatePromiseRealityVisibility(promiseRealityEngine);

  const visualEnriched = enrichAssessmentsWithVisualQuality(
    founderActionCenter,
    founderSensemaking,
    visualQualityAuthority,
  );
  founderActionCenter = visualEnriched.founderActionCenter;
  founderSensemaking = visualEnriched.founderSensemaking;

  const visualQualityAuthorityScore = evaluateVisualQualityVisibility(visualQualityAuthority);

  const launchEnriched = enrichAssessmentsWithLaunchDaySimulation(
    founderActionCenter,
    founderSensemaking,
    launchDaySimulation,
  );
  founderActionCenter = launchEnriched.founderActionCenter;
  founderSensemaking = launchEnriched.founderSensemaking;

  const launchDaySimulationScore = evaluateLaunchDaySimulationVisibility(launchDaySimulation);

  const adoptionEnriched = enrichAssessmentsWithAdoptionPrediction(
    founderActionCenter,
    founderSensemaking,
    adoptionPrediction,
  );
  founderActionCenter = adoptionEnriched.founderActionCenter;
  founderSensemaking = adoptionEnriched.founderSensemaking;

  const adoptionPredictionScore = evaluateAdoptionPredictionVisibility(adoptionPrediction);

  const productEconomics = assessProductEconomics({
    shellSources: sources,
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    adoptionPrediction,
    founderFrictionHeatmap,
    promiseRealityEngine,
    validatorScriptCount: input.validatorScripts?.length ?? 0,
  });

  const economicsEnriched = enrichAssessmentsWithProductEconomics(
    founderActionCenter,
    founderSensemaking,
    productEconomics,
  );
  founderActionCenter = economicsEnriched.founderActionCenter;
  founderSensemaking = economicsEnriched.founderSensemaking;

  const productEconomicsScore = evaluateProductEconomicsVisibility(productEconomics);

  const productEvolution = assessProductEvolution({
    shellSources: sources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
  });

  const evolutionEnriched = enrichAssessmentsWithProductEvolution(
    founderActionCenter,
    founderSensemaking,
    productEvolution,
  );
  founderActionCenter = evolutionEnriched.founderActionCenter;
  founderSensemaking = evolutionEnriched.founderSensemaking;

  const productEvolutionScore = evaluateProductEvolutionVisibility(productEvolution);

  const competitiveReality = assessCompetitiveReality({
    shellSources: sources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
    productEvolution,
    validatorScriptCount: input.validatorScripts?.length ?? 0,
  });

  const competitiveEnriched = enrichAssessmentsWithCompetitiveReality(
    founderActionCenter,
    founderSensemaking,
    competitiveReality,
  );
  founderActionCenter = competitiveEnriched.founderActionCenter;
  founderSensemaking = competitiveEnriched.founderSensemaking;

  const competitiveRealityScore = evaluateCompetitiveRealityVisibility(competitiveReality);

  const founderDecisionReadiness = assessFounderDecisionReadiness({
    shellSources: sources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
    productEvolution,
    competitiveReality,
  });

  const decisionEnriched = enrichAssessmentsWithFounderDecisionReadiness(
    founderActionCenter,
    founderSensemaking,
    founderDecisionReadiness,
  );
  founderActionCenter = decisionEnriched.founderActionCenter;
  founderSensemaking = decisionEnriched.founderSensemaking;

  const founderDecisionReadinessScore = evaluateFounderDecisionReadinessVisibility(founderDecisionReadiness);

  const digitalFounderBoard = assembleDigitalFounderBoard({
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
    productEvolution,
    competitiveReality,
    founderDecisionReadiness,
    founderActionCenter,
  });

  const boardEnriched = enrichSensemakingWithDigitalFounderBoard(founderSensemaking, digitalFounderBoard);
  founderSensemaking = boardEnriched.founderSensemaking;

  const digitalFounderBoardScore = evaluateDigitalFounderBoardVisibility(digitalFounderBoard);

  return assembleFounderTestV4Report({
    ...reportCore,
    verificationResultsVisibility,
    verificationResultsVisibilityScore,
    changeIntelligenceVisibility,
    changeIntelligenceVisibilityScore,
    founderActionCenter,
    founderActionCenterVisibilityScore,
    founderSensemaking,
    founderSensemakingVisibilityScore,
    founderInteractionSimulation,
    founderInteractionSimulationScore,
    firstTimeUserReality,
    firstTimeUserRealityScore,
    verificationTrustEvidence,
    verificationTrustEvidenceScore,
    founderFrictionHeatmap,
    founderFrictionHeatmapScore,
    customerJourneySimulation,
    customerJourneySimulationScore,
    promiseRealityEngine,
    promiseRealityEngineScore,
    visualQualityAuthority,
    visualQualityAuthorityScore,
    launchDaySimulation,
    launchDaySimulationScore,
    adoptionPrediction,
    adoptionPredictionScore,
    productEconomics,
    productEconomicsScore,
    productEvolution,
    productEvolutionScore,
    competitiveReality,
    competitiveRealityScore,
    founderDecisionReadiness,
    founderDecisionReadinessScore,
    digitalFounderBoard,
    digitalFounderBoardScore,
  });
}
