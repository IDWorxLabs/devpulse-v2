/**
 * Universal Business Rule Engine V1 — approved business rule extraction.
 *
 * Reads only approved envelope truth. Does not invent formulas, guess
 * thresholds, or infer field dependencies from names alone. Rules that lack
 * deterministic semantics are surfaced so the classifier can block them.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { RawApprovedBusinessRule, UniversalBusinessRuleKind } from './universal-business-rule-types.js';

export interface ApprovedBusinessRuleExtractionInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly moduleId: string;
  readonly supplementalTexts?: readonly { readonly text: string; readonly path: string }[];
}

const RULE_PATTERNS: readonly { readonly pattern: RegExp; readonly ruleKind: UniversalBusinessRuleKind }[] = [
  { pattern: /\brequired\b|\bmust\s+(?:be\s+)?(?:provided|entered|filled)\b|\bmandatory\b/gi, ruleKind: 'FIELD_VALIDATION' },
  { pattern: /\bgreater\s+than\b|\bless\s+than\b|\bat\s+least\b|\bat\s+most\b|\bnon[- ]negative\b|\bpositive\b/gi, ruleKind: 'FIELD_VALIDATION' },
  { pattern: /\bunique\b|\bno\s+duplicate\b|\bduplicate\s+prevention\b/gi, ruleKind: 'CROSS_RECORD' },
  { pattern: /\bstart\b[^.]{0,40}\bbefore\b[^.]{0,40}\bend\b|\bend\b[^.]{0,40}\bafter\b[^.]{0,40}\bstart\b/gi, ruleKind: 'CROSS_FIELD' },
  { pattern: /\btotal\b|\bsum\s+of\b|\bsubtotal\b/gi, ruleKind: 'AGGREGATION' },
  { pattern: /\baverage\b|\bcount\s+of\b|\bnumber\s+of\b/gi, ruleKind: 'AGGREGATION' },
  { pattern: /\bpercentage\b|\bpercent\b|\bdiscount\b|\bratio\b/gi, ruleKind: 'CALCULATION' },
  { pattern: /\bcalculat(?:e|ed|ion)\b|\bformula\b|\bcomput(?:e|ed|ation)\b/gi, ruleKind: 'CALCULATION' },
  { pattern: /\bderived\b|\bscore\b|\bprogress\b|\bclassification\b/gi, ruleKind: 'DERIVED_VALUE' },
  { pattern: /\bapprov(?:e|al)\b[^.]{0,60}\b(?:only|when|if)\b|\beligib(?:le|ility)\b/gi, ruleKind: 'ACTION_ELIGIBILITY' },
  { pattern: /\bcannot\s+delete\b|\bdelete\s+(?:is\s+)?(?:blocked|restricted|prevented)\b/gi, ruleKind: 'RELATIONSHIP_RULE' },
  { pattern: /\bstatus\s+(?:may|can|must)\s+(?:move|change|transition)\b|\btransition\b[^.]{0,60}\b(?:only|when|if)\b/gi, ruleKind: 'STATE_TRANSITION' },
  { pattern: /\bworkflow\b[^.]{0,60}\bcomplete\b|\bcomplete\b[^.]{0,60}\b(?:only|when|all)\b/gi, ruleKind: 'WORKFLOW_GUARD' },
  { pattern: /\blimit\b|\bthreshold\b|\bmaximum\s+of\b|\bminimum\s+of\b/gi, ruleKind: 'POLICY' },
  // Future-capability rule declarations are extracted so the classifier can
  // explicitly block them — they must never silently disappear.
  { pattern: /\breal[- ]?time\b|\bexternal\s+(?:api|data)\b|\bmarket\s+data\b|\bexchange\s+rate\b|\bavailability\b|\bauthenticat\w*\b|\bforecast\w*\b/gi, ruleKind: 'POLICY' },
];

export function extractApprovedBusinessRulesFromEnvelope(
  input: ApprovedBusinessRuleExtractionInput,
): RawApprovedBusinessRule[] {
  const texts = [...collectEnvelopeRuleTexts(input.envelope), ...(input.supplementalTexts ?? [])];
  const results: RawApprovedBusinessRule[] = [];
  const seen = new Set<string>();

  for (const { text, path } of texts) {
    for (const def of RULE_PATTERNS) {
      def.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = def.pattern.exec(text)) !== null) {
        const sentence = extractSentence(text, match.index);
        const key = `${def.ruleKind}|${sentence}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          label: sentence,
          ruleKind: def.ruleKind,
          sourceEnvelopePath: path,
          moduleId: input.moduleId,
        });
      }
    }
  }

  return results;
}

function extractSentence(text: string, matchIndex: number): string {
  const sentenceStart = Math.max(text.lastIndexOf('.', matchIndex), text.lastIndexOf('\n', matchIndex)) + 1;
  let sentenceEnd = text.indexOf('.', matchIndex);
  if (sentenceEnd === -1) sentenceEnd = text.length;
  // Window centered on the match so long sentences never truncate away the
  // matched rule phrase (which drives normalization and classification).
  const start = Math.max(sentenceStart, matchIndex - 80);
  const end = Math.min(sentenceEnd, matchIndex + 140);
  return text.slice(start, end).trim().replace(/\s+/g, ' ').slice(0, 200);
}

function collectEnvelopeRuleTexts(envelope: ApprovedProductionBuildEnvelope): { text: string; path: string }[] {
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
