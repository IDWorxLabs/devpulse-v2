/**
 * DevPulse V2 Phase 13.3 — Reasoning Visibility Engine types.
 * Structured visible reasoning only — no chain-of-thought, no execution.
 */

export const REASONING_VISIBILITY_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_REASONING_VISIBILITY_ENGINE_FOUNDATION_V1_PASS';
export const REASONING_VISIBILITY_ENGINE_OWNER_MODULE = 'devpulse_v2_reasoning_visibility_engine';

export type ReasoningConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ReasoningEvidence {
  evidenceId: string;
  statement: string;
  sourceSystem: string;
  confidence: ReasoningConfidence;
  visibilityOnly: true;
}

export interface ReasoningSource {
  sourceId: string;
  sourceSystem: string;
  contribution: string;
  consulted: boolean;
  visibilityOnly: true;
}

export interface ReasoningRisk {
  riskId: string;
  summary: string;
  sourceSystem: string;
  level: string;
  visibilityOnly: true;
}

export interface ReasoningBlocker {
  blockerId: string;
  summary: string;
  sourceSystem: string;
  visibilityOnly: true;
}

export interface ReasoningVisibilityRecord {
  reasoningId: string;
  query: string;
  sourceSystem: string;
  evidence: ReasoningEvidence[];
  sources: ReasoningSource[];
  blockers: ReasoningBlocker[];
  risks: ReasoningRisk[];
  dependencies: string[];
  confidence: ReasoningConfidence;
  confidenceBasis: string;
  recommendationBasis: string;
  summary: string;
  systemsConsulted: string[];
  progressBasis: string;
  failureEvidence: string[];
  learningObservations: string[];
  executionReadinessBasis: string;
  executionBlockers: string[];
  buildTaskPlanBasis: string;
  codeGenerationBasis: string;
  codeGenerationRisks: string[];
  testingBasis: string;
  testingRisks: string[];
  fixBasis: string;
  fixRisks: string[];
  fixAlternatives: string[];
  fixRollbackReasoning: string;
  verificationBasis: string;
  verificationGaps: string[];
  trustFactors: string[];
  verificationConfidenceBasis: string;
  visibilityOnly: true;
}

export interface ReasoningVisibilityResult {
  query: string;
  records: ReasoningVisibilityRecord[];
  responseText: string;
}

export interface ReasoningVisibilityDiagnostics {
  reasoningVisibilityActive: boolean;
  reasoningCount: number;
  evidenceCount: number;
  blockerCount: number;
  riskCount: number;
  lastReasoningSource: string | null;
  lastQuery: string | null;
}

export const REASONING_VISIBILITY_QUESTION_SIGNALS = [
  'why was this recommended',
  'why recommended',
  'why is this blocked',
  'why blocked',
  'why deferred',
  'why is confidence',
  'why confidence',
  'what evidence',
  'evidence was used',
  'what systems contributed',
  'systems contributed',
  'what risks were considered',
  'risks were considered',
  'what blockers were considered',
  'blockers were considered',
  'why was',
  'reasoning behind',
  'reasoning for',
  'recommendation basis',
  'confidence basis',
  'dependencies considered',
  'why is this deferred',
] as const;

export const FORBIDDEN_REASONING_VISIBILITY_DUPLICATES = [
  'reasoning_brain',
  'brain_v2',
  'reasoning_explainer',
  'reasoning_feed',
  'reasoning_runtime',
  'second_reasoning_visibility',
] as const;

export function isReasoningVisibilityQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  const matches = REASONING_VISIBILITY_QUESTION_SIGNALS.some((s) => lower.includes(s));
  if (matches) {
    if (
      (lower.includes('what action') || lower.includes('what is the recommended action')) &&
      !lower.includes('why')
    ) {
      return false;
    }
    return true;
  }
  if ((lower.startsWith('why ') || lower.includes(' why ')) && !lower.includes('what should we build')) {
    return true;
  }
  if (lower.includes('reasoning') && !lower.includes('development reasoning')) {
    return true;
  }
  return false;
}
