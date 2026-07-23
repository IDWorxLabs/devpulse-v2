/**
 * Product Faithfulness V1 — feature extraction.
 *
 * Deterministic, evidence-driven, no LLM. Two extraction modes share the same generic
 * tokenizer + concept glossary:
 *
 *  - Requested extraction (from the prompt and related planning evidence) is broad: a short
 *    domain phrase like "appointment booking system" is expected to imply a full set of
 *    concepts a founder would recognize as part of that product (calendar, customers, staff,
 *    dashboard, ...), even if those exact words never appear in the prompt.
 *
 *  - Generated extraction (from routes, components, feature modules, navigation, headings, DOM
 *    text, manifest, feature contract) is direct-evidence-only: a concept is only reported when
 *    the actual generated evidence contains text that matches it. Generated evidence is never
 *    "guessed" beyond what was really produced — that would defeat the entire purpose of
 *    comparing intent against reality.
 *
 * The concept glossary below is a generic, reusable lexicon of common product domains (the same
 * kind of reference data a spellchecker or thesaurus ships with). It is not tied to any specific
 * generated project, project id, or project name — it is intentionally generic so it applies to
 * any prompt that falls into one of these common product shapes, and it is combined with a
 * domain-agnostic fallback tokenizer so unrecognized domains still produce comparable concepts.
 */

import type {
  DomainCandidateEvidence,
  DomainClassificationDiagnostics,
  DomainEvidenceItem,
  ExtractedProductConcept,
  ProductConceptSource,
  ProductFaithfulnessInput,
} from './product-faithfulness-types.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';

interface ConceptDefinition {
  concept: string;
  keywords: string[];
}

interface DomainBundle {
  domain: string;
  triggerKeywords: string[];
  concepts: ConceptDefinition[];
}

