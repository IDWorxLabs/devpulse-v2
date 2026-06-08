/**
 * DevPulse V2 OMEGA Prompt Safety Authority — classifies large build prompts before implementation.
 * Does NOT build Central Brain, AiDev, execution, or become answer authority.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import { formatOmegaAuthorityCheckTemplate } from './omega-authority-check-template.js';
import { classifyOmegaPromptSafety } from './omega-prompt-classifier.js';
import { formatOmegaPromptSafetyReport } from './omega-prompt-safety-report.js';
import type { OmegaPromptClassificationInput, OmegaPromptSafetyResult } from './types.js';
import { OMEGA_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2OmegaPromptSafetyAuthority | null = null;

export class DevPulseV2OmegaPromptSafetyAuthority {
  private lastResult: OmegaPromptSafetyResult | null = null;

  static readonly ownerModule = OMEGA_OWNER_MODULE;
  static readonly ownerDomain = 'omega_prompt_safety_policy' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('omega_prompt_safety_policy');
    return owner.ownerModule === OMEGA_OWNER_MODULE;
  }

  static assertDoesNotBecomeCentralBrain(): boolean {
    return !OMEGA_OWNER_MODULE.includes('central_brain');
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  evaluatePrompt(input: OmegaPromptClassificationInput | string): OmegaPromptSafetyResult {
    this.lastResult = classifyOmegaPromptSafety(input);
    return { ...this.lastResult, warnings: [...this.lastResult.warnings], errors: [...this.lastResult.errors] };
  }

  getLastResult(): OmegaPromptSafetyResult | null {
    return this.lastResult
      ? { ...this.lastResult, warnings: [...this.lastResult.warnings], errors: [...this.lastResult.errors] }
      : null;
  }

  formatAuthorityCheckTemplate(): string {
    return formatOmegaAuthorityCheckTemplate();
  }

  formatReport(): string {
    if (!this.lastResult) {
      return 'No OMEGA prompt evaluation yet.';
    }
    return formatOmegaPromptSafetyReport(this.lastResult);
  }

  /** Policy observes answer authority — never owns it. */
  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const omega = getDevPulseV2Owner('omega_prompt_safety_policy');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      omega.ownerModule === OMEGA_OWNER_MODULE
    );
  }
}

export function createDevPulseV2OmegaPromptSafetyAuthority(): DevPulseV2OmegaPromptSafetyAuthority {
  singleton = new DevPulseV2OmegaPromptSafetyAuthority();
  return singleton;
}

export function getDevPulseV2OmegaPromptSafetyAuthority(): DevPulseV2OmegaPromptSafetyAuthority {
  if (!singleton) {
    singleton = new DevPulseV2OmegaPromptSafetyAuthority();
  }
  return singleton;
}

export function resetDevPulseV2OmegaPromptSafetyAuthorityForTests(): DevPulseV2OmegaPromptSafetyAuthority {
  singleton = new DevPulseV2OmegaPromptSafetyAuthority();
  return singleton;
}
