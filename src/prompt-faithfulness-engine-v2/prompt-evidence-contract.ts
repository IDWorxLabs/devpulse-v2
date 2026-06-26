/**
 * Prompt Faithfulness Engine V2 — immutable evidence contract builder.
 */

import type {
  EvidenceCategory,
  ParsedPrompt,
  PromptEvidenceContract,
  PromptEvidenceItem,
} from './prompt-faithfulness-v2-types.js';
import { PROMPT_EVIDENCE_CONTRACT_VERSION } from './prompt-faithfulness-registry.js';

let contractCounter = 0;

export function resetPromptEvidenceContractForTests(): void {
  contractCounter = 0;
}

function nextContractId(): string {
  contractCounter += 1;
  return `pec-${contractCounter}-${Date.now()}`;
}

function filterByCategories(
  items: readonly PromptEvidenceItem[],
  categories: EvidenceCategory[],
): PromptEvidenceItem[] {
  return items.filter((item) => categories.includes(item.category));
}

export function buildPromptEvidenceContract(
  parsed: ParsedPrompt,
  requirements: readonly PromptEvidenceItem[],
): PromptEvidenceContract {
  const mandatoryRequirements = requirements.filter(
    (r) => r.priority === 'MANDATORY' || r.priority === 'REQUIRED',
  );
  const optionalRequirements = requirements.filter(
    (r) => r.priority === 'OPTIONAL' || r.priority === 'FUTURE' || r.priority === 'EXPERIMENTAL',
  );

  return {
    readOnly: true,
    id: nextContractId(),
    promptHash: parsed.promptHash,
    version: PROMPT_EVIDENCE_CONTRACT_VERSION,
    createdAt: Date.now(),
    rawPrompt: parsed.rawPrompt,
    requirements,
    mandatoryRequirements,
    optionalRequirements,
    constraints: filterByCategories(requirements, ['CONSTRAINT', 'NON_GOAL']),
    nonGoals: requirements.filter((r) => r.category === 'NON_GOAL'),
    platformRequirements: filterByCategories(requirements, ['PLATFORM']),
    behaviorRequirements: filterByCategories(requirements, ['USER_WORKFLOW', 'USER_JOURNEY', 'FUNCTIONAL']),
    interactionRequirements: filterByCategories(requirements, ['INTERACTION']),
    navigationRequirements: filterByCategories(requirements, ['NAVIGATION']),
    architectureRequirements: filterByCategories(requirements, ['ARCHITECTURE']),
    performanceRequirements: filterByCategories(requirements, ['PERFORMANCE', 'RELIABILITY']),
    securityRequirements: filterByCategories(requirements, ['SECURITY', 'AUTHENTICATION', 'AUTHORIZATION']),
    accessibilityRequirements: filterByCategories(requirements, ['ACCESSIBILITY']),
    validationRequirements: filterByCategories(requirements, ['VALIDATION']),
    launchRequirements: filterByCategories(requirements, ['LAUNCH', 'SUCCESS_CRITERION']),
    immutable: true,
  };
}

export function assertContractImmutable(contract: PromptEvidenceContract): boolean {
  return contract.immutable === true;
}