/** Generic, reusable product-domain glossary — not specific to any one generated project. */
const DOMAIN_GLOSSARY: DomainBundle[] = [
  {
    domain: 'Calculator / Arithmetic Utility',
    triggerKeywords: ['calculator', 'calculate', 'calculation', 'arithmetic'],
    concepts: [
      { concept: 'Addition', keywords: ['addition', 'plus', 'sum'] },
      { concept: 'Subtraction', keywords: ['subtraction', 'subtract', 'minus'] },
      {
        concept: 'Multiplication',
        // Production Generator Contract Consumption Fix V1 — explicit inflected forms replace the
        // previous truncated stem "multipl", which unsafely prefix-matched the unrelated generic
        // word "multiple" (as in "multiple payment methods"). Explicit forms avoid that collision
        // without narrowing legitimate coverage.
        keywords: ['multiplication', 'multiply', 'multiplying', 'multiplies', 'multiplied', 'times', 'product'],
      },
      {
        concept: 'Division',
        // Same fix as Multiplication above — "divis" was a truncated stem; explicit forms only.
        keywords: ['division', 'divide', 'dividing', 'divides', 'divided', 'quotient'],
      },
      // "Display" moved to GENERIC_LOW_SIGNAL_WORDS below — "display" alone appears in virtually
      // every UI-driven prompt regardless of domain and must never independently classify
      // Calculator / Arithmetic Utility.
      { concept: 'Display', keywords: ['readout'] },
      { concept: 'Numeric Keypad', keywords: ['keypad', 'numpad', 'digit', 'numeric'] },
      { concept: 'Equals', keywords: ['equals', 'equal'] },
      { concept: 'Clear', keywords: ['clear', 'reset'] },
    ],
  },
  {
    domain: 'Todo / Task Management',
    triggerKeywords: ['todo', 'to-do', 'task', 'checklist'],
    concepts: [
      { concept: 'Tasks', keywords: ['task', 'tasks'] },
      { concept: 'Task List', keywords: ['tasklist'] },
      { concept: 'Add Task', keywords: ['addtask', 'newtask', 'createtask'] },
      // Phrase-like / compound only — bare "complete"/"done" are generic verbs and create false
      // modules (and collide with contact/task "mark complete" actions that are behaviors, not entities).
      { concept: 'Mark Complete', keywords: ['markcomplete', 'markdone', 'checked'] },
      { concept: 'Due Date', keywords: ['duedate', 'deadline', 'due'] },
      { concept: 'Categories', keywords: ['category', 'categories', 'tag', 'tags'] },
      { concept: 'Reminders', keywords: ['reminder', 'reminders', 'notify', 'notification'] },
      { concept: 'Checklist', keywords: ['checklist'] },
    ],
  },
  {
    domain: 'Appointment Booking / Scheduling',
    // 'schedule'/'scheduling' remain trigger keywords (they help CLASSIFY the domain) but are not
    // exposed as their own concept: the only forms that literally appear in real scheduling prompts
    // are inflections of "reschedule" (a distinct workflow), and a 6+ char concept keyword would
    // substring-match "rescheduling" and inject a spurious "Scheduling" module. Availability, when a
    // prompt genuinely requests it, is surfaced from the prompt's own requested entities by the
    // arbitrary-domain supplement below — it is not part of the bare-domain starter bundle. Dashboard
    // is a generic system-shell surface, never a product entity, so it is likewise not a bundle
    // concept. The bundle therefore lists only the domain's genuine, distinctive product entities.
    triggerKeywords: ['booking', 'appointment', 'reservation', 'schedule', 'scheduling', 'salon', 'clinic'],
    concepts: [
      { concept: 'Appointments', keywords: ['appointment', 'appointments'] },
      { concept: 'Calendar', keywords: ['calendar'] },
      { concept: 'Customers', keywords: ['customer', 'customers', 'client', 'clients'] },
      { concept: 'Services', keywords: ['service', 'services'] },
      { concept: 'Booking', keywords: ['booking', 'book', 'reserve', 'reservation'] },
      { concept: 'Staff', keywords: ['staff', 'employee', 'employees', 'stylist', 'provider'] },
    ],
  },
  {
    domain: 'CRM / Customer Relationship Management',
    // Bare "pipeline" alone is too broad (leasing/ops pipelines) — require CRM-ish nouns.
    triggerKeywords: ['crm', 'sales pipeline', 'lead', 'leads', 'customerrelationship'],
    concepts: [
      // Customers ≠ Contacts. Matching `contacts` only against Customers made a contact/task
      // manager qualify as CRM (two distinct concepts hit from one token) and inject Customers.
      { concept: 'Customers', keywords: ['customer', 'customers', 'client', 'clients'] },
      { concept: 'Leads', keywords: ['lead', 'leads'] },
      { concept: 'Prospects', keywords: ['prospect', 'prospects'] },
      { concept: 'Pipeline', keywords: ['pipeline', 'stage', 'stages'] },
      { concept: 'Deals', keywords: ['deal', 'deals', 'opportunity', 'opportunities'] },
      { concept: 'Sales', keywords: ['sales', 'revenue'] },
      { concept: 'Companies', keywords: ['company', 'companies', 'account', 'accounts'] },
      { concept: 'Dashboard', keywords: ['dashboard'] },
      { concept: 'Contacts', keywords: ['contact', 'contacts'] },
    ],
  },
  {
    domain: 'Contact / Task Management',
    triggerKeywords: ['contactmanager', 'taskmanager', 'contactandtask'],
    concepts: [
      { concept: 'Contacts', keywords: ['contact', 'contacts'] },
      { concept: 'Tasks', keywords: ['task', 'tasks'] },
      { concept: 'Notes', keywords: ['note', 'notes'] },
      { concept: 'Categories', keywords: ['category', 'categories', 'tag', 'tags'] },
    ],
  },
  {
    // Inventory / stock control is one of the generic business domains this glossary is explicitly
    // meant to cover (see the header comment below). Triggers are intentionally inventory-specific
    // ("stock", "supplier", "reorder", "warehouse", "sku") and deliberately EXCLUDE the bare word
    // "inventory" so an app that merely mentions inventory in passing (e.g. a restaurant ops app
    // listing "inventory" among many food-service concepts) is not misclassified as an inventory
    // product. A genuine inventory prompt reliably contains stock/supplier/reorder vocabulary.
    domain: 'Inventory / Stock Management',
    triggerKeywords: ['stock', 'supplier', 'suppliers', 'reorder', 'restock', 'warehouse', 'sku'],
    concepts: [
      { concept: 'Products', keywords: ['product', 'products'] },
      { concept: 'Stock Records', keywords: ['stock', 'stocklevel', 'stockrecord', 'stockrecords', 'quantityonhand'] },
      { concept: 'Suppliers', keywords: ['supplier', 'suppliers', 'vendor', 'vendors'] },
      { concept: 'Stock Adjustments', keywords: ['adjustment', 'adjustments', 'stockadjustment', 'stockadjustments'] },
      { concept: 'Reorder Rules', keywords: ['reorder', 'reorderrule', 'reorderrules', 'reorderlevel', 'restock'] },
    ],
  },
  {
    domain: 'Notes / Note-Taking',
    triggerKeywords: ['note', 'notes', 'notetaking'],
    concepts: [
      { concept: 'Notes', keywords: ['note', 'notes'] },
      { concept: 'Note Editor', keywords: ['noteeditor', 'editnote'] },
      { concept: 'Note List', keywords: ['notelist'] },
      { concept: 'Tags', keywords: ['notetag', 'notetags'] },
      { concept: 'Search Notes', keywords: ['searchnotes', 'notesearch'] },
      { concept: 'Archive', keywords: ['archive'] },
      { concept: 'Pin Note', keywords: ['pinnednote', 'pinnote'] },
      { concept: 'Rich Text', keywords: ['richtext', 'formatting'] },
    ],
  },
];

/**
 * Product Faithfulness Glossary Precision V1 — generic, cross-domain business verbs/nouns that
 * appear in nearly every application prompt regardless of actual product domain (a restaurant app,
 * an accounting app, a gym app, an inventory app, a sales app, a hotel app, etc. all legitimately
 * say "calculate", "manage", "product", "dashboard", ...). Matching ANY of these words must never,
 * by itself, be treated as evidence for one specific domain over another — they carry near-zero
 * domain-discriminating signal. This set is intentionally domain-agnostic (linguistic, not tied to
 * calculator/restaurant/booking/CRM/or any other specific product) and applies uniformly to every
 * bundle in DOMAIN_GLOSSARY, current and future.
 */
const GENERIC_LOW_SIGNAL_WORDS = new Set([
  // generic business verbs
  'calculate', 'calculation', 'manage', 'track', 'view', 'record', 'create', 'update', 'delete',
  'remove', 'save', 'print', 'search', 'list', 'filter', 'add', 'edit',
  // generic business nouns
  'product', 'products', 'system', 'systems', 'platform', 'platforms', 'application', 'applications',
  'app', 'apps', 'dashboard', 'dashboards', 'feature', 'features', 'module', 'modules', 'manager',
  'managers', 'user', 'users',
  // generic UI vocabulary — appears in virtually every application regardless of domain (a
  // "screen" showing something is not, by itself, evidence of any specific product domain)
  'screen', 'screens', 'display', 'displays', 'value', 'values',
]);

