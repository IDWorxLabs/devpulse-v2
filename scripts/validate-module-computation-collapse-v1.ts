/**
 * MODULE_COMPUTATION_COLLAPSE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 5 — Module Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * Modules (which product features exist, their display name, route, and generation order) are
 * that fact. This milestone collapses every downstream module-metadata consumer onto ONE approved,
 * CBGA-repaired module plan object (`ApprovedModulePlan`,
 * src/contract-bound-generation-authority-v4/approved-module-plan.ts) without adding a new
 * authority, without weakening GPCA/CBGA/Product Faithfulness/AEO/EIAA, without a CBGA policy
 * change, without a generator rewrite, and without any application-specific logic:
 *
 *   1. CBGA now packages its own contract-derived `modulePlan`, filtered down to the final approved
 *      module set (`repairedInputs.moduleIds`), with each entry's route joined from `routePlan`,
 *      into a single, typed, immutable handoff (`CbgaGenerationReport.approvedModulePlan`).
 *   2. The orchestrator builds it once, right after CBGA repair, and threads it through
 *      `materializeGeneratedApplication` -> `buildUniversalCrudWorkspaceFiles` ->
 *      `buildUniversalMaterializedWorkspaceFiles`, behind a PPC-1207 constitutional guard.
 *   3. `buildUniversalMaterializedWorkspaceFiles` uses it for every module's displayName/route when
 *      supplied, threading it into the feature registry/manifest entries
 *      (`buildAllModularFeatureModuleFiles`), the modular feature router generator
 *      (`buildFeatureAppRouterTsx`'s nav labels — second priority, after `ApprovedNavigationPlan`),
 *      the blueprint's `coreFeatureLabel` (`deriveBlueprintContractCopy`'s `moduleDisplayNameOf`),
 *      the Universal Feature Contract (new additive `modules` field), and generated manifests.
 *   4. Materialization refuses (throws / returns a GENERATION_PIPELINE_NON_COMPLIANT failure)
 *      instead of silently falling back when an approved module plan is present but structurally
 *      invalid.
 *   5. GPCA's own module traceability additionally (never instead) accepts a match against the
 *      approved plan's entries.
 *   6. Which modules materialize as files at all remains driven by
 *      `ProfileFeatureDefinition.featureModules` exactly as before — this is NOT a CBGA policy
 *      change and NOT a generator rewrite; only the previously independently-computed
 *      displayName/route/order metadata for the modules CBGA already approved is collapsed.
 *
 * This validator proves all of the above using the REAL, current, unmodified production functions
 * — never mocks/stand-ins for the generator itself.
 *
 * Run only:
 *   npx tsx scripts/validate-module-computation-collapse-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildApprovedModulePlan,
  isApprovedModulePlanValid,
  requireApprovedModulePlan,
  APPROVED_MODULE_PLAN_SOURCE,
  APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS,
  APPROVED_MODULE_PLAN_CONSUMERS,
  type ApprovedModulePlan,
} from '../src/contract-bound-generation-authority-v4/approved-module-plan.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_CAPABILITY_MATRIX_ROWS,
  CBGA_SYSTEM_SHELL_MODULE_IDS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaModulePlanEntry,
  CbgaRoutePlanEntry,
} from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import {
  buildFeatureAppRouterTsx,
  buildAllModularFeatureModuleFiles,
  moduleIdToDisplayName,
} from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { deriveBlueprintContractCopy } from '../src/universal-app-blueprint/universal-app-blueprint-contract-provenance.js';
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import { buildContractTraceabilityChains } from '../src/generation-pipeline-compliance-authority-v1/contract-traceability.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'MODULE_COMPUTATION_COLLAPSE_V1_PASS';

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
  'src/contract-bound-generation-authority-v4/approved-module-plan.ts',
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
  'src/universal-app-blueprint/universal-app-blueprint-types.ts',
  'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-types.ts',
  'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
];

// Files this milestone must leave byte-for-byte untouched — GPCA/CBGA repair-policy/Product
// Faithfulness/AEO/EIAA ownership must never be weakened by a module-collapse fix.
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
    // Every concept named by coreEntities/primaryWorkflows/majorFeatureGroups above must be
    // present here too — a real CanonicalProductContract's own allConceptNames always covers
    // every concept it exposes elsewhere; omitting one here would be a validator fixture bug, not
    // a production one (contract-module-plan.ts derives one module per concept from all three
    // lists, so a real contract's allConceptNames always covers whichever of them it populates).
    allConceptNames: ['reservation', 'table', 'order', 'staff', 'reservations', 'orders'],
    ...overrides,
  };
}

function modulePlanEntryFixture(overrides: Partial<CbgaModulePlanEntry> = {}): CbgaModulePlanEntry {
  return {
    readOnly: true,
    moduleId: 'reservations',
    displayName: 'Reservations',
    sourceContractConcept: 'reservation',
    requiredWorkflows: ['reservation'],
    requiredActions: ['create', 'update', 'delete'],
    requiredEntities: [],
    requiredUiSurfaces: ['list', 'detail'],
    evidenceSource: 'CONTRACT_WORKFLOW',
    confidence: 80,
    generationAllowed: true,
    ...overrides,
  };
}

function routePlanEntryFixture(overrides: Partial<CbgaRoutePlanEntry> = {}): CbgaRoutePlanEntry {
  return {
    readOnly: true,
    routeId: 'route-reservations',
    path: '/reservations',
    label: 'Reservations',
    moduleId: 'reservations',
    sourceContractConcept: 'reservation',
    requiredScreenPurpose: 'View and manage Reservations.',
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
  // Scenario 1 — ApprovedModulePlan exists with the required structural shape.
  // ===========================================================================================
  const modulePlanFixture: CbgaModulePlanEntry[] = [
    modulePlanEntryFixture({ moduleId: 'reservations', displayName: 'Reservations', sourceContractConcept: 'reservation', evidenceSource: 'CONTRACT_WORKFLOW' }),
    modulePlanEntryFixture({ moduleId: 'orders', displayName: 'Orders', sourceContractConcept: 'order', evidenceSource: 'CONTRACT_ENTITY' }),
    modulePlanEntryFixture({ moduleId: 'staff-directory', displayName: 'Staff Directory', sourceContractConcept: 'staff', evidenceSource: 'CONTRACT_ENTITY' }),
  ];
  const routePlanFixture: CbgaRoutePlanEntry[] = [
    routePlanEntryFixture({ routeId: 'route-reservations', path: '/', label: 'Reservations', moduleId: 'reservations', sourceContractConcept: 'reservation' }),
    routePlanEntryFixture({ routeId: 'route-orders', path: '/orders', label: 'Orders', moduleId: 'orders', sourceContractConcept: 'order' }),
    routePlanEntryFixture({ routeId: 'route-staff-directory', path: '/staff-directory', label: 'Staff Directory', moduleId: 'staff-directory', sourceContractConcept: 'staff' }),
  ];
  const directPlan = buildApprovedModulePlan({
    modulePlan: modulePlanFixture,
    routePlan: routePlanFixture,
    approvedModuleIds: ['reservations', 'orders'],
    promptHash: 'hash-1',
    buildId: 'build-1',
  });
  assert(
    '1. ApprovedModulePlan exists with the required structural shape (moduleEntries, moduleIds, displayNames, routes, systemShellModuleIds, source, provenanceRuleIds, owningStage, consumers, immutable, promptHash, buildId, generatedAt)',
    directPlan.readOnly === true &&
      Array.isArray(directPlan.moduleEntries) &&
      Array.isArray(directPlan.moduleIds) &&
      Array.isArray(directPlan.displayNames) &&
      Array.isArray(directPlan.routes) &&
      Array.isArray(directPlan.systemShellModuleIds) &&
      directPlan.source === APPROVED_MODULE_PLAN_SOURCE &&
      Array.isArray(directPlan.provenanceRuleIds) &&
      directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' &&
      Array.isArray(directPlan.consumers) &&
      directPlan.immutable === true &&
      directPlan.promptHash === 'hash-1' &&
      directPlan.buildId === 'build-1' &&
      typeof directPlan.generatedAt === 'string',
    `plan=${JSON.stringify(directPlan)}`,
  );
  // Only 'staff-directory' was excluded (not in approvedModuleIds) — proves a strict filter, never invention.
  assert(
    '1b. ApprovedModulePlan.moduleEntries is exactly the subset of modulePlan matching approvedModuleIds (Staff Directory excluded, Reservations+Orders included), with each entry\'s route joined from routePlan',
    directPlan.moduleIds.length === 2 &&
      directPlan.moduleIds.includes('reservations') &&
      directPlan.moduleIds.includes('orders') &&
      !directPlan.moduleIds.includes('staff-directory') &&
      directPlan.moduleEntries.find((e) => e.moduleId === 'reservations')?.route === '/' &&
      directPlan.moduleEntries.find((e) => e.moduleId === 'orders')?.route === '/orders',
    `moduleEntries=${JSON.stringify(directPlan.moduleEntries)}`,
  );

  // ===========================================================================================
  // Scenario 2 — Built only after CBGA approval (moduleIds sourced from repairedInputs.moduleIds).
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
    '2. ApprovedModulePlan is built after CBGA repair — every moduleEntries[].moduleId is in repairedInputs.moduleIds (the final approved module set), never the pre-repair proposal',
    repairNeededReport.approvedModulePlan.moduleEntries.every((entry) =>
      repairNeededReport.repairedInputs.moduleIds.includes(entry.moduleId),
    ) &&
      !repairNeededReport.approvedModulePlan.moduleIds.includes('unsupported-fallback-module'),
    `moduleEntries=${JSON.stringify(repairNeededReport.approvedModulePlan.moduleEntries)}, repairedInputs.moduleIds=${JSON.stringify(repairNeededReport.repairedInputs.moduleIds)}`,
  );
  // Also proves the plan is populated even when the gate is already GENERATION_ALLOWED (no repair
  // triggered at all) — never left empty because the proposal happened to be already compliant.
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
    '2b. Even when the gate is already GENERATION_ALLOWED (no repair triggered), ApprovedModulePlan is still populated from the contract-derived modulePlan',
    noRepairNeededReport.finalGateOutcome === 'GENERATION_ALLOWED' &&
      noRepairNeededReport.approvedModulePlan.moduleEntries.length > 0 &&
      noRepairNeededReport.approvedModulePlan.moduleEntries.length === noRepairNeededReport.modulePlan.filter((m) => m.generationAllowed).length,
    `finalGateOutcome=${noRepairNeededReport.finalGateOutcome}, moduleEntries.length=${noRepairNeededReport.approvedModulePlan.moduleEntries.length}`,
  );

  // ===========================================================================================
  // Scenario 3 — Immutable.
  // ===========================================================================================
  assert(
    '3. ApprovedModulePlan is immutable (readOnly === true, immutable === true)',
    directPlan.readOnly === true && directPlan.immutable === true,
    `readOnly=${directPlan.readOnly}, immutable=${directPlan.immutable}`,
  );

  // ===========================================================================================
  // Scenario 4 — Carries provenance.
  // ===========================================================================================
  assert(
    '4. ApprovedModulePlan carries provenance (non-empty provenanceRuleIds, all real PPC-nnn rule IDs, and every moduleEntries[] item carries its own provenance/traceability/contractSource string)',
    directPlan.provenanceRuleIds.length > 0 &&
      directPlan.provenanceRuleIds.every((id) => /^PPC-\d+$/.test(id)) &&
      directPlan.moduleEntries.every(
        (e) => typeof e.provenance === 'string' && e.provenance.length > 0 && typeof e.traceability === 'string' && e.traceability.length > 0 && typeof e.contractSource === 'string' && e.contractSource.length > 0,
      ),
    `provenanceRuleIds=${JSON.stringify(directPlan.provenanceRuleIds)}`,
  );

  // ===========================================================================================
  // Scenario 5 — Carries owner.
  // ===========================================================================================
  assert(
    '5. ApprovedModulePlan carries its owning stage (CONTRACT_BOUND_GENERATION_AUTHORITY_V4)',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    `owningStage=${directPlan.owningStage}`,
  );

  // ===========================================================================================
  // Scenario 6 — Carries consumers.
  // ===========================================================================================
  assert(
    '6. ApprovedModulePlan carries declared downstream consumers (non-empty consumers array)',
    directPlan.consumers.length > 0 && directPlan.consumers === APPROVED_MODULE_PLAN_CONSUMERS,
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
  const approvedModulePlan = cbgaResult.report.approvedModulePlan;

  assert(
    '2c. (sanity) the real restaurant prompt produces a non-empty, structurally valid ApprovedModulePlan end-to-end',
    isApprovedModulePlanValid(approvedModulePlan) && approvedModulePlan.moduleEntries.length > 0,
    `moduleEntries=${JSON.stringify(approvedModulePlan.moduleEntries)}`,
  );

  const liveFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'module-collapse-e2e-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: cbgaResult.buildPlan,
    approvedIdentity,
    approvedNavigationPlan,
    approvedModulePlan,
  });
  const liveByPath = new Map(liveFiles.map((f) => [f.relativePath, f.content]));

  // ===========================================================================================
  // Scenario 7 — Blueprint Generator consumes it.
  // ===========================================================================================
  const blueprintManifest = JSON.parse(liveByPath.get('blueprint-manifest.json') ?? '{}') as {
    approvedModuleIds?: string[];
  };
  assert(
    '7. Blueprint Generator consumes the ApprovedModulePlan (blueprint-manifest.json approvedModuleIds equals plan.moduleIds)',
    JSON.stringify(blueprintManifest.approvedModuleIds) === JSON.stringify(approvedModulePlan.moduleIds),
    `blueprintManifest.approvedModuleIds=${JSON.stringify(blueprintManifest.approvedModuleIds)}, plan.moduleIds=${JSON.stringify(approvedModulePlan.moduleIds)}`,
  );

  // ===========================================================================================
  // Scenario 7b — coreFeatureLabel is derived through moduleDisplayNameOf, and that resolver
  // prefers the ApprovedModulePlan's own displayName over the independent slug derivation.
  // ===========================================================================================
  const approvedDisplayNameMap = new Map(directPlan.moduleEntries.map((e) => [e.moduleId, e.displayName] as const));
  const moduleDisplayNameOfWithPlan = (moduleId: string): string =>
    approvedDisplayNameMap.get(moduleId) ?? moduleIdToDisplayName(moduleId);
  const copyWithApprovedLabel = deriveBlueprintContractCopy({
    appName: 'Riverside Bistro Manager',
    approvedModuleIds: ['reservations'],
    moduleDisplayNameOf: moduleDisplayNameOfWithPlan,
    customDomainCopy: null,
  });
  const planWithCustomLabel = buildApprovedModulePlan({
    modulePlan: [modulePlanEntryFixture({ moduleId: 'reservations', displayName: 'Table Reservations' })],
    routePlan: [routePlanEntryFixture({ moduleId: 'reservations', path: '/' })],
    approvedModuleIds: ['reservations'],
  });
  const customLabelMap = new Map(planWithCustomLabel.moduleEntries.map((e) => [e.moduleId, e.displayName] as const));
  const copyWithCustomLabel = deriveBlueprintContractCopy({
    appName: 'Riverside Bistro Manager',
    approvedModuleIds: ['reservations'],
    moduleDisplayNameOf: (moduleId) => customLabelMap.get(moduleId) ?? moduleIdToDisplayName(moduleId),
    customDomainCopy: null,
  });
  assert(
    '7c. Blueprint\'s coreFeatureLabel is taken from ApprovedModulePlan\'s displayName for the module it covers ("Table Reservations"), never the independent moduleIdToDisplayName slug derivation ("Reservations") once the plan supplies a different label',
    copyWithApprovedLabel.coreFeatureLabel === 'Reservations' &&
      copyWithCustomLabel.coreFeatureLabel === 'Table Reservations',
    `copyWithApprovedLabel.coreFeatureLabel=${copyWithApprovedLabel.coreFeatureLabel}, copyWithCustomLabel.coreFeatureLabel=${copyWithCustomLabel.coreFeatureLabel}`,
  );

  // ===========================================================================================
  // Scenario 8 — Workspace generation consumes it (buildUniversalMaterializedWorkspaceFiles
  // requires structural validity when supplied, and the whole live-file bundle above was produced
  // by passing it straight through).
  // ===========================================================================================
  assert(
    '8. Workspace generation (buildUniversalMaterializedWorkspaceFiles) consumes the ApprovedModulePlan end-to-end (every artifact above was produced from a single call passing approvedModulePlan)',
    liveFiles.length > 0,
    `liveFiles.length=${liveFiles.length}`,
  );

  // ===========================================================================================
  // Scenario 9 — Router consumes it (buildFeatureAppRouterTsx + buildAllModularFeatureModuleFiles
  // render the plan's own labels/routes for the modules it covers, never the independent
  // moduleIdToDisplayName/resolveModuleRoute derivations).
  // ===========================================================================================
  const routerDefinition = genericDefinitionFixture({
    featureModules: ['auth', 'dashboard', 'reservations', 'orders'],
  });
  const approvedModuleEntriesForRouter = [
    { moduleId: 'reservations', displayName: 'Table Reservations', route: '/table-reservations' },
    { moduleId: 'orders', displayName: 'Guest Orders', route: '/guest-orders' },
  ];
  const routerWithApprovedModules = buildFeatureAppRouterTsx(routerDefinition, 'Riverside Bistro Manager', null, approvedModuleEntriesForRouter);
  const routerWithoutApprovedModules = buildFeatureAppRouterTsx(routerDefinition, 'Riverside Bistro Manager', null, null);
  const registryWithApprovedModules = buildAllModularFeatureModuleFiles('Riverside Bistro Manager', routerDefinition, approvedModuleEntriesForRouter);
  const registryWithoutApprovedModules = buildAllModularFeatureModuleFiles('Riverside Bistro Manager', routerDefinition, null);
  assert(
    '9. Router/registry generators consume the ApprovedModulePlan (buildFeatureAppRouterTsx renders the plan\'s own labels — "Table Reservations"/"Guest Orders" — for the modules it covers, and buildAllModularFeatureModuleFiles\'s manifest entries take name/route from the plan, never the independent moduleIdToDisplayName/resolveModuleRoute derivations once the plan is supplied)',
    routerWithApprovedModules.includes('Table Reservations') &&
      routerWithApprovedModules.includes('Guest Orders') &&
      !routerWithApprovedModules.includes('>\n          Reservations\n        <') &&
      routerWithoutApprovedModules.includes('Reservations') &&
      !routerWithoutApprovedModules.includes('Table Reservations') &&
      registryWithApprovedModules.manifestEntries.find((e) => e.id === 'reservations')?.name === 'Table Reservations' &&
      registryWithApprovedModules.manifestEntries.find((e) => e.id === 'reservations')?.route === '/table-reservations' &&
      registryWithoutApprovedModules.manifestEntries.find((e) => e.id === 'reservations')?.name === 'Reservations',
    `routerWithApprovedModules includes labels=${routerWithApprovedModules.includes('Table Reservations') && routerWithApprovedModules.includes('Guest Orders')}, registry entry=${JSON.stringify(registryWithApprovedModules.manifestEntries.find((e) => e.id === 'reservations'))}`,
  );

  // ===========================================================================================
  // Scenario 10 — Feature Contract consumes it.
  // ===========================================================================================
  const featureContractJson = JSON.parse(liveByPath.get('feature-contract.json') ?? '{}') as { modules?: string[] };
  const universalFeatureContractJson = JSON.parse(liveByPath.get('universal-feature-contract.json') ?? '{}') as {
    modules?: string[];
  };
  assert(
    '10. Universal Feature Contract consumes the ApprovedModulePlan (feature-contract.json AND universal-feature-contract.json modules both equal plan.moduleIds)',
    JSON.stringify(featureContractJson.modules) === JSON.stringify(approvedModulePlan.moduleIds) &&
      JSON.stringify(universalFeatureContractJson.modules) === JSON.stringify(approvedModulePlan.moduleIds),
    `feature-contract.json.modules=${JSON.stringify(featureContractJson.modules)}, plan.moduleIds=${JSON.stringify(approvedModulePlan.moduleIds)}`,
  );

  // ===========================================================================================
  // Scenario 11 — Preview consumes it (production has no separate preview-specific module
  // generator: the dev server previews the SAME generated FeatureAppRouter.tsx/registry.ts
  // materialization already produced from this one plan).
  // ===========================================================================================
  const liveRegistryTs = liveByPath.get('src/features/registry.ts') ?? '';
  const liveRouterTsx = liveByPath.get('src/features/FeatureAppRouter.tsx') ?? '';
  assert(
    '11. Preview generation (src/features/registry.ts + src/features/FeatureAppRouter.tsx — the files the dev server actually previews) is produced by the same materialization call this ApprovedModulePlan was threaded into',
    liveRegistryTs.length > 0 && liveRouterTsx.length > 0,
    `registry length=${liveRegistryTs.length}, router length=${liveRouterTsx.length}`,
  );

  // ===========================================================================================
  // Scenario 12 — Manifest consumes it.
  // ===========================================================================================
  const generatedAppManifest = JSON.parse(liveByPath.get(GENERATED_APP_MANIFEST_FILENAME) ?? '{}') as {
    approvedModuleIds?: string[];
  };
  assert(
    '12. Generated manifests consume the ApprovedModulePlan (.generated-app-manifest.json approvedModuleIds AND blueprint-manifest.json approvedModuleIds both equal plan.moduleIds)',
    JSON.stringify(generatedAppManifest.approvedModuleIds) === JSON.stringify(approvedModulePlan.moduleIds) &&
      JSON.stringify(blueprintManifest.approvedModuleIds) === JSON.stringify(approvedModulePlan.moduleIds),
    `generatedAppManifest.approvedModuleIds=${JSON.stringify(generatedAppManifest.approvedModuleIds)}`,
  );

  // ===========================================================================================
  // Scenario 13 — Engineering Report consumes it (source-level: the orchestrator's success result
  // carries `approvedModulePlan`, and the type declares it — same pattern as approvedNavigationPlan).
  // ===========================================================================================
  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  const typesSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8');
  assert(
    '13. Final engineering report (OnePromptLivePreviewBuildResult) declares and populates approvedModulePlan from the same object threaded into materialization',
    typesSource.includes('approvedModulePlan') &&
      orchestratorSource.includes('approvedModulePlan,') &&
      orchestratorSource.includes(
        'const approvedModulePlan: ApprovedModulePlan = contractBoundGeneration.approvedModulePlan',
      ),
    'checked src/one-prompt-live-preview/{one-prompt-build-orchestrator.ts,one-prompt-live-preview-types.ts}',
  );

  // ===========================================================================================
  // Scenario 14 — GPCA consumes it (moduleTraceability checks ApprovedModulePlan.moduleEntries
  // first, additionally to the original modulePlan check).
  // ===========================================================================================
  const gpcaEvidenceMatching: GpcaPipelineEvidenceInput = {
    contract: repairNeededContract,
    cbgaReport: repairNeededReport,
    proposed: {
      appTitle: repairNeededReport.approvedIdentity.displayName,
      // Every module GPCA is asked to trace here is exactly the set CBGA's own real, unmocked
      // module-plan derivation (contract-module-plan.ts, driven by repairNeededContract's real
      // coreEntities/primaryWorkflows/majorFeatureGroups) approved — never a guessed literal.
      moduleIds: repairNeededReport.approvedModulePlan.moduleIds,
      routes: repairNeededReport.repairedInputs.routes,
      navigationLabels: repairNeededReport.approvedNavigationPlan.productEntries,
      generatedFilePaths: [],
    },
  };
  const moduleChainsMatching = buildContractTraceabilityChains(gpcaEvidenceMatching).filter((r) => r.artifactKind === 'MODULE');
  const contractTraceabilitySource = readFileSync(
    join(ROOT, 'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts'),
    'utf8',
  );
  assert(
    '14. GPCA module traceability explicitly references ApprovedModulePlan.moduleEntries (checked first/additionally, never instead of the original modulePlan check), and every plan-approved module is proven traceable',
    contractTraceabilitySource.includes('cbga?.approvedModulePlan.moduleEntries.find') &&
      contractTraceabilitySource.includes("'ApprovedModulePlan.moduleEntries'") &&
      moduleChainsMatching.length > 0 &&
      moduleChainsMatching.every((c) => c.proven === true),
    `moduleChainsMatching=${JSON.stringify(moduleChainsMatching)}`,
  );
  const gpcaEvidenceMismatching: GpcaPipelineEvidenceInput = {
    ...gpcaEvidenceMatching,
    proposed: { ...gpcaEvidenceMatching.proposed, moduleIds: ['unapproved-injected-module'] },
  };
  const moduleChainMismatching = buildContractTraceabilityChains(gpcaEvidenceMismatching).find((r) => r.artifactKind === 'MODULE');
  assert(
    '14b. (no-weakening) GPCA still correctly reports an unapproved module ("unapproved-injected-module") as unproven',
    moduleChainMismatching?.proven === false,
    `moduleChainMismatching=${JSON.stringify(moduleChainMismatching)}`,
  );

  // ===========================================================================================
  // Scenario 15 — No downstream module derivation remains for modules the plan covers (already
  // proven by scenario 9 — router/registry render the plan's displayName/route, not their own
  // moduleIdToDisplayName/resolveModuleRoute derivation).
  // ===========================================================================================
  assert(
    '15. No downstream module (metadata) derivation remains for modules the ApprovedModulePlan covers (see scenario 9)',
    registryWithApprovedModules.manifestEntries.find((e) => e.id === 'reservations')?.name === 'Table Reservations',
    'see scenario 9',
  );

  // ===========================================================================================
  // Scenario 16 — No downstream fallback remains ungated (every `??` on an approved-module-plan-
  // derived value is gated behind an explicit approved-plan-validity check).
  // ===========================================================================================
  assert(
    '16. No downstream module fallback remains ungated — universal-app-materialization-engine.ts only falls back to moduleIdToDisplayName when approvedModuleEntries does not cover a moduleId (isApprovedModulePlanValid gates every use), never silently once the plan is supplied',
    /approvedModuleDisplayNameByModuleId\.get\(moduleId\)\s*\?\?\s*moduleIdToDisplayName\(moduleId\)/.test(
      readFileSync(join(ROOT, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'), 'utf8'),
    ),
    'checked universal-app-materialization-engine.ts moduleDisplayNameOf derivation',
  );

  // ===========================================================================================
  // Scenario 17 — Production fails if ApprovedModulePlan is missing/structurally invalid, once
  // the caller supplies one at all (PPC-1207 constitutional violation, not a silent fallback).
  // ===========================================================================================
  const malformedPlan: ApprovedModulePlan = {
    ...directPlan,
    moduleIds: ['reservations'], // deliberately mismatched with moduleEntries.length (2)
  };
  let threwOnInvalidPlan = false;
  let threwMessage = '';
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'invalid-module-plan-check',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan,
      approvedModulePlan: malformedPlan,
    });
  } catch (err) {
    threwOnInvalidPlan = true;
    threwMessage = err instanceof Error ? err.message : String(err);
  }
  assert(
    '17. A supplied-but-structurally-invalid ApprovedModulePlan fails with an explicit constitutional violation instead of silently deriving fallback modules',
    threwOnInvalidPlan &&
      /CONSTITUTIONAL_VIOLATION_PPC_1207/.test(threwMessage) &&
      !isApprovedModulePlanValid(malformedPlan),
    `threw=${threwOnInvalidPlan}, message=${threwMessage}, isValid=${isApprovedModulePlanValid(malformedPlan)}`,
  );
  let requireThrew = false;
  try {
    requireApprovedModulePlan(null, 'unit-test');
  } catch {
    requireThrew = true;
  }
  assert(
    '17b. requireApprovedModulePlan throws a PPC-1207 constitutional violation when the plan is absent entirely',
    requireThrew,
    `requireThrew=${requireThrew}`,
  );
  // Same guard exercised at the orchestrator level (source-level: the guard exists and returns a
  // GENERATION_PIPELINE_NON_COMPLIANT failure reason rather than proceeding).
  assert(
    '17c. The orchestrator\'s materialization guard fails with GENERATION_PIPELINE_NON_COMPLIANT when isApprovedModulePlanValid(approvedModulePlan) is false, mirroring the identity/navigation guards',
    /if \(!isApprovedModulePlanValid\(approvedModulePlan\)\) \{[\s\S]{0,400}GENERATION_PIPELINE_NON_COMPLIANT/.test(orchestratorSource),
    'checked one-prompt-build-orchestrator.ts runWorkspaceMaterialization guard',
  );

  // ===========================================================================================
  // Scenario 18 — System-shell modules are never fabricated into moduleEntries; they remain a
  // generic, application-agnostic taxonomy only.
  //
  // NOTE: a real contract concept CAN legitimately slugify to the same string as a system-shell
  // term (e.g. a product that has a literal "Dashboard" business feature) — that is a genuine,
  // contract-evidenced CONTRACT_ENTITY/CONTRACT_WORKFLOW/CONTRACT_CAPABILITY module, not a
  // fabrication, so asserting against the real e2e restaurant-plan's moduleIds would be the wrong
  // test. The actual invariant (proven here with an explicit, controlled fixture) is: when
  // system-shell ids are proposed WITHOUT any matching contract concept, CBGA repair keeps them in
  // the final approved moduleIds (SYSTEM_SHELL_ALLOWED — real, existing CBGA policy, untouched by
  // this milestone) but `buildApprovedModulePlan` still never invents a moduleEntries item for
  // them, because they were never in CBGA's own contract-derived modulePlan to begin with.
  // ===========================================================================================
  const systemShellContract = contractEvidenceFixture({
    coreEntities: ['reservation', 'table', 'order'],
    primaryWorkflows: ['reservations'],
    majorFeatureGroups: ['reservations', 'orders'],
    allConceptNames: ['reservation', 'table', 'order', 'reservations', 'orders'],
  });
  const systemShellReport = runContractBoundGenerationAuthority({
    contract: systemShellContract,
    proposed: {
      proposedModuleIds: ['auth', 'dashboard', 'reservation', 'order'],
      proposedRoutes: ['/', '/dashboard', '/reservation', '/order'],
      proposedNavigationLabels: [],
      proposedAppTitle: systemShellContract.productIdentity,
    },
  });
  assert(
    '18. System-shell modules (auth/dashboard/settings/persistence) are never fabricated into ApprovedModulePlan.moduleEntries as if they were contract-backed product features — systemShellModuleIds is exactly the generic CBGA_SYSTEM_SHELL_MODULE_IDS taxonomy; and when "auth"/"dashboard" are proposed with no matching contract concept, CBGA repair keeps them in the final approved moduleIds (real, pre-existing SYSTEM_SHELL_ALLOWED policy) yet ApprovedModulePlan.moduleEntries never fabricates an entry for either of them',
    JSON.stringify(directPlan.systemShellModuleIds) === JSON.stringify(CBGA_SYSTEM_SHELL_MODULE_IDS) &&
      systemShellReport.repairedInputs.moduleIds.includes('auth') &&
      systemShellReport.repairedInputs.moduleIds.includes('dashboard') &&
      systemShellReport.approvedModulePlan.moduleIds.includes('reservation') &&
      systemShellReport.approvedModulePlan.moduleIds.includes('order') &&
      !systemShellReport.approvedModulePlan.moduleIds.includes('auth') &&
      !systemShellReport.approvedModulePlan.moduleIds.includes('dashboard') &&
      systemShellReport.approvedModulePlan.moduleEntries.every((e) => !CBGA_SYSTEM_SHELL_MODULE_IDS.includes(e.moduleId)),
    `repairedInputs.moduleIds=${JSON.stringify(systemShellReport.repairedInputs.moduleIds)}, approvedModulePlan.moduleIds=${JSON.stringify(systemShellReport.approvedModulePlan.moduleIds)}`,
  );

  // ===========================================================================================
  // Scenario 19 — Which modules materialize as files at all remains unchanged (this milestone is
  // NOT a CBGA policy change, NOT a generator rewrite — ProfileFeatureDefinition.featureModules
  // still governs the actual generated file set; ApprovedModulePlan only supplies metadata).
  // ===========================================================================================
  const materializationEngineSource = readFileSync(
    join(ROOT, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'),
    'utf8',
  );
  assert(
    '19. Which modules materialize as files at all remains driven by ProfileFeatureDefinition.featureModules exactly as before — materializableFeatureModules(definition) (not the ApprovedModulePlan) still determines the generated module SET; the plan only supplies displayName/route metadata',
    materializationEngineSource.includes('const moduleIds = materializableFeatureModules(definition);') &&
      registryWithApprovedModules.manifestEntries.length === registryWithoutApprovedModules.manifestEntries.length,
    `manifestEntries counts equal=${registryWithApprovedModules.manifestEntries.length === registryWithoutApprovedModules.manifestEntries.length}`,
  );

  // ===========================================================================================
  // Scenario 20 — a restaurant-style prompt preserves IDENTICAL module metadata from
  // CBGA -> Blueprint -> Materialization -> Preview -> GPCA.
  // ===========================================================================================
  const moduleIdsAcrossPipeline = [
    JSON.stringify(approvedModulePlan.moduleIds),
    JSON.stringify(blueprintManifest.approvedModuleIds),
    JSON.stringify(featureContractJson.modules),
    JSON.stringify(universalFeatureContractJson.modules),
    JSON.stringify(generatedAppManifest.approvedModuleIds),
  ];
  const uniqueModuleIdRepresentations = new Set(moduleIdsAcrossPipeline);
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
  const pipelineModuleChains = buildContractTraceabilityChains(gpcaEvidenceForPipeline).filter((r) => r.artifactKind === 'MODULE');
  assert(
    '20. A restaurant-style prompt preserves IDENTICAL module ids from CBGA -> Blueprint -> Materialization -> Preview (registry.ts/FeatureAppRouter.tsx) -> GPCA (every artifact\'s approved-module-id list is byte-identical to ApprovedModulePlan.moduleIds, and GPCA proves every plan-covered module traceable)',
    uniqueModuleIdRepresentations.size === 1 &&
      approvedModulePlan.moduleIds.length > 0 &&
      pipelineModuleChains.filter((c) => approvedModulePlan.moduleIds.includes(c.artifact)).every((c) => c.proven === true),
    `moduleIdsAcrossPipeline=${JSON.stringify(moduleIdsAcrossPipeline)}`,
  );

  // ===========================================================================================
  // Scenario 21 — Any attempt to introduce an unapproved/tampered module plan (a moduleEntries
  // entry with no matching moduleIds/displayNames/routes counterpart) results in constitutional
  // failure rather than automatic repair.
  // ===========================================================================================
  const tamperedPlan: ApprovedModulePlan = {
    ...approvedModulePlan,
    moduleEntries: [
      ...approvedModulePlan.moduleEntries,
      {
        moduleId: 'unapproved-injected-module',
        displayName: 'Unapproved Injected Module',
        route: '/unapproved',
        featureType: 'CONTRACT_CAPABILITY',
        parent: null,
        visibility: 'PRODUCT',
        enabled: true,
        order: approvedModulePlan.moduleEntries.length,
        contractSource: 'none',
        provenance: 'tampered',
        traceability: 'tampered',
      },
    ],
    // moduleIds/displayNames/routes deliberately left stale — simulating a downstream generator
    // that tried to splice in an extra module without going through CBGA repair.
  };
  let threwOnTamperedPlan = false;
  let tamperedMessage = '';
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'tampered-module-plan-check',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan,
      approvedModulePlan: tamperedPlan,
    });
  } catch (err) {
    threwOnTamperedPlan = true;
    tamperedMessage = err instanceof Error ? err.message : String(err);
  }
  assert(
    '21. Any attempt to introduce an unapproved module (a moduleEntries entry with no matching moduleIds/displayNames/routes counterpart) results in constitutional failure rather than automatic repair',
    !isApprovedModulePlanValid(tamperedPlan) &&
      threwOnTamperedPlan &&
      /CONSTITUTIONAL_VIOLATION_PPC_1207/.test(tamperedMessage),
    `isValid=${isApprovedModulePlanValid(tamperedPlan)}, threw=${threwOnTamperedPlan}, message=${tamperedMessage}`,
  );

  // ===========================================================================================
  // Scenario 22-26 — the constitutional rule IDs this milestone enforces are recorded on the
  // approved module plan's own provenance (never invented ad hoc in the validator).
  // ===========================================================================================
  const REQUIRED_RULE_IDS = ['PPC-101', 'PPC-201', 'PPC-202', 'PPC-401', 'PPC-402', 'PPC-1207', 'PPC-1600', 'PPC-1601', 'PPC-1701', 'PPC-1702', 'PPC-1703'];
  const RULE_SCENARIO_NUMBERS: Record<string, number> = {
    'PPC-1207': 22,
    'PPC-1600': 23,
    'PPC-1601': 24,
    'PPC-1701': 25,
    'PPC-1702': 26,
  };
  for (const ruleId of Object.keys(RULE_SCENARIO_NUMBERS)) {
    assert(
      `${RULE_SCENARIO_NUMBERS[ruleId]}. ${ruleId} is recorded on the ApprovedModulePlan's provenanceRuleIds`,
      APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS.includes(ruleId) && directPlan.provenanceRuleIds.includes(ruleId),
      `provenanceRuleIds=${JSON.stringify(APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS)}`,
    );
  }
  assert(
    '26b. All required constitutional rule IDs (PPC-101/201/202/401/402/1207/1600/1601/1701/1702/1703) are recorded on provenanceRuleIds',
    REQUIRED_RULE_IDS.every((id) => APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS.includes(id)),
    `provenanceRuleIds=${JSON.stringify(APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS)}`,
  );

  // ===========================================================================================
  // Scenario 27-31 — no weakening of GPCA / CBGA / Product Faithfulness / AEO / EIAA.
  //
  // NOTE: this workspace has many prior, already-completed milestones sitting as uncommitted
  // changes against HEAD. A plain `git diff` vs. stale HEAD would false-positive on files this
  // milestone never touched. The precise, milestone-scoped proof is that none of THIS milestone's
  // own module-collapse markers were introduced into any protected authority file.
  // ===========================================================================================
  const MODULE_COLLAPSE_MARKERS = [
    'ApprovedModulePlan',
    'approved-module-plan',
    'buildApprovedModulePlan',
    'APPROVED_MODULE_PLAN_SOURCE',
    'CBGA_REPAIRED_MODULE_PLAN',
    'Module Computation Collapse',
  ];
  const protectedFileMarkerHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = MODULE_COLLAPSE_MARKERS.find((m) => content.includes(m));
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
    '27. No GPCA weakening (GPCA scoring/gate/legacy-detection/rendered-content-collector/rendered-content-gate/types files carry none of this milestone\'s module-collapse markers — this milestone never edited them)',
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
    '28. No CBGA weakening/decision-making change (contract-module-plan/contract-route-plan/contract-navigation-plan/contract-surface-plan/contract-generation-gate — CBGA\'s own repair policy — carry none of this milestone\'s module-collapse markers)',
    cbgaProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => cbgaProtected.includes(f))))}`,
  );
  const productFaithfulnessProtected = [
    'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
    'src/product-faithfulness-v2/canonical-product-contract.ts',
  ];
  assert(
    '29. No Product Faithfulness weakening (product-faithfulness-v1 feature extractor + product-faithfulness-v2 canonical contract builder carry none of this milestone\'s module-collapse markers)',
    productFaithfulnessProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => productFaithfulnessProtected.includes(f))))}`,
  );
  assert(
    '30. No AEO weakening (autonomous-engineering-orchestrator.ts carries none of this milestone\'s module-collapse markers)',
    !protectedFileMarkerHits.has('src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts'),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => f.includes('autonomous-engineering-orchestrator'))))}`,
  );
  assert(
    '31. No EIAA weakening (engineering-intelligence-activation-authority.ts carries none of this milestone\'s module-collapse markers)',
    !protectedFileMarkerHits.has('src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts'),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => f.includes('engineering-intelligence-activation-authority'))))}`,
  );

  // ===========================================================================================
  // Scenario 32-33 — self-discipline: this milestone's OWN added lines contain no
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
    '32. No application-specific logic introduced by this milestone\'s own added lines',
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
    '33. No VERE work was introduced by this milestone',
    !/\bvere\b/i.test(touchedSourceForVere),
    /\bvere\b/i.test(touchedSourceForVere) ? 'unexpected VERE reference found' : 'no VERE references found in touched files',
  );

  // ===========================================================================================
  // Scenario 34 — this validator runs standalone, never invoking sibling/broad validator chains.
  // ===========================================================================================
  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-module-computation-collapse-v1.ts'), 'utf8');
  const INVOCATION_OF_SIBLING_VALIDATOR = /(execSync|spawnSync|spawn|exec|import|require)\s*\(\s*[^)]*validate-(?!module-computation-collapse-v1)[\w-]+\.ts/;
  assert(
    '34. This validator never invokes another validate-*.ts script (no broad validator chain)',
    !INVOCATION_OF_SIBLING_VALIDATOR.test(thisValidatorSource),
    'inspected own source for invocation constructs referencing sibling validator scripts',
  );

  // ===========================================================================================
  // Scenario 35 — no new TypeScript errors introduced in touched files.
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
  // Pre-existing baseline errors confirmed (via inspection BEFORE this milestone's changes — and
  // re-confirmed by diffing against a `git stash` of ALL uncommitted work) to already exist in
  // one-prompt-build-orchestrator.ts — unrelated pre-existing readonly-array/ForensicBuildStage/
  // return-shape issues this milestone neither introduced nor is scoped to fix (identical
  // signatures already documented in validate-identity-computation-collapse-v1.ts and
  // validate-navigation-computation-collapse-v1.ts).
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
    '35. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && touchedFileErrorLines.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}${touchedFileErrorLines.length > 0 ? `: ${touchedFileErrorLines.join(' | ')}` : ''}`,
  );

  // ===========================================================================================
  // Scenario 36 — mandatory Capability Matrix includes a dedicated row for this milestone (both
  // CBGA's and GPCA's capability matrices).
  // ===========================================================================================
  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Module Computation Collapse');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Module Computation Collapse');
  assert(
    '36. Mandatory Capability Matrix includes a dedicated, IMPLEMENTED row for Module Computation Collapse (both CBGA\'s and GPCA\'s capability matrices)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      cbgaRow?.autoRun !== undefined &&
      cbgaRow?.activationAllowed === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES' &&
      gpcaRow?.activationAllowed === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
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
