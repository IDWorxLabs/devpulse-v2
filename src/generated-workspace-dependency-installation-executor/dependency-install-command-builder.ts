/**
 * Dependency install command builder — no shell (Phase 26.79 / 26.80).
 * On Windows, spawns via node + *-cli.js to avoid .cmd EINVAL with shell:false.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { PackageManagerId } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type { ParsedInstallCommand } from './generated-workspace-dependency-installation-executor-types.js';

export interface InstallSpawnTarget {
  readOnly: true;
  executable: string;
  args: readonly string[];
  spawnDescription: string;
}

function bundledCliPath(packageManager: PackageManagerId): string | null {
  const cli = join(dirname(process.execPath), 'node_modules', packageManager, 'bin', `${packageManager}-cli.js`);
  return existsSync(cli) ? cli : null;
}

export function resolveInstallSpawnTarget(parsed: ParsedInstallCommand): InstallSpawnTarget {
  if (process.platform === 'win32') {
    const cliPath = bundledCliPath(parsed.packageManager);
    if (cliPath) {
      return {
        readOnly: true,
        executable: process.execPath,
        args: [cliPath, ...parsed.args],
        spawnDescription: `${process.execPath} ${cliPath} ${parsed.args.join(' ')}`,
      };
    }
  }

  return {
    readOnly: true,
    executable: parsed.executable,
    args: parsed.args,
    spawnDescription: `${parsed.executable} ${parsed.args.join(' ')}`,
  };
}

function resolveExecutable(packageManager: PackageManagerId): string {
  if (process.platform === 'win32') {
    const cliPath = bundledCliPath(packageManager);
    if (cliPath) return process.execPath;
    return `${packageManager}.cmd`;
  }
  return packageManager;
}

export function buildParsedInstallCommand(installCommand: string): ParsedInstallCommand | null {
  const normalized = installCommand.trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');
  if (parts.length < 2) return null;

  const pm = parts[0] as PackageManagerId;
  if (pm !== 'npm' && pm !== 'pnpm' && pm !== 'yarn') return null;

  const subcommand = parts[1];
  if (subcommand !== 'install' && subcommand !== 'ci') return null;

  const args: string[] = [subcommand];
  for (let i = 2; i < parts.length; i += 1) {
    const arg = parts[i];
    if (arg === '--frozen-lockfile') {
      args.push(arg);
    } else {
      return null;
    }
  }

  return {
    readOnly: true,
    executable: resolveExecutable(pm),
    args,
    packageManager: pm,
    normalizedCommand: normalized,
  };
}