/** Weighted-evidence contribution of a single matched keyword — see GENERIC_LOW_SIGNAL_WORDS. */
function evidenceStrength(keyword: string): 'STRONG' | 'GENERIC' {
  return GENERIC_LOW_SIGNAL_WORDS.has(keyword.toLowerCase()) ? 'GENERIC' : 'STRONG';
}

/** A single keyword's match weight used by the domain-confidence calculation below. */
const STRONG_EVIDENCE_WEIGHT = 2;
const GENERIC_EVIDENCE_WEIGHT = 0.5;
/** Confidence is normalized against this so two independent strong matches reach full confidence. */
const CONFIDENCE_NORMALIZER = STRONG_EVIDENCE_WEIGHT * 2;

/** Generic English stopwords + build-prompt filler words that must never become "concepts". */
const NOISE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'that', 'this', 'these', 'those', 'to', 'of', 'in',
  'on', 'is', 'are', 'be', 'it', 'as', 'by', 'from', 'into', 'your', 'their', 'our', 'my',
  'build', 'building', 'built', 'create', 'creating', 'create', 'make', 'making', 'develop',
  'app', 'apps', 'application', 'applications', 'system', 'simple', 'basic', 'modern', 'nice',
  'using', 'use', 'user', 'users', 'allows', 'allow', 'want', 'would', 'like', 'please',
  'page', 'pages', 'component', 'components', 'view', 'views', 'form', 'forms', 'button',
  'buttons', 'screen', 'screens', 'item', 'items', 'click', 'panel', 'section', 'module',
  'list', 'lists', 'picker', 'confirmation', 'summary',
  'modules', 'service', 'services', 'provider', 'context', 'index', 'main', 'home', 'base',
  'generic', 'data', 'value', 'values', 'name', 'names', 'type', 'types', 'default', 'common',
  'shared', 'layout', 'wrapper', 'container', 'web', 'v1', 'v2', 'new', 'get', 'set', 'all',
  'react', 'html', 'css', 'js', 'ts', 'tsx',
]);

/**
 * Masks negated product-shape clauses so glossary matching does not treat disclaimers as
 * affirmative domain evidence (e.g. "Not a task tracker" / "Not a CRM" / "rather than inventory
 * management"). Structural negation grammar only — domain-agnostic, no product-specific rules.
 * Affirmative redefinitions ("Tasks means crew tasking…") are left intact.
 */
