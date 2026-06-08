/**
 * Observability Stack Reality Validation founder-readable report.
 */

import type {
  ObservabilityStackValidationReport,
  ObservabilityValidationResult,
  ObservabilityValidationState,
} from './types.js';
import { OBSERVABILITY_SYSTEMS, VALIDATION_OWNER_MODULE } from './types.js';

export function buildObservabilityStackValidationReport(
  state: ObservabilityValidationState,
  results: ObservabilityValidationResult[],
): ObservabilityStackValidationReport {
  const latest = results.length > 0 ? results[results.length - 1] : null;
  const handoffCount = latest?.handoffs.length ?? 0;
  const successfulHandoffs =
    latest?.handoffs.filter(
      (h) => h.sourceProducedOutput && h.targetConsumedOutput && h.ownershipPreserved,
    ).length ?? 0;
  const ownershipIntegrity = latest?.ownershipChecks.every((c) => c.preserved) ?? false;

  let recommendation =
    'Observability stack handoffs validated — Phase 6 systems may proceed when PHASE_6_READY.';
  if (!latest) {
    recommendation = 'Run observability stack validation before starting Phase 6 systems.';
  } else if (latest.phase6Readiness === 'NOT_READY') {
    recommendation =
      'Resolve failed observability handoffs, evidence propagation, or ownership violations before Phase 6.';
  }

  return {
    validationId: latest?.validationId ?? state.validatorId,
    handoffCount,
    successfulHandoffs,
    ownershipIntegrity,
    evidencePropagation: latest?.evidencePropagationValid ?? false,
    duplicateDetectionStatus: latest?.duplicateDetection ?? [],
    centralBrainVisibility: latest?.brainVisibilityValid ?? false,
    timelinePropagation: latest?.timelinePropagationValid ?? false,
    phase6Readiness: latest?.phase6Readiness ?? 'NOT_READY',
    overallStatus: latest?.overallStatus ?? 'FAIL',
    warnings: latest ? [...latest.warnings, ...state.warnings] : [...state.warnings],
    errors: latest ? [...latest.errors, ...state.errors] : [...state.errors],
    recommendation,
  };
}

export function formatObservabilityStackValidationReport(
  state: ObservabilityValidationState,
  results: ObservabilityValidationResult[],
): string {
  const report = buildObservabilityStackValidationReport(state, results);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Observability Stack Reality Validation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${VALIDATION_OWNER_MODULE}`,
    `Validator ID: ${state.validatorId}`,
    `Validation ID: ${report.validationId}`,
    `Systems validated: ${OBSERVABILITY_SYSTEMS.join(', ')}`,
    `Handoff count: ${report.handoffCount}`,
    `Successful handoffs: ${report.successfulHandoffs}`,
    `Ownership integrity: ${report.ownershipIntegrity ? 'PRESERVED' : 'VIOLATED'}`,
    `Evidence propagation: ${report.evidencePropagation ? 'VALID' : 'INVALID'}`,
    `Timeline propagation: ${report.timelinePropagation ? 'VALID' : 'INVALID'}`,
    `Central Brain visibility: ${report.centralBrainVisibility ? 'VALID' : 'INVALID'}`,
    `Duplicate detection: ${report.duplicateDetectionStatus.every((d) => d.active) ? 'PASS' : 'FAIL'}`,
    `Overall status: ${report.overallStatus}`,
    `Phase 6 readiness: ${report.phase6Readiness}`,
    '',
  ];

  if (report.duplicateDetectionStatus.length > 0) {
    lines.push('Duplicate detection status:');
    for (const d of report.duplicateDetectionStatus) {
      lines.push(`  ${d.systemId}: ${d.active ? 'ACTIVE' : 'INACTIVE'}`);
    }
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
