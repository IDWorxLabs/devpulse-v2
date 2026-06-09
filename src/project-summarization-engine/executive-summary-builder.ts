/**
 * Executive summary builder — founder-facing high-level summary.
 */

import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import type { ProjectSummary, SummarizationContext } from './project-summarization-types.js';

let summaryCounter = 0;

function nextId(): string {
  summaryCounter += 1;
  return `sum-exec-${summaryCounter.toString().padStart(4, '0')}`;
}

export function buildExecutiveSummary(ctx: SummarizationContext): ProjectSummary {
  const profile = getCurrentProjectProfile();
  const lines = [
    `${profile.name} is a governed chat-first intelligent development command center.`,
    `Current maturity: ${ctx.currentPhase}.`,
    `Foundation building is active — intelligence layers complete through Phase 12.4; execution remains deferred.`,
    `Key stacks: Command Center Brain, Project Understanding, Shared Memory, Timeline, Unified Decision Layer, Vault/Dependency/Workspace/History intelligence.`,
    `Next recommended step: ${profile.nextRecommendedStep}`,
    `Blocked gates: ${profile.blockedItems.length}. Missing capabilities: ${profile.missingCapabilities.length}.`,
  ];

  return {
    summaryId: nextId(),
    summaryType: 'EXECUTIVE',
    title: 'Executive Summary',
    body: lines.join('\n'),
    confidence: ctx.factCount > 20 ? 'HIGH' : 'MEDIUM',
    sourceCount: ctx.sources.length,
    sources: [...ctx.sources],
    readOnly: true,
  };
}

export function buildFounderSummary(ctx: SummarizationContext): ProjectSummary {
  const exec = buildExecutiveSummary(ctx);
  return {
    ...exec,
    summaryId: nextId(),
    title: 'Founder Summary',
    body: [
      'Founder-facing project summary:',
      exec.body,
      '',
      'Advisory only — no execution, deployment, or autonomous building performed.',
    ].join('\n'),
  };
}

export function resetExecutiveSummaryCounterForTests(): void {
  summaryCounter = 0;
}
