/**
 * Progress model builder — assembles progress records from intelligence sources.
 */

import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { readPortfolioProjects } from '../portfolio-intelligence/index.js';
import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { calculatePercentComplete } from './progress-percentage-calculator.js';
import { resolveNextMilestone } from './progress-milestone-analyzer.js';
import type { ProgressRecord } from './progress-intelligence-types.js';

let progressCounter = 0;

function nextProgressId(): string {
  progressCounter += 1;
  return `pgr-${progressCounter.toString().padStart(4, '0')}`;
}

function buildRecordForProject(opts: {
  projectId: string;
  projectName: string;
  phase: string;
  completed: string[];
  remaining: string[];
  blocked: string[];
  nextMilestone: string;
  ahead: boolean;
  behind: boolean;
}): ProgressRecord {
  const { percentComplete, confidence } = calculatePercentComplete(
    opts.completed.length,
    opts.remaining.length,
    opts.blocked.length,
  );

  return {
    progressId: nextProgressId(),
    projectId: opts.projectId,
    projectName: opts.projectName,
    phase: opts.phase,
    completed: opts.completed,
    remaining: opts.remaining,
    blocked: opts.blocked,
    percentComplete,
    confidence,
    milestone: opts.completed[opts.completed.length - 1] ?? 'Foundation started',
    nextMilestone: opts.nextMilestone,
    summary: `${opts.projectName} is ${percentComplete}% complete (${opts.phase}).`,
    aheadOfSchedule: opts.ahead,
    behindSchedule: opts.behind,
    visibilityOnly: true,
  };
}

export function buildProgressRecords(query: string): ProgressRecord[] {
  buildProjectHistorySnapshot(query);
  const profile = getCurrentProjectProfile();
  const roadmap = getBrainRoadmapContext();
  const portfolio = readPortfolioProjects(query);
  const nextMilestone = resolveNextMilestone(query);

  const records: ProgressRecord[] = [];

  records.push(
    buildRecordForProject({
      projectId: profile.projectId,
      projectName: profile.name,
      phase: roadmap.currentPhase,
      completed: [...profile.completedMilestones],
      remaining: [...profile.missingCapabilities],
      blocked: [...profile.blockedItems],
      nextMilestone,
      ahead: profile.completedMilestones.length > 15,
      behind: profile.blockedItems.length > 2,
    }),
  );

  for (const project of portfolio) {
    if (project.projectId === profile.projectId) continue;
    records.push(
      buildRecordForProject({
        projectId: project.projectId,
        projectName: project.projectName,
        phase: project.phase,
        completed: project.health === 'EXCELLENT' || project.health === 'GOOD' ? ['Foundation milestones'] : [],
        remaining: project.blocked ? ['Blocked gates'] : ['Intelligence layers'],
        blocked: project.blocked ? ['Governance gate'] : [],
        nextMilestone: `${project.projectName} next phase`,
        ahead: project.health === 'EXCELLENT',
        behind: project.blocked || project.health === 'POOR',
      }),
    );
  }

  return records;
}

export function resetProgressRecordCounterForTests(): void {
  progressCounter = 0;
}
