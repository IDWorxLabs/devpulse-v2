/**
 * Acquisition strategy engine — classifies acquisition strategy from mode.
 * Planning only. No acquisition performed.
 */

import type { AcquisitionInput, AcquisitionMode, AcquisitionStrategy } from './types.js';
import { MODE_TO_STRATEGY } from './types.js';

export function classifyAcquisitionStrategy(input: AcquisitionInput, blocked: boolean): AcquisitionStrategy {
  if (blocked) return 'BLOCKED';
  return MODE_TO_STRATEGY[input.requestedAcquisitionMode];
}

export function strategyKey(mode: AcquisitionMode, strategy: AcquisitionStrategy): string {
  return `${mode}|${strategy}`;
}

export function isResearchStrategy(strategy: AcquisitionStrategy): boolean {
  return strategy === 'RESEARCH';
}

export function isDeferStrategy(strategy: AcquisitionStrategy): boolean {
  return strategy === 'DEFER';
}

export function isBuildStrategy(strategy: AcquisitionStrategy): boolean {
  return strategy.startsWith('PLAN_') && strategy !== 'PLAN_DEPENDENCY_REVIEW' && strategy !== 'PLAN_EXTERNAL_TOOL_REVIEW'
    ? true
    : strategy === 'PLAN_INTERNAL_BUILD'
      || strategy === 'PLAN_DIAGNOSTIC_LAYER'
      || strategy === 'PLAN_VERIFICATION_LAYER'
      || strategy === 'PLAN_SIMULATION_LAYER'
      || strategy === 'PLAN_PREVIEW_LAYER'
      || strategy === 'PLAN_GOVERNANCE_LAYER';
}

export function isLayerStrategy(strategy: AcquisitionStrategy): boolean {
  return [
    'PLAN_DIAGNOSTIC_LAYER',
    'PLAN_VERIFICATION_LAYER',
    'PLAN_SIMULATION_LAYER',
    'PLAN_PREVIEW_LAYER',
    'PLAN_GOVERNANCE_LAYER',
  ].includes(strategy);
}

export function isDependencyStrategy(strategy: AcquisitionStrategy): boolean {
  return strategy === 'PLAN_DEPENDENCY_REVIEW';
}

export function isExternalToolStrategy(strategy: AcquisitionStrategy): boolean {
  return strategy === 'PLAN_EXTERNAL_TOOL_REVIEW';
}
