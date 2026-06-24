/**
 * World2 Real Instantiation V1 — isolation proof builder.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { World2Instance, WorldIsolationProof } from './world2-real-instantiation-v1-types.js';
import { hashWorld1Sentinels, world1SentinelsUnchanged } from './world2-world1-protection.js';

export function buildWorldIsolationProof(input: {
  projectRootDir: string;
  worlds: readonly World2Instance[];
  world1Before: Record<string, string>;
  world1After: Record<string, string>;
}): WorldIsolationProof {
  const violations: string[] = [];
  let contaminationIncidents = 0;

  const workspacePaths = input.worlds.map((w) => w.workspacePath);
  const artifactDirs = input.worlds.map((w) => w.artifactDirectory);

  const workspaceSeparation =
    workspacePaths.length === new Set(workspacePaths).size &&
    workspacePaths.every((p) => p.includes('w2-') || p.includes('/w2-'));

  if (!workspaceSeparation) {
    violations.push('Workspace paths are not unique or not under World2 prefix');
  }

  const artifactSeparation = artifactDirs.length === new Set(artifactDirs).size;
  if (!artifactSeparation) {
    violations.push('Artifact directories are not unique');
  }

  let buildSeparation = true;
  let previewSeparation = true;
  for (const world of input.worlds) {
    const markerPath = join(world.workspacePath, '.w2-isolation-marker');
    if (!existsSync(markerPath)) {
      buildSeparation = false;
      violations.push(`Missing isolation marker for ${world.worldId}`);
      contaminationIncidents += 1;
    } else {
      const marker = readFileSync(markerPath, 'utf8').trim();
      if (marker !== world.worldId) {
        buildSeparation = false;
        contaminationIncidents += 1;
        violations.push(`Isolation marker mismatch for ${world.worldId}`);
      }
    }

    const distIndex = join(world.workspacePath, 'dist', 'index.html');
    if (world.executionResult?.buildProof && !existsSync(distIndex)) {
      previewSeparation = false;
      violations.push(`Build claimed but dist missing for ${world.worldId}`);
    }
  }

  for (let i = 0; i < input.worlds.length; i++) {
    for (let j = i + 1; j < input.worlds.length; j++) {
      const a = input.worlds[i];
      const b = input.worlds[j];
      const markerA = join(a.workspacePath, '.w2-isolation-marker');
      const markerB = join(b.workspacePath, '.w2-isolation-marker');
      if (existsSync(markerA) && existsSync(markerB)) {
        const valA = readFileSync(markerA, 'utf8').trim();
        const valB = readFileSync(markerB, 'utf8').trim();
        if (valA === valB) {
          contaminationIncidents += 1;
          violations.push(`Cross-world marker collision: ${a.worldId} and ${b.worldId}`);
        }
      }
    }
  }

  const executionSeparation = input.worlds.every(
    (w) => w.executionResult?.contaminationCheckPassed !== false,
  );

  const world1Protected = world1SentinelsUnchanged(input.world1Before, input.world1After);
  if (!world1Protected) {
    violations.push('World1 sentinel files changed during World2 execution');
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    workspaceSeparation,
    artifactSeparation,
    buildSeparation,
    previewSeparation,
    executionSeparation,
    world1Protected,
    contaminationIncidents,
    violations,
    world1SentinelHashes: input.world1After,
  };
}

export function hashWorld1BeforeExecution(projectRootDir: string): Record<string, string> {
  return hashWorld1Sentinels(projectRootDir);
}
