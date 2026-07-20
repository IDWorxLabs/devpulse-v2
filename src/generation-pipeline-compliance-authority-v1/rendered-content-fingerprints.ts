/**
 * Generation Pipeline Compliance Authority V1 — Rendered Content Evidence Expansion V1.
 *
 * Generic, fingerprint-based detectors for the rendered surface of a generated app. Every pattern
 * here targets generic template/placeholder/boilerplate *wording or structure* — never a product
 * domain. Two independent signal families are used:
 *
 * 1. Rendered UI metadata markers (`data-blueprint="..."` and similar `data-*` attributes) — the
 *    real, existing generator (`src/universal-app-blueprint/universal-app-blueprint-generator.ts`)
 *    already stamps every reusable shell/onboarding/auth/starter page it writes with one of these
 *    markers. GPCA's structural evidence today only checks *file paths*; this reads the same
 *    signal directly out of rendered output, so a reusable shell page written under a different
 *    path (or copy-pasted into a "custom" file) is caught too.
 * 2. Generic wording/structure fingerprints — literal template/placeholder phrasing patterns
 *    (welcome-to-your-app copy, starter-dashboard section headers, onboarding-step copy, hero
 *    placeholder copy, numbered sample cards/features, boilerplate CTA button text) that show up
 *    in template/boilerplate generators industry-wide, independent of any specific generator.
 */

export type RenderedFingerprintCategory =
  | 'TEMPLATE_WORDING'
  | 'PLACEHOLDER_COPY'
  | 'REUSABLE_SHELL'
  | 'ONBOARDING'
  | 'STARTER_DASHBOARD'
  | 'HERO_TEMPLATE'
  | 'BOILERPLATE_QUICK_ACTIONS'
  | 'STARTER_CARDS'
  | 'GENERIC_FEATURE_GRID'
  | 'PLACEHOLDER_BUTTON'
  | 'BOILERPLATE_NAVIGATION'
  | 'GENERATED_UI_METADATA_MARKER';

export interface RenderedFingerprintDefinition {
  readonly id: string;
  readonly category: RenderedFingerprintCategory;
  readonly pattern: RegExp;
  readonly description: string;
  readonly baseConfidence: number;
}

