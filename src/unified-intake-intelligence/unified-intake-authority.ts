/**
 * Unified Intake Authority — read-only multi-source intake orchestrator (V1).
 */

import { computeConflictPenalty, detectEvidenceConflicts } from './evidence-conflict-detector.js';
import { consolidateIntakeEvidence, hasMinimumIntakeEvidence } from './intake-evidence-consolidator.js';
import {
  computeIntakeReadinessScore,
  computeUnifiedIntakeConfidence,
  generateIntakeRecommendations,
  mapIntakeReadiness,
  mapIntakeReadinessCategory,
} from './intake-confidence-engine.js';
import { detectIntakeGaps } from './intake-gap-detector.js';
import { analyzeProjectIntent } from './project-intent-analyzer.js';
import { buildUnifiedProjectUnderstanding } from './project-understanding-builder.js';
import {
  getUnifiedIntakeAnalyses,
  getUnifiedIntakeHistory,
  recordUnifiedIntakeAnalysis,
} from './unified-intake-history.js';
import {
  buildUnifiedIntakeIntelligenceReport,
  buildUnifiedIntakeIntelligenceReportMarkdown,
} from './unified-intake-report-builder.js';
import type {
  AssessUnifiedIntakeInput,
  UnifiedIntakeAnalysis,
  UnifiedIntakeAssessment,
  UnifiedIntakeIntelligenceReport,
} from './unified-intake-types.js';

let analysisCounter = 0;

export function resetUnifiedIntakeCounterForTests(): void {
  analysisCounter = 0;
}

export function resetUnifiedIntakeIntelligenceModuleForTests(): void {
  resetUnifiedIntakeCounterForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `unified-intake-${analysisCounter}`;
}

export function assessUnifiedIntake(input: AssessUnifiedIntakeInput): UnifiedIntakeAnalysis | null {
  const evidence = consolidateIntakeEvidence(input);
  if (!evidence || !hasMinimumIntakeEvidence(evidence)) return null;

  const evidenceConflicts = detectEvidenceConflicts({
    evidence,
    typedPrompt: input.typedPrompt,
    voiceNotesAnalysis: input.voiceNotesAnalysis,
    visualReferenceAnalysis: input.visualReferenceAnalysis,
  });

  const conflictPenalty = computeConflictPenalty(evidenceConflicts);
  const projectIntent = analyzeProjectIntent(evidence);
  const projectUnderstanding = buildUnifiedProjectUnderstanding({
    evidence,
    projectIntent,
    conflictPenalty,
  });

  const intakeGaps = detectIntakeGaps(evidence);
  const unifiedIntakeConfidence = computeUnifiedIntakeConfidence({
    evidence,
    projectUnderstanding,
    conflicts: evidenceConflicts,
  });

  const intakeReadinessScore = computeIntakeReadinessScore({
    unifiedIntakeConfidence,
    gaps: intakeGaps,
    conflicts: evidenceConflicts,
    projectUnderstanding,
  });

  const intakeReadinessCategory = mapIntakeReadinessCategory(intakeReadinessScore);
  const intakeReadiness = mapIntakeReadiness(intakeReadinessCategory);
  const intakeRecommendations = generateIntakeRecommendations({
    evidence,
    gaps: intakeGaps,
    conflicts: evidenceConflicts,
  });

  const analysis: UnifiedIntakeAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    evidence,
    projectIntent,
    projectUnderstanding,
    evidenceConflicts,
    intakeGaps,
    unifiedIntakeConfidence,
    intakeReadinessScore,
    intakeReadinessCategory,
    intakeReadiness,
    intakeRecommendations,
  };

  if (!input.skipHistoryRecording) {
    recordUnifiedIntakeAnalysis(analysis);
  }

  return analysis;
}

export function runUnifiedIntakeIntelligence(input: AssessUnifiedIntakeInput = {}): UnifiedIntakeAssessment {
  const analysis = assessUnifiedIntake(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis ? 'UNIFIED_INTAKE_INTELLIGENCE_COMPLETE' : 'UNIFIED_INTAKE_INTELLIGENCE_FAILED',
    analysis,
    failureReason: analysis ? null : 'INSUFFICIENT_INTAKE_EVIDENCE',
  };
}

export function buildUnifiedIntakeIntelligenceArtifacts(input: {
  analyses?: readonly UnifiedIntakeAnalysis[];
} = {}): {
  report: UnifiedIntakeIntelligenceReport;
  markdown: string;
} {
  const history = getUnifiedIntakeHistory();
  const storedAnalyses = input.analyses ?? getUnifiedIntakeAnalyses();
  const report = buildUnifiedIntakeIntelligenceReport({
    analyses: storedAnalyses,
    history,
  });

  const latestAnalyses =
    storedAnalyses.length > 0
      ? storedAnalyses
      : report.latestAnalysis
        ? [report.latestAnalysis]
        : [];

  return {
    report,
    markdown: buildUnifiedIntakeIntelligenceReportMarkdown(report, latestAnalyses),
  };
}
