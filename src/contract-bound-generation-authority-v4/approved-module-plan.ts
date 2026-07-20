/**
 * Contract-Bound Generation Authority V4 — Approved Module Plan handoff.
 *
 * Production Pipeline Constitution Adoption Phase 5 — Module Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * Modules (which product features exist, their display name, route, and generation order) are
 * that fact. CBGA already owns module repair (`CbgaModulePlanEntry[]` built mechanically from the
 * approved canonical product contract — see contract-module-plan.ts — and gated/repaired down to
 * `CbgaRepairedGeneratorInputs.moduleIds` — see contract-generation-gate.ts). This module does not
 * compute new modules and does not add a new authority: it packages CBGA's own already-repaired
 * module plan into a single, typed, immutable handoff object every downstream production stage
 * must consume instead of independently deriving/inferring/merging/repairing/inventing a module
 * list of its own (from prompts, routes, folder names, manifests, navigation, or any other source).
 *
 * System-shell modules (auth/dashboard/settings/persistence — see
 * `CBGA_SYSTEM_SHELL_MODULE_IDS`) are generic, cross-cutting infrastructure allowed regardless of
 * contract evidence; they are documented on `systemShellModuleIds` as a generic, application-
 * agnostic taxonomy (never per-build instance data — mirrors `infrastructureEntries` on
 * `ApprovedNavigationPlan`), never fabricated into `moduleEntries` as if they were contract-backed
 * product features.
 */

import { CBGA_SYSTEM_SHELL_MODULE_IDS } from './contract-bound-generation-types.js';
import type {
  CbgaModuleEvidenceSource,
  CbgaModulePlanEntry,
  CbgaRoutePlanEntry,
} from './contract-bound-generation-types.js';

export const APPROVED_MODULE_PLAN_SOURCE = 'CBGA_REPAIRED_MODULE_PLAN' as const;

