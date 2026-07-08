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
      { concept: 'Multiplication', keywords: ['multiplication', 'multiply', 'multipl', 'times', 'product'] },
      { concept: 'Division', keywords: ['division', 'divide', 'divis', 'quotient'] },
      { concept: 'Display', keywords: ['display', 'screen', 'readout'] },
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
      { concept: 'Mark Complete', keywords: ['complete', 'done', 'checked', 'markdone'] },
      { concept: 'Due Date', keywords: ['duedate', 'deadline', 'due'] },
      { concept: 'Categories', keywords: ['category', 'categories', 'tag', 'tags'] },
      { concept: 'Reminders', keywords: ['reminder', 'reminders', 'notify', 'notification'] },
      { concept: 'Checklist', keywords: ['checklist'] },
    ],
  },
  {
    domain: 'Appointment Booking / Scheduling',
    triggerKeywords: ['booking', 'appointment', 'reservation', 'schedule', 'scheduling', 'salon', 'clinic'],
    concepts: [
      { concept: 'Appointments', keywords: ['appointment', 'appointments'] },
      { concept: 'Calendar', keywords: ['calendar'] },
      { concept: 'Customers', keywords: ['customer', 'customers', 'client', 'clients'] },
      { concept: 'Services', keywords: ['service', 'services'] },
      { concept: 'Booking', keywords: ['booking', 'book', 'reserve', 'reservation'] },
      { concept: 'Dashboard', keywords: ['dashboard'] },
      { concept: 'Staff', keywords: ['staff', 'employee', 'employees', 'stylist', 'provider'] },
      { concept: 'Scheduling', keywords: ['schedule', 'scheduling', 'slot', 'timeslot'] },
    ],
  },
  {
    domain: 'CRM / Customer Relationship Management',
    triggerKeywords: ['crm', 'pipeline', 'lead', 'leads', 'customerrelationship'],
    concepts: [
      { concept: 'Customers', keywords: ['customer', 'customers', 'contact', 'contacts'] },
      { concept: 'Leads', keywords: ['lead', 'leads', 'prospect', 'prospects'] },
      { concept: 'Pipeline', keywords: ['pipeline', 'stage', 'stages'] },
      { concept: 'Deals', keywords: ['deal', 'deals', 'opportunity', 'opportunities'] },
      { concept: 'Sales', keywords: ['sales', 'revenue'] },
      { concept: 'Companies', keywords: ['company', 'companies', 'account', 'accounts'] },
      { concept: 'Dashboard', keywords: ['dashboard'] },
      { concept: 'Contacts', keywords: ['contact', 'contacts'] },
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
  'screen', 'screens',
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

function hasKeyword(tokens: Set<string>, blobWords: string[], keyword: string): boolean {
  const kw = keyword.toLowerCase();
  if (tokens.has(kw)) return true;
  if (kw.length >= 4) {
    for (const t of tokens) {
      if (t.startsWith(kw)) return true;
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

    const qualifies = matchedEvidence.length > 0;
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
  const winner = qualifying.length
    ? qualifying.reduce((best, c) => (c.confidence > best.confidence ? c : best))
    : null;

  const finalCandidates = candidates.map((c) => {
    if (winner && c.domain === winner.domain) return { ...c, rejectedReason: null };
    if (!c.qualifies) {
      const genericWords = c.ignoredGenericEvidence.map((h) => `"${h.keyword}"`).join(', ');
      return {
        ...c,
        rejectedReason: genericWords
          ? `No strong, domain-specific evidence matched — only generic evidence (${genericWords}), which never independently classifies a domain.`
          : 'No evidence (strong or generic) matched this domain.',
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
    : 'No domain qualified: every candidate had only generic evidence (or none at all), and generic evidence never independently classifies a domain.';

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
  return classifyDomainEvidence(new Set(tokenize(text)), joinedBlobWords(text));
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

function domainWideConcepts(
  tokens: Set<string>,
  blobWords: string[],
  sources: ProductConceptSource[],
): { concepts: ExtractedProductConcept[]; domainLabel: string | null; domainClassification: DomainClassificationDiagnostics } {
  const domainClassification = classifyDomainEvidence(tokens, blobWords);
  if (!domainClassification.winningDomain) {
    return { concepts: [], domainLabel: null, domainClassification };
  }
  const bundle = DOMAIN_GLOSSARY.find((b) => b.domain === domainClassification.winningDomain);
  if (!bundle) {
    return { concepts: [], domainLabel: null, domainClassification };
  }
  return {
    concepts: bundle.concepts.map((def) => ({ readOnly: true, concept: def.concept, sources })),
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

/** Extracts what the user requested — broad, domain-aware, from prompt + planning evidence only. */
export function extractRequestedConcepts(input: ProductFaithfulnessInput): {
  concepts: ExtractedProductConcept[];
  domainLabel: string | null;
  domainClassification: DomainClassificationDiagnostics;
} {
  const promptText = input.prompt ?? '';
  const supportingText = [
    normalizeToText(input.promptUnderstanding),
    normalizeToText(input.architectureSummary),
    featureContractText(input),
  ].join(' ');

  const promptTokens = new Set(tokenize(promptText));
  const promptBlobWords = joinedBlobWords(promptText);
  const combinedText = `${promptText} ${supportingText}`;
  const combinedTokens = new Set(tokenize(combinedText));
  const combinedBlobWords = joinedBlobWords(combinedText);

  // Domain inference is driven primarily by what the user actually asked for (the prompt),
  // falling back to supporting planning evidence only when the prompt alone did not match.
  let domainResult = domainWideConcepts(promptTokens, promptBlobWords, ['PROMPT']);
  if (domainResult.concepts.length === 0) {
    domainResult = domainWideConcepts(combinedTokens, combinedBlobWords, ['PROMPT_UNDERSTANDING']);
  }

  const direct = directConceptMatches(combinedTokens, combinedBlobWords, ['PROMPT', 'PROMPT_UNDERSTANDING', 'FEATURE_CONTRACT']);

  let concepts = dedupeConcepts([...domainResult.concepts, ...direct]);
  if (concepts.length === 0) {
    concepts = genericFallbackConcepts([...combinedTokens], ['PROMPT']);
  }

  return { concepts, domainLabel: domainResult.domainLabel, domainClassification: domainResult.domainClassification };
}

/** Extracts what was actually generated — direct evidence only, never inferred beyond it. */
export function extractGeneratedConcepts(input: ProductFaithfulnessInput): ExtractedProductConcept[] {
  const parts: Array<{ text: string; source: ProductConceptSource }> = [
    { text: (input.generatedRoutes ?? []).join(' '), source: 'ROUTES' },
    { text: (input.generatedPages ?? []).join(' '), source: 'PAGES' },
    { text: (input.generatedComponents ?? []).join(' '), source: 'COMPONENTS' },
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
        (input.materializationManifestHints?.promptTerms ?? []).join(' '),
        (input.materializationManifestHints?.routes ?? []).join(' '),
      ].join(' '),
      source: 'MATERIALIZATION_MANIFEST',
    },
    { text: (input.workspaceManifestSummary ?? []).join(' '), source: 'MATERIALIZATION_MANIFEST' },
  ];

  const allText = parts.map((p) => p.text).join(' ');
  const tokens = new Set(tokenize(allText));
  const blobWords = joinedBlobWords(allText);

  const direct = directConceptMatches(tokens, blobWords, ['ROUTES', 'COMPONENTS', 'FEATURE_MODULES', 'NAVIGATION', 'VISIBLE_UI_TEXT']);
  const generic = genericFallbackConcepts(tokenize(allText), ['VISIBLE_UI_TEXT'], 10);

  return dedupeConcepts([...direct, ...generic]);
}
