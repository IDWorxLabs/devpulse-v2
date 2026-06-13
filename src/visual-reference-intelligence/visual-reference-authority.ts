/**
 * Visual Reference Authority — read-only visual intelligence orchestrator (V1).
 */

import { getStoredUpload, getStoredUploadContent } from '../upload-system/index.js';
import { detectUiComponents } from './component-detector.js';
import { extractScreenFlows, detectScreenContext } from './screen-flow-extractor.js';
import { extractUiLayout } from './ui-layout-extractor.js';
import { recordVisualReferenceAnalysis, getVisualReferenceAnalyses, getVisualReferenceHistory } from './visual-reference-history.js';
import {
  buildVisualReferenceIntelligenceReport,
  buildVisualReferenceIntelligenceReportMarkdown,
} from './visual-reference-report-builder.js';
import {
  extractImageMetadata,
  normalizeConfidence,
  resolveSupportedFormat,
  sampleLuminanceGrid,
} from './visual-reference-analyzer.js';
import type {
  AnalyzeVisualReferenceInput,
  ComponentDetectionEvidence,
  FlowInferenceEvidence,
  VisualCompletenessReview,
  VisualReferenceAnalysis,
  VisualReferenceIntelligenceAssessment,
  VisualReferenceIntelligenceReport,
} from './visual-reference-types.js';

let analysisCounter = 0;

export function resetVisualReferenceCounterForTests(): void {
  analysisCounter = 0;
}

export function resetVisualReferenceIntelligenceModuleForTests(): void {
  resetVisualReferenceCounterForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `visual-ref-${analysisCounter}`;
}

function buildCompletenessReview(input: {
  screenCountEstimate: number;
  layoutRegionCount: number;
  components: readonly ComponentDetectionEvidence[];
  flows: readonly FlowInferenceEvidence[];
  hasNavigation: boolean;
  platform: string;
}): VisualCompletenessReview {
  const missingScreens: string[] = [];
  const incompleteFlows: string[] = [];
  const navigationGaps: string[] = [];
  const uxRisks: string[] = [];
  const tokens = new Set(input.components.map((c) => c.token));

  if (input.flows.some((f) => f.flow === 'AUTHENTICATION') && !tokens.has('FORM_DETECTED')) {
    incompleteFlows.push('AUTHENTICATION_FLOW_WITHOUT_FORM_EVIDENCE');
  }
  if (input.flows.some((f) => f.flow === 'CHECKOUT') && !tokens.has('BUTTON_GROUP_DETECTED')) {
    incompleteFlows.push('CHECKOUT_FLOW_WITHOUT_ACTION_BUTTONS');
  }
  if (input.flows.some((f) => f.flow === 'DASHBOARD') && !tokens.has('CARD_DETECTED') && !tokens.has('LIST_DETECTED')) {
    incompleteFlows.push('DASHBOARD_FLOW_WITHOUT_CONTENT_BLOCKS');
  }
  if (input.screenCountEstimate > 1 && input.layoutRegionCount < 3) {
    missingScreens.push('MULTI_SCREEN_ESTIMATE_WITH_SPARSE_LAYOUT');
  }
  if (!input.hasNavigation && input.flows.length >= 2) {
    navigationGaps.push('MULTIPLE_FLOWS_WITHOUT_NAVIGATION_EVIDENCE');
  }
  if (input.platform === 'MOBILE' && !tokens.has('BOTTOM_NAVIGATION_DETECTED') && !tokens.has('NAVIGATION_DETECTED')) {
    navigationGaps.push('MOBILE_SCREEN_WITHOUT_NAVIGATION');
  }
  if (!tokens.has('HEADER_DETECTED') && input.platform !== 'MOBILE') {
    uxRisks.push('WEB_DESKTOP_LAYOUT_WITHOUT_HEADER');
  }
  if (tokens.has('MODAL_DETECTED') && !tokens.has('BUTTON_DETECTED')) {
    uxRisks.push('MODAL_WITHOUT_CLEAR_ACTION_CONTROLS');
  }

  let score = 55;
  score += Math.min(20, input.layoutRegionCount * 4);
  score += Math.min(15, input.components.length * 3);
  score += Math.min(10, input.flows.length * 4);
  if (input.hasNavigation) score += 8;
  score -= incompleteFlows.length * 8;
  score -= navigationGaps.length * 6;
  score -= missingScreens.length * 7;
  score -= uxRisks.length * 5;

  return {
    readOnly: true,
    visualCompletenessScore: normalizeConfidence(score),
    missingScreens,
    incompleteFlows,
    navigationGaps,
    uxRisks,
  };
}