/** Generic wording/structure fingerprints — never a product domain, always template/placeholder shape. */
export const GENERIC_RENDERED_CONTENT_FINGERPRINTS: readonly RenderedFingerprintDefinition[] = [
  {
    id: 'template-wording-reusable-components',
    category: 'TEMPLATE_WORDING',
    pattern: /\breusable components?\b/i,
    description: 'Literal "reusable component(s)" wording rendered to the user.',
    baseConfidence: 92,
  },
  {
    id: 'template-wording-lorem-ipsum',
    category: 'TEMPLATE_WORDING',
    pattern: /\blorem ipsum\b/i,
    description: 'Lorem-ipsum filler copy rendered to the user.',
    baseConfidence: 98,
  },
  {
    id: 'template-wording-placeholder',
    category: 'PLACEHOLDER_COPY',
    pattern: /\bplaceholder\b/i,
    description: 'The literal word "placeholder" rendered to the user.',
    baseConfidence: 80,
  },
  {
    id: 'template-wording-coming-soon',
    category: 'PLACEHOLDER_COPY',
    pattern: /\bcoming soon\b/i,
    description: '"Coming soon" placeholder copy rendered to the user.',
    baseConfidence: 75,
  },
  {
    id: 'template-wording-sample-content',
    category: 'PLACEHOLDER_COPY',
    pattern: /\bsample (?:data|content|text)\b/i,
    description: 'Explicit "sample data/content/text" placeholder wording.',
    baseConfidence: 85,
  },
  {
    id: 'template-wording-add-your-content',
    category: 'PLACEHOLDER_COPY',
    pattern: /\badd your (?:content|text|copy) here\b/i,
    description: '"Add your content here" template instruction copy.',
    baseConfidence: 90,
  },
  {
    id: 'template-wording-demo-starter-app',
    category: 'TEMPLATE_WORDING',
    pattern: /\bthis is an? (?:(?:demo|sample|starter)\s+){1,2}(?:app|application|page|dashboard)\b/i,
    description: 'Explicit "this is a demo/sample/starter app" template disclosure.',
    baseConfidence: 92,
  },
  {
    id: 'reusable-shell-welcome-to-app',
    category: 'REUSABLE_SHELL',
    pattern: /\bwelcome to (?:your|the) (?:app|application|product|dashboard)\b/i,
    description: 'Generic "welcome to your/the app" shell wording with no product identity.',
    baseConfidence: 85,
  },
  {
    id: 'reusable-shell-app-shell',
    category: 'REUSABLE_SHELL',
    pattern: /\bapp shell\b/i,
    description: 'Literal "app shell" wording rendered to the user.',
    baseConfidence: 70,
  },
  {
    id: 'reusable-shell-generic-shell',
    category: 'REUSABLE_SHELL',
    pattern: /\bgeneric (?:dashboard|shell|template)\b/i,
    description: 'Explicit "generic dashboard/shell/template" wording.',
    baseConfidence: 90,
  },
  {
    id: 'reusable-shell-modular-shell',
    category: 'REUSABLE_SHELL',
    pattern: /\bmodular (?:application|app) shell with navigation\b/i,
    description: 'Generic modular-shell description copy shared by every unconfigured build.',
    baseConfidence: 88,
  },
  {
    id: 'onboarding-step-of',
    category: 'ONBOARDING',
    pattern: /\bstep\s+\d+\s+of\s+\d+\b/i,
    description: 'Generic numbered onboarding-step copy.',
    baseConfidence: 55,
  },
  {
    id: 'onboarding-lets-get-set-up',
    category: 'ONBOARDING',
    pattern: /\blet'?s get you (?:set up|started)\b/i,
    description: 'Generic onboarding "let\'s get you set up/started" copy.',
    baseConfidence: 80,
  },
  {
    id: 'onboarding-complete-your-profile',
    category: 'ONBOARDING',
    pattern: /\bcomplete your profile\b/i,
    description: 'Generic "complete your profile" onboarding copy.',
    baseConfidence: 65,
  },
  {
    id: 'onboarding-welcome-aboard',
    category: 'ONBOARDING',
    pattern: /\bwelcome aboard\b/i,
    description: 'Generic "welcome aboard" onboarding copy.',
    baseConfidence: 70,
  },
  {
    id: 'starter-dashboard-overview',
    category: 'STARTER_DASHBOARD',
    pattern: /\bdashboard overview\b/i,
    description: 'Generic "dashboard overview" starter-dashboard section header.',
    baseConfidence: 75,
  },
  {
    id: 'starter-dashboard-recent-activity',
    category: 'STARTER_DASHBOARD',
    pattern: /\brecent activity\b/i,
    description: 'Generic "recent activity" starter-dashboard section header.',
    baseConfidence: 55,
  },
  {
    id: 'starter-dashboard-total-generic-metric',
    category: 'STARTER_DASHBOARD',
    pattern: /\btotal (?:items|records|users)\b/i,
    description: 'Generic "total items/records/users" starter-dashboard metric label.',
    baseConfidence: 55,
  },
  {
    id: 'boilerplate-quick-actions',
    category: 'BOILERPLATE_QUICK_ACTIONS',
    pattern: /\bquick actions\b/i,
    description: 'Generic "quick actions" starter-dashboard section header.',
    baseConfidence: 60,
  },
  {
    id: 'hero-template-headline-placeholder',
    category: 'HERO_TEMPLATE',
    pattern: /\byour (?:headline|tagline|slogan) here\b/i,
    description: 'Generic "your headline/tagline here" hero placeholder copy.',
    baseConfidence: 95,
  },
  {
    id: 'hero-template-catchy-headline',
    category: 'HERO_TEMPLATE',
    pattern: /\bcatchy (?:headline|tagline)\b/i,
    description: 'Generic "catchy headline/tagline" hero template instruction copy.',
    baseConfidence: 90,
  },
  {
    id: 'starter-cards-numbered-card',
    category: 'STARTER_CARDS',
    pattern: /\bcard\s*#?\s*(?:one|two|three|1|2|3)\b/i,
    description: 'Generic numbered placeholder card label ("Card One" / "Card #1").',
    baseConfidence: 90,
  },
  {
    id: 'starter-cards-sample-or-placeholder-card',
    category: 'STARTER_CARDS',
    pattern: /\b(?:sample|placeholder) card\b/i,
    description: 'Generic "sample card" / "placeholder card" label.',
    baseConfidence: 92,
  },
  {
    id: 'generic-feature-grid-numbered-feature',
    category: 'GENERIC_FEATURE_GRID',
    pattern: /\bfeature\s*#?\s*(?:one|two|three|1|2|3)\b/i,
    description: 'Generic numbered placeholder feature label ("Feature One" / "Feature #1").',
    baseConfidence: 90,
  },
  {
    id: 'generic-feature-grid-label',
    category: 'GENERIC_FEATURE_GRID',
    pattern: /\bfeature grid\b/i,
    description: 'Literal "feature grid" wording rendered to the user.',
    baseConfidence: 70,
  },
];

