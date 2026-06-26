/**
 * Missing Capability Evolution Engine — Stage 1: missing capability intake.
 */

import type {
  MissingCapabilityIntakeItem,
  MissingCapabilityEvolutionPipelineInput,
  MissingCapabilitySourceGate,
} from './missing-capability-evolution-types.js';

let intakeCounter = 0;

export function resetMissingCapabilityIntakeForTests(): void {
  intakeCounter = 0;
}

function nextIntakeId(): string {
  intakeCounter += 1;
  return `missing-cap-${intakeCounter}`;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function intakeMissingCapabilities(
  input: MissingCapabilityEvolutionPipelineInput,
): MissingCapabilityIntakeItem[] {
  const items: MissingCapabilityIntakeItem[] = [];
  const seen = new Set<string>();

  const add = (
    capabilityName: string,
    reasonRequired: string,
    sourceRequirementIds: string[],
    sourcePromptEvidence: string[],
    blockingGate: MissingCapabilitySourceGate,
    riskHints: string[] = [],
  ): void => {
    const key = `${blockingGate}:${capabilityName.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      readOnly: true,
      missingCapabilityId: nextIntakeId(),
      capabilityName,
      reasonRequired,
      sourceRequirementIds,
      sourcePromptEvidence,
      affectedFeatureSlices: [],
      affectedBehaviorScenarios: [],
      affectedVirtualUsers: [],
      affectedDeviceProfiles: [],
      affectedInteractions: [],
      expectedInterfaces: [`${slug(capabilityName)}-api`, `export${slug(capabilityName)}`],
      requiredValidation: ['STATIC', 'INTEGRATION', 'PROMPT_FAITHFULNESS'],
      riskHints,
      blockingGate,
    });
  };

  const planning = input.capabilityPlanning;

  if (planning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION' || planning.generationPlans.length > 0) {
    for (const gap of planning.gaps) {
      if (gap.decision === 'GENERATE_MISSING' || gap.decision === 'NEEDS_HUMAN_REVIEW') {
        add(
          gap.requiredCapability.name,
          gap.requiredCapability.description,
          gap.requiredCapability.sourceRequirementIds,
          [input.rawPrompt.slice(0, 120)],
          'CAPABILITY_PLANNING',
          [gap.risk],
        );
      }
    }
    for (const gen of planning.generationPlans) {
      add(
        gen.capabilityName,
        gen.reasonRequired,
        gen.sourceRequirementIds,
        [input.rawPrompt.slice(0, 120)],
        'CAPABILITY_PLANNING',
        [gen.riskLevel],
      );
    }
  }

  if (input.debuggingCapabilityGap) {
    add(
      input.debuggingCapabilityGap.capabilityName,
      input.debuggingCapabilityGap.evidence,
      [],
      [input.debuggingCapabilityGap.evidence],
      'AUTONOMOUS_DEBUGGING',
      ['CAPABILITY_GAP'],
    );
  }

  if (input.promptFaithfulness) {
    for (const mapping of input.promptFaithfulness.capabilityMappings) {
      for (const capName of mapping.capabilityChain) {
        const existing = planning.searchResults.find(
          (s) => s.requiredCapability.name.toLowerCase() === capName.toLowerCase() && s.matchType === 'MISSING',
        );
        if (existing) {
          add(
            capName,
            `Prompt faithfulness mapping for ${mapping.requirementId}`,
            [mapping.requirementId],
            mapping.sourceEvidenceIds ?? [],
            'PROMPT_FAITHFULNESS',
          );
        }
      }
    }
  }

  return items;
}

export function hasRequirementEvidence(item: MissingCapabilityIntakeItem): boolean {
  return item.sourceRequirementIds.length > 0 || item.sourcePromptEvidence.length > 0;
}
