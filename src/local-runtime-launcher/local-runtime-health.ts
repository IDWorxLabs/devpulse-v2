/**
 * Local Runtime Launcher V1 — extended brain health payload.
 */

import { buildBrainHealthPayload } from '../command-center-brain/runtime-verification/brain-api-verification.js';
import { getLocalRuntimeServerState, isLocalRuntimeReady } from './local-runtime-server-state.js';

export interface LocalRuntimeHealthPayload {
  brainConnected: boolean;
  endpointReachable: boolean;
  phase: string;
  serverCapability: string;
  buildIntentRouting: boolean;
  postAllowed: boolean;
  respondPath: string;
  healthPath: string;
  timestamp: number;
  serverStartedAt: string;
  serverPid: number;
  port: number;
  registryLoaded: boolean;
  registryPath: string | null;
  projectCount: number;
  activeProjectCount: number;
  runtimeReady: boolean;
  registryError: string | null;
  version: string;
  commit: string | null;
  localRuntimeLauncherVersion: string;
}

export function buildLocalRuntimeHealthPayload(timestamp = Date.now()): LocalRuntimeHealthPayload {
  const base = buildBrainHealthPayload(timestamp);
  const runtime = getLocalRuntimeServerState();
  const ready = isLocalRuntimeReady();

  return {
    ...base,
    brainConnected: ready,
    endpointReachable: ready,
    serverStartedAt: runtime.serverStartedAt,
    serverPid: runtime.serverPid,
    port: runtime.port,
    registryLoaded: runtime.registryLoaded,
    registryPath: runtime.registryPath,
    projectCount: runtime.projectCount,
    activeProjectCount: runtime.activeProjectCount,
    runtimeReady: runtime.runtimeReady,
    registryError: runtime.registryError,
    version: runtime.version,
    commit: runtime.commit,
    localRuntimeLauncherVersion: 'v1',
  };
}
