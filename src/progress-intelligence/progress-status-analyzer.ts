/**
 * Progress status analyzer — per-project status levels.
 */

import type { ProgressRecord, ProgressStatus, ProgressStatusLevel } from './progress-intelligence-types.js';

let statusCounter = 0;

function nextStatusId(): string {
  statusCounter += 1;
  return `psta-${statusCounter.toString().padStart(4, '0')}`;
}

export function analyzeProgressStatuses(records: ProgressRecord[]): ProgressStatus[] {
  return records.map((record) => {
    let level: ProgressStatusLevel = 'IN_PROGRESS';
    if (record.percentComplete >= 85 && record.blocked.length === 0) level = 'COMPLETE';
    else if (record.blocked.length > 0) level = 'BLOCKED';
    else if (record.percentComplete < 30) level = 'NOT_STARTED';
    else if (record.remaining.length > record.completed.length) level = 'DEFERRED';

    return {
      statusId: nextStatusId(),
      level,
      summary: `${record.projectName}: ${level} at ${record.percentComplete}% — ${record.phase}`,
      visibilityOnly: true,
    };
  });
}

export function resetProgressStatusCounterForTests(): void {
  statusCounter = 0;
}
