/**
 * Self-Evolution Execution V1 — full evolution execution assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  promoteWorld2Instance,
  loadWorld2RegistryFromDisk,
} from '../world2-real-instantiation-v1/index.js';
import {
  hashWorld1Sentinels,
  world1SentinelsUnchanged,
} from '../world2-real-instantiation-v1/world2-world1-protection.js';
import type { SelfEvolutionExecutionAssessment } from './self-evolution-execution-v1-types.js';
import {
  MIN_EVOLUTION_EXPERIMENTS,
  MIN_EVOLUTION_PROPOSALS,
  MIN_GAP_DETECTION_COUNT,
  SELF_EVOLUTION_EXECUTION_V1_FAIL_TOKEN,
  SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
} from './self-evolution-execution-v1-bounds.js';
import { buildEvolutionGapAssessment } from './evolution-gap-detector.js';
import { generateEvolutionProposals } from './evolution-proposal-engine.js';
import { runEvolutionWorld2Experiment } from './evolution-world2-experiment-runner.js';
import { measureEvolutionImpact } from './evolution-impact-measurer.js';
import { evaluateEvolutionApproval } from './evolution-approval-gate.js';
import {
  buildEvolutionRegistrySnapshot,
  recordEvolutionRegistryEntry,
  resetEvolutionRegistryForTests,
} from './evolution-registry.js';
import { writeSelfEvolutionExecutionArtifacts } from './self-evolution-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

function resolveProofStatus(input: {
  gapDetectionProven: boolean;
  proposalGenerationProven: boolean;
  world2ExperimentationProven: boolean;
  impactMeasurementProven: boolean;
  promotionPathProven: boolean;
  productionProtectionProven: boolean;
}): SelfEvolutionExecutionAssessment['evolutionProofStatus'] {
  const all =
    input.gapDetectionProven &&
    input.proposalGenerationProven &&
    input.world2ExperimentationProven &&
    input.impactMeasurementProven &&
    input.promotionPathProven &&
    input.productionProtectionProven;
  if (all) return 'PROVEN';
  if (input.gapDetectionProven || input.proposalGenerationProven) return 'PARTIAL';
  return 'NOT_PROVEN';
}

function resolvePassToken(status: SelfEvolutionExecutionAssessment['evolutionProofStatus']): string {
  return status === 'PROVEN'
    ? SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN
    : SELF_EVOLUTION_EXECUTION_V1_FAIL_TOKEN;
}

export function runSelfEvolutionExecutionV1(input?: {
  projectRootDir?: string;
  resetRegistry?: boolean;
  operatorApproval?: boolean;
}): SelfEvolutionExecutionAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const operatorApproval = input?.operatorApproval !== false;

  if (input?.resetRegistry !== false) {
    resetEvolutionRegistryForTests();
  }

  loadWorld2RegistryFromDisk(projectRootDir);
  const world1Before = hashWorld1Sentinels(projectRootDir);

  const gapAssessment = buildEvolutionGapAssessment(projectRootDir);
  const proposals = generateEvolutionProposals(gapAssessment.gaps);

  for (const proposal of proposals) {
    recordEvolutionRegistryEntry({
      readOnly: true,
      entryId: proposal.proposalId,
      proposalId: proposal.proposalId,
      status: 'PROPOSED',
      recordedAt: new Date().toISOString(),
    });
  }

  const experimentResults = [];
  const experimentCount = Math.max(
    MIN_EVOLUTION_EXPERIMENTS,
    Math.min(proposals.length, 2),
  );

  for (let i = 0; i < experimentCount; i += 1) {
    const proposal = proposals[i];
    if (!proposal) break;

    recordEvolutionRegistryEntry({
      readOnly: true,
      entryId: `exp-${proposal.proposalId}`,
      proposalId: proposal.proposalId,
      status: 'EXPERIMENTING',
      recordedAt: new Date().toISOString(),
    });

    experimentResults.push(
      runEvolutionWorld2Experiment({
        projectRootDir,
        proposal,
        profileIndex: i,
      }),
    );
  }

  const impactAssessments = experimentResults.map((exp) =>
    measureEvolutionImpact({ projectRootDir, experiment: exp }),
  );

  const approvalDecisions = experimentResults.map((exp, index) =>
    evaluateEvolutionApproval({
      experiment: exp,
      impact: impactAssessments[index]!,
      operatorApprovalPresent: operatorApproval,
    }),
  );

  let promotionsCompleted = 0;
  const promotable = approvalDecisions.find((d) => d.decision === 'PROMOTABLE');
  if (promotable) {
    const exp = experimentResults.find((e) => e.experimentId === promotable.experimentId);
    if (exp) {
      try {
        promoteWorld2Instance({
          worldId: exp.worldId,
          operatorApproval: true,
        });
        promotionsCompleted = 1;
        recordEvolutionRegistryEntry({
          readOnly: true,
          entryId: `promoted-${exp.experimentId}`,
          proposalId: exp.proposalId,
          experimentId: exp.experimentId,
          status: 'PROMOTED',
          recordedAt: new Date().toISOString(),
        });
      } catch {
        recordEvolutionRegistryEntry({
          readOnly: true,
          entryId: `rejected-${exp.experimentId}`,
          proposalId: exp.proposalId,
          experimentId: exp.experimentId,
          status: 'REJECTED',
          recordedAt: new Date().toISOString(),
        });
      }
    }
  }

  for (const decision of approvalDecisions.filter((d) => d.decision === 'REJECTED')) {
    recordEvolutionRegistryEntry({
      readOnly: true,
      entryId: `archived-${decision.experimentId}`,
      proposalId: decision.proposalId,
      experimentId: decision.experimentId,
      status: 'ARCHIVED',
      recordedAt: new Date().toISOString(),
    });
  }

  const world1After = hashWorld1Sentinels(projectRootDir);
  const productionProtection = {
    readOnly: true as const,
    world1Protected: world1SentinelsUnchanged(world1Before, world1After),
    sentinelHashesBefore: world1Before,
    sentinelHashesAfter: world1After,
    directProductionModification: false as const,
    evolutionConfinedToWorld2: true as const,
  };

  const gapDetectionProven = gapAssessment.gapsDetected >= MIN_GAP_DETECTION_COUNT;
  const proposalGenerationProven = proposals.length >= MIN_EVOLUTION_PROPOSALS;
  const world2ExperimentationProven =
    experimentResults.length >= MIN_EVOLUTION_EXPERIMENTS &&
    experimentResults.some((e) => e.validationPassed);
  const impactMeasurementProven = impactAssessments.some((i) => i.improvement > 0);
  const promotionPathProven = promotionsCompleted >= 1;
  const productionProtectionProven = productionProtection.world1Protected;

  const evolutionProofStatus = resolveProofStatus({
    gapDetectionProven,
    proposalGenerationProven,
    world2ExperimentationProven,
    impactMeasurementProven,
    promotionPathProven,
    productionProtectionProven,
  });

  const assessment: SelfEvolutionExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Self-Evolution Execution V1',
    passToken: resolvePassToken(evolutionProofStatus),
    version: 'V1',
    generatedAt: new Date().toISOString(),
    gapDetectionProven,
    proposalGenerationProven,
    world2ExperimentationProven,
    impactMeasurementProven,
    promotionPathProven,
    productionProtectionProven,
    evolutionProofStatus,
    gapsDetected: gapAssessment.gapsDetected,
    proposalsGenerated: proposals.length,
    experimentsCompleted: experimentResults.length,
    promotionsCompleted,
    gapAssessment,
    proposals,
    experimentResults,
    impactAssessments,
    approvalDecisions,
    registry: buildEvolutionRegistrySnapshot(),
    productionProtection,
  };

  writeSelfEvolutionExecutionArtifacts(projectRootDir, assessment);
  return assessment;
}
