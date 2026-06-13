/**
 * Requirements-to-Plan Execution Contract — markdown report builder.
 */

import {
  REQUIREMENTS_TO_PLAN_CONTRACT_CORE_QUESTION,
  REQUIREMENTS_TO_PLAN_CONTRACT_PHASE,
  REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN,
  REQUIREMENTS_TO_PLAN_CONTRACT_REPORT_TITLE,
} from './requirements-to-plan-contract-registry.js';
import type { RequirementsToPlanContractReport } from './requirements-to-plan-contract-types.js';

export function buildRequirementsToPlanContractReportMarkdown(
  report: RequirementsToPlanContractReport,
): string {
  const lines: string[] = [
    `# ${REQUIREMENTS_TO_PLAN_CONTRACT_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    REQUIREMENTS_TO_PLAN_CONTRACT_CORE_QUESTION,
    '',
    '## Phase',
    '',
    REQUIREMENTS_TO_PLAN_CONTRACT_PHASE,
    '',
    '## Proof Level',
    '',
    `**${report.proofLevel}**`,
    '',
    '## User Idea Contract',
    '',
    `- ideaId: ${report.userIdea.ideaId}`,
    `- status: ${report.userIdea.status}`,
    `- normalizedGoal: ${report.userIdea.normalizedGoal}`,
    `- productType: ${report.userIdea.productType}`,
    `- confidence: ${report.userIdea.confidence}/100`,
    '',
    '## Extracted Requirements',
    '',
  ];

  if (!report.requirementContract || report.requirementContract.requirements.length === 0) {
    lines.push('- None');
  } else {
    lines.push('| ID | Type | Priority | Description |');
    lines.push('|----|------|----------|-------------|');
    for (const req of report.requirementContract.requirements) {
      lines.push(
        `| ${req.requirementId} | ${req.requirementType} | ${req.priority} | ${req.description} |`,
      );
    }
  }

  lines.push('');
  lines.push('## Clarifying Gaps');
  lines.push('');
  lines.push(`Readiness: **${report.clarifyingGaps.contractReadiness}**`);
  if (report.clarifyingGaps.clarifyingQuestions.length === 0) {
    lines.push('- No critical clarifying questions');
  } else {
    for (const q of report.clarifyingGaps.clarifyingQuestions) {
      lines.push(`- ${q}`);
    }
  }

  lines.push('');
  lines.push('## Plan Tasks');
  lines.push('');
  if (!report.planContract || report.planContract.tasks.length === 0) {
    lines.push('- None');
  } else {
    lines.push('| Task | Layer | Requirements | Title |');
    lines.push('|------|-------|--------------|-------|');
    for (const task of report.planContract.tasks) {
      lines.push(
        `| ${task.taskId} | ${task.layer} | ${task.sourceRequirementIds.join(', ')} | ${task.title} |`,
      );
    }
  }

  lines.push('');
  lines.push('## Build-Ready Contract');
  lines.push('');
  if (!report.buildReadyContract) {
    lines.push('- Not generated');
  } else {
    const c = report.buildReadyContract;
    lines.push(`- contractId: ${c.contractId}`);
    lines.push(`- readinessState: **${c.readinessState}**`);
    lines.push(`- confidence: ${c.confidence}/100`);
    lines.push(`- buildUnits: ${c.buildUnits.length}`);
    lines.push(`- executionOrder: ${c.executionOrder.join(' → ')}`);
  }

  lines.push('');
  lines.push('## Linkage Analysis');
  lines.push('');
  lines.push(`- linkageConnected: **${report.linkageAnalysis.linkageConnected ? 'YES' : 'NO'}**`);
  lines.push(`- traceabilityScore: ${report.linkageAnalysis.traceabilityScore}/100`);
  lines.push(`- firstBrokenLink: ${report.linkageAnalysis.firstBrokenLink ?? 'none'}`);

  lines.push('');
  lines.push('## Missing Evidence');
  lines.push('');
  for (const item of report.missingEvidence) {
    lines.push(`- ${item}`);
  }

  lines.push('');
  lines.push('## Recommended Fix');
  lines.push('');
  lines.push(report.recommendedFix);
  lines.push('');
  lines.push(`Pass token: \`${REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}

export function formatRequirementsToPlanContractSummary(
  report: RequirementsToPlanContractReport,
): string {
  return (
    `Requirements-to-Plan Contract: ${report.proofLevel} — ` +
    `readiness ${report.buildReadyContract?.readinessState ?? 'NONE'}, ` +
    `linkage ${report.linkageAnalysis.linkageConnected ? 'connected' : 'broken'}.`
  );
}
