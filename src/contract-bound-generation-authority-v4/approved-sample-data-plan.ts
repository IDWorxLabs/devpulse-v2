/**
 * Contract-Bound Generation Authority V4 — Approved Sample Data Plan handoff.
 *
 * Production Pipeline Constitution Adoption Phase 7 — Sample Data Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": sample/demo/seed/preview/dashboard/example business data may exist
 * in exactly one authoritative form. This module does not compute any NEW business records and does
 * not add a new authority: it is a pure, deterministic COMPOSITION over the handoffs Phases 3–6
 * already produced — `ApprovedProductIdentity`, `ApprovedNavigationPlan`, `ApprovedModulePlan`,
 * `ApprovedMetadataPlan` — plus the approved canonical product contract's entity types, packaged
 * into a single, typed, immutable handoff every downstream production stage must consume instead
 * of independently inventing sample/demo/preview/seed/dashboard data of its own.
 *
 * Constitution (GEN-4, Placeholder & Template Elimination): when no approved sample records exist,
 * every collection/card/statistic/fixture is empty and generators render infrastructure empty states
 * — never invented business content.
 */

import type { ApprovedProductIdentity } from './approved-product-identity.js';
import type { ApprovedNavigationPlan } from './approved-navigation-plan.js';
import type { ApprovedModulePlan } from './approved-module-plan.js';
import type { ApprovedMetadataPlan } from './approved-metadata-plan.js';
import type { CbgaCanonicalContractEvidence } from './contract-bound-generation-types.js';

export const APPROVED_SAMPLE_DATA_PLAN_SOURCE = 'CBGA_COMPOSED_SAMPLE_DATA_PLAN' as const;

/** Schema version for this handoff's shape — bump only on a breaking field change. */
export const APPROVED_SAMPLE_DATA_PLAN_SCHEMA_VERSION = '1.0.0' as const;

/** PPC rules this handoff object exists to satisfy — see docs/production-pipeline-constitution-v1.md. */
export const APPROVED_SAMPLE_DATA_PLAN_PROVENANCE_RULE_IDS: readonly string[] = [
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
];

/**
 * Every production stage this milestone collapses onto the approved sample data plan.
 */
export const APPROVED_SAMPLE_DATA_PLAN_CONSUMERS: readonly string[] = [
  'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
  'UNIVERSAL_APP_BLUEPRINT_PRODUCT_SURFACE',
  'CODE_GENERATION_ENGINE_MODULAR_FEATURES',
  'SAFE_PAYMENT_PLACEHOLDER_POLICY',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'GENERATED_APP_MANIFEST',
  'BLUEPRINT_MANIFEST',
  'BUILD_MANIFEST',
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'FINAL_ENGINEERING_REPORT',
  'LIVE_PREVIEW_GATE',
];

export interface ApprovedSampleEntry {
  readonly id: string;
  readonly entityType: string;
  readonly kind: string;
  readonly label: string;
  readonly payload: Readonly<Record<string, string>>;
  readonly source: string;
}

export interface ApprovedSampleCollection {
  readonly entityType: string;
  readonly records: readonly ApprovedSampleEntry[];
  readonly source: string;
}

export interface ApprovedSampleCard {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly kind: 'DASHBOARD' | 'PREVIEW' | 'STATISTIC';
  readonly source: string;
}

export interface ApprovedEmptyStateModel {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly actionLabel: string | null;
  readonly surface: string;
  readonly source: string;
}

export interface ApprovedSeedDataDefinition {
  readonly entityType: string;
  readonly seedCount: number;
  readonly source: string;
}

export interface ApprovedSampleDataTraceability {
  readonly composedFrom: readonly string[];
  readonly contractId: string;
  readonly applicationTitle: string;
  readonly demoFeatureModuleIds: readonly string[];
  readonly samplesPresent: boolean;
}

/**
 * The single authoritative sample-data plan for a build, produced immediately after CBGA approval.
 * Immutable — no downstream stage may derive, infer, repair, or regenerate sample/demo/preview data.
 */
