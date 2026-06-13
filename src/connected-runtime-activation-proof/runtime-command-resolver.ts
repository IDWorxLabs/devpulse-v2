/**
 * Runtime Command Resolver — detect valid runtime command from workspace evidence.
 * Does not execute commands.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RUNTIME_SCRIPT_CANDIDATES } from './connected-runtime-activation-proof-registry.js';
import type {
  RuntimeCommandAssessment,
  RuntimeSessionEvidence,
} from './connected-runtime-activation-proof-types.js';

const DEV_COMMAND_PATTERNS = [
  /^npm run (\w+)/,
  /^pnpm (\w+)/,
  /^yarn (\w+)/,
  /^npx (\S+)/,
  /^node .+/,
  /^vite/,
  /^expo start/,
];

function inferFrameworkHint(workspacePath: string, scripts: Record<string, string>): string | null {
  const joined = Object.values(scripts).join(' ').toLowerCase();
  const pkgPath = join(workspacePath, 'package.json');
  let deps = '';
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      deps = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies }).toLowerCase();
    } catch {
      /* ignore */
    }
  }
  if (joined.includes('vite') || deps.includes('vite')) return 'VITE';
  if (joined.includes('expo') || deps.includes('expo')) return 'EXPO';
  if (joined.includes('next') || deps.includes('next')) return 'NEXT';
  if (joined.includes('react') || deps.includes('react')) return 'REACT';
  if (joined.includes('express') || deps.includes('express')) return 'EXPRESS';
  if (joined.includes('node')) return 'NODE';
  return null;
}

function resolveFromPackageJson(
  rootDir: string,
  workspaceRelativePath: string,
): Pick<
  RuntimeCommandAssessment,
  'runtimeCommandFound' | 'command' | 'workingDirectory' | 'scriptName' | 'frameworkHint' | 'confidence'
> {
  const workingDirectory = workspaceRelativePath.replace(/\\/g, '/');
  const pkgPath = join(rootDir, workingDirectory, 'package.json');
  if (!existsSync(pkgPath)) {
    return {
      runtimeCommandFound: false,
      command: null,
      workingDirectory,
      scriptName: null,
      frameworkHint: null,
      confidence: 0,
    };
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};
    for (const candidate of RUNTIME_SCRIPT_CANDIDATES) {
      if (scripts[candidate]) {
        const command = `npm run ${candidate}`;
        return {
          runtimeCommandFound: true,
          command,
          workingDirectory,
          scriptName: candidate,
          frameworkHint: inferFrameworkHint(join(rootDir, workingDirectory), scripts),
          confidence: 85,
        };
      }
    }
    const firstScript = Object.keys(scripts)[0];
    if (firstScript) {
      return {
        runtimeCommandFound: true,
        command: `npm run ${firstScript}`,
        workingDirectory,
        scriptName: firstScript,
        frameworkHint: inferFrameworkHint(join(rootDir, workingDirectory), scripts),
        confidence: 60,
      };
    }
  } catch {
    /* ignore parse errors */
  }

  return {
    runtimeCommandFound: false,
    command: null,
    workingDirectory,
    scriptName: null,
    frameworkHint: null,
    confidence: 0,
  };
}

function isPlausibleCommand(command: string): boolean {
  return DEV_COMMAND_PATTERNS.some((pattern) => pattern.test(command.trim()));
}

export function resolveRuntimeCommand(input: {
  rootDir: string;
  workspacePath: string | null;
  sessionEvidence?: RuntimeSessionEvidence;
}): RuntimeCommandAssessment {
  const injected = input.sessionEvidence;
  if (injected?.command) {
    return {
      readOnly: true,
      runtimeCommandFound: true,
      command: injected.command,
      workingDirectory: injected.workingDirectory ?? input.workspacePath,
      scriptName: injected.scriptName ?? null,
      frameworkHint: injected.frameworkHint ?? null,
      missingCommandReason: null,
      confidence: isPlausibleCommand(injected.command) ? 90 : 70,
      executionObserved: injected.executionObserved ?? false,
    };
  }

  if (!input.workspacePath) {
    return {
      readOnly: true,
      runtimeCommandFound: false,
      command: null,
      workingDirectory: null,
      scriptName: null,
      frameworkHint: null,
      missingCommandReason: 'No materialized workspace path available',
      confidence: 0,
      executionObserved: false,
    };
  }

  const resolved = resolveFromPackageJson(input.rootDir, input.workspacePath);
  return {
    readOnly: true,
    ...resolved,
    missingCommandReason: resolved.runtimeCommandFound
      ? null
      : 'No runtime script found in workspace package.json',
    executionObserved: false,
  };
}
