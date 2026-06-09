/**
 * Completion request parser.
 */

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `cmreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetCompletionRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseCompletionQuery(query: string): {
  requestId: string;
  query: string;
  title: string;
  goal: string;
} {
  const lower = query.toLowerCase().trim();
  let title = 'Completion Plan Request';
  let goal = 'Prepare completion safety plan without marking project complete';

  if (lower.includes('what defines completion') || lower.includes('what does success look like')) {
    title = 'Completion Definition';
    goal = 'Identify criteria that would define project completion';
  } else if (lower.includes('how do we know') || lower.includes('project is done') || lower.includes('project done')) {
    title = 'Project Completion Evidence';
    goal = 'Determine what evidence would prove project completion';
  } else if (lower.includes('show completion plan')) {
    title = 'Show Completion Plan';
    goal = 'Display proposal-only completion criteria and verification requirements';
  } else if (lower.includes('what evidence is missing')) {
    title = 'Missing Completion Evidence';
    goal = 'Identify evidence gaps blocking completion declaration';
  } else if (lower.includes('why is completion blocked')) {
    title = 'Completion Blockers';
    goal = 'Identify what prevents completion plan generation';
  } else if (lower.includes('what verification is still required') || lower.includes('verification required')) {
    title = 'Verification Requirements';
    goal = 'Record verification gates required before completion';
  }

  return { requestId: nextRequestId(), query, title, goal };
}
