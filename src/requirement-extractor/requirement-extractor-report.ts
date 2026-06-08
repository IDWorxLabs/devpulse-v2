/**
 * Requirement Extractor founder-readable report.
 */

import type {
  RequirementCategory,
  RequirementExtractionResult,
  RequirementExtractorReport,
  RequirementExtractorState,
} from './types.js';
import { EXTRACTOR_OWNER_MODULE } from './types.js';

function countByCategory(
  extractions: RequirementExtractionResult[],
  category: RequirementCategory,
): number {
  return extractions.reduce(
    (sum, e) => sum + e.requirements.filter((r) => r.category === category).length,
    0,
  );
}

export function buildRequirementExtractorReport(
  state: RequirementExtractorState,
  extractions: RequirementExtractionResult[],
): RequirementExtractorReport {
  const requirementCount = extractions.reduce((sum, e) => sum + e.requirements.length, 0);
  const latestExtraction = extractions.length > 0 ? extractions[extractions.length - 1] : null;

  let recommendation =
    'Requirement Extractor discovers structured requirements — Product Architect comes next, not code generation.';
  if (state.extractionCount === 0) {
    recommendation = 'Extract requirements from AiDev build requests before planning or architecture work.';
  } else if (requirementCount === 0) {
    recommendation = 'Clarify build request language — features, platforms, and user types improve extraction.';
  }

  return {
    ownerModule: EXTRACTOR_OWNER_MODULE,
    totalExtractions: state.extractionCount,
    requirementCount,
    featureCount: countByCategory(extractions, 'FEATURE'),
    constraintCount: countByCategory(extractions, 'CONSTRAINT'),
    platformCount: countByCategory(extractions, 'PLATFORM'),
    riskCount: countByCategory(extractions, 'RISK'),
    latestExtraction: latestExtraction
      ? {
          ...latestExtraction,
          requirements: latestExtraction.requirements.map((r) => ({ ...r })),
          warnings: [...latestExtraction.warnings],
          errors: [...latestExtraction.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatRequirementExtractorReport(
  state: RequirementExtractorState,
  extractions: RequirementExtractionResult[],
): string {
  const report = buildRequirementExtractorReport(state, extractions);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Requirement Extractor Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Extractor ID: ${state.extractorId}`,
    `Total extractions: ${report.totalExtractions}`,
    `Requirement count: ${report.requirementCount}`,
    `Features: ${report.featureCount} | Constraints: ${report.constraintCount} | Platforms: ${report.platformCount} | Risks: ${report.riskCount}`,
    '',
  ];

  if (report.latestExtraction) {
    lines.push(`Latest extraction: ${report.latestExtraction.extractionId}`);
    lines.push(`  Request: ${report.latestExtraction.requestId}`);
    lines.push(`  Requirements: ${report.latestExtraction.requirements.length}`);
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
