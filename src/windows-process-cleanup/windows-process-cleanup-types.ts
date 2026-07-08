/**
 * General Windows Process Cleanup V1 — shared types and pass token.
 */

import type { ChildProcess } from 'node:child_process';

export const WINDOWS_PROCESS_CLEANUP_V1_PASS_TOKEN = 'WINDOWS_PROCESS_CLEANUP_V1_PASS' as const;

export const DEFAULT_GRACEFUL_STOP_MS = 3_000;
export const DEFAULT_FORCE_STOP_MS = 8_000;

export interface ManagedProcessStopResult {
  pid: number | null;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  graceful: boolean;
  forced: boolean;
  timedOut: boolean;
}

export interface SpawnManagedProcessOptions {
  label?: string;
  executable: string;
  args: readonly string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  gracefulStopMs?: number;
  forceStopMs?: number;
  stdio?: 'pipe' | 'ignore';
}

export interface ManagedProcessHandle {
  label: string;
  pid: number | null;
  child: ChildProcess;
  stdout: string;
  stderr: string;
  startedAt: number;
  stop: (options?: { gracefulStopMs?: number; forceStopMs?: number }) => Promise<ManagedProcessStopResult>;
}

export interface PortListenerInfo {
  port: number;
  pids: number[];
  listening: boolean;
}
