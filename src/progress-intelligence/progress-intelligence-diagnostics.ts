/**
 * Progress Intelligence diagnostics.
 */

import { averageCompletion } from './progress-percentage-calculator.js';
import type { ProgressIntelligenceDiagnostics, ProgressRecord } from './progress-intelligence-types.js';

let diagnostics: ProgressIntelligenceDiagnostics = {
  progressIntelligenceActive: false,
  projectProgressCount: 0,
  averageCompletion: 0,
  highestCompletion: 0,
  lowestCompletion: 0,
  lastProgressQuery: null,
};

export function getProgressIntelligenceDiagnostics(): ProgressIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function updateProgressIntelligenceDiagnostics(query: string, records: ProgressRecord[]): void {
  const percents = records.map((r) => r.percentComplete);
  diagnostics = {
    progressIntelligenceActive: true,
    projectProgressCount: records.length,
    averageCompletion: averageCompletion(percents),
    highestCompletion: percents.length > 0 ? Math.max(...percents) : 0,
    lowestCompletion: percents.length > 0 ? Math.min(...percents) : 0,
    lastProgressQuery: query,
  };
}

export function resetProgressIntelligenceDiagnostics(): void {
  diagnostics = {
    progressIntelligenceActive: false,
    projectProgressCount: 0,
    averageCompletion: 0,
    highestCompletion: 0,
    lowestCompletion: 0,
    lastProgressQuery: null,
  };
}

export function progressIntelligenceKey(): string {
  const d = diagnostics;
  return [
    String(d.progressIntelligenceActive),
    String(d.projectProgressCount),
    String(d.averageCompletion),
    String(d.highestCompletion),
  ].join('|');
}
