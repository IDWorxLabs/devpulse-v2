/**
 * Product Faithfulness V2 — Canonical Product Contract.
 *
 * Built once, immediately after prompt understanding, from the same generic, evidence-driven
 * concept extraction used by product-faithfulness-v1 (no LLM, no app-specific rules, no per-domain
 * hardcoding). This contract becomes the single, immutable source of truth for product identity
 * that every downstream generation stage is audited against — no stage may rewrite it.
 */

import {
  extractRequestedConcepts,
  maskNegatedProductPhrases,
} from '../product-faithfulness-v1/product-faithfulness-feature-extractor.js';
import type { ExtractedProductConcept, ProductFaithfulnessInput } from '../product-faithfulness-v1/product-faithfulness-types.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type { CanonicalConceptRecord, CanonicalProductContract, ConceptRole } from './generation-faithfulness-types.js';
import { GENERATION_FAITHFULNESS_V2_CONTRACT } from './generation-faithfulness-types.js';
import { contractConsumptionTrace, shortHashForTrace } from '../production-contract-consumption-trace-v1/index.js';

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
  const looksPluralEntity = last.length > 1 && last.endsWith('s') && !last.endsWith('ss');
  // Multi-word plural noun phrases ("Schedule Slots", "Sales Deals") are ENTITYs even when the
  // head token is also an ACTION_VERB. Applying ACTION_VERBS first dropped legitimate modules.
  if (words.length >= 2 && looksPluralEntity) return 'ENTITY';
  if (ACTION_VERBS.has(first)) return 'ACTION';
  if (/ing$/.test(first) && words.length <= 2) return 'WORKFLOW';
  if (looksPluralEntity) return 'ENTITY';
  return 'CAPABILITY';
}

function dedupe(names: string[]): string[] {
  return [...new Set(names)];
}

/**
 * Product identity, when no curated domain glossary matched, must remain the product the user
 * NAMED — never a concatenation of its own feature/module concepts. Concatenating concepts (the
 * former fallback) absorbs feature/module names INTO the identity, which is precisely the identity
 * drift the contract exists to prevent ("product identity must remain product metadata; feature
 * names must not be absorbed into it"). This reuses the same deterministic, domain-neutral prompt
 * product-name extractor the draft build plan already seeds its appName from — it runs pre-CBGA
 * (the contract is CBGA's input), so consuming it here is not a PPC-1207 parallel-truth violation.
 * Returns null for blank/degenerate/placeholder names so the concept fallback still applies.
 */
