/**
 * Dependency installation report builder (Phase 26.79).
 */

import {
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PHASE,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_REPORT_TITLE,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_RESULT_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './generated-workspace-dependency-installation-executor-registry.js';
import type { GeneratedWorkspaceDependencyInstallationExecutorReport } from './generated-workspace-dependency-installation-executor-types.js';

export function buildDependencyInstallationExecutorReportMarkdown(
  report: GeneratedWorkspaceDependencyInstallationExecutorReport,
): string {
  const { safetyCheck, processResult, postInstallVerification } = report;
  return [
    `# ${GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_REPORT_TITLE}`,
    '',
    `**Execution:** ${report.executionId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Mode:** ${report.executionMode}`,
    '',
    '## Core question',
    '',
    GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION,
    '',
    '## Phase',
    '',
    GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PHASE,
    '',
    '## Workspace',
    '',
    `- workspaceRoot: **${report.workspaceRoot}**`,
    `- safetyVerdict: **${safetyCheck.verdict}**`,
    `- refusalReason: ${safetyCheck.refusalReason ?? 'none'}`,
    '',
    '## Process',
    '',
    `- executed: **${processResult.executed}**`,
    `- dryRun: **${processResult.dryRun}**`,
    `- installSucceeded: **${processResult.installSucceeded}**`,
    `- cleanupStatus: **${processResult.cleanupStatus}**`,
    `- exitCode: ${processResult.exitCode ?? 'n/a'}`,
    '',
    '## Post-install verification',
    '',
    `- beforeState: **${postInstallVerification.beforeState}**`,
    `- afterState: **${postInstallVerification.afterState}**`,
    `- dependenciesReady: **${postInstallVerification.dependenciesReady}**`,
    `- verificationSucceeded: **${postInstallVerification.verificationSucceeded}**`,
    '',
    report.recommendedNextAction,
    '',
  ].join('\n');
}

export function buildDependencyInstallationResultMarkdown(
  report: GeneratedWorkspaceDependencyInstallationExecutorReport,
): string {
  return [
    `# ${GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_RESULT_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## FILES_EXIST → DEPENDENCIES_READY → APPLICATION_BOOT_PROOF',
    '',
    '| Step | Status |',
    '|------|--------|',
    '| FILES_EXIST | yes |',
    `| DEPENDENCIES_READY | **${report.postInstallVerification.dependenciesReady ? 'yes' : 'no'}** (${report.postInstallVerification.afterState}) |`,
    `| APPLICATION_BOOT_PROOF | **${report.applicationBootsAfterInstall === true ? 'yes' : report.applicationBootsAfterInstall === false ? 'no' : 'pending'}** |`,
    '',
    '## Install result',
    '',
    `- executionMode: **${report.executionMode}**`,
    `- attemptedCommand: **${report.processResult.attemptedCommand}**`,
    `- failureReason: ${report.processResult.failureReason ?? 'none'}`,
    `- missingModulesAfterInstall: ${report.postInstallVerification.missingModulesAfterInstall.join(', ') || 'none'}`,
    '',
    '## Safety guarantees',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Orchestration',
    '',
    ...ORCHESTRATION_FLOW.map((s, i) => `${i + 1}. ${s}`),
    '',
  ].join('\n');
}
