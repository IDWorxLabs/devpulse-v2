/**
 * Performance Hardening — UI responsiveness analyzer.
 */

import type { PerformanceHardeningInput, UiResponsivenessAnalysis } from './performance-hardening-types.js';
import { resolvePerformanceRiskLevel } from './performance-hardening-types.js';
import { getCachedResponsivenessAnalysis, setCachedResponsivenessAnalysis } from './performance-hardening-cache.js';

let responsivenessAnalysisCount = 0;

export function analyzeUiResponsiveness(input: PerformanceHardeningInput): UiResponsivenessAnalysis {
  const cacheKey = [
    input.heavyRenderPressure,
    input.mobileScreenOverflowRisk,
    input.chatInputResponsivenessRisk,
    input.operatorFeedRenderRisk,
  ].join('|');

  const cached = getCachedResponsivenessAnalysis(cacheKey);
  if (cached) return cached;

  responsivenessAnalysisCount += 1;
  const responsivenessWarnings: string[] = [];
  const mobileWarnings: string[] = [];
  let penalty = 0;

  if (input.heavyRenderPressure === true) {
    responsivenessWarnings.push('heavy_render_pressure_risk');
    penalty += 12;
  }
  if (input.reportPreviewRebuildRisk === true) {
    responsivenessWarnings.push('report_preview_rebuild_risk');
    penalty += 10;
  }
  if (input.operatorFeedRenderRisk === true) {
    responsivenessWarnings.push('operator_feed_rendering_risk');
    penalty += 10;
  }
  if (input.notificationDrawerDuplicationRisk === true) {
    responsivenessWarnings.push('notification_drawer_duplication_risk');
    penalty += 8;
  }
  if (input.uvlPanelRenderPressure === true) {
    responsivenessWarnings.push('uvl_panel_render_pressure_risk');
    penalty += 8;
  }
  if (input.largeReportCopyPressure === true) {
    responsivenessWarnings.push('large_report_copy_pressure_risk');
    penalty += 8;
  }
  if (input.mobileScreenOverflowRisk === true) {
    mobileWarnings.push('mobile_screen_overflow_risk');
    penalty += 12;
  }
  if (input.chatInputResponsivenessRisk === true) {
    mobileWarnings.push('chat_input_responsiveness_risk');
    penalty += 10;
  }
  if (input.loaderReadinessMismatch === true) {
    responsivenessWarnings.push('loader_readiness_mismatch_risk');
    penalty += 8;
  }
  if (input.mobileStartupPressure === true) {
    mobileWarnings.push('mobile_startup_pressure_risk');
    penalty += 6;
  }

  const responsivenessScore = Math.max(0, Math.min(100, Math.round(88 - penalty)));

  const result: UiResponsivenessAnalysis = {
    responsivenessScore,
    responsivenessRiskLevel: resolvePerformanceRiskLevel(responsivenessScore),
    responsivenessWarnings,
    mobileWarnings,
  };

  setCachedResponsivenessAnalysis(cacheKey, result);
  return result;
}

export function getResponsivenessAnalysisCount(): number {
  return responsivenessAnalysisCount;
}

export function resetUiResponsivenessAnalyzerForTests(): void {
  responsivenessAnalysisCount = 0;
}
