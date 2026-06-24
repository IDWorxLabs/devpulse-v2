/**
 * Real Build Execution Pipeline V1.1 — types.
 */

import type { RealBuildCategoryResult } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';

export interface BuildProofRecord {
  readOnly: true;
  category: string;
  productName: string;
  profile: string;
  workspacePath: string | null;
  installResult: 'PASS' | 'FAIL' | 'SKIPPED';
  buildResult: 'PASS' | 'FAIL' | 'SKIPPED';
  previewResult: 'PASS' | 'FAIL' | 'SKIPPED';
  uvlResult: 'PASS' | 'FAIL' | 'SKIPPED';
  paiResult: 'PASS' | 'FAIL' | 'SKIPPED';
  aflaResult: string;
  proofComplete: boolean;
}

export interface ExecutionMatrixEntry {
  readOnly: true;
  productName: string;
  profile: string;
  status: 'PASS' | 'FAIL';
  proofComplete: boolean;
}

export interface ExecutionFailureIntelligenceEntry {
  readOnly: true;
  category: string;
  productName: string;
  failureClass: string;
  rootCause: string;
  stage: string;
}

export interface ProofCoverageReport {
  readOnly: true;
  categoriesRequired: number;
  categoriesWithFullProof: number;
  proofCoveragePercent: number;
  builtCount: number;
  previewedCount: number;
  verifiedCount: number;
  reviewedCount: number;
  aflaVerdictCount: number;
}

export interface RealBuildExecutionPipelineV11Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  version: 'V1.1';
  generatedAt: string;
  categoriesTested: number;
  categoriesWithFullProof: number;
  proofCoveragePercent: number;
  executionGeneralizationScoreV2: number;
  executionProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  metrics: import('../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js').RealBuildExecutionMetrics;
  buildProof: readonly BuildProofRecord[];
  executionMatrix: readonly ExecutionMatrixEntry[];
  failureIntelligence: readonly ExecutionFailureIntelligenceEntry[];
  proofCoverage: ProofCoverageReport;
  categoryResults: readonly RealBuildCategoryResult[];
  recentExecutionRuns: readonly {
    profile: string;
    productName: string;
    proofComplete: boolean;
    aflaVerdict: string;
    updatedAt: string;
  }[];
}
