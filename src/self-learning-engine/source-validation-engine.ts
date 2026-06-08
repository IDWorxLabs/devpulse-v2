/**
 * Source validation engine — validates learning source systems.
 * Recording only. Reuses world2_learning_loop as input source, does not replace it.
 */

import type { GateRecord, LearningEventInput, LearningSourceSystem } from './types.js';
import { KNOWN_SOURCE_SYSTEMS } from './types.js';

export interface SourceValidationResult {
  valid: boolean;
  blocked: boolean;
  reason: string;
  gates: GateRecord[];
  sourceSystem: LearningSourceSystem;
}

export function sourceValidationKey(sourceSystem: LearningSourceSystem, sourceId: string): string {
  return `${sourceSystem}|${sourceId}`;
}

export function isKnownSourceSystem(source: LearningSourceSystem): boolean {
  return KNOWN_SOURCE_SYSTEMS.includes(source as (typeof KNOWN_SOURCE_SYSTEMS)[number]);
}

export function validateLearningSource(input: LearningEventInput): SourceValidationResult {
  const gates: GateRecord[] = [];

  if (input.sourceSystem === 'UNKNOWN') {
    gates.push({
      gateId: 'src-unknown-0001',
      gateType: 'SOURCE_UNKNOWN',
      status: 'CLOSED',
      description: 'Unknown source system blocked',
    });
    return {
      valid: false,
      blocked: true,
      reason: 'Unknown source system blocked',
      gates,
      sourceSystem: input.sourceSystem,
    };
  }

  if (!isKnownSourceSystem(input.sourceSystem)) {
    gates.push({
      gateId: 'src-unreg-0001',
      gateType: 'SOURCE_UNREGISTERED',
      status: 'CLOSED',
      description: `Source system ${input.sourceSystem} not registered`,
    });
    return {
      valid: false,
      blocked: true,
      reason: `Source system ${input.sourceSystem} not registered`,
      gates,
      sourceSystem: input.sourceSystem,
    };
  }

  if (!input.sourceId?.trim()) {
    gates.push({
      gateId: 'src-id-0001',
      gateType: 'SOURCE_ID',
      status: 'CLOSED',
      description: 'sourceId is required',
    });
    return {
      valid: false,
      blocked: true,
      reason: 'sourceId is required',
      gates,
      sourceSystem: input.sourceSystem,
    };
  }

  gates.push({
    gateId: 'src-valid-0001',
    gateType: 'SOURCE_VALIDATED',
    status: 'OPEN',
    description: `Source ${input.sourceSystem} validated — input source only, no replacement of world2_learning_loop`,
  });

  if (input.sourceSystem === 'WORLD2_LEARNING_LOOP') {
    gates.push({
      gateId: 'src-w2ll-0001',
      gateType: 'WORLD2_LEARNING_LOOP_INPUT',
      status: 'OPEN',
      description: 'World 2 learning loop reused as input source — not duplicated or forked',
    });
  }

  if (input.sourceSystem === 'MISSING_CAPABILITY_DETECTOR') {
    gates.push({
      gateId: 'src-mcd-0001',
      gateType: 'MISSING_CAPABILITY_DETECTOR_INPUT',
      status: 'OPEN',
      description: 'Missing capability detector reused as input source',
    });
  }

  if (input.sourceSystem === 'SAFE_CAPABILITY_ACQUISITION') {
    gates.push({
      gateId: 'src-sca-0001',
      gateType: 'SAFE_CAPABILITY_ACQUISITION_INPUT',
      status: 'OPEN',
      description: 'Safe capability acquisition reused as input source',
    });
  }

  return {
    valid: true,
    blocked: false,
    reason: 'Source validated',
    gates,
    sourceSystem: input.sourceSystem,
  };
}
