/**
 * Operational evidence snapshot — aggregates proof chain, typecheck, and launch blockers.
 */

import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import {
  getLatestRepositoryTypecheckBaseline,
  assessRepositoryTypecheckReality,
} from '../repository-typecheck-reality/index.js';
import {
  buildCapabilityTruthRegistry,
  highestImpactWeakness,
  listCapabilitiesByTruthLevel,
} from './capability-truth-registry.js';
import { deriveUncertaintyLevel } from './uncertainty-model.js';
import type {
  BuildOperationalEvidenceSnapshotInput,
  OperationalEvidenceSnapshot,
  OperationalLaunchBlocker,
} from './chat-operational-self-knowledge-types.js';

export function buildOperationalEvidenceSnapshot(
  input: BuildOperationalEvidenceSnapshotInput = {},
): OperationalEvidenceSnapshot {
  const rootDir = input.rootDir ?? process.cwd();
  const capabilityTruth = buildCapabilityTruthRegistry(rootDir);

  if (input.skipHeavyAuthorities) {
    const typecheck = assessRepositoryTypecheckReality({ source: 'NOT_RUN' });
    return {
      readOnly: true,
      generatedAt: new Date().toISOString(),
      capabilityTruth,
      overallUncertainty: deriveUncertaintyLevel({
        provenCount: capabilityTruth.provenCount,
        notProvenCount: capabilityTruth.notProvenCount,
        unknownCount: capabilityTruth.unknownCount,
        hasLiveEvidence: false,
      }),
      firstBrokenStage: null,
      executionChainConnected: false,
      launchBlockers: [],
      typecheckState: typecheck.readinessState,
      typecheckClean: false,
      buildProofLevel: 'UNKNOWN',
      chatIntelligenceNote: 'Heavy authorities skipped',
      evidenceSources: ['capability-truth-registry'],
    };
  }

  const executionProof = assessAutonomousBuildExecutionProof({ rootDir });
  const buildAssessment = assessConnectedBuildExecution({ rootDir });
  const typecheck =
    getLatestRepositoryTypecheckBaseline() ??
    assessRepositoryTypecheckReality({ source: 'NOT_RUN' });

  const launchBlockers: OperationalLaunchBlocker[] = [];

  if (executionProof.report.firstBrokenStage) {
    launchBlockers.push({
      readOnly: true,
      label: `Execution chain break at ${executionProof.report.firstBrokenStage}`,
      impact: 'HIGH',
      evidenceSource: 'autonomous-build-execution-proof',
    });
  }

  if (!executionProof.report.chainConnected) {
    launchBlockers.push({
      readOnly: true,
      label: 'Execution chain not fully connected',
      impact: 'HIGH',
      evidenceSource: 'autonomous-build-execution-proof',
    });
  }

  if (typecheck.blocksLaunchReadiness) {
    launchBlockers.push({
      readOnly: true,
      label: `Repository typecheck ${typecheck.readinessState}`,
      impact: 'HIGH',
      evidenceSource: 'repository-typecheck-reality',
    });
  }

  if (buildAssessment.report.proofLevel !== 'PROVEN') {
    launchBlockers.push({
      readOnly: true,
      label: `Build materialization ${buildAssessment.report.proofLevel}`,
      impact: 'MEDIUM',
      evidenceSource: 'connected-build-execution',
    });
  }

  const weakness = highestImpactWeakness(capabilityTruth);
  if (weakness && launchBlockers.length < 5) {
    launchBlockers.push({
      readOnly: true,
      label: `Unproven capability: ${weakness.label}`,
      impact: 'MEDIUM',
      evidenceSource: weakness.evidenceSource,
    });
  }

  const notProven = listCapabilitiesByTruthLevel(capabilityTruth, 'NOT_PROVEN');
  if (notProven.length > 0 && launchBlockers.length < 6) {
    launchBlockers.push({
      readOnly: true,
      label: `${notProven.length} capability area(s) not proven`,
      impact: 'MEDIUM',
      evidenceSource: 'capability-truth-registry',
    });
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    capabilityTruth,
    overallUncertainty: deriveUncertaintyLevel({
      provenCount: capabilityTruth.provenCount,
      notProvenCount: capabilityTruth.notProvenCount,
      unknownCount: capabilityTruth.unknownCount,
      hasLiveEvidence: true,
    }),
    firstBrokenStage: executionProof.report.firstBrokenStage,
    executionChainConnected: executionProof.report.chainConnected,
    launchBlockers,
    typecheckState: typecheck.readinessState,
    typecheckClean: typecheck.typecheckClean,
    buildProofLevel: buildAssessment.report.proofLevel,
    chatIntelligenceNote: null,
    evidenceSources: [
      'autonomous-build-execution-proof',
      'connected-build-execution',
      'repository-typecheck-reality',
      'capability-truth-registry',
    ],
  };
}
