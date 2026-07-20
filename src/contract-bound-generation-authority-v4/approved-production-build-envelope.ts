/**
 * Contract-Bound Generation Authority V4 — Approved Production Build Envelope.
 *
 * Production Pipeline Constitution Adoption Phase 10 — Final Immutable Production Pipeline V1.
 *
 * PPC-1207 "No Parallel Truth": beyond CBGA approval, exactly one immutable
 * ApprovedProductionBuildEnvelope is the constitutional source for an entire build. Downstream
 * production stages must consume this envelope — never individual handoffs in parallel.
 */

import type { CbgaCanonicalContractEvidence, CbgaGenerationGateOutcome } from './contract-bound-generation-types.js';
import type { ApprovedProductIdentity } from './approved-product-identity.js';
import type { ApprovedNavigationPlan } from './approved-navigation-plan.js';
import type { ApprovedModulePlan } from './approved-module-plan.js';
import type { ApprovedMetadataPlan } from './approved-metadata-plan.js';
import type { ApprovedSampleDataPlan } from './approved-sample-data-plan.js';
import type { ApprovedProvenancePlan } from './approved-provenance-plan.js';
import type { ApprovedRepairRealityPlan } from './approved-repair-reality-plan.js';
import { isApprovedProductIdentityValid } from './approved-product-identity.js';
import { isApprovedNavigationPlanValid } from './approved-navigation-plan.js';
import { isApprovedModulePlanValid } from './approved-module-plan.js';
import { isApprovedMetadataPlanValid } from './approved-metadata-plan.js';
import { isApprovedSampleDataPlanValid } from './approved-sample-data-plan.js';
import { isApprovedProvenancePlanValid } from './approved-provenance-plan.js';
import { isApprovedRepairRealityPlanValid } from './approved-repair-reality-plan.js';
import {
  type ProductionPipelineState,
  type ProductionPipelineStateSnapshot,
  createInitialProductionPipelineStateSnapshot,
  advanceProductionPipelineStateSnapshot,
  assertPreviewWorkspaceMatchesEnvelopeSnapshot,
} from './production-pipeline-state-machine.js';

export const APPROVED_PRODUCTION_BUILD_ENVELOPE_SOURCE = 'CBGA_COMPOSED_PRODUCTION_BUILD_ENVELOPE' as const;

export const APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION = '1.0.0' as const;

export const APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION = 'PRODUCTION_PIPELINE_CONSTITUTION_V1' as const;

export const APPROVED_PRODUCTION_BUILD_ENVELOPE_PROVENANCE_RULE_IDS: readonly string[] = [
  'PPC-101',
  'PPC-201',
  'PPC-202',
  'PPC-401',
  'PPC-402',
  'PPC-1207',
  'PPC-1600',
  'PPC-1601',
  'PPC-1701',
  'PPC-1702',
  'PPC-1703',
  'PPC-1800',
  'PPC-1900',
  'PPC-2100',
  'PPC-2101',
  'PPC-2102',
  'PPC-2200',
];

export const APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSUMERS: readonly string[] = [
  'ONE_PROMPT_BUILD_ORCHESTRATOR',
  'UNIVERSAL_APP_MATERIALIZATION_ENGINE',
  'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
  'CODE_GENERATION_ENGINE',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'GENERATED_APP_MANIFEST',
  'BLUEPRINT_MANIFEST',
  'BUILD_MANIFEST',
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'FINAL_ENGINEERING_REPORT',
  'LIVE_PREVIEW_GATE',
  'RUNTIME_METADATA',
  'PREVIEW_METADATA',
];

export interface ApprovedProductionBuildEnvelopeTraceability {
  readonly composedFrom: readonly string[];
  readonly contractId: string;
  readonly buildId: string | null;
  readonly projectId: string | null;
  readonly promptHash: string | null;
  readonly envelopeSummary: string;
}

