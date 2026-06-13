/**
 * Connected Build Execution — markdown report builder.
 */

import {
  CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
  CONNECTED_BUILD_EXECUTION_PASS_TOKEN,
  CONNECTED_BUILD_EXECUTION_PHASE,
  CONNECTED_BUILD_EXECUTION_REPORT_TITLE,
  SAFETY_GUARANTEES,
} from './connected-build-execution-registry.js';
import type { ConnectedBuildExecutionReport } from './connected-build-execution-types.js';

export function buildConnectedBuildExecutionReportMarkdown(
  report: ConnectedBuildExecutionReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_BUILD_EXECUTION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_BUILD_EXECUTION_PHASE,
    '',
    '## CONNECTED BUILD EXECUTION',
    '',
    `**Proof level:** ${report.proofLevel}`,
    '',
    '## Build Materialization State',
    '',
    `- contractId: ${report.buildMaterialization.contractId}`,
    `- materializationState: **${report.buildMaterialization.materializationState}**`,
    `- expected artifacts: ${report.buildMaterialization.expectedArtifacts.length}`,
    `- workspace targets: ${report.buildMaterialization.workspaceTargets.join(', ') || 'none'}`,
    '',
    '## Generated File Evidence',
    '',
    `- proofLevel: ${report.generatedFileEvidence.proofLevel}`,
    `- files observed: ${report.generatedFileEvidence.fileCount}`,
    `- missing paths: ${report.generatedFileEvidence.missingPaths.length}`,
    '',
    '## Artifact Evidence',
    '',
    `- level: **${report.artifactEvidence.artifactEvidenceLevel}**`,
    `- summary: ${report.artifactEvidence.evidenceSummary}`,
    '',
    '## Workspace Evidence',
    '',
    `- workspaceExists: ${report.workspaceMaterialization.workspaceExists}`,
    `- structureValid: ${report.workspaceMaterialization.workspaceStructureValid}`,
    `- artifactCoverage: ${report.workspaceMaterialization.artifactCoverage}%`,
    '',
    '## Build Manifest Evidence',
    '',
    `- manifestExists: ${report.buildManifest.manifestExists}`,
    `- linkedArtifacts: ${report.buildManifest.linkedArtifacts.length}`,
    `- missingArtifacts: ${report.buildManifest.missingArtifacts.length}`,
    `- traceabilityScore: ${report.buildManifest.traceabilityScore}/100`,
    '',
    '## Linkage Analysis',
    '',
    `- linkageConnected: **${report.linkageAnalysis.linkageConnected ? 'YES' : 'NO'}**`,
    `- firstBrokenLink: ${report.linkageAnalysis.firstBrokenLink ?? 'none'}`,
    `- traceabilityScore: ${report.linkageAnalysis.traceabilityScore}/100`,
    '',
    '## Missing Evidence',
    '',
  ];

  for (const item of report.missingEvidence) {
    lines.push(`- ${item}`);
  }

  lines.push('');
  lines.push('## Recommended Fix');
  lines.push('');
  lines.push(report.recommendedFix);
  lines.push('');
  lines.push('## Founder Questions');
  lines.push('');
  lines.push(`| Question | Answer |`);
  lines.push(`|----------|--------|`);
  lines.push(`| Can prove generated artifacts? | ${report.founderQuestions.canProveGeneratedArtifacts ? 'YES' : 'NO'} |`);
  lines.push(`| Can prove workspace creation? | ${report.founderQuestions.canProveWorkspaceCreation ? 'YES' : 'NO'} |`);
  lines.push(`| Can prove build materialization? | ${report.founderQuestions.canProveBuildMaterialization ? 'YES' : 'NO'} |`);

  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const g of SAFETY_GUARANTEES) {
    lines.push(`- ${g}`);
  }

  lines.push('');
  lines.push(`Pass token: \`${CONNECTED_BUILD_EXECUTION_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}

export function formatConnectedBuildExecutionSummary(report: ConnectedBuildExecutionReport): string {
  return (
    `Connected Build Execution: ${report.proofLevel} — ` +
    `materialization ${report.buildMaterialization.materializationState}, ` +
    `linkage ${report.linkageAnalysis.linkageConnected ? 'connected' : 'broken'} ` +
    `(${report.generatedFileEvidence.fileCount}/${report.buildMaterialization.expectedArtifacts.length} artifacts).`
  );
}
