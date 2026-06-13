/**
 * Connected Verification Execution Proof — constants and registry.
 */

export const CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN =
  'CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_OWNER_MODULE =
  'devpulse_connected_verification_execution_proof';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_PHASE =
  'Phase 26.11 — Connected Verification Execution Proof';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT_TITLE =
  'CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_CACHE_KEY_PREFIX =
  'connected-verification-execution-proof-v1';
export const MAX_VERIFICATION_EXECUTION_PROOF_HISTORY = 16;

export const CONNECTED_VERIFICATION_EXECUTION_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove that verification ran against generated runtime/preview output and produced evidence-backed results?';

export const ORCHESTRATION_FLOW = [
  'Preview Experience Proof Report (upstream)',
  'Verification Run Analyzer',
  'Verification Target Analyzer',
  'Verification Result Analyzer',
  'Verification Evidence Analyzer',
  'Verification Failure Analyzer',
  'Verification Readiness Analyzer',
  'Verification Manifest Analyzer',
  'Verification Linkage Analyzer',
  'Autonomous Build Execution Proof (VERIFY stage)',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — does not execute verification commands',
  'PROVEN requires completed run, linked target, results, and evidence artifacts',
  'Failed verification can still be PROVEN if run evidence exists',
  'No pass-token-only or validator-exists proof',
] as const;
