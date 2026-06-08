/**
 * Capability gap founder-readable report.
 */

import type {
  CapabilityGapReport,
  CapabilityGapReportOutput,
  CapabilityGapResult,
  CapabilityAnalysisInput,
  MissingCapabilityDetectorState,
} from './types.js';
import { MISSING_CAPABILITY_DETECTOR_OWNER_MODULE } from './types.js';

export function buildCapabilityGapReportOutput(
  input: CapabilityAnalysisInput,
  result: CapabilityGapResult,
): CapabilityGapReportOutput {
  const highCount = result.detectedGaps.filter((g) => g.gapSeverity === 'HIGH').length;
  const criticalCount = result.detectedGaps.filter((g) => g.gapSeverity === 'CRITICAL').length;
  const topGaps = [...result.detectedGaps]
    .sort((a, b) => {
      const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return order[b.gapSeverity] - order[a.gapSeverity];
    })
    .slice(0, 5);

  const confidence = topGaps[0]?.confidenceScore ?? 'LOW';

  return {
    reportId: `gap-report-${input.analysisId}`,
    analysisId: input.analysisId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    analysisSource: result.analysisSource,
    capabilityGapCount: result.detectedGaps.length,
    highSeverityCount: highCount,
    criticalSeverityCount: criticalCount,
    recommendedCapabilityCount: new Set(result.detectedGaps.map((g) => g.recommendedCapability)).size,
    confidenceScore: confidence,
    topCapabilityGaps: topGaps,
    recommendationCount: result.recommendations.length,
    confirmation: { ...result.confirmation },
  };
}

export function buildCapabilityGapReport(
  state: MissingCapabilityDetectorState,
  result: CapabilityGapResult,
  reportOutput: CapabilityGapReportOutput,
): CapabilityGapReport {
  return {
    ownerModule: MISSING_CAPABILITY_DETECTOR_OWNER_MODULE,
    reportId: reportOutput.reportId,
    analysisId: reportOutput.analysisId,
    workspaceId: reportOutput.workspaceId,
    projectId: reportOutput.projectId,
    analysisSource: reportOutput.analysisSource,
    capabilityGapCount: reportOutput.capabilityGapCount,
    highSeverityCount: reportOutput.highSeverityCount,
    criticalSeverityCount: reportOutput.criticalSeverityCount,
    recommendedCapabilityCount: reportOutput.recommendedCapabilityCount,
    confidenceScore: reportOutput.confidenceScore,
    topCapabilityGapCount: reportOutput.topCapabilityGaps.length,
    recommendationCount: reportOutput.recommendationCount,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    confirmation: { ...result.confirmation },
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 9.1 Missing Capability Detector Foundation V1 — detection only. No acquisition, execution, or modification.',
  };
}

export function formatCapabilityGapReport(
  state: MissingCapabilityDetectorState,
  result: CapabilityGapResult,
  input: CapabilityAnalysisInput,
): string {
  const output = buildCapabilityGapReportOutput(input, result);
  const report = buildCapabilityGapReport(state, result, output);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 9.1 — Missing Capability Detector Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Report ID: ${report.reportId}`,
    `Analysis ID: ${report.analysisId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Analysis source: ${report.analysisSource}`,
    `Capability gap count: ${report.capabilityGapCount}`,
    `High severity count: ${report.highSeverityCount}`,
    `Critical severity count: ${report.criticalSeverityCount}`,
    `Recommended capability count: ${report.recommendedCapabilityCount}`,
    `Confidence score: ${report.confidenceScore}`,
    `Top capability gaps: ${report.topCapabilityGapCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Missing-capability-detector-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  No capability acquisition performed: CONFIRMED',
    '  Capability detection only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
