/**
 * AEE Build AutoFix Loop V1 — failure classification, bounded repair, npm build rerun.
 * Applies to any generated app profile after npm install passes and npm run build fails.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type {
  AeeBuildAutofixAttemptRecord,
  AeeBuildAutofixLoopInput,
  AeeBuildAutofixLoopResult,
  AeeBuildAutofixPhase,
  AeeBuildAutofixReport,
  AeeBuildFailureClass,
} from './aee-build-autofix-loop-types.js';
import {
  AEE_BUILD_AUTOFIX_INJECT_MARKER,
  AEE_BUILD_AUTOFIX_LOOP_EVENT,
  AEE_BUILD_AUTOFIX_MAX_ATTEMPTS,
  AEE_BUILD_AUTOFIX_MAX_DEPENDENCY_RETRY,
} from './aee-build-autofix-loop-types.js';

export {
  AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN,
  AEE_BUILD_AUTOFIX_LOOP_EVENT,
  AEE_BUILD_AUTOFIX_MAX_ATTEMPTS,
  AEE_BUILD_AUTOFIX_MAX_DEPENDENCY_RETRY,
  AEE_BUILD_AUTOFIX_INJECT_MARKER,
} from './aee-build-autofix-loop-types.js';

export type {
  AeeBuildAutofixLoopInput,
  AeeBuildAutofixLoopResult,
  AeeBuildAutofixAttemptRecord,
  AeeBuildAutofixReport,
  AeeBuildFailureClass,
  AeeBuildAutofixPhase,
} from './aee-build-autofix-loop-types.js';

export function isBuildAutofixEligible(input: {
  npmInstallOk: boolean;
  npmBuildOk: boolean;
}): boolean {
  return input.npmInstallOk && !input.npmBuildOk;
}

export function classifyBuildFailure(buildOutput: string): AeeBuildFailureClass {
  const output = buildOutput ?? '';
  const lower = output.toLowerCase();

  if (
    /missing script:\s*"?build"?/i.test(output) ||
    /npm err!.* script/i.test(output) ||
    /lifecycle script `build`/i.test(output)
  ) {
    return 'PACKAGE_SCRIPT_FAILURE';
  }

  if (
    /cannot find module ['"][^./][^'"]*['"]/i.test(output) ||
    /module not found.*can't resolve/i.test(output) ||
    /error.*module not found/i.test(output)
  ) {
    const relativeImport = /cannot find module ['"](\.[^'"]+)['"]/i.test(output);
    if (!relativeImport) {
      return 'MISSING_DEPENDENCY';
    }
  }

  if (
    /has no exported member/i.test(output) ||
    /ts2305/i.test(output) ||
    /ts2307/i.test(output) ||
    /cannot find name/i.test(output) ||
    /is not exported/i.test(output)
  ) {
    return 'MISSING_IMPORT_EXPORT';
  }

  if (
    /jsx/i.test(output) ||
    /react is not defined/i.test(output) ||
    /unexpected token.*</i.test(output) ||
    /ts17004/i.test(output)
  ) {
    return 'INVALID_JSX_TSX';
  }

  if (
    /feature_registry|route registry|registry mismatch|route.*not.*registered/i.test(lower) ||
    (/routes\.ts/i.test(output) && /registry\.ts/i.test(output))
  ) {
    return 'ROUTE_REGISTRY_MISMATCH';
  }

  if (/ts\d{4}/i.test(output)) {
    return 'TYPESCRIPT_ERROR';
  }

  return 'UNKNOWN_BUILD_FAILURE';
}

function excerpt(output: string, max = 240): string {
  const trimmed = output.replace(/\s+/g, ' ').trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

function assertSafeWorkspacePath(workspaceDir: string, targetPath: string): boolean {
  const resolvedWorkspace = resolve(workspaceDir);
  const resolvedTarget = resolve(targetPath);
  return resolvedTarget.startsWith(resolvedWorkspace);
}

export function injectSimulatedBuildFailure(workspaceDir: string): {
  injected: boolean;
  filePath: string | null;
} {
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) {
    return { injected: false, filePath: null };
  }
  const source = readFileSync(appPath, 'utf8');
  if (source.includes(AEE_BUILD_AUTOFIX_INJECT_MARKER)) {
    return { injected: false, filePath: appPath };
  }
  const bodyMarker = 'export default function App() {';
  if (!source.includes(bodyMarker)) {
    return { injected: false, filePath: appPath };
  }
  const injectedImport = `import __aeeBuildAutofixFault from './__aee_build_autofix_injected_fault__';\n`;
  const patched = `${injectedImport}${source.replace(
    bodyMarker,
    `${bodyMarker}\n  void __aeeBuildAutofixFault; /* ${AEE_BUILD_AUTOFIX_INJECT_MARKER} */`,
  )}`;
  writeFileSync(appPath, patched, 'utf8');
  return { injected: true, filePath: appPath };
}

