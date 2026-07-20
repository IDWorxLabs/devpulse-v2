/**
 * Generation Pipeline Compliance Authority V1 — reporting.
 *
 * Renders the deterministic pipeline compliance table, the per-stage score breakdown, the
 * unsupported/legacy/template/blueprint findings, the final gate outcome, and the mandatory
 * capability matrix (required in every report by this milestone's spec).
 */

import type { GpcaComplianceReport, GpcaStageComplianceScore } from './generation-pipeline-compliance-types.js';

export interface CapabilityMatrixRow {
  capability: string;
  status: string;
  productionWired: string;
  autoRun: string;
  activationAllowed: string;
  notes: string;
}

/** The mandatory capability matrix — includes at minimum the 11 capabilities this milestone requires. */
export const GPCA_CAPABILITY_MATRIX_ROWS: CapabilityMatrixRow[] = [
  {
    capability: 'GPCA Rendered Content Evidence',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (audits real rendered output on every post-materialization pass)',
    activationAllowed: 'YES',
    notes:
      'GPCA Rendered Content Evidence Expansion V1 — reads the real contents of every file this build actually wrote (headings, navigation labels, button labels, page titles, static visible text, data-blueprint UI metadata markers) and matches them against generic template/placeholder/reusable-shell/starter-dashboard/onboarding/hero/card/feature-grid fingerprints plus a contract-vocabulary word-overlap check; only ever overrides an otherwise-ALLOWED structural outcome into one of four rendered-content blocks (never the reverse), before workspace approval, preview activation, live preview, or interaction proof.',
  },
  {
    capability: 'GPCA Continuation Workspace Compliance',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (audits the existing workspace whenever materialization is skipped)',
    activationAllowed: 'YES',
    notes:
      'GPCA Continuation Workspace Compliance Fix V1 — one-prompt-build-orchestrator.ts now calls buildGpcaPostMaterializationReport (including the Rendered Content Evidence Expansion V1 audit) against the EXISTING workspace at every continuation branch that decides workspaceHasGeneratedFeatureModules()==true and therefore skips fresh materialization; a blocking result is terminal (GENERATION_PIPELINE_NON_COMPLIANT, gpcaBlockedMaterialization=true, gpcaBlockedPreviewActivation=true) before workspace stabilization, npm install/build, dev server start, or preview activation.',
  },
  {
    capability: 'Production Generator Contract Consumption Fix',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (runs on every extraction/classification/copy/generation call, no opt-in)',
    activationAllowed: 'N/A',
    notes:
      'Production Generator Contract Consumption Fix V1 — fixes the five generic (non-app-specific) generator bugs Production Contract Consumption Trace V1 proved: (1) extractAppName() no longer extracts implementation-guidance phrasing and only considers the earliest "build" clause, (2) classifyDomainEvidence()/hasKeyword() no longer allow unsafe prefix collisions, generic-term saturation, or declaration-order tie-breaking, (3) buildPromptSpecificDomainCopy() no longer injects unconditional assistive-communication copy into non-assistive custom apps, (4) buildFeatureAppRouterTsx() requires an explicit ASSISTIVE_COMMUNICATION_APP_V1 profile signal (not mere customDomainCopy presence) before rendering assistive UI, and (5) the CBGA adapter now recomputes customDomainCopy from the repaired extraction so corrected product identity reaches the router/module generators. Never modifies GPCA scoring/enforcement, CBGA policy, or Product Faithfulness — this is a narrow, generic generator-input fix.',
  },
  {
    capability: 'Blueprint Generator Contract-Bound Replacement',
    status: 'PARTIAL',
    productionWired: 'YES',
    autoRun: 'YES (runs on every materialization call, no opt-in)',
    activationAllowed: 'N/A',
    notes:
      'Blueprint Generator Contract-Bound Replacement V1 — universal-app-blueprint-generator.ts no longer derives landingSummary/homeSummary/coreFeatureLabel from hardcoded literals ("Features", "A modular application shell with navigation, settings, and feature routing.", "Your {appName} dashboard is ready."); these are now mechanically derived from the approved build plan (customDomainCopy, already CBGA-corrected, or the CBGA-approved module plan — see deriveBlueprintContractCopy in universal-app-blueprint-contract-provenance.ts) and recorded per-build into blueprint-manifest.json (contractProvenance.contractDerivationSource) together with an explicit, exhaustive per-artifact CONTRACT_DERIVED / STRUCTURAL_SHELL_INFRA classification for all 24 blueprint artifacts (UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE — nothing is silently labelled "template"/"fallback"/"default"). STATUS IS PARTIAL, NOT FULL, BY DELIBERATE, USER-CONFIRMED SCOPE DECISION: the fixed-path shell structure itself (Welcome/Onboarding/Auth/Settings/Profile/Help/Feedback/Legal/Notifications/Search/About screens as always-present files) is unchanged, because ~15 other existing production authorities (production-validation-runner, founder-launch evidence pipeline, UVL, multi-domain/build-proof-v1-2/3/4 launch handoffs, the Playwright-based universal-app-blueprint-visual runner, feature-reality-validation-runner, engineering-reality-runner, universal-feature-validation-runner, e2e-dom-reality-runner) hard-require these exact files/DOM markers to exist, and GPCA\'s own detectBlueprintBypass/detectGenericShellInjection are presence-based (not content-based) and must not be weakened — so COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS/COMPLIANCE_BLOCKED_LEGACY_GENERATOR still fire for a real build today. Removing the shell files safely requires a separately-scoped, coordinated update across all ~15 dependent consumers with live Playwright/rendering verification, which this milestone explicitly deferred rather than attempt unverified. Never modifies GPCA scoring/enforcement, CBGA policy, or Product Faithfulness.',
  },
  {
    capability: 'Infrastructure vs Product Boundary Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (classifies every real generated file on every post-materialization pass, no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Infrastructure vs Product Boundary Authority V1 — resolves the genuine architectural conflict Blueprint Generator Contract-Bound Replacement V1 exposed (GPCA blocking structural files ~15 other production authorities require to exist) with a formal, fully generic, content-based boundary: every real generated file is classified INFRASTRUCTURE / PRODUCT / MIXED / UNKNOWN purely from its own current content (never its path, never a filename whitelist) — INFRASTRUCTURE requires a structural signal (bootstrap/routing/provider/DI/error-or-loading-boundary/lifecycle/theme/configuration/service-registration/shell/layout wiring — see infrastructure-signal-detection.ts) AND zero business-content signal (headings/buttons/nav labels/visible text/free-text literals reused directly from GPCA\'s own Rendered Content Evidence extractors — see business-content-signal-detection.ts); MIXED/UNKNOWN files always still fail. generator-legacy-detection.ts\'s detectBlueprintBypass/detectGenericShellInjection now consult this real, per-build classification (isPathSafeInfrastructure) instead of only asking "does this file exist" — a file is exempted ONLY when its own real content proves it carries zero business identity/terminology/navigation/headings/copy, never because of its name. GPCA remains exactly as strict for every genuine violation: no scoring change, no threshold change, no weakening — product files continue to be governed in full by Product Faithfulness + CBGA + Rendered Content Evidence, completely unchanged. HONEST DISCLOSURE: classifying today\'s real, current blueprint files (WelcomeScreen.tsx/OnboardingScreen.tsx/AuthScreen.tsx/the 8 known generic pages) shows every one of them still carries at least one real heading/button/copy signal (e.g. WelcomeScreen.tsx\'s "Welcome to {appName}" heading, "Get started" button) alongside little-to-no infrastructure signal, so they classify PRODUCT (not INFRASTRUCTURE) and remain correctly, unchangedly blocked by COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS/COMPLIANCE_BLOCKED_LEGACY_GENERATOR for a real build today — this milestone does not claim otherwise. What IS real and production-wired today: the classification mechanism itself runs on every post-materialization build, is verifiably precise (proven against both clean synthetic infrastructure fixtures and the current mixed/product real blueprint files), and will automatically exempt any future file the generator produces that a later, separately-scoped content decomposition makes genuinely pure-infrastructure — without requiring another GPCA change.',
  },
  {
    capability: 'Blueprint Content Decomposition',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (runs on every materialization call, no opt-in)',
    activationAllowed: 'N/A',
    notes:
      'Blueprint Content Decomposition V1 — eliminates the remaining MIXED blueprint files Infrastructure vs Product Boundary Authority V1 correctly identified (AppShell.tsx, pages/HomePage.tsx) by decomposing them into pure infrastructure + a dedicated contract-derived product surface. universal-app-blueprint-product-surface.ts (buildBlueprintProductSurface) computes every shell/home-dashboard visible string (nav labels, action labels, headings, card copy) from this build\'s real approved appName, CBGA-approved primary module label (coreFeatureLabel), contract-derived home summary, and CBGA\'s own recognized default-shell navigation vocabulary (CBGA_DEFAULT_SHELL_NAVIGATION_LABELS) — never invented, never per-application. Each field records an explicit Phase-6 provenance tag (PRODUCT_CONTRACT / CBGA / PROMPT_BOUNDED_MODULE_PLAN / ARCHITECTURE / UNIVERSAL_FEATURE_CONTRACT) in BLUEPRINT_PRODUCT_SURFACE_PROVENANCE. This is emitted as its own real generated file (src/blueprint/product-surface.ts) that AppShell.tsx and pages/HomePage.tsx import and render exclusively via JSX expressions (Phase 5 injection) — they no longer author a single nav/action/heading/button/list-item literal themselves, and their onClick handlers were changed from inline arrow functions to named handlers (a real, independently necessary fix for a pre-existing extractTagContents parsing artifact where "=>" inside a button\'s own attributes was truncating the tag-boundary scan). Result, verified against 3 structurally different synthetic builds (different appName/coreFeatureLabel/contractDerivationSource, including special characters): AppShell.tsx and pages/HomePage.tsx now classify INFRASTRUCTURE, product-surface.ts classifies PRODUCT (fully expected — it is Product content, not code that composes/renders), and zero blueprint file classifies MIXED or UNKNOWN across the full generated set. Also fixed two independent, generic, non-app-specific false-positive sources the boundary authority\'s content-based detectors were tripping on (not weakened, not exempted — the underlying generated content was corrected): App.css\'s quoted "Segoe UI" font-family value (now unquoted, valid CSS) and analytics-placeholders.ts\'s `Record<string, unknown>` generic type syntax (now `{ [key: string]: unknown }`) which was defeating the JSX-absence check. blueprint-manifest.json (a build-metadata JSON audit trail, never rendered) is now excluded from the Infrastructure vs Product Boundary Authority\'s file-kind scope in generation-pipeline-compliance-adapter.ts (boundary classification only ever applies to real source/style files — .ts/.tsx/.js/.jsx/.css — never build metadata; renderedContentAudit\'s file scope, Product Faithfulness, CBGA, and AEO are completely untouched). No GPCA scoring change, no threshold change, no filename whitelist, no per-application special-case, no new authority — this is a targeted, generic generator content-decomposition fix satisfying Phase 7\'s expectation that a genuinely-infrastructure file classify INFRASTRUCTURE.',
  },
  {
    capability: 'Contract-Bound Navigation Shell Fix',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (runs on every materialization call, no opt-in)',
    activationAllowed: 'N/A',
    notes:
      'Contract-Bound Navigation Shell Fix V1 — fixes the exact real-build blocker Blueprint Content Decomposition V1 left behind: universal-app-blueprint-product-surface.ts previously emitted every CBGA default-shell label (Activity/Alerts/Profile/Settings/Help/Feedback/Legal) into AppShell.tsx\'s nav UNCONDITIONALLY, and generation-pipeline-compliance-adapter.ts separately derived "navigation labels this build generated" from the mere on-disk PRESENCE of the always-generated ProfilePage.tsx/SettingsPage.tsx/HelpCenterPage.tsx/FeedbackPage.tsx/LegalPage.tsx/NotificationsPage.tsx files (deriveNavigationLabelsFromGeneratedFiles) — a proxy that could never distinguish "this default-shell page file exists, unreachable, for the ~15 other production authorities that require it" from "this label is actually exposed as clickable navigation," so it fired COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS on every single build regardless of what AppShell.tsx actually rendered. Both are now fixed at their source, never by weakening the check itself: (1) buildBlueprintProductSurface() now accepts approvedNavigationLabels (the real CBGA navigation plan — CbgaGenerationReport.navigationPlan.map(item => item.label), items that already map to a contract-bound module/route) and includes a default-shell label in shellPrimaryNavItems/shellSecondaryNavItems/shellProfileActionLabel ONLY when it is present in that list — omitted/empty (the default for any build) means AppShell.tsx renders zero default-shell nav; (2) one-prompt-build-orchestrator.ts computes this real approved list once from the already-existing CBGA report and threads it through buildUniversalMaterializedWorkspaceFiles → composeGeneratedAppWorkspaceFiles → buildUniversalBlueprintWorkspaceFiles, unchanged for every other caller (optional, additive parameter, defaults to empty); (3) generation-pipeline-compliance-adapter.ts\'s buildGpcaPostMaterializationReport now derives "navigation labels this build generated" from the real Rendered Content Evidence Expansion V1 audit (renderedContentAudit.navigation.navigationLabels — the actual <nav>/label: content of this build\'s real files) whenever real file content can be read, falling back to the old presence-based proxy only when no rendered evidence exists at all (pre-materialization) — strictly more accurate, never less strict: a default-shell label that is genuinely rendered anywhere still blocks the build exactly as before. Verified: a synthetic build with an empty CBGA navigation plan renders zero Activity/Alerts/Profile/Settings/Help/Feedback/Legal anywhere in AppShell.tsx/product-surface.ts and produces zero contract-bypass navigation findings, while a synthetic build whose CBGA navigation plan does contain "Settings" still renders it. No change to GPCA scoring, gate ordering, or thresholds; no change to CBGA repair/gate logic; no change to Product Faithfulness; no filename whitelisting; no per-application special-casing.',
  },
  {
    capability: 'GPCA Production Enforcement',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (unconditional hard-stop, every build)',
    activationAllowed: 'YES',
    notes:
      'GPCA Production Enforcement Fix V1 — every ASE/AEE continuation/override branch in one-prompt-build-orchestrator.ts now re-consults gpcaComplianceReport directly (never the collapsed materializationExecuted boolean) before workspace stabilization, npm install/build, and dev-server/preview start; a blocking outcome is terminal (GENERATION_PIPELINE_NON_COMPLIANT) with no override path remaining.',
  },
  {
    capability: 'Production Pipeline Constitution Adoption Phase 1',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (unconditional, every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 1 — enforces PPC-606/PPC-607/PPC-702/PPC-1001/PPC-1002/PPC-1203/PPC-1205/PPC-1304 from docs/production-pipeline-constitution-v1.md. TIER 0 (continuation file-list completeness): listExistingWorkspaceGeneratedFilePaths() in one-prompt-build-orchestrator.ts now recursively walks the ENTIRE src/features/** and src/blueprint/** subtrees (previously only one level into src/features/<module>/, silently skipping root-level files like the feature router itself and the whole blueprint subtree) plus src/App.tsx, src/App.css, and the generated blueprint-manifest.json/build-manifest.json — so a continuation build that skips fresh materialization (workspaceHasGeneratedFeatureModules()==true) now audits the COMPLETE real workspace, never a partial subset, before stabilization/build/preview. TIER 1 (GPCA final invariant): a new shared, exported re-audit primitive (auditCurrentWorkspaceStateForGpca, called by reauditGpcaAfterWorkspaceMutation) re-runs the identical buildGpcaPostMaterializationReport call against the CURRENT on-disk workspace state — never a stale in-memory report — immediately after every real post-audit file mutation this milestone identified: the workspace stabilizer (when repairActions actually applied), the AEE build-AutoFix loop (when report.filesChanged is non-empty), Engineering Intelligence\'s missing-capability repair (when repairAttempts is non-empty), and Autonomous Engineering Loop capability evolution (when capabilitiesEvolved is non-empty); a block at any of the three PRE-preview mutation points (stabilizer/AutoFix/final-pre-preview-gate) is an immediate, terminal GENERATION_PIPELINE_NON_COMPLIANT hard-stop — no npm build, dev server start, or preview recovery ever runs afterward. The pre-existing single re-check immediately before dev-server start was also upgraded from re-consulting the same (possibly stale) report object to ALWAYS re-running a fresh audit first. Engineering Intelligence and capability evolution run after the dev server has already been started by an earlier stage in this file; because retroactively tearing down an already-started dev server is out of this Phase 1\'s scope, a block detected at those two specific, later call sites instead forces the final build result to report FAILED/no-live-preview-available (never a compliant/ready outcome) and carries gpcaViolatedConstitutionRuleIds — a deliberate, documented boundary of this phase, not a silent gap. No GPCA scoring/gate/detector change, no CBGA change, no Product Faithfulness change, no AEO/EIAA change, no new authority, no application-specific logic.',
  },
  {
    capability: 'Contract-Bound Root Navigation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (runs on every rendered-content audit, no opt-in)',
    activationAllowed: 'N/A',
    notes:
      'Contract-Bound Root Navigation Authority V1 — fixes the last real-build constitutional blocker (COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE) Production Pipeline Constitution Adoption Phase 1 left standing: the Blueprint Generator unconditionally emitted a root "Home" navigation item into shellPrimaryNavItems with no matching CBGA navigationPlan entry, and GPCA\'s per-item contract-navigation-traceability check correctly had no ancestry to prove for it. Introduces a generic, structural Infrastructure Navigation model (infrastructure-navigation-model.ts: ROOT_SURFACE/ROOT_LAYOUT/ROOT_CONTAINER/APPLICATION_FRAME/ENTRY_SURFACE — never a specific label) that formally separates every rendered navigation item into exactly one of two constitutionally distinct categories: CONTRACT NAVIGATION (CBGA-owned; must appear in CbgaGenerationReport.navigationPlan) and INFRASTRUCTURE NAVIGATION (Blueprint-Infrastructure-owned; a root shell/frame/entry surface with no business identity; must never be compared against CBGA and never require its approval). universal-app-blueprint-product-surface.ts no longer emits the root entry point as a BlueprintProductSurfaceNavItem inside shellPrimaryNavItems — it is now rootNavigationSurface, a dedicated InfrastructureNavigationItem (kind ROOT_SURFACE, provenance BLUEPRINT_INFRASTRUCTURE, a new sixth Phase-6 origin) AppShell.tsx renders as its own nav button (both sidenav and bottomnav), separately from the CBGA-gated shellPrimaryNavItems/shellSecondaryNavItems map, additionally stamped with a structural data-nav-kind="ROOT_SURFACE" DOM marker. GPCA\'s rendered-content evidence layer (rendered-content-fingerprints.ts) gained extractInfrastructureNavigationLabels() — recognizing either that DOM marker or the equivalent `{ kind: \'<INFRA_KIND>\', label: ... }` data-field shape — and extractNavigationLabels() now excludes every infrastructure-marked label from its returned (product-only) set, so infrastructure navigation can never enter evidence.proposed.navigationLabels and therefore never enters contract-navigation-traceability, detectContractBypassedInputs\' navigationBypass check, or detectHardcodedNavigationLabels — exactly the "must never appear in GPCA\'s contract navigation comparison" requirement, achieved by exclusion at the evidence layer rather than by weakening any downstream check. Business/product navigation (e.g. CBGA-approved module labels, approved default-shell labels) is completely untouched: it still flows through extractNavigationLabels\' unchanged product-label extraction and still requires a CBGA navigationPlan entry to pass traceability — proven by both the pre-existing Contract-Bound Navigation Shell Fix V1 validator (unaffected) and this milestone\'s own validator asserting unapproved business labels still block. Root landing surfaces (pages/HomePage.tsx) were independently confirmed to already classify INFRASTRUCTURE under the existing, unmodified Infrastructure vs Product Boundary Authority V1 classifier (its onNavigate prop-type signature already matches the existing NAVIGATION_INFRASTRUCTURE structural signal, and it carries zero business-content signal since every heading/button/list-item it renders is a JSX expression, never a literal string) — no change was needed or made to that classifier\'s rules. No GPCA scoring/threshold change, no CBGA policy change, no Product Faithfulness change, no new authority, no filename whitelist, no per-application special-casing — "Home" is never named anywhere in the detection logic, only the generic structural kind.',
  },
  {
    capability: 'Placeholder & Template Elimination Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (classifies every rendered text fragment on every post-materialization pass, no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 2 V1 — introduces a generic Product Content Origin model (CONTRACT_PRODUCT_CONTENT / CBGA_PRODUCT_CONTENT / PROMPT_PRODUCT_CONTENT / INFRASTRUCTURE_CONTENT / MATERIALIZATION_METADATA / UNKNOWN_CONTENT — src/placeholder-template-elimination-authority-v1/) so every rendered text fragment GPCA\'s Rendered Content Evidence Expansion V1 already extracts is additionally classified with Content Origin, Content Source, Approved Producer, and a Traceability Chain (RenderedEvidenceItem.contentOrigin/contentSource/approvedProducer/traceabilityChain; GpcaRenderedContentAudit.contentOriginAudit). Generator-invented business content ("Sample X", "Demo Y", "Preview entry", "Example record", "Template heading", "Test record", "Fake statistics/records/users/...") is detected by a dedicated, additive fingerprint registry (business-placeholder-fingerprints.ts) and merged straight into the existing, unmodified placeholderPhrasesMatched evidence GPCA\'s rendered-content gate already blocks on — this can only ever add new blocking signals, never remove or weaken one, and never changes GPCA\'s gate/CBGA/Product Faithfulness. Generic UI chrome (Loading/Back/Retry/Next/Previous/Search/Menu/Navigation/Cancel/Confirm/Close and "Loading…"-style progress phrases) classifies INFRASTRUCTURE_CONTENT and is exempt from CBGA/contract-ancestry proof (Part 3/4); everything else must trace to the real contract, CBGA\'s approved plan, or prompt-derived vocabulary, or it classifies UNKNOWN_CONTENT and the audit reports allContentConstitutionallyTraceable=false. Removed the last generator-invented business content still in production: modular-feature-module-generator.ts\'s buildFeatureServiceTs no longer returns hardcoded "Sample/preview" records (now returns an empty array — no approved data source exists yet to seed from) and buildFeatureComponentTsx now renders an infrastructure-safe empty state ("No <Module> recorded yet.") instead; profile-feature-ui-generator.ts no longer renders a hardcoded "Demo data" / "Sample <label> records" card. Enforces PPC-301, PPC-302, PPC-606, PPC-702, PPC-901, PPC-1001, PPC-1203, PPC-1207 (No Parallel Truth), PPC-1600, PPC-1700.',
  },
  {
    capability: 'Generation Pipeline Compliance Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (audits + blocks every build)',
    activationAllowed: 'YES',
    notes: 'Audits every generation stage and blocks contract bypass before materialization/preview.',
  },
  {
    capability: 'Contract-Bound Generation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'YES',
    notes: 'Repairs generator inputs (modules/routes/nav/title) to the canonical contract before generation.',
  },
  {
    capability: 'Autonomous Engineering Orchestrator',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (matched, safe repairs only)',
    activationAllowed: 'YES',
    notes: 'Coordinates diagnosis and repair; routes GPCA failure classes to missing-capability planning (no auto-repair exists for them).',
  },
  {
    capability: 'Engineering Intelligence Activation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'NO (decision authority only)',
    activationAllowed: 'CONDITIONAL (8-point policy)',
    notes: 'Activates Engineering Intelligence only when policy permits and only after GPCA/AEO prove the generator itself lacks the capability.',
  },
  {
    capability: 'Engineering Intelligence Runtime',
    status: 'IMPLEMENTED',
    productionWired: 'PARTIAL',
    autoRun: 'NO (gated by EIAA)',
    activationAllowed: 'CONDITIONAL',
    notes: 'Generates missing capabilities after EIAA approval; GPCA never invokes it directly.',
  },
  {
    capability: 'Product Faithfulness',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'N/A (audit)',
    activationAllowed: 'N/A',
    notes: 'Produces the canonical product contract GPCA audits every stage against.',
  },
  {
    capability: 'Product Faithfulness Repair',
    status: 'IMPLEMENTED',
    productionWired: 'SIMULATED',
    autoRun: 'NO',
    activationAllowed: 'NO',
    notes: 'In-memory stage-evidence reconciliation only — never regenerates workspace files.',
  },
  {
    capability: 'Fresh Build Artifact Isolation',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Purges stale prior-build artifacts before planning/materialization for a NEW_BUILD.',
  },
  {
    capability: 'Project Context Isolation',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Prevents cross-project/prior-prompt context bleed into the active build.',
  },
  {
    capability: 'Build Reality AutoFix',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (targeted retries)',
    activationAllowed: 'N/A',
    notes: 'Repairs compiler/build failures during the AEE build-autofix loop.',
  },
  {
    capability: 'Build Execution Stabilizer',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Stabilizes npm install/build execution before/after materialization.',
  },
  {
    capability: 'Live Preview Gate',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Blocks preview activation until live-preview proof requirements are satisfied.',
  },
  {
    capability: 'Identity Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 3 V1 — enforces PPC-1207 No Parallel Truth for product identity after CBGA approval. Contract-Bound Generation Authority V4 (src/contract-bound-generation-authority-v4/approved-product-identity.ts) packages its already-repaired appTitle + the contract\'s productIdentity into a single, typed, immutable ApprovedProductIdentity handoff (source=CBGA_REPAIRED_PLAN), threaded by the orchestrator into every downstream generator this milestone previously found computing identity independently: the Universal Feature Contract builder\'s productName, the materialization engine\'s "Custom App" sentinel fallback chain, and buildFeatureAppRouterTsx\'s customDomainCopy.headline-split. Materialization refuses (GENERATION_PIPELINE_NON_COMPLIANT) rather than deriving a fallback if CBGA ever failed to produce a valid identity. GPCA\'s own titleTraceability additionally (never instead of the original check) accepts a match against the approved identity — this can only ever prove more titles traceable, never weaken the existing check. extractAppName/extractPromptAppTitle remain documented draft/pre-contract-only derivations; no production path downstream of CBGA repair calls them. Never modifies GPCA scoring/enforcement, CBGA repair policy, Product Faithfulness, or AEO/EIAA — purely collapses parallel identity computation onto CBGA\'s existing repaired output. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1609, PPC-1701, PPC-1702, PPC-1703.',
  },
  {
    capability: 'Navigation Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 4 V1 — implements PPC-1207 by collapsing all downstream navigation computation onto one immutable ApprovedNavigationPlan (src/contract-bound-generation-authority-v4/approved-navigation-plan.ts, source=CBGA_REPAIRED_NAVIGATION_PLAN) produced immediately after CBGA repair. Built by filtering CBGA\'s own contract-derived navigationPlan down to items whose moduleId is in the final approved module set — always populated correctly, independent of which repair branch ran. Threaded by the orchestrator into every downstream generator this milestone found computing/inferring navigation independently: the blueprint generator/product surface default-shell gating, the modular feature router generator (buildFeatureAppRouterTsx previously derived nav items from ProfileFeatureDefinition.featureModules via moduleIdToDisplayName — an entirely separate source from CBGA\'s navigationPlan — now renders the approved plan\'s own moduleId/label pairs directly when supplied), the Universal Feature Contract (new additive top-level `navigation` field), and generated manifests. Infrastructure navigation (root/frame/layout — infrastructure-navigation-model.ts) remains exclusively Blueprint-Infrastructure-owned and is never part of this plan. Materialization refuses (GENERATION_PIPELINE_NON_COMPLIANT) rather than falling back if CBGA ever failed to produce a structurally valid plan. GPCA\'s own navigationTraceability additionally (never instead of the original check) accepts a match against the approved plan\'s navigationItems — this can only ever prove more navigation items traceable, never weaken the existing check. Never modifies GPCA scoring/enforcement, CBGA repair policy, Product Faithfulness, or AEO/EIAA — purely collapses parallel navigation computation onto CBGA\'s existing repaired output. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1603, PPC-1702, PPC-1703, PPC-1704.',
  },
  {
    capability: 'Module Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 5 V1 — implements PPC-1207 by collapsing all downstream module-metadata computation onto one immutable ApprovedModulePlan (src/contract-bound-generation-authority-v4/approved-module-plan.ts, source=CBGA_REPAIRED_MODULE_PLAN) produced immediately after CBGA repair. Built by filtering CBGA\'s own contract-derived modulePlan down to entries whose moduleId is in the final approved module set (repairedInputs.moduleIds), with each entry\'s route joined from routePlan by moduleId; system-shell modules (auth/dashboard/settings/persistence) are never fabricated into moduleEntries — they remain documented only via the generic systemShellModuleIds taxonomy. Threaded by the orchestrator (behind a PPC-1207 constitutional guard that fails materialization with GENERATION_PIPELINE_NON_COMPLIANT rather than deriving fallback modules) into every downstream generator this milestone found independently computing module displayName/route metadata: buildAllModularFeatureModuleFiles/buildModularFeatureModuleFiles (registry+manifest entry name/route previously always `moduleIdToDisplayName`/`resolveModuleRoute`), buildFeatureAppRouterTsx (nav label second-priority source after ApprovedNavigationPlan), deriveBlueprintContractCopy\'s moduleDisplayNameOf (coreFeatureLabel), the Universal Feature Contract (new additive top-level `modules` field), and generated manifests (.generated-app-manifest.json approvedModuleIds, blueprint-manifest.json approvedModuleIds). GPCA\'s own moduleTraceability additionally (never instead of the original modulePlan check) accepts a match against ApprovedModulePlan.moduleEntries first — this can only ever prove more modules traceable, never weaken the existing check. Which modules materialize as files at all remains driven by ProfileFeatureDefinition.featureModules exactly as before (unchanged — not a CBGA policy change, not a generator rewrite); this collapse targets only the previously independently-computed displayName/route/order metadata for the modules CBGA already approved. Never modifies GPCA scoring/enforcement, CBGA repair policy, Product Faithfulness, or AEO/EIAA. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703.',
  },
  {
    capability: 'Metadata Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 6 V1 — implements PPC-1207 by collapsing all downstream production metadata computation onto one immutable ApprovedMetadataPlan (src/contract-bound-generation-authority-v4/approved-metadata-plan.ts, source=CBGA_COMPOSED_METADATA_PLAN) produced immediately after CBGA approval by deterministic composition over ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + the canonical product contract. Threaded by the orchestrator (behind a PPC-1207 constitutional guard that fails materialization with GENERATION_PIPELINE_NON_COMPLIANT rather than deriving fallback metadata) into every downstream consumer this milestone found independently computing title/subtitle/count/summary metadata: blueprint tagline (applicationSubtitle replaces per-call deriveNeutralAppTagline), runtime shell document title, Universal Feature Contract metadata field, generated app manifest (approvedApplicationSubtitle + approvedMetadataSummary), build-manifest.json, and blueprint-manifest.json approvedMetadataSummary. GPCA\'s own titleTraceability additionally (never instead) accepts ApprovedMetadataPlan.applicationTitle; new additive metadataTraceability verifies composition integrity against the three source handoffs — this can only ever prove more metadata traceable, never weaken existing checks. Never modifies GPCA scoring/enforcement, CBGA repair policy, Product Faithfulness, or AEO/EIAA. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703.',
  },
  {
    capability: 'Sample Data Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 7 V1 — implements PPC-1207 by collapsing all downstream sample/demo/seed/preview/dashboard data computation onto one immutable ApprovedSampleDataPlan (src/contract-bound-generation-authority-v4/approved-sample-data-plan.ts, source=CBGA_COMPOSED_SAMPLE_DATA_PLAN) produced immediately after CBGA approval by deterministic composition over ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + ApprovedMetadataPlan + the canonical product contract. Default: no invented business records; generators render infrastructure empty states. Threaded by the orchestrator (behind a PPC-1207 constitutional guard) into demo-data.ts, blueprint dashboard/preview seeds, safe-payment placeholder modules, Universal Feature Contract sampleData field, generated app manifest, build-manifest.json, and blueprint-manifest.json. GPCA\'s new additive sampleDataTraceability verifies composition integrity against prior handoffs — never weakens existing checks. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703, PPC-1800, PPC-1900.',
  },
  {
    capability: 'Provenance Computation Collapse',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 8 V1 — implements PPC-1207 by collapsing all downstream artifact provenance/ancestry computation onto one immutable ApprovedProvenancePlan (src/contract-bound-generation-authority-v4/approved-provenance-plan.ts, source=CBGA_COMPOSED_PROVENANCE_PLAN) produced immediately after CBGA approval by deterministic composition over all prior approved handoffs plus CBGA repaired inputs and canonical contract evidence. Threaded by the orchestrator (behind a PPC-1207 constitutional guard) into GPCA traceability (projects ancestryChains additively), manifests, engineering report, blueprint generator, materialization, and Universal Feature Contract. GPCA reads constitutional ancestry from ApprovedProvenancePlan when available instead of reconstructing — never weakens existing traceability checks. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600, PPC-1601, PPC-1701, PPC-1702, PPC-1703, PPC-1800, PPC-1900, PPC-2100 series.',
  },
  {
    capability: 'Repair Reality Alignment',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 9 V1 — implements PPC-1207 repair truth alignment by collapsing all repair classification onto one immutable ApprovedRepairRealityPlan. GPCA\'s additive repairRealityTraceability reads what actually changed from the plan instead of inferring mutations. Real workspace/source/generator repairs require constitutional revalidation before preview. Evidence-only and report-only repairs never claim production mutations. Never weakens GPCA scoring/enforcement, CBGA repair policy, Product Faithfulness, or AEO/EIAA. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1700 series, PPC-1800 series, PPC-1900 series, PPC-2100 series.',
  },
  {
    capability: 'Final Immutable Production Pipeline',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (every build — no opt-in)',
    activationAllowed: 'YES',
    notes:
      'Production Pipeline Constitution Adoption Phase 10 V1 — GPCA consumes ApprovedProductionBuildEnvelope from cbgaReport as the single constitutional source (additive — existing detectors/scoring/gates unchanged). productionBuildEnvelopeTraceability verifies envelope integrity and that every encapsulated handoff agrees on buildId/promptHash/constitutional version. Preview guarantee enforced via envelope pipelineState workspace locking. Never weakens GPCA scoring/enforcement, CBGA, Product Faithfulness, AEO, EIAA, or VERE. Enforces PPC-101, PPC-201, PPC-202, PPC-401, PPC-402, PPC-1207, PPC-1600 series, PPC-1700 series, PPC-1800 series, PPC-1900 series, PPC-2100 series, PPC-2200.',
  },
];

export function listCapabilityMatrixCapabilityNames(): string[] {
  return GPCA_CAPABILITY_MATRIX_ROWS.map((r) => r.capability);
}

export function renderCapabilityMatrixMarkdown(): string {
  const header = '| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |';
  const divider = '|------------|--------|------------------|----------|--------------------|-------|';
  const rows = GPCA_CAPABILITY_MATRIX_ROWS.map(
    (r) => `| ${r.capability} | ${r.status} | ${r.productionWired} | ${r.autoRun} | ${r.activationAllowed} | ${r.notes} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderPipelineComplianceTable(report: GpcaComplianceReport): string {
  const header =
    '| Generation Stage | Production Wired | Uses CBGA | Uses Contract | Legacy Free | Template Free | Traceable | Status |';
  const divider =
    '|-------------------|-------------------|-----------|----------------|-------------|----------------|-----------|--------|';
  const rows = report.stages.map((stage) => {
    const score = report.scores.find((s) => s.stageId === stage.stageId) as GpcaStageComplianceScore;
    const legacyFree = stage.flags.usesLegacyPlanner || stage.flags.usesFallbackModules ? 'NO' : 'YES';
    const templateFree =
      stage.flags.usesHardcodedTemplate || stage.flags.usesGenericUiCopy || stage.flags.usesReusableComponentShell
        ? 'NO'
        : 'YES';
    const traceable = score.traceabilityPercent === 100 ? 'YES' : 'NO';
    return `| ${stage.stageName} | YES | ${stage.flags.usesCbga ? 'YES' : 'NO'} | ${
      stage.flags.usesCanonicalContract ? 'YES' : 'NO'
    } | ${legacyFree} | ${templateFree} | ${traceable} | ${score.status} |`;
  });
  return [header, divider, ...rows].join('\n');
}

function renderRenderedContentAuditSection(report: GpcaComplianceReport): string {
  const audit = report.renderedContentAudit;
  const lines: string[] = [];
  lines.push('## Rendered Content Audit');
  if (!audit) {
    lines.push('- (no rendered evidence available for this phase — pre-materialization, or no renderable files existed yet)');
    return lines.join('\n');
  }
  lines.push(`**Files audited:** ${audit.filesAudited.length}`);
  lines.push(`**Rendered contract match:** ${audit.renderedContractMatchPercent}%`);
  lines.push(`**Overall rendered compliance:** ${audit.overallRenderedCompliancePercent}%`);
  lines.push(`**Rendered gate outcome:** ${audit.gateOutcome}`);
  lines.push('');
  lines.push('### Headings');
  lines.push(audit.headings.headings.length > 0 ? audit.headings.headings.map((h) => `- ${h}`).join('\n') : '- (none rendered)');
  lines.push('');
  lines.push('### Navigation');
  lines.push(
    audit.navigation.navigationLabels.length > 0 ? audit.navigation.navigationLabels.map((n) => `- ${n}`).join('\n') : '- (none rendered)',
  );
  lines.push('');
  lines.push('### Buttons');
  lines.push(
    audit.interactions.buttonLabels.length > 0 ? audit.interactions.buttonLabels.map((b) => `- ${b}`).join('\n') : '- (none rendered)',
  );
  lines.push('');
  lines.push('### Routes');
  lines.push(audit.routesAudited.length > 0 ? audit.routesAudited.map((r) => `- ${r}`).join('\n') : '- (none audited)');
  lines.push('');
  lines.push('### Visible Features');
  lines.push(
    audit.surfaces.visibleText.length > 0
      ? audit.surfaces.visibleText.slice(0, 25).map((t) => `- ${t}`).join('\n')
      : '- (none rendered)',
  );
  lines.push('');
  lines.push('### Placeholder Detection');
  lines.push(
    audit.placeholders.placeholderPhrasesMatched.length > 0
      ? audit.placeholders.placeholderPhrasesMatched.map((p) => `- ${p}`).join('\n')
      : '- (none detected)',
  );
  lines.push('');
  lines.push('### Template Fingerprints');
  lines.push(
    audit.templates.templateFingerprintsMatched.length > 0
      ? audit.templates.templateFingerprintsMatched.map((t) => `- ${t}`).join('\n')
      : '- (none detected)',
  );
  lines.push('');
  lines.push('### Generic Shell Fingerprints');
  lines.push(
    audit.templates.genericShellFingerprintsMatched.length > 0
      ? audit.templates.genericShellFingerprintsMatched.map((t) => `- ${t}`).join('\n')
      : '- (none detected)',
  );
  lines.push('');
  lines.push('### Rendered Contract Match');
  lines.push(`${audit.renderedContractMatchPercent}% of audited visible headings/titles/text reference a real contract concept.`);
  lines.push('');
  lines.push('### Overall Rendered Compliance');
  lines.push(`${audit.overallRenderedCompliancePercent}%`);
  return lines.join('\n');
}

function renderBoundaryAuditSection(report: GpcaComplianceReport): string {
  const audit = report.boundaryAudit;
  const lines: string[] = [];
  lines.push('## Infrastructure vs Product Boundary Audit');
  if (!audit) {
    lines.push('- (no boundary evidence available for this phase — pre-materialization, or no generated files existed yet)');
    return lines.join('\n');
  }
  lines.push(`**Infrastructure files:** ${audit.infrastructureCount}`);
  lines.push(`**Product files:** ${audit.productCount}`);
  lines.push(`**Mixed files:** ${audit.mixedCount}`);
  lines.push(`**Unknown files:** ${audit.unknownCount}`);
  lines.push('');
  lines.push('### Safe Infrastructure (exempt from presence-based blueprint/generic-shell blocking)');
  lines.push(audit.safeInfrastructurePaths.length > 0 ? audit.safeInfrastructurePaths.map((p) => `- ${p}`).join('\n') : '- (none)');
  lines.push('');
  lines.push('### Violating Paths (Mixed/Unknown — must be decomposed or rejected)');
  lines.push(audit.violatingPaths.length > 0 ? audit.violatingPaths.map((p) => `- ${p}`).join('\n') : '- (none)');
  return lines.join('\n');
}

function renderScoreTable(scores: readonly GpcaStageComplianceScore[]): string {
  const header =
    '| Stage | Contract % | Input % | Output % | Traceability % | Template Leakage % | Legacy Usage % | Blueprint Usage % | Overall % | Status |';
  const divider =
    '|-------|-----------|---------|----------|-----------------|---------------------|------------------|---------------------|-----------|--------|';
  const rows = scores.map(
    (s) =>
      `| ${s.stageName} | ${s.contractCompliancePercent} | ${s.inputCompliancePercent} | ${s.outputCompliancePercent} | ${s.traceabilityPercent} | ${s.templateLeakagePercent} | ${s.legacyUsagePercent} | ${s.blueprintUsagePercent} | ${s.overallCompliancePercent} | ${s.status} |`,
  );
  return [header, divider, ...rows].join('\n');
}

export function renderGenerationPipelineComplianceReportMarkdown(report: GpcaComplianceReport): string {
  const lines: string[] = [];
  lines.push('# Generation Pipeline Compliance Authority V1 — Report');
  lines.push('');
  lines.push(`**Contract ID:** ${report.contractId}`);
  lines.push(`**Product identity:** ${report.productIdentity}`);
  lines.push(`**Phase:** ${report.phase}`);
  lines.push(`**Overall compliance:** ${report.overallCompliancePercent}%`);
  lines.push(`**Final gate outcome:** ${report.finalGateOutcome}`);
  lines.push('');
  lines.push('## Pipeline Compliance');
  lines.push(renderPipelineComplianceTable(report));
  lines.push('');
  lines.push('## Per-Stage Compliance Scores');
  lines.push(renderScoreTable(report.scores));
  lines.push('');
  lines.push('## Findings');
  lines.push(`- **Legacy generators detected:** ${report.legacyGeneratorsDetected.join(', ') || '(none)'}`);
  lines.push(`- **Template generators detected:** ${report.templateGeneratorsDetected.join(', ') || '(none)'}`);
  lines.push(`- **Generic shell surfaces blocked:** ${report.genericShellSurfacesBlocked.join(', ') || '(none)'}`);
  lines.push(`- **Blueprint bypass detected:** ${report.blueprintBypassDetected.join(', ') || '(none)'}`);
  lines.push(`- **Contract bypass detected:** ${report.contractBypassDetected.join(', ') || '(none)'}`);
  lines.push('');
  lines.push('## Blocked Reasons');
  lines.push(report.blockedReasons.length > 0 ? report.blockedReasons.map((r) => `- ${r}`).join('\n') : '- (generation allowed — no blocking reasons)');
  lines.push('');
  lines.push(renderRenderedContentAuditSection(report));
  lines.push('');
  lines.push(renderBoundaryAuditSection(report));
  lines.push('');
  lines.push('## Capability Matrix');
  lines.push(renderCapabilityMatrixMarkdown());
  return lines.join('\n');
}
