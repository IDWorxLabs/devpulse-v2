/**
 * Universal Capability Coverage Intelligence V1 — coverage report.
 */

import type {
  CapabilityCoverageReport,
  CapabilityCoverageSnapshot,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';
import { analyzeCapabilityGaps } from './capability-gap-analysis.js';
import { diagnoseCapabilityCoverage } from './capability-coverage-diagnostics.js';
import { buildCapabilityTraceabilityChains } from './capability-traceability.js';
import { renderScorecardMarkdown } from './capability-scorecard.js';

export function buildCapabilityCoverageReport(input: {
  reportId: string;
  snapshot: CapabilityCoverageSnapshot;
}): CapabilityCoverageReport {
  const gaps = analyzeCapabilityGaps(input.snapshot.capabilities);
  const diagnoses = diagnoseCapabilityCoverage(input.snapshot.capabilities, gaps);
  return {
    reportId: input.reportId,
    generatedAt: new Date().toISOString(),
    snapshot: input.snapshot,
    gaps,
    diagnoses,
    traceabilityChains: buildCapabilityTraceabilityChains(input.snapshot.capabilities),
  };
}

export function renderCapabilityCoverageReportMarkdown(report: CapabilityCoverageReport): string {
  const lines = [
    '# Universal Capability Coverage Report',
    '',
    renderScorecardMarkdown(report.snapshot.scorecard),
    '## Capabilities',
    '',
  ];
  for (const cap of report.snapshot.capabilities) {
    lines.push(`### ${cap.label} (${cap.capabilityKey})`);
    lines.push(`- Maturity: ${cap.maturityLevel}`);
    lines.push(`- Classification: ${cap.supportClassification}`);
    lines.push(`- Structural: ${cap.dimensionScores.structuralCoverage}%`);
    lines.push(`- Runtime: ${cap.dimensionScores.runtimeCoverage}%`);
    lines.push(`- Behavioral: ${cap.dimensionScores.behavioralCoverage}%`);
    lines.push(`- Production: ${cap.dimensionScores.productionCoverage}%`);
    lines.push(`- Engineering: ${cap.engineeringCoverage}%`);
    lines.push('');
  }
  return lines.join('\n');
}

export function summarizeCapabilityReport(report: CapabilityCoverageReport): string {
  return `capabilities=${report.snapshot.scorecard.totalCapabilities} behavioral=${report.snapshot.scorecard.behavioralCoveragePercent}% engineering=${report.snapshot.scorecard.engineeringCoveragePercent}%`;
}

export function capabilityReportForKey(
  report: CapabilityCoverageReport,
  capabilityKey: string,
): UniversalCapabilityDescriptor | null {
  return report.snapshot.capabilities.find((c) => c.capabilityKey === capabilityKey) ?? null;
}
