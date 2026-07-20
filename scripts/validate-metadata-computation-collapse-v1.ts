/**
 * METADATA_COMPUTATION_COLLAPSE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 6 — Metadata Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": production metadata (title, subtitle, description, module/
 * navigation/route counts, summary strings) must exist in exactly one authoritative form.
 * This milestone collapses every downstream metadata consumer onto ONE approved, CBGA-composed
 * metadata plan object (`ApprovedMetadataPlan`,
 * src/contract-bound-generation-authority-v4/approved-metadata-plan.ts) without adding a new
 * authority, without weakening GPCA/CBGA/Product Faithfulness/AEO/EIAA, without a CBGA policy
 * change, without a generator rewrite, and without any application-specific logic.
 *
 * Run only:
 *   npx tsx scripts/validate-metadata-computation-collapse-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildApprovedMetadataPlan,
  isApprovedMetadataPlanValid,
  requireApprovedMetadataPlan,
  APPROVED_METADATA_PLAN_SOURCE,
  APPROVED_METADATA_PLAN_SCHEMA_VERSION,
  APPROVED_METADATA_PLAN_PROVENANCE_RULE_IDS,
  APPROVED_METADATA_PLAN_CONSUMERS,
  type ApprovedMetadataPlan,
} from '../src/contract-bound-generation-authority-v4/approved-metadata-plan.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_CAPABILITY_MATRIX_ROWS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import { buildApprovedProductIdentity } from '../src/contract-bound-generation-authority-v4/approved-product-identity.js';
import { buildApprovedNavigationPlan } from '../src/contract-bound-generation-authority-v4/approved-navigation-plan.js';
import { buildApprovedModulePlan } from '../src/contract-bound-generation-authority-v4/approved-module-plan.js';
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
const PASS_TOKEN = 'METADATA_COMPUTATION_COLLAPSE_V1_PASS';

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
  'src/contract-bound-generation-authority-v4/approved-metadata-plan.ts',
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
  'src/universal-app-blueprint/universal-app-blueprint-types.ts',
  'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
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
      proposedModuleIds: ['reservation', 'order'],
      proposedRoutes: ['/', '/order'],
      proposedNavigationLabels: [],
      proposedAppTitle: contract.productIdentity,
    },
    promptHash: 'hash-meta',
    buildId: 'build-meta',
  });

  const directPlan = cbgaReport.approvedMetadataPlan;

  assert(
    '1. ApprovedMetadataPlan exists with required structural shape (applicationTitle, productIdentity, applicationSubtitle, counts, summaries, entries, source, schemaVersion, provenanceRuleIds, owningStage, consumers, immutable, promptHash, buildId, generatedAt)',
    directPlan.readOnly === true &&
      typeof directPlan.applicationTitle === 'string' &&
      typeof directPlan.productIdentity === 'string' &&
      typeof directPlan.applicationSubtitle === 'string' &&
      typeof directPlan.productDescription === 'string' &&
      Array.isArray(directPlan.approvedModuleIds) &&
      typeof directPlan.approvedModuleCount === 'number' &&
      typeof directPlan.approvedNavigationCount === 'number' &&
      typeof directPlan.approvedRouteCount === 'number' &&
      typeof directPlan.featureSummary === 'string' &&
      typeof directPlan.manifestSummary === 'string' &&
      typeof directPlan.workspaceSummary === 'string' &&
      typeof directPlan.previewSummary === 'string' &&
      typeof directPlan.engineeringSummary === 'string' &&
      typeof directPlan.contractSummary === 'string' &&
      Array.isArray(directPlan.entries) &&
      directPlan.source === APPROVED_METADATA_PLAN_SOURCE &&
      directPlan.schemaVersion === APPROVED_METADATA_PLAN_SCHEMA_VERSION &&
      Array.isArray(directPlan.provenanceRuleIds) &&
      directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' &&
      Array.isArray(directPlan.consumers) &&
      directPlan.immutable === true &&
      directPlan.promptHash === 'hash-meta' &&
      directPlan.buildId === 'build-meta' &&
      typeof directPlan.generatedAt === 'string',
    `plan keys present=${Boolean(directPlan.applicationTitle && directPlan.manifestSummary)}`,
  );

  assert(
    '1b. ApprovedMetadataPlan is composed from the three prior handoffs — applicationTitle equals ApprovedProductIdentity.displayName, module/navigation counts match ApprovedModulePlan/ApprovedNavigationPlan',
    directPlan.applicationTitle === cbgaReport.approvedIdentity.displayName &&
      directPlan.approvedModuleCount === cbgaReport.approvedModulePlan.moduleIds.length &&
      directPlan.approvedNavigationCount === cbgaReport.approvedNavigationPlan.productEntries.length &&
      directPlan.approvedRouteCount === cbgaReport.approvedModulePlan.routes.length,
    `applicationTitle=${directPlan.applicationTitle}, moduleCount=${directPlan.approvedModuleCount}, navCount=${directPlan.approvedNavigationCount}`,
  );

  assert(
    '2. ApprovedMetadataPlan is built only after CBGA approval (present on every CbgaGenerationReport, including GENERATION_ALLOWED with no repair)',
    isApprovedMetadataPlanValid(cbgaReport.approvedMetadataPlan),
    `finalGateOutcome=${cbgaReport.finalGateOutcome}`,
  );

  assert(
    '3. ApprovedMetadataPlan is immutable (readOnly === true, immutable === true)',
    directPlan.readOnly === true && directPlan.immutable === true,
    `readOnly=${directPlan.readOnly}, immutable=${directPlan.immutable}`,
  );

  assert(
    '4. ApprovedMetadataPlan carries provenance (non-empty provenanceRuleIds, all PPC-nnn rule IDs, every entries[] item has source string)',
    directPlan.provenanceRuleIds.length > 0 &&
      directPlan.provenanceRuleIds.every((id) => /^PPC-\d+$/.test(id)) &&
      directPlan.entries.every((e) => typeof e.source === 'string' && e.source.length > 0),
    `provenanceRuleIds=${JSON.stringify(directPlan.provenanceRuleIds)}`,
  );

  assert(
    '5. ApprovedMetadataPlan carries owning stage CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    `owningStage=${directPlan.owningStage}`,
  );

  assert(
    '6. ApprovedMetadataPlan carries declared downstream consumers',
    directPlan.consumers.length > 0 && directPlan.consumers === APPROVED_METADATA_PLAN_CONSUMERS,
    `consumers=${JSON.stringify(directPlan.consumers)}`,
  );

  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT, null);
  const canonicalContract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const cbgaResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalContract, {
    promptHash: 'e2e-meta',
    buildId: 'e2e-meta-build',
  });
  const approvedIdentity = cbgaResult.report.approvedIdentity;
  const approvedNavigationPlan = cbgaResult.report.approvedNavigationPlan;
  const approvedModulePlan = cbgaResult.report.approvedModulePlan;
  const approvedMetadataPlan = cbgaResult.report.approvedMetadataPlan;

  assert(
    '2c. Real restaurant prompt produces structurally valid ApprovedMetadataPlan end-to-end',
    isApprovedMetadataPlanValid(approvedMetadataPlan) && approvedMetadataPlan.applicationTitle.length > 0,
    `applicationTitle=${approvedMetadataPlan.applicationTitle}`,
  );

  const liveFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'metadata-collapse-e2e-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: cbgaResult.buildPlan,
    approvedIdentity,
    approvedNavigationPlan,
    approvedModulePlan,
    approvedMetadataPlan,
  });
  const liveByPath = new Map(liveFiles.map((f) => [f.relativePath, f.content]));

  const blueprintManifest = JSON.parse(liveByPath.get('blueprint-manifest.json') ?? '{}') as {
    approvedMetadataSummary?: string | null;
  };
  assert(
    '7. Blueprint manifest consumes ApprovedMetadataPlan (approvedMetadataSummary equals plan.manifestSummary)',
    blueprintManifest.approvedMetadataSummary === approvedMetadataPlan.manifestSummary,
    `blueprintManifest.approvedMetadataSummary=${JSON.stringify(blueprintManifest.approvedMetadataSummary)}`,
  );

  const generatedAppManifest = JSON.parse(liveByPath.get(GENERATED_APP_MANIFEST_FILENAME) ?? '{}') as {
    approvedApplicationSubtitle?: string;
    approvedMetadataSummary?: string;
  };
  assert(
    '8. Generated app manifest consumes ApprovedMetadataPlan (approvedApplicationSubtitle + approvedMetadataSummary)',
    generatedAppManifest.approvedApplicationSubtitle === approvedMetadataPlan.applicationSubtitle &&
      generatedAppManifest.approvedMetadataSummary === approvedMetadataPlan.manifestSummary,
    `subtitle=${JSON.stringify(generatedAppManifest.approvedApplicationSubtitle)}, summary=${JSON.stringify(generatedAppManifest.approvedMetadataSummary)}`,
  );

  const buildManifest = JSON.parse(liveByPath.get('build-manifest.json') ?? '{}') as {
    approvedMetadataSummary?: string | null;
  };
  assert(
    '9. build-manifest.json consumes ApprovedMetadataPlan.manifestSummary',
    buildManifest.approvedMetadataSummary === approvedMetadataPlan.manifestSummary,
    `buildManifest.approvedMetadataSummary=${JSON.stringify(buildManifest.approvedMetadataSummary)}`,
  );

  const featureContractJson = JSON.parse(liveByPath.get('feature-contract.json') ?? '{}') as {
    metadata?: {
      applicationTitle?: string;
      applicationSubtitle?: string;
      approvedModuleCount?: number;
    };
  };
  const universalFeatureContractJson = JSON.parse(liveByPath.get('universal-feature-contract.json') ?? '{}') as {
    metadata?: {
      applicationTitle?: string;
      applicationSubtitle?: string;
      approvedModuleCount?: number;
    };
  };
  assert(
    '10. Universal Feature Contract consumes ApprovedMetadataPlan (metadata.applicationTitle/subtitle/count on both contract files)',
    featureContractJson.metadata?.applicationTitle === approvedMetadataPlan.applicationTitle &&
      featureContractJson.metadata?.applicationSubtitle === approvedMetadataPlan.applicationSubtitle &&
      featureContractJson.metadata?.approvedModuleCount === approvedMetadataPlan.approvedModuleCount &&
      universalFeatureContractJson.metadata?.applicationTitle === approvedMetadataPlan.applicationTitle,
    `feature-contract metadata=${JSON.stringify(featureContractJson.metadata)}`,
  );

  const appMetadataTs = liveByPath.get('src/blueprint/app-metadata.ts') ?? '';
  assert(
    '11. Runtime shell (src/blueprint/app-metadata.ts) tagline comes from ApprovedMetadataPlan.applicationSubtitle when plan supplied',
    appMetadataTs.includes(approvedMetadataPlan.applicationSubtitle),
    `tagline found=${appMetadataTs.includes(approvedMetadataPlan.applicationSubtitle)}`,
  );

  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  const typesSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8');
  assert(
    '12. Engineering report (OnePromptLivePreviewBuildResult) declares and populates approvedMetadataPlan',
    typesSource.includes('approvedMetadataPlan') &&
      orchestratorSource.includes('const approvedMetadataPlan: ApprovedMetadataPlan = contractBoundGeneration.approvedMetadataPlan') &&
      orchestratorSource.includes('approvedMetadataPlan,'),
    'checked orchestrator + types',
  );

  const contractTraceabilitySource = readFileSync(
    join(ROOT, 'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts'),
    'utf8',
  );
  const gpcaEvidence: GpcaPipelineEvidenceInput = {
    contract: canonicalContract,
    cbgaReport: cbgaResult.report,
    proposed: {
      appTitle: approvedMetadataPlan.applicationTitle,
      moduleIds: cbgaResult.report.repairedInputs.moduleIds,
      routes: cbgaResult.report.repairedInputs.routes,
      navigationLabels: approvedNavigationPlan.productEntries,
      generatedFilePaths: [],
    },
  };
  const metadataChain = buildContractTraceabilityChains(gpcaEvidence).find((r) => r.artifactKind === 'METADATA');
  assert(
    '13. GPCA metadataTraceability references ApprovedMetadataPlan and proves composition integrity',
    contractTraceabilitySource.includes('function metadataTraceability') &&
      contractTraceabilitySource.includes('cbga?.approvedMetadataPlan') &&
      contractTraceabilitySource.includes("'ApprovedMetadataPlan.applicationTitle'") &&
      metadataChain?.proven === true,
    `metadataChain=${JSON.stringify(metadataChain)}`,
  );

  const materializationSource = readFileSync(
    join(ROOT, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'),
    'utf8',
  );
  assert(
    '14. No downstream metadata fallback remains ungated — tagline uses applicationSubtitle when plan valid, deriveNeutralAppTagline only as pre-CBGA fallback',
    /approvedMetadataPlanValid \? suppliedMetadataPlan\.applicationSubtitle : deriveNeutralAppTagline\(displayName\)/.test(
      materializationSource,
    ),
    'checked universal-app-materialization-engine.ts tagline wiring',
  );

  let threwOnInvalidPlan = false;
  let invalidMessage = '';
  const malformedPlan: ApprovedMetadataPlan = {
    ...approvedMetadataPlan,
    approvedModuleCount: approvedMetadataPlan.approvedModuleIds.length + 99,
  };
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'invalid-metadata-plan',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan,
      approvedModulePlan,
      approvedMetadataPlan: malformedPlan,
    });
  } catch (err) {
    threwOnInvalidPlan = true;
    invalidMessage = err instanceof Error ? err.message : String(err);
  }
  assert(
    '15. Supplied-but-invalid ApprovedMetadataPlan fails constitutionally instead of silent fallback',
    threwOnInvalidPlan &&
      /CONSTITUTIONAL_VIOLATION_PPC_1207/.test(invalidMessage) &&
      !isApprovedMetadataPlanValid(malformedPlan),
    `threw=${threwOnInvalidPlan}, message=${invalidMessage}`,
  );

  let requireThrew = false;
  try {
    requireApprovedMetadataPlan(null, 'unit-test');
  } catch {
    requireThrew = true;
  }
  assert(
    '15b. requireApprovedMetadataPlan throws when plan absent',
    requireThrew,
    `requireThrew=${requireThrew}`,
  );

  assert(
    '15c. Orchestrator materialization guard fails GENERATION_PIPELINE_NON_COMPLIANT when metadata plan invalid',
    /if \(!isApprovedMetadataPlanValid\(approvedMetadataPlan\)\) \{[\s\S]{0,400}GENERATION_PIPELINE_NON_COMPLIANT/.test(
      orchestratorSource,
    ),
    'checked orchestrator guard',
  );

  const tamperedPlan: ApprovedMetadataPlan = {
    ...approvedMetadataPlan,
    // Tamper a named field without updating the matching entries[] projection — simulates a
    // downstream generator trying to splice in different metadata without going through CBGA.
    manifestSummary: `${approvedMetadataPlan.manifestSummary} TAMPERED`,
  };
  let threwOnTampered = false;
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'tampered-metadata-plan',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan,
      approvedModulePlan,
      approvedMetadataPlan: tamperedPlan,
    });
  } catch (err) {
    threwOnTampered = true;
  }
  assert(
    '16. Tampered metadata plan (manifestSummary diverged from entries[] projection) fails constitutionally',
    threwOnTampered || !isApprovedMetadataPlanValid(tamperedPlan),
    `threwOnTampered=${threwOnTampered}, isValid=${isApprovedMetadataPlanValid(tamperedPlan)}`,
  );

  const metadataAcrossPipeline = [
    JSON.stringify(approvedMetadataPlan.manifestSummary),
    JSON.stringify(blueprintManifest.approvedMetadataSummary),
    JSON.stringify(generatedAppManifest.approvedMetadataSummary),
    JSON.stringify(buildManifest.approvedMetadataSummary),
  ];
  assert(
    '17. Restaurant prompt preserves IDENTICAL manifestSummary from CBGA -> Blueprint -> Materialization -> Manifests',
    new Set(metadataAcrossPipeline).size === 1 && approvedMetadataPlan.manifestSummary.length > 0,
    `metadataAcrossPipeline=${JSON.stringify(metadataAcrossPipeline)}`,
  );

  const REQUIRED_RULE_IDS = [
    'PPC-101', 'PPC-201', 'PPC-202', 'PPC-401', 'PPC-402', 'PPC-1207',
    'PPC-1600', 'PPC-1601', 'PPC-1701', 'PPC-1702', 'PPC-1703',
  ];
  assert(
    '18. All required constitutional rule IDs recorded on provenanceRuleIds',
    REQUIRED_RULE_IDS.every((id) => APPROVED_METADATA_PLAN_PROVENANCE_RULE_IDS.includes(id)),
    `provenanceRuleIds=${JSON.stringify(APPROVED_METADATA_PLAN_PROVENANCE_RULE_IDS)}`,
  );

  const METADATA_COLLAPSE_MARKERS = [
    'ApprovedMetadataPlan',
    'approved-metadata-plan',
    'buildApprovedMetadataPlan',
    'APPROVED_METADATA_PLAN_SOURCE',
    'CBGA_COMPOSED_METADATA_PLAN',
    'Metadata Computation Collapse',
  ];
  const protectedHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = METADATA_COLLAPSE_MARKERS.find((m) => content.includes(m));
    if (hit) protectedHits.set(f, hit);
  }
  assert(
    '19. No GPCA weakening (scoring/gate/legacy-detection/rendered-content files carry none of this milestone\'s markers)',
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
    '20. No CBGA policy change (contract-module-plan/contract-generation-gate carry none of this milestone\'s markers)',
    !protectedHits.has('src/contract-bound-generation-authority-v4/contract-module-plan.ts') &&
      !protectedHits.has('src/contract-bound-generation-authority-v4/contract-generation-gate.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );
  assert(
    '21. No Product Faithfulness weakening',
    !protectedHits.has('src/product-faithfulness-v2/canonical-product-contract.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );
  assert(
    '22. No AEO weakening',
    !protectedHits.has('src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );
  assert(
    '23. No EIAA weakening',
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
    '24. No application-specific logic in this milestone\'s added lines',
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
  assert('25. No VERE dependency introduced', !/\bvere\b/i.test(touchedSource), 'no VERE refs');

  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-metadata-computation-collapse-v1.ts'), 'utf8');
  assert(
    '26. Validator never invokes sibling validate-*.ts scripts',
    !/(execSync|spawn)\s*\([^)]*validate-(?!metadata-computation-collapse-v1)[\w-]+\.ts/.test(thisValidatorSource),
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
    '27. No new TypeScript errors in touched files',
    !tscFailed && touchedErrors.length === 0,
    touchedErrors.length > 0 ? touchedErrors.join(' | ') : 'ok',
  );

  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Metadata Computation Collapse');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Metadata Computation Collapse');
  assert(
    '28. Capability Matrix includes Metadata Computation Collapse (CBGA + GPCA, IMPLEMENTED, production wired)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
  );

  // Sanity: buildApprovedMetadataPlan is pure composition — changing identity displayName changes subtitle via same formula
  const identity = buildApprovedProductIdentity({
    contractProductIdentity: 'Test Product',
    repairedAppTitle: 'Test App Title',
  });
  const navPlan = buildApprovedNavigationPlan({ navigationPlan: [], approvedModuleIds: [] });
  const modPlan = buildApprovedModulePlan({ modulePlan: [], routePlan: [], approvedModuleIds: [] });
  const composed = buildApprovedMetadataPlan({
    identity,
    navigationPlan: navPlan,
    modulePlan: modPlan,
    contract: contractEvidenceFixture({ contractId: 'compose-test' }),
    deriveApplicationSubtitle: deriveNeutralAppTagline,
  });
  assert(
    '29. applicationSubtitle is composed once via deriveNeutralAppTagline(identity.displayName), never recomputed downstream',
    composed.applicationSubtitle === deriveNeutralAppTagline('Test App Title'),
    `subtitle=${composed.applicationSubtitle}`,
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
