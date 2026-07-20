/**
 * Contract-Bound Generation Authority V4 — Approved Repair Reality Plan handoff.
 *
 * Production Pipeline Constitution Adoption Phase 9 — Repair Reality Alignment V1.
 *
 * PPC-1207 "No Parallel Truth": every production repair must be classified exactly once in this
 * immutable object. No downstream stage may infer repair type, claim workspace mutation without
 * evidence, or report recovery without matching reality.
 */

import type { CbgaRepairAction, CbgaRepairActionId } from './contract-bound-generation-types.js';
import {
  type ConstitutionalRepairType,
  expectedMutationFlagsForRepairType,
  repairEntryMutationFlagsMatchType,
  repairTypeRequiresFullConstitutionalRevalidation,
  repairTypeRequiresGpcaRerun,
  repairTypeRequiresProductFaithfulnessRerun,
} from '../production-pipeline-constitution-v1/repair-reality-types.js';

export const APPROVED_REPAIR_REALITY_PLAN_SOURCE = 'CBGA_COMPOSED_REPAIR_REALITY_PLAN' as const;

export const APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION = '1.0.0' as const;

export const APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS: readonly string[] = [
  'PPC-101',
  'PPC-201',
  'PPC-202',
  'PPC-401',
  'PPC-402',
  'PPC-1207',
  'PPC-1701',
  'PPC-1702',
  'PPC-1703',
  'PPC-1800',
  'PPC-1900',
  'PPC-2100',
  'PPC-2101',
  'PPC-2102',
];

export const APPROVED_REPAIR_REALITY_PLAN_CONSUMERS: readonly string[] = [
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'UNIVERSAL_APP_MATERIALIZATION_ENGINE',
  'GENERATED_APP_MANIFEST',
  'BLUEPRINT_MANIFEST',
  'BUILD_MANIFEST',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'FINAL_ENGINEERING_REPORT',
  'LIVE_PREVIEW_GATE',
  'RUNTIME_METADATA',
  'PREVIEW_METADATA',
  'ONE_PROMPT_BUILD_ORCHESTRATOR',
];

export type ApprovedRepairRealityScope =
  | 'CBGA_INPUT_REPAIR'
  | 'WORKSPACE'
  | 'SOURCE'
  | 'MANIFEST'
  | 'PREVIEW'
  | 'RUNTIME'
  | 'REPORT'
  | 'EVIDENCE'
  | 'DIAGNOSTIC'
  | 'PIPELINE';

export interface ApprovedRepairRealityEntry {
  readonly repairId: string;
  readonly repairType: ConstitutionalRepairType;
  readonly repairReason: string;
  readonly repairScope: ApprovedRepairRealityScope;
  readonly filesMutated: boolean;
  readonly artifactsMutated: boolean;
  readonly workspaceMutated: boolean;
  readonly runtimeMutated: boolean;
  readonly previewMutated: boolean;
  readonly manifestMutated: boolean;
  readonly contractAffected: boolean;
  readonly requiresRevalidation: boolean;
  readonly requiredAuthorities: readonly string[];
  readonly requiredPipelineRestart: boolean;
  readonly constitutionalRuleIds: readonly string[];
  readonly producer: string;
  readonly consumer: string;
  readonly immutable: true;
  readonly generatedAt: string;
  readonly mutatedPaths: readonly string[];
}

export interface ApprovedRepairRealityTraceabilityEntry {
  readonly key: string;
  readonly value: string;
  readonly source: string;
}

/**
 * The single authoritative repair record for a build. Produced at CBGA for input repairs and
 * extended immutably by the orchestrator after every real post-CBGA repair.
 */
export interface ApprovedRepairRealityPlan {
  readOnly: true;
  repairEntries: readonly ApprovedRepairRealityEntry[];
  repairSummary: string;
  revalidationCompleted: readonly string[];
  contractId: string;
  traceabilityEntries: readonly ApprovedRepairRealityTraceabilityEntry[];
  source: typeof APPROVED_REPAIR_REALITY_PLAN_SOURCE;
  schemaVersion: typeof APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION;
  provenanceRuleIds: readonly string[];
  owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4' | 'ONE_PROMPT_BUILD_ORCHESTRATOR';
  consumers: readonly string[];
  immutable: true;
  promptHash: string | null;
  buildId: string | null;
  generatedAt: string;
}

