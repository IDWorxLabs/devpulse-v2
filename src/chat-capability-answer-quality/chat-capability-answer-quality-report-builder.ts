/**
 * Phase 26.92 — Chat Capability Answer Quality report builder (V1).
 */

import {
  CAPABILITY_ANSWER_QUALITY_RULES,
  CAPABILITY_ANSWER_SCENARIOS,
  CHAT_CAPABILITY_ANSWER_QUALITY_CORE_QUESTION,
  CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE,
} from './chat-capability-answer-quality-registry.js';
import type { CapabilityAnswerRepairPlan, ChatCapabilityAnswerQualityReport } from './chat-capability-answer-quality-types.js';
import { planCapabilityAnswerRepair } from './answer-repair-planner.js';

export function buildChatCapabilityAnswerQualityReportMarkdown(
  report: ChatCapabilityAnswerQualityReport,
): string {
  const lines: string[] = [
    '# Chat Capability Answer Quality Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Quality ID: ${report.qualityId}`,
    '',
    '## Core Question',
    '',
    CHAT_CAPABILITY_ANSWER_QUALITY_CORE_QUESTION,
    '',
    '## Quality Rules',
    '',
    ...CAPABILITY_ANSWER_QUALITY_RULES.map((r) => `- ${r}`),
    '',
    '## Summary',
    '',
    `Average score: **${report.averageScore}** (target ≥ ${CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE})`,
    `All scenarios passed: **${report.allScenariosPassed ? 'yes' : 'no'}**`,
    report.passToken ? `Pass token: **${report.passToken}**` : 'Pass token: not issued',
    '',
    '## Scenario Audits',
    '',
  ];

  for (const audit of report.audits) {
    lines.push(`### ${audit.prompt}`);
    lines.push('');
    lines.push(`Scenario: \`${audit.scenarioId}\` | Passed: **${audit.passed ? 'yes' : 'no'}** | Score: **${audit.scores.overallCapabilityAnswerScore}**`);
    if (audit.failureClass) lines.push(`Failure class: ${audit.failureClass}`);
    lines.push('');
    lines.push('| Dimension | Score |');
    lines.push('|-----------|-------|');
    lines.push(`| Identity Clarity | ${audit.scores.identityClarity} |`);
    lines.push(`| Capability Accuracy | ${audit.scores.capabilityAccuracy} |`);
    lines.push(`| Honesty | ${audit.scores.honesty} |`);
    lines.push(`| Completeness | ${audit.scores.completeness} |`);
    lines.push(`| Usefulness | ${audit.scores.usefulness} |`);
    lines.push(`| Boundary Awareness | ${audit.scores.boundaryAwareness} |`);
    lines.push('');
    if (audit.missingTopics.length) {
      lines.push(`Missing topics: ${audit.missingTopics.join(', ')}`);
      lines.push('');
    }
    if (audit.honestyViolations.length) {
      lines.push(`Honesty violations: ${audit.honestyViolations.join('; ')}`);
      lines.push('');
    }
    lines.push('<details><summary>Answer excerpt</summary>');
    lines.push('');
    lines.push(audit.answer.slice(0, 600) + (audit.answer.length > 600 ? '…' : ''));
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  lines.push('## Target Scenarios');
  lines.push('');
  for (const scenario of CAPABILITY_ANSWER_SCENARIOS) {
    lines.push(`- **${scenario.prompt}** (\`${scenario.id}\`, stress: \`${scenario.stressScenarioId}\`)`);
  }

  return lines.join('\n');
}

export function buildChatCapabilityAnswerRepairReportMarkdown(input: {
  report: ChatCapabilityAnswerQualityReport;
  repairPlans: CapabilityAnswerRepairPlan[];
}): string {
  const lines: string[] = [
    '# Chat Capability Answer Repair Report',
    '',
    `Generated: ${input.report.generatedAt}`,
    '',
    '## Repairs Applied',
    '',
    'Foundational capability questions route through `buildRepairedCapabilityAnswer` before generic LLM drafting.',
    'Operational self-knowledge intercepts identity and capability scenarios for evidence-grounded canonical answers.',
    '',
    '## Repair Plans',
    '',
  ];

  for (const plan of input.repairPlans) {
    lines.push(`### ${plan.scenarioId}`);
    lines.push('');
    lines.push(`Repair required: **${plan.repairRequired ? 'yes' : 'no'}**`);
    if (plan.reason) lines.push(`Reason: ${plan.reason}`);
    if (plan.actions.length) {
      lines.push('');
      for (const action of plan.actions) {
        lines.push(`- ${action}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function buildRepairPlansFromReport(report: ChatCapabilityAnswerQualityReport): CapabilityAnswerRepairPlan[] {
  return report.audits.map((audit) =>
    planCapabilityAnswerRepair({
      scenarioId: audit.scenarioId,
      missingTopics: audit.missingTopics,
      honestyViolations: audit.honestyViolations,
      boundaryIssues: audit.boundaryIssues,
      passed: audit.passed,
    }),
  );
}

export function buildChatCapabilityAnswerValidationMarkdown(report: ChatCapabilityAnswerQualityReport): string {
  const lines: string[] = [
    '# Chat Capability Answer Validation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Validation Checks',
    '',
  ];

  for (const audit of report.audits) {
    lines.push(`- [${audit.passed ? 'x' : ' '}] ${audit.prompt} — score ${audit.scores.overallCapabilityAnswerScore}`);
  }

  lines.push('');
  lines.push(`- [${report.averageScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE ? 'x' : ' '}] Average score ≥ ${CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE} (${report.averageScore})`);
  lines.push(`- [${report.allScenariosPassed ? 'x' : ' '}] All scenarios passed`);
  lines.push(`- [${report.passToken ? 'x' : ' '}] Pass token issued`);
  lines.push('');
  lines.push(report.passToken ? `**${report.passToken}**` : 'Validation did not pass.');

  return lines.join('\n');
}
