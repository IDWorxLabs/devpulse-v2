/**
 * Connected Launch Readiness Proof — constants and registry.
 */

export const CONNECTED_LAUNCH_READINESS_PROOF_PASS_TOKEN = 'CONNECTED_LAUNCH_READINESS_PROOF_PASS';
export const CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_V1_PASS =
  'CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_V1_PASS';

export const CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS =
  'CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS';
export const CONNECTED_LAUNCH_READINESS_PROOF_OWNER_MODULE =
  'devpulse_connected_launch_readiness_proof';
export const CONNECTED_LAUNCH_READINESS_PROOF_PHASE =
  'Phase 26.77 — Connected Launch Readiness Proof Repair';
export const CONNECTED_LAUNCH_READINESS_PROOF_REPORT_TITLE =
  'CONNECTED_LAUNCH_READINESS_PROOF_REPORT';
export const CONNECTED_LAUNCH_READINESS_PROOF_CACHE_KEY_PREFIX =
  'connected-launch-readiness-proof-v1';
export const MAX_LAUNCH_READINESS_PROOF_HISTORY = 16;
export const CHAT_LAUNCH_BLOCK_THRESHOLD = 85;

export const CONNECTED_LAUNCH_READINESS_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove that the generated product is ready for launch with evidence-backed readiness?';

export const ORCHESTRATION_FLOW = [
  'Verification Execution Proof Report (upstream)',
  'Launch Blocker Analyzer',
  'Launch Risk Analyzer',
  'Launch Acceptance Analyzer',
  'Launch Readiness Analyzer',
  'Launch Simulation Analyzer',
  'Claim vs Reality Analyzer',
  'Launch Manifest Analyzer',
  'Launch Linkage Analyzer',
  'Autonomous Build Execution Proof (LAUNCH stage)',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — does not inflate scores or claim launch without evidence',
  'PROVEN requires connected execution chain and verification proof',
  'Critical blockers and claim-reality violations prevent READY state',
  'PARTIAL reports exact launch blockers and risks',
] as const;
