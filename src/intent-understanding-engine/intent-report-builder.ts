/**
 * Intent Understanding Engine — markdown report builder.
 */

import type { IntentUnderstandingResult, ProductIntelligenceModel } from './intent-understanding-types.js';

export function buildIntentUnderstandingReportMarkdown(
  model: ProductIntelligenceModel,
  result?: Pick<IntentUnderstandingResult, 'readyForGeneration' | 'blockedReason'>,
): string {
  const lines: string[] = [
    '# Product Intelligence Model',
    '',
    `**Model ID:** ${model.modelId}`,
    `**Product:** ${model.product.productName}`,
    `**Type:** ${model.product.productType}`,
    `**Industry:** ${model.product.industry}`,
    `**Overall Confidence:** ${Math.round(model.confidence.overallConfidence * 100)}%`,
    `**Ready for Generation:** ${result?.readyForGeneration ?? model.confidence.meetsOverallThreshold ? 'YES' : 'NO'}`,
    '',
    '## Product Identity',
    `- Purpose: ${model.product.purpose}`,
    `- Primary Objective: ${model.product.primaryObjective}`,
    `- Value Proposition: ${model.product.coreValueProposition}`,
    '',
    '## Target Users',
    ...model.users.map((u) => `- ${u.isPrimary ? '**Primary**' : 'Secondary'}: ${u.role} — ${u.description}`),
    '',
    '## User Goals',
    `- Opening Reason: ${model.goals.openingReason}`,
    '- Accomplishments:',
    ...model.goals.accomplishments.map((a) => `  - ${a}`),
  ];

  lines.push('', '## Features');
  for (const feature of model.features) {
    lines.push(`- [${feature.priority}] ${feature.label}${feature.moduleId ? ` (${feature.moduleId})` : ''}`);
  }

  lines.push('', '## Workflows');
  for (const workflow of model.workflows) {
    lines.push(`### ${workflow.name}`);
    for (const step of workflow.steps) {
      lines.push(`${step.order}. ${step.label}${step.optional ? ' (optional)' : ''}`);
    }
  }

  lines.push(
    '',
    '## Interactions',
    model.interactions.modes.join(', '),
    '',
    '## Platform',
    `Primary: ${model.platform.primaryTarget}`,
    `Targets: ${model.platform.targets.join(', ')}`,
    '',
    '## Navigation',
    `Primary Pattern: ${model.navigation.primaryPattern}`,
    `Patterns: ${model.navigation.patterns.join(', ')}`,
    '',
    '## Accessibility',
    ...model.accessibility.mandatoryConstraints.map((c) => `- **Mandatory:** ${c}`),
    ...(model.accessibility.wcagLevel ? [`- WCAG: ${model.accessibility.wcagLevel}`] : []),
    '',
    '## Behavior Model',
    model.behavior.primaryFlow.join(' → '),
    '',
    '## Architecture Hints',
    `- Profile: ${model.architecture.suggestedProfile ?? 'none'}`,
    `- Modules: ${model.architecture.moduleIds.join(', ')}`,
    '',
    '## Confidence by Category',
  );

  for (const cat of model.confidence.categories) {
    lines.push(`- ${cat.category}: ${Math.round(cat.score * 100)}% ${cat.meetsThreshold ? '✓' : '✗'}`);
  }

  if (result?.blockedReason) {
    lines.push('', `## Blocked Reason`, result.blockedReason);
  }

  return lines.join('\n');
}
