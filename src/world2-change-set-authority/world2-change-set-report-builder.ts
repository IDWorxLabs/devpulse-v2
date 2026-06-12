/**
 * World 2 Change Set Authority — markdown report builder.
 */

import {
  WORLD2_CHANGE_OPERATION_TYPES,
  WORLD2_CHANGE_ELIGIBILITY_STATES,
  WORLD2_CHANGE_IMPACT_LEVELS,
  WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN,
  WORLD2_CHANGE_SET_AUTHORITY_PHASE,
  WORLD2_CHANGE_SET_AUTHORITY_REPORT_TITLE,
  MAX_DELETE_OPERATIONS,
} from './world2-change-set-registry.js';
import type { World2ChangeSetReport } from './world2-change-set-types.js';

export function buildWorld2ChangeSetReportMarkdown(report: World2ChangeSetReport): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_CHANGE_SET_AUTHORITY_REPORT_TITLE}`,
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
    '## Change Operations',
    '',
  ];

  for (const type of WORLD2_CHANGE_OPERATION_TYPES) {
    lines.push(`- ${type}`);
  }
  lines.push('');

  lines.push('## Change Eligibility States');
  lines.push('');
  for (const state of WORLD2_CHANGE_ELIGIBILITY_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Impact Levels');
  lines.push('');
  for (const level of WORLD2_CHANGE_IMPACT_LEVELS) {
    lines.push(`- ${level}`);
  }
  lines.push('');

  lines.push('## Verdict');
  lines.push('');
  lines.push(`**Eligibility:** ${assessment.eligibilityState}`);
  lines.push(`Assessment ID: ${assessment.assessmentId}`);
  lines.push('');

  if (assessment.changeSet) {
    const cs = assessment.changeSet;
    lines.push('## Change Set');
    lines.push('');
    lines.push(`Change set ID: ${cs.changeSetId}`);
    lines.push(`Workspace ID: ${cs.workspaceId}`);
    lines.push(`Source plan: ${cs.sourcePlanId}`);
    lines.push(`Risk level: ${cs.riskLevel}`);
    lines.push(`Estimated impact: ${cs.estimatedImpact}`);
    lines.push(`Max delete operations: ${MAX_DELETE_OPERATIONS}`);
    lines.push('');
    lines.push('### Operations');
    lines.push('');
    lines.push('| Operation | Type | Target | Allowed |');
    lines.push('|-----------|------|--------|---------|');
    for (const op of cs.operations.slice(0, 12)) {
      lines.push(`| ${op.operationId} | ${op.operationType} | ${op.targetPath} | ${op.allowed} |`);
    }
    lines.push('');
    lines.push('### Verification Requirements');
    lines.push('');
    for (const item of cs.verificationRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Rollback Requirements');
    lines.push('');
    for (const item of cs.rollbackRequirements.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  if (assessment.blockedOperations.length > 0) {
    lines.push('## Blocked Operations');
    lines.push('');
    for (const op of assessment.blockedOperations.slice(0, 8)) {
      lines.push(`- ${op.operationType} ${op.targetPath}: ${op.blockReason ?? 'blocked'}`);
    }
    lines.push('');
  }

  if (assessment.blockingReasons.length > 0) {
    lines.push('## Blocking Reasons');
    lines.push('');
    for (const reason of assessment.blockingReasons.slice(0, 8)) {
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
  lines.push(WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
