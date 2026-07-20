/**
 * AiDevEngine Universal App Blueprint v1.0 — contract-bound content derivation + provenance audit.
 *
 * Blueprint Generator Contract-Bound Replacement V1.
 *
 * Every string this module produces is mechanically derived from real, already-approved build-plan
 * data (the CBGA-repaired `appName`/`approvedModuleIds`, and — when present — the prompt-faithful
 * `customDomainCopy` that Production Generator Contract Consumption Fix V1 already made
 * contract-derived). Nothing here references a specific product domain: it only ever joins real
 * field values (app name, approved module display name) into a sentence — never a hardcoded
 * per-product phrase, never a guess, never a fallback to invented product content.
 *
 * This module also answers Phase 6's "template elimination audit" question for every blueprint
 * artifact: was this file's *visible copy* derived from the approved contract, or is it structural
 * shell infrastructure (auth flow, settings chrome, error/loading states, legal/help boilerplate)
 * that has no product-specific content to derive in the first place? Every artifact gets an
 * explicit, honest classification — never a silent default.
 */

export interface BlueprintContractDerivedCopy {
  /** Real app name (already CBGA-repaired upstream). Never invented here. */
  readonly appName: string;
  /** Landing/welcome summary — from customDomainCopy.headline, else built from the approved app name + primary approved module. */
  readonly landingSummary: string;
  /** Home dashboard summary — from customDomainCopy.dashboard, else built from the approved app name + primary approved module. */
  readonly homeSummary: string;
  /** Main feature nav label — the display name of the first approved module (never the literal "Features"). */
  readonly coreFeatureLabel: string;
  readonly source: 'CUSTOM_DOMAIN_COPY' | 'APPROVED_MODULE_PLAN' | 'APP_NAME_ONLY';
}

/** Minimal shape this module needs — avoids importing the full ProfileFeatureDefinition type. */
export interface BlueprintContractDerivationInput {
  readonly appName: string;
  readonly approvedModuleIds: readonly string[];
  readonly moduleDisplayNameOf: (moduleId: string) => string;
  readonly customDomainCopy?: {
    readonly headline?: string;
    readonly dashboard?: string;
  } | null;
}

/**
 * Derives blueprint landing/home copy + the main feature nav label from real approved build-plan
 * data. No hardcoded literal ever wins over real data; the only "default" path (APP_NAME_ONLY) is
 * a defensive floor for the case `approvedModuleIds` is empty, which the prompt-bounded
 * materialization guard already prevents from reaching this point in a real build.
 */
/**
 * System-shell / default-shell module ids must never become the blueprint's primary feature label.
 * When they do (e.g. short prompts that append `settings`/`dashboard`), coreFeatureLabel becomes
 * "Settings" and is emitted into shellPrimaryNavItems — triggering GPCA navigation bypass because
 * "Settings" is a CBGA default-shell label with no contract navigation approval.
 */
const NON_PRODUCT_PRIMARY_MODULE_IDS = new Set([
  'auth',
  'dashboard',
  'settings',
  'persistence',
  'registry',
  'routes',
]);

export function deriveBlueprintContractCopy(input: BlueprintContractDerivationInput): BlueprintContractDerivedCopy {
  const primaryModuleId =
    input.approvedModuleIds.find((moduleId) => !NON_PRODUCT_PRIMARY_MODULE_IDS.has(moduleId)) ?? null;
  const primaryModuleLabel = primaryModuleId ? input.moduleDisplayNameOf(primaryModuleId) : null;

  const coreFeatureLabel = primaryModuleLabel ?? input.appName;

  if (input.customDomainCopy?.headline || input.customDomainCopy?.dashboard) {
    return {
      appName: input.appName,
      landingSummary: input.customDomainCopy.headline ?? `${input.appName} — ${coreFeatureLabel}.`,
      homeSummary: input.customDomainCopy.dashboard ?? `${input.appName} — ${coreFeatureLabel}.`,
      coreFeatureLabel,
      source: 'CUSTOM_DOMAIN_COPY',
    };
  }

  if (primaryModuleLabel) {
    return {
      appName: input.appName,
      landingSummary: `${input.appName} — manage ${primaryModuleLabel} and connected workflows.`,
      homeSummary: `Your ${input.appName} workspace is ready. Start with ${primaryModuleLabel}.`,
      coreFeatureLabel,
      source: 'APPROVED_MODULE_PLAN',
    };
  }

  return {
    appName: input.appName,
    landingSummary: `${input.appName}.`,
    homeSummary: `${input.appName} is ready.`,
    coreFeatureLabel,
    source: 'APP_NAME_ONLY',
  };
}

