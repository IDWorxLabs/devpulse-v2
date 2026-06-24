/**
 * Unified Failure Escalation Authority V1 — root cause analyzer.
 */

import type {
  FailureClassificationCategory,
  RootCauseType,
} from './unified-failure-escalation-v1-types.js';
import type { FailureSignal } from './failure-classification-engine.js';

export function analyzeFailureRootCause(input: {
  signal: FailureSignal;
  classification: FailureClassificationCategory;
}): RootCauseType {
  const text = `${input.signal.detail} ${input.signal.signalType}`.toLowerCase();

  if (text.includes('ownership') || text.includes('canonical')) return 'Missing ownership';
  if (text.includes('validation') || text.includes('harness') || text.includes('unvalidated'))
    return 'Missing validation';
  if (text.includes('regression') || text.includes('stale')) return 'Regression';
  if (text.includes('evidence') || text.includes('artifact')) return 'Evidence defect';
  if (text.includes('architecture') || text.includes('fragmented') || text.includes('competing'))
    return 'Architecture defect';
  if (text.includes('gap') || text.includes('missing capability')) return 'Capability gap';
  if (text.includes('defect') || text.includes('failed') || text.includes('error'))
    return 'Implementation defect';
  if (input.classification === 'Architecture Failure') return 'Architecture defect';
  return 'Unknown';
}
