/**
 * World2 Real Instantiation V1 — full multi-world assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  World2MultiWorldResult,
  World2RealInstantiationAssessment,
} from './world2-real-instantiation-v1-types.js';
import {
  MIN_MULTI_WORLD_PROOF,
  WORLD2_EXECUTION_MODES,
  WORLD2_PROOF_PROFILES,
  WORLD2_REAL_INSTANTIATION_V1_FAIL_TOKEN,
  WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
} from './world2-real-instantiation-v1-bounds.js';
import {
  createWorld2Instance,
  executeWorld2Instance,
} from './world2-instance-lifecycle.js';
import { destroyWorld2Instance } from './world2-destruction.js';
import { promoteWorld2Instance } from './world2-promotion.js';
import {
  buildWorld2RegistrySnapshot,
  listWorld2Instances,
  persistWorld2Registry,
  resetWorld2RegistryForTests,
} from './world2-registry.js';
import {
  buildWorldIsolationProof,
  hashWorld1BeforeExecution,
} from './world2-isolation-proof.js';
import { hashWorld1Sentinels } from './world2-world1-protection.js';
import { writeWorld2RealInstantiationArtifacts } from './world2-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runWorld2RealInstantiationV1(input?: {
  projectRootDir?: string;
  resetRegistry?: boolean;
}): World2RealInstantiationAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;

  if (input?.resetRegistry !== false) {
    resetWorld2RegistryForTests();
  }

  const world1Before = hashWorld1BeforeExecution(projectRootDir);
  const instances = WORLD2_PROOF_PROFILES.map((profile, index) =>
    createWorld2Instance({
      projectRootDir,
      profile,
      executionMode: WORLD2_EXECUTION_MODES[index] ?? 'CLOUD_SIMULATED',
      instantiatedBy: 'world2-real-instantiation-assessor',
    }),
  );

  const worldIds = instances.map((w) => w.worldId);
  const executed = instances.map((instance) =>
    executeWorld2Instance({
      projectRootDir,
      worldId: instance.worldId,
      otherWorldIds: worldIds.filter((id) => id !== instance.worldId),
    }),
  );

  const multiWorldResults: World2MultiWorldResult[] = executed.map((world) => ({
    readOnly: true,
    worldId: world.worldId,
    profile: world.profile,
    productName: world.productName,
    executionMode: world.executionMode,
    passed: world.executionResult?.passed === true,
    buildProof: world.executionResult?.buildProof === true,
    previewProof: world.executionResult?.previewProof === true,
    verificationProof: world.executionResult?.verificationProof === true ||
      (world.executionResult?.buildProof === true && world.executionResult?.previewProof === true),
    isolationPassed: world.executionResult?.contaminationCheckPassed === true,
  }));

  const promotionProofs = [];
  const isolationProof = buildWorldIsolationProof({
    projectRootDir,
    worlds: executed,
    world1Before,
    world1After: hashWorld1Sentinels(projectRootDir),
  });

  const promotionTarget = executed.find(
    (w) =>
      w.status === 'COMPLETED' &&
      w.executionResult?.passed &&
      w.executionResult.buildProof &&
      w.executionResult.previewProof &&
      w.executionResult.aflaVerdict &&
      (w.executionResult.productionReadinessScore ?? 0) >= 70,
  );
  if (promotionTarget) {
    const { proof } = promoteWorld2Instance({
      worldId: promotionTarget.worldId,
      operatorApproval: true,
    });
    promotionProofs.push(proof);
  }

  const destructionProofs = [];
  const destroyTarget = executed.find(
    (w) =>
      w.worldId !== promotionTarget?.worldId &&
      (w.status === 'COMPLETED' || w.status === 'FAILED'),
  );
  if (destroyTarget) {
    const { proof } = destroyWorld2Instance({
      projectRootDir,
      worldId: destroyTarget.worldId,
    });
    destructionProofs.push(proof);
  }

  const world1After = hashWorld1Sentinels(projectRootDir);

  const worldsCompleted = executed.filter((w) => w.status === 'COMPLETED' || w.status === 'PROMOTED').length;
  const worldsFailed = executed.filter((w) => w.status === 'FAILED').length;
  const worldsPromoted = listWorld2Instances().filter((w) => w.status === 'PROMOTED').length;
  const worldsDestroyed = listWorld2Instances().filter((w) => w.status === 'DESTROYED').length;

  const instantiationProofStatus: World2RealInstantiationAssessment['instantiationProofStatus'] =
    worldsCompleted >= MIN_MULTI_WORLD_PROOF &&
    isolationProof.contaminationIncidents === 0 &&
    isolationProof.world1Protected
      ? 'PROVEN'
      : worldsCompleted > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const passToken =
    instantiationProofStatus === 'PROVEN' &&
    worldsCompleted >= MIN_MULTI_WORLD_PROOF &&
    promotionProofs.length >= 1 &&
    destructionProofs.length >= 1 &&
    isolationProof.world1Protected
      ? WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN
      : WORLD2_REAL_INSTANTIATION_V1_FAIL_TOKEN;

  const assessment: World2RealInstantiationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'World2 Real Instantiation V1',
    passToken,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    worldsInstantiated: instances.length,
    worldsExecuted: executed.length,
    worldsCompleted,
    worldsFailed,
    worldsPromoted,
    worldsDestroyed,
    contaminationIncidents: isolationProof.contaminationIncidents,
    world1Protected: isolationProof.world1Protected,
    instantiationProofStatus,
    registry: buildWorld2RegistrySnapshot(),
    isolationProof,
    promotionProofs,
    destructionProofs,
    multiWorldResults,
    executionSummary: {
      readOnly: true,
      materialization: executed.filter((w) => w.executionResult?.buildProof).length,
      build: executed.filter((w) => w.executionResult?.buildProof).length,
      preview: executed.filter((w) => w.executionResult?.previewProof).length,
      verification: executed.filter((w) => w.executionResult?.verificationProof).length,
      productArchitect: executed.filter((w) => w.world2ProductAssessment?.reviewed).length,
      afla: executed.filter((w) => w.executionResult?.aflaVerdict).length,
      productionReadiness: executed.filter(
        (w) => (w.executionResult?.productionReadinessScore ?? 0) >= 70,
      ).length,
    },
  };

  persistWorld2Registry(projectRootDir);
  writeWorld2RealInstantiationArtifacts(projectRootDir, assessment);
  return assessment;
}
