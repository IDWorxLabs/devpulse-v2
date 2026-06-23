/**
 * Runtime Materialization Truth Bridge — constants and registry (Phase 26.76).
 */

export const RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS = 'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS';
export const RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_OWNER_MODULE =
  'devpulse_runtime_materialization_truth_bridge';
export const RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PHASE =
  'Phase 26.76 — Runtime Materialization Truth Bridge V1';
export const RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE =
  'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_REPORT';
export const RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE =
  'RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT';
export const RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX =
  'runtime-materialization-truth-bridge-v1';
export const MAX_RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_HISTORY = 16;

export const RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION =
  'Do generated artifacts actually form a runnable application — with runtime evidence, not just filesystem evidence?';

export const RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION =
  'RUNTIME_MATERIALIZATION_TRUTH' as const;

export const EVIDENCE_PRIORITY_ORDER = [
  'Live runtime evidence',
  'Startup evidence',
  'Route evidence',
  'UI evidence',
  'Founder flow evidence',
  'Cached proof snapshots',
] as const;

export const RECONCILIATION_RULES = [
  'Rule 1 — boots + routes + UI + critical flow: APPLICATION_PROVEN even if downstream reporting disagrees',
  'Rule 2 — files exist but startup fails: APPLICATION_NOT_PROVEN, rootCause=RUNTIME_START_FAILURE',
  'Rule 3 — boots but route failures: APPLICATION_PARTIAL, rootCause=ROUTE_FAILURE',
  'Rule 4 — runtime succeeds but Founder Test reports failure: EVIDENCE_PROPAGATION_FAILURE not APPLICATION_NOT_PROVEN',
] as const;

export const INTEGRATION_TARGET_AUTHORITIES = [
  'runtime-startup-proof-repair',
  'connected-runtime-activation-proof',
  'connected-preview-experience-proof',
  'build-materialization-truth-bridge',
  'founder-truth-matrix-integration',
  'founder-test-launch-readiness',
  'founder-test-consistency-audit',
] as const;

export const ORCHESTRATION_FLOW = [
  'Collect runtime activation proof (startup, process, port, health)',
  'Collect preview experience proof (routes, UI render)',
  'Collect build materialization truth (files exist vs app works)',
  'Analyze startup / route / UI / founder-flow boundaries',
  'Apply reconciliation rules 1–4',
  'Derive authoritative APPLICATION truth verdict',
  'Patch Truth Matrix application claims',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — no file mutation',
  'No synthetic runtime claims',
  'Live runtime evidence outranks stale Founder Test reporting',
  'Distinguishes FILES_EXIST from APPLICATION_WORKS',
  'Single authoritative APPLICATION truth for Truth Matrix and Launch Readiness',
] as const;

export const FOUNDER_RUNTIME_TRUTH_QUESTIONS = [
  'Did the application start?',
  'Did the application become reachable?',
  'Did routes work?',
  'Did the UI render?',
  'Did founder-critical workflows complete?',
  'Did reporting systems accurately reflect runtime reality?',
  'What is the true root cause?',
] as const;

export const RUNTIME_APPLICATION_CLAIM_IDS = [
  'APPLICATION_WORKS',
  'APPLICATION_RUNS',
  'APPLICATION_REACHABLE',
  'FOUNDER_CAN_USE_APPLICATION',
] as const;
