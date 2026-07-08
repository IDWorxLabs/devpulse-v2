/**
 * Universal Build Pipeline Verification V1 — profile policy.
 * Generic custom app profile must be valid when prompt-derived modules exist.
 * Do not allow stale ExpenseTracker profiles to block unrelated custom apps.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { PromptProfileGuardResult } from '../prompt-faithful-generation/prompt-faithful-generation-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

export interface ProfilePolicyResult {
  readOnly: true;
  accepted: boolean;
  selectedProfile: string;
  expectedProfile: string | null;
  genericCustomAccepted: boolean;
  expenseTrackerContamination: boolean;
  profileMisroute: boolean;
  reason: string | null;
}

export function promptExplicitlyRequiresAuth(rawPrompt: string): boolean {
  if (
    /\b(no|without|not)\s+.{0,32}\b(login|sign[\s-]?in|sign[\s-]?up|authentication|user\s+accounts?|sessions?)\b/i.test(
      rawPrompt,
    ) ||
    /\b(login|sign[\s-]?in|authentication)\s+not\s+required\b/i.test(rawPrompt)
  ) {
    return false;
  }
  return /\b(login|sign[\s-]?in|sign[\s-]?up|user\s+accounts?|user\s+management|user\s+registration|roles?|sessions?|protected data|authentication)\b/i.test(
    rawPrompt,
  );
}

export function evaluateProfilePolicy(input: {
  rawPrompt: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  expectedProfile: GeneratedAppProfile | 'ASSISTIVE_COMMUNICATION' | 'ASSISTIVE_COMMUNICATION_APP_V1';
}): ProfilePolicyResult {
  const selected = String(input.buildPlan.selectedProfile ?? input.buildPlan.guardResult.selectedProfile);
  const approvedModules = input.buildPlan.modulePlan.approvedModuleIds;
  const hasPromptDerivedModules = approvedModules.length > 0;
  const isCustomDomain = input.buildPlan.extraction.isCustomDomainPrompt;
  const guard: PromptProfileGuardResult = input.buildPlan.guardResult;

  const expenseTrackerContamination =
    selected === 'EXPENSE_TRACKER_WEB_V1' &&
    input.expectedProfile !== 'EXPENSE_TRACKER_WEB_V1' &&
    input.expectedProfile !== 'FINANCE_TRACKER_WEB_V1' &&
    (isCustomDomain || hasPromptDerivedModules);

  const assistiveExpected =
    input.expectedProfile === 'ASSISTIVE_COMMUNICATION' ||
    input.expectedProfile === 'ASSISTIVE_COMMUNICATION_APP_V1';

  const genericCustomAccepted =
    (selected === 'GENERIC_CUSTOM_APP_V1' && hasPromptDerivedModules) ||
    (assistiveExpected &&
      (selected === 'ASSISTIVE_COMMUNICATION_APP_V1' ||
        input.buildPlan.definition.expectedAppType === 'assistive-communication'));

  const profileMisroute =
    expenseTrackerContamination ||
    (selected === 'PROJECT_MANAGEMENT_WEB_V1' && isCustomDomain) ||
    (guard.guardApplied &&
      guard.originalProfile !== 'GENERIC_CUSTOM_APP_V1' &&
      guard.originalProfile !== 'ASSISTIVE_COMMUNICATION_APP_V1' &&
      hasPromptDerivedModules &&
      selected !== String(input.expectedProfile) &&
      !assistiveExpected);

  const assistiveOk =
    assistiveExpected &&
    (selected === 'ASSISTIVE_COMMUNICATION_APP_V1' ||
      input.buildPlan.definition.expectedAppType === 'assistive-communication');

  const namedProfileOk =
    !assistiveExpected &&
    (selected === String(input.expectedProfile) || genericCustomAccepted);

  const accepted = assistiveOk || namedProfileOk || (genericCustomAccepted && !expenseTrackerContamination);

  return {
    readOnly: true,
    accepted,
    selectedProfile: selected,
    expectedProfile: String(input.expectedProfile),
    genericCustomAccepted,
    expenseTrackerContamination,
    profileMisroute,
    reason: accepted
      ? null
      : expenseTrackerContamination
        ? `Stale ExpenseTracker profile selected for unrelated custom app.`
        : profileMisroute
          ? `Profile misroute: expected ${input.expectedProfile}, got ${selected}.`
          : `Profile ${selected} not accepted for this prompt.`,
  };
}

export function shouldInjectAuthRequirement(rawPrompt: string): boolean {
  return promptExplicitlyRequiresAuth(rawPrompt);
}
