/**
 * Project health builder — health, risk, and blocker summaries.
 */

import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { buildTimelineState } from '../timeline-intelligence/timeline-state-model.js';
import type { ProjectSummary, SummarizationContext } from './project-summarization-types.js';

let summaryCounter = 0;

function nextId(): string {
  summaryCounter += 1;
  return `sum-health-${summaryCounter.toString().padStart(4, '0')}`;
}

export function buildProjectHealthSummary(ctx: SummarizationContext): ProjectSummary {
  const profile = getCurrentProjectProfile();
  const timeline = buildTimelineState();
  const healthScore =
    ctx.blockerCount === 0 && ctx.riskCount < 5
      ? 'STRONG'
      : ctx.blockerCount < 3
        ? 'STABLE'
        : 'NEEDS_ATTENTION';

  const lines = [
    `Project health: ${healthScore}`,
    `Status: ${profile.status.replace(/_/g, ' ')}`,
    `Blockers: ${ctx.blockerCount} (profile + timeline)`,
    `Risks: ${ctx.riskCount}`,
    `Missing capabilities: ${profile.missingCapabilities.length}`,
    `Timeline blockers: ${timeline.activeBlockers.length}`,
    `Recommendation: Complete intelligence foundations before execution runtime.`,
  ];

  return {
    summaryId: nextId(),
    summaryType: 'PROJECT_HEALTH',
    title: 'Project Health Summary',
    body: lines.join('\n'),
    confidence: ctx.factCount > 15 ? 'HIGH' : 'MEDIUM',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources],
    readOnly: true,
  };
}

export function buildRiskSummary(ctx: SummarizationContext): ProjectSummary {
  const profile = getCurrentProjectProfile();
  const timeline = buildTimelineState();
  const lines = ['Risk and blocker summary:', 'Blockers:'];
  for (const b of profile.blockedItems.slice(0, 5)) {
    lines.push(`• ${b}`);
  }
  for (const b of timeline.activeBlockers.slice(0, 3)) {
    lines.push(`• ${b}`);
  }
  lines.push('', 'Risks:');
  for (const r of profile.riskItems.slice(0, 5)) {
    lines.push(`• ${r}`);
  }

  return {
    summaryId: nextId(),
    summaryType: 'RISK',
    title: 'Risk Summary',
    body: lines.join('\n'),
    confidence: 'HIGH',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources],
    readOnly: true,
  };
}

export function resetProjectHealthCounterForTests(): void {
  summaryCounter = 0;
}
