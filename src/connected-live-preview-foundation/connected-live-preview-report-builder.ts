/**
 * Connected Live Preview Foundation — markdown report builder.
 */

import {
  CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
  CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  CONNECTED_LIVE_PREVIEW_PHASE,
  CONNECTED_LIVE_PREVIEW_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  PREVIEW_READINESS_SAFETY_GUARANTEES,
  PREVIEW_STATES,
  REQUIRED_INPUT_AUTHORITIES,
} from './connected-live-preview-registry.js';
import type { ConnectedLivePreviewReport } from './connected-live-preview-types.js';

export function buildConnectedLivePreviewReportMarkdown(
  report: ConnectedLivePreviewReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_LIVE_PREVIEW_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_LIVE_PREVIEW_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Preview Readiness Score',
    '',
    `**${report.previewReadinessScore}/100**`,
    '',
    '## Preview State',
    '',
    `**${report.previewState}**`,
    '',
    '## Preview Completeness',
    '',
    `${report.previewCompleteness}%`,
    '',
    '## Dependency Completeness',
    '',
    `${report.dependencyCompleteness}%`,
    '',
    '## Proof Completeness',
    '',
    `${report.proofCompleteness}%`,
    '',
    '## Required Questions',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    `| Does runtime readiness exist? | ${report.questionAnswers.runtimeReadinessExists ? 'YES' : 'NO'} |`,
    `| Does a preview candidate exist? | ${report.questionAnswers.previewCandidateExists ? 'YES' : 'NO'} |`,
    `| Does a preview activation path exist? | ${report.questionAnswers.previewActivationPathExists ? 'YES' : 'NO'} |`,
    `| Are preview dependencies known? | ${report.questionAnswers.previewDependenciesKnown ? 'YES' : 'NO'} |`,
    `| Is preview activation describable? | ${report.questionAnswers.previewActivationDescribable ? 'YES' : 'NO'} |`,
    `| Is preview activation reproducible? | ${report.questionAnswers.previewActivationReproducible ? 'YES' : 'NO'} |`,
    `| Is preview activation verifiable? | ${report.questionAnswers.previewActivationVerifiable ? 'YES' : 'NO'} |`,
    `| Can a founder inspect preview readiness? | ${report.questionAnswers.founderInspectable ? 'YES' : 'NO'} |`,
    `| Is preview readiness traceable? | ${report.questionAnswers.previewReadinessTraceable ? 'YES' : 'NO'} |`,
    `| Is preview readiness proven? | ${report.questionAnswers.previewReadinessProven ? 'YES' : 'NO'} |`,
    '',
    '## Preview Candidate',
    '',
    `Candidate ID: ${report.previewCandidate.candidateId}`,
    `Workspace ID: ${report.previewCandidate.workspaceId}`,
    `Runtime Contract: ${report.previewCandidate.runtimeActivationContractId}`,
    `Preview Type: ${report.previewCandidate.previewType}`,
    `Activation Path: ${report.previewCandidate.previewActivationPath ?? 'none modeled'}`,
    '',
    '## Preview Readiness Contract',
    '',
    `Contract ID: ${report.previewReadinessContract.contractId}`,
    `Preview Type: ${report.previewReadinessContract.previewType}`,
    '',
    '### Preview Requirements',
    '',
  ];

  if (report.previewReadinessContract.previewRequirements.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const entry of report.previewReadinessContract.previewRequirements.slice(0, 12)) {
      lines.push(`- **${entry.label}** — ${entry.detail} (${entry.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Preview Artifacts');
  lines.push('');

  if (report.previewReadinessContract.previewArtifacts.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const artifact of report.previewReadinessContract.previewArtifacts.slice(0, 12)) {
      lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
    }
  }

  lines.push('');
  lines.push('### Preview Dependencies');
  lines.push('');

  if (report.previewReadinessContract.previewDependencies.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const dep of report.previewReadinessContract.previewDependencies.slice(0, 12)) {
      lines.push(`- **${dep.label}** — ${dep.detail} (${dep.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Preview Activation Steps');
  lines.push('');

  if (report.previewReadinessContract.previewActivationSteps.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const step of report.previewReadinessContract.previewActivationSteps.slice(0, 12)) {
      lines.push(`- **${step.label}** — ${step.detail} (${step.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Verification Requirements');
  lines.push('');

  for (const req of report.previewReadinessContract.verificationRequirements.slice(0, 12)) {
    lines.push(`- **${req.label}** — ${req.detail} (${req.sourceAuthority})`);
  }

  lines.push('');
  lines.push('### Rollback Requirements');
  lines.push('');

  if (report.previewReadinessContract.rollbackRequirements.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const req of report.previewReadinessContract.rollbackRequirements.slice(0, 12)) {
      lines.push(`- **${req.label}** — ${req.detail} (${req.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Proof Artifacts');
  lines.push('');

  for (const artifact of report.previewReadinessContract.proofArtifacts.slice(0, 12)) {
    lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
  }

  lines.push('');
  lines.push('## Preview Activation Path');
  lines.push('');
  for (const step of report.previewActivationPath) {
    lines.push(`- ${step}`);
  }

  lines.push('');
  lines.push('## Missing Preview Components');
  lines.push('');

  if (report.missingPreviewComponents.length === 0) {
    lines.push('- None');
  } else {
    for (const missing of report.missingPreviewComponents) {
      lines.push(`- ${missing}`);
    }
  }

  lines.push('');
  lines.push('## Recommended Next Actions');
  lines.push('');

  for (const action of report.recommendedNextActions) {
    lines.push(`- ${action}`);
  }

  lines.push('');
  lines.push('## Preview States');
  lines.push('');
  lines.push(PREVIEW_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of PREVIEW_READINESS_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