function mapCbgaActionToRepairType(actionId: CbgaRepairActionId): ConstitutionalRepairType {
  switch (actionId) {
    case 'REMOVE_UNSUPPORTED_FALLBACK_MODULE':
    case 'REBUILD_MODULE_PLAN':
      return 'MODULE_REPAIR';
    case 'REBUILD_ROUTE_PLAN':
    case 'REBUILD_NAVIGATION_PLAN':
      return 'NAVIGATION_REPAIR';
    case 'REPLACE_GENERIC_APP_IDENTITY':
      return 'IDENTITY_REPAIR';
    case 'REPLACE_GENERIC_WELCOME_SURFACE':
    case 'REBUILD_SURFACE_PLAN':
      return 'METADATA_REPAIR';
    default: {
      const _exhaustive: never = actionId;
      return _exhaustive;
    }
  }
}

function cbgaScopeForRepairType(repairType: ConstitutionalRepairType): ApprovedRepairRealityScope {
  if (
    repairType === 'MODULE_REPAIR' ||
    repairType === 'NAVIGATION_REPAIR' ||
    repairType === 'IDENTITY_REPAIR' ||
    repairType === 'METADATA_REPAIR'
  ) {
    return 'CBGA_INPUT_REPAIR';
  }
  return 'CBGA_INPUT_REPAIR';
}

function requiredAuthoritiesForRepairType(repairType: ConstitutionalRepairType): readonly string[] {
  const authorities: string[] = [];
  if (repairTypeRequiresGpcaRerun(repairType)) {
    authorities.push('GENERATION_PIPELINE_COMPLIANCE_AUTHORITY');
  }
  if (repairTypeRequiresProductFaithfulnessRerun(repairType)) {
    authorities.push('PRODUCT_FAITHFULNESS_V2');
  }
  if (repairTypeRequiresFullConstitutionalRevalidation(repairType)) {
    authorities.push('PRODUCTION_PIPELINE_CONSTITUTION_V1');
  }
  return authorities;
}

function buildRepairEntry(input: {
  repairId: string;
  repairType: ConstitutionalRepairType;
  repairReason: string;
  repairScope: ApprovedRepairRealityScope;
  producer: string;
  consumer: string;
  mutatedPaths?: readonly string[];
  requiredPipelineRestart?: boolean;
  generatedAt?: string;
}): ApprovedRepairRealityEntry {
  const flags = expectedMutationFlagsForRepairType(input.repairType);
  return {
    repairId: input.repairId,
    repairType: input.repairType,
    repairReason: input.repairReason,
    repairScope: input.repairScope,
    filesMutated: flags.filesMutated,
    artifactsMutated: flags.artifactsMutated,
    workspaceMutated: flags.workspaceMutated,
    runtimeMutated: flags.runtimeMutated,
    previewMutated: flags.previewMutated,
    manifestMutated: flags.manifestMutated,
    contractAffected: flags.contractAffected,
    requiresRevalidation: repairTypeRequiresFullConstitutionalRevalidation(input.repairType),
    requiredAuthorities: requiredAuthoritiesForRepairType(input.repairType),
    requiredPipelineRestart: input.requiredPipelineRestart ?? false,
    constitutionalRuleIds: [...APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS],
    producer: input.producer,
    consumer: input.consumer,
    immutable: true,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    mutatedPaths: input.mutatedPaths ?? [],
  };
}

export function createCbgaRepairEntry(
  action: CbgaRepairAction,
  index: number,
): ApprovedRepairRealityEntry {
  const repairType = mapCbgaActionToRepairType(action.actionId);
  return buildRepairEntry({
    repairId: `cbga-${action.actionId.toLowerCase()}-${index}`,
    repairType,
    repairReason: action.detail,
    repairScope: cbgaScopeForRepairType(repairType),
    producer: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumer: 'PROMPT_BOUNDED_MODULE_PLAN',
  });
}

