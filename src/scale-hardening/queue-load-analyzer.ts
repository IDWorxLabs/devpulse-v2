/**
 * Scale Hardening — queue/load analyzer.
 */

import type { QueueLoadAnalysis, ScaleHardeningInput } from './scale-hardening-types.js';
import { resolveScaleRiskLevel } from './scale-hardening-types.js';
import { getCachedQueueLoadAnalysis, setCachedQueueLoadAnalysis } from './scale-hardening-cache.js';

let queueLoadAnalysisCount = 0;

export function analyzeQueueLoad(input: ScaleHardeningInput): QueueLoadAnalysis {
  const cacheKey = [
    input.taskQueuePressureRisk,
    input.validationQueuePressureRisk,
    input.missingBackpressureSignals,
    input.missingRateLimitSignals,
  ].join('|');

  const cached = getCachedQueueLoadAnalysis(cacheKey);
  if (cached) return cached;

  queueLoadAnalysisCount += 1;
  const queueWarnings: string[] = [];
  const queueGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.taskQueuePressureRisk, 'task_queue_pressure_risk', 'task_queues'],
    [input.validationQueuePressureRisk, 'validation_queue_pressure_risk', 'validation_queues'],
    [input.cloudWorkerQueuePressureRisk, 'cloud_worker_queue_pressure_risk', 'cloud_worker_queues'],
    [input.notificationQueuePressureRisk, 'notification_queue_pressure_risk', 'notification_queues'],
    [input.operatorFeedQueuePressureRisk, 'operator_feed_queue_pressure_risk', 'operator_feed_queues'],
    [input.projectBuildQueuePressureRisk, 'project_build_queue_pressure_risk', 'project_build_queues'],
    [input.world2ExecutionQueuePressureRisk, 'world2_execution_queue_pressure_risk', 'world2_execution_queues'],
    [input.selfEvolutionQueuePressureRisk, 'self_evolution_queue_pressure_risk', 'self_evolution_queues'],
    [input.retryQueuePressureRisk, 'retry_queue_pressure_risk', 'retry_queues'],
    [input.deadLetterQueuePressureRisk, 'dead_letter_queue_pressure_risk', 'dead_letter_queues'],
    [input.missingBackpressureSignals, 'missing_backpressure_signals', 'backpressure_signals'],
    [input.missingRateLimitSignals, 'missing_rate_limit_signals', 'rate_limit_signals'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      queueWarnings.push(warning);
      queueGaps.push(gap);
      penalty += 7;
    }
  }

  const queueLoadScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: QueueLoadAnalysis = {
    queueLoadScore,
    queueLoadRiskLevel: resolveScaleRiskLevel(queueLoadScore),
    queueWarnings,
    queueGaps,
  };

  setCachedQueueLoadAnalysis(cacheKey, result);
  return result;
}

export function getQueueLoadAnalysisCount(): number {
  return queueLoadAnalysisCount;
}

export function resetQueueLoadAnalyzerForTests(): void {
  queueLoadAnalysisCount = 0;
}
