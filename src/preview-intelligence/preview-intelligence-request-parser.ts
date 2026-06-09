/**
 * Preview Intelligence request parser.
 */

let requestCounter = 0;

export function resetPreviewIntelligenceRequestCounterForTests(): void {
  requestCounter = 0;
}

export interface ParsedPreviewIntelligenceQuery {
  requestId: string;
  query: string;
  asksReadiness: boolean;
  asksLimitations: boolean;
  asksObservation: boolean;
  asksCapabilities: boolean;
  asksMobile: boolean;
  asksSelfVision: boolean;
}

export function parsePreviewIntelligenceQuery(query: string): ParsedPreviewIntelligenceQuery {
  requestCounter += 1;
  const lower = query.toLowerCase().trim();
  return {
    requestId: `pviq-${requestCounter.toString().padStart(4, '0')}`,
    query,
    asksReadiness: lower.includes('ready') || lower.includes('not ready'),
    asksLimitations: lower.includes('limitation') || lower.includes('blocked') || lower.includes('why'),
    asksObservation: lower.includes('observe') || lower.includes('observation plan'),
    asksCapabilities: lower.includes('capabilit') || lower.includes('missing'),
    asksMobile: lower.includes('mobile'),
    asksSelfVision: lower.includes('self vision'),
  };
}
