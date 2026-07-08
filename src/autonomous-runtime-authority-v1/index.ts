/**
 * Autonomous Runtime Authority V1 — orchestration entrypoints.
 */

export {
  RUNTIME_AUTHORITY_V1_PASS_TOKEN,
  RUNTIME_AUTHORITY_V1_CONTRACT_VERSION,
  type RuntimeAuthorityPhase,
  type RuntimeAuthorityState,
  type RuntimeLaunchPlan,
  type DiscoveredRuntimeProcess,
  type VerifyLaunchedRuntimeResult,
} from './runtime-authority-types.js';

export {
  discoverRepositoryRuntimes,
  isRepositoryAiDevEngineCommandLine,
  isRuntimeConsolidationKillTarget,
  discoverPortListenersInRange,
} from './runtime-process-discovery.js';

export { prepareAutonomousRuntimeLaunch, findNextFreePort } from './port-authority.js';

export {
  verifyLaunchedRuntime,
  waitForRuntimeReady,
  probeRuntimeTruth,
} from './runtime-health-gate.js';

export {
  buildRuntimeAuthorityState,
  getRuntimeAuthorityState,
  getRuntimeLaunchPlan,
  getRuntimeRestartCount,
  incrementRuntimeRestartCount,
  markRuntimeAuthorityPhase,
  persistRuntimeAuthorityState,
  readPersistedRuntimeAuthorityState,
  recordRuntimeLaunchPlan,
  resetRuntimeAuthorityStateForTests,
} from './runtime-authority-state.js';

export {
  launchAuthoritativeServerChild,
  forwardShutdownSignalsToChild,
  terminateAuthoritativeServerChild,
  waitForAuthoritativeServerChildExit,
} from './runtime-process-launcher.js';

import { FOUNDER_REALITY_PORT } from '../../server/founder-reality-manifest.js';
import { prepareAutonomousRuntimeLaunch } from './port-authority.js';
import { waitForRuntimeReady } from './runtime-health-gate.js';
import {
  buildRuntimeAuthorityState,
  getRuntimeAuthorityState,
  getRuntimeLaunchPlan,
  markRuntimeAuthorityPhase,
  recordRuntimeLaunchPlan,
} from './runtime-authority-state.js';
import { RUNTIME_AUTHORITY_V1_CONTRACT_VERSION, type RuntimeAuthorityState } from './runtime-authority-types.js';

export function isRuntimeAuthorityBypassed(): boolean {
  return process.env.AIDEVENGINE_RUNTIME_AUTHORITY_BYPASS === '1';
}

export function resolveManagedRuntimePort(fallback = FOUNDER_REALITY_PORT): number {
  const envPort = Number(process.env.AIDEVENGINE_RUNTIME_AUTHORITY_PORT);
  return Number.isFinite(envPort) && envPort > 0 ? envPort : fallback;
}

export async function bootstrapAutonomousRuntimeAuthority(input: {
  repositoryRoot: string;
  currentPid: number;
  preferredPort?: number;
}): Promise<{ port: number; plan: Awaited<ReturnType<typeof prepareAutonomousRuntimeLaunch>> }> {
  if (isRuntimeAuthorityBypassed()) {
    const port = resolveManagedRuntimePort(input.preferredPort);
    return {
      port,
      plan: {
        readOnly: true,
        contractVersion: RUNTIME_AUTHORITY_V1_CONTRACT_VERSION,
        preferredPort: input.preferredPort ?? FOUNDER_REALITY_PORT,
        resolvedPort: port,
        portShifted: false,
        displacedForeignProcess: false,
        eliminatedPids: [],
        eliminatedPorts: [],
        discoveredRuntimes: [],
        recoveryActions: ['Runtime Authority bypassed for validator/ephemeral mode'],
        repositoryRoot: input.repositoryRoot,
        preparedAt: new Date().toISOString(),
      },
    };
  }

  markRuntimeAuthorityPhase('DISCOVERING');
  const plan = await prepareAutonomousRuntimeLaunch({
    repositoryRoot: input.repositoryRoot,
    preferredPort: input.preferredPort ?? FOUNDER_REALITY_PORT,
    currentPid: input.currentPid,
  });
  recordRuntimeLaunchPlan(plan);
  process.env.AIDEVENGINE_RUNTIME_AUTHORITY_PORT = String(plan.resolvedPort);
  process.env.AIDEVENGINE_RUNTIME_AUTHORITY_MANAGED = '1';
  return { port: plan.resolvedPort, plan };
}

export async function finalizeAutonomousRuntimeAuthority(input: {
  repositoryRoot: string;
  port: number;
  authoritativePid: number;
  startedAt: string;
}): Promise<RuntimeAuthorityState> {
  markRuntimeAuthorityPhase('VERIFYING');
  const baseUrl = `http://127.0.0.1:${input.port}`;
  const verification = await waitForRuntimeReady({
    baseUrl,
    repositoryRoot: input.repositoryRoot,
    timeoutMs: 45_000,
  });

  const state = buildRuntimeAuthorityState({
    repositoryRoot: input.repositoryRoot,
    port: input.port,
    authoritativePid: input.authoritativePid,
    startedAt: input.startedAt,
    verification,
    phase: verification.ok ? 'READY' : 'FAILED',
  });

  if (!verification.ok) {
    console.error('[runtime-authority] Runtime verification failed:');
    for (const error of verification.errors) console.error(`  - ${error}`);
    for (const warning of verification.warnings) console.warn(`  - ${warning}`);
  }

  return state;
}

export function buildRuntimeAuthorityApiPayload(): Record<string, unknown> {
  const state = getRuntimeAuthorityState();
  return {
    ok: state?.ready ?? false,
    contractVersion: RUNTIME_AUTHORITY_V1_CONTRACT_VERSION,
    managed: process.env.AIDEVENGINE_RUNTIME_AUTHORITY_MANAGED === '1',
    bypassed: isRuntimeAuthorityBypassed(),
    state,
    launchPlan: getRuntimeLaunchPlan(),
  };
}
