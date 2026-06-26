/**
 * Materialization Quality Score V1 — execution trace events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { MaterializationQualityScoreEvidence } from './materialization-quality-score-types.js';

const TRACE_STAGES = [
  { title: 'Materialization quality scoring started', when: () => true },
  { title: 'Evidence sources loaded', when: (e: MaterializationQualityScoreEvidence) => Boolean(e.materializationQualityScorePath) },
  { title: 'Blueprint score calculated', when: (e: MaterializationQualityScoreEvidence) => hasCategory(e, 'blueprint') },
  { title: 'Prompt alignment score calculated', when: (e: MaterializationQualityScoreEvidence) => hasCategory(e, 'promptAlignment') },
  { title: 'Feature coverage score calculated', when: (e: MaterializationQualityScoreEvidence) => hasCategory(e, 'featureCoverage') },
  { title: 'Modular architecture score calculated', when: (e: MaterializationQualityScoreEvidence) => hasCategory(e, 'modularArchitecture') },
  { title: 'Production validation score calculated', when: (e: MaterializationQualityScoreEvidence) => hasCategory(e, 'productionValidation') },
  { title: 'Persistent project score calculated', when: (e: MaterializationQualityScoreEvidence) => hasCategory(e, 'persistentProjectReality') },
  { title: 'Materialization quality verdict issued', when: (e: MaterializationQualityScoreEvidence) => e.materializationQualityScore >= 0 },
] as const;

function hasCategory(
  evidence: MaterializationQualityScoreEvidence,
  id: string,
): boolean {
  return evidence.materializationQualityCategories.some((category) => category.id === id);
}

export function buildMaterializationQualityScoreTraceEvents(
  evidence: MaterializationQualityScoreEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.materializationQualityRecordedAt) || Date.now();
  let step = 0;

  return TRACE_STAGES.filter((stage) => stage.when(evidence)).map((stage) => {
    step += 1;
    const failed = evidence.materializationQualityVerdict === 'NOT_MATERIALIZED';
    return {
      eventId: `${buildId}-quality-score-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: 'materialization_quality_score',
      severity: failed ? 'ERROR' : 'INFO',
      eventTitle: stage.title,
      technicalDetail: `${evidence.materializationQualityScore}% — ${evidence.materializationQualityVerdict}`,
      status: failed ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        materializationQualityScore: true,
        overallScore: evidence.materializationQualityScore,
        verdict: evidence.materializationQualityVerdict,
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

export function materializationQualityScoreTraceTitles(): string[] {
  return TRACE_STAGES.map((stage) => stage.title);
}