export function maskNegatedProductPhrases(text: string): string {
  if (!text) return text;
  return text
    .replace(/\b(?:isn'?t|aren'?t|wasn'?t|weren'?t|ain'?t)\s+(?:a|an)\s+[^.,;\n!?]+/gi, ' ')
    .replace(/\b(?:is|are|was|were)\s+not\s+(?:a|an)\s+[^.,;\n!?]+/gi, ' ')
    .replace(/\b(?:not|never)\s+(?:a|an)\s+[^.,;\n!?]+/gi, ' ')
    .replace(/\brather\s+than\s+[^.,;\n!?]+/gi, ' ')
    .replace(/\binstead\s+of\s+[^.,;\n!?]+/gi, ' ');
}

/** camelCase/PascalCase-aware tokenizer — splits on non-alphanumeric AND camel-case boundaries. */
function tokenize(text: string): string[] {
  if (!text) return [];
  const spaced = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** Per-word, separator-free lowercase blobs — lets compound keywords (e.g. "addtask") match
 * camelCase evidence such as "AddTaskForm" even though the token-boundary tokenizer above splits
 * it into separate "add" / "task" / "form" tokens. Splits on whitespace FIRST (preserving the
 * boundary between distinct evidence entries — route names, component names, etc.) before
 * stripping remaining punctuation within each word, so two unrelated adjacent entries (e.g.
 * "...Task" next to "List...") can never accidentally glue into a false compound match. Only
 * used for keywords long enough (>=6 chars) that a substring match is unlikely to be coincidental. */
function joinedBlobWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
}

/**
 * Production Generator Contract Consumption Fix V1 — prefix-match safety margin raised from 4 to
 * 5 characters, and the maximum allowed "leftover suffix" length is capped: a token may only be
 * considered a match via prefix when the unmatched remainder is short enough to plausibly be an
 * inflectional ending (e.g. "-ing", "-ed", "-s", "-es"). This blocks coincidental collisions where
 * an unrelated, longer word happens to share a short prefix with a glossary keyword.
 */
const MIN_PREFIX_MATCH_KEYWORD_LENGTH = 5;
const MAX_PREFIX_MATCH_SUFFIX_LENGTH = 3;

function hasKeyword(tokens: Set<string>, blobWords: string[], keyword: string): boolean {
  const kw = keyword.toLowerCase();
  if (tokens.has(kw)) return true;
  if (kw.length >= MIN_PREFIX_MATCH_KEYWORD_LENGTH) {
    for (const t of tokens) {
      if (t.startsWith(kw) && t.length - kw.length <= MAX_PREFIX_MATCH_SUFFIX_LENGTH) return true;
    }
  }
  if (kw.length >= 6) {
    for (const w of blobWords) {
      if (w.includes(kw)) return true;
    }
  }
  return false;
}

/**
 * Every keyword in `keywords` that actually matched, tagged with its evidence strength. Used by
 * both concept-level matching and domain-level classification so a lone generic word (e.g.
 * "product", "calculate") is visible as evidence but never treated as decisive on its own.
 */
function matchingKeywords(tokens: Set<string>, blobWords: string[], keywords: string[]): DomainEvidenceItem[] {
  const hits: DomainEvidenceItem[] = [];
  for (const kw of keywords) {
    if (hasKeyword(tokens, blobWords, kw)) {
      hits.push({ readOnly: true, keyword: kw, strength: evidenceStrength(kw), concept: null });
    }
  }
  return hits;
}

/**
 * Product Faithfulness Glossary Precision V1 — weighted domain-evidence classification.
 *
 * Replaces the previous "any single trigger keyword wins" strategy. A domain only qualifies to
 * win when it has at least one STRONG (domain-specific) matched keyword — trigger or concept.
 * Generic evidence (see GENERIC_LOW_SIGNAL_WORDS) is recorded for diagnostics but can never, by
 * itself or accumulated, qualify a domain. Among qualifying domains, the highest-confidence one
 * wins; ties are broken deterministically by glossary declaration order.
 */
function classifyDomainEvidence(tokens: Set<string>, blobWords: string[]): DomainClassificationDiagnostics {
  const candidates: DomainCandidateEvidence[] = DOMAIN_GLOSSARY.map((bundle) => {
    const triggerHits = matchingKeywords(tokens, blobWords, bundle.triggerKeywords);
    const conceptHitsByConcept = bundle.concepts.map((def) => ({
      concept: def.concept,
      hits: matchingKeywords(tokens, blobWords, def.keywords).map((h) => ({ ...h, concept: def.concept })),
    }));

    const allHits = [...triggerHits, ...conceptHitsByConcept.flatMap((c) => c.hits)];
    const dedupedByKeyword = new Map<string, DomainEvidenceItem>();
    for (const hit of allHits) {
      if (!dedupedByKeyword.has(hit.keyword)) dedupedByKeyword.set(hit.keyword, hit);
    }
    const deduped = [...dedupedByKeyword.values()];
    const matchedEvidence = deduped.filter((h) => h.strength === 'STRONG');
    const ignoredGenericEvidence = deduped.filter((h) => h.strength === 'GENERIC');
    const missingEvidence = conceptHitsByConcept.filter((c) => c.hits.length === 0).map((c) => c.concept);

    // Production Generator Contract Consumption Fix V1 — a domain only qualifies when it has
    // distinctive evidence: either an explicit trigger keyword match (the glossary's own
    // domain-defining vocabulary, e.g. "calculator", "arithmetic", "todo", "crm") OR at least two
    // DIFFERENT concepts each contributing their own strong hit. A single strong hit on a single
    // concept (e.g. one lone word coincidentally matching one keyword) is never, by itself,
    // distinctive enough to classify an entire product domain. This is fully generic — it applies
    // uniformly to every bundle, current and future, with no per-domain special-casing.
    const triggerQualifies = triggerHits.some((h) => h.strength === 'STRONG');
    const distinctConceptsWithStrongHit = new Set(
      conceptHitsByConcept.filter((c) => c.hits.some((h) => h.strength === 'STRONG')).map((c) => c.concept),
    ).size;
    const qualifies = triggerQualifies || distinctConceptsWithStrongHit >= 2;
    const rawScore = matchedEvidence.length * STRONG_EVIDENCE_WEIGHT + ignoredGenericEvidence.length * GENERIC_EVIDENCE_WEIGHT;
    const confidence = qualifies ? Math.min(1, rawScore / CONFIDENCE_NORMALIZER) : 0;

    return {
      readOnly: true as const,
      domain: bundle.domain,
      confidence,
      qualifies,
      matchedEvidence,
      ignoredGenericEvidence,
      missingEvidence,
      rejectedReason: null, // filled in below once the winner is known
    };
  });

  const qualifying = candidates.filter((c) => c.qualifies);
  // Production Generator Contract Consumption Fix V1 — a genuine tie at the top confidence score
  // across multiple DISTINCT domains is ambiguous evidence. Previously this silently picked
  // whichever bundle happened to be declared first in DOMAIN_GLOSSARY; now it deterministically
  // yields "no winner" instead, so callers fall back to a neutral/custom product identity rather
  // than an arbitrary glossary entry.
  const maxConfidence = qualifying.length ? Math.max(...qualifying.map((c) => c.confidence)) : 0;
  const topTier = qualifying.filter((c) => c.confidence === maxConfidence);
  const winner = topTier.length === 1 ? topTier[0] : null;
  const isAmbiguousTie = qualifying.length > 0 && topTier.length > 1;

  const finalCandidates = candidates.map((c) => {
    if (winner && c.domain === winner.domain) return { ...c, rejectedReason: null };
    if (!c.qualifies) {
      const genericWords = c.ignoredGenericEvidence.map((h) => `"${h.keyword}"`).join(', ');
      return {
        ...c,
        rejectedReason: genericWords
          ? `No distinctive evidence matched — only generic/single-concept evidence (${genericWords}), which never independently classifies a domain.`
          : 'No evidence (strong or generic) matched this domain.',
      };
    }
    if (isAmbiguousTie && topTier.some((t) => t.domain === c.domain)) {
      return {
        ...c,
        rejectedReason: `Ambiguous tie at confidence ${c.confidence.toFixed(2)} with ${topTier.length - 1} other domain(s) — no domain is treated as winning on a tie.`,
      };
    }
    return {
      ...c,
      rejectedReason: winner
        ? `Lower confidence (${c.confidence.toFixed(2)}) than winning domain "${winner.domain}" (${winner.confidence.toFixed(2)}).`
        : null,
    };
  });

  const explanation = winner
    ? `"${winner.domain}" won with confidence ${winner.confidence.toFixed(2)} on strong evidence: ${winner.matchedEvidence
        .map((h) => `"${h.keyword}"`)
        .join(', ')}.`
    : isAmbiguousTie
      ? `Ambiguous: ${topTier.length} domains (${topTier.map((c) => `"${c.domain}"`).join(', ')}) tied at confidence ${maxConfidence.toFixed(2)} — no single domain is distinctive enough to win, so a neutral/custom identity is used instead.`
      : 'No domain qualified: every candidate had only generic or non-distinctive evidence (or none at all).';

  return {
    readOnly: true,
    winningDomain: winner?.domain ?? null,
    winningConfidence: winner?.confidence ?? 0,
    candidates: finalCandidates.sort((a, b) => b.confidence - a.confidence),
    explanation,
  };
}

/** Exported for diagnostics/reporting/validation — see classifyDomainEvidence above. */
export function classifyRequestedDomain(text: string): DomainClassificationDiagnostics {
  const affirmative = maskNegatedProductPhrases(text);
  return classifyDomainEvidence(new Set(tokenize(affirmative)), joinedBlobWords(affirmative));
}

function directConceptMatches(tokens: Set<string>, blobWords: string[], sources: ProductConceptSource[]): ExtractedProductConcept[] {
  const found: ExtractedProductConcept[] = [];
  for (const bundle of DOMAIN_GLOSSARY) {
    for (const def of bundle.concepts) {
      const hits = matchingKeywords(tokens, blobWords, def.keywords);
      // A concept is only reported when it has its own STRONG (domain-specific) evidence.
      // Generic-only matches (e.g. "product" alone for "Multiplication") are recorded nowhere near
      // as decisive — they never independently produce a concept.
      if (hits.some((h) => h.strength === 'STRONG')) {
        found.push({ readOnly: true, concept: def.concept, sources });
      }
    }
  }
  return found;
}

/**
 * Preserves a glossary concept when the prompt contains one of that concept's own evidenced
 * surface forms. This keeps enumerated-prompt filtering synonym-aware ("reservation" is valid
 * ancestry for its canonical concept) without admitting concepts from an unrelated bundle.
 */
function conceptHasOwnPromptEvidence(
  concept: string,
  promptTokens: Set<string>,
  promptBlobWords: string[],
): boolean {
  const normalizedConcept = concept.toLowerCase();
  for (const bundle of DOMAIN_GLOSSARY) {
    const definition = bundle.concepts.find((candidate) => candidate.concept.toLowerCase() === normalizedConcept);
    if (definition && matchingKeywords(promptTokens, promptBlobWords, definition.keywords).length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Terse-vs-enumerated prompt classification — fully generic, no per-domain vocabulary.
 *
 * A prompt "explicitly enumerates" its entities when it carries a real list of requested items
 * (e.g. "...with contacts, categories, notes, tasks, and local persistence"). Such a prompt is
 * user-scoped: only the concepts it actually lists must be surfaced, so the build never drifts into
 * modules the user did not ask for. A terse prompt that merely NAMES a domain ("build an appointment
 * booking system for a hair salon") carries no such list, and should expand to the winning domain's
 * full starter bundle so a bare domain name still yields a usable, recognizable product.
 *
 * Detection is purely structural: a comma-separated list of two or more items, or a coordinated
 * "X and Y" / "X & Y" list introduced by a generic scoping cue (with/including/featuring/...). It
 * contains no product-domain words, so it applies uniformly to every current and future prompt.
 */
function promptEnumeratesEntities(prompt: string): boolean {
  const text = (prompt ?? '').toLowerCase();
  if (!text.trim()) return false;
  if ((text.match(/,/g) ?? []).length >= 2) return true;
  return /\b(with|including|featuring|containing|having|tracks?|manages?|supporting|supports?|plus)\b[^.]*\b(and|&)\b/.test(
    text,
  );
}

function domainWideConcepts(
  tokens: Set<string>,
  blobWords: string[],
  sources: ProductConceptSource[],
  promptEnumerates: boolean,
): { concepts: ExtractedProductConcept[]; domainLabel: string | null; domainClassification: DomainClassificationDiagnostics } {
  const domainClassification = classifyDomainEvidence(tokens, blobWords);
  if (!domainClassification.winningDomain) {
    return { concepts: [], domainLabel: null, domainClassification };
  }
  const bundle = DOMAIN_GLOSSARY.find((b) => b.domain === domainClassification.winningDomain);
  if (!bundle) {
    return { concepts: [], domainLabel: null, domainClassification };
  }
  // Product Faithfulness — evidence-driven concept selection (anti-drift) for EXPLICITLY-ENUMERATED
  // prompts. A domain bundle enumerates the FULL vocabulary of a domain, but a prompt that lists its
  // own entities only requested a subset. Emitting every bundle concept for such a prompt injects
  // unrequested modules (e.g. an appointment prompt listing contacts/services/appointments/
  // availability would also generate calendar/booking/staff — unapproved product drift). So for an
  // enumerated prompt, a bundle concept is only surfaced when it has its OWN prompt evidence.
  //
  // TERSE prompts are the opposite case: a bare domain name ("build an appointment booking system")
  // scopes nothing, so it must expand to the domain's full starter bundle — otherwise it would
  // under-extract to the one or two words it happens to mention and every other genuine part of the
  // product would be flagged as unexpected drift. The terse-vs-enumerated decision is made once, up
  // front, from the prompt's structure (see promptEnumeratesEntities) and is fully generic.
  //
  // Concept selection within the ALREADY-WON domain. `GENERIC_LOW_SIGNAL_WORDS` exists to stop a
  // generic word from *classifying* a domain (see classifyDomainEvidence) — that guard has already
  // done its job by the time we reach here. When choosing WHICH of the winning bundle's concepts to
  // surface, a concept whose own vocabulary literally appears in the prompt is a genuinely requested
  // concept even if that keyword is "generic" in isolation (e.g. "products" in an inventory app —
  // the domain already won on stock/supplier/reorder). So a concept surfaces on ANY keyword hit
  // (strong or generic). Only the winning bundle is considered, so this never cross-contaminates
  // other domains' concepts.
  const evidencedConcepts = bundle.concepts.filter((def) =>
    matchingKeywords(tokens, blobWords, def.keywords).length > 0,
  );
  // Enumerated → only evidenced concepts. Never fall back to the full vocabulary bundle: a
  // colon/comma list that happens to match a domain trigger (e.g. lone "schedule") must not
  // inject the entire appointment-booking starter set when those entities were not listed.
  // Terse domain prompts still receive the full starter bundle so under-extraction does not
  // collapse a bare "appointment booking system" into one or two words.
  const selected = promptEnumerates ? evidencedConcepts : bundle.concepts;
  return {
    concepts: selected.map((def) => ({ readOnly: true, concept: def.concept, sources })),
    domainLabel: bundle.domain,
    domainClassification,
  };
}

function toTitleCase(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

/** Every keyword already known to the glossary — excluded from the generic fallback so it never
 * produces a near-duplicate of a concept the glossary already reports directly (e.g. a stray
 * "Keypad" alongside the real "Numeric Keypad" concept). */
const ALL_GLOSSARY_KEYWORDS = new Set(
  DOMAIN_GLOSSARY.flatMap((bundle) => [...bundle.triggerKeywords, ...bundle.concepts.flatMap((c) => c.keywords)]),
);

function isGlossaryRelated(token: string): boolean {
  for (const kw of ALL_GLOSSARY_KEYWORDS) {
    if (token === kw || (kw.length >= 4 && token.startsWith(kw)) || (token.length >= 4 && kw.startsWith(token))) {
      return true;
    }
  }
  return false;
}

/** Domain-agnostic fallback so unrecognized domains still yield comparable concepts. */
function genericFallbackConcepts(tokens: string[], sources: ProductConceptSource[], maxConcepts = 8): ExtractedProductConcept[] {
  const seen = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 4 || NOISE_WORDS.has(t) || /^\d+$/.test(t) || isGlossaryRelated(t)) continue;
    seen.set(t, (seen.get(t) ?? 0) + 1);
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxConcepts)
    .map(([word]) => ({ readOnly: true, concept: toTitleCase(word), sources }));
}

function dedupeConcepts(concepts: ExtractedProductConcept[]): ExtractedProductConcept[] {
  const byName = new Map<string, ExtractedProductConcept>();
  for (const c of concepts) {
    const key = c.concept.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      const mergedSources = [...new Set([...existing.sources, ...c.sources])];
      byName.set(key, { readOnly: true, concept: existing.concept, sources: mergedSources });
    } else {
      byName.set(key, c);
    }
  }
  return [...byName.values()];
}

function normalizeToText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(normalizeToText).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(normalizeToText)
      .join(' ');
  }
  return '';
}

function featureContractText(input: ProductFaithfulnessInput): string {
  if (!input.featureContract) return '';
  return input.featureContract
    .map((entry) => (typeof entry === 'string' ? entry : entry.featureName ?? entry.name ?? entry.title ?? ''))
    .join(' ');
}

/**
 * Infrastructural / system-shell / non-entity module ids that must never be promoted into product
 * concepts. These mirror the generic, domain-neutral system-shell taxonomy the rest of the pipeline
 * already keeps out of the product surface (CBGA_SYSTEM_SHELL_MODULE_IDS = auth/dashboard/settings/
 * persistence, plus the infrastructure navigation registry). They are cross-cutting concerns owned by
 * the system shell / capability packs — never product entities — so the supplement must skip them,
 * exactly as the real build plan does; otherwise they leak in as spurious product navigation (e.g. a
 * "Settings" product tab). Defined locally rather than imported from the downstream CBGA layer to
 * preserve the product-faithfulness → contract → CBGA dependency direction.
 */
const NON_ENTITY_MODULE_IDS = new Set([
  'navigation-router', 'navigation', 'router',
  'auth', 'authentication', 'persistence', 'dashboard', 'settings',
]);

/**
 * Normalizes a module id or concept name into a comparable, singularized token set. Used only to
 * test whether a prompt-requested entity is ALREADY represented by an existing concept (e.g.
 * "stock" is covered by "Stock Records"); purely structural, no product-domain vocabulary.
 */
function conceptTokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t)),
  );
}

