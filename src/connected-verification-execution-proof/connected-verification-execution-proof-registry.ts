/**
 * Connected Verification Execution Proof — constants and registry.
 */

export const CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN =
  'CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS =
  'CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_OWNER_MODULE =
  'devpulse_connected_verification_execution_proof';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_PHASE =
  'Phase 26.76 — Connected Verification Execution Proof Repair';
export const VERIFICATION_PROBE_TIMEOUT_MS = 45_000;
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT_TITLE =
  'CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT';
export const CONNECTED_VERIFICATION_EXECUTION_PROOF_CACHE_KEY_PREFIX =
  'connected-verification-execution-proof-v1';
export const MAX_VERIFICATION_EXECUTION_PROOF_HISTORY = 16;

export const CONNECTED_VERIFICATION_EXECUTION_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove that verification ran against generated runtime/preview output and produced evidence-backed results?';

export const ORCHESTRATION_FLOW = [
  'Preview Experience Proof Report (upstream)',
  'Verification Proof Gap Activator (generated workspace)',
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
  'Read-only analysis path — gap activator executes real npm verify in generated workspace only',
  'PROVEN requires preview proven, command detected, execution observed, and verificationSucceeded',
  'Failed verification run is PARTIAL — not PROVEN without success',
  'No pass-token-only or validator-exists proof',
] as const;
