/**
 * Unified Failure Escalation Authority V1 — failure classification engine.
 */

import type {
  FailureClassificationCategory,
  FailureSeverity,
} from './unified-failure-escalation-v1-types.js';

export interface FailureSignal {
  sourceSystem: string;
  signalType: string;
  detail: string;
  projectId?: string;
  capability?: string;
}

export function classifyFailureSignal(signal: FailureSignal): {
  classification: FailureClassificationCategory;
  severity: FailureSeverity;
} {
  const text = `${signal.sourceSystem} ${signal.signalType} ${signal.detail}`.toLowerCase();

  let classification: FailureClassificationCategory = 'Architecture Failure';
  if (text.includes('requirement') || text.includes('cqi')) classification = 'Requirement Failure';
  else if (text.includes('planning')) classification = 'Planning Failure';
  else if (text.includes('generation') || text.includes('codegen')) classification = 'Generation Failure';
  else if (text.includes('build')) classification = 'Build Failure';
  else if (text.includes('preview')) classification = 'Preview Failure';
  else if (text.includes('verification') || text.includes('uvl')) classification = 'Verification Failure';
  else if (text.includes('product architect') || text.includes('product failure'))
    classification = 'Product Failure';
  else if (text.includes('launch') || text.includes('afla')) classification = 'Launch Failure';
  else if (text.includes('production')) classification = 'Production Failure';
  else if (text.includes('mobile')) classification = 'Mobile Failure';
  else if (text.includes('cloud')) classification = 'Cloud Failure';
  else if (text.includes('world2')) classification = 'World2 Failure';
  else if (text.includes('concurrent') || text.includes('concurrency'))
    classification = 'Concurrency Failure';
  else if (text.includes('governance') || text.includes('validation runtime'))
    classification = 'Governance Failure';
  else if (text.includes('evolution') || text.includes('self-evolution'))
    classification = 'Evolution Failure';

  let severity: FailureSeverity = 'MEDIUM';
  if (text.includes('blocking') || text.includes('impossible')) severity = 'BLOCKING';
  else if (text.includes('critical') || text.includes('major')) severity = 'CRITICAL';
  else if (text.includes('high') || text.includes('degraded')) severity = 'HIGH';
  else if (text.includes('minor') || text.includes('low')) severity = 'LOW';

  return { classification, severity };
}
