/**
 * Real Build Execution Pipeline V1.1 — build proof records.
 */

import type { RealBuildCategoryResult } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import type { BuildProofRecord } from './real-build-execution-pipeline-v11-types.js';

function stageStatus(
  attempted: boolean,
  passed: boolean,
): 'PASS' | 'FAIL' | 'SKIPPED' {
  if (!attempted) return 'SKIPPED';
  return passed ? 'PASS' : 'FAIL';
}

export function buildBuildProofRecords(
  results: readonly RealBuildCategoryResult[],
): readonly BuildProofRecord[] {
  return results.map((result) => {
    const stages = result.stageResults;
    const npmAttempted = Boolean(stages);
    return {
      readOnly: true,
      category: result.profile,
      productName: result.productName,
      profile: result.profile,
      workspacePath: result.workspacePath,
      installResult: stageStatus(npmAttempted, stages?.npmInstallOk ?? false),
      buildResult: stageStatus(npmAttempted, stages?.npmBuildOk ?? false),
      previewResult: stageStatus(
        npmAttempted,
        result.metrics.previewSuccess && (stages?.previewNavigationOk ?? false),
      ),
      uvlResult: stageStatus(npmAttempted, stages?.uvlPassed ?? false),
      paiResult: stageStatus(npmAttempted, stages?.paiPassed ?? false),
      aflaResult: result.executionProof.aflaVerdict,
      proofComplete: result.executionProof.proofComplete,
    };
  });
}
