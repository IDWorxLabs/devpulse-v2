/**
 * New Build Decision Report V2 — extends decision reporting with the full evidence-scoring
 * breakdown: decision score, new-build/continuation/ambiguity evidence, confidence, winning
 * evidence, rejected evidence, and the reason AMBIGUOUS was (or was not) selected.
 */

import type { BuildDecisionKind } from './project-context-isolation-types.js';
import type { DecisionEvidenceItem } from './new-build-decision-score.js';
import type { NewBuildDecisionV2Result } from './new-build-decision-authority-v2.js';

export interface NewBuildDecisionScoreBreakdown {
  newBuildScore: number;
  continuationScore: number;
  ambiguityScore: number;
}

export interface NewBuildDecisionReport {
  readOnly: true;
  decision: BuildDecisionKind;
  confidence: number;
  scores: NewBuildDecisionScoreBreakdown;
  newBuildEvidence: DecisionEvidenceItem[];
  continuationEvidence: DecisionEvidenceItem[];
  ambiguityEvidence: DecisionEvidenceItem[];
  winningEvidence: DecisionEvidenceItem[];
  rejectedEvidence: DecisionEvidenceItem[];
  explanation: string;
  /** Populated only when decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION'; null otherwise, which is
   * itself proof of "the reason AMBIGUOUS was NOT selected" for every other decision. */
  ambiguousReason: string | null;
}

export function buildNewBuildDecisionReport(result: NewBuildDecisionV2Result): NewBuildDecisionReport {
  return {
    readOnly: true,
    decision: result.decision,
    confidence: result.confidence,
    scores: {
      newBuildScore: result.newBuildScore,
      continuationScore: result.continuationScore,
      ambiguityScore: result.ambiguityScore,
    },
    newBuildEvidence: result.newBuildEvidence,
    continuationEvidence: result.continuationEvidence,
    ambiguityEvidence: result.ambiguityEvidence,
    winningEvidence: result.winningEvidence,
    rejectedEvidence: result.rejectedEvidence,
    explanation: result.explanation,
    ambiguousReason: result.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION' ? result.message : null,
  };
}

function renderEvidenceList(items: DecisionEvidenceItem[]): string[] {
  if (items.length === 0) return ['  - (none)'];
  return items.map((e) => `  - [${e.id}] (confidence ${e.confidence.toFixed(2)}, source ${e.source}) ${e.reason}`);
}

export function renderNewBuildDecisionReportMarkdown(report: NewBuildDecisionReport): string {
  const lines: string[] = [];
  lines.push('### New Build Decision (V2 — evidence-weighted)');
  lines.push('');
  lines.push(`- Decision: **${report.decision}** (confidence ${(report.confidence * 100).toFixed(0)}%)`);
  lines.push(
    `- Decision score: newBuild=${report.scores.newBuildScore.toFixed(2)}, continuation=${report.scores.continuationScore.toFixed(2)}, ambiguity=${report.scores.ambiguityScore.toFixed(2)}`,
  );
  lines.push(`- Explanation: ${report.explanation}`);
  lines.push(
    `- Why AMBIGUOUS ${report.ambiguousReason ? 'was' : 'was not'} selected: ${report.ambiguousReason ?? 'A decisive NEW_BUILD or CONTINUE_EXISTING_PROJECT signal outweighed the alternative — see winning evidence below.'}`,
  );
  lines.push('- New-build evidence:');
  lines.push(...renderEvidenceList(report.newBuildEvidence));
  lines.push('- Continuation evidence:');
  lines.push(...renderEvidenceList(report.continuationEvidence));
  lines.push('- Ambiguity evidence:');
  lines.push(...renderEvidenceList(report.ambiguityEvidence));
  lines.push('- Winning evidence:');
  lines.push(...renderEvidenceList(report.winningEvidence));
  lines.push('- Rejected evidence:');
  lines.push(...renderEvidenceList(report.rejectedEvidence));
  return lines.join('\n');
}

export interface NewBuildDecisionDiagnostics {
  decision: BuildDecisionKind;
  confidencePercent: number;
  evidenceBreakdown: NewBuildDecisionScoreBreakdown;
  explanation: string;
}

/** Compact diagnostics object for UI/log display — confidence, evidence breakdown, explanation. */
export function buildNewBuildDecisionDiagnostics(result: NewBuildDecisionV2Result): NewBuildDecisionDiagnostics {
  return {
    decision: result.decision,
    confidencePercent: Math.round(result.confidence * 100),
    evidenceBreakdown: {
      newBuildScore: result.newBuildScore,
      continuationScore: result.continuationScore,
      ambiguityScore: result.ambiguityScore,
    },
    explanation: result.explanation,
  };
}
