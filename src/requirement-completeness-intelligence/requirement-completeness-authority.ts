/**
 * Requirement Completeness Authority — read-only pre-planning completeness orchestrator (V1).
 */

import { getLatestVisualReferenceAnalysis } from '../visual-reference-intelligence/index.js';
import { getLatestVoiceNotesAnalysis } from '../voice-notes-intelligence/index.js';
import { generateClarifyingQuestions } from './clarifying-question-generator.js';
import {
  assessRiskLevel,
  computeCompletenessScore,
  computeConfidenceScore,
  computeReadinessScore,
  determineProjectRequirementReadiness,
  determineSafeToProceed,
  mapCompletenessCategory,
} from './completeness-score-engine.js';
import { analyzeProjectScope } from './project-scope-analyzer.js';
import { analyzeRequirementDomains } from './requirement-domain-analyzer.js';
import { detectRequirementGaps } from './requirement-gap-detector.js';
import {
  consolidateRequirementEvidence,
  hasMinimumEvidence,
} from './requirement-evidence-consolidator.js';
import {
  getRequirementCompletenessAnalyses,
  getRequirementCompletenessHistory,
  recordRequirementCompletenessAnalysis,
} from './requirement-completeness-history.js';
import {
  buildRequirementCompletenessIntelligenceReport,
  buildRequirementCompletenessIntelligenceReportMarkdown,
} from './requirement-completeness-report-builder.js';
import type {
  AssessRequirementCompletenessInput,
  RequirementCompletenessAnalysis,
  RequirementCompletenessAssessment,
  RequirementCompletenessIntelligenceReport,
} from './requirement-completeness-types.js';

let analysisCounter = 0;

export function resetRequirementCompletenessCounterForTests(): void {
  analysisCounter = 0;
}

export function resetRequirementCompletenessIntelligenceModuleForTests(): void {
  resetRequirementCompletenessCounterForTests();
}

function nextAnalysisId(): string {
  analysisCounter += 1;
  return `req-completeness-${analysisCounter}`;
}

function resolveInput<T>(
  input: AssessRequirementCompletenessInput,
  key: keyof AssessRequirementCompletenessInput,
  factory: () => T,
): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

export function assessRequirementCompleteness(
  input: AssessRequirementCompletenessInput = {},
): RequirementCompletenessAnalysis | null {
  const voiceNotesAnalysis = resolveInput(input, 'voiceNotesAnalysis', () => getLatestVoiceNotesAnalysis());
  const visualReferenceAnalysis = resolveInput(input, 'visualReferenceAnalysis', () =>
    getLatestVisualReferenceAnalysis(),
  );

  const evidence = consolidateRequirementEvidence({
    typedRequirements: input.typedRequirements ?? null,
    voiceNotesAnalysis,
    visualReferenceAnalysis,
    projectVaultContext: input.projectVaultContext ?? null,
    fixture: input.requirementEvidenceFixture ?? null,
  });

  if (!hasMinimumEvidence(evidence)) {
    return null;
  }

  const domainResults = analyzeRequirementDomains(evidence);
  const scope = analyzeProjectScope(evidence);
  const missingRequirements = detectRequirementGaps({ evidence, domainResults, scope });
  const clarifyingQuestions = generateClarifyingQuestions({ gaps: missingRequirements, evidence });

  const completenessScore = computeCompletenessScore(domainResults);
  const completenessCategory = mapCompletenessCategory(completenessScore);
  const confidenceScore = computeConfidenceScore({
    sourceCount: evidence.sources.length,
    domainResults,
    scope,
  });
  const readinessScore = computeReadinessScore({
    completenessScore,
    scope,
    gaps: missingRequirements,
    confidenceScore,
  });
  const criticalGapCount = missingRequirements.filter((g) => g.severity === 'CRITICAL').length;
  const projectRequirementReadiness = determineProjectRequirementReadiness({
    completenessScore,
    readinessScore,
    criticalGapCount,
    clarifyingQuestionCount: clarifyingQuestions.filter((q) => q.priority === 'CRITICAL').length,
  });
  const riskLevel = assessRiskLevel(missingRequirements);
  const safeToProceed = determineSafeToProceed({ projectRequirementReadiness, riskLevel });

  const analysis: RequirementCompletenessAnalysis = {
    readOnly: true,
    analysisId: nextAnalysisId(),
    analyzedAt: new Date().toISOString(),
    evidence,
    domainResults,
    completenessScore,
    completenessCategory,
    readinessScore,
    projectRequirementReadiness,
    missingRequirements,
    riskLevel,
    confidenceScore,
    clarifyingQuestions,
    safeToProceed,
  };

  if (!input.skipHistoryRecording) {
    recordRequirementCompletenessAnalysis(analysis);
  }

  return analysis;
}

export function runRequirementCompletenessIntelligence(
  input: AssessRequirementCompletenessInput = {},
): RequirementCompletenessAssessment {
  const analysis = assessRequirementCompleteness(input);

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: analysis
      ? 'REQUIREMENT_COMPLETENESS_INTELLIGENCE_COMPLETE'
      : 'REQUIREMENT_COMPLETENESS_INTELLIGENCE_FAILED',
    analysis,
    failureReason: analysis ? null : 'INSUFFICIENT_REQUIREMENT_EVIDENCE',
  };
}

export function buildRequirementCompletenessIntelligenceArtifacts(input: {
  analyses?: readonly RequirementCompletenessAnalysis[];
} = {}): {
  report: RequirementCompletenessIntelligenceReport;
  markdown: string;
} {
  const history = getRequirementCompletenessHistory();
  const storedAnalyses = input.analyses ?? getRequirementCompletenessAnalyses();
  const report = buildRequirementCompletenessIntelligenceReport({
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
    markdown: buildRequirementCompletenessIntelligenceReportMarkdown(report, latestAnalyses),
  };
}
