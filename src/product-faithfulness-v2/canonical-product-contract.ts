/**
 * Product Faithfulness V2 — Canonical Product Contract.
 *
 * Built once, immediately after prompt understanding, from the same generic, evidence-driven
 * concept extraction used by product-faithfulness-v1 (no LLM, no app-specific rules, no per-domain
 * hardcoding). This contract becomes the single, immutable source of truth for product identity
 * that every downstream generation stage is audited against — no stage may rewrite it.
 */

import { extractRequestedConcepts } from '../product-faithfulness-v1/product-faithfulness-feature-extractor.js';
import type { ExtractedProductConcept, ProductFaithfulnessInput } from '../product-faithfulness-v1/product-faithfulness-types.js';
import type { CanonicalConceptRecord, CanonicalProductContract, ConceptRole } from './generation-faithfulness-types.js';
import { GENERATION_FAITHFULNESS_V2_CONTRACT } from './generation-faithfulness-types.js';

/** Generic, domain-agnostic action-verb vocabulary — structural, not tied to any one product. */
const ACTION_VERBS = new Set([
  'add', 'create', 'edit', 'update', 'delete', 'remove', 'search', 'filter', 'sort', 'complete',
  'cancel', 'confirm', 'export', 'import', 'save', 'submit', 'book', 'schedule', 'assign',
  'approve', 'reject', 'send', 'share', 'archive', 'pin', 'mark', 'view', 'track', 'manage',
  'clear', 'reset', 'calculate',
]);

/**
 * Classifies a concept into a generic structural role using only its own name and where it was
 * found — never the specific product it belongs to. Intentionally coarse: it must generalize to
 * every domain, not act as a precise NLP classifier.
 */
export function classifyConceptRole(concept: ExtractedProductConcept): ConceptRole {
  if (concept.sources.includes('NAVIGATION')) return 'NAVIGATION';
  const words = concept.concept.toLowerCase().split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  const last = words[words.length - 1] ?? '';
  if (ACTION_VERBS.has(first)) return 'ACTION';
  if (/ing$/.test(first) && words.length <= 2) return 'WORKFLOW';
  if (last.length > 1 && last.endsWith('s') && !last.endsWith('ss')) return 'ENTITY';
  return 'CAPABILITY';
}

function dedupe(names: string[]): string[] {
  return [...new Set(names)];
}

/** Simple, deterministic, non-cryptographic string hash — stable across runs for identical input. */
function stableContractId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return `contract-${Math.abs(hash).toString(16)}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Object.getOwnPropertyNames(value)) {
      const child = (value as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

/**
 * Builds the immutable Canonical Product Contract from prompt-understanding evidence only —
 * before any architecture, feature contract, or generation has happened. The returned object (and
 * every array/record inside it) is deep-frozen: downstream stages can read it but cannot mutate
 * it, in both type and runtime enforcement.
 */
export function buildCanonicalProductContract(input: ProductFaithfulnessInput): CanonicalProductContract {
  const { concepts, domainLabel } = extractRequestedConcepts(input);

  const records: CanonicalConceptRecord[] = concepts.map((c) => ({
    readOnly: true,
    concept: c.concept,
    role: classifyConceptRole(c),
  }));

  const byRole = (role: ConceptRole): string[] => dedupe(records.filter((r) => r.role === role).map((r) => r.concept));

  const coreEntities = byRole('ENTITY');
  const coreActions = byRole('ACTION');
  const primaryWorkflows = byRole('WORKFLOW');
  const majorFeatureGroups = byRole('CAPABILITY');
  const navigationExpectations = dedupe([...byRole('NAVIGATION'), ...coreEntities, ...primaryWorkflows]);
  const userGoals = dedupe([...primaryWorkflows, ...coreActions]);
  const interactionExpectations = dedupe(coreActions);
  const businessConcepts = dedupe([...coreEntities, ...majorFeatureGroups]);

  const allConceptNames = dedupe(records.map((r) => r.concept));
  const productIdentity =
    domainLabel ?? (allConceptNames.length > 0 ? allConceptNames.slice(0, 3).join(' / ') : 'Custom Application');
  const primaryPurpose =
    businessConcepts.length > 0
      ? `Enable users to work with ${businessConcepts.slice(0, 3).join(', ')}${
          primaryWorkflows.length > 0 ? ` through ${primaryWorkflows.slice(0, 2).join(' and ')}` : ''
        }.`
      : 'Enable users to accomplish the requested task.';

  const contractId = stableContractId(`${input.prompt ?? ''}::${allConceptNames.join('|')}`);

  const contract: CanonicalProductContract = {
    readOnly: true,
    contractVersion: GENERATION_FAITHFULNESS_V2_CONTRACT,
    contractId,
    productIdentity,
    primaryPurpose,
    primaryWorkflows,
    coreEntities,
    coreActions,
    navigationExpectations,
    majorFeatureGroups,
    userGoals,
    interactionExpectations,
    businessConcepts,
    allConcepts: records,
    allConceptNames,
  };

  return deepFreeze(contract);
}
