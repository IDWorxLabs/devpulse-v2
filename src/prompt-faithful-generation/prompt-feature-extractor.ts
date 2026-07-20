/**
 * Prompt-Faithful Generation V1 — extract features from custom prompts.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import { contractConsumptionTrace, shortHashForTrace } from '../production-contract-consumption-trace-v1/index.js';
import {
  detectSimpleUtilityAppKind,
  isSimpleUtilityAppPrompt,
  promptDescribesMultiEntityProduct,
  simpleUtilityFeatureModules,
} from '../simple-utility-app/simple-utility-app-registry.js';
import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import { BANNED_FALLBACK_MODULES } from './prompt-faithful-generation-types.js';
import { promptJustifiesBareBannedFallback } from './fallback-module-classification.js';
import {
  classifyModulePhrase,
  dedupeModuleIds,
  isValidModuleId,
  normalizeModuleId,
  resolveModuleSynonym,
  sanitizeModuleIds,
} from './prompt-module-name-normalizer.js';

const CAPABILITY_TO_MODULE: Array<{ pattern: RegExp; module: string }> = [
  { pattern: /\beye[\s-]?track(?:ing)?(?:\s+board)?/i, module: 'eye-tracking-board' },
  { pattern: /\bblink[\s-]?(?:input|engine)/i, module: 'blink-input-engine' },
  { pattern: /\bgaze[\s-]?keyboard/i, module: 'gaze-keyboard' },
  { pattern: /\btext[\s-]?to[\s-]?speech|tts\b/i, module: 'text-to-speech' },
  { pattern: /\bquick[\s-]?phrase/i, module: 'quick-phrases' },
  { pattern: /\bcaregiver[\s-]?dashboard/i, module: 'caregiver-dashboard' },
  { pattern: /\bcommunication[\s-]?history|message[\s-]?history/i, module: 'communication-history' },
  { pattern: /\baccessibility[\s-]?settings/i, module: 'accessibility-settings' },
  { pattern: /\bemergency[\s-]?speech/i, module: 'emergency-speech' },
  { pattern: /\bonboarding[\s/-]?calibration|calibration[\s-]?flow/i, module: 'onboarding-calibration' },
  { pattern: /\bcommunication[\s-]?board/i, module: 'eye-tracking-board' },
  // Universal local product capabilities (domain-neutral entity nouns).
  { pattern: /\bcontacts?\b/i, module: 'contacts' },
  { pattern: /\btasks?\b/i, module: 'tasks' },
  { pattern: /\bnotes?\b/i, module: 'notes' },
  { pattern: /\bcategories?\b/i, module: 'categories' },
  { pattern: /\bproducts?\b/i, module: 'products' },
  { pattern: /\bstock(?:\s+records?)?\b/i, module: 'stock' },
  { pattern: /\bsuppliers?\b/i, module: 'suppliers' },
  { pattern: /\bappointments?\b/i, module: 'appointments' },
  // Standalone "services" only — "service requests/tickets/jobs/visits" are distinct entities.
  { pattern: /\bservices?\b(?!\s+(?:requests?|tickets?|jobs?|visits?|appointments?|calls?|orders?)\b)/i, module: 'services' },
  { pattern: /\bcustomers?\b/i, module: 'customers' },
  { pattern: /\bstaff\b/i, module: 'staff' },
  { pattern: /\borders?\b/i, module: 'orders' },
  { pattern: /\bmenu(?:\s+items?)?\b/i, module: 'menu-items' },
  { pattern: /\binventory\b/i, module: 'inventory' },
  { pattern: /\btables?\b/i, module: 'tables' },
];

/** Behavior/action phrases that must never become top-level modules. */
const ACTION_OR_BEHAVIOR_TOKENS = new Set([
  'mark-complete',
  'mark-complete-actions',
  'complete-actions',
  'search',
  'filtering',
  'filter',
  'local-persistence',
  'persistence',
  'rescheduling',
  'cancellation',
  'calculations',
  'relationships',
  'local-availability',
  'local-reminders',
  'local-reporting',
  'csv-export',
  'audit-history',
  'stock-adjustments',
  'reorder-rules',
  'order-status-workflow',
  'workflow-states',
  // Lone qualifier fragments left after splitting "X with Y and status".
  'status',
  'scheduling',
  'approval',
  'triage',
  'workflow',
  'transitions',
  'completion',
]);

export const LISA_REQUIRED_MODULES = [
  'onboarding-calibration',
  'eye-tracking-board',
  'blink-input-engine',
  'gaze-keyboard',
  'text-to-speech',
  'quick-phrases',
  'caregiver-dashboard',
  'communication-history',
  'accessibility-settings',
  'emergency-speech',
];

const LISA_INTERACTIONS = [
  'blink simulation control',
  'gaze selection simulation',
  'phrase selection',
  'message composition',
  'speak button',
  'emergency speech button',
  'calibration controls',
  'settings controls',
  'history filtering',
];

const MODULE_PROSE_STOPWORDS = new Set(['history', 'output', 'own', 'speech', 'a', 'the', 'its']);

/**
 * Production Generator Contract Consumption Fix V1 — generic, non-domain-specific structural
 * guard: this phrasing describes HOW to build (architecture/coding conventions), never WHAT the
 * product is, so it must never become an app name even when introduced by the word "build". Kept
 * intentionally generic (no product-domain words) — it matches implementation-guidance grammar,
 * not any specific app category.
 */
const IMPLEMENTATION_GUIDANCE_PATTERN =
  /\b(reusable\s+components?|components?\s+where|where\s+appropriate|consistent\s+architecture|well[\s-]?structured|feature\s+modules?|design\s+system|code\s*base|architecture)\b/i;

function looksLikeImplementationGuidance(candidate: string): boolean {
  return IMPLEMENTATION_GUIDANCE_PATTERN.test(candidate);
}

