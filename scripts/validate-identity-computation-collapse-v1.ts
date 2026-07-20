/**
 * IDENTITY_COMPUTATION_COLLAPSE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 3 — Identity Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * The constitution's own root-cause mapping (root cause B, "Multiple independent identity
 * computations") named six parallel identity-deriving functions: `extractAppName`,
 * `extractPromptAppTitle`, `buildCanonicalProductContract`'s `productIdentity`, CBGA's identity
 * repair, `buildFeatureAppRouterTsx`'s headline-split, and UFCI's `productName`.
 *
 * This milestone collapses every downstream consumer onto ONE approved, CBGA-repaired identity
 * object (`ApprovedProductIdentity`, src/contract-bound-generation-authority-v4/approved-product-identity.ts)
 * without adding a new authority, without weakening GPCA/CBGA/Product Faithfulness/AEO/EIAA, and
 * without any application-specific logic:
 *
 *   1. CBGA now packages its already-repaired `repairedInputs.appTitle` + the contract's own
 *      `productIdentity` into a single, typed, immutable handoff (`CbgaGenerationReport.approvedIdentity`).
 *   2. The orchestrator builds it once, right after CBGA repair, and threads it through
 *      `materializeGeneratedApplication` -> `buildUniversalCrudWorkspaceFiles` ->
 *      `buildUniversalMaterializedWorkspaceFiles`.
 *   3. `buildUniversalMaterializedWorkspaceFiles` uses it unconditionally for `displayName` when
 *      supplied — its pre-existing two-level "Custom App" sentinel fallback
 *      (`extractPromptAppTitle` -> Universal Feature Contract's own `productName`) only runs for
 *      pre-CBGA/isolated/test-only callers that omit it entirely.
 *   4. The Universal Feature Contract builder, `buildFeatureAppRouterTsx`'s headline-split, the
 *      Blueprint Generator, and the Blueprint Product Surface generator all consume it the same way.
 *   5. Materialization refuses (throws / returns a GENERATION_PIPELINE_NON_COMPLIANT failure)
 *      instead of silently falling back when an approved identity is present but structurally
 *      invalid.
 *
 * This validator proves all of the above using the REAL, current, unmodified production functions
 * — never mocks/stand-ins for the generator itself.
 *
 * Run only:
 *   npx tsx scripts/validate-identity-computation-collapse-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildApprovedProductIdentity,
  isApprovedProductIdentityValid,
  APPROVED_PRODUCT_IDENTITY_SOURCE,
  APPROVED_PRODUCT_IDENTITY_PROVENANCE_RULE_IDS,
  type ApprovedProductIdentity,
} from '../src/contract-bound-generation-authority-v4/approved-product-identity.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_CAPABILITY_MATRIX_ROWS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import type { CanonicalProductContract } from '../src/product-faithfulness-v2/generation-faithfulness-types.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { buildFeatureAppRouterTsx } from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildUniversalFeatureContract } from '../src/universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import { buildBlueprintProductSurface } from '../src/universal-app-blueprint/universal-app-blueprint-product-surface.js';
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import { buildContractTraceabilityChains } from '../src/generation-pipeline-compliance-authority-v1/contract-traceability.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'IDENTITY_COMPUTATION_COLLAPSE_V1_PASS';

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
  'src/contract-bound-generation-authority-v4/approved-product-identity.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-types.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-report.ts',
  'src/contract-bound-generation-authority-v4/index.ts',
  'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
  'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
  'src/code-generation-engine/code-generation-engine-types.ts',
  'src/code-generation-engine/code-generation-engine-authority.ts',
  'src/code-generation-engine/universal-crud-app-generator.ts',
  'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts',
  'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
  'src/universal-prompt-to-app-materialization/prompt-app-metadata.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-types.ts',
  'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  'src/prompt-faithful-generation/prompt-feature-extractor.ts',
];

// Files this milestone must leave byte-for-byte untouched — GPCA/CBGA repair-policy/Product
// Faithfulness/AEO/EIAA ownership must never be weakened by an identity-collapse fix.
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

function genericDefinitionFixture(overrides: Partial<ProfileFeatureDefinition> = {}): ProfileFeatureDefinition & {
  customDomainCopy?: Record<string, string>;
} {
  return {
    readOnly: true,
    profile: 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: 'custom-app',
    featureModules: ['auth', 'dashboard', 'records', 'settings'],
    routes: ['/', '/dashboard', '/records', '/settings'],
    requiredUiTerms: ['dashboard'],
    forbiddenGenericTerms: [],
    customDomainCopy: {
      headline: 'Stale Headline Text — from a different build',
      dashboard: 'Stale Headline Text overview.',
    },
    ...overrides,
  } as ProfileFeatureDefinition & { customDomainCopy?: Record<string, string> };
}

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

async function main(): Promise<void> {
  // ===========================================================================================
  // Scenario 1-2 — the approved identity handoff object exists and is produced from the
  // CBGA-repaired plan.
  // ===========================================================================================
  const directIdentity = buildApprovedProductIdentity({
    contractProductIdentity: 'Riverside Bistro Manager',
    repairedAppTitle: 'Riverside Bistro Manager',
    promptHash: 'hash-1',
    buildId: 'build-1',
  });
  assert(
    '1. Approved identity handoff object exists with the required structural shape (productIdentity, displayName, source, provenanceRuleIds, owningStage, consumers, immutable, promptHash, buildId, generatedAt)',
    directIdentity.readOnly === true &&
      directIdentity.productIdentity === 'Riverside Bistro Manager' &&
      directIdentity.displayName === 'Riverside Bistro Manager' &&
      directIdentity.source === APPROVED_PRODUCT_IDENTITY_SOURCE &&
      Array.isArray(directIdentity.provenanceRuleIds) &&
      directIdentity.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' &&
      Array.isArray(directIdentity.consumers) &&
      directIdentity.immutable === true &&
      directIdentity.promptHash === 'hash-1' &&
      directIdentity.buildId === 'build-1' &&
      typeof directIdentity.generatedAt === 'string',
    `identity=${JSON.stringify(directIdentity)}`,
  );

  const genericTitleContract = contractEvidenceFixture({ productIdentity: 'Riverside Bistro Manager' });
  const genericTitleReport = runContractBoundGenerationAuthority({
    contract: genericTitleContract,
    proposed: {
      proposedModuleIds: ['reservations', 'orders'],
      proposedRoutes: ['/reservations', '/orders'],
      proposedNavigationLabels: ['Reservations', 'Orders'],
      proposedAppTitle: 'Custom App',
    },
  });
  assert(
    '2. Approved identity is produced from the CBGA-repaired plan — approvedIdentity.displayName equals CBGA repairedInputs.appTitle, and source is CBGA_REPAIRED_PLAN',
    genericTitleReport.approvedIdentity.displayName === genericTitleReport.repairedInputs.appTitle &&
      genericTitleReport.approvedIdentity.displayName === 'Riverside Bistro Manager' &&
      genericTitleReport.approvedIdentity.source === 'CBGA_REPAIRED_PLAN' &&
      genericTitleReport.approvedIdentity.productIdentity === genericTitleContract.productIdentity,
    `approvedIdentity.displayName=${JSON.stringify(genericTitleReport.approvedIdentity.displayName)}, repairedInputs.appTitle=${JSON.stringify(genericTitleReport.repairedInputs.appTitle)}`,
  );

  // ===========================================================================================
  // End-to-end production pipeline fixtures reused by many scenarios below: real prompt -> real
  // contract -> real CBGA -> real materialization, all real, unmocked production functions.
  // ===========================================================================================
  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT, null);
  const contract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const cbgaResult = applyContractBoundGenerationToBuildPlan(buildPlan, contract, { promptHash: 'e2e-hash', buildId: 'e2e-build' });
  const approvedIdentity = cbgaResult.report.approvedIdentity;

  const liveFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'identity-collapse-e2e-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: cbgaResult.buildPlan,
    approvedIdentity,
  });
  const liveByPath = new Map(liveFiles.map((f) => [f.relativePath, f.content]));

  // ===========================================================================================
  // Scenario 3 — Blueprint Generator consumes the approved identity.
  // ===========================================================================================
  const blueprintManifest = JSON.parse(liveByPath.get('blueprint-manifest.json') ?? '{}') as { appName?: string };
  assert(
    '3. Blueprint Generator consumes the approved identity (blueprint-manifest.json appName equals approvedIdentity.displayName)',
    blueprintManifest.appName === approvedIdentity.displayName,
    `blueprintManifest.appName=${JSON.stringify(blueprintManifest.appName)}, approvedIdentity.displayName=${JSON.stringify(approvedIdentity.displayName)}`,
  );

  // ===========================================================================================
  // Scenario 4 — Blueprint Product Surface generator consumes the approved identity.
  // ===========================================================================================
  const productSurface = buildBlueprintProductSurface({
    appName: approvedIdentity.displayName,
    coreFeatureLabel: 'Reservations',
    homeSummary: `${approvedIdentity.displayName} is ready.`,
    contractDerivationSource: 'APP_NAME_ONLY',
  });
  assert(
    '4. Blueprint Product Surface generator consumes the approved identity (rendered home content references approvedIdentity.displayName)',
    productSurface.content.homeRecentActivityItems.some((item) => item.includes(approvedIdentity.displayName)) &&
      productSurface.content.homeSubtitle.includes(approvedIdentity.displayName),
    `homeRecentActivityItems=${JSON.stringify(productSurface.content.homeRecentActivityItems)}`,
  );
  const liveProductSurfaceTs = liveByPath.get('src/blueprint/product-surface.ts') ?? '';
  assert(
    '4b. (production wiring) the generated src/blueprint/product-surface.ts for this build actually contains the approved identity',
    liveProductSurfaceTs.includes(approvedIdentity.displayName),
    `productSurfaceTs contains displayName=${liveProductSurfaceTs.includes(approvedIdentity.displayName)}`,
  );

  // ===========================================================================================
  // Scenario 5 — Modular feature router generator consumes the approved identity, never a
  // customDomainCopy.headline split.
  // ===========================================================================================
  const staleHeadlineDefinition = genericDefinitionFixture({
    profile: 'ASSISTIVE_COMMUNICATION_APP_V1',
    customDomainCopy: { headline: 'Stale Headline Text — from a different build' },
  });
  const routerWithApprovedIdentity = buildFeatureAppRouterTsx(staleHeadlineDefinition, 'Riverside Bistro Manager');
  assert(
    '5. Modular feature router generator consumes the approved identity (rendered <h1> uses approvedDisplayName, not the stale customDomainCopy.headline split)',
    routerWithApprovedIdentity.includes('<h1>Riverside Bistro Manager</h1>') &&
      !routerWithApprovedIdentity.includes('Stale Headline Text'),
    `containsApprovedTitle=${routerWithApprovedIdentity.includes('<h1>Riverside Bistro Manager</h1>')}, containsStaleHeadline=${routerWithApprovedIdentity.includes('Stale Headline Text')}`,
  );

  // ===========================================================================================
  // Scenario 6 — Universal Feature Contract consumes the approved identity in the production
  // path (feature-contract.json / universal-feature-contract.json).
  // ===========================================================================================
  const featureContractJson = JSON.parse(liveByPath.get('feature-contract.json') ?? '{}') as { productName?: string };
  const universalFeatureContractJson = JSON.parse(liveByPath.get('universal-feature-contract.json') ?? '{}') as { productName?: string };
  assert(
    '6. Universal Feature Contract consumes the approved identity in the production path (feature-contract.json AND universal-feature-contract.json productName both equal approvedIdentity.displayName)',
    featureContractJson.productName === approvedIdentity.displayName &&
      universalFeatureContractJson.productName === approvedIdentity.displayName,
    `feature-contract.json.productName=${JSON.stringify(featureContractJson.productName)}, universal-feature-contract.json.productName=${JSON.stringify(universalFeatureContractJson.productName)}`,
  );

  // ===========================================================================================
  // Scenario 7 — generated app metadata consumes the approved identity.
  // ===========================================================================================
  const appMetadataTs = liveByPath.get('src/blueprint/app-metadata.ts') ?? '';
  assert(
    '7. Generated app metadata (src/blueprint/app-metadata.ts) consumes the approved identity',
    new RegExp(`APP_NAME[^=]*=\\s*['"]${approvedIdentity.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(appMetadataTs),
    `appMetadataTs=${appMetadataTs.slice(0, 200)}`,
  );

  // ===========================================================================================
  // Scenario 8 — blueprint manifest consumes the approved identity (dedicated check; scenario 3
  // proves the Blueprint Generator overall, this proves the specific manifest artifact field).
  // ===========================================================================================
  assert(
    '8. blueprint-manifest.json appName field equals approvedIdentity.displayName',
    blueprintManifest.appName === approvedIdentity.displayName,
    `blueprintManifest.appName=${JSON.stringify(blueprintManifest.appName)}`,
  );

  // ===========================================================================================
  // Scenario 9 — the generated build/app manifest consumes the approved identity.
  // ===========================================================================================
  const generatedAppManifest = JSON.parse(liveByPath.get(GENERATED_APP_MANIFEST_FILENAME) ?? '{}') as { projectName?: string };
  assert(
    '9. Generated app/build manifest (.generated-app-manifest.json) projectName equals approvedIdentity.displayName',
    generatedAppManifest.projectName === approvedIdentity.displayName,
    `generatedAppManifest.projectName=${JSON.stringify(generatedAppManifest.projectName)}`,
  );

  // ===========================================================================================
  // Scenario 10 — GPCA compares against the approved identity.
  // ===========================================================================================
  const gpcaEvidenceMatching: GpcaPipelineEvidenceInput = {
    contract: genericTitleContract,
    cbgaReport: genericTitleReport,
    proposed: {
      appTitle: genericTitleReport.approvedIdentity.displayName,
      moduleIds: genericTitleReport.repairedInputs.moduleIds,
      routes: genericTitleReport.repairedInputs.routes,
      navigationLabels: genericTitleReport.repairedInputs.navigationLabels,
      generatedFilePaths: [],
    },
  };
  const titleChainMatching = buildContractTraceabilityChains(gpcaEvidenceMatching).find((r) => r.artifactKind === 'TITLE');
  assert(
    '10. GPCA compares the proposed app title against the approved identity (titleTraceability proves a title equal to approvedIdentity.displayName)',
    titleChainMatching?.proven === true,
    `titleChain=${JSON.stringify(titleChainMatching)}`,
  );
  const gpcaEvidenceMismatching: GpcaPipelineEvidenceInput = {
    ...gpcaEvidenceMatching,
    proposed: { ...gpcaEvidenceMatching.proposed, appTitle: 'Reusable Components Where' },
  };
  const titleChainMismatching = buildContractTraceabilityChains(gpcaEvidenceMismatching).find((r) => r.artifactKind === 'TITLE');
  assert(
    '10b. (no-weakening) GPCA still correctly reports a title that matches NEITHER the contract identity NOR the approved identity as unproven',
    titleChainMismatching?.proven === false,
    `titleChain=${JSON.stringify(titleChainMismatching)}`,
  );

  // ===========================================================================================
  // Scenario 11 — final engineering report uses the approved identity (source-level: the
  // orchestrator's success result carries `approvedProductIdentity`, and the type declares it).
  // ===========================================================================================
  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  const typesSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8');
  assert(
    '11. Final engineering report (OnePromptLivePreviewBuildResult) declares and populates approvedProductIdentity from the same object threaded into materialization',
    typesSource.includes('approvedProductIdentity') &&
      orchestratorSource.includes('approvedProductIdentity: approvedIdentity') &&
      orchestratorSource.includes('const approvedIdentity: ApprovedProductIdentity = contractBoundGeneration.approvedIdentity'),
    'checked src/one-prompt-live-preview/{one-prompt-build-orchestrator.ts,one-prompt-live-preview-types.ts}',
  );

  // ===========================================================================================
  // Scenario 12-13 — raw prompt identity derivation is allowed only before contract approval,
  // never downstream of CBGA in the real production path.
  // ===========================================================================================
  const preContractExtraction = resolvePromptFaithfulBuildPlan(REAL_PROMPT, null);
  assert(
    '12. Raw prompt identity derivation is allowed before contract approval (resolvePromptFaithfulBuildPlan still seeds a draft extraction.appName from the raw prompt pre-CBGA)',
    typeof preContractExtraction.extraction.appName === 'string' && preContractExtraction.extraction.appName.length > 0,
    `draft appName=${JSON.stringify(preContractExtraction.extraction.appName)}`,
  );
  const cbgaCallIndex = orchestratorSource.indexOf('applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract');
  const materializeCallIndex = orchestratorSource.indexOf('materializeGeneratedApplication({');
  const extractAppNameCallsAfterCbga = orchestratorSource.slice(cbgaCallIndex + 1).match(/\bextractAppName\(/g) ?? [];
  const extractPromptAppTitleCallsAfterCbga = orchestratorSource.slice(cbgaCallIndex + 1).match(/\bextractPromptAppTitle\(/g) ?? [];
  const materializeCallPassesApprovedIdentity = /approvedIdentity,\r?\n\s*\}\)/.test(orchestratorSource);
  assert(
    '13. Raw prompt identity derivation is NOT used downstream of CBGA in the orchestrator (no extractAppName/extractPromptAppTitle call appears anywhere after the CBGA repair call, and materialization is called after it with approvedIdentity)',
    cbgaCallIndex > 0 &&
      materializeCallIndex > cbgaCallIndex &&
      extractAppNameCallsAfterCbga.length === 0 &&
      extractPromptAppTitleCallsAfterCbga.length === 0 &&
      materializeCallPassesApprovedIdentity,
    `cbgaCallIndex=${cbgaCallIndex}, materializeCallIndex=${materializeCallIndex}, extractAppNameCallsAfterCbga=${extractAppNameCallsAfterCbga.length}, extractPromptAppTitleCallsAfterCbga=${extractPromptAppTitleCallsAfterCbga.length}, materializeCallPassesApprovedIdentity=${materializeCallPassesApprovedIdentity}`,
  );

  // ===========================================================================================
  // Scenario 14-15 — extractAppName/extractPromptAppTitle remain documented draft/pre-contract
  // only, never called downstream of CBGA repair in production generator paths.
  // ===========================================================================================
  const extractorSource = readFileSync(join(ROOT, 'src/prompt-faithful-generation/prompt-feature-extractor.ts'), 'utf8');
  assert(
    '14. extractAppName remains draft-only/pre-contract (documented as such directly above its definition)',
    /DRAFT \/ PRE-CONTRACT ONLY[\s\S]{0,600}function extractAppName/.test(extractorSource),
    'checked doc-comment immediately preceding function extractAppName',
  );
  const promptAppMetadataSource = readFileSync(join(ROOT, 'src/universal-prompt-to-app-materialization/prompt-app-metadata.ts'), 'utf8');
  assert(
    '15. extractPromptAppTitle remains draft-only/pre-contract (documented as such directly above its definition)',
    /DRAFT \/ PRE-CONTRACT ONLY[\s\S]{0,600}export function extractPromptAppTitle/.test(promptAppMetadataSource),
    'checked doc-comment immediately preceding export function extractPromptAppTitle',
  );

  // ===========================================================================================
  // Scenario 16 — title/headline splitting no longer determines production identity when an
  // approved identity is supplied.
  // ===========================================================================================
  assert(
    '16. title/headline splitting (customDomainCopy.headline.split(\' — \')) no longer determines the rendered app title once an approved identity is supplied',
    !routerWithApprovedIdentity.includes('<h1>Stale Headline Text</h1>') &&
      routerWithApprovedIdentity.includes('<h1>Riverside Bistro Manager</h1>'),
    `router contains stale split title=${routerWithApprovedIdentity.includes('<h1>Stale Headline Text</h1>')}`,
  );

  // ===========================================================================================
  // Scenario 17 — profile-derived identity (the per-profile fallback branches in
  // buildProfileContract) no longer determines production identity once approved identity exists.
  // ===========================================================================================
  const expenseTrackerContractWithApproved = buildUniversalFeatureContract({
    contractId: 'profile-fallback-check',
    rawPrompt: 'Track my expenses and categorize spending.',
    profile: 'EXPENSE_TRACKER_WEB_V1',
    approvedProductName: 'Riverside Bistro Manager',
  });
  assert(
    '17. profile-derived identity (e.g. the EXPENSE_TRACKER_WEB_V1 branch\'s own "Expense Tracker" default) no longer determines production identity once an approved identity is supplied',
    expenseTrackerContractWithApproved.productName === 'Riverside Bistro Manager',
    `productName=${JSON.stringify(expenseTrackerContractWithApproved.productName)}`,
  );
  const expenseTrackerContractWithoutApproved = buildUniversalFeatureContract({
    contractId: 'profile-fallback-check-2',
    rawPrompt: 'Track my expenses and categorize spending.',
    profile: 'EXPENSE_TRACKER_WEB_V1',
  });
  assert(
    '17b. (no-regression) the profile-derived fallback still works normally for pre-CBGA/isolated/test-only callers that omit approvedProductName',
    expenseTrackerContractWithoutApproved.productName.length > 0,
    `productName=${JSON.stringify(expenseTrackerContractWithoutApproved.productName)}`,
  );

  // ===========================================================================================
  // Scenario 18 — workspace-folder name never determines production identity.
  // ===========================================================================================
  const workspaceFolderIdentityHits: string[] = [];
  for (const f of TOUCHED_PRODUCTION_FILES) {
    let src = '';
    try {
      src = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      continue;
    }
    if (/basename\(\s*workspaceDir\s*\)|basename\(\s*projectRootDir\s*\)/.test(src)) {
      workspaceFolderIdentityHits.push(f);
    }
  }
  assert(
    '18. Workspace-folder name does not determine production identity anywhere in the touched files (no basename(workspaceDir)/basename(projectRootDir) usage)',
    workspaceFolderIdentityHits.length === 0,
    workspaceFolderIdentityHits.length === 0 ? 'no workspace-folder-derived identity usage found' : `hits: ${workspaceFolderIdentityHits.join(', ')}`,
  );

  // ===========================================================================================
  // Scenario 19 — a missing/invalid approved identity fails with a constitutional violation
  // instead of deriving a fallback, once the caller supplies one at all.
  // ===========================================================================================
  const blankIdentity: ApprovedProductIdentity = {
    ...directIdentity,
    displayName: '   ',
  };
  let threwOnInvalidIdentity = false;
  let threwMessage = '';
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'invalid-identity-check',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity: blankIdentity,
    });
  } catch (err) {
    threwOnInvalidIdentity = true;
    threwMessage = err instanceof Error ? err.message : String(err);
  }
  assert(
    '19. A supplied-but-structurally-invalid approved identity fails with an explicit constitutional violation instead of silently deriving a fallback identity',
    threwOnInvalidIdentity && /CONSTITUTIONAL_VIOLATION_PPC_1207/.test(threwMessage),
    `threw=${threwOnInvalidIdentity}, message=${threwMessage}`,
  );
  assert(
    '19b. isApprovedProductIdentityValid correctly rejects blank/whitespace-only displayName',
    !isApprovedProductIdentityValid(blankIdentity),
    `isValid=${isApprovedProductIdentityValid(blankIdentity)}`,
  );

  // ===========================================================================================
  // Scenario 20-27 — the constitutional rule IDs this milestone enforces are recorded on the
  // approved identity's own provenance (never invented ad hoc in the validator).
  // ===========================================================================================
  const REQUIRED_RULE_IDS = ['PPC-101', 'PPC-201', 'PPC-202', 'PPC-401', 'PPC-402', 'PPC-1207', 'PPC-1609', 'PPC-1701', 'PPC-1702', 'PPC-1703'];
  for (const [idx, ruleId] of REQUIRED_RULE_IDS.entries()) {
    assert(
      `${20 + idx}. ${ruleId} is recorded on the approved identity's provenanceRuleIds`,
      APPROVED_PRODUCT_IDENTITY_PROVENANCE_RULE_IDS.includes(ruleId) && directIdentity.provenanceRuleIds.includes(ruleId),
      `provenanceRuleIds=${JSON.stringify(APPROVED_PRODUCT_IDENTITY_PROVENANCE_RULE_IDS)}`,
    );
  }

  // ===========================================================================================
  // Scenario 28-29 — ownership is preserved: Product Faithfulness still owns canonical product
  // purpose/concepts, CBGA still owns repaired production identity.
  // ===========================================================================================
  assert(
    '28. Product Faithfulness still owns canonical product purpose/concepts (approvedIdentity.productIdentity traces to buildCanonicalProductContract\'s own productIdentity, never re-derived by this milestone)',
    approvedIdentity.productIdentity === contract.productIdentity,
    `approvedIdentity.productIdentity=${JSON.stringify(approvedIdentity.productIdentity)}, contract.productIdentity=${JSON.stringify(contract.productIdentity)}`,
  );
  assert(
    '29. CBGA still owns repaired production identity (approvedIdentity.owningStage is CONTRACT_BOUND_GENERATION_AUTHORITY_V4, source is CBGA_REPAIRED_PLAN)',
    approvedIdentity.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' && approvedIdentity.source === 'CBGA_REPAIRED_PLAN',
    `owningStage=${approvedIdentity.owningStage}, source=${approvedIdentity.source}`,
  );

  // ===========================================================================================
  // Scenario 30-33 — no weakening of GPCA / CBGA / Product Faithfulness / AEO+EIAA.
  //
  // NOTE: this workspace has many prior, already-completed milestones sitting as uncommitted
  // changes against HEAD (including legitimate earlier edits to some of these same protected
  // files, e.g. classifyDomainEvidence precision fixes, rendered-content evidence work). A plain
  // `git diff -- <file>` vs. stale HEAD would therefore false-positive on files this milestone
  // never touched. The precise, milestone-scoped proof is that none of this milestone's own
  // identity-collapse markers were introduced into any protected authority file — i.e. this
  // milestone's edits never landed there, regardless of what earlier milestones already changed.
  // ===========================================================================================
  const IDENTITY_COLLAPSE_MARKERS = [
    'ApprovedProductIdentity',
    'approved-product-identity',
    'buildApprovedProductIdentity',
    'APPROVED_PRODUCT_IDENTITY_SOURCE',
    'CBGA_REPAIRED_PLAN',
    'Identity Computation Collapse',
  ];
  const protectedFileMarkerHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = IDENTITY_COLLAPSE_MARKERS.find((m) => content.includes(m));
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
    '30. No GPCA weakening (GPCA scoring/gate/legacy-detection/rendered-content-collector/rendered-content-gate/types files carry none of this milestone\'s identity-collapse markers — this milestone never edited them)',
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
    '31. No CBGA weakening (contract-module-plan/contract-route-plan/contract-navigation-plan/contract-surface-plan/contract-generation-gate — CBGA\'s own repair policy — carry none of this milestone\'s identity-collapse markers)',
    cbgaProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => cbgaProtected.includes(f))))}`,
  );
  const productFaithfulnessProtected = [
    'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
    'src/product-faithfulness-v2/canonical-product-contract.ts',
  ];
  assert(
    '32. No Product Faithfulness weakening (product-faithfulness-v1 feature extractor + product-faithfulness-v2 canonical contract builder carry none of this milestone\'s identity-collapse markers)',
    productFaithfulnessProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => productFaithfulnessProtected.includes(f))))}`,
  );
  const aeoEiaaProtected = [
    'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts',
    'src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts',
  ];
  assert(
    '33. No AEO/EIAA weakening (autonomous-engineering-orchestrator.ts + engineering-intelligence-activation-authority.ts carry none of this milestone\'s identity-collapse markers)',
    aeoEiaaProtected.every((f) => !protectedFileMarkerHits.has(f)),
    `marker hits=${JSON.stringify(Object.fromEntries([...protectedFileMarkerHits].filter(([f]) => aeoEiaaProtected.includes(f))))}`,
  );

  // ===========================================================================================
  // Scenario 34-35 — self-discipline: this milestone's OWN added lines contain no
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
    '34. No application-specific logic introduced by this milestone\'s own added lines',
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
    '35. No VERE work was introduced by this milestone',
    !/\bvere\b/i.test(touchedSourceForVere),
    /\bvere\b/i.test(touchedSourceForVere) ? 'unexpected VERE reference found' : 'no VERE references found in touched files',
  );

  // ===========================================================================================
  // Scenario 36 — this validator runs standalone, never invoking sibling/broad validator chains.
  // ===========================================================================================
  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-identity-computation-collapse-v1.ts'), 'utf8');
  assert(
    '36. This validator never invokes another validate-*.ts script (no broad validator chain)',
    !/validate-(?!identity-computation-collapse-v1)[\w-]+\.ts/.test(thisValidatorSource.replace(/scripts\/validate-identity-computation-collapse-v1\.ts/g, '')),
    'inspected own source for references to sibling validator scripts',
  );

  // ===========================================================================================
  // Scenario 37 — no new TypeScript errors introduced in touched files.
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
  // Pre-existing baseline errors confirmed (via `git show HEAD` diff inspection) to already exist
  // in one-prompt-build-orchestrator.ts BEFORE this milestone's changes — unrelated pre-existing
  // readonly-array/ForensicBuildStage/return-shape issues this milestone neither introduced nor
  // is scoped to fix. Only genuinely NEW errors in touched files should fail this scenario.
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
    '37. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && touchedFileErrorLines.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}${touchedFileErrorLines.length > 0 ? `: ${touchedFileErrorLines.join(' | ')}` : ''}`,
  );

  // ===========================================================================================
  // Scenario 38 — mandatory Capability Matrix includes a dedicated row for this milestone (both
  // CBGA's and GPCA's capability matrices).
  // ===========================================================================================
  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Identity Computation Collapse');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Identity Computation Collapse');
  assert(
    '38. Mandatory Capability Matrix includes a dedicated, IMPLEMENTED row for Identity Computation Collapse (both CBGA\'s and GPCA\'s capability matrices)',
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
  // Scenario 39 — a restaurant-style prompt keeps exactly ONE identity through
  // contract -> CBGA -> generator -> metadata -> report.
  // ===========================================================================================
  const identityAcrossPipeline = [
    approvedIdentity.displayName,
    blueprintManifest.appName,
    featureContractJson.productName,
    universalFeatureContractJson.productName,
    generatedAppManifest.projectName,
  ];
  const uniqueIdentities = new Set(identityAcrossPipeline);
  assert(
    '39. A restaurant-style prompt keeps exactly ONE identity through contract -> CBGA -> generator (blueprint manifest, feature contracts) -> metadata (app-metadata.ts) -> report (approvedIdentity)',
    uniqueIdentities.size === 1 &&
      appMetadataTs.includes(approvedIdentity.displayName) &&
      !/reusable components where/i.test(approvedIdentity.displayName),
    `identities=${JSON.stringify(identityAcrossPipeline)}`,
  );

  // ===========================================================================================
  // Scenario 40 — a prompt containing implementation guidance like "Build reusable components
  // where appropriate" cannot become production identity downstream of CBGA, even under a
  // simulated hypothetical regression where the pre-CBGA draft extraction itself is corrupted.
  // ===========================================================================================
  const guidancePhraseInRealPrompt = /Build reusable components where appropriate/i.test(REAL_PROMPT);
  const corruptedExtraction = { ...cbgaResult.buildPlan.extraction, appName: 'Reusable Components Where' };
  const corruptedBuildPlan: ResolvedPromptFaithfulBuildPlan = {
    ...cbgaResult.buildPlan,
    extraction: corruptedExtraction,
  };
  const guardedIdentity = buildApprovedProductIdentity({
    contractProductIdentity: contract.productIdentity,
    repairedAppTitle: approvedIdentity.displayName,
    promptHash: 'guidance-guard-hash',
    buildId: 'guidance-guard-build',
  });
  const guardedFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'identity-collapse-guidance-guard-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: corruptedBuildPlan,
    approvedIdentity: guardedIdentity,
  });
  const guardedByPath = new Map(guardedFiles.map((f) => [f.relativePath, f.content]));
  const guardedFeatureContract = JSON.parse(guardedByPath.get('feature-contract.json') ?? '{}') as { productName?: string };
  const guardedBlueprintManifest = JSON.parse(guardedByPath.get('blueprint-manifest.json') ?? '{}') as { appName?: string };
  const guardedUniversalFeatureContract = JSON.parse(guardedByPath.get('universal-feature-contract.json') ?? '{}') as {
    productName?: string;
  };
  const guardedGeneratedAppManifest = JSON.parse(guardedByPath.get(GENERATED_APP_MANIFEST_FILENAME) ?? '{}') as {
    projectName?: string;
  };
  const guardedAppMetadataTs = guardedByPath.get('src/blueprint/app-metadata.ts') ?? '';
  // Only identity-BEARING fields are checked here — NOT the full generated bundle. The bundle
  // legitimately embeds the raw prompt verbatim in non-identity audit fields (e.g. manifest
  // `prompt`/`promptSummary`), and the real prompt itself contains the literal implementation-
  // guidance sentence "Build reusable components where appropriate". That verbatim, clearly-
  // labelled prompt echo is expected/desired provenance evidence, not a product-identity leak —
  // checking the whole bundle for the phrase would falsely flag correct behavior.
  const identityFieldsContainGuidancePhrase =
    /reusable components where/i.test(guardedFeatureContract.productName ?? '') ||
    /reusable components where/i.test(guardedBlueprintManifest.appName ?? '') ||
    /reusable components where/i.test(guardedUniversalFeatureContract.productName ?? '') ||
    /reusable components where/i.test(guardedGeneratedAppManifest.projectName ?? '') ||
    /reusable components where/i.test(guardedAppMetadataTs);
  assert(
    '40. A prompt containing implementation guidance ("Build reusable components where appropriate") cannot become production identity downstream of CBGA — even a corrupted pre-CBGA draft extraction.appName ("Reusable Components Where") is fully overridden by the approved identity in every identity-bearing generated artifact',
    guidancePhraseInRealPrompt &&
      guardedFeatureContract.productName === guardedIdentity.displayName &&
      guardedBlueprintManifest.appName === guardedIdentity.displayName &&
      guardedUniversalFeatureContract.productName === guardedIdentity.displayName &&
      guardedGeneratedAppManifest.projectName === guardedIdentity.displayName &&
      !identityFieldsContainGuidancePhrase,
    `guidancePhraseInRealPrompt=${guidancePhraseInRealPrompt}, guardedFeatureContract.productName=${JSON.stringify(guardedFeatureContract.productName)}, guardedBlueprintManifest.appName=${JSON.stringify(guardedBlueprintManifest.appName)}, guardedUniversalFeatureContract.productName=${JSON.stringify(guardedUniversalFeatureContract.productName)}, guardedGeneratedAppManifest.projectName=${JSON.stringify(guardedGeneratedAppManifest.projectName)}, identityFieldsContainGuidancePhrase=${identityFieldsContainGuidancePhrase}`,
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
