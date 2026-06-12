/**
 * Connected Autonomous Build Execution Foundation — markdown report builder.
 */

import {
  BUILD_OUTPUT_SAFETY_GUARANTEES,
  BUILD_OUTPUT_STATES,
  CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
  CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS_TOKEN,
  CONNECTED_BUILD_EXECUTION_PHASE,
  CONNECTED_BUILD_EXECUTION_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
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
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Build Output Score',
    '',
    `**${report.buildOutputScore}/100**`,
    '',
    '## Build Output State',
    '',
    `**${report.buildOutputState}**`,
    '',
    '## Output Completeness',
    '',
    `${report.outputCompleteness}%`,
    '',
    '## Proof Completeness',
    '',
    `${report.proofCompleteness}%`,
    '',
    '## Required Questions',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    `| Does an execution plan exist? | ${report.questionAnswers.executionPlanExists ? 'YES' : 'NO'} |`,
    `| Does a valid change set exist? | ${report.questionAnswers.validChangeSetExists ? 'YES' : 'NO'} |`,
    `| Does a valid workspace blueprint exist? | ${report.questionAnswers.validWorkspaceBlueprintExists ? 'YES' : 'NO'} |`,
    `| Does a valid artifact manifest exist? | ${report.questionAnswers.validArtifactManifestExists ? 'YES' : 'NO'} |`,
    `| Are generated outputs traceable? | ${report.questionAnswers.outputsTraceable ? 'YES' : 'NO'} |`,
    `| Are outputs verifiable? | ${report.questionAnswers.outputsVerifiable ? 'YES' : 'NO'} |`,
    `| Are outputs reproducible? | ${report.questionAnswers.outputsReproducible ? 'YES' : 'NO'} |`,
    `| Can a founder inspect expected outputs? | ${report.questionAnswers.founderInspectable ? 'YES' : 'NO'} |`,
    `| Is the build chain complete? | ${report.questionAnswers.buildChainComplete ? 'YES' : 'NO'} |`,
    `| Is build output proven? | ${report.questionAnswers.buildOutputProven ? 'YES' : 'NO'} |`,
    '',
    '## Build Output Manifest',
    '',
    `Manifest ID: ${report.buildOutputManifest.manifestId}`,
    `Plan ID: ${report.buildOutputManifest.planId ?? 'none'}`,
    '',
    '### Files To Create',
    '',
  ];

  if (report.buildOutputManifest.filesToCreate.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const entry of report.buildOutputManifest.filesToCreate.slice(0, 12)) {
      lines.push(`- \`${entry.path}\` — ${entry.purpose} (${entry.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Files To Modify');
  lines.push('');

  if (report.buildOutputManifest.filesToModify.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const entry of report.buildOutputManifest.filesToModify.slice(0, 12)) {
      lines.push(`- \`${entry.path}\` — ${entry.purpose} (${entry.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Directories To Create');
  lines.push('');

  if (report.buildOutputManifest.directoriesToCreate.length === 0) {
    lines.push('- None modeled');
  } else {
    for (const entry of report.buildOutputManifest.directoriesToCreate.slice(0, 12)) {
      lines.push(`- \`${entry.path}\` — ${entry.purpose} (${entry.sourceAuthority})`);
    }
  }

  lines.push('');
  lines.push('### Expected Artifacts');
  lines.push('');

  for (const artifact of report.buildOutputManifest.expectedArtifacts.slice(0, 12)) {
    lines.push(`- **${artifact.name}** (${artifact.category}) — ${artifact.sourceAuthority}`);
  }

  lines.push('');
  lines.push('## Missing Build Components');
  lines.push('');

  if (report.missingBuildComponents.length === 0) {
    lines.push('- None');
  } else {
    for (const missing of report.missingBuildComponents) {
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
  lines.push('## Build Output States');
  lines.push('');
  lines.push(BUILD_OUTPUT_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of BUILD_OUTPUT_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
