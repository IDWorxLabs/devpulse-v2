/**
 * Founder Test Automation Authority — read-only sweep interpretation orchestrator (V1).
 */

import {
  analyzeExecutionReadiness,
  detectRequiredInformationRequests,
} from './execution-readiness-analyzer.js';
import { buildImprovementPath } from './improvement-path-builder.js';
import { prioritizeLaunchBlockers } from './launch-blocker-prioritizer.js';
import {
  generateImprovementRecommendations,
  resetRecommendationGeneratorCounterForTests,
} from './recommendation-generator.js';
import {
  getFounderTestAutomationAnalyses,
  getFounderTestAutomationHistory,
  recordFounderTestAutomationAnalysis,
} from './founder-test-automation-history.js';
import {
  buildFounderTestAutomationReport,
  buildFounderTestAutomationReportMarkdown,
} from './founder-test-automation-report-builder.js';
import type {
  FounderTestAutomationAnalysis,
  FounderTestAutomationAssessment,
  FounderTestAutomationReport,
  RunFounderTestAutomationInput,
} from './founder-test-automation-types.js';

let analysisCounter = 0;

export function resetFounderTestAutomationCounterForTests(): void {
  analysisCounter = 0;
}

export function resetFounderTestAutomationModuleForTests(): void {
  resetFounderTestAutomationCounterForTests();
  resetRecommendationGeneratorCounterForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `founder-test-automation-${analysisCounter}`;
}

export function runFounderTestAutomation(
  input: RunFounderTestAutomationInput,
): FounderTestAutomationAnalysis | null {
  const sweepReport = input.founderTestRealitySweepReport;
  if (!sweepReport) return null;

  const prioritizedBlockers = prioritizeLaunchBlockers({
    sweepReport,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
  });

  const recommendations = generateImprovementRecommendations({
    sweepReport,
    prioritizedBlockers,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
    visualReferenceAnalysis: input.visualReferenceAnalysis ?? null,
    voiceNotesAnalysis: input.voiceNotesAnalysis ?? null,
  });

  const improvementPath = buildImprovementPath({
    sweepReport,
    prioritizedBlockers,
    recommendations,
  });

  const executionReadiness = analyzeExecutionReadiness({
    sweepReport,
    prioritizedBlockers,
    launchCouncilAssessment: input.launchCouncilAssessment ?? null,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
    upstreamChainConfidence: input.upstreamChainConfidence ?? null,
  });

  const requiredInformationRequests = detectRequiredInformationRequests({
    sweepReport,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis ?? null,
    voiceNotesAnalysis: input.voiceNotesAnalysis ?? null,
    visualReferenceAnalysis: input.visualReferenceAnalysis ?? null,
  });

  const analysis: FounderTestAutomationAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    sweepId: sweepReport.sweepId,
    founderLaunchVerdict: sweepReport.founderLaunchVerdict,
    prioritizedBlockers,
    recommendations,
    improvementPath,
    executionReadiness,
    requiredInformationRequests,
  };

  if (!input.skipHistoryRecording) {
    recordFounderTestAutomationAnalysis(analysis);
  }

  return analysis;
}

export function assessFounderTestAutomation(
  input: RunFounderTestAutomationInput = {},
): FounderTestAutomationAssessment {
  const analysis = runFounderTestAutomation(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'FOUNDER_TEST_AUTOMATION_COMPLETE' : 'FOUNDER_TEST_AUTOMATION_FAILED',
    analysis,
    failureReason: analysis ? null : 'MISSING_FOUNDER_TEST_REALITY_SWEEP_REPORT',
  };
}

export function buildFounderTestAutomationArtifacts(input: {
  analyses?: readonly FounderTestAutomationAnalysis[];
} = {}): {
  report: FounderTestAutomationReport;
  markdown: string;
} {
  const history = getFounderTestAutomationHistory();
  const storedAnalyses = input.analyses ?? getFounderTestAutomationAnalyses();
  const report = buildFounderTestAutomationReport({
    analyses: storedAnalyses,
    history,
  });

  const latestAnalyses =
    storedAnalyses.length > 0
      ? storedAnalyses
      : report.latestAnalysis
        ? [report.latestAnalysis]
        : [];

  return {
    report,
    markdown: buildFounderTestAutomationReportMarkdown(report, latestAnalyses),
  };
}