/** Small, generic (never product-specific) set of literal CTA texts that carry no product meaning on their own. */
export const GENERIC_PLACEHOLDER_BUTTON_LABELS: readonly string[] = [
  'click me',
  'button',
  'placeholder',
  'submit',
  'lorem ipsum',
];

const WORD_SPLIT_PATTERN = /[^a-z0-9]+/;

export function normalizeRenderedWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(WORD_SPLIT_PATTERN)
    .filter((w) => w.length > 2);
}

/** Does the rendered text reference at least one real contract concept (by word overlap)? */
export function referencesContractVocabulary(text: string, vocabulary: readonly string[]): boolean {
  const words = new Set(normalizeRenderedWords(text));
  if (words.size === 0) return false;
  const conceptWords = new Set(vocabulary.flatMap((c) => normalizeRenderedWords(c)));
  for (const word of words) {
    if (conceptWords.has(word)) return true;
  }
  return false;
}

export function matchRenderedFingerprints(text: string): RenderedFingerprintDefinition[] {
  return GENERIC_RENDERED_CONTENT_FINGERPRINTS.filter((fp) => fp.pattern.test(text));
}

function stripJsxExpressions(text: string): string {
  let previous = text;
  let next = text;
  // Nested JSX expressions (e.g. onClick={() => ...}) require iterative stripping.
  do {
    previous = next;
    next = previous.replace(/\{[^{}]*\}/g, ' ');
  } while (next !== previous);
  return next;
}

