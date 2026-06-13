/**
 * Connected Runtime Activation Proof — constants and registry.
 */

export const CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN =
  'CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS';
export const CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS =
  'CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS';
export const CONNECTED_RUNTIME_ACTIVATION_PROOF_OWNER_MODULE =
  'devpulse_connected_runtime_activation_proof';
export const CONNECTED_RUNTIME_ACTIVATION_PROOF_PHASE =
  'Phase 26.9 — Connected Runtime Activation Proof';
export const CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT_TITLE =
  'CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT';
export const CONNECTED_RUNTIME_ACTIVATION_PROOF_CACHE_KEY_PREFIX =
  'connected-runtime-activation-proof-v1';
export const MAX_RUNTIME_ACTIVATION_PROOF_HISTORY = 16;

export const CONNECTED_RUNTIME_ACTIVATION_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove that generated application artifacts started and became reachable at runtime?';

export const RUNTIME_SCRIPT_CANDIDATES = ['dev', 'start', 'serve', 'preview'] as const;
export const DEFAULT_RUNTIME_ACTIVATION_PORT = 4173;
export const RUNTIME_ACTIVATION_STARTUP_TIMEOUT_MS = 8_000;

export const ORCHESTRATION_FLOW = [
  'Build Materialization Report (upstream)',
  'Runtime Command Resolver',
  'Runtime Process Analyzer',
  'Runtime Port Analyzer',
  'Runtime Health Analyzer',
  'Runtime Log Analyzer',
  'Runtime Manifest Analyzer',
  'Runtime Linkage Analyzer',
  'Autonomous Build Execution Proof (RUNTIME stage)',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — does not execute runtime commands unless existing safe authority pattern',
  'PROVEN requires observed process, reachable port, and health or valid app response',
  'No synthetic runtime claims or roadmap assumptions',
  'PARTIAL reports exact missing runtime evidence and broken linkage',
] as const;

