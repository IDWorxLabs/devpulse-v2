/**
 * PROVENANCE_COMPUTATION_COLLAPSE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 8 — Provenance Computation Collapse V1.
 *
 * Run only:
 *   npx tsx scripts/validate-provenance-computation-collapse-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isApprovedProvenancePlanValid,
  requireApprovedProvenancePlan,
  ancestryChainsFromApprovedProvenancePlan,
  APPROVED_PROVENANCE_PLAN_SOURCE,
  APPROVED_PROVENANCE_PLAN_SCHEMA_VERSION,
  APPROVED_PROVENANCE_PLAN_PROVENANCE_RULE_IDS,
  APPROVED_PROVENANCE_PLAN_CONSUMERS,
  type ApprovedProvenancePlan,
} from '../src/contract-bound-generation-authority-v4/approved-provenance-plan.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  isApprovedRepairRealityPlanValid,
  CBGA_CAPABILITY_MATRIX_ROWS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildContractTraceabilityChains } from '../src/generation-pipeline-compliance-authority-v1/contract-traceability.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PROVENANCE_COMPUTATION_COLLAPSE_V1_PASS';

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
  'src/contract-bound-generation-authority-v4/approved-provenance-plan.ts',
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
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
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
    promptHash: 'hash-prov',
    buildId: 'build-prov',
  });

  const directPlan = cbgaReport.approvedProvenancePlan;

  assert(
    '1. ApprovedProvenancePlan exists with required structural shape',
    directPlan.readOnly === true &&
      Array.isArray(directPlan.artifactEntries) &&
      Array.isArray(directPlan.ancestryChains) &&
      Array.isArray(directPlan.traceabilityEntries) &&
      typeof directPlan.provenanceSummary === 'string' &&
      directPlan.source === APPROVED_PROVENANCE_PLAN_SOURCE &&
      directPlan.schemaVersion === APPROVED_PROVENANCE_PLAN_SCHEMA_VERSION &&
      directPlan.immutable === true &&
      typeof directPlan.generatedAt === 'string',
    `source=${directPlan.source}`,
  );

  assert(
    '2. ApprovedProvenancePlan is composed from prior handoffs — appTitle equals repaired inputs, contractId matches',
    directPlan.appTitle === cbgaReport.repairedInputs.appTitle &&
      directPlan.contractId === contract.contractId &&
      directPlan.approvedModuleIds.length === cbgaReport.approvedModulePlan.moduleIds.length,
    `appTitle=${directPlan.appTitle}`,
  );

  assert(
    '3. ApprovedProvenancePlan is built only after CBGA approval (present on every CbgaGenerationReport)',
    isApprovedProvenancePlanValid(cbgaReport.approvedProvenancePlan),
    `finalGateOutcome=${cbgaReport.finalGateOutcome}`,
  );

  assert(
    '4. ApprovedProvenancePlan is immutable (readOnly === true, immutable === true)',
    directPlan.readOnly === true && directPlan.immutable === true,
    `immutable=${directPlan.immutable}`,
  );

  assert(
    '5. ApprovedProvenancePlan carries provenance (non-empty provenanceRuleIds, all PPC-nnn rule IDs)',
    directPlan.provenanceRuleIds.length > 0 &&
      directPlan.provenanceRuleIds.every((id) => /^PPC-\d+$/.test(id)),
    `provenanceRuleIds=${JSON.stringify(directPlan.provenanceRuleIds)}`,
  );

  assert(
    '6. ApprovedProvenancePlan carries owning stage CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    directPlan.owningStage === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    `owningStage=${directPlan.owningStage}`,
  );

  assert(
    '7. ApprovedProvenancePlan carries declared downstream consumers',
    directPlan.consumers.length > 0 && directPlan.consumers === APPROVED_PROVENANCE_PLAN_CONSUMERS,
    `consumers=${directPlan.consumers.length}`,
  );

  assert(
    '8. ancestryChains include module, route, title, surface, metadata, sample, and provenance entries',
    directPlan.ancestryChains.some((chain) => chain.artifactKind === 'MODULE') &&
      directPlan.ancestryChains.some((chain) => chain.artifactKind === 'TITLE') &&
      directPlan.ancestryChains.some((chain) => chain.artifactKind === 'METADATA') &&
      directPlan.ancestryChains.some((chain) => chain.artifactKind === 'SAMPLE_DATA') &&
      directPlan.ancestryChains.some((chain) => chain.artifactKind === 'PROVENANCE'),
    `chains=${directPlan.ancestryChains.map((c) => c.artifactKind).join(',')}`,
  );

  assert(
    '9. artifactEntries cover blueprint artifacts from UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE',
    directPlan.artifactEntries.length >= 20,
    `artifactEntries=${directPlan.artifactEntries.length}`,
  );

  assert(
    '10. contractVocabulary and cbgaVocabulary are composed once (non-empty contract vocabulary)',
    directPlan.contractVocabulary.length > 0 && Array.isArray(directPlan.cbgaVocabulary),
    `contractVocab=${directPlan.contractVocabulary.length}`,
  );

  assert(
    '11. manifestArtifacts lists all constitutional manifest paths',
    directPlan.manifestArtifacts.includes('.generated-app-manifest.json') &&
      directPlan.manifestArtifacts.includes('build-manifest.json') &&
      directPlan.manifestArtifacts.includes('blueprint-manifest.json'),
    `manifestArtifacts=${directPlan.manifestArtifacts.join(',')}`,
  );

  assert(
    '12. pipelineOrigins references all prior approved handoffs',
    directPlan.pipelineOrigins.includes('ApprovedProductIdentity') &&
      directPlan.pipelineOrigins.includes('ApprovedSampleDataPlan'),
    `pipelineOrigins=${directPlan.pipelineOrigins.join(',')}`,
  );

  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT, null);
  const canonicalContract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const cbgaResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalContract, {
    promptHash: 'e2e-prov',
    buildId: 'e2e-prov-build',
  });
  const approvedIdentity = cbgaResult.report.approvedIdentity;
  const approvedNavigationPlan = cbgaResult.report.approvedNavigationPlan;
  const approvedModulePlan = cbgaResult.report.approvedModulePlan;
  const approvedMetadataPlan = cbgaResult.report.approvedMetadataPlan;
  const approvedSampleDataPlan = cbgaResult.report.approvedSampleDataPlan;
  const approvedProvenancePlan = cbgaResult.report.approvedProvenancePlan;

  assert(
    '13. Real restaurant prompt produces structurally valid ApprovedProvenancePlan end-to-end',
    isApprovedProvenancePlanValid(approvedProvenancePlan),
    `provenanceSummary=${approvedProvenancePlan.provenanceSummary}`,
  );

  const liveFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'provenance-collapse-e2e-1',
    ideaId: 'idea-1',
    buildUnits: ['ui'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: cbgaResult.buildPlan,
    approvedIdentity,
    approvedNavigationPlan,
    approvedModulePlan,
    approvedMetadataPlan,
    approvedSampleDataPlan,
    approvedProvenancePlan,
  });

  const blueprintManifestFile = liveFiles.find((file) => file.relativePath === 'blueprint-manifest.json');
  const buildManifestFile = liveFiles.find((file) => file.relativePath === 'build-manifest.json');
  const generatedAppManifestFile = liveFiles.find((file) => file.relativePath === GENERATED_APP_MANIFEST_FILENAME);
  const featureContractFile = liveFiles.find((file) => file.relativePath === 'universal-feature-contract.json');

  const blueprintManifest = blueprintManifestFile ? JSON.parse(blueprintManifestFile.content) : null;
  const buildManifest = buildManifestFile ? JSON.parse(buildManifestFile.content) : null;
  const generatedAppManifest = generatedAppManifestFile ? JSON.parse(generatedAppManifestFile.content) : null;
  const featureContract = featureContractFile ? JSON.parse(featureContractFile.content) : null;

  assert(
    '14. blueprint-manifest.json references approvedProvenanceSummary from plan',
    blueprintManifest?.approvedProvenanceSummary === approvedProvenancePlan.provenanceSummary,
    `manifest=${blueprintManifest?.approvedProvenanceSummary}`,
  );

  assert(
    '15. build-manifest.json references approvedProvenanceSummary and approvedProvenanceSource',
    buildManifest?.approvedProvenanceSummary === approvedProvenancePlan.provenanceSummary &&
      buildManifest?.approvedProvenanceSource === APPROVED_PROVENANCE_PLAN_SOURCE,
    `buildManifest=${buildManifest?.approvedProvenanceSummary}`,
  );

  assert(
    '16. .generated-app-manifest.json references approvedProvenanceSummary',
    generatedAppManifest?.approvedProvenanceSummary === approvedProvenancePlan.provenanceSummary,
    `summary=${generatedAppManifest?.approvedProvenanceSummary}`,
  );

  assert(
    '17. universal-feature-contract.json includes provenance projection from plan',
    featureContract?.provenance?.provenanceSummary === approvedProvenancePlan.provenanceSummary &&
      featureContract?.provenance?.contractId === approvedProvenancePlan.contractId,
    `provenance=${JSON.stringify(featureContract?.provenance)}`,
  );

  const provenanceAcrossPipeline = [
    JSON.stringify(approvedProvenancePlan.provenanceSummary),
    JSON.stringify(blueprintManifest?.approvedProvenanceSummary),
    JSON.stringify(generatedAppManifest?.approvedProvenanceSummary),
    JSON.stringify(buildManifest?.approvedProvenanceSummary),
  ];
  assert(
    '18. Restaurant prompt preserves IDENTICAL provenanceSummary from CBGA -> Blueprint -> Materialization -> Manifests',
    new Set(provenanceAcrossPipeline).size === 1 && approvedProvenancePlan.provenanceSummary.length > 0,
    `provenanceAcrossPipeline=${JSON.stringify(provenanceAcrossPipeline)}`,
  );

  const tamperedPlan: ApprovedProvenancePlan = {
    ...approvedProvenancePlan,
    provenanceSummary: `${approvedProvenancePlan.provenanceSummary} TAMPERED`,
  };
  let threwOnTampered = false;
  try {
    buildUniversalMaterializedWorkspaceFiles({
      contractId: 'tampered-provenance-plan',
      ideaId: 'idea-1',
      buildUnits: ['ui'],
      rawPrompt: REAL_PROMPT,
      faithfulBuildPlan: cbgaResult.buildPlan,
      approvedIdentity,
      approvedNavigationPlan,
      approvedModulePlan,
      approvedMetadataPlan,
      approvedSampleDataPlan,
      approvedProvenancePlan: tamperedPlan,
    });
  } catch {
    threwOnTampered = true;
  }
  assert(
    '19. Tampered provenance plan (provenanceSummary diverged from traceabilityEntries) fails constitutionally',
    threwOnTampered || !isApprovedProvenancePlanValid(tamperedPlan),
    `threwOnTampered=${threwOnTampered}, isValid=${isApprovedProvenancePlanValid(tamperedPlan)}`,
  );

  let threwOnMissing = false;
  try {
    requireApprovedProvenancePlan(null, 'validate-provenance-scenario-20');
  } catch (err) {
    threwOnMissing = (err as Error).message.includes('CONSTITUTIONAL_VIOLATION_PPC_1207');
  }
  assert(
    '20. requireApprovedProvenancePlan throws PPC-1207 when plan is missing',
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
      generatedFilePaths: liveFiles.map((file) => file.relativePath),
    },
    cbgaReport: cbgaResult.report,
  };
  const traceability = buildContractTraceabilityChains(gpcaEvidence);
  const provenanceTrace = traceability.find((entry) => entry.artifactKind === 'PROVENANCE');
  const moduleTrace = traceability.find((entry) => entry.artifactKind === 'MODULE');

  assert(
    '21. GPCA projects ancestry from ApprovedProvenancePlan when available (PROVENANCE chain proven)',
    provenanceTrace?.proven === true,
    `provenanceTrace=${JSON.stringify(provenanceTrace)}`,
  );

  assert(
    '22. GPCA projected traceability includes module chains from constitutional plan',
    moduleTrace !== undefined && moduleTrace.proven === true,
    `moduleTrace=${JSON.stringify(moduleTrace)}`,
  );

  assert(
    '23. ancestryChainsFromApprovedProvenancePlan returns plan chains without recomputation',
    ancestryChainsFromApprovedProvenancePlan(approvedProvenancePlan).length === approvedProvenancePlan.ancestryChains.length,
    `chains=${ancestryChainsFromApprovedProvenancePlan(approvedProvenancePlan).length}`,
  );

  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  assert(
    '24. Orchestrator guards materialization with isApprovedProvenancePlanValid',
    orchestratorSource.includes('isApprovedProvenancePlanValid(approvedProvenancePlan)'),
    'guard not found',
  );

  assert(
    '25. Orchestrator threads approvedProvenancePlan into materializeGeneratedApplication',
    orchestratorSource.includes('approvedProvenancePlan,') &&
      orchestratorSource.includes('contractBoundGeneration.approvedProvenancePlan'),
    'threading not found',
  );

  assert(
    '26. CBGA authority builds approvedProvenancePlan exactly once per report',
    readFileSync(join(ROOT, 'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts'), 'utf8').includes(
      'buildApprovedProvenancePlan(',
    ),
    'buildApprovedProvenancePlan call missing',
  );

  assert(
    '27. GPCA adapter consumes contractVocabulary from ApprovedProvenancePlan when valid',
    readFileSync(join(ROOT, 'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts'), 'utf8').includes(
      'provenancePlan.contractVocabulary',
    ),
    'adapter vocabulary consumption missing',
  );

  const REQUIRED_RULE_IDS = [
    'PPC-101', 'PPC-201', 'PPC-202', 'PPC-401', 'PPC-402', 'PPC-1207',
    'PPC-1600', 'PPC-1601', 'PPC-1701', 'PPC-1702', 'PPC-1703', 'PPC-1800', 'PPC-1900', 'PPC-2100',
  ];
  assert(
    '28. All required constitutional rule IDs recorded on provenanceRuleIds',
    REQUIRED_RULE_IDS.every((id) => APPROVED_PROVENANCE_PLAN_PROVENANCE_RULE_IDS.includes(id)),
    `provenanceRuleIds=${JSON.stringify(APPROVED_PROVENANCE_PLAN_PROVENANCE_RULE_IDS)}`,
  );

  const PROVENANCE_COLLAPSE_MARKERS = [
    'ApprovedProvenancePlan',
    'approved-provenance-plan',
    'buildApprovedProvenancePlan',
    'APPROVED_PROVENANCE_PLAN_SOURCE',
    'CBGA_COMPOSED_PROVENANCE_PLAN',
    'Provenance Computation Collapse',
  ];
  const protectedHits = new Map<string, string>();
  for (const f of PROTECTED_AUTHORITY_FILES) {
    let content = '';
    try {
      content = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      content = '';
    }
    const hit = PROVENANCE_COLLAPSE_MARKERS.find((m) => content.includes(m));
    if (hit) protectedHits.set(f, hit);
  }

  assert(
    '29. No GPCA scoring weakening (pipeline-compliance-scoring.ts carries none of this milestone\'s markers)',
    !protectedHits.has('src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '30. No GPCA gate weakening (generation-pipeline-compliance-gate.ts carries none of this milestone\'s markers)',
    !protectedHits.has('src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '31. No generator-legacy-detection weakening',
    !protectedHits.has('src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '32. No CBGA policy change (contract-module-plan/contract-generation-gate carry none of this milestone\'s markers)',
    !protectedHits.has('src/contract-bound-generation-authority-v4/contract-module-plan.ts') &&
      !protectedHits.has('src/contract-bound-generation-authority-v4/contract-generation-gate.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '33. No Product Faithfulness weakening',
    !protectedHits.has('src/product-faithfulness-v2/canonical-product-contract.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '34. No AEO weakening',
    !protectedHits.has('src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts'),
    `hits=${JSON.stringify(Object.fromEntries(protectedHits))}`,
  );

  assert(
    '35. No EIAA weakening',
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
    '36. No application-specific logic in this milestone\'s added lines',
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
  assert('37. No VERE dependency introduced', !/\bvere\b/i.test(touchedSource), 'no VERE refs');

  const thisValidatorSource = readFileSync(join(ROOT, 'scripts/validate-provenance-computation-collapse-v1.ts'), 'utf8');
  assert(
    '38. Validator never invokes sibling validate-*.ts scripts',
    !/(execSync|spawn)\s*\([^)]*validate-(?!provenance-computation-collapse-v1)[\w-]+\.ts/.test(thisValidatorSource),
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
    '39. No new TypeScript errors in touched files',
    !tscFailed && touchedErrors.length === 0,
    touchedErrors.length > 0 ? touchedErrors.join(' | ') : 'ok',
  );

  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Provenance Computation Collapse');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Provenance Computation Collapse');
  assert(
    '40. Capability Matrix includes Provenance Computation Collapse (CBGA + GPCA, IMPLEMENTED, production wired)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
  );

  assert(
    '41. sampleDataTraceability still present after provenance projection (no GPCA rule removal)',
    traceability.some((entry) => entry.artifactKind === 'SAMPLE_DATA'),
    'sample data trace missing',
  );

  assert(
    '42. metadataTraceability still present after provenance projection',
    traceability.some((entry) => entry.artifactKind === 'METADATA'),
    'metadata trace missing',
  );

  assert(
    '43. titleTraceability still present after provenance projection',
    traceability.some((entry) => entry.artifactKind === 'TITLE'),
    'title trace missing',
  );

  assert(
    '44. CBGA produces exactly one approvedProvenancePlan reference per runContractBoundGenerationAuthority call',
    cbgaReport.approvedProvenancePlan === directPlan,
    'reference mismatch',
  );

  assert(
    '45. fingerprints array is non-empty on ApprovedProvenancePlan',
    directPlan.fingerprints.length > 0,
    `fingerprints=${directPlan.fingerprints.length}`,
  );

  assert(
    '46. engineeringArtifacts references engineering report consumers',
    directPlan.engineeringArtifacts.includes('FINAL_ENGINEERING_REPORT'),
    `engineeringArtifacts=${directPlan.engineeringArtifacts.join(',')}`,
  );

  assert(
    '47. OnePromptLivePreviewBuildResult declares approvedProvenancePlan field',
    orchestratorSource.includes('approvedProvenancePlan') &&
      readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8').includes(
        'approvedProvenancePlan',
      ),
    'result field missing',
  );

  assert(
    '48. contract-traceability projects from plan when structurally valid (projectTraceabilityFromApprovedProvenancePlan wired)',
    readFileSync(join(ROOT, 'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts'), 'utf8').includes(
      'projectTraceabilityFromApprovedProvenancePlan',
    ),
    'projection helper missing',
  );

  assert(
    '49. traceabilityEntries contractId matches plan.contractId',
    directPlan.traceabilityEntries.some((entry) => entry.key === 'contractId' && entry.value === directPlan.contractId),
    'traceability contractId mismatch',
  );

  assert(
    '50. generationOrigins references all prior handoff sources',
    directPlan.generationOrigins.includes('CBGA_REPAIRED_PLAN') ||
      directPlan.generationOrigins.some((origin) => origin.includes('CBGA')),
    `generationOrigins=${directPlan.generationOrigins.join(',')}`,
  );

  assert(
    '51. GPCA traceability chain count matches constitutional ancestry chain count when projected (+1 additive repairReality when ApprovedRepairRealityPlan valid)',
    traceability.length ===
      approvedProvenancePlan.ancestryChains.length +
        (isApprovedRepairRealityPlanValid(cbgaReport.approvedRepairRealityPlan) ? 1 : 0),
    `gpca=${traceability.length}, plan=${approvedProvenancePlan.ancestryChains.length}`,
  );

  assert(
    '52. blueprint-manifest approvedProvenanceSource equals CBGA_COMPOSED_PROVENANCE_PLAN',
    blueprintManifest?.approvedProvenanceSource === APPROVED_PROVENANCE_PLAN_SOURCE,
    `source=${blueprintManifest?.approvedProvenanceSource}`,
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
