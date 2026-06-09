/**
 * Preview request parser.
 */

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `pvreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetPreviewRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parsePreviewQuery(query: string): {
  requestId: string;
  query: string;
  title: string;
  goal: string;
} {
  const lower = query.toLowerCase().trim();
  let title = 'Live Preview Runtime Request';
  let goal = 'Represent and manage preview targets without launching browsers';

  if (lower.includes('what preview targets exist')) {
    title = 'Preview Targets';
    goal = 'List registered preview target metadata';
  } else if (lower.includes('show preview session')) {
    title = 'Preview Session';
    goal = 'Display preview session state and capabilities';
  } else if (lower.includes('can this project be previewed')) {
    title = 'Preview Eligibility';
    goal = 'Determine whether project can be previewed';
  } else if (lower.includes('what preview capabilities')) {
    title = 'Preview Capabilities';
    goal = 'Track capability availability without implementing them';
  } else if (lower.includes('why is preview blocked')) {
    title = 'Preview Blockers';
    goal = 'Identify what prevents preview runtime readiness';
  }

  return { requestId: nextRequestId(), query, title, goal };
}
