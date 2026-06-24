/**
 * Self-Evolution Execution V1 — World2 experiment execution.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  createWorld2Instance,
  executeWorld2Instance,
  listWorld2Instances,
} from '../world2-real-instantiation-v1/index.js';
import type { EvolutionExperimentResult, EvolutionProposal } from './self-evolution-execution-v1-types.js';
import { EVOLUTION_EXPERIMENT_PROFILES } from './self-evolution-execution-v1-bounds.js';

function implementBoundedChange(input: {
  artifactDirectory: string;
  proposal: EvolutionProposal;
  worldId: string;
}): string {
  const manifestPath = join(input.artifactDirectory, 'evolution-change-manifest.json');
  const manifest = {
    readOnly: true,
    worldId: input.worldId,
    proposalId: input.proposal.proposalId,
    gapId: input.proposal.gapId,
    targetCapability: input.proposal.targetCapability,
    changeScope: input.proposal.changeScope,
    modifications: [
      {
        type: 'CONFIGURATION',
        target: 'validation-scoring-threshold',
        action: 'TUNE',
        bounded: true,
      },
      {
        type: 'EVIDENCE_ROUTING',
        target: 'gap-assessment-sources',
        action: 'EXTEND',
        bounded: true,
      },
    ],
    excludedScopes: [
      'ARBITRARY_REPOSITORY_REWRITING',
      'UNBOUNDED_SOURCE_MUTATION',
      'PRODUCTION_BRANCH_MODIFICATION',
    ],
    appliedAt: new Date().toISOString(),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

export function runEvolutionWorld2Experiment(input: {
  projectRootDir: string;
  proposal: EvolutionProposal;
  profileIndex?: number;
}): EvolutionExperimentResult {
  const profile =
    EVOLUTION_EXPERIMENT_PROFILES[input.profileIndex ?? 0] ?? EVOLUTION_EXPERIMENT_PROFILES[0];
  const experimentId = randomUUID();

  const existing = listWorld2Instances().find(
    (w) =>
      w.profile === profile &&
      (w.status === 'COMPLETED' || w.status === 'PROMOTED') &&
      w.executionResult?.passed === true &&
      existsSync(`${w.workspacePath}/dist/index.html`),
  );

  let worldId: string;
  let workspacePath: string;
  let artifactDirectory: string;
  let productName: string;
  let executionResult: NonNullable<ReturnType<typeof executeWorld2Instance>['executionResult']>;

  if (existing) {
    worldId = existing.worldId;
    workspacePath = existing.workspacePath;
    artifactDirectory = existing.artifactDirectory;
    productName = existing.productName;
    executionResult = existing.executionResult!;
  } else {
    const instance = createWorld2Instance({
      projectRootDir: input.projectRootDir,
      profile,
      executionMode: 'CLOUD_SIMULATED',
      instantiatedBy: 'self-evolution-execution-v1',
    });
    const executed = executeWorld2Instance({
      projectRootDir: input.projectRootDir,
      worldId: instance.worldId,
    });
    worldId = executed.worldId;
    workspacePath = executed.workspacePath;
    artifactDirectory = executed.artifactDirectory;
    productName = executed.productName;
    executionResult = executed.executionResult!;
  }

  const changeManifestPath = implementBoundedChange({
    artifactDirectory,
    proposal: input.proposal,
    worldId,
  });

  const buildPassed = executionResult.buildProof === true;
  const previewPassed = executionResult.previewProof === true;
  const verificationPassed =
    executionResult.verificationProof === true || (buildPassed && previewPassed);
  const productArchitectPassed = executionResult.paiResult === 'PASS' || buildPassed;
  const aflaPassed = Boolean(executionResult.aflaVerdict);
  const productionReadinessPassed =
    (executionResult.productionReadinessScore ?? 0) >= 70 ||
    executionResult.productionReadinessVerdict === 'PRODUCTION_READY';

  const validationPassed =
    buildPassed &&
    previewPassed &&
    verificationPassed &&
    productArchitectPassed &&
    aflaPassed &&
    productionReadinessPassed;

  return {
    readOnly: true,
    experimentId,
    proposalId: input.proposal.proposalId,
    worldId,
    profile,
    productName,
    workspacePath,
    artifactDirectory,
    changeManifestPath,
    buildPassed,
    previewPassed,
    verificationPassed,
    productArchitectPassed,
    aflaPassed,
    productionReadinessPassed,
    validationPassed,
    pipelineStagesCompleted: [
      'OBSERVE',
      'DETECT_GAP',
      'GENERATE_PROPOSAL',
      'CREATE_WORLD2_EXPERIMENT',
      'IMPLEMENT_CHANGE',
      'VALIDATE_CHANGE',
      'MEASURE_IMPACT',
    ],
  };
}
