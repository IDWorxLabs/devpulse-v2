/**
 * Verification runtime request parser.
 */

import { isUvlRuntimeQuestion } from './types.js';

let requestCounter = 0;

export function resetVerificationRuntimeRequestCounterForTests(): void {
  requestCounter = 0;
}

export interface ParsedVerificationRuntimeQuery {
  query: string;
  requestId: string;
  isRuntimeQuestion: boolean;
  focusAreas: string[];
}

export function parseVerificationRuntimeQuery(query: string): ParsedVerificationRuntimeQuery {
  requestCounter += 1;
  const lower = query.toLowerCase();
  const focusAreas: string[] = [];

  if (lower.includes('provider')) focusAreas.push('providers');
  if (lower.includes('session')) focusAreas.push('sessions');
  if (lower.includes('runtime') || lower.includes('lab')) focusAreas.push('runtime');
  if (lower.includes('capabilit')) focusAreas.push('capabilities');
  if (lower.includes('blocked') || lower.includes('failed')) focusAreas.push('status');
  if (focusAreas.length === 0) focusAreas.push('general');

  return {
    query,
    requestId: `uvlreq-${requestCounter.toString().padStart(4, '0')}`,
    isRuntimeQuestion: isUvlRuntimeQuestion(query),
    focusAreas,
  };
}
