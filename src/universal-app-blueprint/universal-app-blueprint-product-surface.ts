/**
 * AiDevEngine Universal App Blueprint v1.0 — Blueprint Content Decomposition V1 +
 * Contract-Bound Navigation Shell Fix V1.
 *
 * This module is the dedicated "product surface generator" Phase 4 of Blueprint Content
 * Decomposition V1 requires. Its entire job is to compute every visible string the application
 * shell (`AppShell.tsx`) and the home dashboard (`pages/HomePage.tsx`) render, together with an
 * honest per-string provenance tag, so those two files can stop authoring literal business copy
 * themselves and instead become pure injection targets (Phase 5) that only ever render a value
 * this module already computed.
 *
 * Every value below is built exclusively from real, already-approved inputs already flowing
 * through this generator today — the CBGA-repaired `appName`, the CBGA-approved primary module's
 * display name (`coreFeatureLabel`), the contract-derived home summary
 * (`deriveBlueprintContractCopy`'s `homeSummary`), and CBGA's own recognized generic-shell
 * navigation vocabulary (`CBGA_DEFAULT_SHELL_NAVIGATION_LABELS`). Nothing here invents a new
 * per-application phrase, references any specific product domain, or special-cases any
 * application — the same five fields are computed identically for every build.
 *
 * Contract-Bound Navigation Shell Fix V1 — this module previously emitted every CBGA-recognized
 * default-shell label (Activity/Alerts/Profile/Settings/Help/Feedback/Legal) UNCONDITIONALLY,
 * regardless of whether the approved canonical contract / CBGA navigation plan actually supported
 * them. That is exactly the generic default-shell navigation injection GPCA's own
 * `detectHardcodedNavigationLabels` / `CBGA_DEFAULT_SHELL_NAVIGATION_LABELS` check exists to catch
 * — this module was, until this fix, itself the unapproved-navigation source. Every default-shell
 * label is now gated behind `approvedNavigationLabels` (the CBGA-approved navigation plan, i.e.
 * `CbgaGenerationReport.navigationPlan` — items that map directly to a contract-bound module/
 * route) which the caller passes in from the real, already-computed CBGA report. A default-shell
 * label appears ONLY when it is present (case-insensitively) in that approved list; when the list
 * is empty or omitted (no CBGA context available to the caller), NONE of the seven default-shell
 * labels are emitted — the safe, generic default. `coreFeatureLabel` is never gated: it is not a
 * default-shell label at all, it is the CBGA-approved primary module's own display name, already
 * contract-derived on its own.
 *
 * Contract-Bound Root Navigation Authority V1 — the root/"Home" entry point was, until this fix,
 * emitted as an ordinary `shellPrimaryNavItems` entry, indistinguishable from real product
 * navigation. It has no CBGA navigation-plan entry (it is not a business concept — every build's
 * root landing surface is the same structural responsibility, never a per-application concern), so
 * GPCA's contract-navigation-traceability check correctly had no way to prove its ancestry and
 * blocked the build. The fix is not to fabricate a CBGA entry for it or to weaken traceability — it
 * is to stop presenting it as product navigation at all. It is now `rootNavigationSurface`, a
 * dedicated `InfrastructureNavigationItem` (kind `ROOT_SURFACE`) never mixed into
 * `shellPrimaryNavItems`/`shellSecondaryNavItems`. GPCA's rendered-content extraction recognizes
 * this exact structural shape (`{ kind: 'ROOT_SURFACE', ... label: ... }`) and excludes its label
 * from the product-navigation set entirely — it is Blueprint-Infrastructure-owned, never
 * CBGA-owned, and never enters GPCA's contract-navigation comparison.
 */

import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { InfrastructureNavigationItem } from '../infrastructure-product-boundary-authority-v1/infrastructure-navigation-model.js';
import {
  dashboardActivityItemsFromApprovedSampleDataPlan,
  emptyStateForSurface,
} from '../contract-bound-generation-authority-v4/approved-sample-data-plan.js';

