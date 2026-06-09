/**
 * Project status model — structured status summary.
 */

import { getCurrentProjectProfile } from './project-profile-store.js';
import type { ProjectStatusSummary } from './project-understanding-types.js';

export function summarizeProjectStatus(): ProjectStatusSummary {
  const profile = getCurrentProjectProfile();
  const summaryLines = [
    `${profile.name} is in phase ${profile.currentPhase}.`,
    `Status: ${profile.status.replace(/_/g, ' ')}.`,
    `Completed milestones: ${profile.completedMilestones.length}.`,
    `Missing capabilities: ${profile.missingCapabilities.length}.`,
    `Blocked items: ${profile.blockedItems.length}.`,
    `Risk items: ${profile.riskItems.length}.`,
  ];

  return {
    projectId: profile.projectId,
    name: profile.name,
    status: profile.status,
    currentPhase: profile.currentPhase,
    completedCount: profile.completedMilestones.length,
    missingCount: profile.missingCapabilities.length,
    blockedCount: profile.blockedItems.length,
    riskCount: profile.riskItems.length,
    summaryLines,
  };
}

export function formatProjectStatusResponse(): string {
  const profile = getCurrentProjectProfile();
  const status = summarizeProjectStatus();
  return [
    `Project: ${profile.name}`,
    `Status: ${profile.status.replace(/_/g, ' ')}`,
    `Current Phase: ${profile.currentPhase}`,
    '',
    'Summary:',
    profile.summary,
    '',
    `Completed milestones: ${status.completedCount}`,
    `Missing capabilities: ${status.missingCount}`,
    `Blocked items: ${status.blockedCount}`,
    `Risk items: ${status.riskCount}`,
    '',
    'Project understanding only — no execution, file modification, or persistence.',
  ].join('\n');
}
