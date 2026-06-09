/**
 * Recovery request parser.
 */

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `rcreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetRecoveryRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseRecoveryQuery(query: string): {
  requestId: string;
  query: string;
  title: string;
  goal: string;
} {
  const lower = query.toLowerCase().trim();
  let title = 'Recovery Plan Request';
  let goal = 'Prepare recovery safety plan without performing recovery';

  if (lower.includes('what happens if apply fails')) {
    title = 'Apply Failure Recovery';
    goal = 'Determine recovery path if controlled apply fails';
  } else if (lower.includes('what happens if verification fails')) {
    title = 'Verification Failure Recovery';
    goal = 'Determine recovery path if runtime verification fails';
  } else if (lower.includes('what happens if rollback fails')) {
    title = 'Rollback Failure Recovery';
    goal = 'Determine recovery path if rollback fails';
  } else if (lower.includes('show recovery plan')) {
    title = 'Show Recovery Plan';
    goal = 'Display proposal-only recovery steps and escalation requirements';
  } else if (lower.includes('why is recovery blocked')) {
    title = 'Recovery Blockers';
    goal = 'Identify what prevents recovery plan generation';
  } else if (lower.includes('what recovery strategy')) {
    title = 'Recovery Strategy';
    goal = 'Identify required recovery strategy for failure context';
  } else if (lower.includes('self-evolution') || lower.includes('self evolution')) {
    title = 'Self-Evolution Escalation';
    goal = 'Evaluate whether failure requires self-evolution review';
  } else if (lower.includes('3 failed') || lower.includes('three failure')) {
    title = 'Three Failure Rule';
    goal = 'Apply repeated failure limit and escalation requirements';
  }

  return { requestId: nextRequestId(), query, title, goal };
}
