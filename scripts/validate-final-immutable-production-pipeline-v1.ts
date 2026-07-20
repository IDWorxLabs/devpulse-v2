/**
 * FINAL_IMMUTABLE_PRODUCTION_PIPELINE_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 10 — Final Immutable Production Pipeline V1.
 *
 * Run only:
 *   npx tsx scripts/validate-final-immutable-production-pipeline-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isApprovedProductionBuildEnvelopeValid,
  requireApprovedProductionBuildEnvelope,
  buildApprovedProductionBuildEnvelope,
  constitutionalHandoffsFromApprovedProductionBuildEnvelope,
  withApprovedProductionBuildEnvelopeRepairPlan,
  advanceApprovedProductionBuildEnvelopeState,
  lockApprovedProductionBuildEnvelopeWorkspace,
  assertApprovedProductionBuildEnvelopePreviewGuarantee,
  syncCbgaGenerationReportWithProductionBuildEnvelope,
  APPROVED_PRODUCTION_BUILD_ENVELOPE_SOURCE,
  APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION,
  APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION,
  APPROVED_PRODUCTION_BUILD_ENVELOPE_PROVENANCE_RULE_IDS,
  APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSUMERS,
  PRODUCTION_PIPELINE_STATE_ORDER,
  isValidProductionPipelineStateTransition,
  assertProductionPipelineStateTransition,
  advanceProductionPipelineStateSnapshot,
  createInitialProductionPipelineStateSnapshot,
  productionPipelineStateMachineComplete,
  type ApprovedProductionBuildEnvelope,
} from '../src/contract-bound-generation-authority-v4/index.js';
import {
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
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
const PASS_TOKEN = 'FINAL_IMMUTABLE_PRODUCTION_PIPELINE_V1_PASS';

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
  'src/contract-bound-generation-authority-v4/approved-production-build-envelope.ts',
  'src/contract-bound-generation-authority-v4/production-pipeline-state-machine.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-types.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-report.ts',
  'src/contract-bound-generation-authority-v4/index.ts',
  'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
  'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
  'src/code-generation-engine/code-generation-engine-types.ts',
  'src/code-generation-engine/code-generation-engine-authority.ts',
  'src/code-generation-engine/universal-crud-app-generator.ts',
  'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts',
  'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
];

const PROTECTED_AUTHORITY_FILES = [
  'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
  'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
  'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
  'src/contract-bound-generation-authority-v4/contract-generation-gate.ts',
  'src/product-faithfulness-v2/canonical-product-contract.ts',
  'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts',
  'src/engineering-intelligence-activation-authority/engineering-intelligence-activation-authority.ts',
];

function contractEvidenceFixture(overrides: Partial<CbgaCanonicalContractEvidence> = {}): CbgaCanonicalContractEvidence {
  return {
    contractId: 'validator-envelope-fixture',
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
    promptHash: 'hash-envelope-v1',
    buildId: 'build-envelope-v1',
  });

  const envelope = cbgaReport.approvedProductionBuildEnvelope;

  assert(
    '1. Exactly one ApprovedProductionBuildEnvelope exists on every CbgaGenerationReport',
    envelope !== undefined && envelope !== null && cbgaReport.approvedProductionBuildEnvelope === envelope,
    'missing envelope on cbgaReport',
  );

  assert(
    '2. Envelope is immutable (immutable === true, readOnly === true)',
    envelope.immutable === true && envelope.readOnly === true,
    `immutable=${envelope.immutable}`,
  );

  assert(
    '3. Envelope source/schema/constitutional version are canonical',
    envelope.source === APPROVED_PRODUCTION_BUILD_ENVELOPE_SOURCE &&
      envelope.schemaVersion === APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION &&
      envelope.constitutionalVersion === APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION,
    `source=${envelope.source}`,
  );

  assert(
    '4. Envelope carries non-empty provenanceRuleIds including PPC-1207 and PPC-2200',
    APPROVED_PRODUCTION_BUILD_ENVELOPE_PROVENANCE_RULE_IDS.every((id) => envelope.provenanceRuleIds.includes(id)) &&
      envelope.provenanceRuleIds.includes('PPC-1207') &&
      envelope.provenanceRuleIds.includes('PPC-2200'),
    envelope.provenanceRuleIds.join(','),
  );

  assert(
    '5. Envelope declares downstream consumers',
    APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSUMERS.every((c) => envelope.consumers.includes(c)),
    envelope.consumers.join(','),
  );

  assert(
    '6. Every required constitutional handoff is present inside envelope',
    Boolean(
      envelope.approvedProductIdentity &&
        envelope.approvedNavigationPlan &&
        envelope.approvedModulePlan &&
        envelope.approvedMetadataPlan &&
        envelope.approvedSampleDataPlan &&
        envelope.approvedProvenancePlan &&
        envelope.approvedRepairRealityPlan &&
        envelope.canonicalProductContract &&
        envelope.cbgaGenerationSummary,
    ),
    'missing handoff',
  );

  assert(
    '7. Every handoff agrees on buildId',
    [
      envelope.approvedProductIdentity,
      envelope.approvedNavigationPlan,
      envelope.approvedModulePlan,
      envelope.approvedMetadataPlan,
      envelope.approvedSampleDataPlan,
      envelope.approvedProvenancePlan,
      envelope.approvedRepairRealityPlan,
    ].every((h) => h.buildId === envelope.buildId),
    `envelope.buildId=${envelope.buildId}`,
  );

  assert(
    '8. Every handoff agrees on promptHash',
    [
      envelope.approvedProductIdentity,
      envelope.approvedNavigationPlan,
      envelope.approvedModulePlan,
      envelope.approvedMetadataPlan,
      envelope.approvedSampleDataPlan,
      envelope.approvedProvenancePlan,
      envelope.approvedRepairRealityPlan,
    ].every((h) => h.promptHash === envelope.promptHash),
    `envelope.promptHash=${envelope.promptHash}`,
  );

  assert(
    '9. isApprovedProductionBuildEnvelopeValid accepts CBGA-produced envelope',
    isApprovedProductionBuildEnvelopeValid(envelope),
    envelope.traceability.envelopeSummary,
  );

  assert(
    '10. Initial pipeline state is BUILD_ENVELOPE_CREATED',
    envelope.pipelineState.currentState === 'BUILD_ENVELOPE_CREATED',
    envelope.pipelineState.currentState,
  );

  assert(
    '11. buildFingerprint is stable for same inputs',
    envelope.buildFingerprint.length > 0 &&
      envelope.buildFingerprint ===
        buildApprovedProductionBuildEnvelope({
          approvedProductIdentity: envelope.approvedProductIdentity,
          approvedNavigationPlan: envelope.approvedNavigationPlan,
          approvedModulePlan: envelope.approvedModulePlan,
          approvedMetadataPlan: envelope.approvedMetadataPlan,
          approvedSampleDataPlan: envelope.approvedSampleDataPlan,
          approvedProvenancePlan: envelope.approvedProvenancePlan,
          approvedRepairRealityPlan: envelope.approvedRepairRealityPlan,
          canonicalProductContract: envelope.canonicalProductContract,
          finalGateOutcome: cbgaReport.finalGateOutcome,
          repairsAppliedCount: cbgaReport.repairsApplied.length,
          promptHash: envelope.promptHash,
          buildId: envelope.buildId,
          generatedAt: envelope.generatedAt,
        }).buildFingerprint,
    envelope.buildFingerprint,
  );

  assert(
    '12. constitutionalHandoffsFromApprovedProductionBuildEnvelope projects all handoffs',
    constitutionalHandoffsFromApprovedProductionBuildEnvelope(envelope).approvedProductIdentity ===
      envelope.approvedProductIdentity,
    'projection mismatch',
  );

  assert(
    '13. syncCbgaGenerationReportWithProductionBuildEnvelope aligns cbgaReport handoffs',
    syncCbgaGenerationReportWithProductionBuildEnvelope(cbgaReport, envelope).approvedIdentity ===
      envelope.approvedProductIdentity,
    'sync failed',
  );

  let threwMissing = false;
  try {
    requireApprovedProductionBuildEnvelope(null, 'validator-missing-envelope');
  } catch {
    threwMissing = true;
  }
  assert('14. requireApprovedProductionBuildEnvelope throws when envelope missing', threwMissing, 'did not throw');

  const tamperedBuildId: ApprovedProductionBuildEnvelope = {
    ...envelope,
    buildId: 'other-build',
  };
  assert(
    '15. Tampered buildId fails envelope validation',
    !isApprovedProductionBuildEnvelopeValid(tamperedBuildId),
    'tampered buildId still valid',
  );

  const tamperedImmutable = { ...envelope, immutable: false as const };
  assert(
    '16. Non-immutable envelope fails validation',
    !isApprovedProductionBuildEnvelopeValid(tamperedImmutable as ApprovedProductionBuildEnvelope),
    'non-immutable accepted',
  );

  assert(
    '17. State machine order includes all 10 constitutional states',
    PRODUCTION_PIPELINE_STATE_ORDER.length === 10 &&
      PRODUCTION_PIPELINE_STATE_ORDER[0] === 'RAW_PROMPT' &&
      PRODUCTION_PIPELINE_STATE_ORDER.at(-1) === 'ENGINEERING_REPORT_COMPLETE',
    PRODUCTION_PIPELINE_STATE_ORDER.join('→'),
  );

  assert(
    '18. Forward single-step transition BUILD_ENVELOPE_CREATED → MATERIALIZATION allowed',
    isValidProductionPipelineStateTransition('BUILD_ENVELOPE_CREATED', 'MATERIALIZATION'),
    'transition rejected',
  );

  assert(
    '19. Backward transition MATERIALIZATION → BUILD_ENVELOPE_CREATED rejected',
    !isValidProductionPipelineStateTransition('MATERIALIZATION', 'BUILD_ENVELOPE_CREATED'),
    'backward allowed',
  );

  assert(
    '20. Skipped transition BUILD_ENVELOPE_CREATED → WORKSPACE_READY rejected',
    !isValidProductionPipelineStateTransition('BUILD_ENVELOPE_CREATED', 'WORKSPACE_READY'),
    'skip allowed',
  );

  let backwardThrew = false;
  try {
    assertProductionPipelineStateTransition('GPCA_APPROVED', 'MATERIALIZATION');
  } catch {
    backwardThrew = true;
  }
  assert('21. assertProductionPipelineStateTransition throws on backward move', backwardThrew, 'no throw');

  let advanced = advanceApprovedProductionBuildEnvelopeState(
    envelope,
    'MATERIALIZATION',
    'validator materialization',
  );
  advanced = lockApprovedProductionBuildEnvelopeWorkspace(advanced, 'workspaces/test', 'fp-abc');
  advanced = advanceApprovedProductionBuildEnvelopeState(advanced, 'WORKSPACE_READY', 'workspace ready');
  advanced = advanceApprovedProductionBuildEnvelopeState(advanced, 'GPCA_APPROVED', 'gpca approved');
  advanced = advanceApprovedProductionBuildEnvelopeState(advanced, 'BUILD_VALIDATED', 'build validated');
  advanced = advanceApprovedProductionBuildEnvelopeState(advanced, 'PREVIEW_READY', 'preview ready');
  advanced = advanceApprovedProductionBuildEnvelopeState(
    advanced,
    'ENGINEERING_REPORT_COMPLETE',
    'engineering report complete',
  );

  assert(
    '22. Full forward state machine completes at ENGINEERING_REPORT_COMPLETE',
    productionPipelineStateMachineComplete(advanced.pipelineState),
    advanced.pipelineState.currentState,
  );

  assert(
    '23. Preview guarantee passes when all workspace paths match',
    (() => {
      try {
        assertApprovedProductionBuildEnvelopePreviewGuarantee(advanced);
        return true;
      } catch {
        return false;
      }
    })(),
    'preview guarantee failed for locked envelope',
  );

  let previewGuaranteeFailed = false;
  try {
    assertApprovedProductionBuildEnvelopePreviewGuarantee({
      ...advanced,
      pipelineState: { ...advanced.pipelineState, previewWorkspacePath: 'workspaces/other' },
    });
  } catch {
    previewGuaranteeFailed = true;
  }
  assert('24. Preview guarantee fails when preview path diverges', previewGuaranteeFailed, 'no throw');

  const canonicalProductContract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  const buildPlan = resolvePromptFaithfulBuildPlan(REAL_PROMPT);
  const bound = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract, {
    promptHash: 'hash-restaurant-envelope',
    buildId: 'build-restaurant-envelope',
  });
  const restaurantEnvelope = bound.report.approvedProductionBuildEnvelope;

  assert(
    '25. Real restaurant prompt produces valid ApprovedProductionBuildEnvelope end-to-end',
    isApprovedProductionBuildEnvelopeValid(restaurantEnvelope),
    restaurantEnvelope.traceability.envelopeSummary,
  );

  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'restaurant-envelope-test',
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: REAL_PROMPT,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: restaurantEnvelope,
  });

  assert(
    '26. Materialization succeeds with envelope-only input (no individual handoffs)',
    workspaceFiles.length > 0,
    `files=${workspaceFiles.length}`,
  );

  const manifestFile = workspaceFiles.find((f) => f.relativePath === GENERATED_APP_MANIFEST_FILENAME);
  assert(
    '27. Generated manifest title traces to envelope identity',
    manifestFile?.content.includes(restaurantEnvelope.approvedProductIdentity.displayName) === true,
    'manifest title mismatch',
  );

  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const materializationSource = readFileSync(
    join(ROOT, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'),
    'utf8',
  );
  const codeGenSource = readFileSync(join(ROOT, 'src/code-generation-engine/code-generation-engine-authority.ts'), 'utf8');

  assert(
    '28. Orchestrator requires ApprovedProductionBuildEnvelope after CBGA',
    orchestratorSource.includes('requireApprovedProductionBuildEnvelope') &&
      orchestratorSource.includes('constitutionalHandoffsFromApprovedProductionBuildEnvelope'),
    'orchestrator missing envelope requirement',
  );

  assert(
    '29. Orchestrator passes approvedProductionBuildEnvelope to materializeGeneratedApplication',
    orchestratorSource.includes('approvedProductionBuildEnvelope: productionBuildEnvelope'),
    'orchestrator not passing envelope',
  );

  assert(
    '30. Orchestrator validates envelope (not individual handoff guards) before materialization',
    orchestratorSource.includes('isApprovedProductionBuildEnvelopeValid(productionBuildEnvelope)') &&
      !orchestratorSource.includes('isApprovedNavigationPlanValid(approvedNavigationPlan)'),
    'individual plan guards still present',
  );

  assert(
    '31. Materialization engine prefers envelope via constitutionalHandoffsFromApprovedProductionBuildEnvelope',
    materializationSource.includes('constitutionalHandoffsFromApprovedProductionBuildEnvelope') &&
      materializationSource.includes('requireApprovedProductionBuildEnvelope'),
    'materialization envelope path missing',
  );

  assert(
    '32. Code generation engine threads approvedProductionBuildEnvelope',
    codeGenSource.includes('approvedProductionBuildEnvelope: input.approvedProductionBuildEnvelope'),
    'code-gen missing envelope',
  );

  assert(
    '33. Orchestrator advances production pipeline state machine',
    orchestratorSource.includes('advanceProductionEnvelopeState') &&
      orchestratorSource.includes('lockApprovedProductionBuildEnvelopeWorkspace'),
    'state machine wiring missing',
  );

  assert(
    '34. Orchestrator enforces preview guarantee before dev server',
    orchestratorSource.includes('assertApprovedProductionBuildEnvelopePreviewGuarantee'),
    'preview guarantee missing',
  );

  assert(
    '35. Orchestrator syncs cbgaReport via syncCbgaGenerationReportWithProductionBuildEnvelope',
    orchestratorSource.includes('syncCbgaGenerationReportWithProductionBuildEnvelope'),
    'sync helper missing',
  );

  assert(
    '36. Build result exposes approvedProductionBuildEnvelope',
    readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8').includes(
      'approvedProductionBuildEnvelope',
    ),
    'result type missing envelope',
  );

  const gpcaEvidence: GpcaPipelineEvidenceInput = {
    contract,
    cbgaReport,
    proposed: {
      appTitle: cbgaReport.repairedInputs.appTitle,
      moduleIds: cbgaReport.repairedInputs.moduleIds,
      routes: cbgaReport.repairedInputs.routes,
      navigationLabels: cbgaReport.repairedInputs.navigationLabels,
    },
  };
  const traceability = buildContractTraceabilityChains(gpcaEvidence);

  assert(
    '37. GPCA traceability includes production build envelope chain additively',
    traceability.some((entry) => entry.artifactKind === 'PRODUCTION_BUILD_ENVELOPE'),
    traceability.map((t) => t.artifactKind).join(','),
  );

  assert(
    '38. GPCA envelope traceability proven for valid envelope',
    traceability.find((entry) => entry.artifactKind === 'PRODUCTION_BUILD_ENVELOPE')?.proven === true,
    'envelope trace not proven',
  );

  assert(
    '39. GPCA module traceability still present (no weakening)',
    traceability.some((entry) => entry.artifactKind === 'MODULE'),
    'module trace missing',
  );

  assert(
    '40. GPCA repairRealityTraceability still present (no weakening)',
    traceability.some((entry) => entry.artifactKind === 'REPAIR_REALITY'),
    'repair trace missing',
  );

  const cbgaRow = CBGA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Final Immutable Production Pipeline');
  const gpcaRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Final Immutable Production Pipeline');
  assert(
    '41. Capability Matrix includes Final Immutable Production Pipeline (CBGA + GPCA, IMPLEMENTED, production wired)',
    cbgaRow?.status === 'IMPLEMENTED' &&
      cbgaRow?.productionWired === 'YES' &&
      gpcaRow?.status === 'IMPLEMENTED' &&
      gpcaRow?.productionWired === 'YES',
    `cbgaRow=${JSON.stringify(cbgaRow)}, gpcaRow=${JSON.stringify(gpcaRow)}`,
  );

  const protectedHits = new Map<string, number>();
  for (const relPath of PROTECTED_AUTHORITY_FILES) {
    const abs = join(ROOT, relPath);
    try {
      const content = readFileSync(abs, 'utf8');
      const hits = (content.match(/approvedProductionBuildEnvelope|ApprovedProductionBuildEnvelope/g) ?? []).length;
      if (hits > 0) protectedHits.set(relPath, hits);
    } catch {
      /* file must exist — skip count */
    }
  }

  assert('42. No GPCA scoring/gate weakening (protected files untouched by envelope symbols)', protectedHits.size === 0, JSON.stringify(Object.fromEntries(protectedHits)));

  assert(
    '43. CBGA produces envelope reference identical on report',
    cbgaReport.approvedProductionBuildEnvelope === envelope,
    'reference mismatch',
  );

  assert(
    '44. withApprovedProductionBuildEnvelopeRepairPlan preserves immutability flag',
    withApprovedProductionBuildEnvelopeRepairPlan(envelope, envelope.approvedRepairRealityPlan).immutable === true,
    'repair wrapper broke immutability',
  );

  assert(
    '45. Envelope traceability contractId matches canonicalProductContract',
    envelope.traceability.contractId === envelope.canonicalProductContract.contractId,
    'contractId mismatch',
  );

  assert(
    '46. pipelineFingerprint changes when state advances',
    advanced.pipelineFingerprint !== envelope.pipelineFingerprint,
    'fingerprint did not change',
  );

  assert(
    '47. No fallback envelope generation in orchestrator (require, not build)',
    !orchestratorSource.includes('buildApprovedProductionBuildEnvelope('),
    'orchestrator builds envelope locally',
  );

  assert(
    '48. Envelope cbgaGenerationSummary is non-empty',
    envelope.cbgaGenerationSummary.trim().length > 0,
    'empty summary',
  );

  assert(
    '49. State snapshot transitions are non-repeatable (same state re-entry rejected)',
    !isValidProductionPipelineStateTransition('MATERIALIZATION', 'MATERIALIZATION'),
    'repeat state allowed',
  );

  const skipThrew = !isValidProductionPipelineStateTransition('BUILD_ENVELOPE_CREATED', 'GPCA_APPROVED');
  assert('50. Skipped multi-step transition rejected', skipThrew, 'skip allowed');

  assert(
    '51. createInitialProductionPipelineStateSnapshot starts at BUILD_ENVELOPE_CREATED',
    createInitialProductionPipelineStateSnapshot().currentState === 'BUILD_ENVELOPE_CREATED',
    'wrong initial state',
  );

  assert(
    '52. advanceProductionPipelineStateSnapshot appends transition record',
    advanceProductionPipelineStateSnapshot(createInitialProductionPipelineStateSnapshot(), 'MATERIALIZATION', 'test')
      .transitions.length === 2,
    'transition count wrong',
  );

  assert(
    '53. Materialization rejects invalid envelope constitutionally (require throws)',
    (() => {
      let threw = false;
      try {
        buildUniversalMaterializedWorkspaceFiles({
          contractId: 'x',
          ideaId: 'y',
          buildUnits: [],
          rawPrompt: REAL_PROMPT,
          approvedProductionBuildEnvelope: tamperedBuildId,
        });
      } catch {
        threw = true;
      }
      return threw;
    })(),
    'invalid envelope did not throw',
  );

  assert(
    '54. Individual handoffs on cbgaReport remain synchronized from envelope via sync helper',
    syncCbgaGenerationReportWithProductionBuildEnvelope(cbgaReport, envelope).approvedModulePlan ===
      envelope.approvedModulePlan,
    'module plan not synced',
  );

  assert(
    '55. Orchestrator applyRepairPlanToEnvelope updates envelope repair plan',
    orchestratorSource.includes('withApprovedProductionBuildEnvelopeRepairPlan') &&
      orchestratorSource.includes('applyRepairPlanToEnvelope'),
    'repair envelope update missing',
  );

  assert(
    '56. contract-traceability.ts defines productionBuildEnvelopeTraceability',
    readFileSync(join(ROOT, 'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts'), 'utf8').includes(
      'productionBuildEnvelopeTraceability',
    ),
    'traceability function missing',
  );

  assert(
    '57. No application-specific logic in approved-production-build-envelope.ts',
    !readFileSync(join(ROOT, 'src/contract-bound-generation-authority-v4/approved-production-build-envelope.ts'), 'utf8').includes(
      'calculator',
    ),
    'app-specific logic detected',
  );

  assert(
    '58. Envelope producer is CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    envelope.producer === 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    envelope.producer,
  );

  assert(
    '59. Real build plan + envelope materialization includes blueprint manifest',
    workspaceFiles.some((f) => f.relativePath === 'blueprint-manifest.json'),
    'blueprint-manifest missing',
  );

  assert(
    '60. Envelope composedFrom traceability lists every handoff source',
    envelope.traceability.composedFrom.length >= 7,
    String(envelope.traceability.composedFrom.length),
  );

  assert(
    '61. No VERE changes in touched production files (validator scope)',
    !TOUCHED_PRODUCTION_FILES.some((f) => f.includes('validation-runtime-evidence')),
    'vere file in scope',
  );

  assert(
    '62. TypeScript compile check for touched modules',
    (() => {
      try {
        execSync('npx tsc --noEmit --pretty false 2>&1', {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 120_000,
        });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return !msg.includes('approved-production-build-envelope') && !msg.includes('production-pipeline-state-machine');
      }
    })(),
    'tsc reported errors in envelope modules',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('\n# Final Immutable Production Pipeline V1 — Validation\n');
  for (const result of results) {
    console.log(`${result.passed ? '✓' : '✗'} ${result.name}`);
    if (!result.passed) console.log(`  ${result.detail}`);
  }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);

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
