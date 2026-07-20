/**
 * Infrastructure vs Product Boundary Authority V1 — Phase 1 infrastructure signal detection.
 *
 * Every rule below targets a generic, industry-wide structural code *pattern* (bootstrap calls,
 * router primitives, provider/context wiring, error/loading boundaries, lifecycle hooks, theme
 * tokens, configuration reads, layout composition) — never a filename, never a product domain, and
 * never a specific application's identifier. The same rule set fires identically whether the file
 * belongs to a restaurant platform, a calculator, or a CRM, because it only ever looks at *how* the
 * code is structured, never *what business it serves*.
 */

import type { BoundarySignalMatch, InfrastructureResponsibilityKind } from './infrastructure-product-boundary-types.js';

interface InfrastructureSignalRule {
  readonly kind: InfrastructureResponsibilityKind;
  readonly pattern: RegExp;
  readonly description: string;
}

const INFRASTRUCTURE_SIGNAL_RULES: readonly InfrastructureSignalRule[] = [
  {
    kind: 'APPLICATION_BOOTSTRAP',
    pattern: /\bReactDOM\.(?:createRoot|render)\s*\(|(?<!\.)\bcreateRoot\s*\(/,
    description: 'Application bootstrap (framework root-render entry point).',
  },
  {
    kind: 'ROUTING_INFRASTRUCTURE',
    pattern: /<Routes[\s>]|<Route\s|createBrowserRouter\s*\(|useNavigate\s*\(|<BrowserRouter[\s>]|<Outlet\s*\/?>/,
    description: 'Routing infrastructure (router/route/outlet primitives).',
  },
  {
    kind: 'PROVIDER_HIERARCHY',
    pattern: /<[A-Za-z][\w.]*Provider[\s>]|createContext\s*\(/,
    description: 'Provider hierarchy / React context wiring.',
  },
  {
    kind: 'DEPENDENCY_INJECTION',
    pattern: /useContext\s*\(|\bContainer\.(?:register|resolve)\s*\(|\binject\s*\(/,
    description: 'Dependency injection / service-container wiring.',
  },
  {
    kind: 'ERROR_BOUNDARY',
    pattern: /\bErrorBoundary\b|componentDidCatch\s*\(|getDerivedStateFromError\s*\(/,
    description: 'Error-boundary infrastructure.',
  },
  {
    kind: 'LOADING_BOUNDARY',
    pattern: /<Suspense[\s>]|\bfallback\s*=\s*\{/,
    description: 'Loading-boundary (Suspense/fallback) infrastructure.',
  },
  {
    kind: 'LIFECYCLE_INFRASTRUCTURE',
    pattern: /\buseEffect\s*\(|componentDidMount\s*\(|componentWillUnmount\s*\(/,
    description: 'Lifecycle infrastructure (mount/unmount wiring).',
  },
  {
    kind: 'THEME_INFRASTRUCTURE',
    pattern: /\bThemeProvider\b|createTheme\s*\(|:root\s*\{|--[a-z][a-z0-9-]*\s*:\s*#/i,
    description: 'Theme infrastructure (design-token / theme-provider wiring).',
  },
  {
    kind: 'CONFIGURATION',
    pattern: /process\.env\.[A-Z0-9_]+|import\.meta\.env\.[A-Z0-9_]+/,
    description: 'Configuration constant / environment-variable wiring.',
  },
  {
    kind: 'SERVICE_REGISTRATION',
    pattern: /QueryClientProvider|registerService\s*\(|ServiceProvider/,
    description: 'Service-registration infrastructure.',
  },
  {
    kind: 'APPLICATION_SHELL',
    pattern: /\b(?:AppShell|RootLayout|MainLayout|ShellLayout)\b|renderRoute\s*\(\s*\)/,
    description: 'Application-shell route-switch wiring (structural composition, not content).',
  },
  {
    kind: 'LAYOUT_INFRASTRUCTURE',
    pattern: /display:\s*flex|grid-template-columns|<main(?:\s[^>]*)?>\s*\{/,
    description: 'Layout infrastructure (structural container composition).',
  },
  {
    kind: 'STARTUP_ORCHESTRATION',
    pattern: /\bbootstrapApp\s*\(|initializeApp\s*\(|startApp\s*\(/,
    description: 'Startup-orchestration wiring.',
  },
  {
    kind: 'RENDER_PIPELINE',
    pattern: /function\s+render[A-Z]\w*\s*\(|renderRoute\s*\(|renderScreen\s*\(/,
    description: 'Render-pipeline dispatch wiring (switches between screens by state, not by content).',
  },
  {
    kind: 'NAVIGATION_INFRASTRUCTURE',
    pattern: /\bonNavigate\s*[:=]|\bsetRoute\s*\(|useState<\w*Route\w*>/,
    description: 'Navigation infrastructure (route-state wiring, distinct from business nav labels).',
  },
];

const HAS_JSX_MARKUP_PATTERN = /<[A-Za-z]/;

/**
 * A quoted string literal spanning two or more real words — the same generic "does this look like a
 * human sentence/phrase" shape the business-content detector independently extracts. Deliberately
 * duplicated as a single, tiny, local check (rather than importing the business-content module here)
 * to keep the two signal families fully decoupled: this module only ever needs to know "is there
 * plausibly rendered/authored prose in this file at all", never the actual extracted phrases.
 */
const HAS_SENTENCE_LIKE_STRING_LITERAL_PATTERN = /(['"`])(?:[A-Za-z][A-Za-z'-]*\s+){1,}[A-Za-z][A-Za-z'-]*\1/;

/**
 * Detects every generic infrastructure-responsibility signal present in a file's real content. A
 * file that matches none of the specific structural patterns above, contains no JSX/rendering markup
 * at all, AND contains no sentence-like quoted string falls back to the generic `SHARED_RUNTIME`
 * classification — by definition, a file that renders nothing and holds no authored prose can only
 * be non-visual structural/runtime code. A non-JSX file that DOES hold authored prose (e.g. a plain
 * `.ts` module exporting business copy constants) deliberately does NOT get this fallback — it must
 * fall through to the business-content detector and be classified PRODUCT / CONTRACT_DERIVED_CONTENT
 * instead, never misclassified as infrastructure merely for lacking JSX.
 */
export function detectInfrastructureSignals(content: string): BoundarySignalMatch[] {
  const matches: BoundarySignalMatch[] = [];
  for (const rule of INFRASTRUCTURE_SIGNAL_RULES) {
    if (rule.pattern.test(content)) {
      matches.push({ kind: rule.kind, evidence: rule.description });
    }
  }
  if (
    matches.length === 0 &&
    !HAS_JSX_MARKUP_PATTERN.test(content) &&
    !HAS_SENTENCE_LIKE_STRING_LITERAL_PATTERN.test(content)
  ) {
    matches.push({
      kind: 'SHARED_RUNTIME',
      evidence: 'No JSX/rendering markup and no authored prose present in this file — it is non-visual structural/runtime code.',
    });
  }
  return matches;
}