/**
 * Identity Computation Collapse V1 — a Title-Case "phrase" that is composed *only* of bare
 * all-caps tokens (e.g. "CSV", "JSON", "PDF", "API SDK") is a format/technology acronym mentioned
 * inside a feature clause ("... CSV export ..."), never the product's own name. Real product names
 * introduced by capitalization contain at least one ordinary Title-Case word with a lowercase tail
 * (e.g. "Restaurant Management Platform"), so requiring one such word lets genuine names through
 * while rejecting acronym clusters. Fully generic — no product-domain vocabulary involved. This is
 * the acronym-guard fix for prompts whose only capitalized token is an all-caps format word, which
 * previously leaked (e.g.) "CSV" as the product identity.
 */
function isBareAcronymPhrase(candidate: string): boolean {
  const tokens = candidate.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hasRealTitleCaseWord = tokens.some((t) => /^[A-Z][a-z][a-zA-Z0-9]*$/.test(t));
  return !hasRealTitleCaseWord;
}

/** Generic English stopwords + prompt filler — used only by the deterministic, last-resort noun-
 * phrase fallback below; never product-domain-specific. */
const APP_NAME_FALLBACK_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'with', 'that', 'this', 'to', 'of', 'in', 'on', 'is', 'are',
  'be', 'it', 'as', 'by', 'from', 'into', 'your', 'their', 'our', 'my', 'build', 'building', 'built',
  'create', 'creating', 'make', 'making', 'develop', 'app', 'apps', 'application', 'applications',
  'system', 'simple', 'basic', 'modern', 'nice', 'using', 'use', 'user', 'users', 'allows', 'allow',
  'want', 'would', 'like', 'please', 'production', 'quality',
  // Imperative / scaffolding verbs are prompt instructions, never product identity.
  'provision', 'provide', 'include', 'deliver', 'scaffold', 'implement', 'design', 'generate',
  'construct', 'assemble',
  // Mid-prompt imperative / desiderative verbs that title-case matching otherwise promotes.
  'track', 'manage', 'need', 'needs', 'support', 'supports', 'show', 'shows', 'help', 'helps',
  'enable', 'enables', 'allow', 'allows', 'add', 'adds', 'keep', 'keeps', 'handle', 'handles',
  'something', 'somehow', 'maybe', 'also', 'we', 'i', 'you',
  // Generic implementation-guidance vocabulary (see IMPLEMENTATION_GUIDANCE_PATTERN) — never a
  // real product identity even when it's the only content a degenerate prompt has left.
  'reusable', 'component', 'components', 'appropriate', 'architecture', 'codebase', 'structured',
  'consistent', 'where', 'throughout',
]);

/**
 * Feature/capability-enumeration boundary words. Everything from the first of these onward is the
 * list of features/modules the product HAS ("... with products, stock records ...", "... featuring
 * X, Y ..."), not part of the product's own identity. Truncating the identity noun phrase here is
 * the identity-suffix-drift fix: without it the fallback greedily absorbed the first enumerated
 * feature word into the name (e.g. "Generic Inventory Manager Products", "Generic Appointment
 * Manager Contacts"). Purely structural/grammatical — references no product domain vocabulary.
 * Connectives that can appear INSIDE a product name (e.g. "and" in "contact and task manager") are
 * intentionally excluded so they never truncate a legitimate multi-part identity.
 */
const APP_NAME_PHRASE_BOUNDARY_WORDS = new Set([
  'with', 'that', 'which', 'including', 'includes', 'include', 'featuring', 'feature', 'features',
  'having', 'containing', 'contains', 'comprising', 'consisting', 'supporting', 'supports', 'plus',
  // Audience / purpose clause — "scheduler for a hospital ward" truncates before the audience.
  'for',
]);

/** Strip leading build/instruction verbs + articles before identity noun-phrase collection. */
const LEADING_INSTRUCTION_PREFIX =
  /^(?:build|create|make|generate|develop|design|implement|provision|provide|include|deliver|scaffold|construct|assemble)\s+(?:an|a|the)?\s*/i;

/** Soft desiderative openers: "We need software that …" / "I want a …" / "Help someone …". */
const DESIDERATIVE_INSTRUCTION_PREFIX =
  /^(?:we|i|they|users?)\s+(?:need|want|require|looking\s+for)\s+(?:an?|the)?\s*(?:software|app|application|system|tool|platform|console)?\s*(?:that|which|to)?\s*/i;
const HELP_INSTRUCTION_PREFIX =
  /^help\s+(?:someone|users?|me|people|a\s+user)\s+(?:to\s+)?(?:communicate|work|manage|track|build|create)?\s*(?:with|using)?\s*/i;

