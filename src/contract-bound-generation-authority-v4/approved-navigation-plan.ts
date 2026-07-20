/**
 * Contract-Bound Generation Authority V4 — Approved Navigation Plan handoff.
 *
 * Production Pipeline Constitution Adoption Phase 4 — Navigation Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * Navigation (the labels/routes/hierarchy every downstream stage renders/records) is that fact.
 * CBGA already owns navigation repair (`CbgaGenerationReport.navigationPlan`, repaired down to
 * `CbgaRepairedGeneratorInputs.navigationLabels`/`routes` — see contract-navigation-plan.ts and
 * contract-generation-gate.ts). This module does not compute new navigation and does not add a new
 * authority: it packages CBGA's own already-repaired navigation plan into a single, typed,
 * immutable handoff object every downstream production stage must consume instead of independently
 * deriving/inferring/merging/repairing/inventing navigation of its own.
 *
 * Infrastructure navigation (root/frame/layout/loading/back/next — see
 * infrastructure-product-boundary-authority-v1/infrastructure-navigation-model.ts) remains owned by
 * the Blueprint Infrastructure Layer, never CBGA, and is never included in `navigationItems`/
 * `productEntries` below — `infrastructureEntries` only documents the generic, application-agnostic
 * taxonomy of structural kinds that are allowed to exist outside this plan, it never contains
 * per-build instance data (CBGA never invents an infrastructure entry).
 */

import { INFRASTRUCTURE_NAVIGATION_KINDS } from '../infrastructure-product-boundary-authority-v1/infrastructure-navigation-model.js';
import type { CbgaNavigationPlanItem } from './contract-bound-generation-types.js';

export const APPROVED_NAVIGATION_PLAN_SOURCE = 'CBGA_REPAIRED_NAVIGATION_PLAN' as const;

/** PPC rules this handoff object exists to satisfy — see docs/production-pipeline-constitution-v1.md. */
export const APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS: readonly string[] = [
  'PPC-101',
  'PPC-201',
  'PPC-202',
  'PPC-401',
  'PPC-402',
  'PPC-1207',
  'PPC-1603',
  'PPC-1702',
  'PPC-1703',
  'PPC-1704',
];

/**
 * Every production stage this milestone collapses onto the approved navigation plan. Names the
 * stages that previously computed/inferred/merged navigation *independently* and now consume this
 * object instead — not exhaustive of every file that merely reads an already-approved label.
 */