/**
 * Phase 6 — the only six origins any visible blueprint string may ever be attributed to.
 *   PRODUCT_CONTRACT            — the approved product contract's own identity/copy fields.
 *   CBGA                        — CBGA's own recognized generic-shell navigation vocabulary.
 *   PROMPT_BOUNDED_MODULE_PLAN  — the CBGA-approved module plan's module display names.
 *   ARCHITECTURE                — the blueprint's own structural section/chrome layout (a fixed
 *                                 part of how this generator organizes the shell/dashboard, not a
 *                                 per-application invented phrase).
 *   UNIVERSAL_FEATURE_CONTRACT  — reserved for future fields sourced from the Universal Feature
 *                                 Contract; not used by the fields this module computes today.
 *   BLUEPRINT_INFRASTRUCTURE    — Contract-Bound Root Navigation Authority V1: structural metadata
 *                                 owned by the Blueprint Infrastructure Layer, never the canonical
 *                                 contract/CBGA — e.g. the root-landing-surface entry point. Never
 *                                 gated by, or compared against, CBGA's navigation plan.
 */
export type BlueprintContentOrigin =
  | 'PRODUCT_CONTRACT'
  | 'CBGA'
  | 'PROMPT_BOUNDED_MODULE_PLAN'
  | 'ARCHITECTURE'
  | 'UNIVERSAL_FEATURE_CONTRACT'
  | 'BLUEPRINT_INFRASTRUCTURE';

export interface BlueprintProductSurfaceNavItem {
  readonly id: string;
  readonly label: string;
}

export interface BlueprintProductSurfaceContent {
  readonly coreFeatureLabel: string;
  /**
   * Contract-Bound Root Navigation Authority V1 — the root/landing entry point. A dedicated
   * `InfrastructureNavigationItem` (kind `ROOT_SURFACE`), never a `BlueprintProductSurfaceNavItem`
   * and never mixed into `shellPrimaryNavItems`/`shellSecondaryNavItems` — it is Blueprint
   * Infrastructure Layer content, not a CBGA-owned business navigation concept, and must never be
   * compared against CBGA's navigation plan.
   */
  readonly rootNavigationSurface: InfrastructureNavigationItem;
  readonly shellPrimaryNavItems: readonly BlueprintProductSurfaceNavItem[];
  readonly shellSecondaryNavItems: readonly BlueprintProductSurfaceNavItem[];
  readonly shellSearchActionLabel: string;
  readonly shellNotificationsActionLabel: string;
  /**
   * Contract-Bound Navigation Shell Fix V1 — "Profile" is a CBGA default-shell label. `null` when
   * not CBGA-approved: `AppShell.tsx` must not render the topbar profile action button at all in
   * that case (infrastructure may provide the slot/handler, never the business label itself).
   */
  readonly shellProfileActionLabel: string | null;
  readonly shellMainNavigationAriaLabel: string;
  readonly shellMobileNavigationAriaLabel: string;
  readonly homeWelcomeHeading: string;
  readonly homeInsightsHeading: string;
  readonly homeSubtitle: string;
  readonly homeQuickActionsTitle: string;
  readonly homeOpenActionPrefix: string;
  readonly homeSearchActionLabel: string;
  readonly homeRecentActivityTitle: string;
  readonly homeRecentActivityItems: readonly string[];
  readonly homeRecentActivityEmptyTitle: string;
  readonly homeRecentActivityEmptyMessage: string;
  readonly homeInsightsTitle: string;
  readonly homeInsightsBody: string;
  readonly homeRecommendationsTitle: string;
  readonly homeRecommendationsBody: string;
}

export type BlueprintProductSurfaceProvenance = {
  readonly [K in keyof BlueprintProductSurfaceContent]: BlueprintContentOrigin;
};

export interface BlueprintProductSurface {
  readonly content: BlueprintProductSurfaceContent;
  readonly provenance: BlueprintProductSurfaceProvenance;
}

