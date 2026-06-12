/**
 * World 2 Workspace Instantiation Governance — markdown report builder.
 */

import {
  MAX_APPROVAL_DURATION_MS,
  MAX_INSTANTIATION_ATTEMPTS,
  WORLD2_INSTANTIATION_APPROVAL_STATES,
  WORLD2_INSTANTIATION_SAFETY_GUARANTEES,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PHASE,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT_TITLE,
} from './world2-workspace-instantiation-governance-registry.js';
import type { World2InstantiationGovernanceReport } from './world2-workspace-instantiation-governance-types.js';

export function buildWorld2InstantiationGovernanceReportMarkdown(
  report: World2InstantiationGovernanceReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    report.phaseName,
    '',
    '## Purpose',
    '',
    report.purpose,
    '',
    '## Core Question',
    '',
    assessment.coreQuestion,
    '',
    '## Instantiation States',
    '',
  ];

  for (const state of WORLD2_INSTANTIATION_APPROVAL_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Governance Verdict');
  lines.push('');
  lines.push(`**Approval state:** ${assessment.approvalState}`);
  lines.push(`Governance ID: ${assessment.governanceId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_INSTANTIATION_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Expiration Policy');
  lines.push('');
  lines.push(`- maxApprovalDurationMs: ${MAX_APPROVAL_DURATION_MS}`);
  lines.push(`- maxInstantiationAttempts: ${MAX_INSTANTIATION_ATTEMPTS}`);
  if (assessment.governanceApproval) {
    lines.push(`- expiresAfterDuration: ${assessment.governanceApproval.expirationPolicy.expiresAfterDuration}`);
    lines.push(`- expiresAfterAttempts: ${assessment.governanceApproval.expirationPolicy.expiresAfterAttempts}`);
  }
  lines.push('');

  if (assessment.governanceApproval) {
    const approval = assessment.governanceApproval;
    lines.push('## Governance Approval');
    lines.push('');
    lines.push(`Approval ID: ${approval.approvalId}`);
    lines.push(`Blueprint ID: ${approval.blueprintId ?? 'none'}`);
    lines.push('');
    if (approval.restrictions.length > 0) {
      lines.push('### Restrictions');
      lines.push('');
      for (const item of approval.restrictions.slice(0, 8)) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
    if (approval.requiredPreconditions.length > 0) {
      lines.push('### Required Preconditions');
      lines.push('');
      for (const item of approval.requiredPreconditions.slice(0, 6)) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
    if (approval.requiredPostconditions.length > 0) {
      lines.push('### Required Postconditions');
      lines.push('');
      for (const item of approval.requiredPostconditions.slice(0, 6)) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  if (assessment.governanceApproval?.blockingReasons.length) {
    lines.push('## Blocking Reasons');
    lines.push('');
    for (const reason of assessment.governanceApproval.blockingReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  if (assessment.warningReasons.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const reason of assessment.warningReasons.slice(0, 8)) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push('## Pass Token');
  lines.push('');
  lines.push(WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
