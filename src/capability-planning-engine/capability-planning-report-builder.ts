/**
 * Capability Planning Engine Era 3 — pipeline report builder.
 */

import type { CapabilityPlanningPipelineResult } from './capability-planning-types.js';

export function buildCapabilityPlanningPipelineReport(result: CapabilityPlanningPipelineResult): string {
  const lines = [
    '# Capability Planning Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Permission Verdict:** ${result.permissionVerdict}`,
    `**Required Capabilities:** ${result.requiredCapabilities.length}`,
    '',
    '## Required Capabilities',
    ...result.requiredCapabilities.map((r) => `- ${r.name} [${r.category}]${r.mandatory ? ' (mandatory)' : ''}`),
    '',
    '## Gap Analysis',
    ...result.gaps.map(
      (g) =>
        `- ${g.requiredCapability.name}: ${g.decision} (confidence ${Math.round(g.matchConfidence * 100)}%, coverage ${Math.round(g.coveragePercentage * 100)}%)`,
    ),
  ];

  if (result.compositions.length) {
    lines.push('', '## Composed Capabilities');
    for (const c of result.compositions) {
      lines.push(`- ${c.name} from ${c.sourceCapabilityIds.join(', ')}`);
    }
  }

  if (result.generationPlans.length) {
    lines.push('', '## Generation Plans');
    for (const g of result.generationPlans) {
      lines.push(`- ${g.capabilityName} (risk: ${g.riskLevel})`);
    }
  }

  if (result.blockedReason) {
    lines.push('', '## Blocked', result.blockedReason);
  }

  return lines.join('\n');
}
