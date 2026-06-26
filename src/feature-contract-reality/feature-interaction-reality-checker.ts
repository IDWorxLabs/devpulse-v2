/**
 * Feature Contract Reality V1 — interaction signal detection.
 */

import { readFileSync } from 'node:fs';

const INTERACTION_MARKERS = [
  'data-interaction-control',
  '<button',
  '<input',
  '<select',
  '<form',
  'data-action',
  'onClick',
  'type="button"',
  'type="submit"',
];

export function isInformationalFeatureModule(featureId: string): boolean {
  return new Set([
    'dashboard',
    'reports',
    'charts',
    'analytics',
    'code-history',
    'history',
  ]).has(featureId);
}

export function readValidationInteractionMode(validationSource: string): 'informational' | 'interactive' | null {
  if (/interactionMode:\s*['"]informational['"]/.test(validationSource)) return 'informational';
  if (/interactionMode:\s*['"]interactive['"]/.test(validationSource)) return 'interactive';
  return null;
}

export function checkFeatureInteractionReality(input: {
  featureId: string;
  componentSource: string;
  validationSource: string;
}): {
  interactive: boolean;
  informationalOnly: boolean;
  missingEvidence: string[];
  failureReasons: string[];
} {
  const missingEvidence: string[] = [];
  const failureReasons: string[] = [];
  const interactionMode =
    readValidationInteractionMode(input.validationSource) ??
    (isInformationalFeatureModule(input.featureId) ? 'informational' : 'interactive');

  if (interactionMode === 'informational') {
    if (!/interactionMode:\s*['"]informational['"]/.test(input.validationSource)) {
      missingEvidence.push('validation interactionMode informational not explicit');
    }
    return {
      interactive: true,
      informationalOnly: true,
      missingEvidence,
      failureReasons,
    };
  }

  if (!input.componentSource.includes('data-interaction-control')) {
    missingEvidence.push('data-interaction-control marker missing');
    failureReasons.push('Interactive feature lacks data-interaction-control signal');
    return {
      interactive: false,
      informationalOnly: false,
      missingEvidence,
      failureReasons,
    };
  }

  const hasInteractionMarker = INTERACTION_MARKERS.some((marker) =>
    input.componentSource.includes(marker),
  );

  if (!hasInteractionMarker) {
    missingEvidence.push('interaction control marker missing');
    failureReasons.push('Interactive feature lacks button/input/form interaction signal');
    return {
      interactive: false,
      informationalOnly: false,
      missingEvidence,
      failureReasons,
    };
  }

  return {
    interactive: true,
    informationalOnly: false,
    missingEvidence,
    failureReasons,
  };
}

export function readFileUtf8(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}
