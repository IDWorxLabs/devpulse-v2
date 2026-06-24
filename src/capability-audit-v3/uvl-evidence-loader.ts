/**
 * Capability Audit V3.1 — UVL Verification Execution V1 evidence loader.
 *
 * Distinguishes RBEP build/preview proof from UVL verification proof.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CoverageEvidence, UvlEvidenceRefresh } from './capability-audit-types.js';

export const UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR = '.uvl-verification-execution-v1';
export const RBEP_V11_ARTIFACT_DIR = '.real-build-execution-pipeline-v1-1';
export const UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN = 'UVL_VERIFICATION_EXECUTION_V1_PASS';
export const UVL_VERIFICATION_EXECUTION_V1_REPORT = 'UVL_VERIFICATION_EXECUTION_V1_REPORT.md';

const UVL_ARTIFACT_CANDIDATES = {
  coverage: ['verification-coverage.json'],
  proof: ['verification-proof.json'],
  confidence: ['verification-confidence.json'],
  matrix: ['verification-matrix.json'],
} as const;

const RBEP_ARTIFACT_CANDIDATES = {
  proofCoverage: ['proof-coverage.json'],
  generalization: ['generalization-score.json'],
} as const;

export interface SuiteCoverageSnapshot {
  categoriesRequired: number;
  buildCoverage: number;
  previewCoverage: number;
  verificationCoverage: number;
  aflaReviewCoverage: number;
  verificationCoveragePercent: number;
  verificationConfidenceScore: number;
  verificationProofStatus: string;
}

export interface UvlEvidenceSnapshot {
  generatedAt: string;
  artifactDir: string;
  reportPath: string;
  passToken: string | null;
  sourceFiles: readonly string[];
  suiteCoverage: SuiteCoverageSnapshot;
  /** RBEP proof-coverage verifiedCount — build-chain stage, not UVL verification. */
  rbepVerifiedCount: number;
  /** UVL verification-coverage verifiedCount — authoritative verification proof. */
  uvlVerifiedCount: number;
  uvlVerificationExecutionComplete: boolean;
  evidenceAvailable: boolean;
}

function resolveProjectRoot(projectRootDir?: string): string {
  return projectRootDir ?? process.cwd();
}

function findArtifactFile(dir: string, candidates: readonly string[]): string | null {
  if (!existsSync(dir)) return null;
  for (const name of candidates) {
    const path = join(dir, name);
    if (existsSync(path)) return path;
  }
  const files = readdirSync(dir);
  for (const candidate of candidates) {
    const base = candidate.replace('.json', '');
    const match = files.find((f) => f.includes(base) && f.endsWith('.json'));
    if (match) return join(dir, match);
  }
  return null;
}