function computeConfidenceScore(
  layoutRegions: readonly { confidence: number }[],
  components: readonly ComponentDetectionEvidence[],
  flows: readonly FlowInferenceEvidence[],
): number {
  const values = [
    ...layoutRegions.map((r) => r.confidence),
    ...components.map((c) => c.confidence),
    ...flows.map((f) => f.confidence),
  ];
  if (values.length === 0) return 35;
  return normalizeConfidence(values.reduce((a, b) => a + b, 0) / values.length);
}

function buildRecommendations(
  completeness: VisualCompletenessReview,
  screen: { platform: string; classification: string },
): string[] {
  const recommendations: string[] = [];

  if (completeness.navigationGaps.length > 0) {
    recommendations.push('Add consistent navigation evidence across related screens.');
  }
  if (completeness.missingScreens.length > 0) {
    recommendations.push('Upload additional screens to validate multi-step flows.');
  }
  if (completeness.incompleteFlows.length > 0) {
    recommendations.push('Provide supporting UI elements for inferred product flows.');
  }
  if (completeness.uxRisks.length > 0) {
    recommendations.push('Review UX risks flagged in completeness analysis.');
  }
  if (screen.classification === 'UNKNOWN') {
    recommendations.push('Capture clearer full-screen references to improve classification.');
  }
  if (screen.platform === 'UNKNOWN') {
    recommendations.push('Use standard mobile or desktop viewport screenshots when possible.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Visual reference coverage appears coherent for detected flows.');
  }

  return recommendations;
}

export function analyzeVisualReference(input: AnalyzeVisualReferenceInput): VisualReferenceAnalysis | null {
  let content: Buffer | null = null;
  let filename = input.filename ?? 'unknown.png';
  let mimeType = input.mimeType ?? 'image/png';
  let uploadId: string | null = input.uploadId ?? null;

  if (input.content != null) {
    content = input.content instanceof Buffer ? input.content : Buffer.from(input.content);
  } else if (uploadId) {
    const record = getStoredUpload(uploadId);
    if (!record || record.verdict !== 'UPLOAD_ACCEPTED' || record.fileCategory !== 'IMAGE') {
      return null;
    }
    content = getStoredUploadContent(uploadId);
    filename = record.filename;
    mimeType = record.mimeType;
  }

  if (!content || content.length === 0) return null;

  const format = resolveSupportedFormat(filename, mimeType);
  if (!format) return null;

  const metadata = extractImageMetadata(content, filename, mimeType);
  if (metadata.width === 0 || metadata.height === 0) return null;

  const sample = format === 'PNG' ? sampleLuminanceGrid(content) : null;
  const layoutRegions = extractUiLayout(metadata, sample);
  const detectedComponents = detectUiComponents(layoutRegions, sample);
  const screenDetection = detectScreenContext(metadata, layoutRegions, detectedComponents);
  const inferredFlows = extractScreenFlows(screenDetection, layoutRegions, detectedComponents);

  const hasNavigation = detectedComponents.some(
    (c) =>
      c.token === 'NAVIGATION_DETECTED' ||
      c.token === 'BOTTOM_NAVIGATION_DETECTED' ||
      c.token === 'SIDEBAR_DETECTED',
  );

  const completeness = buildCompletenessReview({
    screenCountEstimate: screenDetection.screenCountEstimate,
    layoutRegionCount: layoutRegions.length,
    components: detectedComponents,
    flows: inferredFlows,
    hasNavigation,
    platform: screenDetection.platform,
  });

  const confidenceScore = computeConfidenceScore(layoutRegions, detectedComponents, inferredFlows);
  const recommendations = buildRecommendations(completeness, screenDetection);

  const analysis: VisualReferenceAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    uploadId,
    filename,
    analyzedAt: new Date().toISOString(),
    imageMetadata: metadata,
    screenDetection,
    layoutRegions,
    detectedComponents,
    inferredFlows,
    completeness,
    confidenceScore,
    recommendations,
  };

  if (!input.skipHistoryRecording) {
    recordVisualReferenceAnalysis(analysis);
  }

  return analysis;
}

export function assessVisualReferenceIntelligence(
  input: AnalyzeVisualReferenceInput = {},
): VisualReferenceIntelligenceAssessment {
  const analysis = analyzeVisualReference(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'VISUAL_REFERENCE_INTELLIGENCE_COMPLETE' : 'VISUAL_REFERENCE_INTELLIGENCE_FAILED',
    analysis,
    failureReason: analysis ? null : 'UNSUPPORTED_OR_MISSING_VISUAL_REFERENCE',
  };
}

export function buildVisualReferenceIntelligenceArtifacts(input: {
  analyses?: readonly VisualReferenceAnalysis[];
} = {}): {
  report: VisualReferenceIntelligenceReport;
  markdown: string;
} {
  const history = getVisualReferenceHistory();
  const storedAnalyses = input.analyses ?? getVisualReferenceAnalyses();
  const report = buildVisualReferenceIntelligenceReport({
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
    markdown: buildVisualReferenceIntelligenceReportMarkdown(report, latestAnalyses),
  };
}
