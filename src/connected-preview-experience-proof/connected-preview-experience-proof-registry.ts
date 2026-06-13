/**
 * Connected Preview Experience Proof — constants and registry.
 */

export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN =
  'CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS';
export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_OWNER_MODULE =
  'devpulse_connected_preview_experience_proof';
export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_PHASE =
  'Phase 26.10 — Connected Preview Experience Proof';
export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT_TITLE =
  'CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT';
export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_CACHE_KEY_PREFIX =
  'connected-preview-experience-proof-v1';
export const MAX_PREVIEW_EXPERIENCE_PROOF_HISTORY = 16;

export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_CORE_QUESTION =
  'Can AiDevEngine prove that a founder can open and interact with the generated application preview?';

export const ORCHESTRATION_FLOW = [
  'Runtime Activation Proof Report (upstream)',
  'Preview Session Analyzer',
  'Preview URL Analyzer',
  'Preview Render Analyzer',
  'Preview Interaction Analyzer',
  'Preview Capture Analyzer',
  'Preview Manifest Analyzer',
  'Preview Linkage Analyzer',
  'Autonomous Build Execution Proof (PREVIEW stage)',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — does not launch preview or mutate application state',
  'PROVEN requires session, reachable URL, render, and interaction evidence',
  'No synthetic preview claims or screenshot-only proof',
  'PARTIAL reports exact missing preview evidence and broken linkage',
] as const;
