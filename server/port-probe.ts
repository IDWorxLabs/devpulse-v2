/**
 * Port probe utilities — detect listeners and process ownership.
 */

import { execSync } from 'node:child_process';

export interface PortOwnerInfo {
  port: number;
  listening: boolean;
  listenerCount: number;
  pids: number[];
  intendedAiDevEngine: boolean;
  commandLines: string[];
}

function parseWindowsPortOwners(port: number): PortOwnerInfo {
  const pids = new Set<number>();
  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' });
    for (const line of output.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (Number.isFinite(pid) && pid > 0) pids.add(pid);
    }
  } catch {
    /* no listeners */
  }

  const commandLines: string[] = [];
  let intendedAiDevEngine = false;
  for (const pid of pids) {
    try {
      const ps = execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
        { encoding: 'utf8' },
      ).trim();
      if (ps) {
        commandLines.push(`pid ${pid}: ${ps}`);
        if (ps.includes('founder-reality-server')) intendedAiDevEngine = true;
      }
    } catch {
      commandLines.push(`pid ${pid}: (command line unavailable)`);
    }
  }

  return {
    port,
    listening: pids.size > 0,
    listenerCount: pids.size,
    pids: [...pids],
    intendedAiDevEngine,
    commandLines,
  };
}

export function probePortOwner(port: number): PortOwnerInfo {
  if (process.platform === 'win32') return parseWindowsPortOwners(port);
  try {
    const output = execSync(`netstat -an | grep ":${port} "`, { encoding: 'utf8' });
    const listening = output.includes('LISTEN');
    return {
      port,
      listening,
      listenerCount: listening ? 1 : 0,
      pids: [],
      intendedAiDevEngine: listening,
      commandLines: listening ? [`port ${port} listening (non-Windows probe)`] : [],
    };
  } catch {
    return {
      port,
      listening: false,
      listenerCount: 0,
      pids: [],
      intendedAiDevEngine: false,
      commandLines: [],
    };
  }
}
