/**
 * Workspace install safety guard (Phase 26.79).
 */

import { existsSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import {
  ALLOWED_INSTALL_COMMANDS,
  ALLOWED_INSTALL_EXTRA_ARGS,
  SHELL_INJECTION_PATTERNS,
} from './generated-workspace-dependency-installation-executor-registry.js';
import type { WorkspaceInstallSafetyCheck } from './generated-workspace-dependency-installation-executor-types.js';
import type { PackageManagerId } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';

function containsShellInjection(value: string): boolean {
  return SHELL_INJECTION_PATTERNS.some((p) => value.includes(p));
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, ' ');
}

function isAllowedInstallCommand(command: string): boolean {
  const normalized = normalizeCommand(command);
  if ((ALLOWED_INSTALL_COMMANDS as readonly string[]).includes(normalized)) {
    return true;
  }
  for (const extra of ALLOWED_INSTALL_EXTRA_ARGS) {
    if ((ALLOWED_INSTALL_COMMANDS as readonly string[]).some((base) => normalized === `${base} ${extra}`)) {
      return true;
    }
  }
  return false;
}

export function validateWorkspaceInstallSafety(input: {
  rootDir: string;
  workspaceAbs: string;
  installCwd: string;
  installCommand: string;
  expectedPackageManager: PackageManagerId;
}): WorkspaceInstallSafetyCheck {
  const rootDirAbs = resolve(input.rootDir);
  const workspaceAbs = resolve(input.workspaceAbs);
  const installCwdAbs = resolve(rootDirAbs, input.installCwd);
  const mainPackageJson = join(rootDirAbs, 'package.json');
  const workspacePackageJson = join(workspaceAbs, 'package.json');
  const installCommand = normalizeCommand(input.installCommand);

  const insideGeneratedWorkspace = isPathUnderGeneratedBuilderWorkspaces(rootDirAbs, workspaceAbs);
  const cwdMatchesWorkspace = normalize(installCwdAbs) === normalize(workspaceAbs);
  const cwdInsideGenerated = isPathUnderGeneratedBuilderWorkspaces(rootDirAbs, installCwdAbs);
  const packageJsonExists = existsSync(workspacePackageJson);
  const mainRepoProtected =
    installCwdAbs === rootDirAbs ||
    normalize(installCwdAbs) === normalize(rootDirAbs) ||
    (existsSync(mainPackageJson) && installCwdAbs === rootDirAbs);

  let refusalReason: string | null = null;

  if (!insideGeneratedWorkspace) {
    refusalReason = 'Workspace path is not inside .generated-builder-workspaces/.';
  } else if (!cwdInsideGenerated || !cwdMatchesWorkspace) {
    refusalReason = 'Install cwd must equal generated workspace root.';
  } else if (mainRepoProtected) {
    refusalReason = 'Install refused — main AiDevEngine repo is protected.';
  } else if (!packageJsonExists) {
    refusalReason = 'package.json missing in generated workspace.';
  } else if (containsShellInjection(installCommand)) {
    refusalReason = 'Install command contains unsafe shell injection characters.';
  } else if (!isAllowedInstallCommand(installCommand)) {
    refusalReason = `Install command not in allowed safe list: ${installCommand}`;
  } else if (!installCommand.startsWith(input.expectedPackageManager)) {
    refusalReason = `Install command does not match resolved package manager ${input.expectedPackageManager}.`;
  }

  return {
    readOnly: true,
    verdict: refusalReason ? 'REFUSED' : 'SAFE',
    refusalReason,
    workspaceAbs,
    installCwd: input.installCwd,
    installCommand,
    packageJsonExists,
    insideGeneratedWorkspace,
    mainRepoProtected,
  };
}
