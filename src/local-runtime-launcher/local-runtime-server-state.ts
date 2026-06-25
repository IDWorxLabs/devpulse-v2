/**
 * Local Runtime Launcher V1 — in-process server readiness state.
 */

import type { ProjectRegistryFile } from '../project-registry-v1/project-registry-v1-types.js';
import { getProjectRegistryV1FilePath } from '../project-registry-v1/project-registry-v1-store.js';

export const LOCAL_RUNTIME_LAUNCHER_VERSION = 'v1';
export const LOCAL_RUNTIME_LAUNCHER_PASS_TOKEN = 'LOCAL_RUNTIME_LAUNCHER_V1_PASS';

export interface LocalRuntimeServerState {
  serverStartedAt: string;
  serverPid: number;
  port: number;
  registryLoaded: boolean;
  registryPath: string | null;
  projectCount: number;
  activeProjectCount: number;
  registryError: string | null;
  runtimeReady: boolean;
  version: string;
  commit: string | null;
}

let runtimeState: LocalRuntimeServerState = {
  serverStartedAt: new Date().toISOString(),
  serverPid: process.pid,
  port: 4321,
  registryLoaded: false,
  registryPath: null,
  projectCount: 0,
  activeProjectCount: 0,
  registryError: null,
  runtimeReady: false,
  version: '0.0.0',
  commit: null,
};

export function configureLocalRuntimeMetadata(input: {
  port: number;
  version: string;
  commit?: string | null;
  serverStartedAt?: string;
}): void {
  runtimeState = {
    ...runtimeState,
    port: input.port,
    version: input.version,
    commit: input.commit ?? null,
    serverStartedAt: input.serverStartedAt ?? runtimeState.serverStartedAt,
    serverPid: process.pid,
  };
}

export function markLocalRuntimeRegistryReady(input: {
  rootDir: string;
  state: ProjectRegistryFile;
}): void {
  const activeProjectCount = input.state.projects.filter((project) => project.status === 'ACTIVE').length;
  runtimeState = {
    ...runtimeState,
    registryLoaded: true,
    registryPath: getProjectRegistryV1FilePath(input.rootDir),
    projectCount: input.state.projects.length,
    activeProjectCount,
    registryError: null,
    runtimeReady: true,
  };
}

export function markLocalRuntimeRegistryFailed(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  runtimeState = {
    ...runtimeState,
    registryLoaded: false,
    registryPath: null,
    projectCount: 0,
    activeProjectCount: 0,
    registryError: message,
    runtimeReady: false,
  };
}

export function getLocalRuntimeServerState(): LocalRuntimeServerState {
  return { ...runtimeState };
}

export function isLocalRuntimeReady(): boolean {
  return runtimeState.runtimeReady && runtimeState.registryLoaded && !runtimeState.registryError;
}

export function isLocalRuntimeHealthStale(payload: Record<string, unknown>): boolean {
  if (payload.buildIntentRouting !== true) return true;
  if (payload.registryLoaded !== true) return true;
  if (payload.runtimeReady !== true) return true;
  return false;
}
