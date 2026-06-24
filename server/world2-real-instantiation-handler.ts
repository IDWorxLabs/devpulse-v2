/**
 * World2 Real Instantiation Operator API.
 */

import {
  listWorld2Instances,
  buildWorld2RegistrySnapshot,
  WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
  loadWorld2RealInstantiationAssessmentFromDisk,
  runWorld2RealInstantiationV1,
} from '../src/world2-real-instantiation-v1/index.js';
import type { World2RealInstantiationAssessment } from '../src/world2-real-instantiation-v1/world2-real-instantiation-v1-types.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export { WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface World2RealInstantiationPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_world2_real_instantiation_v1';
  canonicalOwner: 'World2 Real Instantiation V1';
  passToken: string;
  worldCount: number;
  activeWorlds: number;
  completedWorlds: number;
  promotedWorlds: number;
  destroyedWorlds: number;
  isolationStatus: string;
  promotionStatus: string;
  executionStatus: string;
  contaminationIncidents: number;
  world1Protected: boolean;
  worlds: readonly {
    worldId: string;
    productName: string;
    profile: string;
    status: string;
    executionMode: string;
    promotionState: string;
  }[];
  assessment: World2RealInstantiationAssessment | null;
}

export function buildWorld2RealInstantiationPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): World2RealInstantiationPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const cached = loadWorld2RealInstantiationAssessmentFromDisk(projectRootDir);
  const assessment = input?.refresh
    ? runWorld2RealInstantiationV1({ projectRootDir })
    : cached;

  const registry = assessment?.registry ?? buildWorld2RegistrySnapshot();
  const worlds = listWorld2Instances();

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_world2_real_instantiation_v1',
    canonicalOwner: 'World2 Real Instantiation V1',
    passToken: assessment?.passToken ?? 'WORLD2_REAL_INSTANTIATION_V1_INCOMPLETE',
    worldCount: registry.totalWorlds,
    activeWorlds: registry.activeWorlds.length,
    completedWorlds: registry.completedWorlds.length,
    promotedWorlds: registry.promotedWorlds.length,
    destroyedWorlds: registry.destroyedWorlds.length,
    isolationStatus: assessment?.isolationProof?.world1Protected
      ? 'ISOLATED'
      : assessment
        ? 'CONTAMINATION_RISK'
        : 'UNKNOWN',
    promotionStatus:
      assessment && assessment.promotionProofs.length > 0 ? 'PROMOTION_PROVEN' : 'NOT_PROMOTED',
    executionStatus: assessment?.instantiationProofStatus ?? 'NOT_PROVEN',
    contaminationIncidents: assessment?.contaminationIncidents ?? 0,
    world1Protected: assessment?.world1Protected ?? false,
    worlds: worlds.map((w) => ({
      worldId: w.worldId,
      productName: w.productName,
      profile: w.profile,
      status: w.status,
      executionMode: w.executionMode,
      promotionState: w.promotionState,
    })),
    assessment,
  };
}

export function sendWorld2RealInstantiationJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildWorld2RealInstantiationPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'world2-real-instantiation-v1',
    'X-DevPulse-Canonical-Owner': 'World2 Real Instantiation V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
