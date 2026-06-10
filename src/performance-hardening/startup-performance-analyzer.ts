/**
 * Performance Hardening — startup performance analyzer.
 */

import type { PerformanceHardeningInput, StartupPerformanceAnalysis } from './performance-hardening-types.js';
import { resolvePerformanceRiskLevel } from './performance-hardening-types.js';
import { getCachedStartupAnalysis, setCachedStartupAnalysis } from './performance-hardening-cache.js';

let startupAnalysisCount = 0;

export function analyzeStartupPerformance(input: PerformanceHardeningInput): StartupPerformanceAnalysis {
  const cacheKey = [
    input.requestId,
    input.bootReadiness ?? '',
    input.firstVisibleDelayMs ?? '',
    input.mobileStartupPressure,
  ].join('|');

  const cached = getCachedStartupAnalysis(cacheKey);
  if (cached) return cached;

  startupAnalysisCount += 1;
  const startupWarnings: string[] = [];
  const missingSignals: string[] = [];
  let penalty = 0;

  if ((input.bootReadiness ?? 100) < 50) {
    startupWarnings.push('slow_boot_risk');
    penalty += 12;
  }
  if ((input.bootstrapWeight ?? 0) > 70) {
    startupWarnings.push('heavy_bootstrap_risk');
    penalty += 10;
  }
  if (input.repeatedStartupLoopRisk === true) {
    startupWarnings.push('repeated_startup_loop_risk');
    penalty += 15;
  }
  if (input.lazyLoadFailureRisk === true) {
    startupWarnings.push('lazy_load_failure_risk');
    penalty += 10;
  }
  if (input.duplicateInitializationRisk === true) {
    startupWarnings.push('duplicate_initialization_risk');
    penalty += 8;
  }
  if (input.readinessDriftRisk === true) {
    startupWarnings.push('readiness_drift_risk');
    penalty += 8;
  }
  if ((input.firstVisibleDelayMs ?? 0) > 3000) {
    startupWarnings.push('first_visible_delay_risk');
    penalty += 12;
  }
  if ((input.firstClickableDelayMs ?? 0) > 5000) {
    startupWarnings.push('first_clickable_delay_risk');
    penalty += 14;
  }
  if ((input.chatUsableDelayMs ?? 0) > 8000) {
    startupWarnings.push('chat_usable_delay_risk');
    penalty += 14;
  }
  if (input.mobileStartupPressure === true) {
    startupWarnings.push('mobile_startup_pressure_risk');
    penalty += 10;
  }

  if (input.bootReadiness === undefined) missingSignals.push('boot_readiness');
  if (input.firstVisibleDelayMs === undefined) missingSignals.push('first_visible_delay');
  if (input.firstClickableDelayMs === undefined) missingSignals.push('first_clickable_delay');

  const startupScore = Math.max(0, Math.min(100, Math.round(
    (input.bootReadiness ?? 70) - penalty - missingSignals.length * 3,
  )));

  const result: StartupPerformanceAnalysis = {
    startupScore,
    startupRiskLevel: resolvePerformanceRiskLevel(startupScore),
    startupWarnings,
    missingSignals,
  };

  setCachedStartupAnalysis(cacheKey, result);
  return result;
}

export function getStartupAnalysisCount(): number {
  return startupAnalysisCount;
}

export function resetStartupPerformanceAnalyzerForTests(): void {
  startupAnalysisCount = 0;
}
