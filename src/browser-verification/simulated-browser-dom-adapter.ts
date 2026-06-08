/**
 * Simulated browser DOM adapter — honest HTML-string verification.
 * NOT Playwright. Does not fake missing elements.
 */

export interface SimulatedDomQueryResult {
  found: boolean;
  count: number;
  matches: string[];
}

export interface SimulatedBrowserAdapterResult {
  realBrowserRunnerAttached: boolean;
  adapterMode: 'simulated-html';
  warnings: string[];
}

export class SimulatedBrowserDomAdapter {
  readonly realBrowserRunnerAttached = false;
  readonly adapterMode = 'simulated-html' as const;

  getAdapterWarnings(): string[] {
    return ['Real browser runner not yet attached — using simulated HTML verification.'];
  }

  contains(html: string, pattern: string | RegExp): boolean {
    return typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html);
  }

  query(html: string, pattern: RegExp): SimulatedDomQueryResult {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      matches.push(match[0]);
    }
    return { found: matches.length > 0, count: matches.length, matches };
  }

  countDataAttributes(html: string, attr: string): number {
    const re = new RegExp(`${attr}="[^"]*"`, 'g');
    return (html.match(re) ?? []).length;
  }

  extractVisibleAnswerText(html: string): string | null {
    const match = html.match(
      /class="devpulse-v2-chat-assistant-text"[^>]*>([^<]*)</,
    );
    return match ? decodeHtmlEntities(match[1]) : null;
  }

  hasForbiddenAlternateAnswerFields(html: string): boolean {
    const forbidden = [
      'directAnswer',
      'hiddenAnswer',
      'routingNarration',
      'recoveredText',
      'data-devpulse-hidden-answer',
    ];
    return forbidden.some((f) => html.includes(f));
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function createSimulatedBrowserDomAdapter(): SimulatedBrowserDomAdapter {
  return new SimulatedBrowserDomAdapter();
}