/** Title-case identity words while preserving short all-caps acronyms (ERP, CRM, API). */
function toProductIdentityTitleCase(phrase: string): string {
  return phrase
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (/^[A-Z0-9]{2,6}$/.test(w)) return w;
      if (w.includes('-')) {
        return w
          .split('-')
          .map((part) => {
            if (!part) return part;
            if (/^[A-Z0-9]{2,6}$/.test(part)) return part;
            return part[0]!.toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }
      return w[0]!.toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Reject truncated / instruction-only / feature-fragment identities
 * (e.g. "n", "Provision", "Show-to-episode Relationships").
 */
function isWeakProductIdentity(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (trimmed.length < 2) return true;
  if (/^n\b/i.test(trimmed)) return true;
  if (/^(?:an?|the)\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 2) return true;
  // Feature / relationship grammar — never a product-level identity.
  if (/\brelationships?\b/i.test(trimmed)) return true;
  if (/\b[a-z0-9]+-to-[a-z0-9]+\b/i.test(trimmed)) return true;
  // Bullet / ID fragment identities (e.g. "IDs — Oven zones", "Check — in workflow").
  // Only em/en dashes count — ASCII hyphens inside compounds like "cold-chain" must not match.
  if (/\bids?\b/i.test(trimmed) && /[—–]/.test(trimmed) && trimmed.split(/\s+/).length <= 4) return true;
  if (/^[A-Za-z]+\s*[—–]\s+\S+/.test(trimmed) && trimmed.split(/\s+/).length <= 4) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1 && APP_NAME_FALLBACK_STOPWORDS.has(words[0]!.toLowerCase())) return true;
  if (words.every((w) => APP_NAME_FALLBACK_STOPWORDS.has(w.toLowerCase()))) return true;
  // Single-token imperative leftovers ("Track", "Manage") after stopword checks.
  if (words.length === 1 && /^(?:track|manage|need|support|show|help|enable|handle|keep|add)$/i.test(words[0]!)) {
    return true;
  }
  return false;
}

/** Deterministic, generic, last-resort fallback: derived from the prompt's own leading noun
 * phrase (the significant, non-stopword words up to the first feature-enumeration boundary), never
 * from an arbitrary later sentence and never absorbing an enumerated feature/module name. No
 * app-specific/domain-specific vocabulary involved. */
function deriveDeterministicNounPhraseFallback(rawPrompt: string): string {
  const stripped = rawPrompt
    .trim()
    .replace(LEADING_INSTRUCTION_PREFIX, '')
    .replace(DESIDERATIVE_INSTRUCTION_PREFIX, '')
    .replace(HELP_INSTRUCTION_PREFIX, '')
    // Drop a leftover leading verb after "…software that <verb> …".
    .replace(
      /^(?:dispatches?|manages?|tracks?|handles?|schedules?|supports?|provides?|enables?|runs?|operates?|communicate)\s+/i,
      '',
    );
  const collectPhrase = (stopAtEnumeration: boolean): string[] => {
    const collected: string[] = [];
    for (const rawToken of stripped.split(/\s+/).slice(0, 60)) {
      const cleaned = rawToken.replace(/[^A-Za-z0-9-]/g, '');
      const lower = cleaned.toLowerCase();
      if (stopAtEnumeration && APP_NAME_PHRASE_BOUNDARY_WORDS.has(lower)) break;
      if (cleaned.length >= 3 && !APP_NAME_FALLBACK_STOPWORDS.has(lower)) collected.push(cleaned);
      // Clause-ending punctuation (comma/semicolon/colon/period/dash) begins the feature list once
      // the identity phrase has at least one real word — stop before the enumeration is absorbed.
      if (stopAtEnumeration && collected.length > 0 && /[,;:.—–]/.test(rawToken)) break;
    }
    return collected;
  };
  // Prefer the boundary-limited identity phrase; only if a degenerate prompt yields nothing before
  // the first boundary do we fall back to the unbounded leading-noun-phrase scan.
  const bounded = collectPhrase(true);
  const words = bounded.length > 0 ? bounded : collectPhrase(false);
  if (words.length === 0) return 'Custom App';
  const name = toProductIdentityTitleCase(words.slice(0, 4).join(' '));
  return isWeakProductIdentity(name) ? 'Custom App' : name;
}

/**
 * Identity Computation Collapse V1 — DRAFT / PRE-CONTRACT ONLY. This produces the initial
 * candidate app name used to seed `ResolvedPromptFaithfulBuildPlan.extraction.appName` before the
 * Canonical Product Contract exists and before Contract-Bound Generation Authority V4 repairs it.
 * Once CBGA has run, its repaired identity (see approved-product-identity.ts) is the sole
 * authoritative source (PPC-1207 No Parallel Truth) — no production stage downstream of CBGA may
 * call this function or treat its output as authoritative.
 */
function extractAppName(rawPrompt: string): string {
  const trace = (branchSelected: string, outputAppName: string, fallbackSelected: boolean): void => {
    contractConsumptionTrace({
      requestId: 'N/A',
      buildId: 'N/A',
      projectId: 'N/A',
      promptHash: shortHashForTrace(rawPrompt),
      stage: 'PROMPT_FEATURE_EXTRACTION',
      functionName: 'extractAppName',
      sourceFile: 'src/prompt-faithful-generation/prompt-feature-extractor.ts',
      branchSelected,
      inputProductIdentity: null,
      outputProductIdentity: outputAppName,
      inputModules: [],
      outputModules: [],
      inputRoutes: [],
      outputRoutes: [],
      inputNavigation: [],
      outputNavigation: [],
      inputVisibleText: [],
      outputVisibleText: [outputAppName],
      fallbackSelected,
      genericTemplateSelected: fallbackSelected,
      contractConsumed: false,
      cbgaPlanConsumed: false,
      promptBoundedModulePlanConsumed: false,
      universalFeatureContractConsumed: false,
      profileFeatureDefinitionConsumed: false,
    });
  };
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    const lisaNamed = rawPrompt.match(/\bBuild\s+(LISA\b[^.\n]*)/i);
    if (lisaNamed?.[1]) {
      trace('LISA_NAMED_MATCH', lisaNamed[1].trim(), false);
      return lisaNamed[1].trim();
    }
    trace('LISA_DEFAULT_NAME', 'LISA — Locked In Syndrome App', true);
    return 'LISA — Locked In Syndrome App';
  }
  // An explicit naming clause is stronger product-identity evidence than adjectives before
  // "app/application" (for example, "Build a production-ready web application called Atlas").
  // Resolve it before the generic app-suffix grammar so quality adjectives cannot become the
  // product name.
  const explicitlyNamed = rawPrompt.match(
    /\b(?:called|named)\s+["“]?([^\n.!?”"]{1,120}?)["”]?(?=[ \t]+(?:for|with|that|which)\b|[.!?\r\n]|$)/i,
  );
  if (
    explicitlyNamed?.[1] &&
    !looksLikeImplementationGuidance(explicitlyNamed[1]) &&
    !isWeakProductIdentity(explicitlyNamed[1])
  ) {
    const name = explicitlyNamed[1].trim();
    trace('EXPLICIT_NAMING_CLAUSE_MATCH', name, false);
    return name;
  }
  // Only the FIRST "build" instruction in the prompt is treated as a candidate product-
  // introduction site. Later occurrences (architecture bullets, implementation guidance, etc.)
  // are structurally more likely to describe HOW to build, not WHAT the product is — excluding
  // them is the "prefer earliest direct product identity" anchoring fix.
  // Prefer earliest product-introduction instruction (build/create/provision/…), not only "build".
  const firstIntroIndex = rawPrompt.search(
    /\b(?:build|create|make|generate|develop|design|implement|provision|provide|scaffold)\b/i,
  );
  if (firstIntroIndex >= 0) {
    const introClauseRaw = rawPrompt.slice(firstIntroIndex, firstIntroIndex + 240);
    // Longest-first articles: `(?:an|a|the)` — never `(?:a|an|the)` which leaves a leading "n"
    // from "an" (e.g. "Build an escape room…" → "n escape room").
    const introClause = introClauseRaw.replace(LEADING_INSTRUCTION_PREFIX, '');

    // Preferred: an explicit "... <Name> app/application" phrase, anchored to real word
    // boundaries via \b so "appropriate" (app + ropriate, no boundary) can never satisfy this —
    // this is the word-boundary anchoring fix.
    const appSuffixed = introClause.match(
      /^([^\n.]{1,80}?)\s+(?:web\s+|mobile\s+)?app(?:lication)?\b/i,
    );
    if (
      appSuffixed?.[1] &&
      !looksLikeImplementationGuidance(appSuffixed[1]) &&
      !isWeakProductIdentity(appSuffixed[1])
    ) {
      const name = toProductIdentityTitleCase(appSuffixed[1]);
      if (!isWeakProductIdentity(name)) {
        trace('BUILD_NAMED_REGEX_MATCH', name, false);
        return name;
      }
    }

    // Lowercase product noun phrase after instruction strip (jargon / sentence-case prompts).
    // Prefer this before mid-sentence Title-Case verbs ("Track", "Manage") can win.
    const lowerNoun = introClause.match(
      /^([a-z][a-z0-9-]*(?:\s+[a-z][a-z0-9-]*){0,6})\s+((?:web\s+|mobile\s+)?(?:app|application|system|platform|software|console|manager|tool|scheduler|desk|ledger|board|registry|monitor|tracker|queue|roster|logger|log))\b/i,
    );
    if (
      lowerNoun?.[1] &&
      lowerNoun[2] &&
      !isWeakProductIdentity(lowerNoun[1]) &&
      !looksLikeImplementationGuidance(lowerNoun[1])
    ) {
      const composed = toProductIdentityTitleCase(`${lowerNoun[1]} ${lowerNoun[2]}`);
      if (!isWeakProductIdentity(composed)) {
        trace('LOWERCASE_NOUN_PHRASE_MATCH', composed, false);
        return composed;
      }
    }

    // Fallback within the same intro clause: earliest multi-word Title-Case phrase only.
    // Single-token Title-Case matches are rejected — they are usually mid-sentence imperatives
    // ("Track dialysis chairs…", "Manage blood units…") rather than product names.
    const titleCasePhrase = introClause.match(/\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){1,6})\b/);
    if (
      titleCasePhrase?.[1] &&
      !looksLikeImplementationGuidance(titleCasePhrase[1]) &&
      !isBareAcronymPhrase(titleCasePhrase[1]) &&
      !isWeakProductIdentity(titleCasePhrase[1])
    ) {
      const name = titleCasePhrase[1].trim();
      trace('TITLE_CASE_PHRASE_MATCH', name, false);
      return name;
    }
  }
  // Em-dash product titles must appear on the opening line and not look like bullet fragments.
  const firstLine = rawPrompt.split(/\r?\n/, 1)[0] ?? '';
  const emDash = firstLine.match(/\b([A-Z][A-Za-z0-9]{1,40})\s*[—–]\s*([^.\n]{3,80})/);
  if (
    emDash &&
    !looksLikeImplementationGuidance(emDash[2] ?? '') &&
    !/\bids?\b/i.test(emDash[1] ?? '') &&
    !isWeakProductIdentity(`${emDash[1]} — ${emDash[2]!.trim()}`)
  ) {
    const name = `${emDash[1]} — ${emDash[2]!.trim()}`;
    trace('EM_DASH_MATCH', name, false);
    return name;
  }
  const deterministicFallback = deriveDeterministicNounPhraseFallback(rawPrompt);
  trace('DETERMINISTIC_NOUN_PHRASE_FALLBACK', deterministicFallback, true);
  return deterministicFallback;
}