function readJson<T>(path: string | null, fallback: T): T {
  if (!path || !existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function extractPassToken(reportPath: string): string | null {
  if (!existsSync(reportPath)) return null;
  try {
    const body = readFileSync(reportPath, 'utf8');
    const match = body.match(/`([A-Z0-9_]+_PASS)`/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function loadUvlEvidenceSnapshot(projectRootDir?: string): UvlEvidenceSnapshot {
  const root = resolveProjectRoot(projectRootDir);
  const uvlDir = join(root, UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR);
  const rbepDir = join(root, RBEP_V11_ARTIFACT_DIR);
  const reportPath = join(root, UVL_VERIFICATION_EXECUTION_V1_REPORT);

  const coveragePath = findArtifactFile(uvlDir, UVL_ARTIFACT_CANDIDATES.coverage);
  const confidencePath = findArtifactFile(uvlDir, UVL_ARTIFACT_CANDIDATES.confidence);
  const proofPath = findArtifactFile(uvlDir, UVL_ARTIFACT_CANDIDATES.proof);
  const matrixPath = findArtifactFile(uvlDir, UVL_ARTIFACT_CANDIDATES.matrix);
  const rbepCoveragePath = findArtifactFile(rbepDir, RBEP_ARTIFACT_CANDIDATES.proofCoverage);
  const rbepGeneralizationPath = findArtifactFile(rbepDir, RBEP_ARTIFACT_CANDIDATES.generalization);

  const uvlCoverage = readJson(coveragePath, {
    categoriesRequired: 15,
    verifiedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    verificationCoveragePercent: 0,
    builtCount: 0,
    previewedCount: 0,
  });

  const uvlConfidence = readJson(confidencePath, {
    verificationConfidenceScore: 0,
    verificationProofStatus: 'UNPROVEN',
  });

  const rbepCoverage = readJson(rbepCoveragePath, {
    categoriesRequired: 15,
    builtCount: 0,
    previewedCount: 0,
    verifiedCount: 0,
    reviewedCount: 0,
    aflaVerdictCount: 0,
    proofCoveragePercent: 0,
  });

  const rbepGeneralization = readJson(rbepGeneralizationPath, {
    executionGeneralizationScoreV2: 96,
  });

  const proofRecords = readJson<unknown[]>(proofPath, []);
  const verifiedFromProof =
    Array.isArray(proofRecords) && proofRecords.length > 0
      ? proofRecords.filter(
          (r) =>
            typeof r === 'object' &&
            r !== null &&
            (r as { verificationVerdict?: string }).verificationVerdict === 'VERIFIED',
        ).length
      : uvlCoverage.verifiedCount;

  const categoriesRequired =
    uvlCoverage.categoriesRequired ?? rbepCoverage.categoriesRequired ?? 15;
  const uvlVerifiedCount = Math.max(uvlCoverage.verifiedCount ?? 0, verifiedFromProof);
  const buildCoverage = rbepCoverage.builtCount ?? uvlCoverage.builtCount ?? 0;
  const previewCoverage = rbepCoverage.previewedCount ?? uvlCoverage.previewedCount ?? 0;
  const aflaReviewCoverage =
    rbepCoverage.aflaVerdictCount ?? rbepCoverage.reviewedCount ?? 0;

  const sourceFiles = [
    coveragePath,
    confidencePath,
    proofPath,
    matrixPath,
    rbepCoveragePath,
    rbepGeneralizationPath,
    existsSync(reportPath) ? reportPath : null,
  ].filter((p): p is string => Boolean(p));

  const uvlVerificationExecutionComplete =
    uvlVerifiedCount >= categoriesRequired &&
    (uvlCoverage.verificationCoveragePercent ?? 0) >= 100 &&
    (uvlConfidence.verificationConfidenceScore ?? 0) >= 100 &&
    uvlConfidence.verificationProofStatus === 'PROVEN';

  return {
    generatedAt: new Date().toISOString(),
    artifactDir: UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR,
    reportPath: UVL_VERIFICATION_EXECUTION_V1_REPORT,
    passToken: extractPassToken(reportPath),
    sourceFiles,
    suiteCoverage: {
      categoriesRequired,
      buildCoverage,
      previewCoverage,
      verificationCoverage: uvlVerifiedCount,
      aflaReviewCoverage,
      verificationCoveragePercent: uvlCoverage.verificationCoveragePercent ?? 0,
      verificationConfidenceScore: uvlConfidence.verificationConfidenceScore ?? 0,
      verificationProofStatus: uvlConfidence.verificationProofStatus ?? 'UNPROVEN',
    },
    rbepVerifiedCount: rbepCoverage.verifiedCount ?? 0,
    uvlVerifiedCount,
    uvlVerificationExecutionComplete,
    evidenceAvailable: sourceFiles.length >= 3,
  };
}

export function buildUvlEvidenceRefreshArtifact(
  snapshot: UvlEvidenceSnapshot,
): Record<string, unknown> {
  return {
    version: 'V3.1',
    generatedAt: snapshot.generatedAt,
    auditRefresh: 'UVL Evidence Refresh',
    passToken: snapshot.passToken,
    sourceFiles: snapshot.sourceFiles,
    isUvlVerificationExecutionMissing: !snapshot.uvlVerificationExecutionComplete,
    verifiedCount: `${snapshot.uvlVerifiedCount}/${snapshot.suiteCoverage.categoriesRequired}`,
    verificationCoveragePercent: snapshot.suiteCoverage.verificationCoveragePercent,
    verificationConfidenceScore: snapshot.suiteCoverage.verificationConfidenceScore,
    verificationProofStatus: snapshot.suiteCoverage.verificationProofStatus,
    suiteCoverage: {
      buildCoverage: `${snapshot.suiteCoverage.buildCoverage}/${snapshot.suiteCoverage.categoriesRequired}`,
      previewCoverage: `${snapshot.suiteCoverage.previewCoverage}/${snapshot.suiteCoverage.categoriesRequired}`,
      verificationCoverage: `${snapshot.suiteCoverage.verificationCoverage}/${snapshot.suiteCoverage.categoriesRequired}`,
      aflaReviewCoverage: `${snapshot.suiteCoverage.aflaReviewCoverage}/${snapshot.suiteCoverage.categoriesRequired}`,
    },
    rbepVerifiedCountNote:
      'RBEP proof-coverage verifiedCount tracks build-chain stage; UVL verification-coverage is authoritative for verification proof.',
    rbepVerifiedCount: snapshot.rbepVerifiedCount,
    uvlVerifiedCount: snapshot.uvlVerifiedCount,
    uvlVerificationExecutionComplete: snapshot.uvlVerificationExecutionComplete,
  };
}

function percent(count: number, required: number): number {
  if (required <= 0) return 0;
  return Math.round((count / required) * 100);
}

export function buildCoverageEvidenceFromSnapshot(snapshot: UvlEvidenceSnapshot): CoverageEvidence {
  const suite = snapshot.suiteCoverage;
  const required = suite.categoriesRequired;
  return {
    buildCoverage: {
      count: suite.buildCoverage,
      required,
      percent: percent(suite.buildCoverage, required),
      source: RBEP_V11_ARTIFACT_DIR,
    },
    previewCoverage: {
      count: suite.previewCoverage,
      required,
      percent: percent(suite.previewCoverage, required),
      source: RBEP_V11_ARTIFACT_DIR,
    },
    verificationCoverage: {
      count: suite.verificationCoverage,
      required,
      percent: suite.verificationCoveragePercent,
      source: UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR,
    },
    aflaReviewCoverage: {
      count: suite.aflaReviewCoverage,
      required,
      percent: percent(suite.aflaReviewCoverage, required),
      source: RBEP_V11_ARTIFACT_DIR,
    },
  };
}

export function buildUvlEvidenceRefreshFromSnapshot(snapshot: UvlEvidenceSnapshot): UvlEvidenceRefresh {
  return {
    artifactDir: snapshot.artifactDir,
    consumedArtifacts: [
      `${snapshot.artifactDir}/verification-coverage.json`,
      `${snapshot.artifactDir}/verification-proof.json`,
      `${snapshot.artifactDir}/verification-confidence.json`,
      `${snapshot.artifactDir}/verification-matrix.json`,
      snapshot.reportPath,
    ],
    verifiedCount: snapshot.uvlVerifiedCount,
    categoriesRequired: snapshot.suiteCoverage.categoriesRequired,
    verificationCoveragePercent: snapshot.suiteCoverage.verificationCoveragePercent,
    verificationConfidenceScore: snapshot.suiteCoverage.verificationConfidenceScore,
    verificationProofStatus: snapshot.suiteCoverage.verificationProofStatus,
    uvlVerificationExecutionComplete: snapshot.uvlVerificationExecutionComplete,
    passToken: snapshot.uvlVerificationExecutionComplete
      ? UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN
      : 'UVL_VERIFICATION_EXECUTION_V1_INCOMPLETE',
  };
}

/** @deprecated Use loadUvlEvidenceSnapshot */
export function loadAuditEvidenceSnapshot(projectRootDir?: string): UvlEvidenceSnapshot {
  return loadUvlEvidenceSnapshot(projectRootDir);
}
