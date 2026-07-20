/**
 * Contract-Bound Generation Authority V4 — Approved Metadata Plan handoff.
 *
 * Production Pipeline Constitution Adoption Phase 6 — Metadata Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * Application/build/manifest/workspace/preview/feature-contract/engineering-report metadata (the
 * title, subtitle, description, and module/navigation/route counts + summaries every downstream
 * stage renders/records) is that fact. This module does not compute any NEW fact and does not add a
 * new authority: it is a pure, deterministic COMPOSITION over the three handoffs Phases 3–5 already
 * produced — `ApprovedProductIdentity`, `ApprovedNavigationPlan`, `ApprovedModulePlan` — plus the
 * approved canonical product contract's own summary counts, packaged into a single, typed, immutable
 * handoff object every downstream production stage must consume instead of independently
 * parsing/inferring/counting/summarizing metadata of its own.
 *
 * Every field below is either (a) copied verbatim from one of those three approved objects (never
 * duplicated computation — "referenced, not owned"), or (b) a single canonical formula applied to
 * those referenced values (e.g. `applicationSubtitle` = the existing, single
 * `deriveNeutralAppTagline` formula applied to the approved identity's `displayName`; the summary
 * strings = one deterministic join over the approved module/navigation counts). No field here
 * re-implements or overrides the Blueprint Generator's own contract-derived landing/home copy
 * (`deriveBlueprintContractCopy` — Blueprint Generator Contract-Bound Replacement V1), which remains
 * the sole owner of that specific customDomainCopy-aware rendered copy; this plan exists for every
 * OTHER downstream consumer (manifests, feature contracts, engineering report, GPCA evidence,
 * runtime shell) that previously computed its own ad hoc title/tagline/count/summary independently.
 */

import type { ApprovedProductIdentity } from './approved-product-identity.js';
import type { ApprovedNavigationPlan } from './approved-navigation-plan.js';
import type { ApprovedModulePlan } from './approved-module-plan.js';
import type { CbgaCanonicalContractEvidence } from './contract-bound-generation-types.js';

export const APPROVED_METADATA_PLAN_SOURCE = 'CBGA_COMPOSED_METADATA_PLAN' as const;

/** Schema version for this handoff's shape — bump only on a breaking field change. */
export const APPROVED_METADATA_PLAN_SCHEMA_VERSION = '1.0.0' as const;

/** PPC rules this handoff object exists to satisfy — see docs/production-pipeline-constitution-v1.md. */
export const APPROVED_METADATA_PLAN_PROVENANCE_RULE_IDS: readonly string[] = [
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
];

/**
 * Every production stage this milestone collapses onto the approved metadata plan. Names the stages
 * that previously computed/inferred/counted/summarized metadata *independently* and now consume
 * this object instead — not exhaustive of every file that merely reads an already-approved title.
 */
export const APPROVED_METADATA_PLAN_CONSUMERS: readonly string[] = [
  'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
  'CODE_GENERATION_ENGINE_RUNTIME_SHELL',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'GENERATED_APP_MANIFEST',
  'BLUEPRINT_MANIFEST',
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'FINAL_ENGINEERING_REPORT',
  'LIVE_PREVIEW_GATE',
];

/**
 * One named metadata fact, kept alongside the strongly-typed fields below purely as a generic,
 * self-describing projection for consumers that walk an arbitrary metadata list (GPCA evidence,
 * diagnostics) instead of reading named fields. Every `key` here maps 1:1 to a named field on
 * `ApprovedMetadataPlan` — this is never a second, independent value, only a re-shaping of the same
 * one.
 */
export interface ApprovedMetadataEntry {
  readonly key: string;
  readonly value: string;
  readonly category: 'IDENTITY' | 'MODULE' | 'NAVIGATION' | 'ROUTE' | 'CONTRACT' | 'SUMMARY';
  /** Which approved object (or canonical formula over it) this value was referenced/composed from. */
  readonly source: string;
}

/**
 * The single authoritative metadata plan for a build, produced immediately after CBGA approval by
 * composing `ApprovedProductIdentity` + `ApprovedNavigationPlan` + `ApprovedModulePlan` + the
 * canonical product contract. Immutable (readOnly + `immutable: true` marker) — no downstream stage
 * may derive, infer, count, or summarize a different one.
 */
export interface ApprovedMetadataPlan {
  readOnly: true;

