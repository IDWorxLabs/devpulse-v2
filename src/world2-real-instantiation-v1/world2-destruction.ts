/**
 * World2 Real Instantiation V1 — disposable destruction model.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { World2DestructionProof, World2Instance } from './world2-real-instantiation-v1-types.js';
import { WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR } from './world2-real-instantiation-v1-bounds.js';
import { getWorld2Instance, registerWorld2Instance } from './world2-registry.js';

export function destroyWorld2Instance(input: {
  projectRootDir: string;
  worldId: string;
}): { instance: World2Instance; proof: World2DestructionProof } {
  const instance = getWorld2Instance(input.worldId);
  if (!instance) {
    throw new Error(`World2 instance not found: ${input.worldId}`);
  }
  if (instance.status === 'DESTROYED') {
    throw new Error(`World2 instance already destroyed: ${input.worldId}`);
  }

  const archiveDir = join(
    input.projectRootDir,
    WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
    'archived',
    instance.worldId,
  );
  mkdirSync(archiveDir, { recursive: true });

  const executionArchive = join(instance.artifactDirectory, 'execution-result.json');
  if (existsSync(executionArchive)) {
    writeFileSync(
      join(archiveDir, 'execution-result.json'),
      readFileSync(executionArchive, 'utf8'),
      'utf8',
    );
  }

  let workspaceRemoved = false;
  if (existsSync(instance.workspacePath)) {
    try {
      rmSync(instance.workspacePath, { recursive: true, force: true });
      workspaceRemoved = !existsSync(instance.workspacePath);
    } catch {
      workspaceRemoved = false;
    }
  } else {
    workspaceRemoved = true;
  }

  const destroyedAt = new Date().toISOString();
  const proof: World2DestructionProof = {
    readOnly: true,
    worldId: instance.worldId,
    destroyedAt,
    workspaceRemoved,
    artifactsArchived: existsSync(archiveDir),
    registryUpdated: true,
  };

  writeFileSync(join(archiveDir, 'destruction-proof.json'), `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

  const destroyed: World2Instance = {
    ...instance,
    status: 'DESTROYED',
    runtimeState: 'ARCHIVED',
    destroyedAt,
  };

  return { instance: registerWorld2Instance(destroyed), proof };
}
