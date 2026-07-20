/**
 * Universal Action Materialization Engine V1 — capability coverage report.
 */

import type {
  UniversalActionBehaviorVerificationResult,
  UniversalActionDescriptor,
  UniversalActionMaterializationReport,
} from './universal-action-types.js';
import { UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_VERSION } from './universal-action-types.js';

export function buildUniversalActionMaterializationReport(input: {
  moduleId: string;
  descriptors: readonly UniversalActionDescriptor[];
  verifications: readonly UniversalActionBehaviorVerificationResult[];
}): UniversalActionMaterializationReport {
  const { moduleId, descriptors, verifications } = input;
  const executable = descriptors.filter(
    (d) => d.supportClassification !== 'NOT_EXECUTABLE_INFORMATIONAL',
  );

  const countBy = (pred: (d: UniversalActionDescriptor) => boolean) => descriptors.filter(pred).length;

  const behaviorallyVerified = verifications.filter((v) => v.classification === 'BEHAVIORALLY_VERIFIED').length;
  const denominator = executable.filter((d) => d.supportClassification !== 'INVALID_ACTION_CONTRACT').length;
  const behavioralCoveragePercent =
    denominator > 0 ? Math.round((behaviorallyVerified / denominator) * 100) : 100;

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_ACTION_MATERIALIZATION_ENGINE_VERSION,
    moduleId,
    totalApprovedActions: descriptors.length,
    fullyMaterializedActions: countBy((d) =>
      ['FULLY_SUPPORTED', 'CRUD_BACKED', 'STATE_BACKED', 'PERSISTENCE_BACKED', 'NAVIGATION_BACKED', 'SERVICE_COMMAND_BACKED'].includes(d.supportClassification),
    ),
    crudBackedActions: countBy((d) => d.supportClassification === 'CRUD_BACKED'),
    stateBackedActions: countBy((d) => d.supportClassification === 'STATE_BACKED'),
    persistenceBackedActions: countBy((d) => d.supportClassification === 'PERSISTENCE_BACKED'),
    navigationBackedActions: countBy((d) => d.supportClassification === 'NAVIGATION_BACKED'),
    serviceCommandBackedActions: countBy((d) => d.supportClassification === 'SERVICE_COMMAND_BACKED'),
    informationalActions: countBy((d) => d.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL'),
    blockedActions: countBy((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY'),
    invalidActions: countBy((d) => d.supportClassification === 'INVALID_ACTION_CONTRACT'),
    structurallyPresentOnly: verifications.filter((v) => v.classification === 'STRUCTURALLY_PRESENT_ONLY').length,
    behaviorallyVerifiedActions: behaviorallyVerified,
    failedActions: verifications.filter((v) => v.classification === 'FAILED').length,
    behavioralCoveragePercent,
    descriptors,
    verifications,
  };
}

export function renderUniversalActionMaterializationReportMarkdown(
  report: UniversalActionMaterializationReport,
): string {
  const lines: string[] = [];
  lines.push('# Universal Action Materialization Report');
  lines.push('');
  lines.push(`Module: ${report.moduleId}`);
  lines.push(`Engine: ${report.engineVersion}`);
  lines.push(`Total approved actions: ${report.totalApprovedActions}`);
  lines.push(`Behavioral coverage: ${report.behavioralCoveragePercent}%`);
  lines.push('');
  lines.push('## Coverage');
  lines.push(`- Fully materialized: ${report.fullyMaterializedActions}`);
  lines.push(`- CRUD-backed: ${report.crudBackedActions}`);
  lines.push(`- State-backed: ${report.stateBackedActions}`);
  lines.push(`- Persistence-backed: ${report.persistenceBackedActions}`);
  lines.push(`- Navigation-backed: ${report.navigationBackedActions}`);
  lines.push(`- Blocked: ${report.blockedActions}`);
  lines.push(`- Informational: ${report.informationalActions}`);
  lines.push(`- Behaviorally verified: ${report.behaviorallyVerifiedActions}`);
  lines.push('');
  lines.push('## Actions');
  for (const d of report.descriptors) {
    const v = report.verifications.find((vr) => vr.actionId === d.actionId);
    lines.push(`- ${d.label} (${d.semanticType}): ${d.supportClassification} — ${v?.classification ?? 'NOT_RUN'}`);
  }
  return lines.join('\n');
}

export function computeUniversalActionCapabilityCoverageScore(
  reports: readonly UniversalActionMaterializationReport[],
): number {
  if (reports.length === 0) return 100;
  const total = reports.reduce((s, r) => s + r.behavioralCoveragePercent, 0);
  return Math.round(total / reports.length);
}