function parseModuleLines(section: string): string[] {
  const modules: string[] = [];
  for (const line of section.split('\n')) {
    const bullet = line.match(/^\s*[*•-]?\s*([a-z][a-z0-9-]{2,40})\s*$/i);
    if (bullet?.[1]) modules.push(normalizeModuleId(bullet[1]));
  }
  return modules;
}

function extractRequiredModulesSection(rawPrompt: string): string[] {
  let best: string[] = [];
  const sectionPattern =
    /required\s+modules?\s*:?\s*([\s\S]*?)(?=\n\s*\n|\n(?:interaction|design|architecture|text-to-speech|camera|safety|live preview|final report)\b[^\n]*:|\nThe generated\b)/gi;
  for (const match of rawPrompt.matchAll(sectionPattern)) {
    const modules = parseModuleLines(match[1] ?? '');
    if (modules.length > best.length) best = modules;
  }
  const inline = rawPrompt.match(
    /required\s+modules?\s*:?\s*([a-z][a-z0-9-]+(?:\s+[a-z][a-z0-9-]+){1,24})/i,
  );
  if (inline?.[1]) {
    const modules = inline[1]
      .split(/\s+/)
      .map((token) => normalizeModuleId(token))
      .filter((token) => isValidModuleId(token));
    if (modules.length > best.length) best = modules;
  }
  return dedupeModuleIds(best);
}

