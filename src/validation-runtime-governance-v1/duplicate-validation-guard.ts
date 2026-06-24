/**
 * Validation Runtime Governance V1 — duplicate validation prevention guard.
 */

import type { DuplicationKind } from './validation-runtime-governance-types.js';

export interface DuplicationAttempt {
  kind: DuplicationKind;
  validatorName: string;
  resourceKey: string;
}

export interface DuplicationGuardSession {
  sessionId: string;
  executedValidators: Set<string>;
  npmInstallKeys: Set<string>;
  npmBuildKeys: Set<string>;
  previewKeys: Set<string>;
  uvlKeys: Set<string>;
  aflaKeys: Set<string>;
  playwrightKeys: Set<string>;
  reusableEvidence: Map<string, { source: string; passToken: string; valid: boolean }>;
}

export interface DuplicationGuardResult {
  allowed: boolean;
  blocked: boolean;
  reason: string;
  reuseAvailable: boolean;
  reuseSource?: string;
}

let activeSession: DuplicationGuardSession | null = null;

export function createDuplicationGuardSession(sessionId?: string): DuplicationGuardSession {
  activeSession = {
    sessionId: sessionId ?? `gov-${Date.now()}`,
    executedValidators: new Set(),
    npmInstallKeys: new Set(),
    npmBuildKeys: new Set(),
    previewKeys: new Set(),
    uvlKeys: new Set(),
    aflaKeys: new Set(),
    playwrightKeys: new Set(),
    reusableEvidence: new Map(),
  };
  return activeSession;
}

export function getActiveDuplicationGuardSession(): DuplicationGuardSession | null {
  return activeSession;
}

export function registerReusableEvidence(
  session: DuplicationGuardSession,
  key: string,
  source: string,
  passToken: string,
): void {
  session.reusableEvidence.set(key, { source, passToken, valid: true });
}

function checkKeySet(
  session: DuplicationGuardSession,
  set: Set<string>,
  key: string,
  kind: DuplicationKind,
  validatorName: string,
): DuplicationGuardResult {
  if (set.has(key)) {
    const evidenceKey = `${kind}:${key}`;
    const evidence = session.reusableEvidence.get(evidenceKey);
    if (evidence?.valid) {
      return {
        allowed: false,
        blocked: true,
        reason: `Duplicate ${kind} blocked — reusable evidence exists from ${evidence.source}.`,
        reuseAvailable: true,
        reuseSource: evidence.source,
      };
    }
    return {
      allowed: false,
      blocked: true,
      reason: `Duplicate ${kind} blocked for ${validatorName} — ${key} already executed in session ${session.sessionId}.`,
      reuseAvailable: false,
    };
  }
  set.add(key);
  return {
    allowed: true,
    blocked: false,
    reason: `First ${kind} for ${key} in session.`,
    reuseAvailable: false,
  };
}

export function assertNoDuplicateValidation(
  session: DuplicationGuardSession,
  attempt: DuplicationAttempt,
): DuplicationGuardResult {
  if (session.executedValidators.has(attempt.validatorName)) {
    return {
      allowed: false,
      blocked: true,
      reason: `Duplicate validator execution blocked: ${attempt.validatorName} already ran in session ${session.sessionId}.`,
      reuseAvailable: false,
    };
  }

  switch (attempt.kind) {
    case 'NPM_INSTALL':
      return checkKeySet(session, session.npmInstallKeys, attempt.resourceKey, attempt.kind, attempt.validatorName);
    case 'NPM_BUILD':
      return checkKeySet(session, session.npmBuildKeys, attempt.resourceKey, attempt.kind, attempt.validatorName);
    case 'PREVIEW_STARTUP':
      return checkKeySet(session, session.previewKeys, attempt.resourceKey, attempt.kind, attempt.validatorName);
    case 'UVL_EXECUTION':
      return checkKeySet(session, session.uvlKeys, attempt.resourceKey, attempt.kind, attempt.validatorName);
    case 'AFLA_EXECUTION':
      return checkKeySet(session, session.aflaKeys, attempt.resourceKey, attempt.kind, attempt.validatorName);
    case 'PLAYWRIGHT_EXECUTION':
      return checkKeySet(session, session.playwrightKeys, attempt.resourceKey, attempt.kind, attempt.validatorName);
    default:
      return { allowed: true, blocked: false, reason: 'Unknown duplication kind — allowed.', reuseAvailable: false };
  }
}

export function markValidatorExecuted(session: DuplicationGuardSession, validatorName: string): void {
  session.executedValidators.add(validatorName);
}

export function detectDuplicatePatternsFromMetrics(
  metrics: readonly { validatorName: string; workPatterns: Record<string, number> }[],
): Array<{ kind: DuplicationKind; count: number; validators: string[] }> {
  const patterns: Array<{ kind: DuplicationKind; key: keyof typeof metrics[0]['workPatterns'] }> = [
    { kind: 'NPM_INSTALL', key: 'npmInstallCount' },
    { kind: 'NPM_BUILD', key: 'npmBuildCount' },
    { kind: 'PREVIEW_STARTUP', key: 'previewServerCount' },
    { kind: 'UVL_EXECUTION', key: 'uvlExecutionCount' },
    { kind: 'AFLA_EXECUTION', key: 'aflaExecutionCount' },
    { kind: 'PLAYWRIGHT_EXECUTION', key: 'playwrightExecutionCount' },
  ];

  return patterns
    .map(({ kind, key }) => {
      const validators = metrics
        .filter((m) => (m.workPatterns[key] ?? 0) > 0)
        .map((m) => m.validatorName);
      return { kind, count: validators.length, validators: validators.slice(0, 10) };
    })
    .filter((p) => p.count >= 2);
}
