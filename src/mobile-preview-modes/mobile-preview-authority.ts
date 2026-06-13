/**
 * Mobile Preview Authority — read-only device preview orchestrator (V1).
 */

import { DEVICE_PROFILES } from './device-profile-library.js';
import {
  analyzeDeviceCompatibility,
  computePreviewReadiness,
  generateDeviceRecommendations,
} from './device-compatibility-analyzer.js';
import { analyzeMobileNavigation } from './mobile-navigation-analyzer.js';
import {
  getMobilePreviewAnalyses,
  getMobilePreviewHistory,
  recordMobilePreviewAnalysis,
} from './mobile-preview-history.js';
import { analyzePreviewLayouts } from './preview-layout-analyzer.js';
import {
  buildMobilePreviewModesReport,
  buildMobilePreviewModesReportMarkdown,
} from './mobile-preview-report-builder.js';
import { consolidatePreviewEvidence } from './preview-evidence-consolidator.js';
import { detectResponsiveRisks } from './responsive-risk-detector.js';
import type {
  AnalyzeMobilePreviewInput,
  MobilePreviewAnalysis,
  MobilePreviewAssessment,
  MobilePreviewModesReport,
} from './mobile-preview-types.js';

let analysisCounter = 0;

export function resetMobilePreviewCounterForTests(): void {
  analysisCounter = 0;
}

export function resetMobilePreviewModesModuleForTests(): void {
  resetMobilePreviewCounterForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `mobile-preview-${analysisCounter}`;
}

export function analyzeMobilePreviewModes(input: AnalyzeMobilePreviewInput): MobilePreviewAnalysis | null {
  const evidence = consolidatePreviewEvidence(input);
  if (!evidence) return null;

  const profiles = [...DEVICE_PROFILES];
  const previewLayoutBehaviors = analyzePreviewLayouts(profiles, evidence);
  const responsiveRiskAnalysis = detectResponsiveRisks({
    evidence,
    profiles,
    layoutBehaviors: previewLayoutBehaviors,
  });
  const navigationReview = analyzeMobileNavigation(evidence);
  const deviceCompatibility = analyzeDeviceCompatibility({
    evidence,
    layoutBehaviors: previewLayoutBehaviors,
    responsiveRiskAnalysis,
  });
  const readiness = computePreviewReadiness({
    deviceCompatibility,
    navigationReview,
    responsiveRiskAnalysis,
    evidence,
  });
  const deviceRecommendations = generateDeviceRecommendations({
    evidence,
    responsiveRiskAnalysis,
    navigationReview,
    deviceCompatibility,
  });

  const analysis: MobilePreviewAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    sourceViewportWidth: evidence.sourceWidth,
    sourceViewportHeight: evidence.sourceHeight,
    deviceProfilesAnalyzed: profiles.map((p) => p.profileId),
    previewLayoutBehaviors,
    responsiveRiskAnalysis,
    deviceCompatibility,
    navigationReview,
    previewReadinessScore: readiness.previewReadinessScore,
    previewReadinessCategory: readiness.previewReadinessCategory,
    mobilePreviewReadiness: readiness.mobilePreviewReadiness,
    deviceRecommendations,
    confidenceScore: readiness.confidenceScore,
  };

  if (!input.skipHistoryRecording) {
    recordMobilePreviewAnalysis(analysis);
  }

  return analysis;
}

export function assessMobilePreviewModes(input: AnalyzeMobilePreviewInput = {}): MobilePreviewAssessment {
  const analysis = analyzeMobilePreviewModes(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'MOBILE_PREVIEW_MODES_COMPLETE' : 'MOBILE_PREVIEW_MODES_FAILED',
    analysis,
    failureReason: analysis ? null : 'INSUFFICIENT_PREVIEW_EVIDENCE',
  };
}

export function buildMobilePreviewModesArtifacts(input: {
  analyses?: readonly MobilePreviewAnalysis[];
} = {}): {
  report: MobilePreviewModesReport;
  markdown: string;
} {
  const history = getMobilePreviewHistory();
  const storedAnalyses = input.analyses ?? getMobilePreviewAnalyses();
  const report = buildMobilePreviewModesReport({
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
    markdown: buildMobilePreviewModesReportMarkdown(report, latestAnalyses),
  };
}
