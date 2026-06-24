/**
 * World2 Real Instantiation V1 — bounded world registry.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_WORLD2_REGISTRY_SIZE,
  WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
} from './world2-real-instantiation-v1-bounds.js';
import type { World2Instance, World2RegistrySnapshot } from './world2-real-instantiation-v1-types.js';

const registry: World2Instance[] = [];

function registryPath(projectRootDir: string): string {
  return join(projectRootDir, WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR, 'world-registry.json');
}

export function resetWorld2RegistryForTests(): void {
  registry.length = 0;
}

export function registerWorld2Instance(instance: World2Instance): World2Instance {
  const existing = registry.findIndex((w) => w.worldId === instance.worldId);
  if (existing >= 0) {
    registry[existing] = instance;
  } else {
    registry.push(instance);
    if (registry.length > MAX_WORLD2_REGISTRY_SIZE) {
      registry.splice(0, registry.length - MAX_WORLD2_REGISTRY_SIZE);
    }
  }
  return instance;
}

export function getWorld2Instance(worldId: string): World2Instance | null {
  return registry.find((w) => w.worldId === worldId) ?? null;
}

export function listWorld2Instances(): readonly World2Instance[] {
  return [...registry];
}

export function buildWorld2RegistrySnapshot(): World2RegistrySnapshot {
  const activeWorlds = registry.filter(
    (w) =>
      w.status !== 'COMPLETED' &&
      w.status !== 'DESTROYED' &&
      w.status !== 'PROMOTED' &&
      w.status !== 'FAILED',
  );
  const completedWorlds = registry.filter((w) => w.status === 'COMPLETED');
  const destroyedWorlds = registry.filter((w) => w.status === 'DESTROYED');
  const promotedWorlds = registry.filter((w) => w.status === 'PROMOTED');

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    activeWorlds,
    completedWorlds,
    destroyedWorlds,
    promotedWorlds,
    totalWorlds: registry.length,
  };
}

export function persistWorld2Registry(projectRootDir: string): void {
  const dir = join(projectRootDir, WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });
  const snapshot = buildWorld2RegistrySnapshot();
  writeFileSync(registryPath(projectRootDir), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
}

export function loadWorld2RegistryFromDisk(projectRootDir: string): void {
  const path = registryPath(projectRootDir);
  if (!existsSync(path)) return;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as World2RegistrySnapshot;
    for (const world of [
      ...data.activeWorlds,
      ...data.completedWorlds,
      ...data.destroyedWorlds,
      ...data.promotedWorlds,
    ]) {
      registerWorld2Instance(world);
    }
  } catch {
    // ignore corrupt registry
  }
}
