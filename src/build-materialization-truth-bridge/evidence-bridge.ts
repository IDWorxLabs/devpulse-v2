/**

 * Build Materialization Truth Bridge — evidence collector (Phase 26.75).

 * Read-only. Consumes upstream authorities without mutation.

 */



import { analyzeBuildStage } from '../autonomous-build-execution-proof/build-stage-analyzer.js';
import { assessBuildMaterializationReality } from '../build-materialization-reality/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';

import type { BuildMaterializationRealityAssessment } from '../build-materialization-reality/build-materialization-reality-types.js';

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';

import type { FounderTruthMatrixIntegrationAssessment } from '../founder-truth-matrix-integration/founder-truth-matrix-integration-types.js';

import type {

  BuildMaterializationTruthEvidence,

  BuildTruthEvidencePriority,

} from './build-materialization-truth-bridge-types.js';



export interface CollectBuildMaterializationTruthEvidenceInput {

  rootDir: string;

  materializationReality?: BuildMaterializationRealityAssessment;

  connectedBuild?: ConnectedBuildExecutionReport | null;

  autonomousBuildProof?: AutonomousBuildExecutionProofReport | null;

  truthMatrixIntegration?: FounderTruthMatrixIntegrationAssessment | null;

  skipMaterializationAssessment?: boolean;

}



const EVIDENCE_PRIORITY: readonly BuildTruthEvidencePriority[] = [

  'DISK_EVIDENCE',

  'WORKSPACE_EVIDENCE',

  'CONNECTED_BUILD_PROOF',

  'HISTORICAL_FOUNDER_REPORT',

  'CACHED_PROOF_SNAPSHOT',

];



function resolveTruthMatrixBuildVerdict(

  integration: FounderTruthMatrixIntegrationAssessment | null | undefined,

): ConsistencyVerdict | null {

  if (!integration) return null;

  const buildClaim = integration.report.reconciliation.claims.find(

    (c) => c.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS',

  );

  return buildClaim?.truthMatrixVerdict ?? null;

}



export function collectBuildMaterializationTruthEvidence(

  input: CollectBuildMaterializationTruthEvidenceInput,

): BuildMaterializationTruthEvidence {

  const rootDir = input.rootDir;



  const materializationReality =

    input.materializationReality ??

    assessBuildMaterializationReality({

      rootDir,

      skipHistoryRecording: true,

    });



  const connectedBuild =

    input.connectedBuild ??

    assessConnectedBuildExecution({

      rootDir,

      attemptBuildProofGapMaterialization: false,

    }).report;



  const buildStage = input.autonomousBuildProof
    ? input.autonomousBuildProof.stageProofs.find((s) => s.stage === 'BUILD')
    : analyzeBuildStage(connectedBuild);

  const scan = materializationReality.report.artifactScan;

  const workspaceExists =

    scan.workspaceRootExists &&

    (scan.workspaces.some((w) => w.workspaceExists) || scan.workspaceCount > 0);



  return {

    readOnly: true,

    rootDir,

    materializationReality,

    connectedBuild,

    autonomousBuildProof: input.autonomousBuildProof ?? null,

    truthMatrixIntegration: input.truthMatrixIntegration ?? null,

    snapshot: {

      readOnly: true,

      workspaceCount: scan.workspaceCount,

      existingArtifacts: scan.totalExistingArtifacts,

      missingArtifacts: scan.totalMissingArtifacts,

      workspaceExists,

      connectedBuildProofLevel: materializationReality.report.connectedBuildProofLevel,

      materializationVerdict: materializationReality.report.primaryVerdict,

      founderBuildProofLevel: buildStage?.proofLevel ?? 'NOT_PROVEN',

      founderFirstBrokenLink: connectedBuild?.linkageAnalysis.firstBrokenLink ?? null,

      truthMatrixBuildVerdict: resolveTruthMatrixBuildVerdict(input.truthMatrixIntegration),

    },

    evidencePriorityApplied: EVIDENCE_PRIORITY,

  };

}


