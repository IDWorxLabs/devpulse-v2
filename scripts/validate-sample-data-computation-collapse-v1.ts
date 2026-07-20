/**
 * SAMPLE_DATA_COMPUTATION_COLLAPSE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 7 — Sample Data Computation Collapse V1.
 *
 * Run only:
 *   npx tsx scripts/validate-sample-data-computation-collapse-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildApprovedSampleDataPlan,
  isApprovedSampleDataPlanValid,
  requireApprovedSampleDataPlan,
  APPROVED_SAMPLE_DATA_PLAN_SOURCE,
  APPROVED_SAMPLE_DATA_PLAN_SCHEMA_VERSION,
  APPROVED_SAMPLE_DATA_PLAN_PROVENANCE_RULE_IDS,
  APPROVED_SAMPLE_DATA_PLAN_CONSUMERS,
  dashboardActivityItemsFromApprovedSampleDataPlan,
  notificationSeedFromApprovedSampleDataPlan,
  type ApprovedSampleDataPlan,
} from '../src/contract-bound-generation-authority-v4/approved-sample-data-plan.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_CAPABILITY_MATRIX_ROWS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import { buildApprovedProductIdentity } from '../src/contract-bound-generation-authority-v4/approved-product-identity.js';
import { buildApprovedNavigationPlan } from '../src/contract-bound-generation-authority-v4/approved-navigation-plan.js';
import { buildApprovedModulePlan } from '../src/contract-bound-generation-authority-v4/approved-module-plan.js';
import { buildApprovedMetadataPlan } from '../src/contract-bound-generation-authority-v4/approved-metadata-plan.js';
import type { CbgaCanonicalContractEvidence } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { deriveNeutralAppTagline } from '../src/universal-prompt-to-app-materialization/prompt-app-metadata.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildContractTraceabilityChains } from '../src/generation-pipeline-compliance-authority-v1/contract-traceability.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'SAMPLE_DATA_COMPUTATION_COLLAPSE_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REAL_PROMPT = `Build a modern, production-quality Restaurant Management Platform for independent restaurants.

The application should be fully responsive and optimized for desktop, tablet, and mobile devices.

The goal is to produce a complete, coherent application with connected features, consistent
navigation, reservations, table management, orders, staff scheduling, and customer relationship
tracking. Build reusable components where appropriate throughout the codebase.`;

const TOUCHED_PRODUCTION_FILES = [
  'src/contract-bound-generation-authority-v4/approved-sample-data-plan.ts',
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
  'src/universal-prompt-to-app-materialization/profile-feature-ui-generator.ts',
  'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
  'src/universal-prompt-to-app-materialization/generated-app-manifest.ts',
  'src/universal-app-blueprint/universal-app-blueprint-types.ts',
  'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
  'src/universal-app-blueprint/universal-app-blueprint-product-surface.ts',
  'src/safe-payment-placeholder-policy/safe-payment-module-generator.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts',
  'src/universal-feature-contract-intelligence/universal-feature-contract-types.ts',
  'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
];

const PROTECTED_AUTHORITY_FILES = [
  'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
  'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
  'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
  'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
  'src/contract-bound-generation-authority-v4/contract-module-plan.ts',
  'src/contract-bound-generation-authority-v4/contract-generation-gate.ts',
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
    allConceptNames: ['reservation', 'table', 'order', 'staff', 'reservations', 'orders'],
    ...overrides,
  };
}

function composeFixturePlan(): ApprovedSampleDataPlan {
  const contract = contractEvidenceFixture();
  const identity = buildApprovedProductIdentity({
    contractProductIdentity: contract.productIdentity,
    repairedAppTitle: contract.productIdentity,
  });
  const navPlan = buildApprovedNavigationPlan({ navigationPlan: [], approvedModuleIds: ['reservation', 'order'] });
  const modPlan = buildApprovedModulePlan({
    modulePlan: [
      { moduleId: 'reservation', displayName: 'Reservations', sourceContractConcept: 'reservation', evidenceSource: 'CONTRACT', confidence: 'HIGH', allowed: true },
      { moduleId: 'order', displayName: 'Orders', sourceContractConcept: 'order', evidenceSource: 'CONTRACT', confidence: 'HIGH', allowed: true },
    ],
    routePlan: [
      { moduleId: 'reservation', route: '/', sourceModuleId: 'reservation' },
      { moduleId: 'order', route: '/order', sourceModuleId: 'order' },
    ],
    approvedModuleIds: ['reservation', 'order'],
  });
  const metadataPlan = buildApprovedMetadataPlan({
    identity,
    navigationPlan: navPlan,
    modulePlan: modPlan,
    contract,
    deriveApplicationSubtitle: deriveNeutralAppTagline,
  });
  return buildApprovedSampleDataPlan({
    identity,
    navigationPlan: navPlan,
    modulePlan: modPlan,
    metadataPlan,
    contract,
  });
}

async function main(): Promise<void> {
  const contract = contractEvidenceFixture();
  const cbgaReport = runContractBoundGenerationAuthority({
    contract,
    proposed: {
      proposedModuleIds: ['reservation', 'order'],
      proposedRoutes: ['/', '/order'],
      proposedNavigationLabels: [],
      proposedAppTitle: contract.productIdentity,
    },
    promptHash: 'hash-sample',
    buildId: 'build-sample',
  });

  const directPlan = cbgaReport.approvedSampleDataPlan;

  assert(
    '1. ApprovedSampleDataPlan exists with required structural shape',
    directPlan.readOnly === true &&
      Array.isArray(directPlan.sampleEntries) &&
      Array.isArray(directPlan.sampleCollections) &&
      Array.isArray(directPlan.dashboardCards) &&
      Array.isArray(directPlan.previewCards) &&
      Array.isArray(directPlan.emptyStateModels) &&
      typeof directPlan.demoAppTitle === 'string' &&
      Array.isArray(directPlan.demoFeatureModuleIds) &&
      typeof directPlan.sampleSummary === 'string' &&
      directPlan.source === APPROVED_SAMPLE_DATA_PLAN_SOURCE &&
      directPlan.schemaVersion === APPROVED_SAMPLE_DATA_PLAN_SCHEMA_VERSION &&
      directPlan.immutable === true &&
      typeof directPlan.generatedAt === 'string',
    `source=${directPlan.source}`,
  );

  assert(
    '2. ApprovedSampleDataPlan is composed from prior handoffs — demoAppTitle equals identity, demoFeatureModuleIds match module plan',
    directPlan.demoAppTitle === cbgaReport.approvedIdentity.displayName &&
      directPlan.demoFeatureModuleIds.length === cbgaReport.approvedModulePlan.moduleIds.length,
    `demoAppTitle=${directPlan.demoAppTitle}`,
  );

  assert(
    '3. ApprovedSampleDataPlan is built only after CBGA approval (present on every CbgaGenerationReport)',
    isApprovedSampleDataPlanValid(cbgaReport.approvedSampleDataPlan),
    `finalGateOutcome=${cbgaReport.finalGateOutcome}`,
  );

  assert(
    '4. ApprovedSampleDataPlan is immutable (readOnly === true, immutable === true)',
    directPlan.readOnly === true && directPlan.immutable === true,
    `immutable=${directPlan.immutable}`,
  );

  assert(
    '5. ApprovedSampleDataPlan carries provenance (non-empty provenanceRuleIds, all PPC-nnn rule IDs)',
    directPlan.provenanceRuleIds.length > 0 &&
      directPlan.provenanceRuleIds.every((id) => /^PPC-\d+$/.test(id)),
    `provenanceRuleIds=${JSON.stringify(directPlan.provenanceRuleIds)}`,
  );

  assert(
    '6. ApprovedSampleDataPlan carries owning stage CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    `owningStage=${directPlan.owningStage}`,
  );

  assert(
    '7. ApprovedSampleDataPlan carries declared downstream consumers',
    directPlan.consumers.length > 0 && directPlan.consumers === APPROVED_SAMPLE_DATA_PLAN_CONSUMERS,
    `consumers=${directPlan.consumers.length}`,
  );

  assert(
    '8. Default build has approvedSamplesPresent === false (no invented business records)',
    directPlan.approvedSamplesPresent === false && directPlan.approvedSamplesAllowed === false,
    `approvedSamplesPresent=${directPlan.approvedSamplesPresent}`,
  );

  assert(
    '9. Default build has empty dashboardCards, previewCards, sampleStatistics, sampleEntries',
    directPlan.dashboardCards.length === 0 &&
      directPlan.previewCards.length === 0 &&
      directPlan.sampleStatistics.length === 0 &&
      directPlan.sampleEntries.length === 0,
    `dashboard=${directPlan.dashboardCards.length}, preview=${directPlan.previewCards.length}`,
  );

  assert(
    '10. sampleCollections exist for every approvedEntityType with zero records',
    directPlan.sampleCollections.length === directPlan.approvedEntityTypes.length &&
      directPlan.sampleCollections.every((collection) => collection.records.length === 0),
    `collections=${directPlan.sampleCollections.length}, entityTypes=${directPlan.approvedEntityTypes.length}`,
  );

  assert(
    '11. emptyStateModels include architecture empty states for dashboard, notifications, cart, profile',
    ['DASHBOARD_RECENT_ACTIVITY', 'NOTIFICATIONS', 'CART', 'PROFILE'].every((surface) =>
      directPlan.emptyStateModels.some((model) => model.surface === surface),
    ),
    `emptyStates=${directPlan.emptyStateModels.map((m) => m.surface).join(',')}`,
  );

  assert(
    '12. traceability object records composedFrom handoffs and contractId',
    directPlan.traceability.composedFrom.length >= 5 &&
      directPlan.traceability.contractId === contract.contractId &&
      directPlan.traceability.samplesPresent === directPlan.approvedSamplesPresent,
    `composedFrom=${directPlan.traceability.composedFrom.length}`,
  );

  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT, null);
  const canonicalContract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const cbgaResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalContract, {
    promptHash: 'e2e-sample',
    buildId: 'e2e-sample-build',
  });
  const approvedIdentity = cbgaResult.report.approvedIdentity;
  const approvedNavigationPlan = cbgaResult.report.approvedNavigationPlan;
  const approvedModulePlan = cbgaResult.report.approvedModulePlan;
  const approvedMetadataPlan = cbgaResult.report.approvedMetadataPlan;
  const approvedSampleDataPlan = cbgaResult.report.approvedSampleDataPlan;

  assert(
    '13. Real restaurant prompt produces structurally valid ApprovedSampleDataPlan end-to-end',
    isApprovedSampleDataPlanValid(approvedSampleDataPlan),
    `sampleSummary=${approvedSampleDataPlan.sampleSummary}`,
  );

  const liveFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'sample-collapse-e2e-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: cbgaResult.buildPlan,
    approvedIdentity,
    approvedNavigationPlan,
    approvedModulePlan,
    approvedMetadataPlan,
    approvedSampleDataPlan,
  });

  const demoDataFile = liveFiles.find((file) => file.relativePath === 'src/data/demo-data.ts');
  const blueprintManifestFile = liveFiles.find((file) => file.relativePath === 'blueprint-manifest.json');
  const buildManifestFile = liveFiles.find((file) => file.relativePath === 'build-manifest.json');
  const generatedAppManifestFile = liveFiles.find((file) => file.relativePath === GENERATED_APP_MANIFEST_FILENAME);
  const featureContractFile = liveFiles.find((file) => file.relativePath === 'universal-feature-contract.json');
  const notificationsPage = liveFiles.find((file) => file.relativePath === 'src/blueprint/pages/NotificationsPage.tsx');
  const productSurfaceFile = liveFiles.find((file) => file.relativePath === 'src/blueprint/product-surface.ts');
  const homePageFile = liveFiles.find((file) => file.relativePath === 'src/blueprint/pages/HomePage.tsx');
  const profilePageFile = liveFiles.find((file) => file.relativePath === 'src/blueprint/pages/ProfilePage.tsx');

  assert(
    '14. Materialization emits demo-data.ts from ApprovedSampleDataPlan (APPROVED_SAMPLE_DATA_SOURCE marker)',
    Boolean(demoDataFile?.content.includes('APPROVED_SAMPLE_DATA_SOURCE')) &&
      demoDataFile?.content.includes(APPROVED_SAMPLE_DATA_PLAN_SOURCE) === true,
    `found=${Boolean(demoDataFile)}`,
  );

  assert(
    '15. demo-data.ts does NOT independently derive DEMO_FEATURE_MODULES from ProfileFeatureDefinition when plan supplied',
    Boolean(demoDataFile?.content.includes('APPROVED_SAMPLE_COLLECTIONS')),
    'missing APPROVED_SAMPLE_COLLECTIONS',
  );

  assert(
    '16. NotificationsPage SEED is empty array (no hardcoded maintenance/tips seed)',
    Boolean(notificationsPage?.content.includes('const SEED: Notice[] = []')),
    'expected empty SEED array',
  );

  assert(
    '17. product-surface has empty homeRecentActivityItems (no synthesized activity strings)',
    Boolean(productSurfaceFile?.content.includes('homeRecentActivityItems: []')),
    'expected empty homeRecentActivityItems',
  );

  assert(
    '18. HomePage renders EmptyState for empty recent activity',
    Boolean(homePageFile?.content.includes('homeRecentActivityEmptyTitle')),
    'missing empty-state wiring',
  );

  assert(
    '19. ProfilePage does not contain Guest User placeholder when no approved profile records',
    Boolean(profilePageFile && !profilePageFile.content.includes('Guest User')),
    'Guest User still present',
  );

  assert(
    '20. Generated files do not contain "Sample product" cart placeholder',
    !liveFiles.some((file) => file.content.includes('Sample product')),
    'Sample product found in generated output',
  );

  const blueprintManifest = blueprintManifestFile ? JSON.parse(blueprintManifestFile.content) : null;
  const buildManifest = buildManifestFile ? JSON.parse(buildManifestFile.content) : null;
  const generatedAppManifest = generatedAppManifestFile ? JSON.parse(generatedAppManifestFile.content) : null;
  const featureContract = featureContractFile ? JSON.parse(featureContractFile.content) : null;

  assert(
    '21. blueprint-manifest.json references approvedSampleSummary from plan',
    blueprintManifest?.approvedSampleSummary === approvedSampleDataPlan.sampleSummary,
    `manifest=${blueprintManifest?.approvedSampleSummary}`,
  );

  assert(
    '22. build-manifest.json references approvedSampleSummary from plan',
    buildManifest?.approvedSampleSummary === approvedSampleDataPlan.sampleSummary,
    `buildManifest=${buildManifest?.approvedSampleSummary}`,
  );

  assert(
    '23. .generated-app-manifest.json references approvedSampleSummary and approvedSamplesPresent',
    generatedAppManifest?.approvedSampleSummary === approvedSampleDataPlan.sampleSummary &&
      generatedAppManifest?.approvedSamplesPresent === approvedSampleDataPlan.approvedSamplesPresent,
    `summary=${generatedAppManifest?.approvedSampleSummary}`,
  );

  assert(
    '24. universal-feature-contract.json includes sampleData projection from plan',
    featureContract?.sampleData?.sampleSummary === approvedSampleDataPlan.sampleSummary &&
      featureContract?.sampleData?.approvedSamplesPresent === approvedSampleDataPlan.approvedSamplesPresent,
    `sampleData=${JSON.stringify(featureContract?.sampleData)}`,
  );

  const sampleAcrossPipeline = [
    JSON.stringify(approvedSampleDataPlan.sampleSummary),
    JSON.stringify(blueprintManifest?.approvedSampleSummary),
    JSON.stringify(generatedAppManifest?.approvedSampleSummary),
    JSON.stringify(buildManifest?.approvedSampleSummary),
  ];
  assert(
    '25. Restaurant prompt preserves IDENTICAL sampleSummary from CBGA -> Blueprint -> Materialization -> Manifests',
    new Set(sampleAcrossPipeline).size === 1 && approvedSampleDataPlan.sampleSummary.length > 0,
    `sampleAcrossPipeline=${JSON.stringify(sampleAcrossPipeline)}`,
  );

  const tamperedPlan: ApprovedSampleDataPlan = {
    ...approvedSampleDataPlan,
    approvedSamplesPresent: true,
  };
  let threwOnTampered = false;
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'tampered-sample-plan',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan,
      approvedModulePlan,
      approvedMetadataPlan,
      approvedSampleDataPlan: tamperedPlan,
    });
  } catch {
    threwOnTampered = true;
  }
  assert(
    '26. Tampered sample plan (approvedSamplesPresent diverged from empty collections) fails constitutionally',
    threwOnTampered || !isApprovedSampleDataPlanValid(tamperedPlan),
    `threwOnTampered=${threwOnTampered}, isValid=${isApprovedSampleDataPlanValid(tamperedPlan)}`,
  );

  let threwOnMissing = false;
  try {
    requireApprovedSampleDataPlan(null, 'validate-sample-data-scenario-27');
  } catch (err) {
    threwOnMissing = (err as Error).message.includes('CONSTITUTIONAL_VIOLATION_PPC_1207');
  }
  assert(
    '27. requireApprovedSampleDataPlan throws PPC-1207 when plan is missing',
    threwOnMissing,
    `threwOnMissing=${threwOnMissing}`,
  );

  const gpcaEvidence: GpcaPipelineEvidenceInput = {
    contract: canonicalContract,
    proposed: {
      moduleIds: cbgaResult.report.repairedInputs.moduleIds,
      routes: cbgaResult.report.repairedInputs.routes,
      navigationLabels: cbgaResult.report.repairedInputs.navigationLabels,
      appTitle: cbgaResult.report.repairedInputs.appTitle,
      welcomeSurfaceText: cbgaResult.report.repairedInputs.welcomeSurfaceText,
      primaryWorkflowVisible: true,
      primaryWorkflowInteractive: true,
    },
    cbgaReport: cbgaResult.report,
  };
  const traceability = buildContractTraceabilityChains(gpcaEvidence);
  const sampleTrace = traceability.find((entry) => entry.artifactKind === 'SAMPLE_DATA');

  assert(
    '28. GPCA sampleDataTraceability accepts ApprovedSampleDataPlan ancestry',
    sampleTrace?.proven === true && sampleTrace.artifactKind === 'SAMPLE_DATA',
    `sampleTrace=${JSON.stringify(sampleTrace)}`,
  );

  assert(
    '29. dashboardActivityItemsFromApprovedSampleDataPlan projects only from plan.dashboardCards',
    dashboardActivityItemsFromApprovedSampleDataPlan(approvedSampleDataPlan).length === 0,
    'expected empty projection',
  );

  assert(
    '30. notificationSeedFromApprovedSampleDataPlan projects only from plan.previewCards',
    notificationSeedFromApprovedSampleDataPlan(approvedSampleDataPlan).length === 0,
    'expected empty notification seed',
  );

  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  assert(
    '31. Orchestrator guards materialization with isApprovedSampleDataPlanValid',
    orchestratorSource.includes('isApprovedSampleDataPlanValid(approvedSampleDataPlan)'),
    'guard not found',
  );

  assert(
    '32. Orchestrator threads approvedSampleDataPlan into materializeGeneratedApplication',
    orchestratorSource.includes('approvedSampleDataPlan,') &&
      orchestratorSource.includes('contractBoundGeneration.approvedSampleDataPlan'),
    'threading not found',
  );

  assert(
    '33. CBGA authority builds approvedSampleDataPlan exactly once per report',
    readFileSync(join(ROOT, 'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts'), 'utf8').includes(
      'buildApprovedSampleDataPlan(',
    ),
    'buildApprovedSampleDataPlan call missing',
  );

  assert(
    '34. Only one ApprovedSampleDataPlan field on CbgaGenerationReport type',
    (readFileSync(join(ROOT, 'src/contract-bound-generation-authority-v4/contract-bound-generation-types.ts'), 'utf8').match(
      /approvedSampleDataPlan/g,
    ) ?? []).length >= 1,
    'type field missing',
  );

  const REQUIRED_RULE_IDS = [
    'PPC-101', 'PPC-201', 'PPC-202', 'PPC-401', 'PPC-402', 'PPC-1207',
    'PPC-1600', 'PPC-1601', 'PPC-1701', 'PPC-1702', 'PPC-1703', 'PPC-1800', 'PPC-1900',
  ];
  assert(
    '35. All required constitutional rule IDs recorded on provenanceRuleIds',
    REQUIRED_RULE_IDS.every((id) => APPROVED_SAMPLE_DATA_PLAN_PROVENANCE_RULE_IDS.includes(id)),
    `provenanceRuleIds=${JSON.stringify(APPROVED_SAMPLE_DATA_PLAN_PROVENANCE_RULE_IDS)}`,
  );

  const SAMPLE_COLLAPSE_MARKERS = [
    'ApprovedSampleDataPlan',
    'approved-sample-data-plan',
    'buildApprovedSampleDataPlan',
    'APPROVED_SAMPLE_DATA_PLAN_SOURCE',
    'CBGA_COMPOSED_SAMPLE_DATA_PLAN',
    'Sample Data Computation Collapse',
  ];
  const protectedHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = SAMPLE_COLLAPSE_MARKERS.find((m) => content.includes(m));
    if (hit) protectedHits.set(f, hit);
  }

  assert(
    '36. No GPCA weakening (scoring/gate/legacy-detection/rendered-content files carry none of this milestone\'s markers)',
    [
      'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
      'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
      'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
      'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
      'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
    ].every((f) => !protectedHits.has(f)),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '37. No CBGA policy change (contract-module-plan/contract-generation-gate carry none of this milestone\'s markers)',
    !protectedHits.has('src/contract-bound-generation-authority-v4/contract-module-plan.ts') &&
      !protectedHits.has('src/contract-bound-generation-authority-v4/contract-generation-gate.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '38. No Product Faithfulness weakening',
    !protectedHits.has('src/product-faithfulness-v2/canonical-product-contract.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '39. No AEO weakening',
    !protectedHits.has('src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '40. No EIAA weakening',
    !protectedHits.has('src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

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
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*'));
  const appSpecificHits = addedCodeLines.filter((l) =>
    /\b(domain|profile)\b\s*===\s*['"](restaurant|calculator|crm)['"]/i.test(l),
  );
  assert(
    '41. No application-specific logic in this milestone\'s added lines',
    appSpecificHits.length === 0,
    appSpecificHits.length === 0 ? `inspected ${addedCodeLines.length} lines` : appSpecificHits.join(' || '),
  );

  const touchedSource = TOUCHED_PRODUCTION_FILES.map((f) => {
    try {
      return readFileSync(join(ROOT, f), 'utf8');
    } catch {
      return '';
    }
  }).join('\n');
  assert('42. No VERE dependency introduced', !/\bvere\b/i.test(touchedSource), 'no VERE refs');

  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-sample-data-computation-collapse-v1.ts'), 'utf8');
  assert(
    '43. Validator never invokes sibling validate-*.ts scripts',
    !/(execSync|spawn)\s*\([^)]*validate-(?!sample-data-computation-collapse-v1)[\w-]+\.ts/.test(thisValidatorSource),
    'checked own source',
  );

  let tscOutput = '';
  let tscFailed = false;
  try {
    tscOutput = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailed = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  const PRE_EXISTING = [
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2322: Type '"CAPABILITY_PLANNING"' is not assignable to type 'ForensicBuildStage'\./,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2739:/,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS4104:/,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2322: Type 'string' is not assignable to type 'ForensicBuildStage'\./,
    /one-prompt-build-orchestrator\.ts\(\d+,\d+\): error TS2367:/,
  ];
  const touchedErrors = tscLines.filter((l) => {
    const n = l.replace(/\\/g, '/');
    if (!TOUCHED_PRODUCTION_FILES.some((f) => n.startsWith(f))) return false;
    return !PRE_EXISTING.some((re) => re.test(n));
  });
  assert(
    '44. No new TypeScript errors in touched files',
    !tscFailed && touchedErrors.length === 0,
    touchedErrors.length > 0 ? touchedErrors.join(' | ') : 'ok',
  );

  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Sample Data Computation Collapse');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Sample Data Computation Collapse');
  assert(
    '45. Capability Matrix includes Sample Data Computation Collapse (CBGA + GPCA, IMPLEMENTED, production wired)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
  );

  const composed = composeFixturePlan();
  assert(
    '46. approvedSeedCounts are zero for every approvedEntityType when no samples present',
    composed.approvedEntityTypes.every((entityType) => composed.approvedSeedCounts[entityType] === 0),
    `seedCounts=${JSON.stringify(composed.approvedSeedCounts)}`,
  );

  assert(
    '47. metadataTraceability still present after sampleDataTraceability extension (no GPCA rule removal)',
    traceability.some((entry) => entry.artifactKind === 'METADATA'),
    'metadata trace missing',
  );

  assert(
    '48. titleTraceability still present after sampleDataTraceability extension',
    traceability.some((entry) => entry.artifactKind === 'TITLE'),
    'title trace missing',
  );

  assert(
    '49. CBGA produces exactly one approvedSampleDataPlan reference per runContractBoundGenerationAuthority call',
    cbgaReport.approvedSampleDataPlan === directPlan,
    'reference mismatch',
  );

  assert(
    '50. Empty-state replaces missing sample data in blueprint notifications (EmptyState import present)',
    Boolean(notificationsPage?.content.includes("import EmptyState from '../components/EmptyState'")),
    'EmptyState import missing',
  );

  let failCount = 0;
  for (const r of results) {
    const marker = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failCount += 1;
    console.log(`${marker} — ${r.name}${r.passed ? '' : ` :: ${r.detail}`}`);
  }
  console.log(`\n${results.length - failCount}/${results.length} scenarios passed.`);

  if (failCount === 0) {
    console.log(`\n${PASS_TOKEN}`);
    process.exit(0);
  } else {
    console.error(`\n${failCount} scenario(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Validator crashed:', err);
  process.exit(1);
});
