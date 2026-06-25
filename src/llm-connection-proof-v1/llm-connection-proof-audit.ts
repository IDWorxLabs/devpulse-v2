/**
 * LLM Connection Proof V1 — build proof diagnostics and verdict derivation.
 */

import type {
  BuildResultLlmConnectionProof,
  BuildResultLlmResponseSource,
  LlmConnectionProofAuditResult,
  LlmConnectionProofVerdict,
} from './llm-connection-proof-types.js';

const MECHANICAL_MARKERS = ['Build run:', 'Workspace:', 'Profile:', 'Build execution started for project'];

export function buildLlmConnectionProof(input: {
  llmCallFunction: string | null;
  systemPrompt: string | null;
  userPrompt: string | null;
  rawLlmResponse: string | null;
  finalBrainResponse: string;
  fallbackUsed: boolean;
  responseSource: BuildResultLlmResponseSource;
  llmInvoked: boolean;
  templateFallback: string;
}): BuildResultLlmConnectionProof {
  const raw = input.rawLlmResponse?.trim() ?? null;
  const final = input.finalBrainResponse.trim();
  const template = input.templateFallback.trim();

  const rawDiffersFromTemplate = raw != null ? raw !== template : null;
  const finalEqualsRawLlm = raw != null ? final === raw : null;
  const templateFallbackUsedAsFinal =
    input.responseSource === 'TEMPLATE_FALLBACK' ||
    input.responseSource === 'ERROR_FALLBACK' ||
    (input.responseSource === 'LLM' && final === template);

  return {
    readOnly: true,
    llmCallFunction: input.llmCallFunction,
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    rawLlmResponse: raw,
    finalBrainResponse: final,
    fallbackUsed: input.fallbackUsed,
    responseSource: input.responseSource,
    llmInvoked: input.llmInvoked,
    templateFallbackUsedAsFinal,
    rawDiffersFromTemplate,
    finalEqualsRawLlm,
  };
}

function looksMechanical(text: string): boolean {
  let hits = 0;
  for (const marker of MECHANICAL_MARKERS) {
    if (text.includes(marker)) hits += 1;
  }
  return hits >= 2;
}

export function auditLlmConnectionProof(proof: BuildResultLlmConnectionProof): LlmConnectionProofAuditResult {
  const evidence: string[] = [
    `llmCallFunction=${proof.llmCallFunction ?? 'none'}`,
    `llmInvoked=${proof.llmInvoked}`,
    `responseSource=${proof.responseSource}`,
    `fallbackUsed=${proof.fallbackUsed}`,
    `rawDiffersFromTemplate=${proof.rawDiffersFromTemplate}`,
    `finalEqualsRawLlm=${proof.finalEqualsRawLlm}`,
    `templateFallbackUsedAsFinal=${proof.templateFallbackUsedAsFinal}`,
  ];

  let verdict: LlmConnectionProofVerdict;
  let verdictRationale: string;

  if (!proof.llmInvoked) {
    verdict = 'LLM_NOT_CONNECTED';
    verdictRationale = 'LLM provider was not invoked; template or deterministic fallback reached chat.';
  } else if (proof.templateFallbackUsedAsFinal || proof.fallbackUsed) {
    verdict = 'LLM_CONNECTED_BUT_TEMPLATE_WINNING';
    verdictRationale =
      'LLM was invoked but final brainResponse matches template fallback or fallbackUsed is true.';
  } else if (proof.rawLlmResponse && looksMechanical(proof.rawLlmResponse) && proof.finalEqualsRawLlm) {
    verdict = 'LLM_CONNECTED_BUT_PROMPT_TOO_CONSTRAINED';
    verdictRationale =
      'LLM was invoked and its raw output reached chat, but output still resembles the mechanical template.';
  } else if (proof.llmInvoked && proof.responseSource === 'LLM' && proof.finalEqualsRawLlm) {
    verdict = 'LLM_CONNECTED';
    verdictRationale = 'LLM provider invoked; raw LLM output is the final brainResponse shown in chat.';
  } else {
    verdict = 'LLM_CONNECTED_BUT_TEMPLATE_WINNING';
    verdictRationale =
      'LLM was invoked but final brainResponse does not equal raw LLM output — post-processing or fallback may have altered it.';
  }

  return {
    readOnly: true,
    verdict,
    verdictRationale,
    proof,
    evidence,
  };
}
