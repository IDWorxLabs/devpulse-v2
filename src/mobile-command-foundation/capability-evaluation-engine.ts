/**
 * Capability evaluation engine — classifies requested mobile capabilities.
 * Foundation only. No execution, file modification, or code generation.
 */

import type {
  CapabilityClassification,
  GovernanceStatus,
  MobileCapability,
  MobileSessionInput,
} from './types.js';
import {
  APPROVAL_REQUIRED_CAPABILITIES,
  CODE_GEN_BLOCKED_CAPABILITIES,
  COMMAND_INTENT_CAPABILITIES,
  DEPLOY_BLOCKED_CAPABILITIES,
  EXECUTION_BLOCKED_CAPABILITIES,
  FILE_MOD_BLOCKED_CAPABILITIES,
  KNOWN_CAPABILITIES,
  READ_ONLY_CAPABILITIES,
} from './types.js';

function isKnownCapability(cap: string): cap is MobileCapability {
  return (KNOWN_CAPABILITIES as readonly string[]).includes(cap);
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

function requiresApproval(cap: string): boolean {
  return (APPROVAL_REQUIRED_CAPABILITIES as readonly string[]).includes(cap);
}

function isReadOnly(cap: MobileCapability): boolean {
  return (READ_ONLY_CAPABILITIES as readonly string[]).includes(cap);
}

function isCommandIntent(cap: MobileCapability): boolean {
  return (COMMAND_INTENT_CAPABILITIES as readonly string[]).includes(cap);
}

export function classifyCapability(
  cap: string,
  input: MobileSessionInput,
  governanceReady: boolean,
): CapabilityClassification {
  if (isExecutionCapability(cap)) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'Execution capability blocked — mobile is command surface only',
      intentOnly: false,
    };
  }
  if (isFileModCapability(cap)) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'File modification capability blocked — no local file changes',
      intentOnly: false,
    };
  }
  if (isCodeGenCapability(cap)) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'Code generation capability blocked — AiDev Engine performs work in cloud',
      intentOnly: false,
    };
  }
  if (isDeployCapability(cap)) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'Deployment capability blocked — no local or mobile deployment',
      intentOnly: false,
    };
  }
  if (!isKnownCapability(cap)) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'Unknown capability',
      intentOnly: false,
    };
  }
  if (
    (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) ||
    (input.targetProjectId && input.targetProjectId !== input.projectId)
  ) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'Capability targets another workspace or project',
      intentOnly: false,
    };
  }
  if (requiresApproval(cap) && !governanceReady) {
    return {
      capability: cap,
      allowed: false,
      blockReason: 'Capability requires governance approval — governance not ready',
      intentOnly: false,
    };
  }

  const intentOnly = isCommandIntent(cap);
  const readOnly = isReadOnly(cap);

  if (intentOnly || readOnly) {
    return {
      capability: cap,
      allowed: true,
      blockReason: '',
      intentOnly,
    };
  }

  return {
    capability: cap,
    allowed: true,
    blockReason: '',
    intentOnly: false,
  };
}

export function evaluateCapabilities(
  input: MobileSessionInput,
  governanceStatus: GovernanceStatus,
): { allowed: CapabilityClassification[]; blocked: CapabilityClassification[] } {
  const governanceReady = governanceStatus === 'PASS';
  const allowed: CapabilityClassification[] = [];
  const blocked: CapabilityClassification[] = [];

  for (const cap of input.requestedCapabilities) {
    const classification = classifyCapability(cap, input, governanceReady);
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
  const blockedKey = blocked.map((c) => `${c.capability}:${c.blockReason}`).sort().join(',');
  return `${allowedKey}|${blockedKey}`;
}

export function isProjectRequestCapability(cap: string): boolean {
  return (
    cap === 'CREATE_PROJECT_REQUEST' ||
    cap === 'START_WORLD1_PROJECT' ||
    cap === 'START_WORLD2_PROJECT' ||
    cap === 'SEND_PROJECT_VISION'
  );
}