export interface BlueprintProductSurfaceInput {
  readonly appName: string;
  readonly coreFeatureLabel: string;
  readonly homeSummary: string;
  readonly contractDerivationSource: 'CUSTOM_DOMAIN_COPY' | 'APPROVED_MODULE_PLAN' | 'APP_NAME_ONLY';
  /**
   * Contract-Bound Navigation Shell Fix V1 — the CBGA-approved navigation plan's own labels
   * (`CbgaGenerationReport.navigationPlan.map(item => item.label)`), i.e. navigation items that
   * already map to a contract-bound module/route. A default-shell label (Activity/Alerts/Profile/
   * Settings/Help/Feedback/Legal) is only ever emitted below when it appears in this list.
   * Omitted/empty is the safe default: zero default-shell labels are emitted.
   */
  readonly approvedNavigationLabels?: readonly string[];
  /**
   * Sample Data Computation Collapse V1 — the CBGA-composed approved sample data plan for this
   * build. When supplied, dashboard recent-activity items are projected from
   * `ApprovedSampleDataPlan.dashboardCards` — never independently synthesized.
   */
  readonly approvedSampleDataPlan?: import('../contract-bound-generation-authority-v4/approved-sample-data-plan.js').ApprovedSampleDataPlan | null;
}

function shellLabel(label: string): string {
  if (!CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.some((known) => known.toLowerCase() === label.toLowerCase())) {
    throw new Error(`buildBlueprintProductSurface: "${label}" is not a CBGA-recognized default-shell label.`);
  }
  return label;
}

/**
 * Returns `label` (a known CBGA default-shell label) only when it is present, case-insensitively,
 * in `approvedNavigationLabels` — the real CBGA-approved navigation plan for this build. Never
 * invents approval, never special-cases a label or application: the same lookup for every label.
 */
function approvedShellLabel(
  label: string,
  approvedNavigationLabels: readonly string[],
): string | null {
  const checked = shellLabel(label);
  const isApproved = approvedNavigationLabels.some(
    (approved) => approved.trim().toLowerCase() === checked.toLowerCase(),
  );
  return isApproved ? checked : null;
}

/** Maps `deriveBlueprintContractCopy`'s own honest `source` field onto one of the five Phase 6 origins. */
function homeSubtitleOrigin(source: BlueprintProductSurfaceInput['contractDerivationSource']): BlueprintContentOrigin {
  return source === 'APPROVED_MODULE_PLAN' ? 'PROMPT_BOUNDED_MODULE_PLAN' : 'PRODUCT_CONTRACT';
}

/**
 * Phase 4 — builds every visible shell/home-dashboard string plus its provenance from real,
 * already-approved inputs. Called once per build by `buildUniversalBlueprintWorkspaceFiles` and
 * emitted as a real generated file (`src/blueprint/product-surface.ts`) that `AppShell.tsx` and
 * `pages/HomePage.tsx` import — they never author any of these strings themselves (Phase 5).
 */