export interface ApprovedSampleDataPlan {
  readOnly: true;

  sampleEntries: readonly ApprovedSampleEntry[];
  sampleCollections: readonly ApprovedSampleCollection[];
  sampleStatistics: readonly ApprovedSampleCard[];
  previewCards: readonly ApprovedSampleCard[];
  dashboardCards: readonly ApprovedSampleCard[];
  emptyStateModels: readonly ApprovedEmptyStateModel[];
  initialEntityRecords: readonly ApprovedSampleEntry[];
  seedDataDefinitions: readonly ApprovedSeedDataDefinition[];
  approvedEntityTypes: readonly string[];
  approvedSeedCounts: Readonly<Record<string, number>>;
  approvedPreviewModels: readonly ApprovedSampleCard[];
  approvedDashboardModels: readonly ApprovedSampleCard[];
  approvedEmptyStates: readonly ApprovedEmptyStateModel[];
  approvedStatistics: readonly ApprovedSampleCard[];
  approvedFixtures: readonly ApprovedSampleEntry[];
  approvedSamplesPresent: boolean;
  approvedSamplesAllowed: boolean;

  /** Referenced verbatim from ApprovedMetadataPlan.applicationTitle — demo-data.ts title source. */
  demoAppTitle: string;
  /** Referenced verbatim from ApprovedModulePlan.moduleIds — demo-data.ts module list source. */
  demoFeatureModuleIds: readonly string[];
  /** One canonical summary string for manifests/engineering report consumers. */
  sampleSummary: string;

  source: typeof APPROVED_SAMPLE_DATA_PLAN_SOURCE;
  schemaVersion: typeof APPROVED_SAMPLE_DATA_PLAN_SCHEMA_VERSION;
  provenanceRuleIds: readonly string[];
  owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4';
  consumers: readonly string[];
  immutable: true;
  promptHash: string | null;
  buildId: string | null;
  generatedAt: string;
  traceability: ApprovedSampleDataTraceability;
}

const ARCHITECTURE_EMPTY_STATES: readonly ApprovedEmptyStateModel[] = [
  {
    id: 'dashboard-recent-activity',
    title: 'No recent activity',
    message: 'Activity from approved modules will appear here once records exist.',
    actionLabel: null,
    surface: 'DASHBOARD_RECENT_ACTIVITY',
    source: 'ARCHITECTURE_EMPTY_STATE',
  },
  {
    id: 'notifications-inbox',
    title: 'Inbox clear',
    message: 'Alerts, updates, messages, and system events appear here.',
    actionLabel: 'Refresh',
    surface: 'NOTIFICATIONS',
    source: 'ARCHITECTURE_EMPTY_STATE',
  },
  {
    id: 'cart-items',
    title: 'Cart empty',
    message: 'Approved catalog items will appear here when sample records are present.',
    actionLabel: null,
    surface: 'CART',
    source: 'ARCHITECTURE_EMPTY_STATE',
  },
  {
    id: 'profile-records',
    title: 'No profile data',
    message: 'Account details will appear here when approved sample records exist.',
    actionLabel: null,
    surface: 'PROFILE',
    source: 'ARCHITECTURE_EMPTY_STATE',
  },
];

function uniqueEntityTypes(moduleIds: readonly string[], coreEntities: readonly string[]): string[] {
  return [...new Set([...moduleIds, ...coreEntities].map((value) => value.trim()).filter(Boolean))].sort();
}

/** Projects dashboard recent-activity strings from the plan — never a second derivation site. */
export function dashboardActivityItemsFromApprovedSampleDataPlan(
  plan: ApprovedSampleDataPlan,
): readonly string[] {
  return plan.dashboardCards.map((card) => (card.body.trim().length > 0 ? card.body : card.title));
}

/** Projects notification preview seed records from the plan — never a second derivation site. */
export function notificationSeedFromApprovedSampleDataPlan(plan: ApprovedSampleDataPlan): readonly {
  id: string;
  kind: 'alert' | 'update' | 'message' | 'system';
  text: string;
  read: boolean;
  archived: boolean;
}[] {
  return plan.previewCards.map((card) => ({
    id: card.id,
    kind: 'update' as const,
    text: card.body.trim().length > 0 ? card.body : card.title,
    read: false,
    archived: false,
  }));
}