export type BlueprintArtifactProvenanceKind =
  | 'CONTRACT_DERIVED'
  | 'STRUCTURAL_SHELL_INFRA';

export interface BlueprintArtifactProvenance {
  readonly relativePath: string;
  readonly kind: BlueprintArtifactProvenanceKind;
  /** Which real field(s) this artifact's visible copy is derived from, or why it has no product-specific content to derive. */
  readonly reason: string;
}

/**
 * Phase 6 — template elimination audit. Every blueprint artifact gets one explicit,
 * non-fabricated classification: either its visible copy is derived from the approved contract
 * (appName / approved module plan / customDomainCopy), or it is honestly structural shell
 * infrastructure with no product-specific content to bind to a contract (auth mechanics, generic
 * settings chrome, legal/help boilerplate, loading/error/empty states, placeholders). Nothing is
 * silently labelled "template", "fallback", or "default" — every classification states its reason.
 */
export const UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE: readonly BlueprintArtifactProvenance[] = [
  { relativePath: 'src/App.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Phase-transition wiring (launch/welcome/auth/onboarding/shell) between structural screens; carries no product-specific copy of its own.' },
  { relativePath: 'src/App.css', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Pure visual styling (layout/colors/spacing); no product-specific text content.' },
  { relativePath: 'src/blueprint/app-metadata.ts', kind: 'CONTRACT_DERIVED', reason: 'APP_NAME + tagline from the approved build plan.' },
  { relativePath: 'src/blueprint/product-surface.ts', kind: 'CONTRACT_DERIVED', reason: 'Blueprint Content Decomposition V1 — every shell/home-dashboard visible string (nav labels, action labels, headings, card copy) computed from the approved appName, CBGA-approved primary module label, contract-derived home summary, and CBGA\'s own recognized default-shell navigation vocabulary; see BLUEPRINT_PRODUCT_SURFACE_PROVENANCE for the per-field origin.' },
  { relativePath: 'src/blueprint/LaunchScreen.tsx', kind: 'CONTRACT_DERIVED', reason: 'Renders the approved appName/tagline verbatim; no independent copy.' },
  { relativePath: 'src/blueprint/WelcomeScreen.tsx', kind: 'CONTRACT_DERIVED', reason: 'Landing summary derived from customDomainCopy.headline or the approved appName + primary approved module.' },
  { relativePath: 'src/blueprint/AuthScreen.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Authentication mechanics (guest/email/social sign-in) have no product-specific concept to derive from any contract.' },
  { relativePath: 'src/blueprint/OnboardingScreen.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic first-run orientation steps; no product-specific concept to bind to the contract.' },
  { relativePath: 'src/blueprint/AppShell.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Blueprint Content Decomposition V1 — pure composition/routing/render-tree; every nav/action/aria-label it renders is injected from src/blueprint/product-surface.ts (never authored here). Primary feature nav label is the display name of the first CBGA-approved module, never the literal "Features".' },
  { relativePath: 'src/blueprint/pages/HomePage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Blueprint Content Decomposition V1 — pure render target; every heading/card-title/list-item/button-label it renders is injected from src/blueprint/product-surface.ts (never authored here). Dashboard summary derived from customDomainCopy.dashboard or the approved appName + primary approved module.' },
  { relativePath: 'src/blueprint/pages/SearchPage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic search mechanics; no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/NotificationsPage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic notification-center mechanics; no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/ProfilePage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic account/profile chrome; no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/SettingsPage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic app preferences (language/theme/notifications); no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/HelpCenterPage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic support chrome; no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/FeedbackPage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic feedback form; no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/LegalPage.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic legal boilerplate; no product-specific concept to derive.' },
  { relativePath: 'src/blueprint/pages/AboutPage.tsx', kind: 'CONTRACT_DERIVED', reason: 'Renders the approved appName verbatim; no independent copy.' },
  { relativePath: 'src/blueprint/components/EmptyState.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic, reusable UI primitive — caller supplies all copy as props; component itself has no fixed text.' },
  { relativePath: 'src/blueprint/components/ErrorState.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic, reusable UI primitive — caller supplies all copy as props; component itself has no fixed text.' },
  { relativePath: 'src/blueprint/components/LoadingState.tsx', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic, reusable UI primitive — caller supplies all copy as props; component itself has no fixed text.' },
  { relativePath: 'src/blueprint/components/UniversalAiAssistant.tsx', kind: 'CONTRACT_DERIVED', reason: 'Renders the approved appName verbatim in its own heading.' },
  { relativePath: 'src/auth/auth-config.ts', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Authentication mode constants; no product-specific concept to derive.' },
  { relativePath: 'src/analytics/analytics-placeholders.ts', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Disabled-by-default instrumentation placeholders; no product-specific concept to derive.' },
  { relativePath: 'src/security/security-placeholders.ts', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Cross-cutting security-feature placeholders; no product-specific concept to derive.' },
  { relativePath: 'src/monetization/monetization-placeholders.ts', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Disabled-by-default monetization placeholders; no product-specific concept to derive.' },
  { relativePath: 'src/data/data-management-placeholders.ts', kind: 'STRUCTURAL_SHELL_INFRA', reason: 'Generic export/delete/backup placeholders; no product-specific concept to derive.' },
  { relativePath: 'blueprint-manifest.json', kind: 'CONTRACT_DERIVED', reason: 'Records this build\'s real appName/contractId/ideaId plus the contract-derivation source actually used.' },
];

export function findArtifactProvenance(relativePath: string): BlueprintArtifactProvenance | null {
  return UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE.find((p) => p.relativePath === relativePath) ?? null;
}

export interface BlueprintTemplateEliminationAuditReport {
  readonly generatedAt: string;
  readonly totalArtifacts: number;
  readonly contractDerivedCount: number;
  readonly structuralShellInfraCount: number;
  /** Any real generated artifact with NO provenance entry at all — Phase 6 requires this to always be empty. */
  readonly unclassifiedArtifacts: readonly string[];
  readonly rows: ReadonlyArray<{ relativePath: string; classification: BlueprintArtifactProvenanceKind | 'UNCLASSIFIED'; reason: string }>;
}

/**
 * Phase 6 — production audit. Given the real relative paths a build actually generated (never a
 * guessed or fixed list), cross-references every one against the honest provenance registry above.
 * `unclassifiedArtifacts` is the enforcement signal: if a future change to the blueprint generator
 * adds a new file without also adding its provenance entry, this audit reports it explicitly
 * instead of silently treating it as compliant.
 */
export function runBlueprintTemplateEliminationAudit(
  generatedRelativePaths: readonly string[],
): BlueprintTemplateEliminationAuditReport {
  const rows = generatedRelativePaths.map((relativePath) => {
    const provenance = findArtifactProvenance(relativePath);
    return {
      relativePath,
      classification: provenance?.kind ?? ('UNCLASSIFIED' as const),
      reason: provenance?.reason ?? 'No provenance entry registered for this generated artifact.',
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalArtifacts: rows.length,
    contractDerivedCount: rows.filter((r) => r.classification === 'CONTRACT_DERIVED').length,
    structuralShellInfraCount: rows.filter((r) => r.classification === 'STRUCTURAL_SHELL_INFRA').length,
    unclassifiedArtifacts: rows.filter((r) => r.classification === 'UNCLASSIFIED').map((r) => r.relativePath),
    rows,
  };
}