export function createWorkspaceMutationRepairEntry(input: {
  repairId: string;
  repairReason: string;
  producer: string;
  mutatedPaths: readonly string[];
}): ApprovedRepairRealityEntry {
  return buildRepairEntry({
    repairId: input.repairId,
    repairType: 'WORKSPACE_MUTATION',
    repairReason: input.repairReason,
    repairScope: 'WORKSPACE',
    producer: input.producer,
    consumer: 'WORKSPACE_DIR',
    mutatedPaths: input.mutatedPaths,
  });
}

export function createAutofixCompilationRepairEntry(input: {
  repairId: string;
  repairReason: string;
  mutatedPaths: readonly string[];
}): ApprovedRepairRealityEntry {
  return buildRepairEntry({
    repairId: input.repairId,
    repairType: 'AUTOFIX_COMPILATION',
    repairReason: input.repairReason,
    repairScope: 'SOURCE',
    producer: 'AEE_BUILD_AUTOFIX_LOOP',
    consumer: 'WORKSPACE_DIR',
    mutatedPaths: input.mutatedPaths,
  });
}

export function createPreviewRecoveryRepairEntry(input: {
  repairId: string;
  repairReason: string;
}): ApprovedRepairRealityEntry {
  return buildRepairEntry({
    repairId: input.repairId,
    repairType: 'PREVIEW_RECOVERY',
    repairReason: input.repairReason,
    repairScope: 'PREVIEW',
    producer: 'AEE_PREVIEW_RECOVERY_LOOP',
    consumer: 'LIVE_PREVIEW_GATE',
    requiredPipelineRestart: true,
  });
}

export function createPipelineRestartRepairEntry(input: {
  repairId: string;
  repairReason: string;
  stage: string;
}): ApprovedRepairRealityEntry {
  return buildRepairEntry({
    repairId: input.repairId,
    repairType: 'PIPELINE_RESTART',
    repairReason: input.repairReason,
    repairScope: 'PIPELINE',
    producer: 'BUILD_EXECUTION_STABILIZER_V1',
    consumer: input.stage,
    requiredPipelineRestart: true,
  });
}

export function createGeneratorRegenerationRepairEntry(input: {
  repairId: string;
  repairReason: string;
  mutatedPaths: readonly string[];
}): ApprovedRepairRealityEntry {
  return buildRepairEntry({
    repairId: input.repairId,
    repairType: 'GENERATOR_REGENERATION',
    repairReason: input.repairReason,
    repairScope: 'WORKSPACE',
    producer: 'ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY',
    consumer: 'WORKSPACE_DIR',
    mutatedPaths: input.mutatedPaths,
  });
}

export function createCapabilityEvolutionRepairEntry(input: {
  repairId: string;
  repairReason: string;
  mutatedPaths: readonly string[];
}): ApprovedRepairRealityEntry {
  return buildRepairEntry({
    repairId: input.repairId,
    repairType: 'CAPABILITY_EVOLUTION',
    repairReason: input.repairReason,
    repairScope: 'WORKSPACE',
    producer: 'AUTONOMOUS_ENGINEERING_LOOP',
    consumer: 'WORKSPACE_DIR',
    mutatedPaths: input.mutatedPaths,
  });
}

function summarizeRepairEntries(entries: readonly ApprovedRepairRealityEntry[], contractId: string): string {
  if (entries.length === 0) {
    return `No production repairs recorded for contract "${contractId}".`;
  }
  const byType = new Map<string, number>();
  for (const entry of entries) {
    byType.set(entry.repairType, (byType.get(entry.repairType) ?? 0) + 1);
  }
  const typeSummary = [...byType.entries()].map(([type, count]) => `${type}×${count}`).join(', ');
  const workspaceMutations = entries.filter((entry) => entry.workspaceMutated).length;
  const evidenceOnly = entries.filter(
    (entry) => entry.repairType === 'EVIDENCE_ONLY' || entry.repairType === 'REPORT_ONLY',
  ).length;
  return `Repair reality for contract "${contractId}": ${entries.length} classified repair(s) [${typeSummary}]; workspace mutations=${workspaceMutations}; evidence/report-only=${evidenceOnly}.`;
}