/** Returns the architecture empty-state model for a surface — never invents business records. */
export function emptyStateForSurface(
  plan: ApprovedSampleDataPlan,
  surface: string,
): ApprovedEmptyStateModel | null {
  return plan.emptyStateModels.find((model) => model.surface === surface) ?? null;
}

/** Projects cart line items from the plan's cart collection — empty when no approved samples. */
export function cartItemsFromApprovedSampleDataPlan(
  plan: ApprovedSampleDataPlan,
): readonly { id: string; label: string; price: string }[] {
  const cartCollection = plan.sampleCollections.find((collection) => collection.entityType === 'cart');
  if (!cartCollection) return [];
  return cartCollection.records.map((record) => ({
    id: record.id,
    label: record.label,
    price: record.payload.price ?? '',
  }));
}

/**
 * Builds the approved sample data plan by composing the four already-approved CBGA handoffs plus
 * the canonical contract evidence. Never derives invented business records: default collections are
 * empty and `approvedSamplesPresent` is false unless real approved records were supplied upstream.
 */
export function buildApprovedSampleDataPlan(input: {
  identity: ApprovedProductIdentity;
  navigationPlan: ApprovedNavigationPlan;
  modulePlan: ApprovedModulePlan;
  metadataPlan: ApprovedMetadataPlan;
  contract: CbgaCanonicalContractEvidence;
  promptHash?: string | null;
  buildId?: string | null;
}): ApprovedSampleDataPlan {
  const demoAppTitle = input.metadataPlan.applicationTitle;
  const demoFeatureModuleIds = input.modulePlan.moduleIds;
  const approvedEntityTypes = uniqueEntityTypes(demoFeatureModuleIds, input.contract.coreEntities);

  const sampleCollections: ApprovedSampleCollection[] = approvedEntityTypes.map((entityType) => ({
    entityType,
    records: [],
    source: 'ApprovedModulePlan.moduleIds + CbgaCanonicalContractEvidence.coreEntities (empty — no invented records)',
  }));

  const approvedSeedCounts: Record<string, number> = Object.fromEntries(
    approvedEntityTypes.map((entityType) => [entityType, 0] as const),
  );

  const seedDataDefinitions: ApprovedSeedDataDefinition[] = approvedEntityTypes.map((entityType) => ({
    entityType,
    seedCount: 0,
    source: 'ApprovedSampleDataPlan.approvedSeedCounts',
  }));

  const sampleEntries: ApprovedSampleEntry[] = [];
  const initialEntityRecords: ApprovedSampleEntry[] = [];
  const approvedFixtures: ApprovedSampleEntry[] = [];
  const dashboardCards: ApprovedSampleCard[] = [];
  const previewCards: ApprovedSampleCard[] = [];
  const sampleStatistics: ApprovedSampleCard[] = [];
  const approvedSamplesPresent = false;
  const approvedSamplesAllowed = false;

  const sampleSummary = approvedSamplesPresent
    ? `${sampleEntries.length} approved sample record(s) across ${approvedEntityTypes.length} entity type(s).`
    : 'No approved sample records — infrastructure empty states only.';

  const traceability: ApprovedSampleDataTraceability = {
    composedFrom: [
      'ApprovedProductIdentity',
      'ApprovedNavigationPlan',
      'ApprovedModulePlan',
      'ApprovedMetadataPlan',
      'CbgaCanonicalContractEvidence',
    ],
    contractId: input.contract.contractId,
    applicationTitle: demoAppTitle,
    demoFeatureModuleIds: [...demoFeatureModuleIds],
    samplesPresent: approvedSamplesPresent,
  };

  return {
    readOnly: true,
    sampleEntries,
    sampleCollections,
    sampleStatistics,
    previewCards,
    dashboardCards,
    emptyStateModels: ARCHITECTURE_EMPTY_STATES,
    initialEntityRecords,
    seedDataDefinitions,
    approvedEntityTypes,
    approvedSeedCounts,
    approvedPreviewModels: previewCards,
    approvedDashboardModels: dashboardCards,
    approvedEmptyStates: ARCHITECTURE_EMPTY_STATES,
    approvedStatistics: sampleStatistics,
    approvedFixtures,
    approvedSamplesPresent,
    approvedSamplesAllowed,
    demoAppTitle,
    demoFeatureModuleIds,
    sampleSummary,
    source: APPROVED_SAMPLE_DATA_PLAN_SOURCE,
    schemaVersion: APPROVED_SAMPLE_DATA_PLAN_SCHEMA_VERSION,
    provenanceRuleIds: APPROVED_SAMPLE_DATA_PLAN_PROVENANCE_RULE_IDS,
    owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_SAMPLE_DATA_PLAN_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
    traceability,
  };
}