export function buildBlueprintProductSurface(input: BlueprintProductSurfaceInput): BlueprintProductSurface {
  const { appName, coreFeatureLabel, homeSummary, contractDerivationSource } = input;
  const approvedNavigationLabels = input.approvedNavigationLabels ?? [];

  // Contract-Bound Navigation Shell Fix V1 — every CBGA default-shell label (Activity/Alerts/
  // Profile/Settings/Help/Feedback/Legal) is included ONLY when `approvedNavigationLabels` (the
  // real CBGA navigation plan for this build) already contains it. `coreFeatureLabel` is normally
  // always-legitimate contract-derived navigation — but when it collides with a default-shell
  // label (e.g. "Settings" from a system-shell module incorrectly selected as primary), it must
  // be gated the same way, otherwise GPCA fires COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS.
  const primaryShellCandidates: ReadonlyArray<{ id: string; shellLabelName: string }> = [
    { id: 'activity', shellLabelName: 'Activity' },
    { id: 'notifications', shellLabelName: 'Alerts' },
    { id: 'profile', shellLabelName: 'Profile' },
  ];
  const secondaryShellCandidates: ReadonlyArray<{ id: string; shellLabelName: string }> = [
    { id: 'settings', shellLabelName: 'Settings' },
    { id: 'help', shellLabelName: 'Help' },
    { id: 'feedback', shellLabelName: 'Feedback' },
    { id: 'legal', shellLabelName: 'Legal' },
  ];

  // Contract-Bound Root Navigation Authority V1 — the root/landing entry point is Blueprint
  // Infrastructure Layer content, never product navigation: it is never a CBGA navigation-plan
  // entry, never gated by `approvedNavigationLabels`, and never mixed into `shellPrimaryNavItems`.
  const rootNavigationSurface: InfrastructureNavigationItem = { kind: 'ROOT_SURFACE', id: 'home', label: 'Home' };

  const coreCollidesWithDefaultShell = CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.some(
    (label) => label.toLowerCase() === coreFeatureLabel.trim().toLowerCase(),
  );
  const shellPrimaryNavItems: BlueprintProductSurfaceNavItem[] = [];
  if (!coreCollidesWithDefaultShell) {
    shellPrimaryNavItems.push({ id: 'core', label: coreFeatureLabel });
  } else {
    const approvedCore = approvedShellLabel(coreFeatureLabel, approvedNavigationLabels);
    if (approvedCore) shellPrimaryNavItems.push({ id: 'core', label: approvedCore });
  }
  for (const candidate of primaryShellCandidates) {
    const approved = approvedShellLabel(candidate.shellLabelName, approvedNavigationLabels);
    if (approved) shellPrimaryNavItems.push({ id: candidate.id, label: approved });
  }

  const shellSecondaryNavItems: BlueprintProductSurfaceNavItem[] = [];
  for (const candidate of secondaryShellCandidates) {
    const approved = approvedShellLabel(candidate.shellLabelName, approvedNavigationLabels);
    if (approved) shellSecondaryNavItems.push({ id: candidate.id, label: approved });
  }

  const samplePlan = input.approvedSampleDataPlan ?? null;
  const homeRecentActivityItems = samplePlan
    ? dashboardActivityItemsFromApprovedSampleDataPlan(samplePlan)
    : [];
  const dashboardEmptyState = samplePlan
    ? emptyStateForSurface(samplePlan, 'DASHBOARD_RECENT_ACTIVITY')
    : null;

  const content: BlueprintProductSurfaceContent = {
    coreFeatureLabel,
    rootNavigationSurface,
    shellPrimaryNavItems,
    shellSecondaryNavItems,
    shellSearchActionLabel: 'Search',
    shellNotificationsActionLabel: 'Notifications',
    shellProfileActionLabel: approvedShellLabel('Profile', approvedNavigationLabels),
    shellMainNavigationAriaLabel: 'Main navigation',
    shellMobileNavigationAriaLabel: 'Mobile navigation',
    homeWelcomeHeading: 'Welcome back',
    homeInsightsHeading: 'Activity & insights',
    homeSubtitle: homeSummary,
    homeQuickActionsTitle: 'Quick actions',
    homeOpenActionPrefix: 'Open',
    homeSearchActionLabel: 'Search',
    homeRecentActivityTitle: 'Recent activity',
    homeRecentActivityItems,
    homeRecentActivityEmptyTitle: dashboardEmptyState?.title ?? 'No recent activity',
    homeRecentActivityEmptyMessage:
      dashboardEmptyState?.message ?? 'Activity from approved modules will appear here once records exist.',
    homeInsightsTitle: 'Insights',
    homeInsightsBody: `Start with ${coreFeatureLabel} to explore generated modules.`,
    homeRecommendationsTitle: 'Recommendations',
    homeRecommendationsBody: `Review recent ${coreFeatureLabel} activity and open the next recommended module.`,
  };

  const provenance: BlueprintProductSurfaceProvenance = {
    coreFeatureLabel: 'PROMPT_BOUNDED_MODULE_PLAN',
    rootNavigationSurface: 'BLUEPRINT_INFRASTRUCTURE',
    shellPrimaryNavItems: 'CBGA',
    shellSecondaryNavItems: 'CBGA',
    shellSearchActionLabel: 'ARCHITECTURE',
    shellNotificationsActionLabel: 'ARCHITECTURE',
    shellProfileActionLabel: 'CBGA',
    shellMainNavigationAriaLabel: 'ARCHITECTURE',
    shellMobileNavigationAriaLabel: 'ARCHITECTURE',
    homeWelcomeHeading: 'ARCHITECTURE',
    homeInsightsHeading: 'ARCHITECTURE',
    homeSubtitle: homeSubtitleOrigin(contractDerivationSource),
    homeQuickActionsTitle: 'ARCHITECTURE',
    homeOpenActionPrefix: 'ARCHITECTURE',
    homeSearchActionLabel: 'ARCHITECTURE',
    homeRecentActivityTitle: 'ARCHITECTURE',
    homeRecentActivityItems: samplePlan ? 'CBGA' : 'ARCHITECTURE',
    homeRecentActivityEmptyTitle: samplePlan ? 'CBGA' : 'ARCHITECTURE',
    homeRecentActivityEmptyMessage: samplePlan ? 'CBGA' : 'ARCHITECTURE',
    homeInsightsTitle: 'ARCHITECTURE',
    homeInsightsBody: 'PROMPT_BOUNDED_MODULE_PLAN',
    homeRecommendationsTitle: 'ARCHITECTURE',
    homeRecommendationsBody: 'PROMPT_BOUNDED_MODULE_PLAN',
  };

  return { content, provenance };
}