  // ---- Identity metadata (referenced verbatim from ApprovedProductIdentity) ----
  /** = identity.displayName. The only application title any downstream stage may render/record. */
  applicationTitle: string;
  /** = identity.productIdentity. The canonical business identity/concept, unchanged by CBGA. */
  productIdentity: string;
  /** Composed once via the existing, single `deriveNeutralAppTagline(applicationTitle)` formula. */
  applicationSubtitle: string;
  /**
   * A generic, cross-consumer description composed only from the approved title + primary approved
   * module — never the Blueprint Generator's own customDomainCopy-aware landing/home copy (that
   * remains exclusively owned by `deriveBlueprintContractCopy`; this field never overrides it).
   */
  productDescription: string;

  // ---- Module metadata (referenced verbatim from ApprovedModulePlan) ----
  approvedModuleIds: readonly string[];
  approvedModuleDisplayNames: readonly string[];
  approvedModuleCount: number;
  primaryModuleId: string | null;
  primaryModuleDisplayName: string | null;

  // ---- Route metadata (referenced verbatim from ApprovedModulePlan.routes) ----
  approvedRoutes: readonly string[];
  approvedRouteCount: number;

  // ---- Navigation metadata (referenced verbatim from ApprovedNavigationPlan) ----
  approvedNavigationLabels: readonly string[];
  approvedNavigationCount: number;

  // ---- Contract metadata (referenced verbatim from the canonical product contract evidence) ----
  contractId: string;
  businessConceptCount: number;
  primaryWorkflowCount: number;
  majorFeatureGroupCount: number;

  // ---- Composed summary strings — one canonical formula each, consumed everywhere a downstream
  // stage previously built its own ad hoc human-readable summary. ----
  /** e.g. "3 approved feature module(s): Reservations, Orders, Staff Directory". */
  featureSummary: string;
  /** e.g. "2 approved navigation item(s): Reservations, Orders". */
  navigationSummary: string;
  /** Single-line summary for `.generated-app-manifest.json` / `blueprint-manifest.json` consumers. */
  manifestSummary: string;
  /** Single-line summary for workspace-generation consumers (file/folder inventories, audits). */
  workspaceSummary: string;
  /** Single-line summary for live-preview / preview-gate consumers. */
  previewSummary: string;
  /** Single-line summary for the final engineering report / build result consumers. */
  engineeringSummary: string;
  /** Single-line summary for GPCA evidence / contract-traceability consumers. */
  contractSummary: string;

  /** Generic key/value projection of every named field above — see `ApprovedMetadataEntry`. */
  entries: readonly ApprovedMetadataEntry[];

