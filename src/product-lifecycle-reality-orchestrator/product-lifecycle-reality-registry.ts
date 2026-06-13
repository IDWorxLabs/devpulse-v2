/**
 * Product Lifecycle Reality Orchestrator — constants and registry.
 */

import type { ProductLifecycleRealityState } from './product-lifecycle-reality-types.js';

export const PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN =
  'PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS';
export const PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_OWNER_MODULE =
  'devpulse_product_lifecycle_reality_orchestrator';
export const PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PHASE =
  'Phase 26.19 — Product Lifecycle Reality Orchestrator';
export const PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT_TITLE =
  'PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT';
export const PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_CACHE_KEY_PREFIX =
  'product-lifecycle-reality-orchestrator-v1';
export const MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY = 16;

export const PRODUCT_LIFECYCLE_REALITY_CORE_QUESTION =
  'Where is this product in its real lifecycle, and what is the next evidence-backed action?';

export const UPSTREAM_AUTHORITIES = [
  'live-idea-to-launch-execution-runner',
  'founder-launch-decision-authority',
  'post-launch-reality-authority',
  'adoption-reality-authority',
  'revenue-reality-authority',
  'product-evolution-reality-authority',
  'connected-runtime-activation-proof',
  'connected-launch-readiness-proof',
  'connected-preview-experience-proof',
  'founder-test-reality-sweep',
  'launch-council',
  'project-vault',
  'requirements-to-plan-execution-contract',
] as const;

export const ORCHESTRATION_FLOW = [
  'Collect lifecycle signals from Phase 26 proof chain authorities',
  'Classify highest evidence-backed lifecycle stage',
  'Analyze lifecycle gaps, risks, and blockers',
  'Determine next evidence-backed required action',
  'Generate unified lifecycle reality verdict and report',
] as const;

export const SAFETY_GUARANTEES = [
  'Advisory only — observes lifecycle reality; does not advance lifecycle state',
  'No code generation, deployment, runtime execution, or project mutation',
  'Planning, build, runtime, launch, adoption, revenue, and evolution require separate proof',
  'Roadmaps and claims alone do not constitute lifecycle progress',
  'Absence of evidence remains absence of evidence',
] as const;

export const LIFECYCLE_STATE_ORDER: readonly ProductLifecycleRealityState[] = [
  'IDEA_ONLY',
  'PLANNED',
  'BUILT',
  'VALIDATED',
  'RUNTIME_READY',
  'LAUNCH_READY',
  'LAUNCHED',
  'ADOPTED',
  'REVENUE_GENERATING',
  'EVOLVING_PRODUCT',
  'SCALING_PRODUCT',
] as const;

export const SCALING_PRODUCT_THRESHOLD = 88;
export const EVOLVING_PRODUCT_THRESHOLD = 65;
export const REVENUE_GENERATING_THRESHOLD = 55;
export const ADOPTED_THRESHOLD = 45;
export const LAUNCHED_THRESHOLD = 35;
export const LAUNCH_READY_THRESHOLD = 28;
export const RUNTIME_READY_THRESHOLD = 22;
export const VALIDATED_THRESHOLD = 16;
export const BUILT_THRESHOLD = 10;
export const PLANNED_THRESHOLD = 5;
