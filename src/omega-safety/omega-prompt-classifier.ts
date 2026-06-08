/**
 * Lightweight rule-based OMEGA prompt safety classifier.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import type { OwnershipDomain } from '../foundation/types.js';
import type {
  OmegaPromptClassificationInput,
  OmegaPromptSafetyResult,
  OmegaPromptScope,
  OmegaValidationMode,
} from './types.js';
import {
  OMEGA_OWNER_MODULE,
  SAFE_PHRASE_PATTERNS,
  UNSAFE_PHRASE_PATTERNS,
} from './types.js';

function createResultId(): string {
  return `omega-safety-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractSystemId(promptText: string, declared?: string): string {
  if (declared) return declared;
  const match =
    promptText.match(/SYSTEM ID\s*\n?\s*([a-z0-9_]+)/i) ??
    promptText.match(/systems:\s*\[["']([a-z0-9_]+)["']\]/i) ??
    promptText.match(/systemId:\s*["']?([a-z0-9_]+)["']?/i);
  return match?.[1] ?? 'unknown';
}

const SYSTEM_DOMAIN_MAP: Record<string, OwnershipDomain> = {
  omega_prompt_safety_policy: 'omega_prompt_safety_policy',
  validation_budget_policy: 'validation_budget_policy',
  evidence_registry: 'evidence_registry',
  timeline_event_ledger: 'timeline_event_ledger',
  project_vault: 'project_vault',
  trust_engine: 'trust_engine',
  chat_authority: 'chat_authority',
  shell: 'shell_authority',
  task_governor: 'startup_scheduling',
  browser_verification_harness: 'browser_verification_harness',
};

function countSystemMentions(promptText: string): number {
  const lower = promptText.toLowerCase();
  const systems = Object.keys(SYSTEM_DOMAIN_MAP);
  return systems.filter((s) => lower.includes(s.replace(/_/g, ' ')) || lower.includes(s)).length;
}

function detectScope(promptText: string, systemCount: number, hasUnsafe: boolean): OmegaPromptScope {
  if (hasUnsafe || systemCount > 1) return 'MULTI_AUTHORITY_UNSAFE';
  if (/capability wave|single capability/i.test(promptText)) return 'SINGLE_CAPABILITY_WAVE';
  if (/vertical slice|single vertical/i.test(promptText)) return 'SINGLE_VERTICAL_SLICE';
  if (/system id|one system authority|single system authority/i.test(promptText)) {
    return 'SINGLE_SYSTEM_AUTHORITY';
  }
  if (systemCount === 1) return 'SINGLE_SYSTEM_AUTHORITY';
  return 'UNKNOWN';
}

function resolveValidationMode(
  promptText: string,
  scope: OmegaPromptScope,
  hasUnsafe: boolean,
): OmegaValidationMode {
  if (/phase transition|new phase|before phase [2-9]/i.test(promptText)) {
    return 'PHASE_TRANSITION_CHECK';
  }
  if (
    hasUnsafe ||
    /ownership registry change|change answer authority|replace chat authority|new answer authority/i.test(
      promptText,
    ) ||
    /browser runner change|task governor change|foundation enforcement change/i.test(promptText)
  ) {
    return 'FULL_STACK_CHECK';
  }
  if (
    scope === 'SINGLE_SYSTEM_AUTHORITY' ||
    scope === 'SINGLE_CAPABILITY_WAVE' ||
    scope === 'SINGLE_VERTICAL_SLICE'
  ) {
    return 'FAST_FEATURE_CHECK';
  }
  return 'FAST_FEATURE_CHECK';
}

function resolveAuthorityOwner(systemId: string): string {
  const domain = SYSTEM_DOMAIN_MAP[systemId];
  if (domain) {
    return getDevPulseV2Owner(domain).ownerModule;
  }
  if (systemId === 'unknown') return OMEGA_OWNER_MODULE;
  return `devpulse_v2_${systemId}_authority`;
}

export function classifyOmegaPromptSafety(
  input: OmegaPromptClassificationInput | string,
): OmegaPromptSafetyResult {
  const promptText = typeof input === 'string' ? input : input.promptText;
  const declaredSystemId = typeof input === 'string' ? undefined : input.declaredSystemId;

  const warnings: string[] = [];
  const errors: string[] = [];
  const systemId = extractSystemId(promptText, declaredSystemId);
  const systemCount = countSystemMentions(promptText);

  for (const unsafe of UNSAFE_PHRASE_PATTERNS) {
    if (unsafe.pattern.test(promptText)) {
      errors.push(unsafe.reason);
    }
  }

  if (systemCount > 1) {
    errors.push(`Prompt references ${systemCount} systems — one OMEGA prompt must equal one authority.`);
  }

  if (/touches existing authorities|modify existing authority/i.test(promptText) && systemCount <= 1) {
    warnings.push('Prompt touches existing authorities without explicit ownership transfer.');
  }

  if (!SAFE_PHRASE_PATTERNS.some((p) => p.test(promptText)) && systemCount <= 1 && errors.length === 0) {
    warnings.push('Prompt lacks explicit safety declarations (system id, validation mode, non-execution).');
  }

  if (!/validation[_ ]mode|fast[_ ]feature[_ ]check|full[_ ]stack[_ ]check|phase[_ ]transition[_ ]check/i.test(promptText)) {
    warnings.push('Prompt does not declare validation mode.');
  }

  const hasUnsafe = errors.length > 0;
  const scope = detectScope(promptText, systemCount, hasUnsafe);
  const validationMode = resolveValidationMode(promptText, scope, hasUnsafe);
  const authorityOwner = resolveAuthorityOwner(systemId);

  let status: OmegaPromptSafetyResult['status'] = 'SAFE';
  if (hasUnsafe) status = 'UNSAFE';
  else if (warnings.length > 0 || scope === 'UNKNOWN') status = 'WARN';

  let recommendation =
    'Prompt is scoped to one system authority — proceed with declared validation mode.';
  if (status === 'UNSAFE') {
    recommendation =
      'Split this OMEGA prompt into one system authority per prompt before implementation.';
  } else if (status === 'WARN') {
    recommendation =
      'Add explicit authority scope, validation mode, and safety declarations before building.';
  } else if (validationMode === 'FULL_STACK_CHECK') {
    recommendation = 'Run FULL_STACK_CHECK before implementing authority-changing work.';
  } else if (validationMode === 'PHASE_TRANSITION_CHECK') {
    recommendation = 'Run PHASE_TRANSITION_CHECK before starting new phase work.';
  }

  return {
    resultId: createResultId(),
    createdAt: Date.now(),
    status,
    scope,
    systemId,
    authorityOwner,
    validationMode,
    warnings,
    errors,
    recommendation,
  };
}
