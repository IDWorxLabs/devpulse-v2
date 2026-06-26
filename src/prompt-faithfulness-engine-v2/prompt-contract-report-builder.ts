/**
 * Prompt Faithfulness Engine V2 — contract report builder.
 */

import { formatFaithfulnessScorePercent } from './prompt-faithfulness-scorer.js';
import type { PromptFaithfulnessV2Result } from './prompt-faithfulness-v2-types.js';

export function buildPromptFaithfulnessContractReport(result: PromptFaithfulnessV2Result): string {
  const lines: string[] = [
    '# Prompt Evidence Contract Report',
    '',
    `**Contract ID:** ${result.contract.id}`,
    `**Prompt Hash:** ${result.contract.promptHash}`,
    `**Version:** ${result.contract.version}`,
    `**Faithfulness Score:** ${formatFaithfulnessScorePercent(result.faithfulnessScore)}`,
    `**Ready for Generation:** ${result.readyForGeneration ? 'YES' : 'NO'}`,
    '',
    '## Evidence Summary',
    `- Total evidence items: ${result.contract.requirements.length}`,
    `- Mandatory requirements: ${result.contract.mandatoryRequirements.length}`,
    `- Optional requirements: ${result.contract.optionalRequirements.length}`,
    `- Constraints: ${result.contract.constraints.length}`,
    `- Non-goals: ${result.contract.nonGoals.length}`,
    '',
    '## Requirement Registry',
  ];

  for (const req of result.requirements.slice(0, 20)) {
    lines.push(`- **${req.requirementId}** [${req.priority}] ${req.description.slice(0, 80)}`);
  }
  if (result.requirements.length > 20) {
    lines.push(`- ... and ${result.requirements.length - 20} more`);
  }

  lines.push('', '## Knowledge Graph', `Root: ${result.knowledgeGraph.rootNodeId}`, `Nodes: ${result.knowledgeGraph.nodes.length}`);

  lines.push('', '## Coverage Metrics');
  const m = result.faithfulnessScore.metrics;
  lines.push(
    `- Prompt: ${(m.promptCoverage * 100).toFixed(1)}%`,
    `- Functional: ${(m.functionalCoverage * 100).toFixed(1)}%`,
    `- Behavior: ${(m.behaviorCoverage * 100).toFixed(1)}%`,
    `- Interaction: ${(m.interactionCoverage * 100).toFixed(1)}%`,
    `- Navigation: ${(m.navigationCoverage * 100).toFixed(1)}%`,
    `- Accessibility: ${(m.accessibilityCoverage * 100).toFixed(1)}%`,
  );

  if (result.conflicts.length) {
    lines.push('', '## Conflicts');
    for (const c of result.conflicts) {
      lines.push(`- ${c.summary}`);
    }
  }

  if (result.ambiguities.length) {
    lines.push('', '## Ambiguities');
    for (const a of result.ambiguities) {
      lines.push(`- ${a.clarificationQuestion}`);
    }
  }

  if (result.unsupportedAssumptions.length) {
    lines.push('', '## Rejected Assumptions');
    for (const a of result.unsupportedAssumptions) {
      lines.push(`- ${a.assumedCapability}: ${a.reason}`);
    }
  }

  if (result.blockedReason) {
    lines.push('', '## Blocked', result.blockedReason);
  }

  return lines.join('\n');
}
