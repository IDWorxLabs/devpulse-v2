/**
 * Autonomous Runtime Authority V1 — discover AiDevEngine processes for this repository.
 */

import { execSync } from 'node:child_process';
import { findPortListeners } from '../windows-process-cleanup/port-process-killer.js';
import type { DiscoveredRuntimeProcess, RuntimeProcessKind } from './runtime-authority-types.js';

const RUNTIME_MARKERS = [
  'founder-reality-server',
  'founder-reality-dev-entry',
  'autonomous-runtime-authority',
] as const;

const PREVIEW_MARKERS = ['vite', 'generated-dev-server', 'live-preview'] as const;

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase();
}

export function isRepositoryAiDevEngineCommandLine(commandLine: string, repositoryRoot: string): boolean {
  const normalized = normalizePath(commandLine);
  const root = normalizePath(repositoryRoot);
  if (!normalized.includes(root)) return false;
  if (RUNTIME_MARKERS.some((marker) => normalized.includes(marker))) return true;
  if (normalized.includes('npm run dev') || normalized.includes('npm run start')) return true;
  if (normalized.includes('tsx') && normalized.includes('server/')) return true;
  return false;
}

/** Kill targets must be actual server processes — never npm/cmd parents or the dev supervisor. */
export function isRuntimeConsolidationKillTarget(commandLine: string, repositoryRoot: string): boolean {
  const normalized = commandLine.toLowerCase();
  const root = normalizePath(repositoryRoot);
  if (!normalizePath(commandLine).includes(root)) return false;
  if (normalized.includes('founder-reality-dev-entry')) return false;
  return normalized.includes('founder-reality-server');
}

function classifyRuntimeKind(commandLine: string): RuntimeProcessKind {
  const normalized = commandLine.toLowerCase();
  if (normalized.includes('founder-reality-server')) return 'founder-reality-server';
  if (normalized.includes('founder-reality-dev-entry')) return 'dev-entry';
  if (normalized.includes('vite')) return 'vite';
  if (PREVIEW_MARKERS.some((marker) => normalized.includes(marker))) return 'preview';
  if (normalized.includes('tsx')) return 'tsx';
  if (normalized.includes('node')) return 'node';
  return 'unknown';
}

function parseWindowsProcessJson(output: string): Map<number, string> {
  const byPid = new Map<number, string>();
  const trimmed = output.trim();
  if (!trimmed) return byPid;
  try {
    const parsed = JSON.parse(trimmed) as
      | { ProcessId?: number; CommandLine?: string | null }
      | Array<{ ProcessId?: number; CommandLine?: string | null }>;
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    for (const row of rows) {
      const pid = Number(row?.ProcessId);
      if (!Number.isFinite(pid) || pid <= 0) continue;
      byPid.set(pid, String(row?.CommandLine ?? '').trim());
    }
  } catch {
    /* malformed output */
  }
  return byPid;
}

/** One PowerShell round-trip for all node/tsx processes — avoids per-pid spawn storms on Windows. */
export function readAllNodeFamilyCommandLines(): Map<number, string> {
  if (process.platform === 'win32') {
    try {
      const output = execSync(
        `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='node.exe' OR Name='tsx.exe'\\" | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress"`,
        { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      );
      return parseWindowsProcessJson(output);
    } catch {
      return new Map();
    }
  }

  const byPid = new Map<number, string>();
  try {
    const output = execSync(`ps -ax -o pid=,command=`, { encoding: 'utf8' });
    for (const line of output.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^(\d+)\s+(.*)$/);
      if (!match) continue;
      const pid = Number(match[1]);
      const commandLine = match[2]?.trim() ?? '';
      if (!Number.isFinite(pid) || pid <= 0) continue;
      if (!/\b(node|tsx)\b/i.test(commandLine)) continue;
      byPid.set(pid, commandLine);
    }
  } catch {
    /* none */
  }
  return byPid;
}

function readUnixCommandLine(pid: number): string {
  try {
    return execSync(`ps -p ${pid} -o command=`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

export function readCommandLineForPid(pid: number, cache?: Map<number, string>): string {
  if (cache?.has(pid)) return cache.get(pid) ?? '';
  if (process.platform !== 'win32') return readUnixCommandLine(pid);
  try {
    return execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
      { encoding: 'utf8', windowsHide: true },
    ).trim();
  } catch {
    return '';
  }
}

export function discoverPortListenersInRange(startPort: number, endPort: number): Map<number, number[]> {
  const byPort = new Map<number, number[]>();
  for (let port = startPort; port <= endPort; port += 1) {
    const listeners = findPortListeners(port);
    if (listeners.pids.length > 0) byPort.set(port, [...listeners.pids]);
  }
  return byPort;
}

export function discoverRepositoryRuntimes(input: {
  repositoryRoot: string;
  preferredPort: number;
  portScanMax?: number;
}): DiscoveredRuntimeProcess[] {
  const scanMax = input.portScanMax ?? 20;
  const startPort = input.preferredPort;
  const endPort = input.preferredPort + scanMax;
  const byPid = new Map<number, DiscoveredRuntimeProcess>();

  const commandLines = readAllNodeFamilyCommandLines();
  const portMap = discoverPortListenersInRange(startPort, endPort);
  for (const [port, pids] of portMap.entries()) {
    for (const pid of pids) {
      const commandLine = readCommandLineForPid(pid, commandLines);
      const belongs = isRepositoryAiDevEngineCommandLine(commandLine, input.repositoryRoot);
      if (!belongs && !commandLine) continue;
      const existing = byPid.get(pid);
      byPid.set(pid, {
        readOnly: true,
        pid,
        port: existing?.port ?? port,
        commandLine: commandLine || existing?.commandLine || `pid ${pid}`,
        belongsToRepository: belongs,
        runtimeKind: classifyRuntimeKind(commandLine),
        startedAt: null,
      });
    }
  }

  for (const [pid, commandLine] of commandLines.entries()) {
    if (!isRepositoryAiDevEngineCommandLine(commandLine, input.repositoryRoot)) continue;
    if (!byPid.has(pid)) {
      byPid.set(pid, {
        readOnly: true,
        pid,
        port: null,
        commandLine,
        belongsToRepository: true,
        runtimeKind: classifyRuntimeKind(commandLine),
        startedAt: null,
      });
    }
  }

  return [...byPid.values()].sort((left, right) => left.pid - right.pid);
}

export function isForeignPortOccupant(commandLine: string, repositoryRoot: string): boolean {
  if (!commandLine.trim()) return true;
  return !isRepositoryAiDevEngineCommandLine(commandLine, repositoryRoot);
}
