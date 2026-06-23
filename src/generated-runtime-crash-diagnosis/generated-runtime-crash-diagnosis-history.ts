/**
 * Generated Runtime Crash Diagnosis — bounded history (Phase 26.81).
 */

import { MAX_CRASH_DIAGNOSIS_HISTORY } from './generated-runtime-crash-diagnosis-registry.js';
import type {
  GeneratedRuntimeCrashDiagnosisAssessment,
  GeneratedRuntimeCrashDiagnosisHistoryEntry,
} from './generated-runtime-crash-diagnosis-types.js';

const history: GeneratedRuntimeCrashDiagnosisHistoryEntry[] = [];

export function resetGeneratedRuntimeCrashDiagnosisHistoryForTests(): void {
  history.length = 0;
}

export function recordGeneratedRuntimeCrashDiagnosisAssessment(
  assessment: GeneratedRuntimeCrashDiagnosisAssessment,
): void {
  history.unshift({
    readOnly: true,
    diagnosisId: assessment.report.diagnosisId,
    generatedAt: assessment.report.generatedAt,
    crashClass: assessment.report.classification.crashClass,
    crashDetected: assessment.report.crashDetected,
    workspaceId: assessment.report.workspaceId,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_CRASH_DIAGNOSIS_HISTORY) {
    history.length = MAX_CRASH_DIAGNOSIS_HISTORY;
  }
}

export function getGeneratedRuntimeCrashDiagnosisHistorySize(): number {
  return history.length;
}

export function getLatestGeneratedRuntimeCrashDiagnosisHistoryEntry(): GeneratedRuntimeCrashDiagnosisHistoryEntry | null {
  return history[0] ?? null;
}

export function getGeneratedRuntimeCrashDiagnosisHistory(): readonly GeneratedRuntimeCrashDiagnosisHistoryEntry[] {
  return history;
}
