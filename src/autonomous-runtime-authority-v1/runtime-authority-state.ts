/**
 * Autonomous Runtime Authority V1 — authoritative in-memory + disk state.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  RuntimeAuthorityState,
  RuntimeLaunchPlan,
  VerifyLaunchedRuntimeResult,
} from './runtime-authority-types.js';
import { RUNTIME_AUTHORITY_V1_CONTRACT_VERSION } from './runtime-authority-types.js';

let currentState: RuntimeAuthorityState | null = null;
let launchPlan: RuntimeLaunchPlan | null = null;
let restartCount = 0;

function statePath(repositoryRoot: string): string {
  return join(repositoryRoot, '.aidevengine', 'runtime-authority-state-v1.json');
}

export function resetRuntimeAuthorityStateForTests(): void {
  currentState = null;
  launchPlan = null;
  restartCount = 0;
}

export function recordRuntimeLaunchPlan(plan: RuntimeLaunchPlan): void {
  launchPlan = plan;
}

export function getRuntimeLaunchPlan(): RuntimeLaunchPlan | null {
  return launchPlan;
}

export function incrementRuntimeRestartCount(): number {
  restartCount += 1;
  return restartCount;
}

export function getRuntimeRestartCount(): number {
  return restartCount;
}

export function persistRuntimeAuthorityState(repositoryRoot: string, state: RuntimeAuthorityState): void {
  const dir = join(repositoryRoot, '.aidevengine');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(repositoryRoot), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function readPersistedRuntimeAuthorityState(repositoryRoot: string): RuntimeAuthorityState | null {
  const path = statePath(repositoryRoot);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as RuntimeAuthorityState;
  } catch {
    return null;
  }
}

export function buildRuntimeAuthorityState(input: {
  repositoryRoot: string;
  port: number;
  authoritativePid: number;
  startedAt: string;
  verification: VerifyLaunchedRuntimeResult;
  recoveryActions?: string[];
  phase?: RuntimeAuthorityState['phase'];
}): RuntimeAuthorityState {
  const now = Date.now();
  const startedMs = Date.parse(input.startedAt);
  const ageMs = Number.isFinite(startedMs) ? Math.max(0, now - startedMs) : 0;
  const errors = input.verification.errors.length;
  const warnings = input.verification.warnings.length;

  const state: RuntimeAuthorityState = {
    readOnly: true,
    contractVersion: RUNTIME_AUTHORITY_V1_CONTRACT_VERSION,
    phase: input.phase ?? (input.verification.ok ? 'READY' : 'VERIFYING'),
    authoritativePid: input.authoritativePid,
    port: input.port,
    baseUrl: `http://127.0.0.1:${input.port}`,
    health: input.verification.ok ? (warnings > 0 ? 'DEGRADED' : 'HEALTHY') : 'UNHEALTHY',
    ageMs,
    gitCommit: input.verification.truthProbe.gitCommit,
    sourceFingerprint: input.verification.truthProbe.sourceFingerprint,
    runtimeId: input.verification.truthProbe.runtimeId,
    startedAt: input.verification.truthProbe.startedAt ?? input.startedAt,
    restartCount,
    lastRecoveryAt: launchPlan?.preparedAt ?? null,
    lastRecoveryReason:
      launchPlan?.recoveryActions.length ? launchPlan.recoveryActions.join('; ') : null,
    workspaceRoot: input.repositoryRoot,
    recoveryActions: [
      ...(launchPlan?.recoveryActions ?? []),
      ...(input.recoveryActions ?? []),
    ],
    healthProbes: input.verification.healthProbes,
    truthProbe: input.verification.truthProbe,
    ready: input.verification.ok,
    updatedAt: new Date().toISOString(),
  };

  currentState = state;
  persistRuntimeAuthorityState(input.repositoryRoot, state);
  return state;
}

export function getRuntimeAuthorityState(): RuntimeAuthorityState | null {
  return currentState;
}

export function markRuntimeAuthorityPhase(phase: RuntimeAuthorityState['phase']): void {
  if (!currentState) return;
  currentState = {
    ...currentState,
    phase,
    updatedAt: new Date().toISOString(),
  };
}
