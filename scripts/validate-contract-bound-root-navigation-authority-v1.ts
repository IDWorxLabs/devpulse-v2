/**
 * CONTRACT_BOUND_ROOT_NAVIGATION_AUTHORITY_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 1 proved GPCA re-audits correctly and continuation
 * builds are audited completely. The one blocker that survived, unrelated to either fix, was
 * structural: the Blueprint Generator unconditionally emitted a root "Home" navigation item into
 * `shellPrimaryNavItems` — indistinguishable from real product navigation — with no matching entry
 * in CBGA's navigation plan (it is not a business concept; every build's root landing surface is the
 * same structural responsibility). GPCA's per-item contract-navigation-traceability check correctly
 * had no ancestry to prove for it and blocked with `COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE`.
 *
 * The fix introduces a generic, structural Infrastructure Navigation model
 * (`infrastructure-navigation-model.ts`: ROOT_SURFACE/ROOT_LAYOUT/ROOT_CONTAINER/APPLICATION_FRAME/
 * ENTRY_SURFACE — never a specific label) that separates every rendered navigation item into exactly
 * one of two constitutionally distinct categories: CONTRACT NAVIGATION (CBGA-owned) and
 * INFRASTRUCTURE NAVIGATION (Blueprint-Infrastructure-owned, never compared against CBGA, never
 * requiring its approval). The Blueprint Generator now emits the root entry point as a dedicated
 * `rootNavigationSurface` (kind `ROOT_SURFACE`), never mixed into `shellPrimaryNavItems`, and GPCA's
 * rendered-content evidence layer excludes any structurally-marked infrastructure label from the
 * product-navigation set it hands to contract-navigation-traceability / contract-bypass detection.
 *
 * This is NOT a GPCA scoring/CBGA/Product Faithfulness milestone: no detector's judgment logic, gate
 * ordering, or threshold changed — only (a) the Blueprint Generator (stops inventing product
 * navigation for the root surface) and (b) GPCA's own evidence-EXTRACTION layer (excludes
 * structurally-marked infrastructure labels from the set it hands to its unmodified detectors).
 *
 * Run only:
 *   npx tsx scripts/validate-contract-bound-root-navigation-authority-v1.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyBoundaryFile,
  runInfrastructureProductBoundaryVerification,
  isInfrastructureNavigationKind,
  INFRASTRUCTURE_NAVIGATION_KINDS,
} from '../src/infrastructure-product-boundary-authority-v1/index.js';
import type { BoundaryFileInput } from '../src/infrastructure-product-boundary-authority-v1/index.js';
import {
  buildUniversalBlueprintWorkspaceFiles,
  buildBlueprintProductSurface,
} from '../src/universal-app-blueprint/index.js';
import type { UniversalBlueprintBuildInput } from '../src/universal-app-blueprint/index.js';
import {
  runContractBoundGenerationAuthority,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence } from '../src/contract-bound-generation-authority-v4/index.js';
import {
  collectRenderedContentEvidence,
  extractNavigationLabels,
  extractInfrastructureNavigationLabels,
  detectContractBypassedInputs,
  buildContractTraceabilityChains,
  GPCA_CAPABILITY_MATRIX_ROWS,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'CONTRACT_BOUND_ROOT_NAVIGATION_AUTHORITY_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
}

const BOUNDARY_ELIGIBLE_PATTERN = /\.(?:tsx?|jsx?|css)$/i;

function generatedBoundaryEligibleFiles(input: UniversalBlueprintBuildInput): BoundaryFileInput[] {
  return buildUniversalBlueprintWorkspaceFiles(input)
    .filter((f) => BOUNDARY_ELIGIBLE_PATTERN.test(f.relativePath))
    .map((f) => ({ path: f.relativePath, content: f.content }));
}

async function main(): Promise<void> {
  const baseInput: UniversalBlueprintBuildInput = {
    contractId: 'c1',
    ideaId: 'i1',
    buildUnits: ['ui'],
    appName: 'Riverside Bistro Manager',
    tagline: 'Riverside Bistro Manager — modular application workspace',
    coreFeatureLabel: 'Reservations',
    landingSummary: 'Riverside Bistro Manager — manage Reservations and connected workflows.',
    homeSummary: 'Your Riverside Bistro Manager workspace is ready. Start with Reservations.',
    contractDerivationSource: 'APPROVED_MODULE_PLAN',
  };

  const restaurantContract: CbgaCanonicalContractEvidence = {
    contractId: 'c1',
    productIdentity: 'Riverside Bistro Manager',
    primaryWorkflows: ['Reservations'],
    coreEntities: ['Reservation'],
    coreActions: ['create', 'update'],
    navigationExpectations: ['Reservations'],
    majorFeatureGroups: ['Reservations'],
    businessConcepts: ['Reservations'],
    allConceptNames: ['Reservations', 'Riverside Bistro Manager'],
  };
  const restaurantCbgaReport = runContractBoundGenerationAuthority({
    contract: restaurantContract,
    proposed: {
      proposedModuleIds: [],
      proposedRoutes: [],
      proposedNavigationLabels: [],
      proposedAppTitle: 'Riverside Bistro Manager',
    },
  });
  const restaurantApprovedNavigationLabels = restaurantCbgaReport.navigationPlan.map((item) => item.label);

  const restaurantFiles = buildUniversalBlueprintWorkspaceFiles({ ...baseInput, approvedNavigationLabels: restaurantApprovedNavigationLabels });
  const restaurantRenderableFiles = restaurantFiles
    .filter((f) => /\.(tsx?|jsx?|html)$/i.test(f.relativePath))
    .map((f) => ({ path: f.relativePath, content: f.content }));
  const restaurantRenderedAudit = collectRenderedContentEvidence({
    files: restaurantRenderableFiles,
    contractVocabulary: ['Riverside Bistro Manager', 'Reservations'],
  });
  const homePageFile = restaurantFiles.find((f) => f.relativePath === 'src/blueprint/pages/HomePage.tsx');
  const appShellFile = restaurantFiles.find((f) => f.relativePath === 'src/blueprint/AppShell.tsx');
  const productSurfaceFile = restaurantFiles.find((f) => f.relativePath === 'src/blueprint/product-surface.ts');
  if (!homePageFile || !appShellFile || !productSurfaceFile) {
    throw new Error('Expected generated blueprint files missing — cannot continue validation');
  }
  const contractVocabulary = ['Riverside Bistro Manager', 'Reservations'];

  // ===============================================================================================
  // Scenario 1 — root landing surface classified as infrastructure.
  // ===============================================================================================
  const homePageClassification = classifyBoundaryFile(homePageFile, contractVocabulary);
  assert(
    '1. Root landing surface classified as infrastructure: classifyBoundaryFile() on the real generated src/blueprint/pages/HomePage.tsx returns INFRASTRUCTURE, never PRODUCT/MIXED/UNKNOWN',
    homePageClassification.classification === 'INFRASTRUCTURE',
    `classification=${homePageClassification.classification}, reasons=${JSON.stringify(homePageClassification.reasons)}`,
  );

  // ===============================================================================================
  // Scenario 2 — infrastructure navigation never appears in CBGA navigation comparison.
  // ===============================================================================================
  const productNavLabels = [...new Set(restaurantRenderedAudit.navigation.navigationLabels)];
  const infraNavLabels = [...new Set(restaurantRenderedAudit.navigation.infrastructureNavigationLabels)];
  assert(
    '2. Infrastructure navigation never appears in the product-navigation set GPCA compares against CBGA: "Home" is present in navigation.infrastructureNavigationLabels and absent from navigation.navigationLabels for a real generated build',
    infraNavLabels.includes('Home') && !productNavLabels.includes('Home'),
    `productNavLabels=${JSON.stringify(productNavLabels)}, infrastructureNavLabels=${JSON.stringify(infraNavLabels)}`,
  );

  // ===============================================================================================
  // Scenario 3 — product navigation always compared against CBGA.
  // ===============================================================================================
  const productEvidenceForTraceability: GpcaPipelineEvidenceInput = {
    contract: restaurantContract,
    cbgaReport: restaurantCbgaReport,
    proposed: {
      appTitle: 'Riverside Bistro Manager',
      moduleIds: restaurantCbgaReport.repairedInputs.moduleIds,
      routes: restaurantCbgaReport.repairedInputs.routes,
      navigationLabels: productNavLabels,
      generatedFilePaths: restaurantFiles.map((f) => f.relativePath),
    },
  };
  const traceabilityChains = buildContractTraceabilityChains(productEvidenceForTraceability);
  const navItemChains = traceabilityChains.filter((t) => t.artifactKind === 'NAVIGATION_ITEM');
  const coreNavChain = navItemChains.find((t) => t.artifact === 'Reservations');
  assert(
    '3. Product navigation is always compared against CBGA: the real, contract-derived "Reservations" navigation item still has a NAVIGATION_ITEM traceability entry that is proven against CBGA\'s navigationPlan — product navigation is never exempted from the comparison this milestone introduced infrastructure navigation to bypass',
    coreNavChain !== undefined && coreNavChain.proven === true,
    `coreNavChain=${JSON.stringify(coreNavChain)}`,
  );

  // ===============================================================================================
  // Scenario 4 — Blueprint Generator does not invent product navigation.
  // ===============================================================================================
  const noApprovalSurface = buildBlueprintProductSurface({
    appName: baseInput.appName,
    coreFeatureLabel: baseInput.coreFeatureLabel!,
    homeSummary: baseInput.homeSummary!,
    contractDerivationSource: baseInput.contractDerivationSource!,
  });
  const shellPrimaryHasHome = noApprovalSurface.content.shellPrimaryNavItems.some((i) => i.id === 'home' || i.label === 'Home');
  const shellSecondaryHasHome = noApprovalSurface.content.shellSecondaryNavItems.some((i) => i.id === 'home' || i.label === 'Home');
  assert(
    '4. Blueprint Generator does not invent product navigation: shellPrimaryNavItems/shellSecondaryNavItems (the CBGA-gated product navigation arrays) never contain a "home"/"Home" entry — the root entry point is exclusively rootNavigationSurface',
    !shellPrimaryHasHome && !shellSecondaryHasHome,
    `shellPrimaryNavItems=${JSON.stringify(noApprovalSurface.content.shellPrimaryNavItems)}, shellSecondaryNavItems=${JSON.stringify(noApprovalSurface.content.shellSecondaryNavItems)}`,
  );

  // ===============================================================================================
  // Scenario 5 — root navigation metadata is infrastructure only.
  // ===============================================================================================
  const rootSurface = noApprovalSurface.content.rootNavigationSurface;
  const rootSurfaceProvenance = noApprovalSurface.provenance.rootNavigationSurface;
  assert(
    '5. Root navigation metadata is infrastructure only: rootNavigationSurface.kind is a real generic InfrastructureNavigationKind (ROOT_SURFACE), and its provenance tag is BLUEPRINT_INFRASTRUCTURE — never PRODUCT_CONTRACT/CBGA/any contract-derived origin',
    isInfrastructureNavigationKind(rootSurface.kind) && rootSurface.kind === 'ROOT_SURFACE' && rootSurfaceProvenance === 'BLUEPRINT_INFRASTRUCTURE',
    `rootNavigationSurface=${JSON.stringify(rootSurface)}, provenance=${rootSurfaceProvenance}`,
  );

  // ===============================================================================================
  // Scenario 6 — GPCA distinguishes infrastructure/product navigation (both the data-field shape and
  // the DOM data-nav-kind marker shape), via a direct unit-level probe of the real evidence collector.
  // ===============================================================================================
  const syntheticFieldSource = `
export const BLUEPRINT_PRODUCT_SURFACE = {
  shellPrimaryNavItems: [
    {
      id: "core",
      label: "Reservations"
    }
  ],
  rootNavigationSurface: {
    kind: "ROOT_SURFACE",
    id: "home",
    label: "Home"
  }
} as const;
`;
  const syntheticDomSource = `
export default function Shell() {
  return (
    <nav>
      <NavLink data-nav-kind="ENTRY_SURFACE" to="/">Start</NavLink>
      <Link to="/reservations">Reservations</Link>
    </nav>
  );
}
`;
  const fieldAudit = collectRenderedContentEvidence({
    files: [{ path: 'src/blueprint/product-surface.ts', content: syntheticFieldSource }],
    contractVocabulary: ['Reservations'],
  });
  const domAudit = collectRenderedContentEvidence({
    files: [{ path: 'src/blueprint/Shell.tsx', content: syntheticDomSource }],
    contractVocabulary: ['Reservations'],
  });
  const fieldOk =
    fieldAudit.navigation.navigationLabels.includes('Reservations') &&
    !fieldAudit.navigation.navigationLabels.includes('Home') &&
    fieldAudit.navigation.infrastructureNavigationLabels.includes('Home') &&
    !fieldAudit.navigation.infrastructureNavigationLabels.includes('Reservations');
  const domOk =
    domAudit.navigation.navigationLabels.includes('Reservations') &&
    !domAudit.navigation.navigationLabels.includes('Start') &&
    domAudit.navigation.infrastructureNavigationLabels.includes('Start') &&
    !domAudit.navigation.infrastructureNavigationLabels.includes('Reservations');
  assert(
    '6. GPCA distinguishes infrastructure/product navigation for both structural marker shapes: a `{ kind: "ROOT_SURFACE", label: "Home" }` data field AND a `data-nav-kind="ENTRY_SURFACE"` rendered DOM attribute both route their label into navigation.infrastructureNavigationLabels and out of navigation.navigationLabels, while an ordinary business label ("Reservations") stays in navigation.navigationLabels and never leaks into navigation.infrastructureNavigationLabels',
    fieldOk && domOk,
    `field: navLabels=${JSON.stringify(fieldAudit.navigation.navigationLabels)}, infraLabels=${JSON.stringify(fieldAudit.navigation.infrastructureNavigationLabels)} | dom: navLabels=${JSON.stringify(domAudit.navigation.navigationLabels)}, infraLabels=${JSON.stringify(domAudit.navigation.infrastructureNavigationLabels)}`,
  );

  // ===============================================================================================
  // Scenario 7 — Infrastructure Boundary Authority classifies correctly across the full real
  // generated set: AppShell.tsx/HomePage.tsx INFRASTRUCTURE, product-surface.ts PRODUCT, zero
  // MIXED/UNKNOWN anywhere (no regression from Blueprint Content Decomposition V1's own proof).
  // ===============================================================================================
  const boundaryEligibleFiles = generatedBoundaryEligibleFiles({ ...baseInput, approvedNavigationLabels: restaurantApprovedNavigationLabels });
  const boundaryAudit = runInfrastructureProductBoundaryVerification(boundaryEligibleFiles, contractVocabulary);
  const appShellClassification = boundaryAudit.results.find((r) => r.path === 'src/blueprint/AppShell.tsx');
  const homePageBoundaryClassification = boundaryAudit.results.find((r) => r.path === 'src/blueprint/pages/HomePage.tsx');
  const productSurfaceClassification = boundaryAudit.results.find((r) => r.path === 'src/blueprint/product-surface.ts');
  assert(
    '7. Infrastructure Boundary Authority classifies correctly: AppShell.tsx and pages/HomePage.tsx classify INFRASTRUCTURE, product-surface.ts classifies PRODUCT (fully expected — it is contract-derived data, not composing/rendering code), and zero blueprint file classifies MIXED or UNKNOWN across the full real generated set',
    appShellClassification?.classification === 'INFRASTRUCTURE' &&
      homePageBoundaryClassification?.classification === 'INFRASTRUCTURE' &&
      productSurfaceClassification?.classification === 'PRODUCT' &&
      boundaryAudit.mixedCount === 0 &&
      boundaryAudit.unknownCount === 0,
    `AppShell=${appShellClassification?.classification}, HomePage=${homePageBoundaryClassification?.classification}, product-surface=${productSurfaceClassification?.classification}, mixedCount=${boundaryAudit.mixedCount}, unknownCount=${boundaryAudit.unknownCount}`,
  );

  // ===============================================================================================
  // Scenario 8 — root landing page still generated.
  // ===============================================================================================
  const homeIsDefaultRoute = appShellFile.content.includes("useState<ShellRoute>('home')");
  const homeRouteRendersHomePage = /case 'home':\s*return <HomePage/.test(appShellFile.content);
  assert(
    "8. Root landing page still generated: src/blueprint/pages/HomePage.tsx is a real emitted file, AppShell.tsx's route state still defaults to 'home', and the 'home' route still renders <HomePage /> — removing rootNavigationSurface from product navigation did not remove the root surface itself",
    homePageFile !== undefined && homeIsDefaultRoute && homeRouteRendersHomePage,
    `homePageFile present=${homePageFile !== undefined}, defaultsToHome=${homeIsDefaultRoute}, homeRouteRendersHomePage=${homeRouteRendersHomePage}`,
  );

  // ===============================================================================================
  // Scenario 9 — root landing page no longer produces a contract-traceability failure, WITH a
  // regression contrast proving the pre-fix bug (re-adding "Home" to the compared set reproduces it).
  // ===============================================================================================
  const homeChainAfterFix = traceabilityChains.find((t) => t.artifactKind === 'NAVIGATION_ITEM' && t.artifact === 'Home');
  const evidenceWithHomeReintroduced: GpcaPipelineEvidenceInput = {
    ...productEvidenceForTraceability,
    proposed: { ...productEvidenceForTraceability.proposed, navigationLabels: [...productNavLabels, 'Home'] },
  };
  const chainsWithHomeReintroduced = buildContractTraceabilityChains(evidenceWithHomeReintroduced);
  const homeChainIfReintroduced = chainsWithHomeReintroduced.find((t) => t.artifactKind === 'NAVIGATION_ITEM' && t.artifact === 'Home');
  assert(
    '9. Root landing page no longer produces COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE: "Home" has no NAVIGATION_ITEM traceability entry at all in the real, post-fix evidence (it was never handed to the traceability check), while artificially reintroducing "Home" into evidence.proposed.navigationLabels (simulating the pre-fix defect) reproduces exactly the unproven NAVIGATION_ITEM entry that used to block real builds — proving both that the bug was real and that the fix removes it at the evidence layer, not by weakening the traceability check',
    homeChainAfterFix === undefined && homeChainIfReintroduced !== undefined && homeChainIfReintroduced.proven === false,
    `homeChainAfterFix=${JSON.stringify(homeChainAfterFix)}, homeChainIfReintroduced=${JSON.stringify(homeChainIfReintroduced)}`,
  );

  // ===============================================================================================
  // Scenario 10 — Home-like infrastructure labels never require CBGA approval.
  // ===============================================================================================
  const zeroApprovalContractBypass = detectContractBypassedInputs(productEvidenceForTraceability);
  const unprovenNavigationChains = navItemChains.filter((t) => !t.proven);
  assert(
    '10. Home-like infrastructure labels never require CBGA approval: with a real CBGA navigationPlan that (correctly) never contains a "Home" entry, the real generated build\'s NAVIGATION_ITEM traceability results contain zero unproven entries and zero navigation contract-bypass findings — "Home" simply never enters the comparison, so no approval was ever needed for it (module/route traceability is out of this navigation-scoped milestone and intentionally not asserted here)',
    !zeroApprovalContractBypass.navigationBypass.length && unprovenNavigationChains.length === 0,
    `navigationBypass=${JSON.stringify(zeroApprovalContractBypass.navigationBypass)}, unprovenNavigationChains=${JSON.stringify(unprovenNavigationChains)}`,
  );

  // ===============================================================================================
  // Scenario 11 — business navigation still requires CBGA approval.
  // ===============================================================================================
  const evidenceWithUnapprovedBusinessLabel: GpcaPipelineEvidenceInput = {
    ...productEvidenceForTraceability,
    proposed: { ...productEvidenceForTraceability.proposed, navigationLabels: [...productNavLabels, 'Invoices'] },
  };
  const unapprovedBusinessBypass = detectContractBypassedInputs(evidenceWithUnapprovedBusinessLabel);
  const unapprovedBusinessChains = buildContractTraceabilityChains(evidenceWithUnapprovedBusinessLabel);
  const invoicesChain = unapprovedBusinessChains.find((t) => t.artifactKind === 'NAVIGATION_ITEM' && t.artifact === 'Invoices');
  assert(
    '11. Business navigation still requires CBGA approval: injecting an unapproved business label ("Invoices", not in CBGA\'s navigationPlan) into evidence.proposed.navigationLabels still produces an unproven NAVIGATION_ITEM traceability entry — GPCA\'s unmodified navigationTraceability() still requires a real CbgaNavigationPlanItem match for genuine business navigation',
    invoicesChain !== undefined && invoicesChain.proven === false,
    `invoicesChain=${JSON.stringify(invoicesChain)}, contractBypassDetected=${unapprovedBusinessBypass.detected}`,
  );

  // ===============================================================================================
  // Scenario 12 — unapproved business navigation still blocks (full gate outcome, not just the
  // traceability chain in isolation).
  // ===============================================================================================
  const unprovenArtifactsWithUnapprovedBusinessLabel = unapprovedBusinessChains.filter((t) => !t.proven);
  assert(
    '12. Unapproved business navigation still blocks: the full traceability result set for the unapproved-"Invoices" evidence contains at least one unproven artifact (exactly the condition generation-pipeline-compliance-gate.ts\'s unmodified gate uses to return COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE) — this milestone never weakened that gate condition',
    unprovenArtifactsWithUnapprovedBusinessLabel.length > 0 && unprovenArtifactsWithUnapprovedBusinessLabel.some((t) => t.artifact === 'Invoices'),
    `unprovenArtifacts=${JSON.stringify(unprovenArtifactsWithUnapprovedBusinessLabel.map((t) => t.artifact))}`,
  );

  // ===============================================================================================
  // Scenarios 13-17 — no GPCA/CBGA/Product Faithfulness weakening, no application-specific logic,
  // no VERE work.
  // ===============================================================================================
  const TOUCHED_PRODUCTION_FILES = [
    'src/infrastructure-product-boundary-authority-v1/infrastructure-navigation-model.ts',
    'src/infrastructure-product-boundary-authority-v1/index.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-types.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
    'src/universal-app-blueprint/universal-app-blueprint-product-surface.ts',
    'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
    'src/universal-app-blueprint/index.ts',
  ];

  // GPCA's actual judging logic (gate ordering, detectors, scoring, traceability rules, boundary
  // classifier signal rules) lives in files this milestone never touched at all. A raw `git diff`
  // against HEAD would also capture every OTHER still-uncommitted prior milestone's legitimate
  // changes to these same shared files, so — exactly like every prior milestone's own validator in
  // this codebase — non-weakening is proven by scanning for THIS milestone's own new symbols, never
  // by a blind diff.
  const THIS_MILESTONE_NEW_SYMBOLS = [
    'rootNavigationSurface',
    'InfrastructureNavigationItem',
    'InfrastructureNavigationKind',
    'extractInfrastructureNavigationLabels',
    'isInfrastructureNavigationKind',
    'BLUEPRINT_INFRASTRUCTURE',
    'data-nav-kind',
    'Contract-Bound Root Navigation Authority',
  ];
  function fileContainsAnyMilestoneSymbol(relPath: string): boolean {
    const abs = join(ROOT, relPath);
    if (!existsSync(abs)) return false;
    const content = readFileSync(abs, 'utf8');
    return THIS_MILESTONE_NEW_SYMBOLS.some((sym) => content.includes(sym));
  }
  function anyFileInDirContainsAnyMilestoneSymbol(dirRelPath: string): string | null {
    const abs = join(ROOT, dirRelPath);
    if (!existsSync(abs)) return null;
    const stack = [abs];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = readFileSync(full, 'utf8');
          const hit = THIS_MILESTONE_NEW_SYMBOLS.find((sym) => content.includes(sym));
          if (hit) return `${relative(ROOT, full)} contains "${hit}"`;
        }
      }
    }
    return null;
  }

  const UNTOUCHED_GPCA_JUDGMENT_FILES = [
    'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
    'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-stage-discovery.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-signal-detection.ts',
    'src/infrastructure-product-boundary-authority-v1/business-content-signal-detection.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-classifier.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-verifier.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-types.ts',
  ];
  const judgmentFileHits = UNTOUCHED_GPCA_JUDGMENT_FILES.filter(fileContainsAnyMilestoneSymbol);
  // Within the three GPCA evidence files this milestone DID touch, confirm the change is strictly
  // additive: the pre-existing DOM-block scan, the pre-existing `label:` field scan, and the
  // pre-existing default-shell-navigation-generic-shell check are all still present verbatim.
  const renderedFingerprintsSource = readSource('src/generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.ts');
  const renderedCollectorSource = readSource('src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts');
  const preExistingScanPreserved =
    renderedFingerprintsSource.includes(`extractTagContents(block, NAVIGATION_TAG_NAMES)`) &&
    renderedFingerprintsSource.includes(`extractQuotedFieldValues(source, 'label')`) &&
    renderedCollectorSource.includes(`nonSystemShellNavLabels`) &&
    renderedCollectorSource.includes(`navigationIsFullyGenericShell`);
  assert(
    "13. No GPCA weakening: none of this milestone's own new symbols appear anywhere in GPCA's actual judgment files (gate/detectors/scoring/traceability/boundary-classifier signal rules — files this milestone never touched); the 3 evidence-layer files this milestone DID touch preserve their pre-existing DOM/field navigation-label scan and generic-shell-navigation check verbatim (this milestone only ADDS an exclusion filter on top, per scenario 6's direct proof, and scenarios 11/12 prove unapproved business navigation still blocks exactly as before)",
    judgmentFileHits.length === 0 && preExistingScanPreserved,
    `judgmentFileHits=${JSON.stringify(judgmentFileHits)}, preExistingScanPreserved=${preExistingScanPreserved}`,
  );

  const cbgaHit = anyFileInDirContainsAnyMilestoneSymbol('src/contract-bound-generation-authority-v4');
  assert(
    '14. No CBGA weakening: none of this milestone\'s own new symbols appear anywhere under src/contract-bound-generation-authority-v4 — this milestone only READS CbgaGenerationReport.navigationPlan (an existing, unmodified field) via the existing, unmodified runContractBoundGenerationAuthority()',
    cbgaHit === null,
    cbgaHit === null ? 'no milestone symbol found in CBGA' : cbgaHit,
  );

  const pfHit = anyFileInDirContainsAnyMilestoneSymbol('src/product-faithfulness-v1') ?? anyFileInDirContainsAnyMilestoneSymbol('src/product-faithfulness-v2');
  assert(
    '15. No Product Faithfulness weakening: none of this milestone\'s own new symbols appear anywhere under src/product-faithfulness-v1 or src/product-faithfulness-v2 (this milestone never touched either directory)',
    pfHit === null,
    pfHit === null ? 'no milestone symbol found in Product Faithfulness v1/v2' : pfHit,
  );

  const touchedFilesDiff = execSync(
    `git diff -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`,
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 },
  ).toString();
  const addedCodeLines = touchedFilesDiff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /\b(domain|product|profile|appname|moduleid)\b\s*===\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|dashboard|authentication|crud|todo|medical|finance|lisa)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
    /\[\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|todo|medical|finance|lisa)['"]\s*,/i,
  ];
  const HARDCODED_DOMAIN_WORDS = ['restaurant', 'calculator', 'crm', 'booking', 'inventory', 'notes', 'dashboard-app', 'authentication-app', 'crud-app', 'lisa'];
  const logicHits = addedCodeLines.filter((l) => APPLICATION_SPECIFIC_LOGIC_PATTERNS.some((p) => p.test(l)));
  const hardcodedDomainHits = addedCodeLines.filter((l) =>
    HARDCODED_DOMAIN_WORDS.some((w) => new RegExp(`['"\`][^'"\`]*\\b${w}\\b[^'"\`]*['"\`]`, 'i').test(l)),
  );
  assert(
    "16. No application-specific logic: none of this milestone's own added code lines (git diff, comments excluded) branch on a hardcoded product/domain word — the Infrastructure Navigation model classifies by generic structural kind (ROOT_SURFACE/ROOT_LAYOUT/ROOT_CONTAINER/APPLICATION_FRAME/ENTRY_SURFACE) only, never by a specific label like \"Home\" or a specific application",
    logicHits.length === 0 && hardcodedDomainHits.length === 0,
    `logicHits=${JSON.stringify(logicHits)}, hardcodedDomainHits=${JSON.stringify(hardcodedDomainHits)}`,
  );

  const vereHit = existsSync(join(ROOT, 'src', 'vere-v1')) ? anyFileInDirContainsAnyMilestoneSymbol('src/vere-v1') : null;
  const touchedFilesReferenceVere = TOUCHED_PRODUCTION_FILES.some((f) => /\bvere\b/i.test(readSource(f)));
  assert(
    '17. No VERE work: this milestone never touched any VERE directory/file, and none of the files this milestone DID touch reference VERE in any way',
    vereHit === null && !touchedFilesReferenceVere,
    `vereHit=${vereHit}, touchedFilesReferenceVere=${touchedFilesReferenceVere}`,
  );

  // ===============================================================================================
  // Scenario 18 — no NEW TypeScript errors introduced in touched files (git-stash baseline diff,
  // same technique used by every prior GPCA/blueprint milestone validator in this codebase).
  // ===============================================================================================
  function runTsc(): { lines: string[]; failedToRun: boolean } {
    let output = '';
    let failedToRun = false;
    try {
      output = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      if (!output) failedToRun = true;
    }
    const lines = output.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
    return { lines, failedToRun };
  }
  function touchedFileErrorSignatures(lines: string[]): Set<string> {
    const sigs = new Set<string>();
    for (const l of lines) {
      const normalized = l.replace(/\\/g, '/');
      const matchedFile = TOUCHED_PRODUCTION_FILES.find((f) => normalized.startsWith(f));
      if (!matchedFile) continue;
      const signature = normalized.replace(/\(\d+,\d+\)/, '(L,C)');
      sigs.add(signature);
    }
    return sigs;
  }

  const current = runTsc();
  const currentTouchedSignatures = touchedFileErrorSignatures(current.lines);

  let baselineTouchedSignatures = new Set<string>();
  let baselineFailedToRun = false;
  let stashed = false;
  try {
    const stashOutput = execSync(
      `git stash push -u -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`,
      { cwd: ROOT, encoding: 'utf8' },
    );
    stashed = !/No local changes to save/i.test(stashOutput);
    const baseline = runTsc();
    baselineFailedToRun = baseline.failedToRun;
    baselineTouchedSignatures = touchedFileErrorSignatures(baseline.lines);
  } catch {
    baselineFailedToRun = true;
  } finally {
    if (stashed) {
      try {
        execSync('git stash pop', { cwd: ROOT, encoding: 'utf8' });
      } catch (popErr) {
        throw new Error(`CRITICAL: failed to restore git stash after scenario 18 baseline tsc run — working tree may be left stashed. Run "git stash pop" manually. ${String(popErr)}`);
      }
    }
  }

  const newErrorSignatures = [...currentTouchedSignatures].filter((s) => !baselineTouchedSignatures.has(s));
  assert(
    '18. No new TypeScript errors introduced in touched files',
    !current.failedToRun && !baselineFailedToRun && newErrorSignatures.length === 0,
    current.failedToRun || baselineFailedToRun
      ? `tsc did not run/produce output (currentFailed=${current.failedToRun}, baselineFailed=${baselineFailedToRun})`
      : `pre-existing touched-file errors (unrelated to this milestone, not counted)=${baselineTouchedSignatures.size}, NEW touched-file errors=${newErrorSignatures.length}${newErrorSignatures.length > 0 ? `: ${newErrorSignatures.join(' | ')}` : ''}`,
  );

  // ===============================================================================================
  // Scenario 19 — mandatory Capability Matrix row.
  // ===============================================================================================
  const rootNavRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Contract-Bound Root Navigation Authority');
  assert(
    '19. Capability Matrix included: a dedicated "Contract-Bound Root Navigation Authority" row exists with Status/Production Wired/Auto Run/Activation Allowed/Notes',
    rootNavRow !== undefined && rootNavRow.status === 'IMPLEMENTED' && rootNavRow.productionWired === 'YES',
    `row present=${rootNavRow !== undefined}, status=${rootNavRow?.status}, productionWired=${rootNavRow?.productionWired}`,
  );

  // ===============================================================================================
  // Scenario 20 — production wiring verified: the REAL production generator function
  // (buildUniversalBlueprintWorkspaceFiles, the exact function one-prompt-build-orchestrator.ts calls)
  // actually emits rootNavigationSurface/data-nav-kind into the real generated files — not merely a
  // type-level change nobody's production code path reaches.
  // ===============================================================================================
  const productSurfaceEmitsRootSurface =
    productSurfaceFile.content.includes('rootNavigationSurface') &&
    productSurfaceFile.content.includes('ROOT_SURFACE') &&
    productSurfaceFile.content.includes('BLUEPRINT_INFRASTRUCTURE');
  const appShellEmitsDomMarker = appShellFile.content.includes('data-nav-kind') && appShellFile.content.includes('rootNavigationSurface');
  assert(
    '20. Production wiring verified: buildUniversalBlueprintWorkspaceFiles() — the exact function one-prompt-build-orchestrator.ts calls in production — emits a real rootNavigationSurface object (kind ROOT_SURFACE, provenance BLUEPRINT_INFRASTRUCTURE) into the real generated src/blueprint/product-surface.ts, and a real data-nav-kind DOM marker referencing it into the real generated src/blueprint/AppShell.tsx',
    productSurfaceEmitsRootSurface && appShellEmitsDomMarker,
    `product-surface.ts emits rootNavigationSurface=${productSurfaceEmitsRootSurface}, AppShell.tsx emits data-nav-kind marker=${appShellEmitsDomMarker}`,
  );

  // Sanity guard: keep this import alive as a compile-time proof this validator depends on the real
  // generic infrastructure-navigation-kind taxonomy, not a locally re-declared copy.
  void INFRASTRUCTURE_NAVIGATION_KINDS;
  void extractInfrastructureNavigationLabels;
  void extractNavigationLabels;

  // -------------------------------------------------------------------------------------------
  // Report + exit
  // -------------------------------------------------------------------------------------------
  let failCount = 0;
  for (const r of results) {
    const marker = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failCount += 1;
    // eslint-disable-next-line no-console
    console.log(`${marker} — ${r.name}${r.passed ? '' : ` :: ${r.detail}`}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${results.length - failCount}/${results.length} scenarios passed.`);

  // eslint-disable-next-line no-console
  console.log('\n## Mandatory Capability Matrix\n');
  // eslint-disable-next-line no-console
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  // eslint-disable-next-line no-console
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  for (const row of GPCA_CAPABILITY_MATRIX_ROWS) {
    // eslint-disable-next-line no-console
    console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);
  }

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
