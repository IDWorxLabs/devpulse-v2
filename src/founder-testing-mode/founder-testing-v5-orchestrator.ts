/**
 * Founder Testing Mode V5 — unified founder validation orchestrator.
 *
 * Architecture rule: all founder-facing validation flows through this entry point.
 */

import { randomUUID } from 'node:crypto';
import { runFounderTestingModeV4 } from './founder-testing-v4-orchestrator.js';
import { FOUNDER_TEST_V5_MAX_TOTAL_MS } from './founder-testing-v5-bounds.js';
import { buildFounderTestV5PhaseFeed } from './founder-testing-v5-phases.js';
import { assembleFounderTestV5Report } from './founder-testing-v5-report-builder.js';
import { applyLaunchVerdictGovernanceSourceNormalizationSync } from '../launch-verdict-governance-source-normalization/index.js';
import type { FounderTestV5Report, RunFounderTestingModeV5Input } from './founder-testing-v5-types.js';
import { buildUnifiedFounderSummary } from './founder-testing-v5-unified-summary.js';

export function runFounderTestingModeV5(input: RunFounderTestingModeV5Input = {}): FounderTestV5Report {
  const start = Date.now();

  const v4 = runFounderTestingModeV4({
    rootDir: input.rootDir,
    validatorScripts: input.validatorScripts,
    liveResults: input.liveResults,
    liveSection: input.liveSection,
    repositoryTypecheckReality: input.repositoryTypecheckReality,
    skipRepositoryTypecheckBaseline: input.skipRepositoryTypecheckBaseline,
  });

  const unifiedSummary = buildUnifiedFounderSummary(v4);
  const phaseFeedEvents = buildFounderTestV5PhaseFeed();

  return assembleFounderTestV5Report(
    applyLaunchVerdictGovernanceSourceNormalizationSync({
      partial: {
        reportId: randomUUID(),
        generatedAt: Date.now(),
        durationMs: Math.min(Date.now() - start, FOUNDER_TEST_V5_MAX_TOTAL_MS),
        readOnly: true,
        mode: 'founder-testing-v5',
        overallFounderScore: unifiedSummary.overallFounderScore,
        launchRecommendation: unifiedSummary.launchRecommendation,
        unifiedSummary,
        phaseFeedEvents,
        v4,
        verificationResults: v4.verificationResultsVisibility,
        changeIntelligence: v4.changeIntelligenceVisibility,
        founderActionCenter: v4.founderActionCenter,
        founderSensemaking: v4.founderSensemaking,
        founderInteractionSimulation: v4.founderInteractionSimulation,
        firstTimeUserReality: v4.firstTimeUserReality,
        verificationTrustEvidence: v4.verificationTrustEvidence,
        founderFrictionHeatmap: v4.founderFrictionHeatmap,
        customerJourneySimulation: v4.customerJourneySimulation,
        promiseRealityEngine: v4.promiseRealityEngine,
        visualQualityAuthority: v4.visualQualityAuthority,
        launchDaySimulation: v4.launchDaySimulation,
        adoptionPrediction: v4.adoptionPrediction,
        productEconomics: v4.productEconomics,
        productEvolution: v4.productEvolution,
        competitiveReality: v4.competitiveReality,
        founderDecisionReadiness: v4.founderDecisionReadiness,
        digitalFounderBoard: v4.digitalFounderBoard,
        verdict: v4.verdict,
      },
      sourcePath: 'founder-testing-v5-orchestrator.runFounderTestingModeV5',
      upstreamProducer: 'V4_REPORT_ASSEMBLY',
    }).partial,
  );
}
