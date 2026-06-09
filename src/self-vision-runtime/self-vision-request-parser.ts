/**
 * Self Vision Runtime request parser.
 */

let requestCounter = 0;

export function resetSelfVisionRequestCounterForTests(): void {
  requestCounter = 0;
}

export interface ParsedSelfVisionQuery {
  requestId: string;
  query: string;
  asksSession: boolean;
  asksTargets: boolean;
  asksCapturePlan: boolean;
  asksBlocked: boolean;
}

export function parseSelfVisionQuery(query: string): ParsedSelfVisionQuery {
  requestCounter += 1;
  const lower = query.toLowerCase().trim();
  return {
    requestId: `svrq-${requestCounter.toString().padStart(4, '0')}`,
    query,
    asksSession: lower.includes('session') || lower.includes('show self vision'),
    asksTargets: lower.includes('observation target') || lower.includes('targets exist'),
    asksCapturePlan: lower.includes('capture plan'),
    asksBlocked: lower.includes('blocked') || lower.includes('why'),
  };
}
