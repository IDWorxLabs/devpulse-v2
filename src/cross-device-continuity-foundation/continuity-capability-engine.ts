/**
 * Continuity capability engine — classifies allowed/blocked continuity capabilities.
 * Foundation only. No file sync, execution, or duplicate truth.
 */

import type { CapabilityClassification, ContinuityCapability, ContinuityInput, ContinuityScope } from './types.js';
import {
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  DUPLICATE_TRUTH_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  KNOWN_CONTINUITY_CAPABILITIES,
  SCOPE_CAPABILITY_MAP,
} from './types.js';

function isKnownCapability(cap: string): cap is ContinuityCapability {
  return (KNOWN_CONTINUITY_CAPABILITIES as readonly string[]).includes(cap);
}

function detectBlockedPattern(text: string, patterns: readonly string[]): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (lower.includes(pattern)) return pattern;
  }
  return null;
}

function scopeAllowsCapability(scope: ContinuityScope, cap: ContinuityCapability): boolean {
  const allowed = SCOPE_CAPABILITY_MAP[scope];
  return allowed.includes(cap);
}

export function classifyContinuityCapability(
  cap: string,
  input: ContinuityInput,
  scope: ContinuityScope,
  scopeValid: boolean,
): CapabilityClassification {
  const notes = `${input.handoffNotes ?? ''} ${cap}`.toLowerCase();

  if (detectBlockedPattern(notes, EXECUTION_BLOCKED_PATTERNS)) {
    return { capability: cap, allowed: false, blockReason: 'Execution continuity request blocked — context only' };
  }
  if (detectBlockedPattern(notes, FILE_MOD_BLOCKED_PATTERNS)) {
    return { capability: cap, allowed: false, blockReason: 'File transfer / duplicate state request blocked' };
  }
  if (detectBlockedPattern(notes, CODE_GEN_BLOCKED_PATTERNS)) {
    return { capability: cap, allowed: false, blockReason: 'Code generation continuity request blocked' };
  }
  if (detectBlockedPattern(notes, DEPLOY_BLOCKED_PATTERNS)) {
    return { capability: cap, allowed: false, blockReason: 'Deployment continuity request blocked' };
  }
  if (detectBlockedPattern(notes, DUPLICATE_TRUTH_BLOCKED_PATTERNS)) {
    return { capability: cap, allowed: false, blockReason: 'Duplicate truth continuity request blocked' };
  }

  if (!isKnownCapability(cap)) {
    return { capability: cap, allowed: false, blockReason: 'Unknown continuity capability' };
  }

  if (
    (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) ||
    (input.targetProjectId && input.targetProjectId !== input.projectId)
  ) {
    return { capability: cap, allowed: false, blockReason: 'Capability targets another workspace or project' };
  }

  if (!scopeValid) {
    return { capability: cap, allowed: false, blockReason: 'Continuity scope not validated' };
  }

  if (!scopeAllowsCapability(scope, cap)) {
    return { capability: cap, allowed: false, blockReason: `Capability not allowed for scope ${scope}` };
  }

  return { capability: cap, allowed: true, blockReason: '' };
}

export function evaluateContinuityCapabilities(
  input: ContinuityInput,
  scope: ContinuityScope,
  scopeValid: boolean,
): { allowed: CapabilityClassification[]; blocked: CapabilityClassification[] } {
  const allowed: CapabilityClassification[] = [];
  const blocked: CapabilityClassification[] = [];

  const capabilities =
    input.requestedContinuityCapabilities.length > 0
      ? input.requestedContinuityCapabilities
      : [...KNOWN_CONTINUITY_CAPABILITIES];

  for (const cap of capabilities) {
    const classification = classifyContinuityCapability(cap, input, scope, scopeValid);
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
  const allowedKeys = allowed.map((c) => c.capability).sort().join(',');
  const blockedKeys = blocked.map((c) => c.capability).sort().join(',');
  return `allowed:${allowedKeys}|blocked:${blockedKeys}`;
}
