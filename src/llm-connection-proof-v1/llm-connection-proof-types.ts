/**
 * LLM Connection Proof V1 — temporary audit diagnostics for build-result chat path.
 */

export const LLM_CONNECTION_PROOF_V1_PASS_TOKEN = 'LLM_CONNECTION_PROOF_V1_PASS';

export type BuildResultLlmResponseSource =
  | 'LLM'
  | 'TEMPLATE_FALLBACK'
  | 'ERROR_FALLBACK';

export type LlmConnectionProofVerdict =
  | 'LLM_CONNECTED'
  | 'LLM_NOT_CONNECTED'
  | 'LLM_CONNECTED_BUT_TEMPLATE_WINNING'
  | 'LLM_CONNECTED_BUT_PROMPT_TOO_CONSTRAINED';

export interface BuildResultLlmConnectionProof {
  readOnly: true;
  llmCallFunction: string | null;
  systemPrompt: string | null;
  userPrompt: string | null;
  rawLlmResponse: string | null;
  finalBrainResponse: string;
  fallbackUsed: boolean;
  responseSource: BuildResultLlmResponseSource;
  llmInvoked: boolean;
  templateFallbackUsedAsFinal: boolean;
  rawDiffersFromTemplate: boolean | null;
  finalEqualsRawLlm: boolean | null;
}

export interface LlmConnectionProofAuditResult {
  readOnly: true;
  verdict: LlmConnectionProofVerdict;
  verdictRationale: string;
  proof: BuildResultLlmConnectionProof;
  evidence: string[];
}
