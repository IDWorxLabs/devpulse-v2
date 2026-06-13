/**
 * Founder Execution Proof — markdown report builder.
 */

import {
  FOUNDER_EXECUTION_PROOF_CORE_QUESTION,
  FOUNDER_EXECUTION_PROOF_PASS_TOKEN,
  FOUNDER_EXECUTION_PROOF_PHASE,
  FOUNDER_EXECUTION_PROOF_REPORT_TITLE,
  FOUNDER_EXECUTION_PROOF_SAFETY_GUARANTEES,
  FOUNDER_EXECUTION_STATES,
  LAUNCH_RECOMMENDATION_STATES,
  ORCHESTRATION_FLOW,
  REQUIRED_INPUT_AUTHORITIES,
} from './founder-execution-proof-registry.js';
import type { FounderExecutionProofAssessment } from './founder-execution-proof-types.js';

export function buildFounderExecutionProofReportMarkdown(
  assessment: FounderExecutionProofAssessment,
): string {
  const report = assessment.report;
  const bundle = report.proofBundle;
  const c = report.executionCompleteness;
  const qa = report.questionAnswers;

  const lines: string[] = [
    `# ${FOUNDER_EXECUTION_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    FOUNDER_EXECUTION_PROOF_PHASE,
    '',
    '## Core Question',
    '',
    FOUNDER_EXECUTION_PROOF_CORE_QUESTION,
    '',
    '## Orchestration Flow',
    '',
    ORCHESTRATION_FLOW.map((step, i) => `${i + 1}. ${step}`).join('\n'),
    '',
    '## Safety Guarantees',
    '',
    ...FOUNDER_EXECUTION_PROOF_SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Founder Execution Score',
    '',
    `**${report.founderExecutionScore}/100**`,
    '',
    '## Founder Execution State',
    '',
    `**${report.founderExecutionState}**`,
    '',
    '## Launch Recommendation',
    '',
    `**${report.launchRecommendation}** (confidence ${report.launchConfidence}/100)`,
    '',
    '## Execution Completeness',
    '',
    '| Area | Proof % |',
    '|------|---------|',
    `| Workspace | ${c.workspaceProofPercent}% |`,
    `| Build | ${c.buildProofPercent}% |`,
    `| Runtime | ${c.runtimeProofPercent}% |`,
    `| Preview | ${c.previewProofPercent}% |`,
    `| Verification | ${c.verificationProofPercent}% |`,
    `| Execution Chain | ${c.executionChainPercent}% |`,
    `| Launch Readiness | ${c.launchReadinessPercent}% |`,
    `| **Overall Founder Proof** | **${c.overallFounderProofPercent}%** |`,
    '',
    '## Required Questions',
    '',
    '| # | Question | Answer |',
    '|---|----------|--------|',
    `| 1 | Was a workspace actually created? | ${qa.workspaceActuallyCreated ? 'YES' : 'NO'} |`,
    `| 2 | Was a build actually executed? | ${qa.buildActuallyExecuted ? 'YES' : 'NO'} |`,
    `| 3 | Was a runtime actually activated? | ${qa.runtimeActuallyActivated ? 'YES' : 'NO'} |`,
    `| 4 | Was a preview actually activated? | ${qa.previewActuallyActivated ? 'YES' : 'NO'} |`,
    `| 5 | Was verification actually executed? | ${qa.verificationActuallyExecuted ? 'YES' : 'NO'} |`,
    `| 6 | Is the execution chain connected? | ${qa.executionChainConnected ? 'YES' : 'NO'} |`,
    `| 7 | Can founder inspect evidence? | ${qa.founderCanInspectEvidence ? 'YES' : 'NO'} |`,
    `| 8 | Are blockers present? | ${qa.blockersPresent ? 'YES' : 'NO'} |`,
    `| 9 | Is launch readiness proven? | ${qa.launchReadinessProven ? 'YES' : 'NO'} |`,
    `| 10 | Is founder execution proven? | ${qa.founderExecutionProven ? 'YES' : 'NO'} |`,
    '',
    '## Proof Bundle',
    '',
    `Bundle ID: \`${bundle.proofBundleId}\``,
    '',
    '### Stage Evidence',
    '',
    '| Stage | State | Proven | Proof % | Summary |',
    '|-------|-------|--------|---------|---------|',
    `| Workspace | ${bundle.workspaceEvidence.state} | ${bundle.workspaceEvidence.proven} | ${bundle.workspaceEvidence.proofPercent}% | ${bundle.workspaceEvidence.evidenceSummary} |`,
    `| Build | ${bundle.buildEvidence.state} | ${bundle.buildEvidence.proven} | ${bundle.buildEvidence.proofPercent}% | ${bundle.buildEvidence.evidenceSummary} |`,
    `| Runtime | ${bundle.runtimeEvidence.state} | ${bundle.runtimeEvidence.proven} | ${bundle.runtimeEvidence.proofPercent}% | ${bundle.runtimeEvidence.evidenceSummary} |`,
    `| Preview | ${bundle.previewEvidence.state} | ${bundle.previewEvidence.proven} | ${bundle.previewEvidence.proofPercent}% | ${bundle.previewEvidence.evidenceSummary} |`,
    `| Verification | ${bundle.verificationEvidence.state} | ${bundle.verificationEvidence.proven} | ${bundle.verificationEvidence.proofPercent}% | ${bundle.verificationEvidence.evidenceSummary} |`,
    '',
    '### Execution Chain',
    '',
    `- Connected: ${bundle.executionChainEvidence.connected}`,
    `- State: ${bundle.executionChainEvidence.state}`,
    `- Proof: ${bundle.executionChainEvidence.proofPercent}%`,
    `- ${bundle.executionChainEvidence.evidenceSummary}`,
    '',
    '### Launch Evidence',
    '',
    `- Launch readiness proven: ${bundle.launchEvidence.launchReadinessProven}`,
    `- Founder acceptance: ${bundle.launchEvidence.founderAcceptanceState}`,
    `- ${bundle.launchEvidence.evidenceSummary}`,
    '',
    '## Top Evidence',
    '',
  ];

  if (report.topEvidence.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.topEvidence) {
      lines.push(`- ${item}`);
    }
  }

  lines.push('', '## Top Blockers', '');
  if (report.topBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.topBlockers) {
      lines.push(`- ${item}`);
    }
  }

  lines.push('', '## Top Warnings', '');
  if (report.topWarnings.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.topWarnings) {
      lines.push(`- ${item}`);
    }
  }

  lines.push('', '## Missing Proof Areas', '');
  if (report.missingProofAreas.length === 0) {
    lines.push('- None');
  } else {
    for (const area of report.missingProofAreas) {
      lines.push(`- ${area}`);
    }
  }

  lines.push('', '## Recommended Next Actions', '');
  for (const action of report.recommendedNextActions) {
    lines.push(`- ${action}`);
  }

  lines.push('', '## Consumed Authorities', '');
  for (const authority of REQUIRED_INPUT_AUTHORITIES) {
    const missing = report.inputSnapshot.missingAuthorities.includes(authority);
    lines.push(`- ${authority}: ${missing ? 'MISSING' : 'consumed'}`);
  }

  lines.push('', '## Founder States', '');
  for (const state of FOUNDER_EXECUTION_STATES) {
    lines.push(`- ${state}`);
  }

  lines.push('', '## Launch Recommendation States', '');
  for (const state of LAUNCH_RECOMMENDATION_STATES) {
    lines.push(`- ${state}`);
  }

  lines.push('', '## Pass Token', '', FOUNDER_EXECUTION_PROOF_PASS_TOKEN, '');

  return lines.join('\n');
}
