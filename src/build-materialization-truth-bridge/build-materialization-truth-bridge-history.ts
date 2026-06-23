/**

 * Build Materialization Truth Bridge — bounded assessment history (Phase 26.75).

 */



import { MAX_BUILD_MATERIALIZATION_TRUTH_BRIDGE_HISTORY } from './build-materialization-truth-bridge-registry.js';

import type {

  BuildMaterializationTruthBridgeAssessment,

  BuildMaterializationTruthBridgeHistoryEntry,

} from './build-materialization-truth-bridge-types.js';



const history: BuildMaterializationTruthBridgeHistoryEntry[] = [];



export function resetBuildMaterializationTruthBridgeHistoryForTests(): void {

  history.length = 0;

}



export function recordBuildMaterializationTruthBridgeAssessment(

  assessment: BuildMaterializationTruthBridgeAssessment,

): void {

  history.unshift({

    readOnly: true,

    bridgeId: assessment.report.bridgeId,

    generatedAt: assessment.report.generatedAt,

    finalBuildTruth: assessment.report.finalBuildTruth,

    rootCause: assessment.report.reconciliation.rootCause,

    contradictionCount: assessment.report.reconciliation.contradictionCount,

    cacheKey: assessment.cacheKey,

  });

  if (history.length > MAX_BUILD_MATERIALIZATION_TRUTH_BRIDGE_HISTORY) {

    history.length = MAX_BUILD_MATERIALIZATION_TRUTH_BRIDGE_HISTORY;

  }

}



export function getBuildMaterializationTruthBridgeHistorySize(): number {

  return history.length;

}



export function getLatestBuildMaterializationTruthBridgeHistoryEntry(): BuildMaterializationTruthBridgeHistoryEntry | null {

  return history[0] ?? null;

}



export function getBuildMaterializationTruthBridgeHistory(): readonly BuildMaterializationTruthBridgeHistoryEntry[] {

  return history;

}


