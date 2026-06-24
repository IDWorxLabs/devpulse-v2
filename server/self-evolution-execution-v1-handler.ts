/**
 * Self-Evolution Execution V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadSelfEvolutionExecutionAssessmentFromDisk,
  runSelfEvolutionExecutionV1,
  SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
} from '../src/self-evolution-execution-v1/index.js';
import type { SelfEvolutionExecutionAssessment } from '../src/self-evolution-execution-v1/self-evolution-execution-v1-types.js';

export { SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface SelfEvolutionExecutionPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_self_evolution_execution_v1';
  canonicalOwner: 'Self-Evolution Execution V1';
  passToken: string;
  gapsDetected: number;
  proposalsGenerated: number;
  experimentsCompleted: number;
  promotionsCompleted: number;
  evolutionProofStatus: string;
  world1Protected: boolean;
  activeProposals: number;
  promotionCandidates: number;
  approvalQueueSize: number;
  assessment: SelfEvolutionExecutionAssessment | null;
}

export function buildSelfEvolutionExecutionPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): SelfEvolutionExecutionPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const cached = loadSelfEvolutionExecutionAssessmentFromDisk(projectRootDir);
  const assessment = input?.refresh
    ? runSelfEvolutionExecutionV1({ projectRootDir })
    : cached;

  const promotionCandidates =
    assessment?.approvalDecisions.filter((d) => d.decision === 'PROMOTABLE').length ?? 0;
  const approvalQueueSize =
    assessment?.approvalDecisions.filter((d) => d.decision === 'PENDING').length ?? 0;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_self_evolution_execution_v1',
    canonicalOwner: 'Self-Evolution Execution V1',
    passToken: assessment?.passToken ?? 'SELF_EVOLUTION_EXECUTION_V1_INCOMPLETE',
    gapsDetected: assessment?.gapsDetected ?? 0,
    proposalsGenerated: assessment?.proposalsGenerated ?? 0,
    experimentsCompleted: assessment?.experimentsCompleted ?? 0,
    promotionsCompleted: assessment?.promotionsCompleted ?? 0,
    evolutionProofStatus: assessment?.evolutionProofStatus ?? 'NOT_PROVEN',
    world1Protected: assessment?.productionProtection.world1Protected ?? false,
    activeProposals: assessment?.registry.proposals ?? 0,
    promotionCandidates,
    approvalQueueSize,
    assessment,
  };
}

export function sendSelfEvolutionExecutionJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildSelfEvolutionExecutionPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'self-evolution-execution-v1',
    'X-DevPulse-Canonical-Owner': 'Self-Evolution Execution V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