export interface ApprovedProductionBuildEnvelope {
  readOnly: true;
  approvedProductIdentity: ApprovedProductIdentity;
  approvedNavigationPlan: ApprovedNavigationPlan;
  approvedModulePlan: ApprovedModulePlan;
  approvedMetadataPlan: ApprovedMetadataPlan;
  approvedSampleDataPlan: ApprovedSampleDataPlan;
  approvedProvenancePlan: ApprovedProvenancePlan;
  approvedRepairRealityPlan: ApprovedRepairRealityPlan;
  canonicalProductContract: CbgaCanonicalContractEvidence;
  cbgaGenerationSummary: string;
  constitutionalVersion: typeof APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION;
  pipelineState: ProductionPipelineStateSnapshot;
  buildFingerprint: string;
  pipelineFingerprint: string;
  source: typeof APPROVED_PRODUCTION_BUILD_ENVELOPE_SOURCE;
  schemaVersion: typeof APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION;
  provenanceRuleIds: readonly string[];
  producer: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4';
  consumers: readonly string[];
  immutable: true;
  generatedAt: string;
  promptHash: string | null;
  buildId: string | null;
  projectId: string | null;
  buildContextDecision: {
    readonly decision: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
    readonly confirmationOverride: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
    readonly explicitlyConfirmed: boolean;
  };
  traceability: ApprovedProductionBuildEnvelopeTraceability;
}

function stableFingerprint(parts: readonly string[]): string {
  return parts.filter(Boolean).join('|');
}

function computeBuildFingerprint(input: {
  buildId: string | null;
  projectId: string | null;
  promptHash: string | null;
  buildContextDecision: string | null;
  buildIntentOverride: string | null;
  contractId: string;
  constitutionalVersion: string;
  schemaVersion: string;
}): string {
  return stableFingerprint([
    input.buildId ?? '(none)',
    input.projectId ?? '(none)',
    input.promptHash ?? '(none)',
    input.buildContextDecision ?? '(decision-none)',
    input.buildIntentOverride ?? '(unconfirmed)',
    input.contractId,
    input.constitutionalVersion,
    input.schemaVersion,
  ]);
}

function computePipelineFingerprint(buildFingerprint: string, pipelineState: ProductionPipelineStateSnapshot): string {
  return stableFingerprint([
    buildFingerprint,
    pipelineState.currentState,
    pipelineState.workspacePath ?? '(none)',
    pipelineState.workspaceFingerprint ?? '(none)',
    String(pipelineState.transitions.length),
  ]);
}

function handoffBuildIdsMatch(
  buildId: string | null,
  handoffs: readonly { buildId: string | null; promptHash: string | null }[],
): boolean {
  return handoffs.every((handoff) => handoff.buildId === buildId);
}

function handoffPromptHashesMatch(
  promptHash: string | null,
  handoffs: readonly { buildId: string | null; promptHash: string | null }[],
): boolean {
  return handoffs.every((handoff) => handoff.promptHash === promptHash);
}