function buildTraceabilityEntries(
  plan: Pick<ApprovedRepairRealityPlan, 'repairSummary' | 'contractId' | 'repairEntries' | 'revalidationCompleted'>,
): ApprovedRepairRealityTraceabilityEntry[] {
  return [
    { key: 'contractId', value: plan.contractId, source: APPROVED_REPAIR_REALITY_PLAN_SOURCE },
    { key: 'repairSummary', value: plan.repairSummary, source: APPROVED_REPAIR_REALITY_PLAN_SOURCE },
    { key: 'repairEntryCount', value: String(plan.repairEntries.length), source: APPROVED_REPAIR_REALITY_PLAN_SOURCE },
    {
      key: 'revalidationCompleted',
      value: plan.revalidationCompleted.join(',') || '(none)',
      source: APPROVED_REPAIR_REALITY_PLAN_SOURCE,
    },
  ];
}

export function buildApprovedRepairRealityPlan(input: {
  contractId: string;
  cbgaRepairs: readonly CbgaRepairAction[];
  promptHash?: string | null;
  buildId?: string | null;
  additionalEntries?: readonly ApprovedRepairRealityEntry[];
  revalidationCompleted?: readonly string[];
  owningStage?: ApprovedRepairRealityPlan['owningStage'];
}): ApprovedRepairRealityPlan {
  const cbgaEntries = input.cbgaRepairs.map((action, index) => createCbgaRepairEntry(action, index));
  const repairEntries = [...cbgaEntries, ...(input.additionalEntries ?? [])];
  const repairSummary = summarizeRepairEntries(repairEntries, input.contractId);
  const revalidationCompleted = input.revalidationCompleted ?? [];
  const traceabilityEntries = buildTraceabilityEntries({
    repairSummary,
    contractId: input.contractId,
    repairEntries,
    revalidationCompleted,
  });

  return {
    readOnly: true,
    repairEntries,
    repairSummary,
    revalidationCompleted,
    contractId: input.contractId,
    traceabilityEntries,
    source: APPROVED_REPAIR_REALITY_PLAN_SOURCE,
    schemaVersion: APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION,
    provenanceRuleIds: APPROVED_REPAIR_REALITY_PLAN_PROVENANCE_RULE_IDS,
    owningStage: input.owningStage ?? 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_REPAIR_REALITY_PLAN_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** Immutably extends the plan with additional classified repair entries. */
export function appendApprovedRepairRealityEntries(
  plan: ApprovedRepairRealityPlan,
  entries: readonly ApprovedRepairRealityEntry[],
): ApprovedRepairRealityPlan {
  if (entries.length === 0) {
    return plan;
  }
  const repairEntries = [...plan.repairEntries, ...entries];
  const repairSummary = summarizeRepairEntries(repairEntries, plan.contractId);
  const revalidationCompleted = [...plan.revalidationCompleted];
  return {
    readOnly: true,
    repairEntries,
    repairSummary,
    revalidationCompleted,
    contractId: plan.contractId,
    traceabilityEntries: buildTraceabilityEntries({
      repairSummary,
      contractId: plan.contractId,
      repairEntries,
      revalidationCompleted,
    }),
    source: APPROVED_REPAIR_REALITY_PLAN_SOURCE,
    schemaVersion: APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION,
    provenanceRuleIds: plan.provenanceRuleIds,
    owningStage: 'ONE_PROMPT_BUILD_ORCHESTRATOR',
    consumers: plan.consumers,
    immutable: true,
    promptHash: plan.promptHash,
    buildId: plan.buildId,
    generatedAt: new Date().toISOString(),
  };
}

/** Records that a constitutionally required authority revalidation completed after a real mutation. */
export function recordApprovedRepairRealityRevalidation(
  plan: ApprovedRepairRealityPlan,
  authorityId: string,
): ApprovedRepairRealityPlan {
  if (plan.revalidationCompleted.includes(authorityId)) {
    return plan;
  }
  const revalidationCompleted = [...plan.revalidationCompleted, authorityId];
  const repairSummary = plan.repairSummary;
  return {
    readOnly: true,
    repairEntries: plan.repairEntries,
    repairSummary,
    revalidationCompleted,
    contractId: plan.contractId,
    traceabilityEntries: buildTraceabilityEntries({
      repairSummary,
      contractId: plan.contractId,
      repairEntries: plan.repairEntries,
      revalidationCompleted,
    }),
    source: plan.source,
    schemaVersion: plan.schemaVersion,
    provenanceRuleIds: plan.provenanceRuleIds,
    owningStage: plan.owningStage,
    consumers: plan.consumers,
    immutable: true,
    promptHash: plan.promptHash,
    buildId: plan.buildId,
    generatedAt: new Date().toISOString(),
  };
}

export function repairRealityRequiresRevalidationBeforePreview(plan: ApprovedRepairRealityPlan): boolean {
  return plan.repairEntries.some((entry) => entry.requiresRevalidation);
}

export function repairRevalidationSatisfiedBeforePreview(plan: ApprovedRepairRealityPlan): boolean {
  const required = new Set<string>();
  for (const entry of plan.repairEntries) {
    for (const authority of entry.requiredAuthorities) {
      required.add(authority);
    }
  }
  if (required.size === 0) {
    return true;
  }
  return [...required].every((authority) => plan.revalidationCompleted.includes(authority));
}

export function isApprovedRepairRealityPlanValid(
  plan: ApprovedRepairRealityPlan | null | undefined,
): plan is ApprovedRepairRealityPlan {
  if (!plan) return false;
  if (plan.immutable !== true) return false;
  if (plan.source !== APPROVED_REPAIR_REALITY_PLAN_SOURCE) return false;
  if (plan.schemaVersion !== APPROVED_REPAIR_REALITY_PLAN_SCHEMA_VERSION) return false;
  if (typeof plan.contractId !== 'string' || plan.contractId.trim().length === 0) return false;
  if (typeof plan.repairSummary !== 'string' || plan.repairSummary.trim().length === 0) return false;
  if (!Array.isArray(plan.repairEntries)) return false;
  if (!Array.isArray(plan.traceabilityEntries) || plan.traceabilityEntries.length === 0) return false;
  const entryByKey = new Map(plan.traceabilityEntries.map((entry) => [entry.key, entry.value] as const));
  if (entryByKey.get('contractId') !== plan.contractId) return false;
  if (entryByKey.get('repairSummary') !== plan.repairSummary) return false;
  if (entryByKey.get('repairEntryCount') !== String(plan.repairEntries.length)) return false;
  for (const entry of plan.repairEntries) {
    if (entry.immutable !== true) return false;
    if (!repairEntryMutationFlagsMatchType(entry)) return false;
    if (entry.requiresRevalidation !== repairTypeRequiresFullConstitutionalRevalidation(entry.repairType)) {
      return false;
    }
    if (entry.repairType === 'REPORT_ONLY' && entry.workspaceMutated) return false;
    if (entry.repairType === 'EVIDENCE_ONLY' && entry.filesMutated) return false;
    if (entry.repairType === 'DIAGNOSTIC_ONLY' && entry.workspaceMutated) return false;
  }
  return true;
}

export function requireApprovedRepairRealityPlan(
  plan: ApprovedRepairRealityPlan | null | undefined,
  contextLabel: string,
): ApprovedRepairRealityPlan {
  if (!isApprovedRepairRealityPlanValid(plan)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked without a structurally valid approved repair reality plan. Fallback/independent repair classification is forbidden after CBGA approval.`,
    );
  }
  return plan;
}

export function repairEntriesFromApprovedRepairRealityPlan(
  plan: ApprovedRepairRealityPlan,
): readonly ApprovedRepairRealityEntry[] {
  return plan.repairEntries;
}
