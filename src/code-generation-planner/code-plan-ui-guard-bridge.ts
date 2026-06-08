/**
 * Visible UI Guard bridge — guard remains UI owner; planner generates requirements only.
 */

import { getDevPulseV2VisibleUiGuardAuthority } from '../visible-ui-guard/visible-ui-guard-authority.js';
import { GUARD_OWNER_MODULE } from '../visible-ui-guard/types.js';
import {
  CLICKABILITY_PROOF_REQUIRED,
  UI_ELEMENT_KEYWORDS,
  UI_REGISTRATION_REQUIRED,
} from './types.js';

export interface UiGuardRequirementInput {
  title: string;
  objective: string;
  targetFiles: string[];
}

function textContainsUiElement(text: string): boolean {
  const lower = text.toLowerCase();
  return UI_ELEMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

export function generateUiGuardRequirements(input: UiGuardRequirementInput): string[] {
  const requirements: string[] = [];
  const corpus = `${input.title} ${input.objective} ${input.targetFiles.join(' ')}`;

  if (textContainsUiElement(corpus)) {
    requirements.push(UI_REGISTRATION_REQUIRED);
    requirements.push(CLICKABILITY_PROOF_REQUIRED);
  }

  return requirements;
}

export function validateUiRequirements(uiRequirements: string[]): {
  valid: boolean;
  missing: string[];
} {
  const required = [UI_REGISTRATION_REQUIRED, CLICKABILITY_PROOF_REQUIRED];
  const missing: string[] = [];

  const hasUiContext = uiRequirements.length > 0;
  if (!hasUiContext) {
    return { valid: true, missing: [] };
  }

  for (const req of required) {
    if (uiRequirements.includes(req)) continue;
    if (uiRequirements.some((r) => r.includes('UI_REGISTRATION') || r.includes('CLICKABILITY'))) {
      continue;
    }
    missing.push(req);
  }

  return { valid: missing.length === 0, missing };
}

export function assertVisibleUiGuardOwnershipUnchanged(): boolean {
  const guard = getDevPulseV2VisibleUiGuardAuthority();
  return (
    guard.constructor.name === 'DevPulseV2VisibleUiGuardAuthority' &&
    typeof guard.registerVisibleUiElement === 'function' &&
    typeof (guard as { generateCode?: unknown }).generateCode === 'undefined'
  );
}

export function getVisibleUiGuardOwnerForBridge(): string {
  return GUARD_OWNER_MODULE;
}
