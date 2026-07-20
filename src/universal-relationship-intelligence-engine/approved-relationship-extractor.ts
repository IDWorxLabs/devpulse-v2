/**
 * Universal Relationship Intelligence Engine V1 — approved relationship extraction.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { RawApprovedRelationship, UniversalRelationshipCardinality } from './universal-relationship-types.js';

export interface ApprovedRelationshipExtractionInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly moduleId: string;
  readonly supplementalTexts?: readonly { readonly text: string; readonly path: string }[];
}

const RELATIONSHIP_PATTERNS: readonly {
  readonly pattern: RegExp;
  readonly cardinality: UniversalRelationshipCardinality;
  readonly sourceIndex: number;
  readonly targetIndex: number;
  readonly sourceOptional: boolean;
}[] = [
  { pattern: /\bone\s+([a-z][\w\s-]{1,40}?)\s+(?:to|has|with)\s+many\s+([a-z][\w\s-]{1,40})\b/gi, cardinality: 'ONE_TO_MANY', sourceIndex: 1, targetIndex: 2, sourceOptional: false },
  { pattern: /\bmany\s+([a-z][\w\s-]{1,40}?)\s+(?:to|linked\s+to)\s+many\s+([a-z][\w\s-]{1,40})\b/gi, cardinality: 'MANY_TO_MANY', sourceIndex: 1, targetIndex: 2, sourceOptional: false },
  { pattern: /\b(?:each|every)\s+([a-z][\w\s-]{1,40}?)\s+(?:belongs\s+to|linked\s+to|references)\s+(?:one\s+)?([a-z][\w\s-]{1,40})\b/gi, cardinality: 'MANY_TO_ONE', sourceIndex: 1, targetIndex: 2, sourceOptional: false },
  { pattern: /\bone\s+([a-z][\w\s-]{1,40}?)\s+(?:optionally\s+)?linked\s+to\s+one\s+([a-z][\w\s-]{1,40})\b/gi, cardinality: 'ONE_TO_ONE', sourceIndex: 1, targetIndex: 2, sourceOptional: true },
  { pattern: /\bone\s+([a-z][\w\s-]{1,40}?)\s+(?:to|has|with)\s+one\s+([a-z][\w\s-]{1,40})\b/gi, cardinality: 'ONE_TO_ONE', sourceIndex: 1, targetIndex: 2, sourceOptional: false },
  { pattern: /\b([a-z][\w\s-]{1,40}?)\s+parent[- ]child\b/gi, cardinality: 'PARENT_CHILD', sourceIndex: 1, targetIndex: 1, sourceOptional: false },
  { pattern: /\b([a-z][\w\s-]{1,40}?)\s+reports\s+to\s+another\s+\1\b/gi, cardinality: 'SELF_REFERENTIAL', sourceIndex: 1, targetIndex: 1, sourceOptional: false },
  { pattern: /\b([a-z][\w\s-]{1,40}?)\s+hierarchy\b/gi, cardinality: 'PARENT_CHILD', sourceIndex: 1, targetIndex: 1, sourceOptional: false },
];

export function extractApprovedRelationshipsFromEnvelope(
  input: ApprovedRelationshipExtractionInput,
): RawApprovedRelationship[] {
  const { envelope } = input;
  const texts = [...collectEnvelopeRelationshipTexts(envelope), ...(input.supplementalTexts ?? [])];
  const results: RawApprovedRelationship[] = [];
  const seen = new Set<string>();

  for (const { text, path } of texts) {
    for (const def of RELATIONSHIP_PATTERNS) {
      def.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = def.pattern.exec(text)) !== null) {
        const sourceLabel = cleanEntityLabel(match[def.sourceIndex] ?? '');
        const targetLabel = cleanEntityLabel(match[def.targetIndex] ?? '');
        if (!sourceLabel || !targetLabel) continue;
        const key = `${sourceLabel}|${targetLabel}|${def.cardinality}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          label: `${sourceLabel} → ${targetLabel}`,
          sourceEntityLabel: sourceLabel,
          targetEntityLabel: targetLabel,
          cardinalityHint: def.cardinality,
          sourceOptional: def.sourceOptional || /\boptionally\b/i.test(match[0]),
          targetOptional: /\boptionally\b/i.test(match[0]),
          sourceEnvelopePath: path,
          ordered: def.cardinality === 'PARENT_CHILD',
        });
      }
    }
  }

  return results;
}

function collectEnvelopeRelationshipTexts(
  envelope: ApprovedProductionBuildEnvelope,
): { text: string; path: string }[] {
  const contract = envelope.canonicalProductContract;
  const out: { text: string; path: string }[] = [];
  const push = (values: readonly string[] | undefined, path: string) => {
    if (!values) return;
    for (const value of values) {
      if (value.trim()) out.push({ text: value, path });
    }
  };
  push(contract.coreEntities, 'canonicalProductContract.coreEntities');
  push(contract.coreActions, 'canonicalProductContract.coreActions');
  push(contract.primaryWorkflows, 'canonicalProductContract.primaryWorkflows');
  push(contract.navigationExpectations, 'canonicalProductContract.navigationExpectations');
  push(contract.businessConcepts, 'canonicalProductContract.businessConcepts');
  push(contract.majorFeatureGroups, 'canonicalProductContract.majorFeatureGroups');
  push(contract.allConceptNames, 'canonicalProductContract.allConceptNames');
  for (const entry of envelope.approvedModulePlan.moduleEntries) {
    if (entry.contractSource?.trim()) {
      out.push({ text: entry.contractSource, path: `approvedModulePlan.moduleEntries[${entry.moduleId}].contractSource` });
    }
  }
  return out;
}

function cleanEntityLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '');
}
