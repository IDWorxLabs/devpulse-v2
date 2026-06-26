/**
 * Continuous Product Improvement Engine — pipeline report builder.
 */

import type { ContinuousImprovementPipelineResult } from './continuous-improvement-types.js';

export function buildContinuousImprovementPipelineReport(
  result: ContinuousImprovementPipelineResult,
): string {
  return [
    '# Continuous Product Improvement Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Verdict:** ${result.permissionVerdict}`,
    `**Blocked:** ${result.blockedReason ?? 'none'}`,
    `**Quality Score:** ${result.qualityScore.overallScore}/100`,
    '',
    '## Improvement Signals',
    ...result.signals.map((s) => `- [${s.source}] ${s.kind}: ${s.observedResult}`),
    '',
    '## Opportunities',
    ...result.rankedOpportunities.map(
      (o) => `- ${o.opportunityId} (${o.priority}): ${o.category} — ${o.summary}`,
    ),
    '',
    '## Safety Assessments',
    ...result.safetyAssessments.map(
      (s) => `- ${s.opportunityId}: ${s.safe ? 'SAFE' : 'BLOCKED'} — ${s.blockedReason ?? 'ok'}`,
    ),
    '',
    '## Improvement Loops',
    ...result.improvementLoops.map(
      (l) =>
        `- ${l.loopId}: ${l.resolved ? 'APPLIED' : l.deferred ? 'DEFERRED' : l.blocked ? 'BLOCKED' : 'FAILED'} (${l.attempts.length} attempts)`,
    ),
    '',
    '## Deferred',
    ...result.deferredOpportunities.map((d) => `- ${d.opportunityId}: ${d.reason}`),
    '',
    '## Blocked',
    ...result.blockedOpportunities.map((b) => `- ${b.opportunityId}: ${b.reason}`),
    '',
    '## Residual Risk',
    ...result.qualityScore.residualRisk.map((r) => `- ${r}`),
  ].join('\n');
}
