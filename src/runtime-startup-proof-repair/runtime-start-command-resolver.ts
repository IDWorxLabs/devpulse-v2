/**
 * Startup command resolver — evidence-backed priority resolution (Phase 26.77).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RUNTIME_DEV_SERVER_RELATIVE_PATH } from '../connected-build-execution/build-proof-gap-materializer.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { FRAMEWORK_DEFAULT_PORTS, SCRIPT_CANDIDATES } from './runtime-startup-proof-repair-registry.js';
import type {
  ResolvedStartupCommand,
  RuntimeAppType,
  RuntimeEntrypointCandidate,
  StartupCommandEvidenceSource,
} from './runtime-startup-proof-repair-types.js';

function frameworkDefaultCommand(appType: RuntimeAppType): { command: string; port: number; detail: string } | null {
  switch (appType) {
    case 'VITE':
      return { command: 'npm run dev', port: FRAMEWORK_DEFAULT_PORTS.VITE!, detail: 'Vite default dev script' };
    case 'NEXT':
      return { command: 'npm run dev', port: FRAMEWORK_DEFAULT_PORTS.NEXT!, detail: 'Next.js default dev script' };
    case 'EXPRESS':
      return { command: 'npm run start', port: FRAMEWORK_DEFAULT_PORTS.EXPRESS!, detail: 'Express default start script' };
    case 'EXPO':
      return { command: 'npm run start', port: FRAMEWORK_DEFAULT_PORTS.EXPO!, detail: 'Expo default start script' };
    case 'NODE':
      return {
        command: `node ${RUNTIME_DEV_SERVER_RELATIVE_PATH}`,
        port: FRAMEWORK_DEFAULT_PORTS.NODE!,
        detail: 'Node dev-server fallback',
      };
    default:
      return null;
  }
}

function manifestCommand(buildReport: ConnectedBuildExecutionReport | null): string | null {
  if (!buildReport?.buildManifest.manifestExists) return null;
  const workspacePath = buildReport.workspaceMaterialization.workspacePath;
  if (!workspacePath) return null;
  const devServer = join(workspacePath, RUNTIME_DEV_SERVER_RELATIVE_PATH);
  if (existsSync(join(process.cwd(), devServer)) || buildReport.generatedFileEvidence.fileCount > 0) {
    return `node ${RUNTIME_DEV_SERVER_RELATIVE_PATH}`;
  }
  return null;
}

export function resolveStartupCommand(input: {
  rootDir: string;
  entrypoint: RuntimeEntrypointCandidate;
  buildMaterializationReport: ConnectedBuildExecutionReport | null;
  expectedPortOverride?: number;
}): ResolvedStartupCommand {
  const cwd = input.entrypoint.workspaceRoot;
  const cwdAbs = join(input.rootDir, cwd);
  const candidates: Array<{
    command: string;
    port: number;
    source: StartupCommandEvidenceSource;
    detail: string;
    confidence: number;
  }> = [];

  const manifestCmd = manifestCommand(input.buildMaterializationReport);
  if (manifestCmd && existsSync(join(cwdAbs, RUNTIME_DEV_SERVER_RELATIVE_PATH))) {
    candidates.push({
      command: manifestCmd,
      port: input.entrypoint.expectedPort,
      source: 'BUILD_MANIFEST',
      detail: `Build manifest + ${RUNTIME_DEV_SERVER_RELATIVE_PATH} exists on disk`,
      confidence: 95,
    });
  }

  if (input.entrypoint.startCommand) {
    const scriptName = input.entrypoint.startCommand.replace(/^npm run /, '');
    const pkgScripts = SCRIPT_CANDIDATES;
    const matched = pkgScripts.includes(scriptName as (typeof SCRIPT_CANDIDATES)[number]);
    candidates.push({
      command: input.entrypoint.startCommand,
      port: input.entrypoint.expectedPort,
      source: 'PACKAGE_JSON_SCRIPT',
      detail: matched
        ? `package.json scripts.${scriptName}`
        : `package.json first available script: ${scriptName}`,
      confidence: matched ? 90 : 70,
    });
  }

  const frameworkDefault = frameworkDefaultCommand(input.entrypoint.appType);
  if (frameworkDefault) {
    candidates.push({
      command: frameworkDefault.command,
      port: frameworkDefault.port,
      source: 'FRAMEWORK_DEFAULT',
      detail: frameworkDefault.detail,
      confidence: 75,
    });
  }

  if (input.entrypoint.entryFile) {
    const nodeCmd =
      input.entrypoint.entryFile.endsWith('.mjs') || input.entrypoint.entryFile.endsWith('.js')
        ? `node ${input.entrypoint.entryFile}`
        : null;
    if (nodeCmd && existsSync(join(cwdAbs, input.entrypoint.entryFile))) {
      candidates.push({
        command: nodeCmd,
        port: input.entrypoint.expectedPort,
        source: 'SERVER_ENTRYPOINT_FALLBACK',
        detail: `Entry file ${input.entrypoint.entryFile} exists`,
        confidence: 80,
      });
    }
  }

  if (candidates.length === 0) {
    return {
      readOnly: true,
      command: null,
      cwd,
      expectedPort: input.expectedPortOverride ?? input.entrypoint.expectedPort,
      entryFile: input.entrypoint.entryFile,
      appType: input.entrypoint.appType,
      evidenceSource: 'NO_COMMAND_FOUND',
      evidenceDetail: 'No startup command resolved from manifest, package.json, framework, or entrypoint',
      confidence: 0,
      resolved: false,
    };
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0]!;

  return {
    readOnly: true,
    command: best.command,
    cwd,
    expectedPort: input.expectedPortOverride ?? best.port,
    entryFile: input.entrypoint.entryFile,
    appType: input.entrypoint.appType,
    evidenceSource: best.source,
    evidenceDetail: best.detail,
    confidence: best.confidence,
    resolved: true,
  };
}
