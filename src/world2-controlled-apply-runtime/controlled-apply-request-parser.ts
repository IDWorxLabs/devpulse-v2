/**
 * Controlled apply request parser.
 */

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `capreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetControlledApplyRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseControlledApplyQuery(query: string): {
  requestId: string;
  query: string;
  title: string;
  goal: string;
} {
  const lower = query.toLowerCase().trim();
  let title = 'Controlled Apply Request';
  let goal = 'Convert execution packet into controlled apply plan without performing apply';

  if (lower.includes('can this apply')) {
    title = 'Can This Apply';
    goal = 'Determine whether controlled apply plan can be generated';
  } else if (lower.includes('why is apply blocked')) {
    title = 'Why Is Apply Blocked';
    goal = 'Identify blockers preventing controlled apply plan generation';
  } else if (lower.includes('what approvals are required')) {
    title = 'Apply Approval Requirements';
    goal = 'Record approvals required before any future apply';
  } else if (lower.includes('show apply plan')) {
    title = 'Show Apply Plan';
    goal = 'Display controlled apply plan steps and gates';
  } else if (lower.includes('what would world 2 need before apply')) {
    title = 'World 2 Pre-Apply Requirements';
    goal = 'Determine what World 2 would need before governed apply';
  }

  return { requestId: nextRequestId(), query, title, goal };
}