/** PPC rules this handoff object exists to satisfy — see docs/production-pipeline-constitution-v1.md. */
export const APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS: readonly string[] = [
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
 * Every production stage this milestone collapses onto the approved module plan. Names the stages
 * that previously computed/inferred/merged a module list *independently* and now consume this
 * object instead — not exhaustive of every file that merely reads an already-approved moduleId.
 */
export const APPROVED_MODULE_PLAN_CONSUMERS: readonly string[] = [
  'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
  'UNIVERSAL_APP_BLUEPRINT_PRODUCT_SURFACE',
  'MODULAR_FEATURE_ROUTER_GENERATOR',
  'MODULAR_FEATURE_MODULE_GENERATOR',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'GENERATED_APP_MANIFEST',
  'BLUEPRINT_MANIFEST',
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'FINAL_ENGINEERING_REPORT',
  'LIVE_PREVIEW_GATE',
];

/** One CBGA-approved (post-repair) module entry. Every value is copied verbatim from CBGA's own already-computed module/route plan — nothing here is invented. */
export interface ApprovedModuleEntry {
  readonly moduleId: string;
  readonly displayName: string;
  readonly route: string;
  /** CBGA's own evidence classification for this module — never a fabricated fourth category. */
  readonly featureType: CbgaModuleEvidenceSource;
  /** No module hierarchy is computed anywhere in CBGA today — always null; reserved for future contract-derived parent/child module relationships. */
  readonly parent: string | null;
  /** Always 'PRODUCT' — system-shell/infrastructure modules are never fabricated into this plan; see `systemShellModuleIds`. */
  readonly visibility: 'PRODUCT';
  /** Always true — an entry only exists here because CBGA's final gate already approved it. */
  readonly enabled: true;
  /** Position in the approved, CBGA-ordered module list — the only ordering authority. */
  readonly order: number;
  /** The canonical product contract concept this module maps to. */
  readonly contractSource: string;
  /** Human-readable ancestry statement for audit/debugging — never used as a comparison key. */
  readonly provenance: string;
  /** Full ancestry chain string: Founder Prompt → Canonical Product Contract → CBGA module plan → CBGA repair → this entry. */
  readonly traceability: string;
}

/**
 * The single authoritative module plan for a build, produced immediately after CBGA repair.
 * Immutable (readOnly + `immutable: true` marker) — no downstream stage may derive, infer, merge,
 * repair, or invent a different one.
 */
export interface ApprovedModulePlan {
  readOnly: true;
  /** CBGA-approved, post-repair module entries, in their approved order — the only ordering authority. */
  moduleEntries: readonly ApprovedModuleEntry[];
  /** Convenience projection of `moduleEntries[].moduleId`, in the same approved order. */
  moduleIds: readonly string[];
  /** Convenience projection of `moduleEntries[].displayName`, in the same approved order. */
  displayNames: readonly string[];
  /** Convenience projection of `moduleEntries[].route`, in the same approved order. */
  routes: readonly string[];
  /**
   * The generic, application-agnostic system-shell module taxonomy (never per-build instance
   * data — CBGA never owns or invents system-shell modules; they are generic cross-cutting
   * infrastructure allowed regardless of contract evidence). Documents which module ids are
   * allowed to exist outside this plan without being treated as an unapproved product module.
   */
  systemShellModuleIds: readonly string[];
  /** Always CBGA_REPAIRED_MODULE_PLAN — there is exactly one authoritative source. */
  source: typeof APPROVED_MODULE_PLAN_SOURCE;
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

/**
 * Builds the approved module plan handoff from CBGA's own module/route plan + repaired module set.
 * Never derives anything new: `moduleEntries` is exactly the subset of `modulePlan` whose
 * `moduleId` is in CBGA's final approved module set (`approvedModuleIds`) — the identical filter
 * `repairModulePlan` (contract-generation-gate.ts) itself already applies whenever a repair runs,
 * and the identical shape `buildApprovedNavigationPlan` already uses for navigation. Each entry's
 * `route` is joined from `routePlan` by `moduleId` (routes are themselves built 1:1 from
 * `modulePlan` — see contract-route-plan.ts). System-shell modules (auth/dashboard/settings/
 * persistence) have no contract-concept entry in `modulePlan` by design — they are never
 * fabricated into `moduleEntries`; they remain documented only as the generic
 * `systemShellModuleIds` taxonomy, exactly mirroring how infrastructure navigation is kept out of
 * `ApprovedNavigationPlan.navigationItems`.
 */
export function buildApprovedModulePlan(input: {
  modulePlan: readonly CbgaModulePlanEntry[];
  routePlan: readonly CbgaRoutePlanEntry[];
  approvedModuleIds: readonly string[];
  promptHash?: string | null;
  buildId?: string | null;
}): ApprovedModulePlan {
  const approvedModuleIdSet = new Set(input.approvedModuleIds);
  const routeByModuleId = new Map(input.routePlan.map((route) => [route.moduleId, route.path] as const));

  const filteredPlan = input.modulePlan.filter((entry) => approvedModuleIdSet.has(entry.moduleId));
  const moduleEntries: ApprovedModuleEntry[] = filteredPlan.map((entry, order) => {
      // Enforce a single home route. Route-plan and repair can drift; first approved product
      // module owns `/`, every other module is `/${moduleId}` — never two `/` hosts.
      const planned = routeByModuleId.get(entry.moduleId);
      const route = order === 0 ? '/' : planned && planned !== '/' ? planned : `/${entry.moduleId}`;
      return {
        moduleId: entry.moduleId,
        displayName: entry.displayName,
        route,
        featureType: entry.evidenceSource,
        parent: null,
        visibility: 'PRODUCT' as const,
        enabled: true as const,
        order,
        contractSource: entry.sourceContractConcept,
        provenance: `Maps to contract concept "${entry.sourceContractConcept}" via ${entry.evidenceSource}.`,
        traceability: `Founder Prompt → Canonical Product Contract concept "${entry.sourceContractConcept}" → CBGA Contract Module Plan → CBGA repair (Contract-Bound Generation Authority V4) → ApprovedModulePlan.moduleEntries[${order}].`,
      };
    });

  return {
    readOnly: true,
    moduleEntries,
    moduleIds: moduleEntries.map((entry) => entry.moduleId),
    displayNames: moduleEntries.map((entry) => entry.displayName),
    routes: moduleEntries.map((entry) => entry.route),
    systemShellModuleIds: CBGA_SYSTEM_SHELL_MODULE_IDS,
    source: APPROVED_MODULE_PLAN_SOURCE,
    provenanceRuleIds: APPROVED_MODULE_PLAN_PROVENANCE_RULE_IDS,
    owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_MODULE_PLAN_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** True for a structurally valid approved module plan (an empty-but-well-formed plan is valid — some builds legitimately approve zero contract-backed modules beyond system-shell ones). */
export function isApprovedModulePlanValid(
  plan: ApprovedModulePlan | null | undefined,
): plan is ApprovedModulePlan {
  if (!plan) return false;
  if (plan.immutable !== true) return false;
  if (!Array.isArray(plan.moduleEntries)) return false;
  if (plan.moduleEntries.length !== plan.moduleIds.length) return false;
  if (plan.moduleEntries.length !== plan.displayNames.length) return false;
  if (plan.moduleEntries.length !== plan.routes.length) return false;
  return plan.moduleEntries.every(
    (entry, index) =>
      typeof entry.moduleId === 'string' &&
      entry.moduleId.trim().length > 0 &&
      typeof entry.displayName === 'string' &&
      entry.displayName.trim().length > 0 &&
      typeof entry.route === 'string' &&
      entry.enabled === true &&
      entry.visibility === 'PRODUCT' &&
      entry.order === index &&
      plan.moduleIds[index] === entry.moduleId &&
      plan.displayNames[index] === entry.displayName &&
      plan.routes[index] === entry.route,
  );
}

/**
 * PPC-1207 enforcement point: downstream production stages must fail with a constitutional
 * violation rather than silently deriving/inferring/merging fallback modules when the approved
 * module plan is missing or structurally invalid. Test-only/pre-contract call sites that
 * intentionally omit the approved plan must not call this — they keep their existing
 * draft-derivation behavior.
 */
export function requireApprovedModulePlan(
  plan: ApprovedModulePlan | null | undefined,
  contextLabel: string,
): ApprovedModulePlan {
  if (!isApprovedModulePlanValid(plan)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked downstream of Contract-Bound Generation Authority V4 without a structurally valid approved module plan. Fallback/independent module derivation (from prompts, routes, folder names, manifests, navigation, or any other source) is forbidden after CBGA repair.`,
    );
  }
  return plan;
}

/** Every module id this build is allowed to ever render as a product feature module (beyond the generic system-shell taxonomy). */
export function approvedModuleIdSet(plan: ApprovedModulePlan): ReadonlySet<string> {
  return new Set(plan.moduleIds);
}
