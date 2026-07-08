/**
 * Product Faithfulness V2 — plain-English report assembly.
 *
 * Extends the Milestone 1 report with concept retention/drift, substitutions, recovered concepts,
 * remaining missing concepts, unexpected dominant concepts, and the repair actions performed.
 */

import type {
  CanonicalProductContract,
  ConceptGraph,
  GenerationFaithfulnessAuditResult,
  GenerationFaithfulnessReport,
  GenerationConsistencyVerdict,
  RepairAction,
} from './generation-faithfulness-types.js';
import { GENERATION_FAITHFULNESS_V2_CONTRACT } from './generation-faithfulness-types.js';

const VERDICT_HEADLINE: Record<GenerationConsistencyVerdict, string> = {
  CONSISTENT: 'Product identity was preserved throughout generation.',
  DRIFTED: 'Product identity drifted somewhat during generation.',
  SUBSTITUTED: 'Some requested concepts were replaced by unrelated ones during generation.',
  INCONSISTENT: 'Generation lost the requested product identity.',
};

function describeList(names: string[], max = 5): string {
  if (names.length === 0) return 'none';
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return rest > 0 ? `${shown.join(', ')}, and ${rest} more` : shown.join(', ');
}

export function buildGenerationFaithfulnessReport(
  contract: CanonicalProductContract,
  conceptGraph: ConceptGraph,
  preRepairAudit: GenerationFaithfulnessAuditResult,
  finalAudit: GenerationFaithfulnessAuditResult,
  repairsPerformed: RepairAction[],
): GenerationFaithfulnessReport {
  const appliedRepairs = repairsPerformed.filter((r) => r.applied);
  const recoveredConcepts = [...new Set(appliedRepairs.map((r) => r.concept))];
  const conceptRetentionPercent = Math.round(finalAudit.conceptRetentionRatio * 100);
  const conceptDriftPercent = Math.round(finalAudit.conceptDriftRatio * 100);

  const reasonParts: string[] = [];
  reasonParts.push(
    `${conceptRetentionPercent}% of the canonical product concepts (${describeList(contract.allConceptNames)}) were retained through generation.`,
  );
  if (recoveredConcepts.length > 0) {
    reasonParts.push(
      `AiDevEngine repaired ${recoveredConcepts.length} concept(s) that had drifted out of a generation stage: ${describeList(recoveredConcepts)}.`,
    );
  }
  if (finalAudit.remainingMissingConcepts.length > 0) {
    reasonParts.push(`Still missing: ${describeList(finalAudit.remainingMissingConcepts)}.`);
  }
  if (finalAudit.conceptSubstitutions.length > 0) {
    const first = finalAudit.conceptSubstitutions[0];
    reasonParts.push(`"${first.disappearedConcept}" appears to have been replaced by "${first.replacedByConcept}" during generation.`);
  }
  if (finalAudit.unexpectedDominantConcepts.length > 0) {
    reasonParts.push(`Generation became dominated by concepts not requested: ${describeList(finalAudit.unexpectedDominantConcepts)}.`);
  }

  return {
    readOnly: true,
    contractVersion: GENERATION_FAITHFULNESS_V2_CONTRACT,
    contract,
    conceptGraph,
    audit: finalAudit,
    preRepairAudit,
    repairsPerformed,
    recoveredConcepts,
    remainingMissingConcepts: finalAudit.remainingMissingConcepts,
    unexpectedDominantConcepts: finalAudit.unexpectedDominantConcepts,
    conceptRetentionPercent,
    conceptDriftPercent,
    verdict: finalAudit.verdict,
    summary: {
      readOnly: true,
      headline: VERDICT_HEADLINE[finalAudit.verdict],
      reason: reasonParts.join(' '),
    },
  };
}