/**
 * Renders a value as an idiomatic TS object literal (unquoted identifier keys) rather than raw
 * JSON. This is not cosmetic: GPCA's rendered-content evidence collector (`extractNavigationLabels`
 * / `extractQuotedFieldValues`) scans generated source for the TS/JSX field pattern `label: "..."`,
 * not the JSON pattern `"label": "..."`. Emitting real TS object syntax here — instead of
 * `JSON.stringify` — is what makes this file's actual navigation labels honestly visible to GPCA's
 * evidence collection, so contract-bound navigation evidence reflects what this build really emits.
 * Only object keys that are valid, unquoted JS identifiers are unquoted; values are untouched.
 */
function toTsObjectLiteral(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  return json.replace(/([{,]\s*)"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1$2:');
}

/**
 * Emits `src/blueprint/product-surface.ts` — the one real generated file `AppShell.tsx` and
 * `pages/HomePage.tsx` import for every visible string they render. Plain data (no JSX, no
 * structural/runtime constructs of its own), so it is honestly a PRODUCT artifact — the same
 * category `app-metadata.ts` already occupies — never claimed to be infrastructure.
 */
export function buildBlueprintProductSurfaceTs(surface: BlueprintProductSurface): string {
  return `/**
 * Blueprint Content Decomposition V1 — contract-derived product surface.
 *
 * Every visible string below is computed by buildBlueprintProductSurface() from this build's real
 * approved appName / CBGA-approved primary module display name / contract-derived home summary /
 * CBGA's own recognized generic-shell navigation vocabulary — never authored here, never a literal
 * a screen or shell component invented on its own. See BLUEPRINT_PRODUCT_SURFACE_PROVENANCE for the
 * origin of every individual field (PRODUCT_CONTRACT / CBGA / PROMPT_BOUNDED_MODULE_PLAN /
 * ARCHITECTURE / UNIVERSAL_FEATURE_CONTRACT).
 */
export const BLUEPRINT_PRODUCT_SURFACE = ${toTsObjectLiteral(surface.content)} as const;

export const BLUEPRINT_PRODUCT_SURFACE_PROVENANCE = ${toTsObjectLiteral(surface.provenance)} as const;
`;
}
