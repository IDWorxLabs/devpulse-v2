/**
 * Connected Verification Foundation — markdown report builder.
 */

import {
  CONNECTED_VERIFICATION_CORE_QUESTION,
  CONNECTED_VERIFICATION_FOUNDATION_PASS_TOKEN,
  CONNECTED_VERIFICATION_PHASE,
  CONNECTED_VERIFICATION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
  VERIFICATION_READINESS_SAFETY_GUARANTEES,
  VERIFICATION_STATES,
} from './connected-verification-registry.js';
import type { ConnectedVerificationReport } from './connected-verification-types.js';

export function buildConnectedVerificationReportMarkdown(
  report: ConnectedVerificationReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_VERIFICATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_VERIFICATION_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_VERIFICATION_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Verification Readiness Score',
    '',
    `**${report.verificationReadinessScore}/100**`,
    '',
    '## Verification State',
    '',
    `**${report.verificationState}**`,
    '',
    '## Verification Completeness',
    '',
    `${report.verificationCompleteness}%`,
    '',
    '## Coverage Completeness',
    '',
    `${report.coverageCompleteness}%`,
    '',
    '## Proof Completeness',
    '',
    `${report.proofCompleteness}%`,
    '',
    '## Required Questions',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    `| Does preview readiness exist? | ${report.questionAnswers.previewReadinessExists ? 'YES' : 'NO'} |`,
    `| Does a verification candidate exist? | ${report.questionAnswers.verificationCandidateExists ? 'YES' : 'NO'} |`,
    `| Does a verification path exist? | ${report.questionAnswers.verificationPathExists ? 'YES' : 'NO'} |`,
    `| Are verification dependencies known? | ${report.questionAnswers.verificationDependenciesKnown ? 'YES' : 'NO'} |`,
    `| Is verification activation describable? | ${report.questionAnswers.verificationActivationDescribable ? 'YES' : 'NO'} |`,
    `| Is verification reproducible? | ${report.questionAnswers.verificationReproducible ? 'YES' : 'NO'} |`,
    `| Is verification traceable? | ${report.questionAnswers.verificationTraceable ? 'YES' : 'NO'} |`,
    `| Can a founder inspect verification readiness? | ${report.questionAnswers.founderInspectable ? 'YES' : 'NO'} |`,
    `| Is verification readiness measurable? | ${report.questionAnswers.verificationReadinessMeasurable ? 'YES' : 'NO'} |`,
    `| Is verification readiness proven? | ${report.questionAnswers.verificationReadinessProven ? 'YES' : 'NO'} |`,
    '',
    '## Verification Candidate',
    '',
    `Candidate ID: ${report.verificationCandidate.candidateId}`,
    `Workspace ID: ${report.verificationCandidate.workspaceId}`,
    `Preview Contract: ${report.verificationCandidate.previewReadinessContractId}`,
    `Verification Type: ${report.verificationCandidate.verificationType}`,
    `Verification Path: ${report.verificationCandidate.verificationPath ?? 'none modeled'}`,
    '',
    '## Verification Readiness Contract',
    '',
    `Contract ID: ${report.verificationReadinessContract.contractId}`,
    `Verification Type: ${report.verificationReadinessContract.verificationType}`,
    '',
    '### Verification Requirements',
    '',
  ];

  if (report.verificationReadinessContract.verificationRequirements.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const entry of report.verificationReadinessContract.verificationRequirements.slice(0, 12)) {
      lines.push(`- **${entry.label}** — ${entry.detail} (${entry.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Verification Artifacts');
  lines.push('');

  if (report.verificationReadinessContract.verificationArtifacts.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const artifact of report.verificationReadinessContract.verificationArtifacts.slice(0, 12)) {
      lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
    }
  }

  lines.push('');
  lines.push('### Verification Dependencies');
  lines.push('');

  if (report.verificationReadinessContract.verificationDependencies.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const dep of report.verificationReadinessContract.verificationDependencies.slice(0, 12)) {
      lines.push(`- **${dep.label}** — ${dep.detail} (${dep.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Verification Steps');
  lines.push('');

  if (report.verificationReadinessContract.verificationSteps.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const step of report.verificationReadinessContract.verificationSteps.slice(0, 12)) {
      lines.push(`- **${step.label}** — ${step.detail} (${step.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Verification Coverage');
  lines.push('');

  for (const coverage of report.verificationReadinessContract.verificationCoverage.slice(0, 12)) {
    lines.push(`- **${coverage.label}** — ${coverage.detail} (${coverage.sourceAuthority})`);
  }

  lines.push('');
  lines.push('### Rollback Requirements');
  lines.push('');

  if (report.verificationReadinessContract.rollbackRequirements.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const req of report.verificationReadinessContract.rollbackRequirements.slice(0, 12)) {
      lines.push(`- **${req.label}** — ${req.detail} (${req.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Proof Artifacts');
  lines.push('');

  for (const artifact of report.verificationReadinessContract.proofArtifacts.slice(0, 12)) {
    lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
  }

  lines.push('');
  lines.push('## Verification Path');
  lines.push('');
  for (const step of report.verificationPath) {
    lines.push(`- ${step}`);
  }

  lines.push('');
  lines.push('## Missing Verification Components');
  lines.push('');

  if (report.missingVerificationComponents.length === 0) {
    lines.push('- None');
  } else {
    for (const missing of report.missingVerificationComponents) {
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
  lines.push('## Verification States');
  lines.push('');
  lines.push(VERIFICATION_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of VERIFICATION_READINESS_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(CONNECTED_VERIFICATION_FOUNDATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
