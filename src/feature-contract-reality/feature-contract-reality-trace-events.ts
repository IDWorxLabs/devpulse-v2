/**
 * Feature Contract Reality V1 — execution trace events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { FeatureContractRealityEvidence } from './feature-contract-reality-types.js';

const TRACE_STAGES = [
  { title: 'Feature contract reality check started', when: () => true },
  { title: 'Feature contract loaded', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.length > 0 },
  { title: 'Feature files verified', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.some((r) => r.filesPresent) },
  { title: 'Feature registry verified', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.some((r) => r.registryEntryPresent) },
  { title: 'Feature routes verified', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.some((r) => r.routePresent) },
  { title: 'Feature renderability verified', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.some((r) => r.rendered) },
  { title: 'Feature interaction signals verified', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.some((r) => r.interactive) },
  { title: 'Feature validation metadata verified', when: (e: FeatureContractRealityEvidence) => e.featureRealityRecords.some((r) => r.validated) },
  { title: 'Feature contract reality verdict issued', when: (e: FeatureContractRealityEvidence) => Boolean(e.featureContractRealityRecordedAt) },
] as const;

export function buildFeatureContractRealityTraceEvents(
  evidence: FeatureContractRealityEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.featureContractRealityRecordedAt) || Date.now();
  let step = 0;

  return TRACE_STAGES.filter((stage) => stage.when(evidence)).map((stage) => {
    step += 1;
    const failed = evidence.featureContractRealityStatus === 'FAIL';
    return {
      eventId: `${buildId}-feature-reality-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: 'feature_contract_reality',
      severity: failed ? 'ERROR' : 'INFO',
      eventTitle: stage.title,
      technicalDetail: `${evidence.featureContractRealityScore}% — ${evidence.featureContractRealityStatus} (${evidence.featureRealityRecords.length} features)`,
      status: failed ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        featureContractReality: true,
        score: evidence.featureContractRealityScore,
        status: evidence.featureContractRealityStatus,
      },
      informationalOnly: true,
      section: 'Validation',
      action: stage.title,
      detail: stage.title,
      stepIndex: step,
      stepTotal: TRACE_STAGES.length,
    };
  });
}

export function featureContractRealityTraceTitles(): string[] {
  return TRACE_STAGES.map((stage) => stage.title);
}
