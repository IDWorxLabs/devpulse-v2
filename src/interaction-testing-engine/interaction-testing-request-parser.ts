/**
 * Interaction Testing request parser.
 */

let requestCounter = 0;

export function resetInteractionTestingRequestCounterForTests(): void {
  requestCounter = 0;
}

export interface ParsedInteractionTestingQuery {
  requestId: string;
  query: string;
  asksButtons: boolean;
  asksNavigation: boolean;
  asksWorkflow: boolean;
  asksOutcomes: boolean;
  asksBlocked: boolean;
}

export function parseInteractionTestingQuery(query: string): ParsedInteractionTestingQuery {
  requestCounter += 1;
  const lower = query.toLowerCase().trim();
  return {
    requestId: `itq-${requestCounter.toString().padStart(4, '0')}`,
    query,
    asksButtons: lower.includes('button'),
    asksNavigation: lower.includes('navigation') || lower.includes('route'),
    asksWorkflow: lower.includes('workflow'),
    asksOutcomes: lower.includes('outcome') || lower.includes('results') || lower.includes('tested'),
    asksBlocked: lower.includes('blocked') || lower.includes('why'),
  };
}