/** True for a structurally valid approved sample data plan. */
export function isApprovedSampleDataPlanValid(
  plan: ApprovedSampleDataPlan | null | undefined,
): plan is ApprovedSampleDataPlan {
  if (!plan) return false;
  if (plan.immutable !== true) return false;
  if (typeof plan.demoAppTitle !== 'string' || plan.demoAppTitle.trim().length === 0) return false;
  if (!Array.isArray(plan.demoFeatureModuleIds)) return false;
  if (!Array.isArray(plan.approvedEntityTypes)) return false;
  if (!Array.isArray(plan.sampleCollections)) return false;
  if (plan.sampleCollections.length !== plan.approvedEntityTypes.length) return false;
  if (typeof plan.sampleSummary !== 'string' || plan.sampleSummary.trim().length === 0) return false;
  if (plan.approvedSamplesPresent !== hasApprovedSampleRecords(plan)) return false;
  if (plan.approvedSamplesAllowed !== plan.approvedSamplesPresent) return false;
  if (plan.traceability.applicationTitle !== plan.demoAppTitle) return false;
  if (plan.traceability.samplesPresent !== plan.approvedSamplesPresent) return false;
  for (const entityType of plan.approvedEntityTypes) {
    if (plan.approvedSeedCounts[entityType] !== countRecordsForEntityType(plan, entityType)) return false;
  }
  if (plan.dashboardCards !== plan.approvedDashboardModels) return false;
  if (plan.previewCards !== plan.approvedPreviewModels) return false;
  if (plan.sampleStatistics !== plan.approvedStatistics) return false;
  if (plan.emptyStateModels !== plan.approvedEmptyStates) return false;
  if (plan.approvedFixtures !== plan.sampleEntries && plan.sampleEntries.length > 0) return false;
  return true;
}

function hasApprovedSampleRecords(plan: ApprovedSampleDataPlan): boolean {
  return (
    plan.sampleEntries.length > 0 ||
    plan.initialEntityRecords.length > 0 ||
    plan.dashboardCards.length > 0 ||
    plan.previewCards.length > 0 ||
    plan.sampleStatistics.length > 0 ||
    plan.approvedFixtures.length > 0 ||
    plan.sampleCollections.some((collection) => collection.records.length > 0)
  );
}

function countRecordsForEntityType(plan: ApprovedSampleDataPlan, entityType: string): number {
  const collection = plan.sampleCollections.find((entry) => entry.entityType === entityType);
  return collection?.records.length ?? 0;
}

/**
 * PPC-1207 enforcement point: downstream production stages must fail with a constitutional
 * violation rather than silently deriving/inventing fallback sample/demo/preview data when the
 * approved sample data plan is missing or structurally invalid.
 */
export function requireApprovedSampleDataPlan(
  plan: ApprovedSampleDataPlan | null | undefined,
  contextLabel: string,
): ApprovedSampleDataPlan {
  if (!isApprovedSampleDataPlanValid(plan)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked downstream of Contract-Bound Generation Authority V4 without a structurally valid approved sample data plan. Fallback/independent sample/demo/preview/seed generation is forbidden after CBGA approval.`,
    );
  }
  return plan;
}