function derivePromptProductIdentity(prompt: string | undefined): string | null {
  if (!prompt || prompt.trim().length === 0) return null;
  let appName = '';
  try {
    appName = extractPromptFeatures(prompt).appName ?? '';
  } catch {
    return null;
  }
  const trimmed = appName.trim();
  if (trimmed.length === 0) return null;
  if (/^custom app(lication)?$/i.test(trimmed)) return null;
  return trimmed;
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

  // Prompt-enumerated entity modules (colon lists, feature lists) must become ENTITY concepts
  // even when the head token is also an action verb ("schedule", "book", "track").
  // Only apply when the prompt actually enumerated a product feature list — not when
  // resolveRequiredModules padded a terse prompt with dashboard/settings shell modules.
  if (input.prompt?.trim()) {
    try {
      const extraction = extractPromptFeatures(input.prompt);
      if (extraction.explicitModulesProvided) {
        const slugForConcept = (concept: string): string =>
          concept
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const SHELL_PAD = new Set(['dashboard', 'settings', 'persistence', 'auth', 'navigation-router']);
        for (const moduleId of extraction.requiredModules) {
          if (!moduleId || SHELL_PAD.has(moduleId)) continue;
          const concept = moduleId
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          const existingIdx = records.findIndex((r) => slugForConcept(r.concept) === moduleId);
          if (existingIdx >= 0) {
            records[existingIdx] = { ...records[existingIdx]!, role: 'ENTITY' };
            continue;
          }
          records.push({ readOnly: true, concept, role: 'ENTITY' });
        }
        const explicitModuleIds = new Set(extraction.requiredModules);
        // Affirmative prompt only — negated disclaimers ("Not a task tracker") must not keep
        // glossary concepts alive via token ancestry.
        const affirmativePrompt = maskNegatedProductPhrases(input.prompt);
        const promptTokens = new Set(
          affirmativePrompt
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .flatMap((token) => [token, token.endsWith('s') ? token.slice(0, -1) : token]),
        );
        const normalizedPromptPhrase = affirmativePrompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        const promptBoundRecords = records.filter((record) => {
          if (explicitModuleIds.has(slugForConcept(record.concept))) return true;
          const conceptTokens = record.concept
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .map((token) => (token.endsWith('s') ? token.slice(0, -1) : token));
          if (extraction.structuredCoreModulesProvided) {
            return conceptTokens.length >= 2 && normalizedPromptPhrase.includes(conceptTokens.join(' '));
          }
          return conceptTokens.length > 0 && conceptTokens.every((token) => promptTokens.has(token));
        });
        records.splice(0, records.length, ...promptBoundRecords);
        // Explicit prompt modules define the product's primary information architecture. Keep
        // their prompt order ahead of glossary enrichment so generic supporting concepts (tasks,
        // categories, contacts, etc.) cannot accidentally become the root/primary module.
        const explicitOrder = new Map(
          extraction.requiredModules
            .filter((moduleId) => moduleId && !SHELL_PAD.has(moduleId))
            .map((moduleId, index) => [moduleId, index] as const),
        );
        const originalOrder = new Map(records.map((record, index) => [record.concept, index] as const));
        records.sort((left, right) => {
          const leftOrder = explicitOrder.get(slugForConcept(left.concept));
          const rightOrder = explicitOrder.get(slugForConcept(right.concept));
          if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
          if (leftOrder !== undefined) return -1;
          if (rightOrder !== undefined) return 1;
          return (originalOrder.get(left.concept) ?? 0) - (originalOrder.get(right.concept) ?? 0);
        });
      }
    } catch {
      /* extraction is best-effort; glossary concepts still apply */
    }
  }

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
  /**
   * Product identity priority (autonomous production capability audit — identity faithfulness):
   * 1. Prompt-derived product name (what the founder named / described) — wins over glossary labels.
   * 2. Glossary domainLabel only when the prompt did not yield a usable product name.
   * 3. Concept concatenation / Custom Application as last resort.
   *
   * Previously domainLabel always won, so novel domains matching a glossary trigger
   * keyword were renamed to curated category labels — identity drift that polluted
   * titles, metadata, and coreFeatureLabel selection across unrelated industries.
   * The glossary still supplies concept enrichment via extractRequestedConcepts; only the
   * identity precedence changes.
   */
  const promptDerivedIdentity = derivePromptProductIdentity(input.prompt);
  const productIdentity =
    promptDerivedIdentity ??
    domainLabel ??
    (allConceptNames.length > 0 ? allConceptNames.slice(0, 3).join(' / ') : 'Custom Application');
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

  contractConsumptionTrace({
    requestId: 'N/A',
    buildId: 'N/A',
    projectId: 'N/A',
    promptHash: shortHashForTrace(input.prompt ?? ''),
    stage: 'CANONICAL_PRODUCT_CONTRACT',
    functionName: 'buildCanonicalProductContract',
    sourceFile: 'src/product-faithfulness-v2/canonical-product-contract.ts',
    branchSelected: promptDerivedIdentity
      ? 'PROMPT_DERIVED_IDENTITY'
      : domainLabel
        ? 'DOMAIN_GLOSSARY_WINNER'
        : 'GENERIC_CONCEPT_FALLBACK',
    inputProductIdentity: null,
    outputProductIdentity: productIdentity,
    inputModules: [],
    outputModules: allConceptNames,
    inputRoutes: [],
    outputRoutes: [],
    inputNavigation: navigationExpectations,
    outputNavigation: navigationExpectations,
    inputVisibleText: [],
    outputVisibleText: [],
    fallbackSelected: !promptDerivedIdentity && !domainLabel,
    genericTemplateSelected: false,
    contractConsumed: false,
    cbgaPlanConsumed: false,
    promptBoundedModulePlanConsumed: false,
    universalFeatureContractConsumed: false,
    profileFeatureDefinitionConsumed: false,
  });

  return deepFreeze(contract);
}
