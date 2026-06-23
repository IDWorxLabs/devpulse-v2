/**
 * Build Materialization Reality — report builder (Phase 26.74).
 */

import type {
  BuildMaterializationRealityReport,
  MaterializationChainStep,
} from './build-materialization-reality-types.js';
import { BUILD_MATERIALIZATION_REALITY_REPORT_TITLE } from './build-materialization-reality-registry.js';

function formatChainStep(step: MaterializationChainStep): string {
  const status = step.proven ? 'PROVEN' : 'NOT_PROVEN';
  const missing =
    step.missingEvidence.length > 0
      ? `\n    - missing: ${step.missingEvidence.slice(0, 4).join('; ')}`
      : '';
  return `- **${step.stage}** — ${status}${missing}`;
}

export function buildBuildMaterializationRealityReportMarkdown(
  report: BuildMaterializationRealityReport,
): string {
  const lines: string[] = [
    `# ${BUILD_MATERIALIZATION_REALITY_REPORT_TITLE}`,
    '',
    `**Assessment:** ${report.assessmentId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Primary verdict:** ${report.primaryVerdict}`,
    `**Gap kind:** ${report.gapKind}`,
    '',
    '## Core question',
    '',
    report.coreQuestion,
    '',
    '## Verdict analysis',
    '',
    `- Reason: ${report.verdictAnalysis.verdictReason}`,
    `- firstBrokenLink: ${report.verdictAnalysis.firstBrokenLink ?? 'none'}`,
    `- firstBrokenFile: ${report.verdictAnalysis.firstBrokenFile ?? 'none'}`,
    `- lostEvidenceAuthority: ${report.verdictAnalysis.lostEvidenceAuthority ?? 'none'}`,
    `- connectedBuildProofLevel: ${report.connectedBuildProofLevel ?? 'not assessed'}`,
    `- evidencePropagationAligned: ${report.evidencePropagationAligned}`,
    '',
    '## Materialization chain',
    '',
    ...report.materializationChain.map(formatChainStep),
    '',
    '## Artifact scan counts',
    '',
    `- workspaceRootExists: ${report.artifactScan.workspaceRootExists}`,
    `- workspaceCount: ${report.artifactScan.workspaceCount}`,
    `- totalFilesObserved: ${report.artifactScan.totalFilesObserved}`,
    `- totalExpectedArtifacts: ${report.artifactScan.totalExpectedArtifacts}`,
    `- totalExistingArtifacts: ${report.artifactScan.totalExistingArtifacts}`,
    `- totalMissingArtifacts: ${report.artifactScan.totalMissingArtifacts}`,
    `- totalLinkedArtifacts: ${report.artifactScan.totalLinkedArtifacts}`,
    `- totalPropagatedArtifacts: ${report.artifactScan.totalPropagatedArtifacts}`,
    '',
    '## Founder answers',
    '',
    `- Did AiDevEngine generate build files? **${report.founderAnswers.didGenerateBuildFiles ? 'YES' : 'NO'}**`,
    `- Did AiDevEngine create workspace files? **${report.founderAnswers.didCreateWorkspaceFiles ? 'YES' : 'NO'}**`,
    `- First broken link: **${report.founderAnswers.firstBrokenLink ?? 'none'}**`,
    `- First broken file: **${report.founderAnswers.firstBrokenFile ?? 'none'}**`,
    `- Lost evidence authority: **${report.founderAnswers.lostEvidenceAuthority ?? 'none'}**`,
    `- Product gap or proof gap? **${report.founderAnswers.gapKind}**`,
    '',
    '### What must be fixed next',
    '',
    ...report.founderAnswers.whatMustBeFixedNext.map((action) => `- ${action}`),
    '',
    '## Missing evidence',
    '',
    ...(report.missingEvidence.length
      ? report.missingEvidence.map((entry) => `- ${entry}`)
      : ['- none']),
    '',
    '## Recommended fix',
    '',
    report.recommendedFix,
    '',
  ];
  return lines.join('\n');
}
