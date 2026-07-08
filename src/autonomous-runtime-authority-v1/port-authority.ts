/**
 * Autonomous Runtime Authority V1 — port resolution and duplicate consolidation.
 */

import { findPortListeners, killProcessTreeByPid } from '../windows-process-cleanup/port-process-killer.js';
import { settleEventLoop } from '../windows-process-cleanup/child-stream-utils.js';
import {
  discoverRepositoryRuntimes,
  isForeignPortOccupant,
  isRuntimeConsolidationKillTarget,
  readAllNodeFamilyCommandLines,
  readCommandLineForPid,
} from './runtime-process-discovery.js';
import type { PrepareRuntimeLaunchInput, RuntimeLaunchPlan } from './runtime-authority-types.js';
import { RUNTIME_AUTHORITY_V1_CONTRACT_VERSION } from './runtime-authority-types.js';

async function terminatePid(pid: number, currentPid: number): Promise<boolean> {
  if (pid === currentPid) return false;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', windowsHide: true });
    } catch {
      return false;
    }
    await settleEventLoop();
    return true;
  }
  await killProcessTreeByPid(pid);
  await settleEventLoop();
  return true;
}

export async function prepareAutonomousRuntimeLaunch(
  input: PrepareRuntimeLaunchInput,
): Promise<RuntimeLaunchPlan> {
  const portScanMax = input.portScanMax ?? 20;
  const recoveryActions: string[] = [];
  const eliminatedPids: number[] = [];
  const eliminatedPorts: number[] = [];

  const commandLines = readAllNodeFamilyCommandLines();

  const discovered = discoverRepositoryRuntimes({
    repositoryRoot: input.repositoryRoot,
    preferredPort: input.preferredPort,
    portScanMax,
  });

  const repoRuntimes = discovered.filter(
    (runtime) => runtime.belongsToRepository && isRuntimeConsolidationKillTarget(runtime.commandLine, input.repositoryRoot),
  );
  for (const runtime of repoRuntimes) {
    if (runtime.pid === input.currentPid) continue;
    const killed = await terminatePid(runtime.pid, input.currentPid);
    if (killed) {
      eliminatedPids.push(runtime.pid);
      recoveryActions.push(`Terminated duplicate AiDevEngine runtime pid=${runtime.pid} port=${runtime.port ?? 'unknown'}`);
      if (runtime.port) eliminatedPorts.push(runtime.port);
    }
  }

  await settleEventLoop();

  let resolvedPort = input.preferredPort;
  let portShifted = false;
  let displacedForeignProcess = false;

  for (let offset = 0; offset <= portScanMax; offset += 1) {
    const candidate = input.preferredPort + offset;
    const listeners = findPortListeners(candidate);
    const foreignPids: number[] = [];
    const repoPids: number[] = [];

    for (const pid of listeners.pids) {
      if (pid === input.currentPid) continue;
      const commandLine = readCommandLineForPid(pid, commandLines);
      if (isRuntimeConsolidationKillTarget(commandLine, input.repositoryRoot)) {
        repoPids.push(pid);
      } else if (isForeignPortOccupant(commandLine, input.repositoryRoot)) {
        foreignPids.push(pid);
      }
    }

    for (const pid of repoPids) {
      const killed = await terminatePid(pid, input.currentPid);
      if (killed) {
        eliminatedPids.push(pid);
        eliminatedPorts.push(candidate);
        recoveryActions.push(`Replaced AiDevEngine listener on port ${candidate} pid=${pid}`);
      }
    }

    const remaining = findPortListeners(candidate);
    const stillBlocked = remaining.pids.filter((pid) => pid !== input.currentPid);
    if (stillBlocked.length === 0) {
      resolvedPort = candidate;
      portShifted = offset > 0;
      break;
    }

    if (foreignPids.length > 0) {
      displacedForeignProcess = true;
      recoveryActions.push(
        `Port ${candidate} occupied by non-AiDevEngine process(es) ${foreignPids.join(', ')} — scanning next port`,
      );
      continue;
    }
  }

  if (portShifted) {
    recoveryActions.push(`Selected alternate development port ${resolvedPort}`);
  }

  if (input.recovery) {
    recoveryActions.push('Recovery relaunch prepared by Runtime Authority');
  }

  return {
    readOnly: true,
    contractVersion: RUNTIME_AUTHORITY_V1_CONTRACT_VERSION,
    preferredPort: input.preferredPort,
    resolvedPort,
    portShifted,
    displacedForeignProcess,
    eliminatedPids,
    eliminatedPorts: [...new Set(eliminatedPorts)],
    discoveredRuntimes: discovered,
    recoveryActions,
    repositoryRoot: input.repositoryRoot,
    preparedAt: new Date().toISOString(),
  };
}

export function findNextFreePort(startPort: number, maxOffset: number, currentPid: number): number {
  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const candidate = startPort + offset;
    const listeners = findPortListeners(candidate).pids.filter((pid) => pid !== currentPid);
    if (listeners.length === 0) return candidate;
  }
  return startPort + maxOffset;
}
