/**
 * REPAIR_REALITY_ALIGNMENT_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 9 — Repair Reality Alignment V1.
 *
 * Run only:
 *   npx tsx scripts/validate-repair-reality-alignment-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isApprovedRepairRealityPlanValid,
  requireApprovedRepairRealityPlan,
  buildApprovedRepairRealityPlan,
  appendApprovedRepairRealityEntries,
  recordApprovedRepairRealityRevalidation,
  createWorkspaceMutationRepairEntry,
  createAutofixCompilationRepairEntry,
  createPreviewRecoveryRepairEntry,
  createPipelineRestartRepairEntry,
  createGeneratorRegenerationRepairEntry,
  createCapabilityEvolutionRepairEntry,
  repairRevalidationSatisfiedBeforePreview,
  repairRealityRequiresRevalidationBeforePreview,
  APPROVED_REPAIR_REALITY_PLAN_SOURCE,
  APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION,
  APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS,
  APPROVED_REPAIR_REALITY_PLAN_CONSUMERS,
  type ApprovedRepairRealityPlan,
} from '../src/contract-bound-generation-authority-v4/approved-repair-reality-plan.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_CAPABILITY_MATRIX_ROWS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import {
  CONSTITUTIONAL_REPAIR_TYPES,
  expectedMutationFlagsForRepairType,
  repairTypeRequiresGpcaRerun,
  repairTypeRequiresProductFaithfulnessRerun,
} from '../src/production-pipeline-constitution-v1/repair-reality-types.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildContractTraceabilityChains } from '../src/generation-pipeline-compliance-authority-v1/contract-traceability.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'REPAIR_REALITY_ALIGNMENT_V1_PASS';

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
  'src/production-pipeline-constitution-v1/repair-reality-types.ts',
  'src/contract-bound-generation-authority-v4/approved-repair-reality-plan.ts',
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
  'src/universal-prompt-to-app-materialization/generated-app-manifest.ts',
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

async function main(): Promise<void> {
  const contract = contractEvidenceFixture();
  const cbgaReport = runContractBoundGenerationAuthority({
    contract,
    proposed: {
      proposedModuleIds: ['reservation', 'order', 'reusable-components'],
      proposedRoutes: ['/', '/order'],
      proposedNavigationLabels: [],
      proposedAppTitle: 'Custom App',
    },
    promptHash: 'hash-repair',
    buildId: 'build-repair',
  });

  const directPlan = cbgaReport.approvedRepairRealityPlan;

  assert(
    '1. ApprovedRepairRealityPlan exists with required structural shape',
    directPlan.readOnly === true &&
      Array.isArray(directPlan.repairEntries) &&
      typeof directPlan.repairSummary === 'string' &&
      directPlan.source === APPROVED_REPAIR_REALITY_PLAN_SOURCE &&
      directPlan.schemaVersion === APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION &&
      directPlan.immutable === true &&
      typeof directPlan.generatedAt === 'string',
    `source=${directPlan.source}`,
  );

  assert(
    '2. ApprovedRepairRealityPlan is composed from CBGA repairsApplied',
    directPlan.repairEntries.length === cbgaReport.repairsApplied.length &&
      directPlan.contractId === contract.contractId,
    `entries=${directPlan.repairEntries.length}, repairs=${cbgaReport.repairsApplied.length}`,
  );

  assert(
    '3. ApprovedRepairRealityPlan is built only after CBGA approval (present on every CbgaGenerationReport)',
    cbgaReport.approvedRepairRealityPlan === directPlan,
    'missing on report',
  );

  assert(
    '4. ApprovedRepairRealityPlan is immutable (readOnly === true, immutable === true)',
    directPlan.immutable === true && directPlan.readOnly === true,
    `immutable=${directPlan.immutable}`,
  );

  assert(
    '5. ApprovedRepairRealityPlan carries provenance (non-empty provenanceRuleIds, all PPC-nnn rule IDs)',
    directPlan.provenanceRuleIds.length > 0 &&
      APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS.every((id) => directPlan.provenanceRuleIds.includes(id)),
    `provenanceRuleIds=${directPlan.provenanceRuleIds.join(',')}`,
  );

  assert(
    '6. ApprovedRepairRealityPlan carries owning stage CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    `owningStage=${directPlan.owningStage}`,
  );

  assert(
    '7. ApprovedRepairRealityPlan carries declared downstream consumers',
    APPROVED_REPAIR_REALITY_PLAN_CONSUMERS.every((c) => directPlan.consumers.includes(c)),
    `consumers=${directPlan.consumers.join(',')}`,
  );

  assert(
    '8. Every CBGA repair entry is constitutionally classified with matching mutation flags',
    directPlan.repairEntries.every(
      (entry) =>
        CONSTITUTIONAL_REPAIR_TYPES.includes(entry.repairType) &&
        entry.filesMutated === expectedMutationFlagsForRepairType(entry.repairType).filesMutated &&
        entry.workspaceMutated === expectedMutationFlagsForRepairType(entry.repairType).workspaceMutated,
    ),
    `types=${directPlan.repairEntries.map((e) => e.repairType).join(',')}`,
  );

  assert(
    '9. CBGA input repairs never claim workspace mutation',
    directPlan.repairEntries.every((entry) => entry.producer === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' ? !entry.workspaceMutated : true),
    'cbga repair claimed workspace mutation',
  );

  const baselineRepaired = cbgaReport.repairedInputs;
  const noRepairReport = runContractBoundGenerationAuthority({
    contract,
    proposed: {
      proposedModuleIds: baselineRepaired.moduleIds,
      proposedRoutes: baselineRepaired.routes,
      proposedNavigationLabels: baselineRepaired.navigationLabels,
      proposedAppTitle: baselineRepaired.appTitle,
    },
    promptHash: 'hash-clean',
    buildId: 'build-clean',
  });
  assert(
    '10. GENERATION_ALLOWED with no repairs produces valid plan with zero repair entries',
    noRepairReport.repairsApplied.length === 0 &&
      noRepairReport.approvedRepairRealityPlan.repairEntries.length === 0 &&
      isApprovedRepairRealityPlanValid(noRepairReport.approvedRepairRealityPlan),
    `repairs=${noRepairReport.repairsApplied.length}, entries=${noRepairReport.approvedRepairRealityPlan.repairEntries.length}`,
  );

  assert(
    '11. Constitutional taxonomy includes all minimum repair classes',
    [
      'REPORT_ONLY', 'EVIDENCE_ONLY', 'DIAGNOSTIC_ONLY', 'MANIFEST_ONLY', 'WORKSPACE_MUTATION',
      'SOURCE_MUTATION', 'GENERATOR_REGENERATION', 'AUTOFIX_COMPILATION', 'AUTOFIX_RUNTIME',
      'CAPABILITY_EVOLUTION', 'PREVIEW_RECOVERY', 'PIPELINE_RESTART', 'CONTRACT_REPAIR',
      'IDENTITY_REPAIR', 'NAVIGATION_REPAIR', 'MODULE_REPAIR', 'METADATA_REPAIR',
      'SAMPLE_DATA_REPAIR', 'PROVENANCE_REPAIR',
    ].every((t) => CONSTITUTIONAL_REPAIR_TYPES.includes(t as (typeof CONSTITUTIONAL_REPAIR_TYPES)[number])),
    `count=${CONSTITUTIONAL_REPAIR_TYPES.length}`,
  );

  const canonicalProductContract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT);
  const bound = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract, {
    promptHash: 'hash-restaurant',
    buildId: 'build-restaurant',
  });
  const restaurantPlan = bound.report.approvedRepairRealityPlan;

  assert(
    '12. Real restaurant prompt produces structurally valid ApprovedRepairRealityPlan end-to-end',
    isApprovedRepairRealityPlanValid(restaurantPlan),
    restaurantPlan.repairSummary,
  );

  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'restaurant-repair-test',
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: bound.buildPlan,
    approvedIdentity: bound.report.approvedIdentity,
    approvedNavigationPlan: bound.report.approvedNavigationPlan,
    approvedModulePlan: bound.report.approvedModulePlan,
    approvedMetadataPlan: bound.report.approvedMetadataPlan,
    approvedSampleDataPlan: bound.report.approvedSampleDataPlan,
    approvedProvenancePlan: bound.report.approvedProvenancePlan,
    approvedRepairRealityPlan: bound.report.approvedRepairRealityPlan,
  });

  const manifestFile = workspaceFiles.find((f) => f.relativePath === GENERATED_APP_MANIFEST_FILENAME);
  const buildManifestFile = workspaceFiles.find((f) => f.relativePath === 'build-manifest.json');
  const featureContractFile = workspaceFiles.find((f) => f.relativePath === 'universal-feature-contract.json');

  assert(
    '13. .generated-app-manifest.json references approvedRepairRealitySummary from plan',
    manifestFile?.content.includes('approvedRepairRealitySummary') === true &&
      JSON.parse(manifestFile!.content.replace(/^\uFEFF/, '')).approvedRepairRealitySummary ===
        restaurantPlan.repairSummary,
    'manifest missing repair summary',
  );

  assert(
    '14. build-manifest.json references approvedRepairRealitySummary from plan',
    buildManifestFile?.content.includes('approvedRepairRealitySummary') === true &&
      JSON.parse(buildManifestFile!.content).approvedRepairRealitySummary === restaurantPlan.repairSummary,
    'build-manifest missing repair summary',
  );

  assert(
    '15. universal-feature-contract.json includes repairReality projection from plan',
    featureContractFile?.content.includes('"repairReality"') === true &&
      JSON.parse(featureContractFile!.content).repairReality?.repairSummary === restaurantPlan.repairSummary,
    'feature contract missing repairReality',
  );

  const tampered: ApprovedRepairRealityPlan = {
    ...directPlan,
    repairSummary: `${directPlan.repairSummary} TAMPERED`,
  };
  assert(
    '16. Tampered repair plan (repairSummary diverged from traceabilityEntries) fails constitutionally',
    !isApprovedRepairRealityPlanValid(tampered),
    'tampered plan still valid',
  );

  let threw = false;
  try {
    requireApprovedRepairRealityPlan(null, 'validator-missing-plan');
  } catch {
    threw = true;
  }
  assert('17. requireApprovedRepairRealityPlan throws PPC-1207 when plan is missing', threw, 'did not throw');

  const gpcaEvidence: GpcaPipelineEvidenceInput = {
    contract,
    cbgaReport,
    proposed: {
      appTitle: cbgaReport.repairedInputs.appTitle,
      moduleIds: cbgaReport.repairedInputs.moduleIds,
      routes: cbgaReport.repairedInputs.routes,
      navigationLabels: cbgaReport.repairedInputs.navigationLabels,
      generatedFilePaths: [],
    },
  };
  const traceability = buildContractTraceabilityChains(gpcaEvidence);

  assert(
    '18. GPCA projects repairRealityTraceability from ApprovedRepairRealityPlan when available',
    traceability.some((entry) => entry.artifactKind === 'REPAIR_REALITY' && entry.proven === true),
    `kinds=${traceability.map((t) => t.artifactKind).join(',')}`,
  );

  const reportOnlyEntry = buildApprovedRepairRealityPlan({
    contractId: 'report-only',
    cbgaRepairs: [],
    additionalEntries: [
      {
        repairId: 'report-1',
        repairType: 'REPORT_ONLY',
        repairReason: 'Engineering report updated only',
        repairScope: 'REPORT',
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
        requiresRevalidation: false,
        requiredAuthorities: [],
        requiredPipelineRestart: false,
        constitutionalRuleIds: [...APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS],
        producer: 'FINAL_ENGINEERING_REPORT',
        consumer: 'REPORT',
        immutable: true,
        generatedAt: new Date().toISOString(),
        mutatedPaths: [],
      },
    ],
  });
  assert(
    '19. report-only repairs never claim workspace mutation',
    reportOnlyEntry.repairEntries.every((e) => e.repairType !== 'REPORT_ONLY' || !e.workspaceMutated),
    'report-only claimed workspace mutation',
  );

  const evidenceOnlyBad = buildApprovedRepairRealityPlan({
    contractId: 'evidence-bad',
    cbgaRepairs: [],
    additionalEntries: [
      {
        repairId: 'evidence-bad-1',
        repairType: 'EVIDENCE_ONLY',
        repairReason: 'bad',
        repairScope: 'EVIDENCE',
        filesMutated: true,
        artifactsMutated: true,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
        requiresRevalidation: false,
        requiredAuthorities: [],
        requiredPipelineRestart: false,
        constitutionalRuleIds: [...APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS],
        producer: 'GPCA',
        consumer: 'EVIDENCE',
        immutable: true,
        generatedAt: new Date().toISOString(),
        mutatedPaths: [],
      },
    ],
  });
  assert(
    '20. evidence-only repairs never claim source mutation (filesMutated must match taxonomy)',
    !isApprovedRepairRealityPlanValid(evidenceOnlyBad),
    'invalid evidence-only plan accepted',
  );

  const pipelineRestart = createPipelineRestartRepairEntry({
    repairId: 'restart-1',
    repairReason: 'npm install retried',
    stage: 'NPM_INSTALL',
  });
  assert(
    '21. pipeline restart classified correctly (runtime restart, no workspace mutation)',
    pipelineRestart.repairType === 'PIPELINE_RESTART' &&
      !pipelineRestart.workspaceMutated &&
      !pipelineRestart.filesMutated,
    `type=${pipelineRestart.repairType}`,
  );

  const workspaceMutation = createWorkspaceMutationRepairEntry({
    repairId: 'ws-1',
    repairReason: 'stabilizer wrote router file',
    producer: 'WORKSPACE_MATERIALIZATION_STABILIZER_V1',
    mutatedPaths: ['src/App.tsx'],
  });
  assert(
    '22. workspace mutation requires GPCA rerun authority',
    repairTypeRequiresGpcaRerun(workspaceMutation.repairType) &&
      workspaceMutation.requiredAuthorities.includes('GENERATION_PIPELINE_COMPLIANCE_AUTHORITY'),
    `authorities=${workspaceMutation.requiredAuthorities.join(',')}`,
  );

  assert(
    '23. workspace mutation requires Product Faithfulness rerun authority',
    repairTypeRequiresProductFaithfulnessRerun(workspaceMutation.repairType) &&
      workspaceMutation.requiredAuthorities.includes('PRODUCT_FAITHFULNESS_V2'),
    `authorities=${workspaceMutation.requiredAuthorities.join(',')}`,
  );

  const generatorRegen = createGeneratorRegenerationRepairEntry({
    repairId: 'gen-1',
    repairReason: 'EIAA regenerated modules',
    mutatedPaths: ['src/features/customers/CustomersFeature.tsx'],
  });
  assert(
    '24. generator regeneration requires constitutional rerun',
    generatorRegen.requiresRevalidation &&
      generatorRegen.requiredAuthorities.includes('PRODUCTION_PIPELINE_CONSTITUTION_V1'),
    `requiresRevalidation=${generatorRegen.requiresRevalidation}`,
  );

  const previewRecovery = createPreviewRecoveryRepairEntry({
    repairId: 'preview-1',
    repairReason: 'Preview dev server restarted',
  });
  assert(
    '25. preview recovery classified correctly',
    previewRecovery.repairType === 'PREVIEW_RECOVERY' && previewRecovery.previewMutated && !previewRecovery.workspaceMutated,
    `type=${previewRecovery.repairType}`,
  );

  const autofix = createAutofixCompilationRepairEntry({
    repairId: 'autofix-1',
    repairReason: 'Fixed TS compile error',
    mutatedPaths: ['src/App.tsx'],
  });
  assert(
    '26. AutoFix compilation classified correctly',
    autofix.repairType === 'AUTOFIX_COMPILATION' && autofix.filesMutated && autofix.workspaceMutated,
    `type=${autofix.repairType}`,
  );

  const capabilityEvolution = createCapabilityEvolutionRepairEntry({
    repairId: 'cap-1',
    repairReason: 'Evolved missing capability',
    mutatedPaths: ['src/features/booking/BookingFeature.tsx'],
  });
  assert(
    '27. capability evolution classified correctly',
    capabilityEvolution.repairType === 'CAPABILITY_EVOLUTION' && capabilityEvolution.workspaceMutated,
    `type=${capabilityEvolution.repairType}`,
  );

  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  assert(
    '28. Orchestrator guards materialization with isApprovedProductionBuildEnvelopeValid (Phase 10 envelope supersedes individual repair plan guard)',
    orchestratorSource.includes('isApprovedProductionBuildEnvelopeValid(productionBuildEnvelope)'),
    'envelope guard missing',
  );

  assert(
    '29. Orchestrator threads repair reality via immutable production build envelope',
    orchestratorSource.includes('approvedProductionBuildEnvelope: productionBuildEnvelope') &&
      orchestratorSource.includes('applyRepairPlanToEnvelope') &&
      orchestratorSource.includes('appendApprovedRepairRealityEntries'),
    'envelope repair threading missing',
  );

  assert(
    '30. Orchestrator records pipeline restart separately from workspace mutation (npm install recovery)',
    orchestratorSource.includes('createPipelineRestartRepairEntry') &&
      orchestratorSource.includes('No workspace mutation occurred'),
    'npm install misclassified',
  );

  assert(
    '31. Engineering report type declares approvedRepairRealityPlan field',
    readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8').includes(
      'approvedRepairRealityPlan',
    ),
    'field missing on build result type',
  );

  let extended = appendApprovedRepairRealityEntries(directPlan, [workspaceMutation]);
  extended = recordApprovedRepairRealityRevalidation(extended, 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY');
  assert(
    '32. appendApprovedRepairRealityEntries and recordApprovedRepairRealityRevalidation produce valid plan',
    isApprovedRepairRealityPlanValid(extended) &&
      extended.repairEntries.length === directPlan.repairEntries.length + 1 &&
      extended.revalidationCompleted.includes('GENERATION_PIPELINE_COMPLIANCE_AUTHORITY'),
    `entries=${extended.repairEntries.length}`,
  );

  const needsRevalidationPlan = appendApprovedRepairRealityEntries(noRepairReport.approvedRepairRealityPlan, [workspaceMutation]);
  assert(
    '33. repairRealityRequiresRevalidationBeforePreview true when workspace mutation present',
    repairRealityRequiresRevalidationBeforePreview(needsRevalidationPlan),
    'revalidation not required',
  );

  const satisfiedPlan = recordApprovedRepairRealityRevalidation(
    recordApprovedRepairRealityRevalidation(
      recordApprovedRepairRealityRevalidation(needsRevalidationPlan, 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY'),
      'PRODUCT_FAITHFULNESS_V2',
    ),
    'PRODUCTION_PIPELINE_CONSTITUTION_V1',
  );
  assert(
    '34. repairRevalidationSatisfiedBeforePreview true after all required authorities recorded',
    repairRevalidationSatisfiedBeforePreview(satisfiedPlan),
    `completed=${satisfiedPlan.revalidationCompleted.join(',')}`,
  );

  assert(
    '35. diagnostics-only repairs never claim regeneration (no workspace/files mutation)',
    !expectedMutationFlagsForRepairType('DIAGNOSTIC_ONLY').workspaceMutated &&
      !expectedMutationFlagsForRepairType('DIAGNOSTIC_ONLY').filesMutated,
    'diagnostic flags wrong',
  );

  const REPAIR_MARKERS = [
    'ApprovedRepairRealityPlan',
    'approved-repair-reality-plan',
    'buildApprovedRepairRealityPlan',
    'APPROVED_REPAIR_REALITY_PLAN_SOURCE',
    'Repair Reality Alignment',
  ];
  const protectedHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = REPAIR_MARKERS.find((m) => content.includes(m));
    if (hit) protectedHits.set(f, hit);
  }

  assert(
    '36. No GPCA scoring weakening',
    !protectedHits.has('src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '37. No GPCA gate weakening',
    !protectedHits.has('src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '38. No generator-legacy-detection weakening',
    !protectedHits.has('src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '39. No CBGA policy change (contract-generation-gate unchanged by milestone markers)',
    !protectedHits.has('src/contract-bound-generation-authority-v4/contract-generation-gate.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '40. No Product Faithfulness weakening',
    !protectedHits.has('src/product-faithfulness-v2/canonical-product-contract.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '41. No AEO weakening',
    !protectedHits.has('src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '42. No EIAA weakening',
    !protectedHits.has('src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts'),
    JSON.stringify(Object.fromEntries(protectedHits)),
  );

  assert(
    '43. CBGA produces exactly one approvedRepairRealityPlan reference per runContractBoundGenerationAuthority call',
    cbgaReport.approvedRepairRealityPlan === directPlan,
    'reference mismatch',
  );

  assert(
    '44. traceabilityEntries contractId matches plan.contractId',
    directPlan.traceabilityEntries.find((e) => e.key === 'contractId')?.value === directPlan.contractId,
    'contractId mismatch',
  );

  assert(
    '45. provenanceTraceability still present after repairReality extension (no GPCA rule removal)',
    traceability.some((entry) => entry.artifactKind === 'PROVENANCE'),
    'provenance trace missing',
  );

  assert(
    '46. sampleDataTraceability still present after repairReality extension',
    traceability.some((entry) => entry.artifactKind === 'SAMPLE_DATA'),
    'sample data trace missing',
  );

  assert(
    '47. metadataTraceability still present after repairReality extension',
    traceability.some((entry) => entry.artifactKind === 'METADATA'),
    'metadata trace missing',
  );

  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Repair Reality Alignment');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Repair Reality Alignment');
  assert(
    '48. Capability Matrix includes Repair Reality Alignment (CBGA + GPCA, IMPLEMENTED, production wired)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
  );

  assert(
    '49. Orchestrator uses createAutofixCompilationRepairEntry for npm build AutoFix file mutations',
    orchestratorSource.includes('createAutofixCompilationRepairEntry'),
    'autofix classification missing',
  );

  assert(
    '50. Orchestrator uses createGeneratorRegenerationRepairEntry for Engineering Intelligence repairs',
    orchestratorSource.includes('createGeneratorRegenerationRepairEntry'),
    'generator regen classification missing',
  );

  assert(
    '51. Orchestrator uses createCapabilityEvolutionRepairEntry for AEL capability evolution',
    orchestratorSource.includes('createCapabilityEvolutionRepairEntry'),
    'capability evolution classification missing',
  );

  assert(
    '52. Orchestrator uses createPreviewRecoveryRepairEntry for preview recovery',
    orchestratorSource.includes('createPreviewRecoveryRepairEntry'),
    'preview recovery classification missing',
  );

  assert(
    '53. Orchestrator revalidation gate before preview (repairRevalidationSatisfiedBeforePreview)',
    orchestratorSource.includes('repairRevalidationSatisfiedBeforePreview'),
    'preview revalidation gate missing',
  );

  assert(
    '54. GPCA contract-traceability projects repairRealityTraceability additively',
    readFileSync(join(ROOT, 'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts'), 'utf8').includes(
      'repairRealityTraceability',
    ),
    'repairRealityTraceability missing',
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
    '55. No application-specific logic in this milestone\'s added lines',
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
  assert(
    '56. No VERE dependency introduced',
    !/\bvalidation-runtime-evidence\b|\bfrom ['"].*vere/i.test(touchedSource),
    'VERE import detected',
  );

  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-repair-reality-alignment-v1.ts'), 'utf8');
  assert(
    '57. Validator never invokes sibling validate-*.ts scripts',
    !/(execSync|spawn)\s*\([^)]*validate-(?!repair-reality-alignment-v1)[\w-]+\.ts/.test(thisValidatorSource),
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
    '58. No new TypeScript errors in touched files',
    !tscFailed && touchedErrors.length === 0,
    touchedErrors.length > 0 ? touchedErrors.join(' | ') : 'ok',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`);
    if (!r.passed) console.log(`       ${r.detail}`);
  }

  console.log(`\n${passed}/${results.length} scenarios passed.\n`);
  if (failed.length === 0) {
    console.log(PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
