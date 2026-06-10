/**
 * Reliability Hardening — runtime stability analyzer.
 */

import type { ReliabilityHardeningInput, ReliabilityState, RuntimeStabilityAnalysis } from './reliability-hardening-types.js';
import { resolveReliabilityState } from './reliability-hardening-types.js';
import { getCachedRuntimeStabilityAnalysis, setCachedRuntimeStabilityAnalysis } from './reliability-hardening-cache.js';

let runtimeStabilityAnalysisCount = 0;

export function analyzeRuntimeStability(input: ReliabilityHardeningInput): RuntimeStabilityAnalysis {
  const cacheKey = [
    input.startupReadiness ?? 0,
    input.uvlReadiness ?? 0,
    input.trustEngineReadiness ?? 0,
    input.verificationReadiness ?? 0,
    input.monitoringReadiness ?? 0,
    input.operatorFeedReadiness ?? 0,
    input.notificationReadiness ?? 0,
    input.world2Readiness ?? 0,
    input.mobileCommandReadiness ?? 0,
  ].join('|');

  const cached = getCachedRuntimeStabilityAnalysis(cacheKey);
  if (cached) return cached;

  runtimeStabilityAnalysisCount += 1;
  const warnings: string[] = [];

  const signals = [
    { name: 'startup', value: input.startupReadiness ?? 50 },
    { name: 'uvl', value: input.uvlReadiness ?? 50 },
    { name: 'trust_engine', value: input.trustEngineReadiness ?? 50 },
    { name: 'verification', value: input.verificationReadiness ?? 50 },
    { name: 'monitoring', value: input.monitoringReadiness ?? 50 },
    { name: 'operator_feed', value: input.operatorFeedReadiness ?? 50 },
    { name: 'notification', value: input.notificationReadiness ?? 50 },
    { name: 'world2', value: input.world2Readiness ?? 50 },
    { name: 'mobile_command', value: input.mobileCommandReadiness ?? 50 },
  ];

  for (const signal of signals) {
    if (signal.value < 40) warnings.push(`${signal.name} readiness degraded`);
  }
  if (input.governanceStable === false) warnings.push('governance instability detected');
  if (input.escalationActive === true) warnings.push('capability escalation active');

  const runtimeStabilityScore = Math.max(0, Math.min(100, Math.round(
    signals.reduce((sum, s) => sum + s.value, 0) / signals.length,
  )));

  const result: RuntimeStabilityAnalysis = {
    runtimeStabilityScore,
    runtimeStabilityState: resolveReliabilityState(runtimeStabilityScore, input.governanceBlocked),
    runtimeWarnings: warnings,
  };

  setCachedRuntimeStabilityAnalysis(cacheKey, result);
  return result;
}

export function getRuntimeStabilityAnalysisCount(): number {
  return runtimeStabilityAnalysisCount;
}

export function resetRuntimeStabilityAnalyzerForTests(): void {
  runtimeStabilityAnalysisCount = 0;
}
