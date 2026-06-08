/**
 * Planning Stack Reality Validation founder-readable report.
 */

import type {
  PlanningStackValidationReport,
  PlanningStackValidationResult,
  PlanningStackValidationState,
} from './types.js';
import { PLANNING_SYSTEMS, VALIDATION_OWNER_MODULE } from './types.js';

export function buildPlanningStackValidationReport(
  state: PlanningStackValidationState,
  results: PlanningStackValidationResult[],
): PlanningStackValidationReport {
  const latest = results.length > 0 ? results[results.length - 1] : null;
  const handoffsValidated = latest?.handoffs.length ?? 0;
  const successfulHandoffs =
    latest?.handoffs.filter(
      (h) => h.sourceProducedOutput && h.targetConsumedOutput && h.ownershipPreserved,
    ).length ?? 0;
  const ownershipViolations =
    latest?.ownershipChecks.filter((c) => !c.preserved).length ?? 0;

  let recommendation =
    'Planning stack handoffs validated — Phase 5 observability systems may proceed when PHASE_5_READY.';
  if (!latest) {
    recommendation = 'Run planning stack validation before starting Phase 5 systems.';
  } else if (latest.phase5Readiness === 'PHASE_5_NOT_READY') {
    recommendation =
      'Resolve failed handoffs or ownership violations before Self Vision, Replay, or related Phase 5 systems.';
  }

  return {
    validationId: latest?.validationId ?? state.validatorId,
    systemsValidated: [...PLANNING_SYSTEMS],
    handoffsValidated,
    successfulHandoffs,
    failedHandoffs: handoffsValidated - successfulHandoffs,
    ownershipViolations,
    duplicateDetectionStatus: latest?.duplicateDetection ?? [],
    duplicateRiskPropagated: latest?.duplicateRiskPropagated ?? false,
    overallStatus: latest?.overallStatus ?? 'FAIL',
    phase5Readiness: latest?.phase5Readiness ?? 'PHASE_5_NOT_READY',
    warnings: latest ? [...latest.warnings, ...state.warnings] : [...state.warnings],
    errors: latest ? [...latest.errors, ...state.errors] : [...state.errors],
    recommendation,
  };
}

export function formatPlanningStackValidationReport(
  state: PlanningStackValidationState,
  results: PlanningStackValidationResult[],
): string {
  const report = buildPlanningStackValidationReport(state, results);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Planning Stack Reality Validation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${VALIDATION_OWNER_MODULE}`,
    `Validator ID: ${state.validatorId}`,
    `Validation ID: ${report.validationId}`,
    `Systems validated: ${report.systemsValidated.join(', ')}`,
    `Handoffs validated: ${report.handoffsValidated}`,
    `Successful handoffs: ${report.successfulHandoffs}`,
    `Failed handoffs: ${report.failedHandoffs}`,
    `Ownership violations: ${report.ownershipViolations}`,
    `Duplicate risk propagated: ${report.duplicateRiskPropagated}`,
    `Overall status: ${report.overallStatus}`,
    `Phase 5 readiness: ${report.phase5Readiness}`,
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