function extractExplicitBulletModules(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const line of rawPrompt.split('\n')) {
    const pureId = line.match(/^\s*[*•-]\s*([a-z][a-z0-9-]{2,40})\s*$/i);
    if (pureId?.[1]) {
      modules.push(normalizeModuleId(pureId[1]));
      continue;
    }
    // Multi-word bullet feature lines: "- Teams and players", "- Check-in workflow".
    const phraseBullet = line.match(/^\s*[*•-]\s+([A-Za-z][A-Za-z0-9][A-Za-z0-9\s\-/]{1,60})\s*$/);
    if (phraseBullet?.[1]) {
      const segments = phraseBullet[1]
        .split(/\s+\band\b\s+/i)
        .map((segment) =>
          segment
            .replace(/\b(?:with|for|the|a|an)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
        .filter(Boolean);
      for (const segment of segments) {
        if (/\b(?:local\s+persistence|filter\s+by|search\s+by|export)\b/i.test(segment)) continue;
        const words = segment.split(/\s+/).filter(Boolean);
        const candidate = words.length <= 3 ? segment : words.slice(0, 2).join(' ');
        const moduleId = normalizeModuleId(candidate);
        if (moduleId && isValidModuleId(moduleId)) modules.push(moduleId);
      }
    }
  }
  return dedupeModuleIds(modules);
}

/**
 * Extracts first-level module headings from long structured "CORE MODULES" sections. The suffixes
 * are generic information-architecture nouns, not product/domain vocabulary; detail rows such as
 * "Create records", "Duration", or "Status" therefore cannot be mistaken for module boundaries.
 */
function extractStructuredCoreModuleHeadings(rawPrompt: string): string[] {
  const start = /(?:^|\n)\s*CORE\s+MODULES?\s*\n/i.exec(rawPrompt);
  if (!start) return [];
  const boundaryHeadings = new Set([
    'COLLABORATION',
    'SEARCH',
    'FILES',
    'WORKFLOWS',
    'BUSINESS RULES',
    'SECURITY',
    'REPORTING',
    'NON-FUNCTIONAL REQUIREMENTS',
  ]);
  const sectionLines: string[] = [];
  for (const rawLine of rawPrompt.slice(start.index + start[0].length).split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    const upper = trimmed.toUpperCase();
    // Section boundaries in structured specifications are uppercase headings. A title-cased
    // product module such as "Search" must remain inside CORE MODULES.
    if (trimmed === upper && boundaryHeadings.has(upper)) break;
    sectionLines.push(rawLine);
  }
  const section = sectionLines.join('\n');
  const establishedHeadingSuffix =
    /\b(?:management|planning|scheduling|collection|logistics|fleet|tracking)\s*$/i;
  const extendedHeadingSuffix =
    /\b(?:registry|lifecycle|maintenance|reporting|mapping|monitoring|dashboards?|control|operations?|coordination|administration|research|incidents?|response)\s*$/i;
  const isTitleCaseHeading = (value: string): boolean => {
    const words = value.split(/\s+/).filter((word) => word !== '&' && word.length > 0);
    return (
      words.length >= 2 &&
      words.length <= 6 &&
      words.every((word) => /^[A-Z][A-Za-z0-9/-]*$/.test(word) || /^[A-Z0-9]{2,}$/.test(word))
    );
  };
  const modules: string[] = [];
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (
      !line ||
      line.length > 80 ||
      (!establishedHeadingSuffix.test(line) &&
        !(extendedHeadingSuffix.test(line) && isTitleCaseHeading(line)))
    ) {
      continue;
    }
    const moduleId = normalizeModuleId(line);
    if (moduleId && classifyModulePhrase(moduleId) !== 'rejected') modules.push(moduleId);
  }
  return dedupeModuleIds(modules);
}

function extractNamedModuleMentions(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const match of rawPrompt.matchAll(/\b([a-z][a-z0-9-]*(?:-[a-z0-9-]+)*)\s+module\b/gi)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (!candidate || MODULE_PROSE_STOPWORDS.has(candidate)) continue;
    const canonical = resolveModuleSynonym(candidate);
    if (canonical) {
      modules.push(canonical);
      continue;
    }
    if (classifyModulePhrase(candidate) === 'module') modules.push(candidate);
  }
  return dedupeModuleIds(modules);
}

function isRawCandidateToken(moduleId: string): boolean {
  const normalized = normalizeModuleId(moduleId);
  if (!isValidModuleId(normalized)) return false;
  if (MODULE_PROSE_STOPWORDS.has(normalized)) return false;
  if (!normalized.includes('-') && !LISA_REQUIRED_MODULES.includes(normalized)) return false;
  return true;
}

function collectRawModuleCandidates(rawPrompt: string): string[] {
  const explicit = extractExplicitModules(rawPrompt);
  const loose: string[] = [];
  for (const match of rawPrompt.matchAll(/\b([a-z]+(?:-[a-z]+){1,5})\b/g)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (isRawCandidateToken(candidate)) loose.push(candidate);
  }
  for (const match of rawPrompt.matchAll(/\b([a-z][a-z0-9-]*)\s+module\b/gi)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (isRawCandidateToken(candidate)) loose.push(candidate);
  }
  return dedupeModuleIds([...explicit, ...loose]);
}

