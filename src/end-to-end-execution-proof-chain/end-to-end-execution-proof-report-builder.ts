/**
 * End-to-End Execution Proof Chain — markdown report builder.
 */

import {
  END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
  END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN,
  END_TO_END_EXECUTION_PROOF_PHASE,
  END_TO_END_EXECUTION_PROOF_REPORT_TITLE,
  END_TO_END_PROOF_SAFETY_GUARANTEES,
  ORCHESTRATION_FLOW,
  PROOF_STATES,
  REQUIRED_INPUT_AUTHORITIES,
} from './end-to-end-execution-proof-registry.js';
import type { EndToEndExecutionProofReport } from './end-to-end-execution-proof-types.js';

export function buildEndToEndExecutionProofReportMarkdown(
  report: EndToEndExecutionProofReport,
): string {
  const bundle = report.proofBundle;
  const lines: string[] = [
    `# ${END_TO_END_EXECUTION_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
    '',
    '## Phase',
    '',
    END_TO_END_EXECUTION_PROOF_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Input Authorities',
    '',
    ...REQUIRED_INPUT_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Connected Execution Score',
    '',
    `**${report.connectedExecutionScore}/100**`,
    '',
    '## Proof State',
    '',
    `**${report.proofState}**`,
    '',
    '## Chain Completeness',
    '',
    `${report.chainCompletenessPercent}%`,
    '',
    '## Execution Confidence',
    '',
    `${report.executionConfidence}/100`,
    '',
    '## Required Questions',
    '',
    '| Question | Answer |',
    '|----------|--------|',
    `| Is build output proven? | ${report.questionAnswers.buildOutputProven ? 'YES' : 'NO'} |`,
    `| Is runtime readiness proven? | ${report.questionAnswers.runtimeReadinessProven ? 'YES' : 'NO'} |`,
    `| Is preview readiness proven? | ${report.questionAnswers.previewReadinessProven ? 'YES' : 'NO'} |`,
    `| Is verification readiness proven? | ${report.questionAnswers.verificationReadinessProven ? 'YES' : 'NO'} |`,
    `| Are all stages connected? | ${report.questionAnswers.allStagesConnected ? 'YES' : 'NO'} |`,
    `| Are all stages traceable? | ${report.questionAnswers.allStagesTraceable ? 'YES' : 'NO'} |`,
    `| Are all stages reproducible? | ${report.questionAnswers.allStagesReproducible ? 'YES' : 'NO'} |`,
    `| Can a founder inspect proof? | ${report.questionAnswers.founderInspectable ? 'YES' : 'NO'} |`,
    `| Is execution confidence measurable? | ${report.questionAnswers.executionConfidenceMeasurable ? 'YES' : 'NO'} |`,
    `| Is connected execution proven? | ${report.questionAnswers.connectedExecutionProven ? 'YES' : 'NO'} |`,
    '',
    '## Stage Proof Summary',
    '',
    '| Stage | State | Score | Proven |',
    '|-------|-------|-------|--------|',
    `| BUILD | ${bundle.buildProof.state} | ${bundle.buildProof.score} | ${bundle.buildProof.proven ? 'YES' : 'NO'} |`,
    `| RUNTIME | ${bundle.runtimeProof.state} | ${bundle.runtimeProof.score} | ${bundle.runtimeProof.proven ? 'YES' : 'NO'} |`,
    `| PREVIEW | ${bundle.previewProof.state} | ${bundle.previewProof.score} | ${bundle.previewProof.proven ? 'YES' : 'NO'} |`,
    `| VERIFICATION | ${bundle.verificationProof.state} | ${bundle.verificationProof.score} | ${bundle.verificationProof.proven ? 'YES' : 'NO'} |`,
    '',
    '## Chain Gaps',
    '',
  ];

  if (bundle.chainGaps.length === 0) {
    lines.push('- None');
  } else {
    for (const gap of bundle.chainGaps) {
      lines.push(`- **${gap.fromStage} → ${gap.toStage}**: ${gap.detail}`);
    }
  }

  lines.push('');
  lines.push('## Blocking Stages');
  lines.push('');

  if (report.blockingStages.length === 0) {
    lines.push('- None');
  } else {
    for (const stage of report.blockingStages) {
      lines.push(`- ${stage}`);
    }
  }

  lines.push('');
  lines.push('## Warning Stages');
  lines.push('');

  if (report.warningStages.length === 0) {
    lines.push('- None');
  } else {
    for (const stage of report.warningStages) {
      lines.push(`- ${stage}`);
    }
  }

  lines.push('');
  lines.push('## Proof Artifacts');
  lines.push('');

  for (const artifact of bundle.proofArtifacts.slice(0, 16)) {
    lines.push(`- **${artifact.name}** (${artifact.stage}/${artifact.category}) — ${artifact.sourceAuthority}`);
  }

  lines.push('');
  lines.push('## Confidence Factors');
  lines.push('');

  for (const factor of bundle.confidenceFactors) {
    lines.push(`- **${factor.label}** (weight ${factor.weight}) — ${factor.detail} (${factor.sourceAuthority})`);
  }

  lines.push('');
  lines.push('## Missing Chain Links');
  lines.push('');

  if (report.missingChainLinks.length === 0) {
    lines.push('- None');
  } else {
    for (const missing of report.missingChainLinks) {
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
  lines.push('## Proof States');
  lines.push('');
  lines.push(PROOF_STATES.join(' · '));
  lines.push('');
  lines.push('## Runtime Safeguards');
  lines.push('');
  for (const guarantee of END_TO_END_PROOF_SAFETY_GUARANTEES) {
    lines.push(`- ${guarantee}`);
  }
  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
