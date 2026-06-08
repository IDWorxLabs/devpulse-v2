/**
 * Pattern extraction engine — extracts reusable patterns from learning events.
 * Pattern recording only. No automatic application.
 */

import type {
  ExtractedPattern,
  LearningCategory,
  LearningEventInput,
  LearningSourceSystem,
} from './types.js';
import { nextPatternId } from './types.js';

export function patternExtractionKey(
  workspaceId: string,
  projectId: string,
  category: LearningCategory,
  eventType: string,
): string {
  return `${workspaceId}|${projectId}|${category}|${eventType}`;
}

export function reusablePatternKey(
  sourceSystem: LearningSourceSystem,
  category: LearningCategory,
  eventType: string,
): string {
  return `pattern:${sourceSystem}:${category}:${eventType}`;
}

export function extractLearningPatterns(
  input: LearningEventInput,
  category: LearningCategory,
  blocked: boolean,
): ExtractedPattern[] {
  if (blocked || category === 'UNKNOWN') return [];

  const patterns: ExtractedPattern[] = [];
  const baseKey = reusablePatternKey(input.sourceSystem, category, input.eventType);

  patterns.push({
    patternId: nextPatternId(),
    patternKey: baseKey,
    category,
    description: `Pattern from ${input.eventType}: ${input.eventSummary.slice(0, 80)}`,
    sourceSystem: input.sourceSystem,
  });

  if (input.eventOutcome?.trim()) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:outcome`,
      category,
      description: `Outcome pattern: ${input.eventOutcome.slice(0, 80)}`,
      sourceSystem: input.sourceSystem,
    });
  }

  if (input.capabilityGapId) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:capability-gap`,
      category: category === 'CAPABILITY_PATTERN' ? 'CAPABILITY_PATTERN' : category,
      description: `Capability gap pattern: ${input.capabilityGapId}`,
      sourceSystem: input.sourceSystem,
    });
  }

  if (input.acquisitionPlanId) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:acquisition`,
      category: category === 'ACQUISITION_PATTERN' ? 'ACQUISITION_PATTERN' : category,
      description: `Acquisition plan pattern: ${input.acquisitionPlanId}`,
      sourceSystem: input.sourceSystem,
    });
  }

  if (input.verificationId) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:verification`,
      category: 'VERIFICATION_PATTERN',
      description: `Verification pattern: ${input.verificationId}`,
      sourceSystem: input.sourceSystem,
    });
  }

  if (input.simulationId) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:simulation`,
      category: 'SIMULATION_PATTERN',
      description: `Simulation pattern: ${input.simulationId}`,
      sourceSystem: input.sourceSystem,
    });
  }

  if (input.approvalRequestId) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:approval`,
      category: 'APPROVAL_PATTERN',
      description: `Approval pattern: ${input.approvalRequestId}`,
      sourceSystem: input.sourceSystem,
    });
  }

  if (input.mobileSessionId) {
    patterns.push({
      patternId: nextPatternId(),
      patternKey: `${baseKey}:mobile`,
      category: 'MOBILE_PATTERN',
      description: `Mobile session pattern: ${input.mobileSessionId}`,
      sourceSystem: input.sourceSystem,
    });
  }

  return patterns;
}

export function extractedPatternsKey(patterns: ExtractedPattern[]): string {
  return patterns.map((p) => p.patternKey).sort().join(';');
}
