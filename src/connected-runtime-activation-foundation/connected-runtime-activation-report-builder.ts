/**
 * Connected Runtime Activation Foundation — markdown report builder.
 */

import {
  CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
  CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN,
  CONNECTED_RUNTIME_ACTIVATION_PHASE,
  CONNECTED_RUNTIME_ACTIVATION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  RUNTIME_ACTIVATION_SAFETY_GUARANTEES,
  RUNTIME_STATES,
} from './connected-runtime-activation-registry.js';
import type { ConnectedRuntimeActivationReport } from './connected-runtime-activation-types.js';

export function buildConnectedRuntimeActivationReportMarkdown(
  report: ConnectedRuntimeActivationReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_RUNTIME_ACTIVATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_RUNTIME_ACTIVATION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Runtime Readiness Score',
    '',
    `**${report.runtimeReadinessScore}/100**`,
    '',
    '## Runtime State',
    '',
    `**${report.runtimeState}**`,
    '',
    '## Activation Completeness',
    '',
    `${report.activationCompleteness}%`,
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
    `| Does a build output exist? | ${report.questionAnswers.buildOutputExists ? 'YES' : 'NO'} |`,
    `| Does a runtime candidate exist? | ${report.questionAnswers.runtimeCandidateExists ? 'YES' : 'NO'} |`,
    `| Does a startup path exist? | ${report.questionAnswers.startupPathExists ? 'YES' : 'NO'} |`,
    `| Are runtime dependencies known? | ${report.questionAnswers.runtimeDependenciesKnown ? 'YES' : 'NO'} |`,
    `| Can runtime activation be described? | ${report.questionAnswers.runtimeActivationDescribable ? 'YES' : 'NO'} |`,
    `| Is runtime activation reproducible? | ${report.questionAnswers.runtimeActivationReproducible ? 'YES' : 'NO'} |`,
    `| Is runtime activation verifiable? | ${report.questionAnswers.runtimeActivationVerifiable ? 'YES' : 'NO'} |`,
    `| Can a founder inspect runtime readiness? | ${report.questionAnswers.founderInspectable ? 'YES' : 'NO'} |`,
    `| Is runtime activation traceable? | ${report.questionAnswers.runtimeActivationTraceable ? 'YES' : 'NO'} |`,
    `| Is runtime readiness proven? | ${report.questionAnswers.runtimeReadinessProven ? 'YES' : 'NO'} |`,
    '',
    '## Runtime Activation Candidate',
    '',
    `Candidate ID: ${report.runtimeActivationCandidate.candidateId}`,
    `Workspace ID: ${report.runtimeActivationCandidate.workspaceId}`,
    `Build Output Manifest: ${report.runtimeActivationCandidate.buildOutputManifestId}`,
    `Candidate Type: ${report.runtimeActivationCandidate.candidateType}`,
    `Startup Path: ${report.runtimeActivationCandidate.startupPath ?? 'none modeled'}`,
    '',
    '## Runtime Activation Contract',
    '',
    `Contract ID: ${report.runtimeActivationContract.contractId}`,
    `Runtime Type: ${report.runtimeActivationContract.runtimeType}`,
    '',
    '### Startup Requirements',
    '',
  ];

  if (report.runtimeActivationContract.startupRequirements.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const entry of report.runtimeActivationContract.startupRequirements.slice(0, 12)) {
      lines.push(`- **${entry.label}** — ${entry.detail} (${entry.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Startup Artifacts');
  lines.push('');

  if (report.runtimeActivationContract.startupArtifacts.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const artifact of report.runtimeActivationContract.startupArtifacts.slice(0, 12)) {
      lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
    }
  }

  lines.push('');
  lines.push('### Runtime Dependencies');
  lines.push('');

  if (report.runtimeActivationContract.runtimeDependencies.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const dep of report.runtimeActivationContract.runtimeDependencies.slice(0, 12)) {
      lines.push(`- **${dep.label}** — ${dep.detail} (${dep.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Activation Steps');
  lines.push('');

  if (report.runtimeActivationContract.activationSteps.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const step of report.runtimeActivationContract.activationSteps.slice(0, 12)) {
      lines.push(`- **${step.label}** — ${step.detail} (${step.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Verification Requirements');
  lines.push('');

  for (const req of report.runtimeActivationContract.verificationRequirements.slice(0, 12)) {
    lines.push(`- **${req.label}** — ${req.detail} (${req.sourceAuthority})`);
  }

  lines.push('');
  lines.push('### Rollback Requirements');
  lines.push('');

  if (report.runtimeActivationContract.rollbackRequirements.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const req of report.runtimeActivationContract.rollbackRequirements.slice(0, 12)) {
      lines.push(`- **${req.label}** — ${req.detail} (${req.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Proof Artifacts');
  lines.push('');

  for (const artifact of report.runtimeActivationContract.proofArtifacts.slice(0, 12)) {
    lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
  }

  lines.push('');
  lines.push('## Runtime Activation Path');
  lines.push('');
  for (const step of report.runtimeActivationPath) {
    lines.push(`- ${step}`);
  }

  lines.push('');
  lines.push('## Missing Runtime Components');
  lines.push('');

  if (report.missingRuntimeComponents.length === 0) {
    lines.push('- None');
  } else {
    for (const missing of report.missingRuntimeComponents) {
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
  lines.push('## Runtime States');
  lines.push('');
  lines.push(RUNTIME_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of RUNTIME_ACTIVATION_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