function isCoveredByExistingConcept(moduleId: string, existing: ExtractedProductConcept[]): boolean {
  const reqTokens = conceptTokenSet(moduleId);
  if (reqTokens.size === 0) return true;
  for (const c of existing) {
    const cTokens = conceptTokenSet(c.concept);
    if (cTokens.size === 0) continue;
    // Required is already represented by a broader/equal existing concept.
    const reqSubsetOfConcept = [...reqTokens].every((t) => cTokens.has(t));
    // Exact token-set match (synonym / identical). Do NOT treat a shorter concept as covering a
    // longer entity compound ("services" must not subsume "service-requests").
    const exactMatch =
      cTokens.size === reqTokens.size && [...cTokens].every((t) => reqTokens.has(t));
    if (reqSubsetOfConcept || exactMatch) return true;
  }
  return false;
}

function moduleIdToConceptName(moduleId: string): string {
  return moduleId
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map(toTitleCase)
    .join(' ');
}

/**
 * Product Faithfulness — arbitrary-domain entity coverage (anti-drop). The curated DOMAIN_GLOSSARY
 * only names common domains; a prompt whose domain is outside it (e.g. food-service, volunteer
 * coordination) contains entities the glossary cannot name, and glossary-only extraction silently
 * drops them. This supplement re-uses the SAME deterministic prompt entity extractor that the
 * faithfulness expectation itself is measured against (`extractPromptFeatures().requiredModules`)
 * and adds only those requested entities the glossary did not already cover. It is:
 *  - generic: no per-domain vocabulary, applies uniformly to every prompt;
 *  - additive-only: domains the glossary already covers well gain nothing (their entities are
 *    already covered), so previously-passing builds are unaffected;
 *  - drift-safe: it never fabricates — it only surfaces entities the prompt genuinely requested.
 */
