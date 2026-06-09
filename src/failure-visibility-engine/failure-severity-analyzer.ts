/**
 * Failure severity analyzer — classifies visible failures by severity.
 */

import type { FailureSeverity } from './failure-visibility-types.js';

export function classifyFailureSeverity(opts: {
  title: string;
  description: string;
  sourceSystem: string;
  blockedCapabilities: string[];
}): FailureSeverity {
  const text = `${opts.title} ${opts.description}`.toLowerCase();

  if (
    text.includes('execution') ||
    text.includes('cloud runtime') ||
    text.includes('code generation') ||
    text.includes('critical')
  ) {
    return 'Critical';
  }

  if (
    text.includes('dependency') && opts.blockedCapabilities.length > 0 ||
    text.includes('governance') ||
    text.includes('blocked gate')
  ) {
    return 'High';
  }

  if (opts.blockedCapabilities.length >= 2 || text.includes('blocked')) {
    return 'Moderate';
  }

  if (text.includes('risk') || text.includes('warning') || text.includes('defer')) {
    return 'Warning';
  }

  return 'Info';
}

export function findMostSevereSeverity(severities: FailureSeverity[]): FailureSeverity | null {
  const order: FailureSeverity[] = ['Info', 'Warning', 'Moderate', 'High', 'Critical'];
  let best: FailureSeverity | null = null;
  for (const s of severities) {
    if (!best || order.indexOf(s) > order.indexOf(best)) best = s;
  }
  return best;
}