function parseCommaSeparatedFeatureList(listBody: string): string[] {
  const modules: string[] = [];
  for (const rawPart of listBody.split(/,|\band\b/i)) {
    let cleaned = rawPart
      .replace(/\b(?:local|generic|basic|optional)\b/gi, ' ')
      .replace(/\b(?:actions?|records?|items?|rules?|history|export|workflow|states?|operations?)\b/gi, ' ')
      // Articles and attribute tails are not entity heads ("a deal list", "jobs with status").
      .replace(/\b(?:a|an|the)\b/gi, ' ')
      .replace(
        /\bwith\s+(?:an?\s+)?(?:status|scheduling|triage|approval|time\s+slots?|slots?|transitions?)(?:\s+\w+){0,3}\b/gi,
        ' ',
      )
      // Participial / relative tails: "deals moving through pipeline stages".
      .replace(
        /\s+(?:moving|going|running|passing|flowing|associated|linked|tied|related|tracked)\b[\s\S]*$/i,
        ' ',
      )
      .replace(/\b(?:value\s+)?totals?\b/gi, ' ')
      .replace(/\b(?:plus|see|view|show|export)\b/gi, ' ')
      .replace(/\blists?\b/gi, ' ')
      .replace(/\bdashboards?\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Salvage head noun(s) when a long qualifier clause remains.
    if (cleaned && cleaned.split(/\s+/).length > 4) {
      const head = cleaned.split(/\s+/).slice(0, 2).join(' ');
      cleaned = head;
    }
    if (!cleaned || cleaned.split(/\s+/).length > 4) continue;
    const moduleId = normalizeModuleId(cleaned);
    if (!moduleId || ACTION_OR_BEHAVIOR_TOKENS.has(moduleId)) continue;
    // Reject weak leftovers: leading plus-, article stubs, metric-only IDs.
    if (/^(?:plus|a|an|the)-/.test(moduleId) || /-(?:totals?|list|with(?:-|$))/.test(moduleId)) continue;
    if (!isValidModuleId(moduleId) && !resolveModuleSynonym(moduleId)) continue;
    const canonical = resolveModuleSynonym(moduleId) ?? moduleId;
    if (ACTION_OR_BEHAVIOR_TOKENS.has(canonical)) continue;
    if (classifyModulePhrase(canonical) === 'rejected') continue;
    modules.push(canonical);
  }
  return dedupeModuleIds(modules);
}

function extractFeatureListModules(rawPrompt: string): string[] {
  // "with contacts, categories, notes, tasks, …" / "including A, B, and C" /
  // "manage leads, contacts, companies, deals …" — paragraph prompts commonly use manage/track.
  // Parentheses must be allowed so status enumerations ("workflow (scheduled, …)") do not abort
  // the entire feature-list match before the terminating period.
  const patterns = [
    /\b(?:with|including|featuring|supports?|containing|manages?|managing|tracks?|tracking)\s+([a-z0-9][a-z0-9\s,\-/()]{8,400}?)(?:\.|$)/i,
    // "… manager/desk/board for vendors, stall assignments, …"
    /\b(?:manager|app|application|system|desk|board|tracker|scheduler|console|registry|log|roster|ledger)\s+for\s+([a-z0-9][a-z0-9\s,\-/()]{8,400}?)(?:\.|$)/i,
  ];
  for (const pattern of patterns) {
    const listMatch = rawPrompt.match(pattern);
    if (!listMatch?.[1]) continue;
    const cleanedList = listMatch[1].replace(/\([^)]*\)/g, ' ');
    const modules = parseCommaSeparatedFeatureList(cleanedList);
    if (modules.length > 0) return modules;
  }
  return [];
}

/**
 * Em-dash / en-dash product enumerations on the opening clause only:
 * "Something for outdoor field courses — students, trips, gear checkouts".
 * Ignores later instructional dashes ("— do not create a bare timeline").
 */
function extractLeadingDashListModules(rawPrompt: string): string[] {
  const firstSentence = rawPrompt.split(/(?<=\.)\s+/)[0] ?? rawPrompt;
  const dashMatch = firstSentence.match(
    /^(.{8,100}?)[—–]\s*([a-z0-9][a-z0-9\s,\-/()]{6,200}?)(?:\.|$)/i,
  );
  if (!dashMatch?.[2]) return [];
  const head = (dashMatch[1] ?? '').toLowerCase();
  if (/\b(?:do\s+not|never|must\s+not|should\s+not)\b/i.test(head)) return [];
  return parseCommaSeparatedFeatureList(dashMatch[2].replace(/\([^)]*\)/g, ' '));
}

/**
 * Short-prompt colon lists — a dominant real-world prompt style the with/including extractor
 * never saw: "Yoga studio: members, class schedule, instructors, bookings, …" /
 * "Bike rental app: bikes, stations, customers, rentals, …".
 *
 * Generic structural rule: a short product-name head (≤80 chars, no newline) followed by a colon
 * and a comma-separated noun list. Never domain-specific. Without this, short prompts collapse to
 * dashboard/settings padding and get hijacked by keyword profile templates (e.g. BOOKING_WEB_V1
 * from the lone word "schedule"), which is exactly the short-prompt failure mode the autonomous
 * production capability audit measured at ~31% success.
 */
function extractColonListModules(rawPrompt: string): string[] {
  const trimmed = rawPrompt.trim();
  const colonMatch = trimmed.match(/^([^\n:]{2,80}):\s*([a-z0-9][a-z0-9\s,\-/&]{6,280}?)(?:\.|$)/i);
  if (!colonMatch?.[2]) return [];
  const head = (colonMatch[1] ?? '').trim().toLowerCase();
  // Reject section labels that are not product names (e.g. "Entities: students, …", "Features: …").
  if (
    /^(entities|features|modules|requirements|includes?|notes|details|fields|columns|options|steps|todos?)$/i.test(
      head,
    )
  ) {
    return [];
  }
  return parseCommaSeparatedFeatureList(colonMatch[2]);
}

function extractExplicitModules(rawPrompt: string): string[] {
  const sectionModules = extractRequiredModulesSection(rawPrompt);
  const bulletModules = extractExplicitBulletModules(rawPrompt);
  const structuredCoreModules = extractStructuredCoreModuleHeadings(rawPrompt);
  if (structuredCoreModules.length >= 2) {
    // A structured CORE MODULES section is the prompt's explicit information architecture.
    // Do not let incidental "<word> module" prose or later with/including clauses append peers.
    return dedupeModuleIds([...sectionModules, ...bulletModules, ...structuredCoreModules]);
  }
  const namedModuleMentions = extractNamedModuleMentions(rawPrompt);
  const featureListModules = extractFeatureListModules(rawPrompt);
  const colonListModules = extractColonListModules(rawPrompt);
  const dashListModules = extractLeadingDashListModules(rawPrompt);
  return dedupeModuleIds([
    ...sectionModules,
    ...bulletModules,
    ...structuredCoreModules,
    ...namedModuleMentions,
    ...featureListModules,
    ...colonListModules,
    ...dashListModules,
  ]);
}

/**
 * Product-identity head-noun suffixes. A capability keyword used as "<keyword> manager/app/system/
 * platform/…" is naming the WHOLE product ("an inventory manager", "an order management system"),
 * i.e. it is product identity, not a distinct feature module. Generic and domain-neutral.
 */
const PRODUCT_IDENTITY_SUFFIX =
  /^(?:\s+management)?\s+(?:manager|managers|app|apps|application|applications|system|systems|platform|platforms|software|tool|tools|suite|tracker|trackers|dashboard|dashboards|hub|workspace|solution|solutions)\b/i;