function supplementWithPromptRequestedEntities(
  existing: ExtractedProductConcept[],
  promptText: string,
  sources: ProductConceptSource[],
): ExtractedProductConcept[] {
  if (!promptText.trim()) return existing;
  let requiredModules: readonly string[] = [];
  try {
    requiredModules = extractPromptFeatures(promptText).requiredModules ?? [];
  } catch {
    return existing;
  }
  const additions: ExtractedProductConcept[] = [];
  for (const moduleId of requiredModules) {
    if (!moduleId || NON_ENTITY_MODULE_IDS.has(moduleId)) continue;
    if (isCoveredByExistingConcept(moduleId, existing)) continue;
    const conceptName = moduleIdToConceptName(moduleId);
    if (!conceptName) continue;
    additions.push({ readOnly: true, concept: conceptName, sources });
  }
  return additions.length > 0 ? dedupeConcepts([...existing, ...additions]) : existing;
}

/** Adds only module identities that were actually emitted by a generation artifact. */
function supplementWithGeneratedModules(
  existing: ExtractedProductConcept[],
  rawModuleIds: readonly string[],
  sources: ProductConceptSource[],
): ExtractedProductConcept[] {
  const additions: ExtractedProductConcept[] = [];
  for (const rawModuleId of rawModuleIds) {
    const moduleId = rawModuleId
      .split(/[?#]/, 1)[0]
      .split('/')
      .filter(Boolean)
      .at(-1) ?? '';
    if (!moduleId || NON_ENTITY_MODULE_IDS.has(moduleId.toLowerCase())) continue;
    if (isCoveredByExistingConcept(moduleId, existing) || isCoveredByExistingConcept(moduleId, additions)) continue;
    const conceptName = moduleIdToConceptName(moduleId);
    if (!conceptName) continue;
    additions.push({ readOnly: true, concept: conceptName, sources });
  }
  return additions.length > 0 ? dedupeConcepts([...existing, ...additions]) : existing;
}

/**
 * When a prompt explicitly lists several multi-word product capabilities (CORE MODULES style),
 * those structured capabilities are the verification authority for "requested". Glossary domain
 * expansion must not inject incidental single-token generics (e.g. Emergency Services → Services,
 * Utility Company → Companies) that then falsely appear as missing against a correctly generated app.
 */
function preferStructuredPromptCapabilities(
  promptText: string,
  sources: ProductConceptSource[],
): ExtractedProductConcept[] | null {
  if (!promptText.trim()) return null;
  let requiredModules: readonly string[] = [];
  try {
    requiredModules = extractPromptFeatures(promptText).requiredModules ?? [];
  } catch {
    return null;
  }
  const structured = requiredModules
    .filter((moduleId) => moduleId && !NON_ENTITY_MODULE_IDS.has(moduleId))
    .map((moduleId) => moduleIdToConceptName(moduleId))
    .filter((name) => name.split(/\s+/).filter(Boolean).length >= 2);
  if (structured.length < 3) return null;
  return dedupeConcepts(
    structured.map((concept) => ({ readOnly: true as const, concept, sources })),
  );
}

/** Extracts what the user requested — broad, domain-aware, from prompt + planning evidence only. */
export function extractRequestedConcepts(input: ProductFaithfulnessInput): {
  concepts: ExtractedProductConcept[];
  domainLabel: string | null;
  domainClassification: DomainClassificationDiagnostics;
} {
  const promptText = input.prompt ?? '';
  // Negated disclaimers must not feed glossary/domain matching or concept ancestry.
  const affirmativePromptText = maskNegatedProductPhrases(promptText);
  const supportingText = [
    normalizeToText(input.promptUnderstanding),
    normalizeToText(input.architectureSummary),
    featureContractText(input),
  ].join(' ');
  const affirmativeSupportingText = maskNegatedProductPhrases(supportingText);

  const promptTokens = new Set(tokenize(affirmativePromptText));
  const promptBlobWords = joinedBlobWords(affirmativePromptText);
  const combinedText = `${affirmativePromptText} ${affirmativeSupportingText}`;
  const combinedTokens = new Set(tokenize(combinedText));
  const combinedBlobWords = joinedBlobWords(combinedText);

  // Whether the user's prompt explicitly enumerates its entities (a scoped list) or merely names a
  // domain (terse). Computed once from the raw prompt so both the prompt-only and the combined
  // fallback classification agree on how to expand the winning domain's bundle.
  const promptEnumerates = promptEnumeratesEntities(promptText);

  // Domain inference is driven primarily by what the user actually asked for (the prompt),
  // falling back to supporting planning evidence only when the prompt alone did not match.
  let domainResult = domainWideConcepts(promptTokens, promptBlobWords, ['PROMPT'], promptEnumerates);
  if (domainResult.concepts.length === 0) {
    domainResult = domainWideConcepts(combinedTokens, combinedBlobWords, ['PROMPT_UNDERSTANDING'], promptEnumerates);
  }

  let direct = directConceptMatches(promptTokens, promptBlobWords, ['PROMPT']);
  if (domainResult.concepts.length === 0 && direct.length === 0) {
    direct = directConceptMatches(
      combinedTokens,
      combinedBlobWords,
      ['PROMPT_UNDERSTANDING', 'FEATURE_CONTRACT'],
    );
  }

  let concepts = dedupeConcepts([...domainResult.concepts, ...direct]);
  if (concepts.length === 0) {
    concepts = genericFallbackConcepts([...combinedTokens], ['PROMPT']);
  }
  if (promptEnumerates) {
    const normalizedPromptTokens = conceptTokenSet(affirmativePromptText);
    concepts = concepts.filter((entry) => {
      const conceptTokens = conceptTokenSet(entry.concept);
      const hasLiteralPromptAncestry =
        conceptTokens.size > 0 && [...conceptTokens].every((token) => normalizedPromptTokens.has(token));
      return hasLiteralPromptAncestry || conceptHasOwnPromptEvidence(entry.concept, promptTokens, promptBlobWords);
    });
  }
  concepts = supplementWithPromptRequestedEntities(concepts, promptText, ['PROMPT']);

  const structuredPreferred = preferStructuredPromptCapabilities(promptText, ['PROMPT']);
  if (structuredPreferred) {
    return {
      concepts: structuredPreferred,
      domainLabel: null,
      domainClassification: {
        ...domainResult.domainClassification,
        winningDomain: null,
        winningConfidence: 0,
        explanation:
          `Structured prompt capabilities (${structuredPreferred.length}) superseded glossary domain expansion` +
          (domainResult.domainLabel ? ` (ignored candidate "${domainResult.domainLabel}").` : '.'),
      },
    };
  }

  return { concepts, domainLabel: domainResult.domainLabel, domainClassification: domainResult.domainClassification };
}

/** File/path evidence mints false chips (Contacts from src/features/contacts/…). */
function isPathLikeComponentEvidence(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /[\\/]/.test(trimmed) || /\.(tsx?|jsx?|css|json)$/i.test(trimmed) || /^src\b/i.test(trimmed);
}

/**
 * workspaceManifestSummary may carry short stage concept labels (Appointments, Calendar) or
 * long promptSummary prose. Only short label entries are generated-surface evidence — prose and
 * single-token classifier residue are omitted so Contacts/Cart chips cannot reappear.
 */
function workspaceSummaryEvidenceText(summaries: readonly string[] | null | undefined): string {
  if (!summaries?.length) return '';
  return summaries
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || s.length > 64 || /[.!?]/.test(s)) return false;
      // Bare classifier tokens (contacts, cart) without a multi-word product label.
      if (!/\s/.test(s) && !/-/.test(s) && /^(contacts?|cart|checkout|notes?|products?|inventory|stock)$/i.test(s)) {
        return false;
      }
      return true;
    })
    .join(' ');
}

