/**
 * LLM Connection Proof V1 — public API.
 */

export {
  LLM_CONNECTION_PROOF_V1_PASS_TOKEN,
  type BuildResultLlmResponseSource,
  type BuildResultLlmConnectionProof,
  type LlmConnectionProofVerdict,
  type LlmConnectionProofAuditResult,
} from './llm-connection-proof-types.js';

export { buildLlmConnectionProof, auditLlmConnectionProof } from './llm-connection-proof-audit.js';
