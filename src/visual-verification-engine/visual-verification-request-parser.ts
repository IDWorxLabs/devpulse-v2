/**
 * Visual verification request parser.
 */

import { isVisualVerificationQuestion } from './types.js';

let requestCounter = 0;

export function resetVisualVerificationRequestCounterForTests(): void {
  requestCounter = 0;
}

export interface ParsedVisualVerificationQuery {
  query: string;
  requestId: string;
  isVerificationQuestion: boolean;
  focusAreas: string[];
}

export function parseVisualVerificationQuery(query: string): ParsedVisualVerificationQuery {
  requestCounter += 1;
  const lower = query.toLowerCase();
  const focusAreas: string[] = [];

  if (lower.includes('layout')) focusAreas.push('layout');
  if (lower.includes('navigation') || lower.includes('route') || lower.includes('menu') || lower.includes('tab')) {
    focusAreas.push('navigation');
  }
  if (lower.includes('loading') || lower.includes('empty') || lower.includes('error state')) {
    focusAreas.push('loading');
  }
  if (lower.includes('responsive') || lower.includes('mobile') || lower.includes('tablet') || lower.includes('desktop')) {
    focusAreas.push('responsive');
  }
  if (lower.includes('interaction') || lower.includes('outcome')) focusAreas.push('interaction');
  if (lower.includes('evidence')) focusAreas.push('evidence');
  if (lower.includes('risk')) focusAreas.push('risk');
  if (lower.includes('blocked') || lower.includes('failed')) focusAreas.push('status');
  if (focusAreas.length === 0) focusAreas.push('general');

  return {
    query,
    requestId: `vvreq-${requestCounter.toString().padStart(4, '0')}`,
    isVerificationQuestion: isVisualVerificationQuestion(query),
    focusAreas,
  };
}
