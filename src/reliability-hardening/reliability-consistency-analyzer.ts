/**
 * Reliability Hardening — reliability consistency analyzer.
 */

import type { ReliabilityConsistencyAnalysis } from './reliability-hardening-types.js';
import { getCachedConsistencyAnalysis, setCachedConsistencyAnalysis } from './reliability-hardening-cache.js';

let consistencyAnalysisCount = 0;

export interface ReliabilityConsistencySignals {
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  publicExports: number;
  resetExports: number;
  passTokens: number;
}

export function analyzeReliabilityConsistency(signals: ReliabilityConsistencySignals): ReliabilityConsistencyAnalysis {
  const cacheKey = [
    signals.foundationDomains,
    signals.capabilityEntries,
    signals.uvlRows,
    signals.validationScripts,
  ].join('|');

  const cached = getCachedConsistencyAnalysis(cacheKey);
  if (cached) return cached;

  consistencyAnalysisCount += 1;
  const consistencyWarnings: string[] = [];
  const consistencyGaps: string[] = [];

  if (signals.foundationDomains < 6) consistencyGaps.push('foundation_registration_gap');
  if (signals.capabilityEntries < 6) consistencyGaps.push('capability_registry_gap');
  if (signals.findPanelAliases < 10) consistencyWarnings.push('find_panel_alias_coverage_low');
  if (signals.uvlRows < 50) consistencyWarnings.push('uvl_row_coverage_review');
  if (signals.validationScripts < 10) consistencyGaps.push('validation_script_gap');
  if (signals.publicExports < 6) consistencyGaps.push('public_export_gap');
  if (signals.resetExports < 6) consistencyGaps.push('reset_export_gap');
  if (signals.passTokens < 6) consistencyGaps.push('pass_token_gap');

  const consistencyScore = Math.max(0, Math.min(100, Math.round(
    100 - consistencyGaps.length * 12 - consistencyWarnings.length * 4,
  )));

  const result: ReliabilityConsistencyAnalysis = {
    consistencyScore,
    consistencyWarnings,
    consistencyGaps,
  };

  setCachedConsistencyAnalysis(cacheKey, result);
  return result;
}

export function getConsistencyAnalysisCount(): number {
  return consistencyAnalysisCount;
}

export function resetReliabilityConsistencyAnalyzerForTests(): void {
  consistencyAnalysisCount = 0;
}
