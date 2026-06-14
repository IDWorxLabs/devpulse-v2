/**
 * Operational evidence snapshot — aggregates synchronized chain truth, typecheck, and launch blockers.
 */

import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import {
  resolveConnectedExecutionChainTruth,
  CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
} from '../founder-test-integration/connected-execution-chain-truth.js';
import { resolveExecutionChainStageContext } from '../founder-test-integration/connected-execution-chain-stage-resolver.js';
import { getLatestFounderTestAssessment } from '../founder-test-integration/founder-test-integration-history.js';
import {
  getLatestRepositoryTypecheckBaseline,
  assessRepositoryTypecheckReality,
} from '../repository-typecheck-reality/index.js';
import {
  buildCapabilityTruthRegistry,
  highestImpactWeakness,
  listCapabilitiesByTruthLevel,
} from './capability-truth-registry.js';
import { detectOperationalTruthSourceContradictions } from './operational-truth-source-contradiction-detector.js';
import { buildOperationalTruthContext } from './operational-truth-context.js';
import { deriveUncertaintyLevel } from './uncertainty-model.js';
import type {
  BuildOperationalEvidenceSnapshotInput,
  OperationalEvidenceSnapshot,
  OperationalLaunchBlocker,
} from './chat-operational-self-knowledge-types.js';

function emptyExecutionChainTruth(generatedAt: string) {
  return resolveConnectedExecutionChainTruth({
    readOnly: true,
    buildMaterializationProven: false,
    runtimeProven: false,
    previewProven: false,
    verificationProven: false,
    launchProven: false,
    firstBrokenStage: null,
    builderMaterializationConnected: false,
    previewExperienceConnected: false,
    verificationExecutionConnected: false,
    launchExecutionConnected: false,
    buildMaterializationReport: null,
    verificationExecutionProof: null,
    launchReadinessProof: null,
    resolvedAt: generatedAt,
  });
}

function finalizeSnapshot(
  base: Omit<OperationalEvidenceSnapshot, 'operationalTruthContext'>,
): OperationalEvidenceSnapshot {
  return {
    ...base,
    operationalTruthContext: buildOperationalTruthContext(base),
  };
}

export function buildOperationalEvidenceSnapshot(
  input: BuildOperationalEvidenceSnapshotInput = {},
): OperationalEvidenceSnapshot {
  const rootDir = input.rootDir ?? process.cwd();
  const generatedAt = new Date().toISOString();

  if (input.skipHeavyAuthorities) {
    const executionChainTruth = emptyExecutionChainTruth(generatedAt);
    const capabilityTruth = buildCapabilityTruthRegistry(rootDir, executionChainTruth);
    const typecheck = assessRepositoryTypecheckReality({ source: 'NOT_RUN' });
    return finalizeSnapshot({
      readOnly: true,
      generatedAt,
      capabilityTruth,
      overallUncertainty: deriveUncertaintyLevel({
        provenCount: capabilityTruth.provenCount,
        notProvenCount: capabilityTruth.notProvenCount,
        unknownCount: capabilityTruth.unknownCount,
        hasLiveEvidence: false,
      }),
      executionChainTruth,
      executionTruthGeneratedAt: executionChainTruth.generatedAt,
      executionTruthSource: executionChainTruth.sourceAuthority,
      firstBrokenStage: executionChainTruth.firstBrokenStage,
      executionChainConnected: executionChainTruth.chainConnected,
      launchBlockers: [],
      typecheckState: typecheck.readinessState,
      typecheckClean: false,
      buildProofLevel: 'UNKNOWN',
      chatIntelligenceNote: 'Heavy authorities skipped',
      founderTestVerdict: null,
      truthSourceContradictions: [],
      evidenceSources: ['connected-execution-chain-truth', 'capability-truth-registry'],
    });
  }

  const chainContext = resolveExecutionChainStageContext(rootDir);
  const executionChainTruth = resolveConnectedExecutionChainTruth(chainContext);
  const capabilityTruth = buildCapabilityTruthRegistry(rootDir, executionChainTruth);
  const legacyExecutionProof = assessAutonomousBuildExecutionProof({ rootDir });
  const buildAssessment = assessConnectedBuildExecution({ rootDir });
  const typecheck =
    getLatestRepositoryTypecheckBaseline() ??
    assessRepositoryTypecheckReality({ source: 'NOT_RUN' });
  const latestFounderTest = getLatestFounderTestAssessment();

  const legacyStageProofLevels = Object.fromEntries(
    legacyExecutionProof.report.stageProofs.map((stage) => [stage.stage, stage.proofLevel]),
  );
  const truthSourceContradictions = detectOperationalTruthSourceContradictions({
    executionChainTruth,
    legacyStageProofLevels,
  });

  const launchBlockers: OperationalLaunchBlocker[] = [];

  if (executionChainTruth.firstBrokenStage) {
    launchBlockers.push({
      readOnly: true,
      label: `Execution chain break at ${executionChainTruth.firstBrokenStage}`,
      impact: 'HIGH',
      evidenceSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
    });
  }

  if (!executionChainTruth.chainConnected) {
    launchBlockers.push({
      readOnly: true,
      label: 'Execution chain not fully connected',
      impact: 'HIGH',
      evidenceSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
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

  if (!executionChainTruth.buildProven && buildAssessment.report.proofLevel !== 'PROVEN') {
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
      evidenceSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
    });
  }

  if (latestFounderTest?.verdict === 'NOT_FOUNDER_READY' && !executionChainTruth.launchProven) {
    launchBlockers.push({
      readOnly: true,
      label: `Latest Founder Test verdict: ${latestFounderTest.verdict}`,
      impact: 'MEDIUM',
      evidenceSource: 'founder-test-integration',
    });
  }

  return finalizeSnapshot({
    readOnly: true,
    generatedAt,
    capabilityTruth,
    overallUncertainty: deriveUncertaintyLevel({
      provenCount: capabilityTruth.provenCount,
      notProvenCount: capabilityTruth.notProvenCount,
      unknownCount: capabilityTruth.unknownCount,
      hasLiveEvidence: true,
    }),
    executionChainTruth,
    executionTruthGeneratedAt: executionChainTruth.generatedAt,
    executionTruthSource: executionChainTruth.sourceAuthority,
    firstBrokenStage: executionChainTruth.firstBrokenStage,
    executionChainConnected: executionChainTruth.chainConnected,
    launchBlockers,
    typecheckState: typecheck.readinessState,
    typecheckClean: typecheck.typecheckClean,
    buildProofLevel: executionChainTruth.buildProven ? 'PROVEN' : buildAssessment.report.proofLevel,
    chatIntelligenceNote: null,
    founderTestVerdict: latestFounderTest?.verdict ?? null,
    truthSourceContradictions,
    evidenceSources: [
      CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
      'connected-build-execution',
      'repository-typecheck-reality',
      'capability-truth-registry',
      ...(latestFounderTest ? ['founder-test-integration'] : []),
    ],
  });
}
