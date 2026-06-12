/**
 * World 2 Disposable Workspace Creator — markdown report builder.
 */

import {
  MAX_CREATION_ARTIFACTS,
  MAX_CREATION_ATTEMPTS,
  MAX_CREATION_DIRECTORIES,
  MAX_CREATION_FILES,
  MAX_CREATION_TTL_MS,
  WORLD2_CREATION_STATES,
  WORLD2_CREATOR_SAFETY_GUARANTEES,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PHASE,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_REPORT_TITLE,
} from './world2-disposable-workspace-creator-registry.js';
import type { World2DisposableWorkspaceCreatorReport } from './world2-disposable-workspace-creator-types.js';

export function buildWorld2DisposableWorkspaceCreatorReportMarkdown(
  report: World2DisposableWorkspaceCreatorReport,
): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${WORLD2_DISPOSABLE_WORKSPACE_CREATOR_REPORT_TITLE}`,
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
    '## Creation States',
    '',
  ];

  for (const state of WORLD2_CREATION_STATES) {
    lines.push(`- ${state}`);
  }
  lines.push('');

  lines.push('## Creation Verdict');
  lines.push('');
  lines.push(`**Creation state:** ${assessment.creationState}`);
  lines.push(`Creator assessment ID: ${assessment.creatorAssessmentId}`);
  lines.push(`Workspace ID: ${assessment.workspaceId}`);
  lines.push('');

  lines.push('## Safety Guarantees');
  lines.push('');
  for (const guarantee of WORLD2_CREATOR_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');

  lines.push('## Creation Bounds (Registry Defaults)');
  lines.push('');
  lines.push(`- maxDirectories: ${MAX_CREATION_DIRECTORIES}`);
  lines.push(`- maxFiles: ${MAX_CREATION_FILES}`);
  lines.push(`- maxArtifacts: ${MAX_CREATION_ARTIFACTS}`);
  lines.push(`- maxCreationAttempts: ${MAX_CREATION_ATTEMPTS}`);
  lines.push(`- expirationTtlMs: ${MAX_CREATION_TTL_MS}`);
  lines.push('');

  if (assessment.creationPlan) {
    const plan = assessment.creationPlan;
    lines.push('## Creation Plan');
    lines.push('');
    lines.push(`Creation plan ID: ${plan.creationPlanId}`);
    lines.push(`Blueprint ID: ${plan.blueprintId ?? 'none'}`);
    lines.push(`Source project ID: ${plan.sourceProjectId}`);
    lines.push(`Planned root: ${plan.plannedRoot}`);
    lines.push('');

    lines.push('### Planned Directories');
    lines.push('');
    for (const item of plan.plannedDirectories.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Planned Files');
    lines.push('');
    for (const item of plan.plannedFiles.slice(0, 8)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Validation Assets');
    lines.push('');
    for (const item of plan.validationAssets.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Rollback Assets');
    lines.push('');
    for (const item of plan.rollbackAssets.slice(0, 6)) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    lines.push('### Disposal Policy');
    lines.push('');
    lines.push(`- disposalRequired: ${plan.disposalPolicy.disposalRequired}`);
    lines.push(`- disposalTrigger: ${plan.disposalPolicy.disposalTrigger}`);
    lines.push(`- disposalMethod: ${plan.disposalPolicy.disposalMethod}`);
    lines.push(`- disposalSuccessCriteria: ${plan.disposalPolicy.disposalSuccessCriteria}`);
    lines.push('');

    lines.push('### Creation Bounds (Plan)');
    lines.push('');
    lines.push(`- maxDirectories: ${plan.creationBounds.maxDirectories}`);
    lines.push(`- maxFiles: ${plan.creationBounds.maxFiles}`);
    lines.push(`- maxArtifacts: ${plan.creationBounds.maxArtifacts}`);
    lines.push(`- maxEstimatedSize: ${plan.creationBounds.maxEstimatedSize}`);
    lines.push(`- maxCreationAttempts: ${plan.creationBounds.maxCreationAttempts}`);
    lines.push(`- expirationTtlMs: ${plan.creationBounds.expirationTtlMs}`);
    lines.push(`- expirationTimestamp: ${plan.creationBounds.expirationTimestamp}`);
    lines.push('');

    lines.push('### Safety Audit');
    lines.push('');
    lines.push(`- passed: ${plan.safetyAudit.passed}`);
    lines.push(`- instantiationApproved: ${plan.safetyAudit.instantiationApproved}`);
    lines.push(`- disposableWorkspaceOnly: ${plan.safetyAudit.disposableWorkspaceOnly}`);
    lines.push(`- noLiveWorkspacePath: ${plan.safetyAudit.noLiveWorkspacePath}`);
    lines.push(`- noProductionPath: ${plan.safetyAudit.noProductionPath}`);
    lines.push(`- rollbackAssetsPresent: ${plan.safetyAudit.rollbackAssetsPresent}`);
    lines.push(`- validationAssetsPresent: ${plan.safetyAudit.validationAssetsPresent}`);
    lines.push(`- disposalPolicyPresent: ${plan.safetyAudit.disposalPolicyPresent}`);
    lines.push(`- expirationPolicyPresent: ${plan.safetyAudit.expirationPolicyPresent}`);
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
  lines.push(WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