export function buildApprovedProductionBuildEnvelope(input: {
  approvedProductIdentity: ApprovedProductIdentity;
  approvedNavigationPlan: ApprovedNavigationPlan;
  approvedModulePlan: ApprovedModulePlan;
  approvedMetadataPlan: ApprovedMetadataPlan;
  approvedSampleDataPlan: ApprovedSampleDataPlan;
  approvedProvenancePlan: ApprovedProvenancePlan;
  approvedRepairRealityPlan: ApprovedRepairRealityPlan;
  canonicalProductContract: CbgaCanonicalContractEvidence;
  finalGateOutcome: CbgaGenerationGateOutcome;
  repairsAppliedCount: number;
  promptHash?: string | null;
  buildId?: string | null;
  projectId?: string | null;
  buildContextDecision?: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
  buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
  generatedAt?: string;
}): ApprovedProductionBuildEnvelope {
  const promptHash = input.promptHash ?? null;
  const buildId = input.buildId ?? null;
  const projectId = input.projectId ?? null;
  const buildContextDecision = {
    decision: input.buildContextDecision ?? null,
    confirmationOverride: input.buildIntentOverride ?? null,
    explicitlyConfirmed: input.buildIntentOverride != null,
  } as const;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const cbgaGenerationSummary = `CBGA ${input.finalGateOutcome} — ${input.repairsAppliedCount} repair(s) applied; contract "${input.canonicalProductContract.contractId}".`;
  const pipelineState = createInitialProductionPipelineStateSnapshot(
    'ApprovedProductionBuildEnvelope created immediately after CBGA approval.',
  );
  const buildFingerprint = computeBuildFingerprint({
    buildId,
    projectId,
    promptHash,
    buildContextDecision: buildContextDecision.decision,
    buildIntentOverride: buildContextDecision.confirmationOverride,
    contractId: input.canonicalProductContract.contractId,
    constitutionalVersion: APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION,
    schemaVersion: APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION,
  });
  const pipelineFingerprint = computePipelineFingerprint(buildFingerprint, pipelineState);
  const envelopeSummary = `Production build envelope for contract "${input.canonicalProductContract.contractId}" — buildId=${buildId ?? '(none)'}; projectId=${projectId ?? '(none)'}; state=${pipelineState.currentState}.`;

  return {
    readOnly: true,
    approvedProductIdentity: input.approvedProductIdentity,
    approvedNavigationPlan: input.approvedNavigationPlan,
    approvedModulePlan: input.approvedModulePlan,
    approvedMetadataPlan: input.approvedMetadataPlan,
    approvedSampleDataPlan: input.approvedSampleDataPlan,
    approvedProvenancePlan: input.approvedProvenancePlan,
    approvedRepairRealityPlan: input.approvedRepairRealityPlan,
    canonicalProductContract: input.canonicalProductContract,
    cbgaGenerationSummary,
    constitutionalVersion: APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION,
    pipelineState,
    buildFingerprint,
    pipelineFingerprint,
    source: APPROVED_PRODUCTION_BUILD_ENVELOPE_SOURCE,
    schemaVersion: APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION,
    provenanceRuleIds: APPROVED_PRODUCTION_BUILD_ENVELOPE_PROVENANCE_RULE_IDS,
    producer: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSUMERS,
    immutable: true,
    generatedAt,
    promptHash,
    buildId,
    projectId,
    buildContextDecision,
    traceability: {
      composedFrom: [
        input.approvedProductIdentity.source,
        input.approvedNavigationPlan.source,
        input.approvedModulePlan.source,
        input.approvedMetadataPlan.source,
        input.approvedSampleDataPlan.source,
        input.approvedProvenancePlan.source,
        input.approvedRepairRealityPlan.source,
      ],
      contractId: input.canonicalProductContract.contractId,
      buildId,
      projectId,
      promptHash,
      envelopeSummary,
    },
  };
}

/** Projects every constitutional handoff from the envelope — the only supported downstream read path. */
export function constitutionalHandoffsFromApprovedProductionBuildEnvelope(envelope: ApprovedProductionBuildEnvelope): {
  approvedProductIdentity: ApprovedProductIdentity;
  approvedNavigationPlan: ApprovedNavigationPlan;
  approvedModulePlan: ApprovedModulePlan;
  approvedMetadataPlan: ApprovedMetadataPlan;
  approvedSampleDataPlan: ApprovedSampleDataPlan;
  approvedProvenancePlan: ApprovedProvenancePlan;
  approvedRepairRealityPlan: ApprovedRepairRealityPlan;
  canonicalProductContract: CbgaCanonicalContractEvidence;
} {
  return {
    approvedProductIdentity: envelope.approvedProductIdentity,
    approvedNavigationPlan: envelope.approvedNavigationPlan,
    approvedModulePlan: envelope.approvedModulePlan,
    approvedMetadataPlan: envelope.approvedMetadataPlan,
    approvedSampleDataPlan: envelope.approvedSampleDataPlan,
    approvedProvenancePlan: envelope.approvedProvenancePlan,
    approvedRepairRealityPlan: envelope.approvedRepairRealityPlan,
    canonicalProductContract: envelope.canonicalProductContract,
  };
}

export function withApprovedProductionBuildEnvelopeRepairPlan(
  envelope: ApprovedProductionBuildEnvelope,
  approvedRepairRealityPlan: ApprovedRepairRealityPlan,
): ApprovedProductionBuildEnvelope {
  const pipelineState = envelope.pipelineState;
  const buildFingerprint = envelope.buildFingerprint;
  const pipelineFingerprint = computePipelineFingerprint(buildFingerprint, pipelineState);
  return {
    ...envelope,
    approvedRepairRealityPlan,
    pipelineFingerprint,
    traceability: {
      ...envelope.traceability,
      envelopeSummary: `${envelope.traceability.envelopeSummary} repairEntries=${approvedRepairRealityPlan.repairEntries.length}.`,
    },
  };
}

