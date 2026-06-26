/**
 * Universal Production Proof V1 — execution trace events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { UniversalProductionProofEvidence } from './universal-production-proof-types.js';

const TRACE_STAGES = [
  'Universal production proof started',
  'Profile proof started',
  'Profile proof chain completed',
  'Profile launch readiness verdict issued',
  'Universal proof matrix generated',
  'Universal production verdict issued',
] as const;

export function buildUniversalProductionProofTraceEvents(
  evidence: UniversalProductionProofEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.universalProductionProofRecordedAt) || Date.now();
  const failed = evidence.universalProductionProofStatus === 'NOT_UNIVERSALLY_PRODUCTION_READY';

  return TRACE_STAGES.map((title, index) => {
    const step = index + 1;
    return {
      eventId: `${buildId}-universal-proof-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: 'universal_production_proof',
      severity: failed ? 'ERROR' : 'INFO',
      eventTitle: title,
      technicalDetail: `${evidence.universalProductionProofStatus} — ${evidence.report.profileCount} profiles`,
      status: failed ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        universalProductionProof: true,
        verdict: evidence.universalProductionProofStatus,
        profileCount: evidence.report.profileCount,
      },
      informationalOnly: true,
      section: 'Validation',
      action: title,
      detail: title,
      stepIndex: step,
      stepTotal: TRACE_STAGES.length,
    };
  });
}

export function universalProductionProofTraceTitles(): string[] {
  return [...TRACE_STAGES];
}
