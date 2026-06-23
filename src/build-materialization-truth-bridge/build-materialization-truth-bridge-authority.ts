/**

 * Build Materialization Truth Bridge — authority orchestrator (Phase 26.75).

 * Read-only. No file mutation. No synthetic evidence.

 */



import { createHash } from 'node:crypto';

import {

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS,

} from './build-materialization-truth-bridge-registry.js';

import { recordBuildMaterializationTruthBridgeAssessment, resetBuildMaterializationTruthBridgeHistoryForTests } from './build-materialization-truth-bridge-history.js';

import {

  buildBuildMaterializationTruthBridgeReportMarkdown,

  buildBuildMaterializationTruthReconciliationReportMarkdown,

} from './build-materialization-truth-bridge-report-builder.js';

import { collectBuildMaterializationTruthEvidence } from './evidence-bridge.js';

import { reconcileBuildMaterializationTruth } from './truth-reconciler.js';

import type {

  AssessBuildMaterializationTruthBridgeInput,

  BuildMaterializationTruthBridgeAssessment,

  BuildMaterializationTruthBridgeReport,

} from './build-materialization-truth-bridge-types.js';



let bridgeCounter = 0;



export function resetBuildMaterializationTruthBridgeCounterForTests(): void {

  bridgeCounter = 0;

}



export function resetBuildMaterializationTruthBridgeModuleForTests(): void {

  resetBuildMaterializationTruthBridgeCounterForTests();

  resetBuildMaterializationTruthBridgeHistoryForTests();

}



function nextBridgeId(): string {

  bridgeCounter += 1;

  return `build-materialization-truth-bridge-${bridgeCounter}-${Date.now()}`;

}



function stableCacheKey(bridgeId: string, finalTruth: string): string {

  const digest = createHash('sha256')

    .update([BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS, bridgeId, finalTruth].join('|'))

    .digest('hex')

    .slice(0, 16);

  return `${BUILD_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX}:${digest}`;

}



function buildEvidenceSummaries(

  report: Omit<BuildMaterializationTruthBridgeReport, 'cacheKey'>,

): Pick<

  BuildMaterializationTruthBridgeReport,

  'filesystemEvidenceSummary' | 'founderTestVerdictSummary' | 'truthMatrixVerdictSummary'

> {

  const snap = report.evidence.snapshot;

  const rec = report.reconciliation;



  return {

    filesystemEvidenceSummary:

      `Disk scan: ${snap.existingArtifacts} existing artifact(s), ${snap.missingArtifacts} missing, ` +

      `${snap.workspaceCount} workspace(s), materializationVerdict=${snap.materializationVerdict}.`,

    founderTestVerdictSummary:

      `Founder Test BUILD stage: ${snap.founderBuildProofLevel}` +

      (snap.founderFirstBrokenLink ? `, firstBrokenLink=${snap.founderFirstBrokenLink}` : '') +

      `. Pre-reconciliation: ${rec.preReconciliationBuildVerdict}.` +

      (rec.founderTestVerdictReconciled ? ' **Reconciled against disk evidence.**' : ''),

    truthMatrixVerdictSummary:

      snap.truthMatrixBuildVerdict != null

        ? `Truth Matrix BUILD claim: ${snap.truthMatrixBuildVerdict}.` +

          (rec.truthMatrixVerdictUpdated ? ' **Updated by BUILD_MATERIALIZATION_TRUTH.**' : '')

        : 'Truth Matrix not assessed — BUILD_MATERIALIZATION_TRUTH will apply on next launch reconciliation.',

  };

}



export function assessBuildMaterializationTruthBridge(

  input: AssessBuildMaterializationTruthBridgeInput = {},

): BuildMaterializationTruthBridgeAssessment {

  const rootDir = input.rootDir ?? process.cwd();

  const bridgeId = nextBridgeId();



  const evidence = collectBuildMaterializationTruthEvidence({

    rootDir,

    materializationReality: input.materializationReality,

    connectedBuild: input.connectedBuild,

    autonomousBuildProof: input.autonomousBuildProof,

    truthMatrixIntegration: input.truthMatrixIntegration,

    skipMaterializationAssessment: input.skipMaterializationAssessment,

  });



  const reconciliation = reconcileBuildMaterializationTruth({
    evidence,
    reconciliationId: bridgeId,
  });

  const partialReport = {
    readOnly: true as const,
    advisoryOnly: true as const,
    bridgeId,
    generatedAt: new Date().toISOString(),
    coreQuestion: BUILD_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,
    evidence,
    reconciliation,
    finalBuildTruth: reconciliation.postReconciliationBuildVerdict,
    filesystemEvidenceSummary: '',
    founderTestVerdictSummary: '',
    truthMatrixVerdictSummary: '',
  };

  const cacheKey = stableCacheKey(bridgeId, reconciliation.postReconciliationBuildVerdict);

  const report: BuildMaterializationTruthBridgeReport = {
    ...partialReport,
    ...buildEvidenceSummaries(partialReport),
    cacheKey,
  };



  const assessment: BuildMaterializationTruthBridgeAssessment = {

    readOnly: true,

    advisoryOnly: true,

    orchestrationState: 'BUILD_MATERIALIZATION_TRUTH_COMPLETE',

    report,

    cacheKey,

  };



  if (!input.skipHistoryRecording) {

    recordBuildMaterializationTruthBridgeAssessment(assessment);

  }



  return assessment;

}



export {

  buildBuildMaterializationTruthBridgeReportMarkdown,

  buildBuildMaterializationTruthReconciliationReportMarkdown,

};