/** Extracts what was actually generated — direct evidence only, never inferred beyond it. */
export function extractGeneratedConcepts(input: ProductFaithfulnessInput): ExtractedProductConcept[] {
  // Keep PascalCase component *names* (AppointmentList, AdditionButton) — drop path strings only.
  const componentNames = (input.generatedComponents ?? []).filter((c) => !isPathLikeComponentEvidence(c));
  const parts: Array<{ text: string; source: ProductConceptSource }> = [
    { text: (input.generatedRoutes ?? []).join(' '), source: 'ROUTES' },
    { text: (input.generatedPages ?? []).join(' '), source: 'PAGES' },
    { text: componentNames.join(' '), source: 'COMPONENTS' },
    { text: (input.generatedFeatureModules ?? []).join(' '), source: 'FEATURE_MODULES' },
    { text: (input.navigationLabels ?? []).join(' '), source: 'NAVIGATION' },
    { text: (input.visibleHeadings ?? []).join(' '), source: 'VISIBLE_UI_TEXT' },
    { text: input.domText ?? '', source: 'VISIBLE_UI_TEXT' },
    { text: input.generatedProfile ?? '', source: 'GENERATED_PROFILE' },
    {
      text: [
        input.interactionProofEvidence?.primaryFeatureTextFound ?? '',
        (input.interactionProofEvidence?.candidateTermsTried ?? []).join(' '),
        (input.interactionProofEvidence?.whatWorked ?? []).join(' '),
      ].join(' '),
      source: 'INTERACTION_PROOF',
    },
    {
      text: [
        (input.materializationManifestHints?.featureModuleNames ?? []).join(' '),
        (input.materializationManifestHints?.routes ?? []).join(' '),
      ].join(' '),
      source: 'MATERIALIZATION_MANIFEST',
    },
    {
      text: workspaceSummaryEvidenceText(input.workspaceManifestSummary),
      source: 'MATERIALIZATION_MANIFEST',
    },
  ];
  // Intentionally omit generatedComponents path strings (src/features/...) — filtered above.
  // Intentionally omit workspaceManifestSummary / promptTerms classifier labels — those mint
  // false Contacts/Features chips.

  const allText = parts.map((p) => p.text).join(' ');
  const tokens = new Set(tokenize(allText));
  const blobWords = joinedBlobWords(allText);

  const direct = directConceptMatches(tokens, blobWords, ['ROUTES', 'COMPONENTS', 'FEATURE_MODULES', 'NAVIGATION', 'VISIBLE_UI_TEXT']);
  // Do not promote path-segment generics (Features/Feature) from file trees as product concepts.

  const extracted = dedupeConcepts([...direct]);
  const generatedModuleIds = [
    ...(input.generatedFeatureModules ?? []),
    ...componentNames,
    ...(input.navigationLabels ?? []),
    ...(input.materializationManifestHints?.featureModuleNames ?? []),
    ...(input.generatedRoutes ?? []),
  ];
  return supplementWithGeneratedModules(
    extracted,
    generatedModuleIds,
    ['FEATURE_MODULES', 'COMPONENTS', 'NAVIGATION', 'MATERIALIZATION_MANIFEST'],
  );
}
