/**
 * Interactive Explanations — report interpretation analyzer.
 */

import type {
  InteractiveExplanationsInput,
  ReportInterpretationAnalysis,
} from './interactive-explanations-types.js';
import { getCachedReportInterpretation, setCachedReportInterpretation } from './interactive-explanations-cache.js';

export interface ReportInterpretationSnapshot {
  hasTrustReports: boolean;
  hasVerificationReports: boolean;
  hasCheckpointReports: boolean;
}

const BASE_REPORT_AREAS = [
  'trust_reports',
  'verification_reports',
  'hardening_reports',
  'documentation_reports',
  'checkpoint_reports',
] as const;

let reportAnalysisCount = 0;

export function analyzeReportInterpretation(
  input: InteractiveExplanationsInput,
  snapshot: ReportInterpretationSnapshot,
): ReportInterpretationAnalysis {
  const cacheKey = [
    snapshot.hasTrustReports,
    snapshot.hasVerificationReports,
    input.missingTrustReportExplanation,
    input.missingVerificationReportExplanation,
    ...(input.undocumentedReportAreas ?? []),
  ].join('|');

  const cached = getCachedReportInterpretation(cacheKey);
  if (cached) return cached;

  reportAnalysisCount += 1;
  const reportWarnings: string[] = [];
  const undocumentedReportAreas: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingTrustReportExplanation, 'missing_trust_report_explanation', 'trust_reports'],
    [input.missingVerificationReportExplanation, 'missing_verification_report_explanation', 'verification_reports'],
    [input.missingHardeningReportExplanation, 'missing_hardening_report_explanation', 'hardening_reports'],
    [input.missingDocumentationReportExplanation, 'missing_documentation_report_explanation', 'documentation_reports'],
    [input.missingCheckpointReportExplanation, 'missing_checkpoint_report_explanation', 'checkpoint_reports'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      reportWarnings.push(warning);
      undocumentedReportAreas.push(area);
      penalty += 9;
    }
  }

  for (const area of input.undocumentedReportAreas ?? []) {
    if (!undocumentedReportAreas.includes(area)) {
      undocumentedReportAreas.push(area);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.hasTrustReports ? 10 : 0)
    + (snapshot.hasVerificationReports ? 9 : 0)
    + (snapshot.hasCheckpointReports ? 8 : 0);
  const documented = BASE_REPORT_AREAS.length - undocumentedReportAreas.filter(
    (a) => BASE_REPORT_AREAS.includes(a as typeof BASE_REPORT_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_REPORT_AREAS.length) * 80 + systemBonus);
  const reportCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ReportInterpretationAnalysis = {
    reportCoverageScore,
    undocumentedReportAreas,
    reportWarnings,
  };
  setCachedReportInterpretation(cacheKey, result);
  return result;
}

export function getReportAnalysisCount(): number {
  return reportAnalysisCount;
}

export function resetReportInterpretationAnalyzerForTests(): void {
  reportAnalysisCount = 0;
}

export function listBaseReportAreas(): readonly string[] {
  return BASE_REPORT_AREAS;
}
