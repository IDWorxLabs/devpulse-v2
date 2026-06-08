/**
 * Drift severity engine — scores drift severity and confidence.
 * Scoring only. No auto-fix.
 */

import type { DriftAnalysisInput, DriftConfidence, DriftFinding, DriftSeverity, OverallDriftRisk } from './types.js';

export function driftSeverityKey(severity: DriftSeverity, findingCount: number): string {
  return `${severity}|${findingCount}`;
}

const SEVERITY_RANK: Record<DriftSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function scorePrimarySeverity(findings: DriftFinding[]): DriftSeverity {
  if (findings.length === 0) return 'LOW';
  return findings.reduce(
    (max, f) => (SEVERITY_RANK[f.driftSeverity] > SEVERITY_RANK[max] ? f.driftSeverity : max),
    'LOW' as DriftSeverity,
  );
}

export function computeDriftConfidence(
  input: DriftAnalysisInput,
  findings: DriftFinding[],
  cleanScan: boolean,
): DriftConfidence {
  if (cleanScan || findings.length === 0) {
    return input.governanceStatus === 'PASS' ? 'HIGH' : 'MEDIUM';
  }

  let score = 0.4;
  if (findings.length >= 1) score += 0.15;
  if (findings.length >= 3) score += 0.1;
  if (findings.some((f) => f.driftSeverity === 'CRITICAL')) score += 0.2;
  if (input.expectedArchitectureRules.length >= 2) score += 0.05;
  if (input.observedArchitectureSignals.length >= 2) score += 0.05;
  if (input.governanceStatus === 'PASS') score += 0.1;
  if (input.authStatus === 'AUTHENTICATED') score += 0.05;

  if (score >= 0.85) return 'VERY_HIGH';
  if (score >= 0.65) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
}

export function computeOverallDriftRisk(findings: DriftFinding[]): OverallDriftRisk {
  if (findings.length === 0) return 'LOW';

  const criticalCount = findings.filter((f) => f.driftSeverity === 'CRITICAL').length;
  const highCount = findings.filter((f) => f.driftSeverity === 'HIGH').length;

  if (criticalCount >= 2) return 'CRITICAL';
  if (criticalCount >= 1) return 'HIGH';
  if (highCount >= 2) return 'HIGH';
  if (highCount >= 1 || findings.length >= 3) return 'MEDIUM';
  return 'LOW';
}

export function countBySeverity(findings: DriftFinding[], severity: DriftSeverity): number {
  return findings.filter((f) => f.driftSeverity === severity).length;
}

export function isLowSeverity(severity: DriftSeverity): boolean {
  return severity === 'LOW';
}

export function isMediumSeverity(severity: DriftSeverity): boolean {
  return severity === 'MEDIUM';
}

export function isHighSeverity(severity: DriftSeverity): boolean {
  return severity === 'HIGH';
}

export function isCriticalSeverity(severity: DriftSeverity): boolean {
  return severity === 'CRITICAL';
}