export const APPROVED_NAVIGATION_PLAN_CONSUMERS: readonly string[] = [
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

/** One CBGA-approved (post-repair) navigation entry — a strict subset of `CbgaNavigationPlanItem`. */
export interface ApprovedNavigationItem {
  readonly label: string;
  readonly path: string;
  readonly moduleId: string;
  readonly sourceContractConcept: string;
  /** Position in the approved, CBGA-ordered navigation list — the only ordering/hierarchy authority. */
  readonly order: number;
}

/**
 * The single authoritative navigation plan for a build, produced immediately after CBGA repair.
 * Immutable (readOnly + `immutable: true` marker) — no downstream stage may derive, infer, merge,
 * repair, or invent a different one.
 */
export interface ApprovedNavigationPlan {
  readOnly: true;
  /** CBGA-approved, post-repair navigation entries, in their approved order — the hierarchy/ordering authority. */
  navigationItems: readonly ApprovedNavigationItem[];
  /** Convenience projection of `navigationItems[].label`, in the same approved order. */
  productEntries: readonly string[];
  /** Convenience projection of `navigationItems[].path`, in the same approved order. */
  routes: readonly string[];
  /**
   * The generic, application-agnostic infrastructure-navigation taxonomy (never per-build instance
   * data — CBGA never owns or invents infrastructure navigation; the Infrastructure Product
   * Boundary Authority does). Documents which structural kinds are allowed to exist outside this
   * plan without being treated as an unapproved product navigation item.
   */
  infrastructureEntries: readonly string[];
  /** Always CBGA_REPAIRED_NAVIGATION_PLAN — there is exactly one authoritative source. */
  source: typeof APPROVED_NAVIGATION_PLAN_SOURCE;
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
 * Builds the approved navigation plan handoff from CBGA's own navigation plan + repaired module
 * set. Never derives anything new: `navigationItems` is exactly the subset of `navigationPlan`
 * whose `moduleId` is in CBGA's final approved module set (`approvedModuleIds`) — the identical
 * filter `repairNavigationPlan` (contract-generation-gate.ts) itself already applies whenever a
 * repair runs. Filtering by `approvedModuleIds` (rather than `repairedInputs.navigationLabels`)
 * matters: the production adapter always proposes an empty navigation label list upfront (nothing
 * to evaluate), so whenever the gate is already `GENERATION_ALLOWED` (no module/route/title repair
 * needed), `repairedInputs.navigationLabels` is the untouched identity-patch of that empty proposal
 * — never the real contract-derived navigation. Deriving from the approved module set instead means
 * this plan is always populated correctly, independent of which repair branch ran — a strict filter,
 * never an invention, merge, or independent computation.
 */
export function buildApprovedNavigationPlan(input: {
  navigationPlan: readonly CbgaNavigationPlanItem[];
  approvedModuleIds: readonly string[];
  promptHash?: string | null;
  buildId?: string | null;
}): ApprovedNavigationPlan {
  const approvedModuleIdSet = new Set(input.approvedModuleIds);
  const navigationItems: ApprovedNavigationItem[] = input.navigationPlan
    .filter((item) => approvedModuleIdSet.has(item.moduleId))
    .map((item, order) => ({
      label: item.label,
      path: item.path,
      moduleId: item.moduleId,
      sourceContractConcept: item.sourceContractConcept,
      order,
    }));

  return {
    readOnly: true,
    navigationItems,
    productEntries: navigationItems.map((item) => item.label),
    routes: navigationItems.map((item) => item.path),
    infrastructureEntries: INFRASTRUCTURE_NAVIGATION_KINDS,
    source: APPROVED_NAVIGATION_PLAN_SOURCE,
    provenanceRuleIds: APPROVED_NAVIGATION_PLAN_PROVENANCE_RULE_IDS,
    owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_NAVIGATION_PLAN_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** True for a structurally valid approved navigation plan (an empty-but-well-formed plan is valid — some builds legitimately approve zero extra navigation items). */
export function isApprovedNavigationPlanValid(
  plan: ApprovedNavigationPlan | null | undefined,
): plan is ApprovedNavigationPlan {
  if (!plan) return false;
  if (plan.immutable !== true) return false;
  if (!Array.isArray(plan.navigationItems)) return false;
  if (plan.navigationItems.length !== plan.productEntries.length) return false;
  if (plan.navigationItems.length !== plan.routes.length) return false;
  return plan.navigationItems.every(
    (item, index) =>
      typeof item.label === 'string' &&
      item.label.trim().length > 0 &&
      typeof item.path === 'string' &&
      item.order === index &&
      plan.productEntries[index] === item.label &&
      plan.routes[index] === item.path,
  );
}

/**
 * PPC-1207 enforcement point: downstream production stages must fail with a constitutional
 * violation rather than silently deriving/inferring/merging fallback navigation when the approved
 * navigation plan is missing or structurally invalid. Test-only/pre-contract call sites that
 * intentionally omit the approved plan must not call this — they keep their existing
 * draft-derivation behavior.
 */
export function requireApprovedNavigationPlan(
  plan: ApprovedNavigationPlan | null | undefined,
  contextLabel: string,
): ApprovedNavigationPlan {
  if (!isApprovedNavigationPlanValid(plan)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked downstream of Contract-Bound Generation Authority V4 without a structurally valid approved navigation plan. Fallback/independent navigation derivation (inference, merge, repair, invention) is forbidden after CBGA repair.`,
    );
  }
  return plan;
}

/**
 * Every navigation item this build is allowed to ever render as product navigation. Any generator
 * that renders a navigation label outside this set (and outside the generic infrastructure-
 * navigation taxonomy) is, by definition, generating unapproved navigation.
 */
export function approvedNavigationLabelSet(plan: ApprovedNavigationPlan): ReadonlySet<string> {
  return new Set(plan.productEntries.map((label) => label.trim().toLowerCase()));
}