function repairSimulatedBuildFailure(workspaceDir: string): string[] {
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) return [];
  let source = readFileSync(appPath, 'utf8');
  if (!source.includes(AEE_BUILD_AUTOFIX_INJECT_MARKER)) return [];
  source = source.replace(
    new RegExp(`^import\\s+__aeeBuildAutofixFault\\s+from\\s*['"][^'"]+['"];?\\s*\\n`, 'm'),
    '',
  );
  source = source.replace(
    new RegExp(`\\s*void __aeeBuildAutofixFault;\\s*/\\* ${AEE_BUILD_AUTOFIX_INJECT_MARKER} \\*/\\s*\\n`, 'm'),
    '\n',
  );
  writeFileSync(appPath, source, 'utf8');
  return [relative(workspaceDir, appPath).replace(/\\/g, '/')];
}

function parseErrorFilePath(buildOutput: string, workspaceDir: string): string | null {
  const match =
    buildOutput.match(/(?:src[/\\][^\s:(]+\.(?:tsx?|jsx?))(?:\(\d+,\d+\))?/i)?.[0] ??
    buildOutput.match(/([^\s:(]+\.(?:tsx?|jsx?))\(\d+,\d+\)/)?.[1];
  if (!match) return null;
  const normalized = match.replace(/\\/g, '/').replace(/\(\d+,\d+\)$/, '');
  const candidate = join(workspaceDir, normalized.startsWith('src/') ? normalized : `src/${normalized}`);
  if (existsSync(candidate) && assertSafeWorkspacePath(workspaceDir, candidate)) {
    return candidate;
  }
  const direct = join(workspaceDir, normalized);
  if (existsSync(direct) && assertSafeWorkspacePath(workspaceDir, direct)) {
    return direct;
  }
  return null;
}

function parseMissingDependency(buildOutput: string): string | null {
  const match =
    buildOutput.match(/cannot find module ['"]([^./][^'"]+)['"]/i) ??
    buildOutput.match(/can't resolve ['"]([^./][^'"]+)['"]/i);
  if (!match?.[1]) return null;
  const pkg = match[1].startsWith('@') ? match[1].split('/').slice(0, 2).join('/') : match[1].split('/')[0];
  return pkg ?? null;
}

function ensureReactImport(filePath: string): boolean {
  const source = readFileSync(filePath, 'utf8');
  if (!/\.tsx$/.test(filePath)) return false;
  if (/import\s+React\b/.test(source) || /from\s+['"]react['"]/.test(source)) return false;
  if (!/<[A-Za-z]/.test(source)) return false;
  writeFileSync(filePath, `import React from 'react';\n${source}`, 'utf8');
  return true;
}

function repairMissingDependency(input: {
  workspaceDir: string;
  buildOutput: string;
  maxDependencyInstallRetry: number;
}): { filesChanged: string[]; dependencyInstallAttempts: number; detail: string } {
  const pkg = parseMissingDependency(input.buildOutput);
  if (!pkg) {
    return { filesChanged: [], dependencyInstallAttempts: 0, detail: 'No npm package extracted from build output.' };
  }

  let dependencyInstallAttempts = 0;
  for (let i = 0; i < input.maxDependencyInstallRetry; i += 1) {
    dependencyInstallAttempts += 1;
    try {
      execSync(`npm install ${pkg} --ignore-scripts`, {
        cwd: input.workspaceDir,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120_000,
      });
      return {
        filesChanged: [`package.json (added dependency ${pkg})`],
        dependencyInstallAttempts,
        detail: `Installed missing dependency ${pkg}.`,
      };
    } catch {
      // retry until budget exhausted
    }
  }

  return {
    filesChanged: [],
    dependencyInstallAttempts,
    detail: `Dependency install retries exhausted for ${pkg}.`,
  };
}

function repairRouteRegistryMismatch(workspaceDir: string): { filesChanged: string[]; detail: string } {
  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  const routesPath = join(workspaceDir, 'src/features/routes.ts');
  if (!existsSync(registryPath) || !existsSync(routesPath)) {
    return { filesChanged: [], detail: 'Route registry files not present — no registry repair applied.' };
  }

  const registrySource = readFileSync(registryPath, 'utf8');
  const routesSource = readFileSync(routesPath, 'utf8');
  const routeMatches = [...routesSource.matchAll(/route:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  if (routeMatches.length === 0) {
    return { filesChanged: [], detail: 'No routes discovered in routes.ts.' };
  }

  let patched = registrySource;
  const filesChanged: string[] = [];
  for (const route of routeMatches) {
    if (patched.includes(`route: '${route}'`) || patched.includes(`route: "${route}"`)) continue;
    patched = patched.replace(
      /export const FEATURE_REGISTRY = \[/,
      `export const FEATURE_REGISTRY = [\n  {\n    id: 'route-sync-${route.replace(/\//g, '-').slice(1) || 'root'}',\n    name: 'Route Sync',\n    route: '${route}',\n    component: () => null,\n    sourcePath: 'src/features/routes.ts',\n    contractId: 'route-sync',\n    promptTerms: [],\n    status: 'generated' as const,\n  },`,
    );
    filesChanged.push(relative(workspaceDir, registryPath).replace(/\\/g, '/'));
  }

  if (filesChanged.length === 0) {
    return { filesChanged: [], detail: 'Registry already aligned with routes.ts.' };
  }

  writeFileSync(registryPath, patched, 'utf8');
  return { filesChanged, detail: 'Synchronized FEATURE_REGISTRY entries with routes.ts.' };
}

function repairPackageScriptFailure(workspaceDir: string): { filesChanged: string[]; detail: string } {
  const packagePath = join(workspaceDir, 'package.json');
  if (!existsSync(packagePath)) {
    return { filesChanged: [], detail: 'package.json missing — cannot repair build script.' };
  }
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as { scripts?: Record<string, string> };
  if (pkg.scripts?.build) {
    return { filesChanged: [], detail: 'Build script already present.' };
  }
  pkg.scripts = {
    ...pkg.scripts,
    build: 'vite build',
  };
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  return {
    filesChanged: ['package.json'],
    detail: 'Restored default vite build script in package.json.',
  };
}

function applyBuildRepair(input: {
  workspaceDir: string;
  failureClass: AeeBuildFailureClass;
  buildOutput: string;
  maxDependencyInstallRetry: number;
  simulateBuildAutofixRepair?: boolean;
  simulateBuildAutofixExhausted?: boolean;
  attempt: number;
}): {
  repairApplied: boolean;
  filesChanged: string[];
  dependencyInstallAttempts: number;
  detail: string;
} {
  if (input.simulateBuildAutofixExhausted) {
    return {
      repairApplied: false,
      filesChanged: [],
      dependencyInstallAttempts: 0,
      detail: 'Validator simulateBuildAutofixExhausted — repair suppressed.',
    };
  }

  if (input.simulateBuildAutofixRepair && input.attempt === 1) {
    const changed = repairSimulatedBuildFailure(input.workspaceDir);
    if (changed.length > 0) {
      return {
        repairApplied: true,
        filesChanged: changed,
        dependencyInstallAttempts: 0,
        detail: 'Removed validator-injected compile fault.',
      };
    }
  }

  const errorFile = parseErrorFilePath(input.buildOutput, input.workspaceDir);
  const filesChanged: string[] = [];

  switch (input.failureClass) {
    case 'MISSING_DEPENDENCY': {
      const depRepair = repairMissingDependency({
        workspaceDir: input.workspaceDir,
        buildOutput: input.buildOutput,
        maxDependencyInstallRetry: input.maxDependencyInstallRetry,
      });
      return {
        repairApplied: depRepair.filesChanged.length > 0,
        filesChanged: depRepair.filesChanged,
        dependencyInstallAttempts: depRepair.dependencyInstallAttempts,
        detail: depRepair.detail,
      };
    }
    case 'ROUTE_REGISTRY_MISMATCH': {
      const registryRepair = repairRouteRegistryMismatch(input.workspaceDir);
      return {
        repairApplied: registryRepair.filesChanged.length > 0,
        filesChanged: registryRepair.filesChanged,
        dependencyInstallAttempts: 0,
        detail: registryRepair.detail,
      };
    }
    case 'PACKAGE_SCRIPT_FAILURE': {
      const scriptRepair = repairPackageScriptFailure(input.workspaceDir);
      return {
        repairApplied: scriptRepair.filesChanged.length > 0,
        filesChanged: scriptRepair.filesChanged,
        dependencyInstallAttempts: 0,
        detail: scriptRepair.detail,
      };
    }
    case 'INVALID_JSX_TSX':
    case 'TYPESCRIPT_ERROR':
    case 'MISSING_IMPORT_EXPORT':
    case 'UNKNOWN_BUILD_FAILURE': {
      if (errorFile && assertSafeWorkspacePath(input.workspaceDir, errorFile)) {
        if (ensureReactImport(errorFile)) {
          filesChanged.push(relative(input.workspaceDir, errorFile).replace(/\\/g, '/'));
        }
      } else {
        const appPath = join(input.workspaceDir, 'src/App.tsx');
        if (existsSync(appPath) && ensureReactImport(appPath)) {
          filesChanged.push('src/App.tsx');
        }
      }
      const simulated = repairSimulatedBuildFailure(input.workspaceDir);
      for (const file of simulated) {
        if (!filesChanged.includes(file)) filesChanged.push(file);
      }
      return {
        repairApplied: filesChanged.length > 0,
        filesChanged,
        dependencyInstallAttempts: 0,
        detail:
          filesChanged.length > 0
            ? `Applied safe source repair in ${filesChanged.join(', ')}.`
            : 'No safe source repair could be derived from build output.',
      };
    }
    default:
      return {
        repairApplied: false,
        filesChanged: [],
        dependencyInstallAttempts: 0,
        detail: 'No repair strategy for failure class.',
      };
  }
}

function defaultRerunBuild(workspaceDir: string): { ok: boolean; output: string } {
  try {
    execSync('npm run build', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    return { ok: true, output: '' };
  } catch (err) {
    const message =
      err instanceof Error && 'stdout' in err
        ? String((err as { stdout?: string; stderr?: string }).stderr ?? '') +
          String((err as { stdout?: string }).stdout ?? '') +
          err.message
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, output: message };
  }
}

export async function runAeeBuildAutofixLoop(
  input: AeeBuildAutofixLoopInput,
): Promise<AeeBuildAutofixLoopResult> {
  const maxAttempts = input.maxAttempts ?? AEE_BUILD_AUTOFIX_MAX_ATTEMPTS;
  const maxDependencyInstallRetry =
    input.maxDependencyInstallRetry ?? AEE_BUILD_AUTOFIX_MAX_DEPENDENCY_RETRY;
  const attempts: AeeBuildAutofixAttemptRecord[] = [];
  const allFilesChanged = new Set<string>();

  if (input.initialBuildOk) {
    const report: AeeBuildAutofixReport = {
      readOnly: true,
      npmBuildInitialResult: 'PASS',
      initialFailureClass: 'UNKNOWN_BUILD_FAILURE',
      initialBuildError: '',
      autofixAttempts: [],
      filesChanged: [],
      finalBuildStatus: 'PASS',
      finalBuildError: null,
      remainingErrors: [],
      exhausted: false,
      summary: 'npm build already passed — AutoFix loop not required.',
    };
    return {
      readOnly: true,
      finalBuildOk: true,
      exhausted: false,
      skipped: true,
      skipReason: 'npm build already passed.',
      attempts,
      report,
      summary: report.summary,
    };
  }

  if (!isBuildAutofixEligible({ npmInstallOk: true, npmBuildOk: false })) {
    const report: AeeBuildAutofixReport = {
      readOnly: true,
      npmBuildInitialResult: 'FAIL',
      initialFailureClass: classifyBuildFailure(input.initialBuildOutput),
      initialBuildError: excerpt(input.initialBuildOutput),
      autofixAttempts: [],
      filesChanged: [],
      finalBuildStatus: 'FAIL',
      finalBuildError: excerpt(input.initialBuildOutput),
      remainingErrors: [excerpt(input.initialBuildOutput)],
      exhausted: false,
      summary: 'Build AutoFix skipped — npm install must pass first.',
    };
    return {
      readOnly: true,
      finalBuildOk: false,
      exhausted: false,
      skipped: true,
      skipReason: 'npm install did not pass.',
      attempts,
      report,
      summary: report.summary,
    };
  }

  const initialFailureClass = classifyBuildFailure(input.initialBuildOutput);
  let currentOutput = input.initialBuildOutput;
  let finalBuildOk = false;
  const rerun = input.rerunBuild ?? (() => defaultRerunBuild(input.workspaceDir));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const phases: AeeBuildAutofixPhase[] = ['FAILURE_CLASSIFICATION'];
    const failureClass = classifyBuildFailure(currentOutput);

    phases.push('AUTOFIX_REPAIR');
    const repair = applyBuildRepair({
      workspaceDir: input.workspaceDir,
      failureClass,
      buildOutput: currentOutput,
      maxDependencyInstallRetry,
      simulateBuildAutofixRepair: input.simulateBuildAutofixRepair,
      simulateBuildAutofixExhausted: input.simulateBuildAutofixExhausted,
      attempt,
    });

    if (repair.dependencyInstallAttempts > 0) {
      phases.push('DEPENDENCY_INSTALL_RETRY');
    }

    phases.push('NPM_BUILD_RERUN');
    const rerunResult = rerun();
    finalBuildOk = rerunResult.ok;
    currentOutput = rerunResult.output;

    for (const file of repair.filesChanged) {
      allFilesChanged.add(file);
    }

    const attemptRecord: AeeBuildAutofixAttemptRecord = {
      readOnly: true,
      attempt,
      phases,
      failureClass,
      repairApplied: repair.repairApplied,
      filesChanged: repair.filesChanged,
      dependencyInstallAttempts: repair.dependencyInstallAttempts,
      buildRerunOk: rerunResult.ok,
      buildOutputExcerpt: excerpt(currentOutput),
      detail: repair.detail,
    };
    attempts.push(attemptRecord);
    input.onAttempt?.(attemptRecord);

    if (finalBuildOk) {
      break;
    }
  }

  const exhausted = !finalBuildOk && attempts.length >= maxAttempts;
  const remainingErrors = finalBuildOk ? [] : [excerpt(currentOutput)];
  const summary = finalBuildOk
    ? `${AEE_BUILD_AUTOFIX_LOOP_EVENT}: npm build repaired after ${attempts.length} bounded attempt(s).`
    : exhausted
      ? `${AEE_BUILD_AUTOFIX_LOOP_EVENT}: build repair exhausted after ${attempts.length} attempt(s) — BUILD_COMPLETED_WITH_BUILD_ERRORS.`
      : `${AEE_BUILD_AUTOFIX_LOOP_EVENT}: build repair incomplete.`;

  const report: AeeBuildAutofixReport = {
    readOnly: true,
    npmBuildInitialResult: 'FAIL',
    initialFailureClass,
    initialBuildError: excerpt(input.initialBuildOutput),
    autofixAttempts: attempts,
    filesChanged: [...allFilesChanged],
    finalBuildStatus: finalBuildOk ? 'PASS' : 'FAIL',
    finalBuildError: finalBuildOk ? null : excerpt(currentOutput),
    remainingErrors,
    exhausted,
    summary,
  };

  return {
    readOnly: true,
    finalBuildOk,
    exhausted,
    skipped: false,
    skipReason: null,
    attempts,
    report,
    summary,
  };
}

export function formatAeeBuildAutofixReportMarkdown(report: AeeBuildAutofixReport): string {
  const lines = [
    '# AEE Build AutoFix Loop Report',
    '',
    `- npm build initial result: ${report.npmBuildInitialResult}`,
    `- failure class: ${report.initialFailureClass}`,
    `- initial build error: ${report.initialBuildError}`,
    `- AutoFix attempts: ${report.autofixAttempts.length}`,
    `- files changed: ${report.filesChanged.length > 0 ? report.filesChanged.join(', ') : 'none'}`,
    `- final build status: ${report.finalBuildStatus}`,
    `- remaining errors: ${report.remainingErrors.length > 0 ? report.remainingErrors.join('; ') : 'none'}`,
    '',
    '## Attempts',
    ...(report.autofixAttempts.length
      ? report.autofixAttempts.map(
          (a) =>
            `- #${a.attempt}: ${a.failureClass} — repair=${a.repairApplied ? 'yes' : 'no'} — rerun=${a.buildRerunOk ? 'PASS' : 'FAIL'} — ${a.detail}`,
        )
      : ['- none']),
  ];
  return lines.join('\n');
}
