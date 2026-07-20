/**
 * Universal Workflow Generation Engine V1 — capability coverage report.
 */

import type {
  UniversalWorkflowBehaviorVerificationResult,
  UniversalWorkflowDescriptor,
  UniversalWorkflowMaterializationReport,
} from './universal-workflow-types.js';
import { UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION } from './universal-workflow-types.js';

export function buildUniversalWorkflowMaterializationReport(input: {
  moduleId: string;
  descriptors: readonly UniversalWorkflowDescriptor[];
  verifications: readonly UniversalWorkflowBehaviorVerificationResult[];
}): UniversalWorkflowMaterializationReport {
  const executable = input.descriptors.filter(
    (d) => d.supportClassification !== 'NOT_EXECUTABLE_INFORMATIONAL' && d.supportClassification !== 'INVALID_WORKFLOW_CONTRACT',
  );
  const verified = input.verifications.filter((v) => v.classification === 'BEHAVIORALLY_VERIFIED').length;
  const totalValidTransitions = input.descriptors.reduce(
    (sum, d) => sum + (d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY' ? 0 : d.transitions.length),
    0,
  );
  const verifiedTransitions = input.descriptors.reduce((sum, d) => {
    const v = input.verifications.find((vr) => vr.workflowId === d.workflowId);
    return sum + (v?.passed ? d.transitions.length : 0);
  }, 0);

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION,
    moduleId: input.moduleId,
    totalApprovedWorkflows: input.descriptors.length,
    fullyMaterializedWorkflows: input.descriptors.filter((d) =>
      ['FULLY_SUPPORTED', 'LINEAR_SUPPORTED', 'BRANCHING_SUPPORTED', 'FORM_WORKFLOW_SUPPORTED', 'APPROVAL_SUPPORTED'].includes(d.supportClassification),
    ).length,
    partiallyMaterializedWorkflows: input.verifications.filter((v) => v.classification === 'PARTIALLY_VERIFIED').length,
    blockedWorkflows: input.descriptors.filter((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY').length,
    invalidWorkflows: input.descriptors.filter((d) => d.supportClassification === 'INVALID_WORKFLOW_CONTRACT').length,
    behaviorallyVerifiedWorkflows: verified,
    behavioralCoveragePercent: executable.length > 0 ? Math.round((verified / executable.length) * 100) : 100,
    verifiedTransitions,
    totalValidTransitions,
    descriptors: input.descriptors,
    verifications: input.verifications,
  };
}

export function renderUniversalWorkflowMaterializationReportMarkdown(
  report: UniversalWorkflowMaterializationReport,
): string {
  const lines = [
    '# Universal Workflow Materialization Report',
    '',
    `Module: ${report.moduleId}`,
    `Behavioral coverage: ${report.behavioralCoveragePercent}%`,
    `Verified transitions: ${report.verifiedTransitions}/${report.totalValidTransitions}`,
  ];
  for (const d of report.descriptors) {
    const v = report.verifications.find((vr) => vr.workflowId === d.workflowId);
    lines.push(`- ${d.label}: ${d.supportClassification} — ${v?.classification ?? 'NOT_RUN'}`);
  }
  return lines.join('\n');
}

export function computeUniversalWorkflowCapabilityCoverageScore(
  reports: readonly UniversalWorkflowMaterializationReport[],
): number {
  if (reports.length === 0) return 100;
  return Math.round(reports.reduce((s, r) => s + r.behavioralCoveragePercent, 0) / reports.length);
}
