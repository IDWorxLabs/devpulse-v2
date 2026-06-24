/**
 * Mobile Runtime Validation at Scale V1 — World2 mobile execution proof.
 */

import { existsSync } from 'node:fs';
import {
  createWorld2Instance,
  executeWorld2Instance,
  listWorld2Instances,
  loadWorld2RegistryFromDisk,
} from '../world2-real-instantiation-v1/index.js';
import type { MobileWorld2Result } from './mobile-runtime-validation-v1-types.js';
import { MOBILE_WORLD2_PROFILES } from './mobile-runtime-validation-v1-bounds.js';
import { isCategoryMobileProven, validateMobileRuntimeForProfile } from './mobile-runtime-validator.js';
import { MOBILE_RUNTIME_PROFILE_IDS } from './mobile-runtime-validation-v1-bounds.js';

export function runMobileWorld2Executions(input: {
  projectRootDir: string;
}): readonly MobileWorld2Result[] {
  loadWorld2RegistryFromDisk(input.projectRootDir);
  const results: MobileWorld2Result[] = [];
  const existing = listWorld2Instances().filter(
    (w) =>
      (w.status === 'COMPLETED' || w.status === 'PROMOTED') &&
      existsSync(`${w.workspacePath}/dist/index.html`),
  );

  const profilesNeeded = [...MOBILE_WORLD2_PROFILES];
  let usedExisting = 0;

  for (const profile of profilesNeeded) {
    const world = existing.find((w) => w.profile === profile && existsSync(`${w.workspacePath}/dist/index.html`));
    if (world) {
      const proofs = MOBILE_RUNTIME_PROFILE_IDS.map((runtimeProfile) =>
        validateMobileRuntimeForProfile({
          projectRootDir: input.projectRootDir,
          profile,
          runtimeProfile,
          workspacePath: world.workspacePath,
          executionContext: 'WORLD2',
        }),
      );
      results.push({
        readOnly: true,
        worldId: world.worldId,
        profile,
        productName: world.productName,
        mobileRuntimeProven: isCategoryMobileProven(proofs),
        workspacePath: world.workspacePath,
      });
      usedExisting += 1;
    }
  }

  for (const profile of profilesNeeded) {
    if (results.some((r) => r.profile === profile)) continue;

    const instance = createWorld2Instance({
      projectRootDir: input.projectRootDir,
      profile,
      executionMode: 'CLOUD_SIMULATED',
      instantiatedBy: 'mobile-runtime-validation-v1',
    });
    const executed = executeWorld2Instance({
      projectRootDir: input.projectRootDir,
      worldId: instance.worldId,
    });
    const proofs = MOBILE_RUNTIME_PROFILE_IDS.map((runtimeProfile) =>
      validateMobileRuntimeForProfile({
        projectRootDir: input.projectRootDir,
        profile,
        runtimeProfile,
        workspacePath: executed.workspacePath,
        executionContext: 'WORLD2',
      }),
    );
    results.push({
      readOnly: true,
      worldId: executed.worldId,
      profile,
      productName: executed.productName,
      mobileRuntimeProven: isCategoryMobileProven(proofs),
      workspacePath: executed.workspacePath,
    });
  }

  return results.slice(0, 3);
}