/**
 * True when the capability keyword that matched is being used as the product's own category noun
 * (e.g. the "inventory" in "generic inventory manager") rather than as one feature among several
 * (e.g. the "inventory" listed alongside "menu items, tables, orders, …" in a restaurant prompt).
 * Prevents the product-identity noun from being demanded as a standalone module it never becomes.
 */
function capabilityKeywordIsProductIdentityNoun(rawPrompt: string, match: RegExpMatchArray): boolean {
  const matchIndex = match.index ?? -1;
  if (matchIndex < 0) return false;
  const tail = rawPrompt.slice(matchIndex + match[0].length);
  return PRODUCT_IDENTITY_SUFFIX.test(tail);
}

function deriveModulesFromCapabilities(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const entry of CAPABILITY_TO_MODULE) {
    const match = rawPrompt.match(entry.pattern);
    if (!match) continue;
    if (capabilityKeywordIsProductIdentityNoun(rawPrompt, match)) continue;
    modules.push(entry.module);
  }
  return dedupeModuleIds(modules);
}

function extractClassifiedPhrases(rawPrompt: string): {
  interactions: string[];
  designRequirements: string[];
  platformRequirements: string[];
  safetyNotes: string[];
  rejectedPhrases: string[];
} {
  const interactions: string[] = [];
  const designRequirements: string[] = [];
  const platformRequirements: string[] = [];
  const safetyNotes: string[] = [];
  const rejectedPhrases: string[] = [];

  const interactionPatterns = [
    /\bblink simulation(?:\s+control)?\b/gi,
    /\bgaze selection(?:\s+simulation)?\b/gi,
    /\bphrase selection\b/gi,
    /\bmessage composition\b/gi,
    /\bspeak button\b/gi,
    /\bemergency speech(?:\s+button)?\b/gi,
    /\bcalibration controls?\b/gi,
    /\bsettings controls?\b/gi,
    /\bhistory filter(?:ing)?\b/gi,
    /\bblink-to-select\b/gi,
    /\bdwell-to-select\b/gi,
    /\bgaze-selectable\b/gi,
  ];
  for (const pattern of interactionPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      interactions.push(match[0].toLowerCase());
    }
  }

  const designPatterns = [
    /\bmobile-first\b/gi,
    /\baccessibility-first\b/gi,
    /\bgaze-friendly\b/gi,
    /\bcaregiver-friendly\b/gi,
    /\bmedical-assistive\b/gi,
    /\bhigh contrast\b/gi,
    /\blarge (?:touch targets|accessible (?:ui )?elements)\b/gi,
    /\bphone-sized(?:\s+preview)?\b/gi,
  ];
  for (const pattern of designPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      designRequirements.push(match[0].toLowerCase());
    }
  }

  const platformPatterns = [
    /\bandroid-first\b/gi,
    /\bandroid phone(?:-sized)?\b/gi,
    /\bmobile-first\b/gi,
    /\bphone-sized preview\b/gi,
  ];
  for (const pattern of platformPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      platformRequirements.push(match[0].toLowerCase());
    }
  }

  if (/not a certified medical device|not certified medical/i.test(rawPrompt)) {
    safetyNotes.push(
      'LISA is an assistive communication tool and not a certified medical device unless formally validated and approved.',
    );
  }

  for (const match of rawPrompt.matchAll(/\b([a-z]+(?:-[a-z]+){1,5})\b/g)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    const classification = classifyModulePhrase(candidate);
    if (classification === 'rejected' || classification === 'interaction' || classification === 'design-requirement') {
      rejectedPhrases.push(candidate);
    }
  }

  return {
    interactions: [...new Set(interactions)],
    designRequirements: [...new Set(designRequirements)],
    platformRequirements: [...new Set(platformRequirements)],
    safetyNotes: [...new Set(safetyNotes)],
    rejectedPhrases: dedupeModuleIds(rejectedPhrases),
  };
}

function inferDomain(rawPrompt: string): string {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return 'assistive communication / accessibility / health accessibility';
  }
  const lower = rawPrompt.toLowerCase();
  // Prefer composed multi-entity products over single-utility domain labels when several
  // entity nouns appear (e.g. contact/task manager that also mentions notes).
  if (promptDescribesMultiEntityProduct(rawPrompt)) {
    if (/\bcontact/.test(lower) && /\btask/.test(lower)) return 'contacts / tasks';
    if (/\binventory|\bstock|\bproduct/.test(lower)) return 'inventory / operations';
    if (/\bappointment|\bbooking/.test(lower)) return 'appointments / scheduling';
    if (/\brestaurant|\bmenu|\border/.test(lower)) return 'restaurant / operations';
    return 'custom application domain';
  }
  if (/calculator/.test(lower)) return 'utility / calculator';
  if (/todo|to-do/.test(lower)) return 'utility / todo list';
  if (/\bnotes?\s+app\b|\bsimple\s+notes?\b/.test(lower)) return 'utility / notes';
  if (/timer/.test(lower)) return 'utility / timer';
  if (/counter/.test(lower)) return 'utility / counter';
  if (/recipe|meal|cook/.test(lower)) return 'culinary / recipe management';
  if (/pet|veterinar/.test(lower)) return 'pet care';
  if (/meditation|mindful/.test(lower)) return 'wellness / mindfulness';
  if (/farm|agricultur|crop/.test(lower)) return 'agriculture';
  return 'custom application domain';
}

function inferTargetUsers(rawPrompt: string): string[] {
  const users: string[] = [];
  if (/caregiver/i.test(rawPrompt)) users.push('caregivers');
  if (/locked[\s-]?in|patient|user with/i.test(rawPrompt)) users.push('assistive communication users');
  if (/android|mobile/i.test(rawPrompt)) users.push('mobile users');
  if (!users.length) users.push('end users');
  return users;
}

function inferPlatform(rawPrompt: string): string {
  if (/android[\s-]?first|android phone/i.test(rawPrompt)) return 'mobile-first / Android-first';
  if (/mobile[\s-]?first/i.test(rawPrompt)) return 'mobile-first';
  if (/ios|iphone/i.test(rawPrompt)) return 'mobile-first / iOS';
  return 'web-first';
}