  /** Always CBGA_COMPOSED_METADATA_PLAN — there is exactly one authoritative source. */
  source: typeof APPROVED_METADATA_PLAN_SOURCE;
  /** Schema version for this handoff's shape. */
  schemaVersion: typeof APPROVED_METADATA_PLAN_SCHEMA_VERSION;
  /** Constitutional rule IDs this object's existence/consumption satisfies. */
  provenanceRuleIds: readonly string[];
  /** The authority that produced and owns this plan. */
  owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4';
  /** Declared downstream consumers — documentation of intended collapse scope, not an access-control list. */
  consumers: readonly string[];
  /** Always true — this object must never be mutated once produced. */
  immutable: true;
  promptHash: string | null;
  buildId: string | null;
  generatedAt: string;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Builds the approved metadata plan by composing the three already-approved CBGA handoffs plus the
 * canonical contract evidence. Never derives anything new: every named field is either copied
 * verbatim from one of those inputs or produced by exactly one deterministic formula over them.
 */
export function buildApprovedMetadataPlan(input: {
  identity: ApprovedProductIdentity;
  navigationPlan: ApprovedNavigationPlan;
  modulePlan: ApprovedModulePlan;
  contract: CbgaCanonicalContractEvidence;
  /** Single existing canonical tagline formula — injected so this module never imports across the materialization layer. */
  deriveApplicationSubtitle: (applicationTitle: string) => string;
  promptHash?: string | null;
  buildId?: string | null;
}): ApprovedMetadataPlan {
  const applicationTitle = input.identity.displayName;
  const productIdentity = input.identity.productIdentity;
  const applicationSubtitle = input.deriveApplicationSubtitle(applicationTitle);

  const approvedModuleIds = input.modulePlan.moduleIds;
  const approvedModuleDisplayNames = input.modulePlan.displayNames;
  const approvedModuleCount = approvedModuleIds.length;
  const primaryModuleId = approvedModuleIds[0] ?? null;
  const primaryModuleDisplayName = approvedModuleDisplayNames[0] ?? null;

  const approvedRoutes = input.modulePlan.routes;
  const approvedRouteCount = approvedRoutes.length;

  const approvedNavigationLabels = input.navigationPlan.productEntries;
  const approvedNavigationCount = approvedNavigationLabels.length;

  const contractId = input.contract.contractId;
  const businessConceptCount = input.contract.businessConcepts.length;
  const primaryWorkflowCount = input.contract.primaryWorkflows.length;
  const majorFeatureGroupCount = input.contract.majorFeatureGroups.length;

  const productDescription = primaryModuleDisplayName
    ? `${applicationTitle} is a ${pluralize(approvedModuleCount, 'module')} workspace centered on ${primaryModuleDisplayName}.`
    : `${applicationTitle}.`;

  const featureSummary =
    approvedModuleCount > 0
      ? `${pluralize(approvedModuleCount, 'approved feature module')}: ${approvedModuleDisplayNames.join(', ')}`
      : 'No approved feature modules.';
  const navigationSummary =
    approvedNavigationCount > 0
      ? `${pluralize(approvedNavigationCount, 'approved navigation item')}: ${approvedNavigationLabels.join(', ')}`
      : 'No approved navigation items.';
  const manifestSummary = `${applicationTitle} — ${featureSummary}; ${navigationSummary}.`;
  const workspaceSummary = `${applicationTitle} workspace: ${pluralize(approvedModuleCount, 'feature module')}, ${pluralize(approvedRouteCount, 'route')}.`;
  const previewSummary = `${applicationTitle} preview: ${featureSummary}.`;
  const engineeringSummary = `${applicationTitle} build: ${pluralize(approvedModuleCount, 'approved module')}, ${pluralize(approvedNavigationCount, 'approved navigation item')}, ${pluralize(approvedRouteCount, 'approved route')}.`;
  const contractSummary = `Contract "${contractId}": ${pluralize(businessConceptCount, 'business concept')}, ${pluralize(primaryWorkflowCount, 'primary workflow')}, ${pluralize(majorFeatureGroupCount, 'major feature group')}.`;

  const entries: ApprovedMetadataEntry[] = [
    { key: 'applicationTitle', value: applicationTitle, category: 'IDENTITY', source: 'ApprovedProductIdentity.displayName' },
    { key: 'productIdentity', value: productIdentity, category: 'IDENTITY', source: 'ApprovedProductIdentity.productIdentity' },
    { key: 'applicationSubtitle', value: applicationSubtitle, category: 'IDENTITY', source: 'deriveNeutralAppTagline(ApprovedProductIdentity.displayName)' },
    { key: 'productDescription', value: productDescription, category: 'IDENTITY', source: 'applicationTitle + ApprovedModulePlan primary module' },
    { key: 'approvedModuleCount', value: String(approvedModuleCount), category: 'MODULE', source: 'ApprovedModulePlan.moduleIds.length' },
    { key: 'primaryModuleId', value: primaryModuleId ?? '', category: 'MODULE', source: 'ApprovedModulePlan.moduleIds[0]' },
    { key: 'approvedRouteCount', value: String(approvedRouteCount), category: 'ROUTE', source: 'ApprovedModulePlan.routes.length' },
    { key: 'approvedNavigationCount', value: String(approvedNavigationCount), category: 'NAVIGATION', source: 'ApprovedNavigationPlan.productEntries.length' },
    { key: 'contractId', value: contractId, category: 'CONTRACT', source: 'CbgaCanonicalContractEvidence.contractId' },
    { key: 'businessConceptCount', value: String(businessConceptCount), category: 'CONTRACT', source: 'CbgaCanonicalContractEvidence.businessConcepts.length' },
    { key: 'featureSummary', value: featureSummary, category: 'SUMMARY', source: 'ApprovedModulePlan composition' },
    { key: 'navigationSummary', value: navigationSummary, category: 'SUMMARY', source: 'ApprovedNavigationPlan composition' },
    { key: 'manifestSummary', value: manifestSummary, category: 'SUMMARY', source: 'featureSummary + navigationSummary' },
    { key: 'workspaceSummary', value: workspaceSummary, category: 'SUMMARY', source: 'approvedModuleCount + approvedRouteCount' },
    { key: 'previewSummary', value: previewSummary, category: 'SUMMARY', source: 'featureSummary' },
    { key: 'engineeringSummary', value: engineeringSummary, category: 'SUMMARY', source: 'approvedModuleCount + approvedNavigationCount + approvedRouteCount' },
    { key: 'contractSummary', value: contractSummary, category: 'SUMMARY', source: 'CbgaCanonicalContractEvidence composition' },
  ];

  return {
    readOnly: true,
    applicationTitle,
    productIdentity,
    applicationSubtitle,
    productDescription,
    approvedModuleIds,
    approvedModuleDisplayNames,
    approvedModuleCount,
    primaryModuleId,
    primaryModuleDisplayName,
    approvedRoutes,
    approvedRouteCount,
    approvedNavigationLabels,
    approvedNavigationCount,
    contractId,
    businessConceptCount,
    primaryWorkflowCount,
    majorFeatureGroupCount,
    featureSummary,
    navigationSummary,
    manifestSummary,
    workspaceSummary,
    previewSummary,
    engineeringSummary,
    contractSummary,
    entries,
    source: APPROVED_METADATA_PLAN_SOURCE,
    schemaVersion: APPROVED_METADATA_PLAN_SCHEMA_VERSION,
    provenanceRuleIds: APPROVED_METADATA_PLAN_PROVENANCE_RULE_IDS,
    owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_METADATA_PLAN_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** True for a structurally valid approved metadata plan. */
export function isApprovedMetadataPlanValid(
  plan: ApprovedMetadataPlan | null | undefined,
): plan is ApprovedMetadataPlan {
  if (!plan) return false;
  if (plan.immutable !== true) return false;
  if (typeof plan.applicationTitle !== 'string' || plan.applicationTitle.trim().length === 0) return false;
  if (typeof plan.productIdentity !== 'string' || plan.productIdentity.trim().length === 0) return false;
  if (!Array.isArray(plan.approvedModuleIds)) return false;
  if (!Array.isArray(plan.approvedModuleDisplayNames)) return false;
  if (plan.approvedModuleIds.length !== plan.approvedModuleDisplayNames.length) return false;
  if (plan.approvedModuleCount !== plan.approvedModuleIds.length) return false;
  if (!Array.isArray(plan.approvedRoutes) || plan.approvedRouteCount !== plan.approvedRoutes.length) return false;
  if (!Array.isArray(plan.approvedNavigationLabels) || plan.approvedNavigationCount !== plan.approvedNavigationLabels.length) return false;
  if (plan.primaryModuleId !== null && plan.primaryModuleId !== plan.approvedModuleIds[0]) return false;
  if (plan.primaryModuleDisplayName !== null && plan.primaryModuleDisplayName !== plan.approvedModuleDisplayNames[0]) return false;
  if (!Array.isArray(plan.entries)) return false;
  const entryByKey = new Map(plan.entries.map((entry) => [entry.key, entry.value] as const));
  if (entryByKey.get('applicationTitle') !== plan.applicationTitle) return false;
  if (entryByKey.get('productIdentity') !== plan.productIdentity) return false;
  if (entryByKey.get('applicationSubtitle') !== plan.applicationSubtitle) return false;
  if (entryByKey.get('approvedModuleCount') !== String(plan.approvedModuleCount)) return false;
  if (entryByKey.get('approvedNavigationCount') !== String(plan.approvedNavigationCount)) return false;
  if (entryByKey.get('approvedRouteCount') !== String(plan.approvedRouteCount)) return false;
  if (entryByKey.get('manifestSummary') !== plan.manifestSummary) return false;
  return true;
}

/**
 * PPC-1207 enforcement point: downstream production stages must fail with a constitutional
 * violation rather than silently deriving/inferring/counting/summarizing fallback metadata when the
 * approved metadata plan is missing or structurally invalid. Test-only/pre-contract call sites that
 * intentionally omit the approved plan must not call this — they keep their existing
 * draft-derivation behavior.
 */
export function requireApprovedMetadataPlan(
  plan: ApprovedMetadataPlan | null | undefined,
  contextLabel: string,
): ApprovedMetadataPlan {
  if (!isApprovedMetadataPlanValid(plan)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked downstream of Contract-Bound Generation Authority V4 without a structurally valid approved metadata plan. Fallback/independent metadata derivation (parsing, inference, counting, summarizing) is forbidden after CBGA approval.`,
    );
  }
  return plan;
}