export function withApprovedProductionBuildEnvelopePipelineState(
  envelope: ApprovedProductionBuildEnvelope,
  pipelineState: ProductionPipelineStateSnapshot,
): ApprovedProductionBuildEnvelope {
  const buildFingerprint = envelope.buildFingerprint;
  const pipelineFingerprint = computePipelineFingerprint(buildFingerprint, pipelineState);
  return {
    ...envelope,
    pipelineState,
    pipelineFingerprint,
  };
}

export function advanceApprovedProductionBuildEnvelopeState(
  envelope: ApprovedProductionBuildEnvelope,
  nextState: ProductionPipelineStateSnapshot['currentState'],
  detail: string,
): ApprovedProductionBuildEnvelope {
  const pipelineState = advanceProductionPipelineStateSnapshot(envelope.pipelineState, nextState, detail);
  return withApprovedProductionBuildEnvelopePipelineState(envelope, pipelineState);
}

export function lockApprovedProductionBuildEnvelopeWorkspace(
  envelope: ApprovedProductionBuildEnvelope,
  workspacePath: string,
  workspaceFingerprint: string,
): ApprovedProductionBuildEnvelope {
  const pipelineState: ProductionPipelineStateSnapshot = {
    ...envelope.pipelineState,
    workspacePath,
    workspaceFingerprint,
    manifestWorkspacePath: workspacePath,
    previewWorkspacePath: workspacePath,
    engineeringReportWorkspacePath: workspacePath,
  };
  return withApprovedProductionBuildEnvelopePipelineState(envelope, pipelineState);
}

export function assertApprovedProductionBuildEnvelopePreviewGuarantee(
  envelope: ApprovedProductionBuildEnvelope,
): void {
  assertPreviewWorkspaceMatchesEnvelopeSnapshot(envelope.pipelineState);
}

