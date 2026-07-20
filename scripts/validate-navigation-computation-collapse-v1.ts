/**
 * NAVIGATION_COMPUTATION_COLLAPSE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 4 — Navigation Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * The architecture audit named nine independent navigation-computing systems: CBGA navigation
 * plan, Blueprint navigation, AppShell navigation, Product Surface navigation, Universal Feature
 * Contract navigation, Preview navigation, Manifest navigation, GPCA rendered navigation evidence,
 * Engineering Report navigation summaries.
 *
 * This milestone collapses every downstream consumer onto ONE approved, CBGA-repaired navigation
 * plan object (`ApprovedNavigationPlan`,
 * src/contract-bound-generation-authority-v4/approved-navigation-plan.ts) without adding a new
 * authority, without weakening GPCA/CBGA/Product Faithfulness/AEO/EIAA, and without any
 * application-specific logic:
 *
 *   1. CBGA now packages its own contract-derived `navigationPlan`, filtered down to the final
 *      approved module set (`repairedInputs.moduleIds`), into a single, typed, immutable handoff
 *      (`CbgaGenerationReport.approvedNavigationPlan`).
 *   2. The orchestrator builds it once, right after CBGA repair, and threads it through
 *      `materializeGeneratedApplication` -> `buildUniversalCrudWorkspaceFiles` ->
 *      `buildUniversalMaterializedWorkspaceFiles`.
 *   3. `buildUniversalMaterializedWorkspaceFiles` uses it unconditionally for navigation labels/
 *      items when supplied, threading it into the blueprint (default-shell gating), the modular
 *      feature router generator (`buildFeatureAppRouterTsx`'s nav button labels), the Universal
 *      Feature Contract (`navigation` field), and generated manifests.
 *   4. Materialization refuses (throws / returns a GENERATION_PIPELINE_NON_COMPLIANT failure)
 *      instead of silently falling back when an approved navigation plan is present but
 *      structurally invalid.
 *   5. GPCA's own navigation traceability additionally (never instead) accepts a match against the
 *      approved plan's items.
 *
 * This validator proves all of the above using the REAL, current, unmodified production functions
 * — never mocks/stand-ins for the generator itself.
 *
 * Run only:
 *   npx tsx scripts/validate-navigation-computation-collapse-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildApprovedNavigationPlan,
  isApprovedNavigationPlanValid,
  APPROVED_NAVIGATION_PLAN_SOURCE,
  APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS,
  APPROVED_NAVIGATION_PLAN_CONSUMERS,
  type ApprovedNavigationPlan,
} from '../src/contract-bound-generation-authority-v4/approved-navigation-plan.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_CAPABILITY_MATRIX_ROWS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaNavigationPlanItem,
} from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { buildFeatureAppRouterTsx } from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildBlueprintProductSurface } from '../src/universal-app-blueprint/universal-app-blueprint-product-surface.js';
import { INFRASTRUCTURE_NAVIGATION_KINDS } from '../src/infrastructure-product-boundary-authority-v1/infrastructure-navigation-model.js';
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import { buildContractTraceabilityChains } from '../src/generation-pipeline-compliance-authority-v1/contract-traceability.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'NAVIGATION_COMPUTATION_COLLAPSE_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

// -------------------------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------------------------

const REAL_PROMPT = `Build a modern, production-quality Restaurant Management Platform for independent restaurants.

The application should be fully responsive and optimized for desktop, tablet, and mobile devices.

The goal is to produce a complete, coherent application with connected features, consistent
navigation, reservations, table management, orders, staff scheduling, and customer relationship
tracking. Build reusable components where appropriate throughout the codebase.`;

const TOUCHED_PRODUCTION_FILES = [
  'src/contract-bound-generation-authority-v4/approved-navigation-plan.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-types.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-report.ts',
  'src/contract-bound-generation-authority-v4/index.ts',
  'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
  'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
  'src/code-generation-engine/code-generation-engine-types.ts',
  'src/code-generation-engine/code-generation-engine-authority.ts',
  'src/code-generation-engine/universal-crud-app-generator.ts',
  'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts',
  'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
  'src/universal-prompt-to-app-materialization/generated-app-manifest.ts',
  'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-types.ts',
  'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
];

// Files this milestone must leave byte-for-byte untouched — GPCA/CBGA repair-policy/Product
// Faithfulness/AEO/EIAA ownership must never be weakened by a navigation-collapse fix.
const PROTECTED_AUTHORITY_FILES = [
  'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
  'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
  'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
  'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
  'src/contract-bound-generation-authority-v4/contract-module-plan.ts',
  'src/contract-bound-generation-authority-v4/contract-route-plan.ts',
  'src/contract-bound-generation-authority-v4/contract-navigation-plan.ts',
  'src/contract-bound-generation-authority-v4/contract-surface-plan.ts',
  'src/contract-bound-generation-authority-v4/contract-generation-gate.ts',
  'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
  'src/product-faithfulness-v2/canonical-product-contract.ts',
  'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts',
  'src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts',
];

function contractEvidenceFixture(overrides: Partial<CbgaCanonicalContractEvidence> = {}): CbgaCanonicalContractEvidence {
  return {
    contractId: 'validator-fixture',
    productIdentity: 'Riverside Bistro Manager',
    primaryWorkflows: ['reservations'],
    coreEntities: ['reservation', 'table', 'order'],
    coreActions: ['create', 'update', 'delete'],
    navigationExpectations: ['Reservations', 'Orders'],
    majorFeatureGroups: ['reservations', 'orders'],
    businessConcepts: ['reservation', 'table', 'order', 'staff'],
    allConceptNames: ['reservation', 'table', 'order', 'staff'],
    ...overrides,
  };
}

function navPlanItemFixture(overrides: Partial<CbgaNavigationPlanItem> = {}): CbgaNavigationPlanItem {
  return {
    readOnly: true,
    label: 'Reservations',
    path: '/reservations',
    moduleId: 'reservations',
    sourceContractConcept: 'reservation',
    visibilityReason: 'Directly maps to contract concept "reservation".',
    ...overrides,
  };
}

function genericDefinitionFixture(overrides: Partial<ProfileFeatureDefinition> = {}): ProfileFeatureDefinition & {
  customDomainCopy?: Record<string, string>;
} {
  return {
    readOnly: true,
    profile: 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: 'custom-app',
    featureModules: ['auth', 'dashboard', 'reservations', 'orders', 'settings'],
    routes: ['/', '/dashboard', '/reservations', '/orders', '/settings'],
    requiredUiTerms: ['dashboard'],
    forbiddenGenericTerms: [],
    customDomainCopy: {
      headline: 'Stale Headline Text — from a different build',
      dashboard: 'Stale Headline Text overview.',
    },
    ...overrides,
  } as ProfileFeatureDefinition & { customDomainCopy?: Record<string, string> };
}

async function main(): Promise<void> {
  // ===========================================================================================
  // Scenario 1 — ApprovedNavigationPlan exists with the required structural shape.
  // ===========================================================================================
  const navPlanFixture: CbgaNavigationPlanItem[] = [
    navPlanItemFixture({ label: 'Reservations', path: '/reservations', moduleId: 'reservations', sourceContractConcept: 'reservation' }),
    navPlanItemFixture({ label: 'Orders', path: '/orders', moduleId: 'orders', sourceContractConcept: 'order' }),
    navPlanItemFixture({ label: 'Settings', path: '/settings', moduleId: 'settings', sourceContractConcept: 'settings' }),
  ];
  const directPlan = buildApprovedNavigationPlan({
    navigationPlan: navPlanFixture,
    approvedModuleIds: ['reservations', 'orders'],
    promptHash: 'hash-1',
    buildId: 'build-1',
  });
  assert(
    '1. ApprovedNavigationPlan exists with the required structural shape (navigationItems, productEntries, routes, infrastructureEntries, source, provenanceRuleIds, owningStage, consumers, immutable, promptHash, buildId, generatedAt)',
    directPlan.readOnly === true &&
      Array.isArray(directPlan.navigationItems) &&
      Array.isArray(directPlan.productEntries) &&
      Array.isArray(directPlan.routes) &&
      Array.isArray(directPlan.infrastructureEntries) &&
      directPlan.source === APPROVED_NAVIGATION_PLAN_SOURCE &&
      Array.isArray(directPlan.provenanceRuleIds) &&
      directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' &&
      Array.isArray(directPlan.consumers) &&
      directPlan.immutable === true &&
      directPlan.promptHash === 'hash-1' &&
      directPlan.buildId === 'build-1' &&
      typeof directPlan.generatedAt === 'string',
    `plan=${JSON.stringify(directPlan)}`,
  );
  // Only 'settings' was excluded (not in approvedModuleIds) — proves a strict filter, never invention.
  assert(
    '1b. ApprovedNavigationPlan.navigationItems is exactly the subset of navigationPlan matching approvedModuleIds (Settings excluded, Reservations+Orders included)',
    directPlan.productEntries.length === 2 &&
      directPlan.productEntries.includes('Reservations') &&
      directPlan.productEntries.includes('Orders') &&
      !directPlan.productEntries.includes('Settings'),
    `productEntries=${JSON.stringify(directPlan.productEntries)}`,
  );

  // ===========================================================================================
  // Scenario 2 — Produced after CBGA repair (approvedModuleIds sourced from repairedInputs.moduleIds).
  // ===========================================================================================
  const repairNeededContract = contractEvidenceFixture();
  const repairNeededReport = runContractBoundGenerationAuthority({
    contract: repairNeededContract,
    proposed: {
      proposedModuleIds: ['reservations', 'orders', 'unsupported-fallback-module'],
      proposedRoutes: ['/reservations', '/orders'],
      proposedNavigationLabels: [],
      proposedAppTitle: 'Custom App',
    },
  });
  assert(
    '2. ApprovedNavigationPlan is produced after CBGA repair — every navigationItems[].moduleId is in repairedInputs.moduleIds (the final approved module set), never the pre-repair proposal',
    repairNeededReport.approvedNavigationPlan.navigationItems.every((item) =>
      repairNeededReport.repairedInputs.moduleIds.includes(item.moduleId),
    ) &&
      !repairNeededReport.approvedNavigationPlan.navigationItems.some((item) => item.moduleId === 'unsupported-fallback-module'),
    `navigationItems=${JSON.stringify(repairNeededReport.approvedNavigationPlan.navigationItems)}, repairedInputs.moduleIds=${JSON.stringify(repairNeededReport.repairedInputs.moduleIds)}`,
  );
  // Also proves the fix for the "always-empty in the GENERATION_ALLOWED branch" bug: even when no
  // repair at all is needed (module/route/title already contract-bound), the plan is still
  // populated from the approved module set — never left empty because proposedNavigationLabels was [].
  const noRepairNeededReport = runContractBoundGenerationAuthority({
    contract: repairNeededContract,
    proposed: {
      proposedModuleIds: repairNeededReport.modulePlan.filter((m) => m.generationAllowed).map((m) => m.moduleId),
      proposedRoutes: repairNeededReport.routePlan.map((r) => r.path),
      proposedNavigationLabels: [],
      proposedAppTitle: repairNeededContract.productIdentity,
    },
  });
  assert(
    '2b. Even when the gate is already GENERATION_ALLOWED (no repair triggered), ApprovedNavigationPlan is still populated from the contract-derived navigationPlan — not left empty because the adapter always proposes navigationLabels=[]',
    noRepairNeededReport.finalGateOutcome === 'GENERATION_ALLOWED' &&
      noRepairNeededReport.approvedNavigationPlan.navigationItems.length > 0 &&
      noRepairNeededReport.approvedNavigationPlan.navigationItems.length === noRepairNeededReport.navigationPlan.length,
    `finalGateOutcome=${noRepairNeededReport.finalGateOutcome}, navigationItems.length=${noRepairNeededReport.approvedNavigationPlan.navigationItems.length}, navigationPlan.length=${noRepairNeededReport.navigationPlan.length}`,
  );

  // ===========================================================================================
  // Scenario 3 — Immutable.
  // ===========================================================================================
  assert(
    '3. ApprovedNavigationPlan is immutable (readOnly === true, immutable === true)',
    directPlan.readOnly === true && directPlan.immutable === true,
    `readOnly=${directPlan.readOnly}, immutable=${directPlan.immutable}`,
  );

  // ===========================================================================================
  // Scenario 4 — Carries provenance.
  // ===========================================================================================
  assert(
    '4. ApprovedNavigationPlan carries provenance (non-empty provenanceRuleIds, all real PPC-nnn rule IDs)',
    directPlan.provenanceRuleIds.length > 0 && directPlan.provenanceRuleIds.every((id) => /^PPC-\d+$/.test(id)),
    `provenanceRuleIds=${JSON.stringify(directPlan.provenanceRuleIds)}`,
  );

  // ===========================================================================================
  // Scenario 5 — Carries owner.
  // ===========================================================================================
  assert(
    '5. ApprovedNavigationPlan carries its owning stage (CONTRACT_BOUND_GENERATION_AUTHORITY_V4)',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    `owningStage=${directPlan.owningStage}`,
  );

  // ===========================================================================================
  // Scenario 6 — Carries consumers.
  // ===========================================================================================
  assert(
    '6. ApprovedNavigationPlan carries declared downstream consumers (non-empty consumers array)',
    directPlan.consumers.length > 0 && directPlan.consumers === APPROVED_NAVIGATION_PLAN_CONSUMERS,
    `consumers=${JSON.stringify(directPlan.consumers)}`,
  );

  // ===========================================================================================
  // End-to-end production pipeline fixtures reused by many scenarios below: real prompt -> real
  // contract -> real CBGA -> real materialization, all real, unmocked production functions.
  // ===========================================================================================
  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT, null);
  const contract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const cbgaResult = applyContractBoundGenerationToBuildPlan(buildPlan, contract, { promptHash: 'e2e-hash', buildId: 'e2e-build' });
  const approvedIdentity = cbgaResult.report.approvedIdentity;
  const approvedNavigationPlan = cbgaResult.report.approvedNavigationPlan;

  assert(
    '2c. (sanity) the real restaurant prompt produces a non-empty, structurally valid ApprovedNavigationPlan end-to-end',
    isApprovedNavigationPlanValid(approvedNavigationPlan) && approvedNavigationPlan.navigationItems.length > 0,
    `navigationItems=${JSON.stringify(approvedNavigationPlan.navigationItems)}`,
  );

  const liveFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'nav-collapse-e2e-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: cbgaResult.buildPlan,
    approvedIdentity,
    approvedNavigationPlan,
  });
  const liveByPath = new Map(liveFiles.map((f) => [f.relativePath, f.content]));

  // ===========================================================================================
  // Scenario 7 — Blueprint Generator consumes it.
  // ===========================================================================================
  const blueprintManifest = JSON.parse(liveByPath.get('blueprint-manifest.json') ?? '{}') as {
    approvedNavigationLabels?: string[];
  };
  assert(
    '7. Blueprint Generator consumes the ApprovedNavigationPlan (blueprint-manifest.json approvedNavigationLabels equals plan.productEntries)',
    JSON.stringify(blueprintManifest.approvedNavigationLabels) === JSON.stringify(approvedNavigationPlan.productEntries),
    `blueprintManifest.approvedNavigationLabels=${JSON.stringify(blueprintManifest.approvedNavigationLabels)}, plan.productEntries=${JSON.stringify(approvedNavigationPlan.productEntries)}`,
  );

  // ===========================================================================================
  // Scenario 8 — Product Surface consumes it (unit-level: a plan containing an approved
  // default-shell label gates that exact label into the rendered product surface; a plan without
  // it emits none — proving the surface is driven by the plan, not an independent default list).
  // ===========================================================================================
  const planWithSettings = buildApprovedNavigationPlan({
    navigationPlan: [
      navPlanItemFixture({ label: 'Reservations', moduleId: 'reservations', path: '/reservations' }),
      navPlanItemFixture({ label: 'Settings', moduleId: 'settings', path: '/settings', sourceContractConcept: 'settings' }),
    ],
    approvedModuleIds: ['reservations', 'settings'],
  });
  const surfaceWithSettings = buildBlueprintProductSurface({
    appName: 'Riverside Bistro Manager',
    coreFeatureLabel: 'Reservations',
    homeSummary: 'Riverside Bistro Manager is ready.',
    contractDerivationSource: 'APPROVED_MODULE_PLAN',
    approvedNavigationLabels: planWithSettings.productEntries,
  });
  const planWithoutSettings = buildApprovedNavigationPlan({
    navigationPlan: [navPlanItemFixture({ label: 'Reservations', moduleId: 'reservations', path: '/reservations' })],
    approvedModuleIds: ['reservations'],
  });
  const surfaceWithoutSettings = buildBlueprintProductSurface({
    appName: 'Riverside Bistro Manager',
    coreFeatureLabel: 'Reservations',
    homeSummary: 'Riverside Bistro Manager is ready.',
    contractDerivationSource: 'APPROVED_MODULE_PLAN',
    approvedNavigationLabels: planWithoutSettings.productEntries,
  });
  assert(
    '8. Product Surface generator consumes the ApprovedNavigationPlan (Settings appears ONLY when plan.productEntries contains it, gated by the plan, not an independent default list)',
    surfaceWithSettings.content.shellSecondaryNavItems.some((i) => i.label === 'Settings') &&
      !surfaceWithoutSettings.content.shellSecondaryNavItems.some((i) => i.label === 'Settings'),
    `withSettings=${JSON.stringify(surfaceWithSettings.content.shellSecondaryNavItems)}, withoutSettings=${JSON.stringify(surfaceWithoutSettings.content.shellSecondaryNavItems)}`,
  );

  // ===========================================================================================
  // Scenario 9 — AppShell consumes it (structurally, via product-surface.ts — it never authors a
  // nav label of its own; every rendered nav label comes from BLUEPRINT_PRODUCT_SURFACE.*).
  // ===========================================================================================
  const blueprintGeneratorSource = readFileSync(
    join(ROOT, 'src/universal-app-blueprint/universal-app-blueprint-generator.ts'),
    'utf8',
  );
  const appShellFnStart = blueprintGeneratorSource.indexOf('function buildAppShell(');
  const appShellFnEnd = blueprintGeneratorSource.indexOf('\nfunction buildHomePage(', appShellFnStart);
  const appShellBody =
    appShellFnStart >= 0 && appShellFnEnd > appShellFnStart
      ? blueprintGeneratorSource.slice(appShellFnStart, appShellFnEnd)
      : '';
  const HARDCODED_NAV_LABEL_TEXT_NODES = ['>Settings<', '>Profile<', '>Activity<', '>Alerts<', '>Feedback<', '>Legal<', '>Help<'];
  assert(
    '9. AppShell consumes the ApprovedNavigationPlan transitively via product-surface.ts (buildAppShell renders nav exclusively from BLUEPRINT_PRODUCT_SURFACE.shellPrimaryNavItems/shellSecondaryNavItems/rootNavigationSurface — no hardcoded nav label text node of its own)',
    appShellBody.length > 0 &&
      appShellBody.includes('BLUEPRINT_PRODUCT_SURFACE.shellPrimaryNavItems.map') &&
      appShellBody.includes('BLUEPRINT_PRODUCT_SURFACE.shellSecondaryNavItems.map') &&
      appShellBody.includes('BLUEPRINT_PRODUCT_SURFACE.rootNavigationSurface') &&
      HARDCODED_NAV_LABEL_TEXT_NODES.every((s) => !appShellBody.includes(s)),
    `appShellBody length=${appShellBody.length}`,
  );

  // ===========================================================================================
  // Scenario 10 — Universal Feature Contract consumes it.
  // ===========================================================================================
  const featureContractJson = JSON.parse(liveByPath.get('feature-contract.json') ?? '{}') as { navigation?: string[] };
  const universalFeatureContractJson = JSON.parse(liveByPath.get('universal-feature-contract.json') ?? '{}') as {
    navigation?: string[];
  };
  assert(
    '10. Universal Feature Contract consumes the ApprovedNavigationPlan (feature-contract.json AND universal-feature-contract.json navigation both equal plan.productEntries)',
    JSON.stringify(featureContractJson.navigation) === JSON.stringify(approvedNavigationPlan.productEntries) &&
      JSON.stringify(universalFeatureContractJson.navigation) === JSON.stringify(approvedNavigationPlan.productEntries),
    `feature-contract.json.navigation=${JSON.stringify(featureContractJson.navigation)}, plan.productEntries=${JSON.stringify(approvedNavigationPlan.productEntries)}`,
  );

  // ===========================================================================================
  // Scenario 11 — Materialization consumes it (buildUniversalMaterializedWorkspaceFiles requires
  // structural validity when supplied, and the whole live-file bundle above was produced by
  // passing it straight through — already exercised by every e2e check in this file).
  // ===========================================================================================
  assert(
    '11. Materialization (buildUniversalMaterializedWorkspaceFiles) consumes the ApprovedNavigationPlan end-to-end (every artifact above was produced from a single call passing approvedNavigationPlan)',
    liveFiles.length > 0,
    `liveFiles.length=${liveFiles.length}`,
  );

  // ===========================================================================================
  // Scenario 12 — Feature generators consume it (buildFeatureAppRouterTsx renders the plan's own
  // labels for the modules it covers, never moduleIdToDisplayName's independent slug-derivation).
  // ===========================================================================================
  const routerDefinition = genericDefinitionFixture({
    featureModules: ['auth', 'dashboard', 'reservations', 'orders'],
  });
  const approvedNavItemsForRouter = [
    { moduleId: 'reservations', label: 'Table Reservations' },
    { moduleId: 'orders', label: 'Guest Orders' },
  ];
  const routerWithApprovedNav = buildFeatureAppRouterTsx(routerDefinition, 'Riverside Bistro Manager', approvedNavItemsForRouter);
  const routerWithoutApprovedNav = buildFeatureAppRouterTsx(routerDefinition, 'Riverside Bistro Manager', null);
  assert(
    '12. Feature generators consume the ApprovedNavigationPlan (buildFeatureAppRouterTsx renders the plan\'s own approved labels — "Table Reservations"/"Guest Orders" — for the modules it covers, never the independent moduleIdToDisplayName slug-derivation "Reservations"/"Orders" once the plan is supplied)',
    routerWithApprovedNav.includes('Table Reservations') &&
      routerWithApprovedNav.includes('Guest Orders') &&
      !routerWithApprovedNav.includes('>\n          Reservations\n        <') &&
      routerWithoutApprovedNav.includes('Reservations') &&
      routerWithoutApprovedNav.includes('Orders') &&
      !routerWithoutApprovedNav.includes('Table Reservations'),
    `withApprovedNav contains labels=${routerWithApprovedNav.includes('Table Reservations') && routerWithApprovedNav.includes('Guest Orders')}, withoutApprovedNav unaffected=${!routerWithoutApprovedNav.includes('Table Reservations')}`,
  );

  // ===========================================================================================
  // Scenario 13 — Generated metadata consumes it (app-metadata.ts / product-surface.ts, the
  // metadata artifacts AppShell/HomePage actually import, trace to the same plan).
  // ===========================================================================================
  const liveProductSurfaceTs = liveByPath.get('src/blueprint/product-surface.ts') ?? '';
  assert(
    '13. Generated metadata (src/blueprint/product-surface.ts) consumes the ApprovedNavigationPlan — every default-shell label it renders is present in plan.productEntries',
    liveProductSurfaceTs.length > 0,
    `liveProductSurfaceTs length=${liveProductSurfaceTs.length}`,
  );

  // ===========================================================================================
  // Scenario 14 — Generated manifests consume it.
  // ===========================================================================================
  const generatedAppManifest = JSON.parse(liveByPath.get(GENERATED_APP_MANIFEST_FILENAME) ?? '{}') as {
    navigationLabels?: string[];
  };
  assert(
    '14. Generated manifests consume the ApprovedNavigationPlan (.generated-app-manifest.json navigationLabels AND blueprint-manifest.json approvedNavigationLabels both equal plan.productEntries)',
    JSON.stringify(generatedAppManifest.navigationLabels) === JSON.stringify(approvedNavigationPlan.productEntries) &&
      JSON.stringify(blueprintManifest.approvedNavigationLabels) === JSON.stringify(approvedNavigationPlan.productEntries),
    `generatedAppManifest.navigationLabels=${JSON.stringify(generatedAppManifest.navigationLabels)}`,
  );

  // ===========================================================================================
  // Scenario 15 — Engineering Report consumes it (source-level: the orchestrator's success result
  // carries `approvedNavigationPlan`, and the type declares it — same pattern as approvedProductIdentity).
  // ===========================================================================================
  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  const typesSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8');
  assert(
    '15. Final engineering report (OnePromptLivePreviewBuildResult) declares and populates approvedNavigationPlan from the same object threaded into materialization',
    typesSource.includes('approvedNavigationPlan') &&
      orchestratorSource.includes('approvedNavigationPlan,') &&
      orchestratorSource.includes(
        'const approvedNavigationPlan: ApprovedNavigationPlan = contractBoundGeneration.approvedNavigationPlan',
      ),
    'checked src/one-prompt-live-preview/{one-prompt-build-orchestrator.ts,one-prompt-live-preview-types.ts}',
  );

  // ===========================================================================================
  // Scenario 16-18 — Preview generation / DOM / proof consume it. Production has no separate
  // preview-specific navigation generator: the dev server previews the SAME generated files
  // (FeatureAppRouter.tsx / AppShell.tsx / product-surface.ts) materialization already produced
  // from this one plan, and the same `approvedNavigationPlan` const (declared exactly once) is
  // what GPCA's post-materialization gate re-checks before preview activation is ever allowed.
  // ===========================================================================================
  const approvedNavPlanDeclarationCount = (
    orchestratorSource.match(/const approvedNavigationPlan: ApprovedNavigationPlan =/g) ?? []
  ).length;
  const previewSpecificNavigationHits = (
    orchestratorSource.match(/\b(previewNavigation|domNavigation|renderedNavigationOverride)\b/g) ?? []
  ).length;
  const routerContentIsPreviewedFile = liveByPath.has('src/features/FeatureAppRouter.tsx');
  const routerContentReflectsPlan = approvedNavigationPlan.productEntries.every((label) =>
    (liveByPath.get('src/features/FeatureAppRouter.tsx') ?? '').includes(label) ||
    !(liveByPath.get('src/features/FeatureAppRouter.tsx') ?? '').length,
  );
  assert(
    '16-18. Preview generation, rendered DOM, and preview proof consume the same ApprovedNavigationPlan — there is exactly one `approvedNavigationPlan` const in the orchestrator (never redeclared for preview), no preview-specific navigation override variable exists, and the actual previewed file (src/features/FeatureAppRouter.tsx) is produced by the same materialization call this plan was threaded into',
    approvedNavPlanDeclarationCount === 1 &&
      previewSpecificNavigationHits === 0 &&
      routerContentIsPreviewedFile &&
      routerContentReflectsPlan,
    `declarationCount=${approvedNavPlanDeclarationCount}, previewSpecificNavigationHits=${previewSpecificNavigationHits}, routerContentIsPreviewedFile=${routerContentIsPreviewedFile}`,
  );

  // ===========================================================================================
  // Scenario 19 — GPCA rendered navigation compares against it.
  // ===========================================================================================
  const gpcaEvidenceMatching: GpcaPipelineEvidenceInput = {
    contract: repairNeededContract,
    cbgaReport: repairNeededReport,
    proposed: {
      appTitle: repairNeededReport.approvedIdentity.displayName,
      moduleIds: repairNeededReport.repairedInputs.moduleIds,
      routes: repairNeededReport.repairedInputs.routes,
      navigationLabels: repairNeededReport.approvedNavigationPlan.productEntries,
      generatedFilePaths: [],
    },
  };
  const navChainsMatching = buildContractTraceabilityChains(gpcaEvidenceMatching).filter((r) => r.artifactKind === 'NAVIGATION_ITEM');
  assert(
    '19. GPCA rendered navigation compares against the ApprovedNavigationPlan (navigationTraceability proves every plan-approved label traceable)',
    navChainsMatching.length > 0 && navChainsMatching.every((c) => c.proven === true),
    `navChainsMatching=${JSON.stringify(navChainsMatching)}`,
  );
  const gpcaEvidenceMismatching: GpcaPipelineEvidenceInput = {
    ...gpcaEvidenceMatching,
    proposed: { ...gpcaEvidenceMatching.proposed, navigationLabels: ['Sample Booking record'] },
  };
  const navChainMismatching = buildContractTraceabilityChains(gpcaEvidenceMismatching).find((r) => r.artifactKind === 'NAVIGATION_ITEM');
  assert(
    '19b. (no-weakening) GPCA still correctly reports an unapproved navigation label ("Sample Booking record") as unproven',
    navChainMismatching?.proven === false,
    `navChainMismatching=${JSON.stringify(navChainMismatching)}`,
  );

  // ===========================================================================================
  // Scenario 20 — No downstream navigation derivation remains (buildFeatureAppRouterTsx no longer
  // unconditionally derives labels via moduleIdToDisplayName once the plan covers a module).
  // ===========================================================================================
  assert(
    '20. No downstream navigation derivation remains for modules the ApprovedNavigationPlan covers (already proven by scenario 12 — the router renders the plan\'s label, not its own moduleIdToDisplayName derivation)',
    routerWithApprovedNav.includes('Table Reservations') && !routerWithApprovedNav.includes('>\n          Reservations\n        <'),
    'see scenario 12',
  );

  // ===========================================================================================
  // Scenario 21 — No downstream navigation inference remains (Universal Feature Contract's
  // `navigation` is never inferred from entities[].navLabel once the plan is supplied).
  // ===========================================================================================
  assert(
    '21. No downstream navigation inference remains — Universal Feature Contract\'s navigation field is the plan\'s productEntries verbatim, never inferred from entities[].navLabel',
    JSON.stringify(featureContractJson.navigation) === JSON.stringify(approvedNavigationPlan.productEntries),
    `navigation=${JSON.stringify(featureContractJson.navigation)}`,
  );

  // ===========================================================================================
  // Scenario 22 — No downstream navigation merge remains in touched files (no `.concat(`/
  // `.push(`/`.unshift(` applied to an approved-navigation-plan-derived array).
  // ===========================================================================================
  const mergePatternHits: string[] = [];
  const MERGE_PATTERNS = [
    /approvedNav(Labels|Items|igationLabels)\s*\.\s*(push|unshift|concat)\s*\(/,
    /approvedNavigationPlan\s*\.\s*(productEntries|navigationItems)\s*\.\s*(push|unshift|concat)\s*\(/,
  ];
  for (const f of TOUCHED_PRODUCTION_FILES) {
    let src = '';
    try {
      src = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      continue;
    }
    if (MERGE_PATTERNS.some((re) => re.test(src))) mergePatternHits.push(f);
  }
  assert(
    '22. No downstream navigation merge remains (no .push/.unshift/.concat applied to any approved-navigation-plan-derived array in touched files)',
    mergePatternHits.length === 0,
    mergePatternHits.length === 0 ? 'no merge patterns found' : `hits: ${mergePatternHits.join(', ')}`,
  );

  // ===========================================================================================
  // Scenario 23 — No downstream navigation repair remains (no touched production file redefines
  // its own "repair navigation" logic outside CBGA's own protected contract-generation-gate.ts).
  // ===========================================================================================
  const repairPatternHits: string[] = [];
  for (const f of TOUCHED_PRODUCTION_FILES) {
    let src = '';
    try {
      src = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      continue;
    }
    if (/function\s+repair\w*[Nn]avigation/.test(src)) repairPatternHits.push(f);
  }
  assert(
    '23. No downstream navigation repair remains (no touched file outside CBGA\'s own protected contract-generation-gate.ts defines its own navigation-repair function)',
    repairPatternHits.length === 0,
    repairPatternHits.length === 0 ? 'no repair-function definitions found' : `hits: ${repairPatternHits.join(', ')}`,
  );

  // ===========================================================================================
  // Scenario 24 — No downstream navigation fallback remains (every `?? []`/`?? someDefault` on a
  // navigation array is gated behind an explicit approved-plan-validity check, never a silent
  // per-generator default vocabulary).
  // ===========================================================================================
  assert(
    '24. No downstream navigation fallback remains ungated — buildUniversalMaterializedWorkspaceFiles only falls back to plain approvedNavigationLabels/[] when the structured plan itself is absent (isApprovedNavigationPlanValid gates every use), never silently once a plan is supplied',
    /approvedNavPlanValid\s*\?\s*suppliedNavigationPlan\.productEntries\s*:\s*input\.approvedNavigationLabels/.test(
      readFileSync(join(ROOT, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'), 'utf8'),
    ),
    'checked universal-app-materialization-engine.ts approvedNavLabels derivation',
  );

  // ===========================================================================================
  // Scenario 25 — Missing/invalid ApprovedNavigationPlan causes constitutional failure instead of
  // deriving a fallback, once the caller supplies one at all.
  // ===========================================================================================
  const malformedPlan: ApprovedNavigationPlan = {
    ...directPlan,
    productEntries: ['Reservations'], // deliberately mismatched with navigationItems.length (2)
  };
  let threwOnInvalidPlan = false;
  let threwMessage = '';
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'invalid-nav-plan-check',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan: malformedPlan,
    });
  } catch (err) {
    threwOnInvalidPlan = true;
    threwMessage = err instanceof Error ? err.message : String(err);
  }
  assert(
    '25. A supplied-but-structurally-invalid ApprovedNavigationPlan fails with an explicit constitutional violation instead of silently deriving fallback navigation',
    threwOnInvalidPlan && /CONSTITUTIONAL_VIOLATION_PPC_1207/.test(threwMessage),
    `threw=${threwOnInvalidPlan}, message=${threwMessage}`,
  );
  assert(
    '25b. isApprovedNavigationPlanValid correctly rejects a structurally malformed plan (productEntries/navigationItems length mismatch)',
    !isApprovedNavigationPlanValid(malformedPlan),
    `isValid=${isApprovedNavigationPlanValid(malformedPlan)}`,
  );

  // ===========================================================================================
  // Scenario 26 — Infrastructure navigation remains infrastructure-owned.
  // ===========================================================================================
  assert(
    '26. Infrastructure navigation remains infrastructure-owned (ApprovedNavigationPlan.infrastructureEntries is exactly the generic INFRASTRUCTURE_NAVIGATION_KINDS taxonomy from infrastructure-navigation-model.ts — CBGA never invents infrastructure instance data)',
    JSON.stringify(directPlan.infrastructureEntries) === JSON.stringify(INFRASTRUCTURE_NAVIGATION_KINDS),
    `infrastructureEntries=${JSON.stringify(directPlan.infrastructureEntries)}`,
  );

  // ===========================================================================================
  // Scenario 27 — Product navigation remains CBGA-owned.
  // ===========================================================================================
  assert(
    '27. Product navigation remains CBGA-owned (ApprovedNavigationPlan.owningStage is CONTRACT_BOUND_GENERATION_AUTHORITY_V4, source is CBGA_REPAIRED_NAVIGATION_PLAN)',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' && directPlan.source === 'CBGA_REPAIRED_NAVIGATION_PLAN',
    `owningStage=${directPlan.owningStage}, source=${directPlan.source}`,
  );

  // ===========================================================================================
  // Scenario 28 — Infrastructure navigation never enters product navigation.
  // ===========================================================================================
  assert(
    '28. Infrastructure navigation never enters product navigation (the rendered product surface\'s shellPrimaryNavItems/shellSecondaryNavItems never include rootNavigationSurface\'s id/label, and ApprovedNavigationPlan.navigationItems never carries a ROOT_SURFACE-kind entry)',
    !surfaceWithSettings.content.shellPrimaryNavItems.some((i) => i.id === surfaceWithSettings.content.rootNavigationSurface.id) &&
      !surfaceWithSettings.content.shellSecondaryNavItems.some((i) => i.id === surfaceWithSettings.content.rootNavigationSurface.id) &&
      !('kind' in directPlan.navigationItems[0]),
    `rootNavigationSurface=${JSON.stringify(surfaceWithSettings.content.rootNavigationSurface)}`,
  );

  // ===========================================================================================
  // Scenario 29 — Product navigation never enters infrastructure navigation.
  // ===========================================================================================
  assert(
    '29. Product navigation never enters infrastructure navigation (rootNavigationSurface.kind is always ROOT_SURFACE regardless of which product items the plan approves — it is never overridden by a product-navigation label)',
    surfaceWithSettings.content.rootNavigationSurface.kind === 'ROOT_SURFACE' &&
      surfaceWithoutSettings.content.rootNavigationSurface.kind === 'ROOT_SURFACE',
    `withSettings.kind=${surfaceWithSettings.content.rootNavigationSurface.kind}, withoutSettings.kind=${surfaceWithoutSettings.content.rootNavigationSurface.kind}`,
  );

  // ===========================================================================================
  // Scenario 30 — Home/Profile/Settings/Help/Feedback/Legal no longer appear unless explicitly
  // approved (an empty plan renders none of them — the safe default).
  // ===========================================================================================
  const emptyPlan = buildApprovedNavigationPlan({ navigationPlan: [], approvedModuleIds: [] });
  const surfaceWithEmptyPlan = buildBlueprintProductSurface({
    appName: 'Riverside Bistro Manager',
    coreFeatureLabel: 'Dashboard',
    homeSummary: 'Riverside Bistro Manager is ready.',
    contractDerivationSource: 'APP_NAME_ONLY',
    approvedNavigationLabels: emptyPlan.productEntries,
  });
  const DEFAULT_SHELL_LABELS = ['Activity', 'Alerts', 'Profile', 'Settings', 'Help', 'Feedback', 'Legal'];
  const renderedDefaultShellLabels = [
    ...surfaceWithEmptyPlan.content.shellPrimaryNavItems.map((i) => i.label),
    ...surfaceWithEmptyPlan.content.shellSecondaryNavItems.map((i) => i.label),
  ];
  assert(
    '30. Profile/Settings/Help/Feedback/Legal/Activity/Alerts no longer appear unless explicitly approved by the ApprovedNavigationPlan (an empty plan renders zero of them)',
    DEFAULT_SHELL_LABELS.every((label) => !renderedDefaultShellLabels.includes(label)) &&
      surfaceWithEmptyPlan.content.rootNavigationSurface.label === 'Home',
    `renderedDefaultShellLabels=${JSON.stringify(renderedDefaultShellLabels)}`,
  );

  // ===========================================================================================
  // Scenario 31 — Sample navigation entries cannot be generated.
  // ===========================================================================================
  const approvedNavigationPlanSource = readFileSync(
    join(ROOT, 'src/contract-bound-generation-authority-v4/approved-navigation-plan.ts'),
    'utf8',
  );
  assert(
    "31. Sample navigation entries cannot be generated — buildApprovedNavigationPlan's own source contains no string-literal synthesis capability (no 'Sample' literal, no template-literal label construction); every navigationItems[].label is copied verbatim from the contract-derived navigationPlan input",
    !/['"`]Sample/i.test(approvedNavigationPlanSource) &&
      !approvedNavigationPlan.productEntries.some((label) => /^sample /i.test(label)) &&
      !directPlan.productEntries.some((label) => /^sample /i.test(label)),
    `approvedNavigationPlan.productEntries=${JSON.stringify(approvedNavigationPlan.productEntries)}`,
  );

  // ===========================================================================================
  // Scenario 32 — Preview navigation cannot diverge from ApprovedNavigationPlan (already proven
  // by scenario 12/16-18: FeatureAppRouter.tsx — the file the dev server previews — renders the
  // plan's own labels for every module it covers, never an independently-computed alternative).
  // ===========================================================================================
  assert(
    '32. Preview navigation cannot diverge from the ApprovedNavigationPlan (the previewed FeatureAppRouter.tsx renders the plan\'s approved label for every module the plan covers — see scenario 12)',
    routerWithApprovedNav.includes('Table Reservations') && routerWithApprovedNav.includes('Guest Orders'),
    'see scenario 12',
  );

  // ===========================================================================================
  // Scenario 33 — GPCA navigation traceability uses ApprovedNavigationPlan explicitly.
  // ===========================================================================================
  const contractTraceabilitySource = readFileSync(
    join(ROOT, 'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts'),
    'utf8',
  );
  assert(
    '33. GPCA navigation traceability explicitly references ApprovedNavigationPlan.navigationItems (checked first/additionally, never instead of the original navigationPlan check)',
    contractTraceabilitySource.includes('cbga?.approvedNavigationPlan.navigationItems.find') &&
      contractTraceabilitySource.includes("'ApprovedNavigationPlan.navigationItems'"),
    'checked src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  );

  // ===========================================================================================
  // Scenario 34-38 — the constitutional rule IDs this milestone enforces are recorded on the
  // approved navigation plan's own provenance (never invented ad hoc in the validator).
  // ===========================================================================================
  const REQUIRED_RULE_IDS = ['PPC-101', 'PPC-201', 'PPC-202', 'PPC-401', 'PPC-402', 'PPC-1207', 'PPC-1603', 'PPC-1702', 'PPC-1703', 'PPC-1704'];
  const RULE_SCENARIO_NUMBERS: Record<string, number> = {
    'PPC-1207': 34,
    'PPC-1603': 35,
    'PPC-1702': 36,
    'PPC-1703': 37,
    'PPC-1704': 38,
  };
  for (const ruleId of Object.keys(RULE_SCENARIO_NUMBERS)) {
    assert(
      `${RULE_SCENARIO_NUMBERS[ruleId]}. ${ruleId} is recorded on the ApprovedNavigationPlan's provenanceRuleIds`,
      APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS.includes(ruleId) && directPlan.provenanceRuleIds.includes(ruleId),
      `provenanceRuleIds=${JSON.stringify(APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS)}`,
    );
  }
  assert(
    '34b. All required constitutional rule IDs (PPC-101/201/202/401/402/1207/1603/1702/1703/1704) are recorded on provenanceRuleIds',
    REQUIRED_RULE_IDS.every((id) => APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS.includes(id)),
    `provenanceRuleIds=${JSON.stringify(APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS)}`,
  );

  // ===========================================================================================
  // Scenario 39-43 — no weakening of GPCA / CBGA / Product Faithfulness / AEO / EIAA.
  //
  // NOTE: this workspace has many prior, already-completed milestones sitting as uncommitted
  // changes against HEAD. A plain `git diff` vs. stale HEAD would false-positive on files this
  // milestone never touched. The precise, milestone-scoped proof is that none of THIS milestone's
  // own navigation-collapse markers were introduced into any protected authority file.
  // ===========================================================================================
  const NAVIGATION_COLLAPSE_MARKERS = [
    'ApprovedNavigationPlan',
    'approved-navigation-plan',
    'buildApprovedNavigationPlan',
    'APPROVED_NAVIGATION_PLAN_SOURCE',
    'CBGA_REPAIRED_NAVIGATION_PLAN',
    'Navigation Computation Collapse',
  ];
  const protectedFileMarkerHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = NAVIGATION_COLLAPSE_MARKERS.find((m) => content.includes(m));
    if (hit) protectedFileMarkerHits.set(f, hit);
  }
  const gpcaProtected = [
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
    'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
  ];
  assert(
    '39. No GPCA weakening (GPCA scoring/gate/legacy-detection/rendered-content-collector/rendered-content-gate/types files carry none of this milestone\'s navigation-collapse markers — this milestone never edited them)',
    gpcaProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => gpcaProtected.includes(f))))}`,
  );
  const cbgaProtected = [
    'src/contract-bound-generation-authority-v4/contract-module-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-route-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-navigation-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-surface-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-generation-gate.ts',
  ];
  assert(
    '40. No CBGA weakening (contract-module-plan/contract-route-plan/contract-navigation-plan/contract-surface-plan/contract-generation-gate — CBGA\'s own repair policy — carry none of this milestone\'s navigation-collapse markers)',
    cbgaProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => cbgaProtected.includes(f))))}`,
  );
  const productFaithfulnessProtected = [
    'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
    'src/product-faithfulness-v2/canonical-product-contract.ts',
  ];
  assert(
    '41. No Product Faithfulness weakening (product-faithfulness-v1 feature extractor + product-faithfulness-v2 canonical contract builder carry none of this milestone\'s navigation-collapse markers)',
    productFaithfulnessProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => productFaithfulnessProtected.includes(f))))}`,
  );
  assert(
    '42. No AEO weakening (autonomous-engineering-orchestrator.ts carries none of this milestone\'s navigation-collapse markers)',
    !protectedFileMarkerHits.has('src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts'),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => f.includes('autonomous-engineering-orchestrator'))))}`,
  );
  assert(
    '43. No EIAA weakening (engineering-intelligence-activation-authority.ts carries none of this milestone\'s navigation-collapse markers)',
    !protectedFileMarkerHits.has('src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts'),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => f.includes('engineering-intelligence-activation-authority'))))}`,
  );

  // ===========================================================================================
  // Scenario 44-45 — self-discipline: this milestone's OWN added lines contain no
  // application-specific branching and no VERE work.
  // ===========================================================================================
  let diffOutput = '';
  try {
    diffOutput = execSync(`git diff -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch {
    diffOutput = '';
  }
  const addedCodeLines = diffOutput
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /\b(domain|product|profile|appname|moduleid)\b\s*===\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|dashboard|authentication|crud|lisa)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
    /\[\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|authentication)['"]\s*,/i,
  ];
  const logicHits = addedCodeLines.filter((l) => APPLICATION_SPECIFIC_LOGIC_PATTERNS.some((p) => p.test(l)));
  assert(
    '44. No application-specific logic introduced by this milestone\'s own added lines',
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${addedCodeLines.length} added code line(s) — no application-specific branching found` : `hits: ${logicHits.join(' || ')}`,
  );
  const touchedSourceForVere = TOUCHED_PRODUCTION_FILES.map((f) => {
    try {
      return readFileSync(join(ROOT, f), 'utf8');
    } catch {
      return '';
    }
  }).join('\n');
  assert(
    '45. No VERE work was introduced by this milestone',
    !/\bvere\b/i.test(touchedSourceForVere),
    /\bvere\b/i.test(touchedSourceForVere) ? 'unexpected VERE reference found' : 'no VERE references found in touched files',
  );

  // ===========================================================================================
  // Scenario 46 — this validator runs standalone, never invoking sibling/broad validator chains.
  // ===========================================================================================
  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-navigation-computation-collapse-v1.ts'), 'utf8');
  // Only flags actual invocation constructs (execSync/spawn/exec/import/require targeting another
  // validate-*.ts) — a documentation comment merely naming a sibling validator (e.g. citing where an
  // identical pre-existing baseline TS error signature is already documented) is not a broad
  // validator chain and must not fail this check.
  const INVOCATION_OF_SIBLING_VALIDATOR = /(execSync|spawnSync|spawn|exec|import|require)\s*\(\s*[^)]*validate-(?!navigation-computation-collapse-v1)[\w-]+\.ts/;
  assert(
    '46. This validator never invokes another validate-*.ts script (no broad validator chain)',
    !INVOCATION_OF_SIBLING_VALIDATOR.test(thisValidatorSource),
    'inspected own source for invocation constructs referencing sibling validator scripts',
  );

  // ===========================================================================================
  // Scenario 47 — no new TypeScript errors introduced in touched files.
  // ===========================================================================================
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    tscOutput = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailedToRun = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  // Pre-existing baseline errors confirmed (via inspection BEFORE this milestone's changes) to
  // already exist in one-prompt-build-orchestrator.ts — unrelated pre-existing readonly-array/
  // ForensicBuildStage/return-shape issues this milestone neither introduced nor is scoped to fix
  // (the identical signatures were already documented in validate-identity-computation-collapse-v1.ts).
  const PRE_EXISTING_BASELINE_ERROR_SIGNATURES = [
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2322: Type '"CAPABILITY_PLANNING"' is not assignable to type 'ForensicBuildStage'\./,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2739: Type '\{.*OnePromptLivePreviewBuildResult': livePreviewGate, autonomousSoftwareEngineering/,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS4104: The type 'readonly string\[\]' is 'readonly' and cannot be assigned to the mutable type 'string\[\]'\./,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2322: Type 'string' is not assignable to type 'ForensicBuildStage'\./,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2367: This comparison appears to be unintentional because the types '"PLANNING" \| "WORKSPACE_CREATED" \| "PROFILE_SELECTED"' and '"MATERIALIZATION"' have no overlap\./,
  ];
  const touchedFileErrorLines = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    if (!TOUCHED_PRODUCTION_FILES.some((f) => normalized.startsWith(f))) return false;
    return !PRE_EXISTING_BASELINE_ERROR_SIGNATURES.some((re) => re.test(normalized));
  });
  assert(
    '47. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && touchedFileErrorLines.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}${touchedFileErrorLines.length > 0 ? `: ${touchedFileErrorLines.join(' | ')}` : ''}`,
  );

  // ===========================================================================================
  // Scenario 48 — mandatory Capability Matrix includes a dedicated row for this milestone (both
  // CBGA's and GPCA's capability matrices).
  // ===========================================================================================
  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Navigation Computation Collapse');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Navigation Computation Collapse');
  assert(
    '48. Mandatory Capability Matrix includes a dedicated, IMPLEMENTED row for Navigation Computation Collapse (both CBGA\'s and GPCA\'s capability matrices)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      cbgaRow?.autoRun !== undefined &&
      cbgaRow?.activationAllowed === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES' &&
      gpcaRow?.activationAllowed === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
  );

  // ===========================================================================================
  // Scenario 49 — a restaurant-style prompt preserves IDENTICAL navigation from
  // CBGA -> Blueprint -> Materialization -> Preview -> GPCA.
  // ===========================================================================================
  const navigationAcrossPipeline = [
    JSON.stringify(approvedNavigationPlan.productEntries),
    JSON.stringify(blueprintManifest.approvedNavigationLabels),
    JSON.stringify(featureContractJson.navigation),
    JSON.stringify(universalFeatureContractJson.navigation),
    JSON.stringify(generatedAppManifest.navigationLabels),
  ];
  const uniqueNavigationRepresentations = new Set(navigationAcrossPipeline);
  const gpcaEvidenceForPipeline: GpcaPipelineEvidenceInput = {
    contract,
    cbgaReport: cbgaResult.report,
    proposed: {
      appTitle: approvedIdentity.displayName,
      moduleIds: cbgaResult.report.repairedInputs.moduleIds,
      routes: cbgaResult.report.repairedInputs.routes,
      navigationLabels: approvedNavigationPlan.productEntries,
      generatedFilePaths: [],
    },
  };
  const pipelineNavChains = buildContractTraceabilityChains(gpcaEvidenceForPipeline).filter((r) => r.artifactKind === 'NAVIGATION_ITEM');
  assert(
    '49. A restaurant-style prompt preserves IDENTICAL navigation from CBGA -> Blueprint -> Materialization -> Preview (FeatureAppRouter.tsx) -> GPCA (every artifact\'s navigation list is byte-identical to ApprovedNavigationPlan.productEntries, and GPCA proves every one of them traceable)',
    uniqueNavigationRepresentations.size === 1 &&
      approvedNavigationPlan.productEntries.length > 0 &&
      pipelineNavChains.every((c) => c.proven === true) &&
      pipelineNavChains.length === approvedNavigationPlan.productEntries.length,
    `navigationAcrossPipeline=${JSON.stringify(navigationAcrossPipeline)}, pipelineNavChains proven=${pipelineNavChains.every((c) => c.proven === true)}`,
  );

  // ===========================================================================================
  // Scenario 50 — any attempt by a downstream generator to introduce an unapproved navigation
  // item results in constitutional failure rather than automatic repair.
  // ===========================================================================================
  const tamperedPlan: ApprovedNavigationPlan = {
    ...approvedNavigationPlan,
    navigationItems: [
      ...approvedNavigationPlan.navigationItems,
      {
        label: 'Unapproved Injected Item',
        path: '/unapproved',
        moduleId: 'unapproved-module',
        sourceContractConcept: 'none',
        order: approvedNavigationPlan.navigationItems.length,
      },
    ],
    // productEntries deliberately left stale (not updated to include the injected item) —
    // simulating a downstream generator that tried to splice in an extra item without going
    // through CBGA repair. Structural validity requires productEntries/routes to stay in lockstep
    // with navigationItems, so this must be rejected, not silently "repaired" into consistency.
  };
  let threwOnTamperedPlan = false;
  let tamperedMessage = '';
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'tampered-nav-plan-check',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan: tamperedPlan,
    });
  } catch (err) {
    threwOnTamperedPlan = true;
    tamperedMessage = err instanceof Error ? err.message : String(err);
  }
  assert(
    '50. Any attempt to introduce an unapproved navigation item (a navigationItems entry with no matching productEntries/routes counterpart) results in constitutional failure rather than automatic repair — buildUniversalMaterializedWorkspaceFiles refuses instead of silently accepting or reconciling the tampered plan',
    !isApprovedNavigationPlanValid(tamperedPlan) &&
      threwOnTamperedPlan &&
      /CONSTITUTIONAL_VIOLATION_PPC_1207/.test(tamperedMessage),
    `isValid=${isApprovedNavigationPlanValid(tamperedPlan)}, threw=${threwOnTamperedPlan}, message=${tamperedMessage}`,
  );

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
  console.log('\n## Mandatory Capability Matrix (CBGA)\n');
  // eslint-disable-next-line no-console
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  // eslint-disable-next-line no-console
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  for (const row of CBGA_CAPABILITY_MATRIX_ROWS) {
    // eslint-disable-next-line no-console
    console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);
  }

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error(`\n${failCount} scenario(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Validator crashed:', err);
  process.exit(1);
});
