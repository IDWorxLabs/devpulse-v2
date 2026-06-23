/**
 * Runtime entrypoint crash mapper (Phase 26.81).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENTRYPOINT_PROBE_FILES } from './generated-runtime-crash-diagnosis-registry.js';
import type { RuntimeEntrypointCrashMapping } from './generated-runtime-crash-diagnosis-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

function resolveEntryFromCommand(command: string | null): string | null {
  if (!command) return null;
  if (command.startsWith('node ')) return command.replace(/^node /, '').trim();
  if (command.startsWith('npm run ')) return null;
  return null;
}

function listCandidateEntryFiles(workspaceAbs: string): string[] {
  return ENTRYPOINT_PROBE_FILES.filter((rel) => existsSync(join(workspaceAbs, rel)));
}

export function mapRuntimeEntrypointCrash(input: {
  workspaceAbs: string;
  workspaceRoot: string;
  workspaceId: string;
  probe: RuntimeStartupProbeResult;
  entrypoint: RuntimeEntrypointCandidate;
  resolved: ResolvedStartupCommand;
}): RuntimeEntrypointCrashMapping {
  const entryFile = input.resolved.entryFile ?? resolveEntryFromCommand(input.probe.attemptedCommand);
  const healthSuccess =
    input.probe.applicationBoots ||
    (input.probe.processStarted &&
      input.probe.healthResponded &&
      input.probe.portBound &&
      input.probe.firstResponseStatus !== null &&
      input.probe.firstResponseStatus >= 200 &&
      input.probe.firstResponseStatus < 400);

  const crashed =
    !healthSuccess &&
    (input.probe.fatalErrors.some((e) => e.includes('RUNTIME_CRASH')) ||
      (input.probe.processStarted && !input.probe.applicationBoots && input.probe.fatalErrors.length > 0));

  return {
    readOnly: true,
    attemptedCommand: input.probe.attemptedCommand,
    cwd: input.probe.cwd,
    entryFile,
    workspaceRoot: input.workspaceRoot,
    workspaceId: input.workspaceId,
    processCrashed: crashed,
    processStarted: input.probe.processStarted,
    portBound: input.probe.portBound,
    healthResponded: input.probe.healthResponded,
    candidateEntryFiles: listCandidateEntryFiles(input.workspaceAbs),
  };
}

export function readBuildManifestStartupHint(workspaceAbs: string): string | null {
  const manifestPath = join(workspaceAbs, 'build-manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      contractId?: string;
      materializationSource?: string;
    };
    return manifest.materializationSource ?? manifest.contractId ?? null;
  } catch {
    return null;
  }
}
