/**
 * Founder Flow Runtime Proof — registry (Phase 26.86).
 */

export const FOUNDER_FLOW_RUNTIME_PROOF_PASS = 'FOUNDER_FLOW_RUNTIME_PROOF_PASS';
export const FOUNDER_FLOW_RUNTIME_PROOF_OWNER_MODULE = 'devpulse_founder_flow_runtime_proof';
export const FOUNDER_FLOW_RUNTIME_PROOF_PHASE = 'Phase 26.86 — Founder Flow Runtime Proof V1';
export const FOUNDER_FLOW_RUNTIME_PROOF_REPORT_TITLE = 'FOUNDER_FLOW_RUNTIME_PROOF_REPORT';
export const FOUNDER_FLOW_RUNTIME_RECONCILIATION_REPORT_TITLE = 'FOUNDER_FLOW_RUNTIME_RECONCILIATION_REPORT';
export const FOUNDER_FLOW_RUNTIME_PROOF_CACHE_KEY_PREFIX = 'founder-flow-runtime-proof-v1';

export const FOUNDER_FLOW_RUNTIME_PROOF_CORE_QUESTION =
  'After UI renders, can a founder complete the critical runtime workflow with final result delivery to client cache or result store?';

export const FOUNDER_FLOW_RESULT_ENDPOINTS = [
  '/api/founder-test/result',
  '/api/founder-test/result-report',
  '/api/founder-test/result-download',
  '/api/founder-test/runtime-status',
] as const;

export const TRUTH_RULES = [
  'Rule 1 — UI renders and final result delivered to client cache or result store: founderFlowProven=true',
  'Rule 2 — UI renders but no final delivery: founderFlowProven=false, failureClass=FINAL_RESULT_NOT_DELIVERED',
  'Rule 3 — report generation observed but client delivery missing: REPORT_GENERATED_NOT_DELIVERED',
  'Rule 4 — partial report generation does not count as full founder flow completion',
  'Rule 5 — APPLICATION_PROVEN requires files, deps, boot, routes, UI, and founderFlowProven',
] as const;

export const ORCHESTRATION_FLOW = [
  'Require UI Render Proof pass (uiRenders=true)',
  'Discover founder flow candidates and result endpoints',
  'Scan UI for interactive elements and flow-start signals',
  'Check result store, client cache, and final delivery separately from report generation',
  'Feed founder flow proof into Runtime Materialization Truth Bridge',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only proof — no file mutation',
  'UI render proof required before founder flow assessment',
  'Partial report generation never counts as final delivery',
  'No nested validator chains',
] as const;

export const INTEGRATION_TARGETS = [
  'Runtime Materialization Truth Bridge',
  'Launch Readiness Authority',
  'Founder Truth Matrix',
  'Founder Test Final Reconciler',
  'Consistency Audit Authority',
] as const;
