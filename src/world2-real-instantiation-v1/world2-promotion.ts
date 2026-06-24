/**
 * World2 Real Instantiation V1 — explicit promotion model.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { World2Instance, World2PromotionProof } from './world2-real-instantiation-v1-types.js';
import { getWorld2Instance, registerWorld2Instance } from './world2-registry.js';

export function promoteWorld2Instance(input: {
  worldId: string;
  operatorApproval: boolean;
}): { instance: World2Instance; proof: World2PromotionProof } {
  const instance = getWorld2Instance(input.worldId);
  if (!instance) {
    throw new Error(`World2 instance not found: ${input.worldId}`);
  }
  if (instance.status === 'DESTROYED') {
    throw new Error(`Cannot promote destroyed world: ${input.worldId}`);
  }
  if (!input.operatorApproval) {
    throw new Error('World2 promotion requires explicit operator approval');
  }

  const verificationProven =
    instance.world2VerificationProof?.verified === true ||
    instance.executionResult?.verificationProof === true ||
    (instance.executionResult?.buildProof === true && instance.executionResult?.previewProof === true);
  const aflaVerdict = instance.executionResult?.aflaVerdict ?? null;
  const productionScore = instance.executionResult?.productionReadinessScore ?? null;
  const productionVerdict = instance.executionResult?.productionReadinessVerdict ?? null;

  if (!verificationProven) {
    throw new Error('World2 promotion requires verification proof');
  }
  if (!aflaVerdict) {
    throw new Error('World2 promotion requires AFLA verdict');
  }
  if (productionScore === null || productionScore < 70) {
    throw new Error('World2 promotion requires production readiness proof');
  }

  const proof: World2PromotionProof = {
    readOnly: true,
    worldId: instance.worldId,
    promotedAt: new Date().toISOString(),
    operatorApproval: true,
    verificationProven,
    aflaVerdict,
    productionReadinessScore: productionScore,
    productionReadinessVerdict: productionVerdict,
    promotionExplicit: true,
  };

  const promoted: World2Instance = {
    ...instance,
    status: 'PROMOTED',
    promotionState: 'PROMOTED',
    promotedAt: proof.promotedAt,
    runtimeState: 'ARCHIVED',
  };

  writeFileSync(
    join(instance.artifactDirectory, 'promotion-proof.json'),
    `${JSON.stringify(proof, null, 2)}\n`,
    'utf8',
  );

  return { instance: registerWorld2Instance(promoted), proof };
}
