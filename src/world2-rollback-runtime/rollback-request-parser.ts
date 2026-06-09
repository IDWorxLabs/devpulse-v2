/**
 * Rollback request parser.
 */

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `rbreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetRollbackRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseRollbackQuery(query: string): {
  requestId: string;
  query: string;
  title: string;
  goal: string;
} {
  const lower = query.toLowerCase().trim();
  let title = 'Rollback Plan Request';
  let goal = 'Prepare rollback safety plan without performing rollback';

  if (lower.includes('can world 2 roll back') || lower.includes('can this change be reversed')) {
    title = 'Can World 2 Roll Back';
    goal = 'Determine rollback safety requirements before future apply';
  } else if (lower.includes('show rollback plan')) {
    title = 'Show Rollback Plan';
    goal = 'Display proposal-only rollback steps and snapshot requirements';
  } else if (lower.includes('what rollback safety')) {
    title = 'Rollback Safety Requirements';
    goal = 'Identify rollback safety gates and approvals';
  } else if (lower.includes('why is rollback blocked')) {
    title = 'Rollback Blockers';
    goal = 'Identify what prevents rollback plan generation';
  } else if (lower.includes('what snapshots are required')) {
    title = 'Snapshot Requirements';
    goal = 'Record required pre-apply snapshot strategy';
  }

  return { requestId: nextRequestId(), query, title, goal };
}
