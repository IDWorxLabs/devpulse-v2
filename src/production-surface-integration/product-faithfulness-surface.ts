/** Product Faithfulness surface — Contract-to-Module Traceability findings only. */
import type { ContractToModuleTraceabilityReport } from '../contract-to-module-traceability/contract-to-module-traceability-types.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import type { CanonicalProductFaithfulnessFinding, ProductFaithfulnessSurface } from './production-surface-types.js';

function requiredActionForFinding(
  repairEligibility: string,
  regenerationStage: string | null,
): string {
  if (regenerationStage) return `Regenerate at ${regenerationStage.replace(/_/g, ' ').toLowerCase()}.`;
  if (/repair/i.test(repairEligibility)) return 'Apply eligible traceability repair.';
  return 'Resolve first broken boundary before preview activation.';
}

export function buildCanonicalProductFaithfulnessFindings(
  report: ContractToModuleTraceabilityReport,
): CanonicalProductFaithfulnessFinding[] {
  const missingConcepts = report.graph.conceptPreservation.filter((entry) => !entry.outcome.startsWith('PRESERVED'));
  const byConcept = new Map<string, CanonicalProductFaithfulnessFinding>();

  for (const entry of missingConcepts) {
    const relatedFinding = report.graph.findings.find((finding) => finding.conceptIds.includes(entry.conceptId));
    const repairEligibility = relatedFinding?.repairEligibility ?? 'UNKNOWN';
    const regenerationStage = relatedFinding?.regenerationStage ?? null;
    const displayConcept =
      relatedFinding?.ancestryPath?.find((part) => part.trim().length > 0) ?? entry.conceptId;
    const base = {
      concept: displayConcept,
      firstBrokenBoundary: entry.firstBrokenBoundary,
      repairEligibility,
      regenerationStage,
      requiredAction: requiredActionForFinding(repairEligibility, regenerationStage),
    };
    byConcept.set(entry.conceptId.toLowerCase(), {
      readOnly: true,
      ...base,
      fingerprint: fingerprintBuildContextValue(base),
    });
  }

  return [...byConcept.values()].sort((a, b) => a.concept.localeCompare(b.concept));
}

export function buildProductFaithfulnessSurface(
  report: ContractToModuleTraceabilityReport,
): ProductFaithfulnessSurface {
  const findings = buildCanonicalProductFaithfulnessFindings(report);
  const base = { findings, source: 'Contract-to-Module Traceability findings' as const, duplicateStageReportsEliminated: true as const };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}

/** Rejects stage-by-stage duplicate missing-concept reports. */
export function dedupeProductFaithfulnessStageReports(
  stageMissingReports: readonly { readonly stage: string; readonly concept: string }[],
): CanonicalProductFaithfulnessFinding[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const report of stageMissingReports) {
    const key = report.concept.toLowerCase();
    if (seen.has(key)) duplicates.push(`${report.concept}@${report.stage}`);
    seen.add(key);
  }
  if (duplicates.length > 0) {
    throw new Error(`stage-by-stage duplicate product faithfulness reports: ${duplicates.join(', ')}`);
  }
  return [];
}

export function productFaithfulnessFindingsAreUnique(findings: readonly CanonicalProductFaithfulnessFinding[]): boolean {
  const seen = new Set<string>();
  for (const finding of findings) {
    const key = finding.concept.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

export function productFaithfulnessReportsFirstBrokenBoundary(
  findings: readonly CanonicalProductFaithfulnessFinding[],
): boolean {
  return findings.every((finding) => finding.firstBrokenBoundary !== 'UNKNOWN' || finding.concept.length === 0);
}
