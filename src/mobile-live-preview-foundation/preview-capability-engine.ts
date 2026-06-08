/**
 * Preview capability engine — classifies allowed/blocked preview capabilities.
 * Foundation only. No execution, file modification, or rendering.
 */

import type { CapabilityClassification, PreviewCapability, PreviewSessionInput } from './types.js';
import {
  CODE_GEN_BLOCKED_CAPABILITIES,
  DEPLOY_BLOCKED_CAPABILITIES,
  EXECUTION_BLOCKED_CAPABILITIES,
  FILE_MOD_BLOCKED_CAPABILITIES,
  KNOWN_PREVIEW_CAPABILITIES,
} from './types.js';

function isKnownCapability(cap: string): cap is PreviewCapability {
  return (KNOWN_PREVIEW_CAPABILITIES as readonly string[]).includes(cap);
}

function isExecutionCapability(cap: string): boolean {
  return (EXECUTION_BLOCKED_CAPABILITIES as readonly string[]).includes(cap);
}

function isFileModCapability(cap: string): boolean {
  return (FILE_MOD_BLOCKED_CAPABILITIES as readonly string[]).includes(cap);
}

function isCodeGenCapability(cap: string): boolean {
  return (CODE_GEN_BLOCKED_CAPABILITIES as readonly string[]).includes(cap);
}

function isDeployCapability(cap: string): boolean {
  return (DEPLOY_BLOCKED_CAPABILITIES as readonly string[]).includes(cap);
}

export function classifyPreviewCapability(
  cap: string,
  input: PreviewSessionInput,
  sourceAvailable: boolean,
  mobileSafe: boolean,
): CapabilityClassification {
  if (isExecutionCapability(cap)) {
    return { capability: cap, allowed: false, blockReason: 'Execution preview request blocked — viewer only' };
  }
  if (isFileModCapability(cap)) {
    return { capability: cap, allowed: false, blockReason: 'File modification preview request blocked' };
  }
  if (isCodeGenCapability(cap)) {
    return { capability: cap, allowed: false, blockReason: 'Code generation preview request blocked' };
  }
  if (isDeployCapability(cap)) {
    return { capability: cap, allowed: false, blockReason: 'Deployment preview request blocked' };
  }
  if (!isKnownCapability(cap)) {
    return { capability: cap, allowed: false, blockReason: 'Unknown preview capability' };
  }
  if (
    (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) ||
    (input.targetProjectId && input.targetProjectId !== input.projectId)
  ) {
    return { capability: cap, allowed: false, blockReason: 'Capability targets another workspace or project' };
  }
  if (!sourceAvailable && cap !== 'VIEW_PREVIEW_WARNINGS' && cap !== 'REQUEST_DESKTOP_PREVIEW_NOTICE') {
    return { capability: cap, allowed: false, blockReason: 'Preview source not available' };
  }
  if (!mobileSafe && cap === 'VIEW_RESPONSIVE_SUMMARY') {
    return { capability: cap, allowed: false, blockReason: 'Responsive summary requires mobile-safe target' };
  }

  return { capability: cap, allowed: true, blockReason: '' };
}

export function evaluatePreviewCapabilities(
  input: PreviewSessionInput,
  sourceAvailable: boolean,
  mobileSafe: boolean,
): { allowed: CapabilityClassification[]; blocked: CapabilityClassification[] } {
  const allowed: CapabilityClassification[] = [];
  const blocked: CapabilityClassification[] = [];

  const capabilities =
    input.requestedPreviewCapabilities.length > 0
      ? input.requestedPreviewCapabilities
      : [...KNOWN_PREVIEW_CAPABILITIES];

  for (const cap of capabilities) {
    const classification = classifyPreviewCapability(cap, input, sourceAvailable, mobileSafe);
    if (classification.allowed) {
      allowed.push(classification);
    } else {
      blocked.push(classification);
    }
  }

  return { allowed, blocked };
}

export function capabilitiesKey(
  allowed: CapabilityClassification[],
  blocked: CapabilityClassification[],
): string {
  const allowedKey = allowed.map((c) => c.capability).sort().join(',');
  const blockedKey = blocked.map((c) => c.capability).sort().join(',');
  return `${allowedKey}|${blockedKey}`;
}