function stripNestedTags(text: string): string {
  return text.replace(/<[^>]+>/g, ' ');
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function cleanExtractedText(raw: string): string {
  return collapseWhitespace(stripNestedTags(stripJsxExpressions(raw)));
}

/** Finds the closing `>` of a JSX/HTML opening tag, ignoring `>` inside quotes or `{...}` expressions. */
function findOpeningTagEnd(source: string, openAngleIndex: number): number {
  let depth = 0;
  let inString: '"' | "'" | '`' | null = null;
  for (let i = openAngleIndex + 1; i < source.length; i += 1) {
    const ch = source[i]!;
    const prev = source[i - 1];
    if (inString) {
      if (ch === inString && prev !== '\\') inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === '>' && depth === 0) return i;
  }
  return -1;
}

/** Extracts the (static, cleaned) inner text of every occurrence of the given JSX/HTML tags. */
export function extractTagContents(source: string, tagNames: readonly string[]): string[] {
  const results: string[] = [];
  for (const tag of tagNames) {
    const openRe = new RegExp(`<${tag}(?=[\\s>/])`, 'gi');
    let openMatch: RegExpExecArray | null;
    while ((openMatch = openRe.exec(source))) {
      const openStart = openMatch.index;
      const openEnd = findOpeningTagEnd(source, openStart);
      if (openEnd < 0) continue;
      const closeRe = new RegExp(`</${tag}>`, 'i');
      const rest = source.slice(openEnd + 1);
      const closeMatch = closeRe.exec(rest);
      if (!closeMatch) continue;
      const inner = rest.slice(0, closeMatch.index);
      const cleaned = cleanExtractedText(inner);
      if (cleaned) results.push(cleaned);
      openRe.lastIndex = openEnd + 1 + closeMatch.index + closeMatch[0].length;
    }
  }
  return results;
}

/** Extracts `aria-label="..."` values — used for interaction surfaces that carry no visible text node. */
export function extractAriaLabels(source: string): string[] {
  const re = /aria-label\s*=\s*(['"`])([^'"`]{1,160})\1/g;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const cleaned = collapseWhitespace(match[2]);
    if (cleaned) results.push(cleaned);
  }
  return results;
}

/**
 * Extracts quoted values assigned to a given generic field name (label:/title:/heading:/name:).
 * The lookbehind excludes hyphenated attribute names like `aria-label="..."` or `data-title="..."`
 * from matching a bare `label`/`title` field — those are a different (HTML attribute) signal,
 * extracted separately by `extractAriaLabels`/`extractGeneratedUiMetadataMarkers`.
 */
export function extractQuotedFieldValues(source: string, fieldName: string): string[] {
  const re = new RegExp(`(?<![-\\w])${fieldName}\\s*[:=]\\s*(['"\`])([^'"\`]{1,160})\\1`, 'g');
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const cleaned = collapseWhitespace(match[2]);
    if (cleaned) results.push(cleaned);
  }
  return results;
}

/**
 * Extracts every `data-blueprint="..."` (and `data-blueprint-*="..."`) rendered-UI-metadata marker
 * value. These are stamped directly into the rendered DOM by the real generator whenever it writes
 * a reusable shell/onboarding/auth/starter page or component — a structural, generic signal.
 */
export function extractGeneratedUiMetadataMarkers(source: string): string[] {
  const re = /data-blueprint(?:-[a-z]+)?\s*=\s*(['"`])([^'"`]{1,80})\1/gi;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    if (match[2]) results.push(match[2]);
  }
  return results;
}

/** Known generic/reusable-shell rendered-UI-metadata marker values — infra concepts, never a product domain. */
export const GENERIC_UI_METADATA_SHELL_MARKERS: readonly string[] = [
  'launch-screen',
  'welcome-screen',
  'auth-layer',
  'auth-guest',
  'auth-email',
  'auth-social',
  'onboarding',
  'app-shell',
  'home-formula',
  'empty-state',
  'error-state',
  'loading-state',
];

/** Extracts every static button label (JSX `<button>` text and `<Button>` text). */
export function extractButtonLabels(source: string): string[] {
  return extractTagContents(source, ['button', 'Button']);
}

const NAVIGATION_TAG_NAMES: readonly string[] = ['button', 'Button', 'a', 'Link', 'NavLink'];

/** Generic infrastructure-navigation kind identifiers — see `infrastructure-navigation-model.ts`. Duplicated here (never imported) to keep GPCA's evidence layer dependency-free of the boundary authority. */
const INFRASTRUCTURE_NAVIGATION_KIND_PATTERN = /^(?:ROOT_SURFACE|ROOT_LAYOUT|ROOT_CONTAINER|APPLICATION_FRAME|ENTRY_SURFACE)$/;

/**
 * Contract-Bound Root Navigation Authority V1 — an element the generator has structurally tagged
 * `data-nav-kind="<INFRASTRUCTURE_KIND>"` on its own opening tag is infrastructure navigation (a
 * root shell/frame/entry surface), never business navigation, regardless of what text it renders.
 * Generic by construction: matches any of the five infrastructure-navigation kinds, never a
 * specific label.
 */
function extractInfrastructureNavigationDomLabels(source: string): string[] {
  const results: string[] = [];
  for (const tag of NAVIGATION_TAG_NAMES) {
    const re = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(source))) {
      const attrs = match[1] ?? '';
      const kindMatch = attrs.match(/data-nav-kind\s*=\s*(['"`])([A-Z_]+)\1/);
      if (kindMatch && INFRASTRUCTURE_NAVIGATION_KIND_PATTERN.test(kindMatch[2])) {
        const cleaned = cleanExtractedText(match[2]);
        if (cleaned) results.push(cleaned);
      }
    }
  }
  return results;
}

/**
 * Contract-Bound Root Navigation Authority V1 — a plain-object navigation entry shaped like
 * `{ kind: 'ROOT_SURFACE', id: '...', label: '...' }` (the exact structural shape
 * `InfrastructureNavigationItem` in `infrastructure-navigation-model.ts` requires) is infrastructure
 * navigation data, not a business navigation field — regardless of what its `label` value is. Scans
 * flat (non-nested) object-literal blocks for a `kind` sibling naming one of the five generic
 * infrastructure-navigation kinds alongside a `label` field.
 */
function extractInfrastructureNavigationFieldLabels(source: string): string[] {
  const results: string[] = [];
  const blockRe = /\{[^{}]{0,300}\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(source))) {
    const block = match[0];
    const kindMatch = block.match(/\bkind\s*[:=]\s*(['"`])([A-Z_]+)\1/);
    if (!kindMatch || !INFRASTRUCTURE_NAVIGATION_KIND_PATTERN.test(kindMatch[2])) continue;
    const labelMatch = block.match(/(?<![-\w])label\s*[:=]\s*(['"`])([^'"`]{1,160})\1/);
    if (!labelMatch) continue;
    const cleaned = collapseWhitespace(labelMatch[2]);
    if (cleaned) results.push(cleaned);
  }
  return results;
}

/**
 * Every navigation-shaped label this build's real source structurally marks as infrastructure
 * (root shell/frame/entry-surface) navigation — via either a rendered `data-nav-kind="..."` DOM
 * marker or a `{ kind: '<INFRASTRUCTURE_KIND>', label: '...' }` data field. These labels must never
 * be treated as product/business navigation and must never appear in `extractNavigationLabels`'s
 * result — GPCA's contract-navigation comparison, CBGA approval checks, and hardcoded-navigation
 * detectors only ever see the product-only set `extractNavigationLabels` returns.
 */
export function extractInfrastructureNavigationLabels(source: string): string[] {
  return [...new Set([...extractInfrastructureNavigationDomLabels(source), ...extractInfrastructureNavigationFieldLabels(source)])];
}

/**
 * Extracts every static, business/product navigation-related label: text inside `<nav>`, plus
 * `label:`-style nav item fields — EXCLUDING any label a generator has structurally marked as
 * infrastructure navigation (see `extractInfrastructureNavigationLabels`). This is the one and only
 * set GPCA's contract-navigation comparison, CBGA approval checks, and hardcoded-navigation
 * detectors ever consult; infrastructure navigation is a constitutionally separate concept and must
 * never enter it.
 */
export function extractNavigationLabels(source: string): string[] {
  const labels = new Set<string>();
  const navBlocks: string[] = [];
  const navRe = /<nav(?:\s[^>]*)?>([\s\S]*?)<\/nav>/gi;
  let navMatch: RegExpExecArray | null;
  while ((navMatch = navRe.exec(source))) navBlocks.push(navMatch[1]!);
  for (const block of navBlocks) {
    for (const text of extractTagContents(block, NAVIGATION_TAG_NAMES)) {
      if (isPlausibleNavigationLabel(text)) labels.add(text);
    }
  }
  for (const text of extractQuotedFieldValues(source, 'label')) {
    if (isPlausibleNavigationLabel(text)) labels.add(text);
  }
  const infrastructureLabels = new Set(extractInfrastructureNavigationLabels(source));
  return [...labels].filter((label) => !infrastructureLabels.has(label));
}

function isPlausibleNavigationLabel(label: string): boolean {
  if (!label || label.length > 48) return false;
  if (/setActiveModuleId|[{}=;]|=>/.test(label)) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9 \-_'/&.]*$/.test(label)) return false;
  return true;
}

/** Extracts every visible heading (h1-h4) and page-title candidate. */
export function extractHeadings(source: string): string[] {
  return extractTagContents(source, ['h1', 'h2', 'h3', 'h4']);
}

export function extractPageTitleCandidates(source: string): string[] {
  const results = new Set<string>();
  for (const text of extractTagContents(source, ['title'])) results.add(text);
  for (const text of extractQuotedFieldValues(source, 'pageTitle')) results.add(text);
  for (const text of extractQuotedFieldValues(source, 'documentTitle')) results.add(text);
  const [firstHeading] = extractHeadings(source);
  if (firstHeading) results.add(firstHeading);
  return [...results];
}

/** Extracts every static, human-readable visible text node — the closest generic proxy for "rendered HTML/DOM". */
export function extractAllVisibleTextNodes(source: string): string[] {
  const results: string[] = [];
  const withoutImports = source.replace(/^import[^\n]*\n/gm, '').replace(/^export\s+(?:type|interface)[^;]*;?/gm, '');
  const re = />([^<>{}\n]{2,160})</g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(withoutImports))) {
    const cleaned = collapseWhitespace(match[1]);
    if (cleaned && /[a-zA-Z]{3,}/.test(cleaned)) results.push(cleaned);
  }
  return results;
}
