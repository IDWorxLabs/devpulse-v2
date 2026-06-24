/**
 * Real Build Execution Pipeline V1.1 — failure intelligence with root-cause attribution.
 */

import type { RealBuildCategoryResult } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import type { ExecutionFailureIntelligenceEntry } from './real-build-execution-pipeline-v11-types.js';

function rootCauseFor(result: RealBuildCategoryResult): {
  stage: string;
  rootCause: string;
  bucket: string;
} {
  const stages = result.stageResults;
  if (!result.metrics.generationSuccess) {
    return {
      stage: 'Planning',
      rootCause: 'Build-ready contract or code generation did not complete',
      bucket: 'Generation Failures',
    };
  }
  if (!result.metrics.materializationSuccess) {
    return {
      stage: 'Materialization',
      rootCause: 'Workspace files were not written to disk',
      bucket: 'Generation Failures',
    };
  }
  if (!stages?.npmInstallOk) {
    return {
      stage: 'npm install',
      rootCause: 'npm install failed in generated workspace',
      bucket: 'Install Failures',
    };
  }
  if (!stages?.npmBuildOk) {
    return {
      stage: 'npm build',
      rootCause: 'npm run build failed — compilation or bundling error',
      bucket: 'Build Failures',
    };
  }
  if (!result.metrics.previewSuccess || !stages.previewNavigationOk) {
    return {
      stage: 'Live Preview',
      rootCause: 'Preview HTML, shell, navigation, or core feature did not validate',
      bucket: 'Preview Failures',
    };
  }
  if (!stages?.uvlPassed) {
    return {
      stage: 'UVL',
      rootCause: 'Verification confidence insufficient for execution proof',
      bucket: 'Verification Failures',
    };
  }
  if (!stages.paiPassed) {
    return {
      stage: 'Product Architect',
      rootCause: 'Product not architecturally complete and executed',
      bucket: 'Verification Failures',
    };
  }
  if (!stages.aflaVerdictIssued) {
    return {
      stage: 'AFLA',
      rootCause: 'Founder launch verdict was not issued',
      bucket: 'Founder Failures',
    };
  }
  return {
    stage: 'None',
    rootCause: 'Full execution proof chain complete',
    bucket: 'None',
  };
}

export function buildExecutionFailureIntelligence(
  results: readonly RealBuildCategoryResult[],
): readonly ExecutionFailureIntelligenceEntry[] {
  return results
    .filter((result) => !result.executionProof.proofComplete)
    .map((result) => {
      const attribution = rootCauseFor(result);
      return {
        readOnly: true,
        category: result.profile,
        productName: result.productName,
        failureClass: result.failureClass,
        rootCause: attribution.rootCause,
        stage: attribution.stage,
      };
    });
}

export function buildFailureIntelligenceSummary(
  results: readonly RealBuildCategoryResult[],
): Array<{ bucket: string; count: number }> {
  const counts = new Map<string, number>();
  for (const result of results.filter((r) => !r.executionProof.proofComplete)) {
    const { bucket } = rootCauseFor(result);
    if (bucket === 'None') continue;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return [...counts.entries()].map(([bucket, count]) => ({ bucket, count }));
}