export function isApprovedProductionBuildEnvelopeValid(
  envelope: ApprovedProductionBuildEnvelope | null | undefined,
): envelope is ApprovedProductionBuildEnvelope {
  if (!envelope) return false;
  if (envelope.immutable !== true) return false;
  if (envelope.source !== APPROVED_PRODUCTION_BUILD_ENVELOPE_SOURCE) return false;
  if (envelope.schemaVersion !== APPROVED_PRODUCTION_BUILD_ENVELOPE_SCHEMA_VERSION) return false;
  if (envelope.constitutionalVersion !== APPROVED_PRODUCTION_BUILD_ENVELOPE_CONSTITUTIONAL_VERSION) return false;
  if (envelope.producer !== 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4') return false;
  if (!isApprovedProductIdentityValid(envelope.approvedProductIdentity)) return false;
  if (!isApprovedNavigationPlanValid(envelope.approvedNavigationPlan)) return false;
  if (!isApprovedModulePlanValid(envelope.approvedModulePlan)) return false;
  if (!isApprovedMetadataPlanValid(envelope.approvedMetadataPlan)) return false;
  if (!isApprovedSampleDataPlanValid(envelope.approvedSampleDataPlan)) return false;
  if (!isApprovedProvenancePlanValid(envelope.approvedProvenancePlan)) return false;
  if (!isApprovedRepairRealityPlanValid(envelope.approvedRepairRealityPlan)) return false;
  const handoffs = [
    envelope.approvedProductIdentity,
    envelope.approvedNavigationPlan,
    envelope.approvedModulePlan,
    envelope.approvedMetadataPlan,
    envelope.approvedSampleDataPlan,
    envelope.approvedProvenancePlan,
    envelope.approvedRepairRealityPlan,
  ];
  if (!handoffBuildIdsMatch(envelope.buildId, handoffs)) return false;
  if (!handoffPromptHashesMatch(envelope.promptHash, handoffs)) return false;
  if (envelope.canonicalProductContract.contractId !== envelope.traceability.contractId) return false;
  if (envelope.projectId !== envelope.traceability.projectId) return false;
  if (!envelope.buildContextDecision || typeof envelope.buildContextDecision.explicitlyConfirmed !== 'boolean') return false;
  if (
    envelope.buildContextDecision.explicitlyConfirmed !==
    (envelope.buildContextDecision.confirmationOverride !== null)
  ) return false;
  if (
    envelope.buildContextDecision.confirmationOverride === 'START_NEW_BUILD' &&
    envelope.buildContextDecision.decision !== 'NEW_BUILD'
  ) return false;
  if (
    envelope.buildContextDecision.confirmationOverride === 'CONTINUE_EXISTING_PROJECT' &&
    envelope.buildContextDecision.decision !== 'CONTINUE_EXISTING_PROJECT'
  ) return false;
  if (envelope.traceability.envelopeSummary.trim().length === 0) return false;
  if (envelope.buildFingerprint !== computeBuildFingerprint({
    buildId: envelope.buildId,
    projectId: envelope.projectId,
    promptHash: envelope.promptHash,
    buildContextDecision: envelope.buildContextDecision.decision,
    buildIntentOverride: envelope.buildContextDecision.confirmationOverride,
    contractId: envelope.canonicalProductContract.contractId,
    constitutionalVersion: envelope.constitutionalVersion,
    schemaVersion: envelope.schemaVersion,
  })) {
    return false;
  }
  if (envelope.pipelineFingerprint !== computePipelineFingerprint(envelope.buildFingerprint, envelope.pipelineState)) {
    return false;
  }
  return true;
}

export function requireApprovedProductionBuildEnvelope(
  envelope: ApprovedProductionBuildEnvelope | null | undefined,
  contextLabel: string,
): ApprovedProductionBuildEnvelope {
  if (!isApprovedProductionBuildEnvelopeValid(envelope)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked without a structurally valid ApprovedProductionBuildEnvelope. Fallback/independent constitutional handoff reads are forbidden after CBGA approval.`,
    );
  }
  return envelope;
}

export function requireApprovedProductionBuildEnvelopeForContext(
  envelope: ApprovedProductionBuildEnvelope | null | undefined,
  expected: {
    buildId: string;
    projectId: string;
    promptHash: string;
  },
  contextLabel: string,
): ApprovedProductionBuildEnvelope {
  const valid = requireApprovedProductionBuildEnvelope(envelope, contextLabel);
  const mismatches: string[] = [];
  if (valid.buildId !== expected.buildId) {
    mismatches.push(`buildId expected=${expected.buildId} actual=${valid.buildId ?? '(none)'}`);
  }
  if (valid.projectId !== expected.projectId) {
    mismatches.push(`projectId expected=${expected.projectId} actual=${valid.projectId ?? '(none)'}`);
  }
  if (valid.promptHash !== expected.promptHash) {
    mismatches.push(`promptHash expected=${expected.promptHash} actual=${valid.promptHash ?? '(none)'}`);
  }
  if (mismatches.length > 0) {
    throw new Error(
      `CROSS_RUN_ARTIFACT_CONTEXT_MISMATCH: ${contextLabel} rejected an artifact from another build context (${mismatches.join('; ')}).`,
    );
  }
  return valid;
}

/** Keeps CbgaGenerationReport handoff fields aligned with the single authoritative envelope for GPCA. */
export function syncCbgaGenerationReportWithProductionBuildEnvelope(
  report: import('./contract-bound-generation-types.js').CbgaGenerationReport,
  envelope: ApprovedProductionBuildEnvelope,
): import('./contract-bound-generation-types.js').CbgaGenerationReport {
  return {
    ...report,
    approvedIdentity: envelope.approvedProductIdentity,
    approvedNavigationPlan: envelope.approvedNavigationPlan,
    approvedModulePlan: envelope.approvedModulePlan,
    approvedMetadataPlan: envelope.approvedMetadataPlan,
    approvedSampleDataPlan: envelope.approvedSampleDataPlan,
    approvedProvenancePlan: envelope.approvedProvenancePlan,
    approvedRepairRealityPlan: envelope.approvedRepairRealityPlan,
    approvedProductionBuildEnvelope: envelope,
  };
}
