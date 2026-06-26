/**
 * Prompt Faithfulness Engine V2 — permanent requirement registry.
 */

import type {
  EvidenceCategory,
  PromptEvidenceContract,
  PromptEvidenceItem,
  PromptRequirement,
  RequirementPriority,
  RequirementVerificationMethod,
  VerificationStatus,
} from './prompt-faithfulness-v2-types.js';

let requirementCounter = 0;

export function resetPromptRequirementRegistryForTests(): void {
  requirementCounter = 0;
}

function nextRequirementId(): string {
  requirementCounter += 1;
  return `REQ-${String(requirementCounter).padStart(3, '0')}`;
}

function verificationMethodFor(category: EvidenceCategory): RequirementVerificationMethod {
  if (category === 'FUNCTIONAL' || category === 'UI') return 'WORKSPACE_SCAN';
  if (category === 'USER_WORKFLOW' || category === 'INTERACTION') return 'BEHAVIOR_TEST';
  if (category === 'ACCESSIBILITY') return 'FOUNDER_TEST';
  if (category === 'VALIDATION' || category === 'LAUNCH') return 'TRACEABILITY';
  return 'WORKSPACE_SCAN';
}

function acceptanceCriteria(item: PromptEvidenceItem): string[] {
  const criteria = [`Evidence satisfied: ${item.normalizedRequirement}`];
  if (item.category === 'FUNCTIONAL' && item.keywords.some((k) => k.includes('module'))) {
    criteria.push('Corresponding feature module exists in workspace');
  }
  if (item.category === 'ACCESSIBILITY') {
    criteria.push('Accessibility constraint present in generated UI');
  }
  if (item.category === 'INTERACTION') {
    criteria.push('Interaction behavior implemented as described');
  }
  return criteria;
}

function groupEvidence(evidence: readonly PromptEvidenceItem[]): PromptEvidenceItem[][] {
  const groups = new Map<string, PromptEvidenceItem[]>();
  for (const item of evidence) {
    const key = `${item.category}:${item.normalizedRequirement.slice(0, 60).toLowerCase()}`;
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }
  return [...groups.values()];
}

export function buildRequirementRegistry(contract: PromptEvidenceContract): PromptRequirement[] {
  const requirements: PromptRequirement[] = [];
  const groups = groupEvidence(contract.requirements);

  for (const group of groups) {
    const primary = group[0];
    requirements.push({
      readOnly: true,
      requirementId: nextRequirementId(),
      description: primary.normalizedRequirement,
      sourceEvidenceIds: group.map((g) => g.evidenceId),
      priority: primary.priority as RequirementPriority,
      category: primary.category,
      dependencies: [],
      acceptanceCriteria: acceptanceCriteria(primary),
      verificationMethod: verificationMethodFor(primary.category),
      verificationStatus: 'PENDING' as VerificationStatus,
      confidence: Math.max(...group.map((g) => g.confidence)),
    });
  }

  for (const req of requirements) {
    if (req.category === 'USER_WORKFLOW') {
      const functionalDeps = requirements
        .filter((r) => r.category === 'FUNCTIONAL')
        .slice(0, 2)
        .map((r) => r.requirementId);
      Object.assign(req, { dependencies: functionalDeps });
    }
  }

  return requirements;
}

export function updateRequirementVerificationStatus(
  requirements: readonly PromptRequirement[],
  requirementId: string,
  status: VerificationStatus,
): PromptRequirement[] {
  return requirements.map((r) =>
    r.requirementId === requirementId ? { ...r, verificationStatus: status } : r,
  );
}

export function getRequirementById(
  requirements: readonly PromptRequirement[],
  requirementId: string,
): PromptRequirement | null {
  return requirements.find((r) => r.requirementId === requirementId) ?? null;
}
