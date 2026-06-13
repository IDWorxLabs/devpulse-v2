/**
 * Intake Alignment Authority — alignment analysis orchestrator (V1).
 */

import {
  computeAlignedConfidence,
  computeAlignmentScore,
  generateAlignmentRecommendations,
  mapAlignmentCategory,
} from './alignment-confidence-engine.js';
import { buildAlignmentEvidenceBundle } from './cross-source-entity-matcher.js';
import { analyzePlatformAlignment } from './platform-alignment-analyzer.js';
import { analyzeRoleAlignment } from './role-alignment-analyzer.js';
import {
  classifyConflicts,
  detectSemanticAgreements,
  resetSemanticAgreementCountersForTests,
} from './semantic-agreement-detector.js';
import { analyzeWorkflowAlignment } from './workflow-alignment-analyzer.js';
import { recordIntakeAlignmentAnalysis } from './alignment-history.js';
import type {
  AssessIntakeAlignmentInput,
  IntakeAlignmentAnalysis,
  IntakeAlignmentAssessment,
} from './intake-alignment-types.js';
import type { UnifiedIntakeAnalysis } from '../unified-intake-intelligence/unified-intake-types.js';

let analysisCounter = 0;

export function resetIntakeAlignmentCounterForTests(): void {
  analysisCounter = 0;
}

export function resetIntakeAlignmentEngineModuleForTests(): void {
  resetIntakeAlignmentCounterForTests();
  resetSemanticAgreementCountersForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `intake-alignment-${analysisCounter}`;
}

export function assessIntakeAlignment(input: AssessIntakeAlignmentInput): IntakeAlignmentAnalysis | null {
  const bundle = buildAlignmentEvidenceBundle(input);
  if (!bundle) return null;

  const platformAlignment = analyzePlatformAlignment(bundle);
  const roleAlignment = analyzeRoleAlignment(bundle);
  const workflowAlignment = analyzeWorkflowAlignment(bundle);
  const semanticAgreements = detectSemanticAgreements({
    bundle,
    platformAlignment,
    roleAlignment,
    workflowAlignment,
  });
  const classifiedConflicts = classifyConflicts({
    bundle,
    platformAlignment,
    roleAlignment,
    semanticAgreements,
  });

  const realConflictCount = classifiedConflicts.filter((c) => c.classification === 'REAL_CONFLICT').length;
  const falseConflictCount = classifiedConflicts.filter((c) => c.classification === 'FALSE_CONFLICT').length;

  const alignmentScore = computeAlignmentScore({
    platformAlignment,
    roleAlignment,
    workflowAlignment,
    semanticAgreements,
    realConflictCount,
  });

  const alignedConfidence = computeAlignedConfidence({
    intakeConfidence: bundle.intakeConfidence,
    alignmentScore,
    falseConflictCount,
    realConflictCount,
    semanticAgreements,
  });

  const analysis: IntakeAlignmentAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    alignmentScore,
    alignmentCategory: mapAlignmentCategory(alignmentScore),
    alignedConfidence,
    platformAlignment,
    roleAlignment,
    workflowAlignment,
    semanticAgreements,
    classifiedConflicts,
    realConflictCount,
    falseConflictCount,
    alignmentRecommendations: generateAlignmentRecommendations({
      alignmentScore,
      realConflictCount,
      falseConflictCount,
      platformAlignment,
      classifiedConflicts,
    }),
    evidenceSources: bundle.sources,
  };

  if (!input.skipHistoryRecording) {
    recordIntakeAlignmentAnalysis(analysis);
  }

  return analysis;
}

export function runIntakeAlignmentEngine(input: AssessIntakeAlignmentInput): IntakeAlignmentAssessment {
  if (!input.unifiedIntakeAnalysis) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'INTAKE_ALIGNMENT_ENGINE_FAILED',
      analysis: null,
      failureReason: 'MISSING_UNIFIED_INTAKE_ANALYSIS',
    };
  }

  const analysis = assessIntakeAlignment(input);
  if (!analysis) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'INTAKE_ALIGNMENT_ENGINE_FAILED',
      analysis: null,
      failureReason: 'ALIGNMENT_ANALYSIS_FAILED',
    };
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'INTAKE_ALIGNMENT_ENGINE_COMPLETE',
    analysis,
    failureReason: null,
  };
}

/** Apply alignment repair to unified intake — removes false conflicts, repairs confidence. */
export function applyAlignmentRepairToUnifiedIntake(
  intake: UnifiedIntakeAnalysis,
  alignment: IntakeAlignmentAnalysis,
): UnifiedIntakeAnalysis {
  const falseConflictTypes = new Set(
    alignment.classifiedConflicts
      .filter((c) => c.classification === 'FALSE_CONFLICT')
      .map((c) => c.originalConflict.conflictType),
  );

  const repairedConflicts = intake.evidenceConflicts.filter((c) => !falseConflictTypes.has(c.conflictType));

  const confidenceBoost = alignment.alignedConfidence > intake.unifiedIntakeConfidence
    ? alignment.alignedConfidence - intake.unifiedIntakeConfidence
    : 0;

  return {
    ...intake,
    evidenceConflicts: repairedConflicts,
    unifiedIntakeConfidence: alignment.alignedConfidence,
    intakeReadinessScore: Math.min(100, intake.intakeReadinessScore + Math.round(confidenceBoost * 0.5)),
    intakeReadinessCategory:
      alignment.alignmentCategory === 'STRONG_ALIGNMENT' || alignment.alignmentCategory === 'HIGH_ALIGNMENT'
        ? intake.intakeReadinessScore >= 70
          ? 'READY_FOR_PLANNING'
          : 'HIGH_CONFIDENCE_UNDERSTANDING'
        : intake.intakeReadinessCategory,
  };
}