function inferCorePurpose(rawPrompt: string): string {
  const purpose = rawPrompt.match(
    /(?:that|to)\s+((?:convert|enable|help|allow|provide)[^.]{8,120})/i,
  );
  if (purpose?.[1]) return purpose[1].trim().replace(/\s+/g, ' ');
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return 'convert eye movement, gaze, and blinks into speech';
  }
  const buildPurpose = rawPrompt.match(/\bbuild\s+[^.]{10,120}\./i);
  return buildPurpose?.[0]?.replace(/^build\s+/i, '').replace(/\.$/, '') ?? 'deliver prompt-specific capabilities';
}

function extractInteractions(rawPrompt: string, classified: string[]): string[] {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return [...new Set([...LISA_INTERACTIONS, ...classified])];
  }
  return classified.length > 0 ? classified : [];
}

function extractPreviewRequirements(rawPrompt: string): string[] {
  const reqs: string[] = [];
  if (/android|mobile[\s-]?first/i.test(rawPrompt)) {
    reqs.push('Android phone-sized preview container');
  }
  if (/communication board/i.test(rawPrompt)) {
    reqs.push('Communication board visible on first screen');
  }
  return reqs;
}

function isCustomDomainPrompt(rawPrompt: string, explicitModules: string[]): boolean {
  if (isSimpleUtilityAppPrompt(rawPrompt)) return true;
  if (promptMentionsLisaOrAccessibility(rawPrompt)) return true;
  if (explicitModules.length >= 3) return true;
  const capabilityModules = deriveModulesFromCapabilities(rawPrompt);
  if (capabilityModules.length >= 3) return true;
  return /custom app|unsupported|unique|specialized|niche/i.test(rawPrompt);
}

function resolveRequiredModules(
  rawPrompt: string,
  explicit: string[],
  capability: string[],
): { sanitized: string[]; raw: string[]; rejected: string[] } {
  const simpleUtilityKind = detectSimpleUtilityAppKind(rawPrompt);
  if (simpleUtilityKind) {
    const modules = simpleUtilityFeatureModules(simpleUtilityKind);
    return { sanitized: modules, raw: modules, rejected: [] };
  }

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    const raw = collectRawModuleCandidates(rawPrompt);
    return {
      sanitized: [...LISA_REQUIRED_MODULES],
      raw,
      rejected: dedupeModuleIds([
        ...raw.filter((m) => !LISA_REQUIRED_MODULES.includes(m)),
        ...raw.filter((m) => classifyModulePhrase(m) === 'rejected'),
      ]),
    };
  }

  let candidateModules: string[];
  if (explicit.length >= 2) {
    // Keep capability-derived modules so listed actions that map via CAPABILITY_TO_MODULE
    // (e.g. tasks/notes) still join an explicit "with A, B, …" feature list.
    candidateModules = dedupeModuleIds([...explicit, ...capability]);
  } else if (capability.length >= 2) {
    candidateModules = capability;
  } else {
    candidateModules = dedupeModuleIds([...explicit, ...capability]);
  }

  const { sanitized, rejected } = sanitizeModuleIds(candidateModules);
  const withoutNegatedBanned = sanitized.filter((moduleId) => {
    if (!(BANNED_FALLBACK_MODULES as readonly string[]).includes(moduleId)) return true;
    return promptJustifiesBareBannedFallback(rawPrompt, moduleId);
  });

  if (withoutNegatedBanned.length < 2 && !isCustomDomainPrompt(rawPrompt, explicit)) {
    return {
      sanitized: dedupeModuleIds([...withoutNegatedBanned, 'dashboard', 'settings']),
      raw: candidateModules,
      rejected,
    };
  }

  return { sanitized: withoutNegatedBanned, raw: candidateModules, rejected };
}

export function extractPromptFeatures(rawPrompt: string): PromptFeatureExtraction {
  const explicit = extractExplicitModules(rawPrompt);
  const structuredCoreModules = extractStructuredCoreModuleHeadings(rawPrompt);
  // A structured CORE MODULES section is stronger evidence than context-free lexical matches.
  // In that mode, preserve explicitly matched compound capabilities but suppress bare lexical
  // nouns so incidental "notes/services/suppliers" cannot become peer modules.
  const capability =
    structuredCoreModules.length >= 2
      ? deriveModulesFromCapabilities(rawPrompt).filter((moduleId) => moduleId.includes('-'))
      : deriveModulesFromCapabilities(rawPrompt);
  const classified = extractClassifiedPhrases(rawPrompt);
  const { sanitized, raw, rejected } = resolveRequiredModules(rawPrompt, explicit, capability);

  const androidPhonePreviewRequired = /android[\s-]?first|android phone|mobile[\s-]?first/i.test(rawPrompt);

  return {
    readOnly: true,
    appName: extractAppName(rawPrompt),
    domain: inferDomain(rawPrompt),
    targetUsers: inferTargetUsers(rawPrompt),
    primaryPlatform: inferPlatform(rawPrompt),
    corePurpose: inferCorePurpose(rawPrompt),
    requiredModules: sanitized,
    rawExtractedModules: raw,
    rejectedNonModulePhrases: dedupeModuleIds([...rejected, ...classified.rejectedPhrases]),
    requiredInteractions: extractInteractions(rawPrompt, classified.interactions),
    designRequirements: classified.designRequirements,
    platformRequirements: classified.platformRequirements,
    safetyNotes: classified.safetyNotes,
    previewRequirements: extractPreviewRequirements(rawPrompt),
    androidPhonePreviewRequired,
    isCustomDomainPrompt: isCustomDomainPrompt(rawPrompt, explicit),
    explicitModulesProvided: explicit.length >= 2,
    structuredCoreModulesProvided: structuredCoreModules.length >= 2,
    sanitizedModuleCount: sanitized.length,
    rawExtractedModuleCount: raw.length,
  };
}

// Preserve stopword export for tests that may reference module prose filtering.
export const MODULE_PROSE_STOPWORDS_FOR_TESTS = MODULE_PROSE_STOPWORDS;
