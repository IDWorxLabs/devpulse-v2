/**
 * UI Inspection request parser.
 */

let requestCounter = 0;

export function resetUiInspectionRequestCounterForTests(): void {
  requestCounter = 0;
}

export interface ParsedUiInspectionQuery {
  requestId: string;
  query: string;
  asksLayout: boolean;
  asksNavigation: boolean;
  asksLoading: boolean;
  asksResponsive: boolean;
  asksStructures: boolean;
  asksBlocked: boolean;
}

export function parseUiInspectionQuery(query: string): ParsedUiInspectionQuery {
  requestCounter += 1;
  const lower = query.toLowerCase().trim();
  return {
    requestId: `uiiq-${requestCounter.toString().padStart(4, '0')}`,
    query,
    asksLayout: lower.includes('layout'),
    asksNavigation: lower.includes('navigation'),
    asksLoading: lower.includes('loading'),
    asksResponsive: lower.includes('responsive'),
    asksStructures: lower.includes('structures') || lower.includes('ui structures'),
    asksBlocked: lower.includes('blocked') || lower.includes('why'),
  };
}
