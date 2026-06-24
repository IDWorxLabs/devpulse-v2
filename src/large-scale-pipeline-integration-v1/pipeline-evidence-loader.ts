/**
 * Large-Scale Pipeline Integration V1 — authoritative evidence loader.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR } from '../production-readiness-gate-v1/production-readiness-gate-v1-bounds.js';
import { CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR } from '../cloud-execution-path-v1/cloud-execution-path-v1-bounds.js';
import { GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR } from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-bounds.js';
import type { EvidenceSourceRecord } from './large-scale-pipeline-integration-v1-types.js';

export const RBEP_ARTIFACT_DIR = '.real-build-execution-pipeline-v1-1';
export const UVL_ARTIFACT_DIR = '.uvl-verification-execution-v1';
export const AFLA_ARTIFACT_DIR = '.autonomous-founder-launch-authority';
export const PAI_ARTIFACT_DIR = '.product-architect-intelligence-v1';
export const LARGE_SCALE_ARTIFACT_DIR = '.large-scale-multi-app-validation';

const EVIDENCE_DIRS = {
  rbep: RBEP_ARTIFACT_DIR,
  uvl: UVL_ARTIFACT_DIR,
  prg: PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR,
  gpcg: GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  cloud: CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR,
  afla: AFLA_ARTIFACT_DIR,
  pai: PAI_ARTIFACT_DIR,
  largeScale: LARGE_SCALE_ARTIFACT_DIR,
} as const;

function resolveRoot(projectRootDir?: string): string {
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

export interface RbepBuildProofEntry {
  profile?: string;
  category?: string;
  productName?: string;
  buildResult?: string;
  previewResult?: string;
  uvlResult?: string;
  paiResult?: string;
  aflaResult?: string;
  proofComplete?: boolean;
}

export interface UvlProofEntry {
  profile?: string;
  verificationVerdict?: string;
}

export interface PipelineEvidenceBundle {
  readOnly: true;
  generatedAt: string;
  projectRootDir: string;
  evidenceSources: readonly EvidenceSourceRecord[];
  rbepBuildProof: readonly RbepBuildProofEntry[];
  rbepGeneralization: {
    buildSuccessRate: number;
    previewSuccessRate: number;
    verificationSuccessRate: number;
    launchSuccessRate: number;
    executionProofCompleteRate: number;
  };
  rbepProofCoverage: {
    categoriesRequired: number;
    categoriesWithFullProof: number;
    builtCount: number;
    previewedCount: number;
    verifiedCount: number;
    aflaVerdictCount: number;
    proofCoveragePercent: number;
  };
  uvlCoverage: {
    categoriesRequired: number;
    verifiedCount: number;
    verificationCoveragePercent: number;
  };
  uvlProof: readonly UvlProofEntry[];
  productionAssessment: {
    categoriesEvaluated: number;
    categoriesProductionReady: number;
    productionReadinessScore: number;
    productionProofStatus: string;
    passToken: string | null;
  };
  gpcgAssessment: {
    domainsEvaluated: number;
    domainsGenerated: number;
    domainsBuildProven: number;
    domainsPreviewProven: number;
    domainsProductionReady: number;
    generalPurposeMaturityScore: number;
    proofStatus: string;
    passToken: string | null;
    domainProfiles: readonly string[];
  };
  cloudAssessment: {
    jobsSubmitted: number;
    jobsCompleted: number;
    jobsFailed: number;
    cloudSimulatedProofStatus: string;
    passToken: string | null;
    profiles: readonly string[];
  };
  aflaSuite: ReadonlyArray<{
    profile?: string;
    verdict?: string;
    passed?: boolean;
    overallFounderScore?: number;
  }>;
  paiAssessment: {
    categoriesReviewed: number;
    passToken: string | null;
  };
  largeScaleAssessment: {
    categoriesTested: number;
    buildSuccessRate: number;
    generationSuccessRate: number;
    profiles: readonly string[];
  };
}

export function loadPipelineEvidenceBundle(projectRootDir?: string): PipelineEvidenceBundle {
  const root = resolveRoot(projectRootDir);
  const evidenceSources: EvidenceSourceRecord[] = [];

  function loadSystem(
    system: string,
    dirKey: keyof typeof EVIDENCE_DIRS,
    artifactCandidates: readonly string[],
    reportTitle?: string,
  ): { paths: string[]; passToken: string | null } {
    const artifactDir = EVIDENCE_DIRS[dirKey];
    const dir = join(root, artifactDir);
    const paths = artifactCandidates
      .map((c) => findArtifactFile(dir, [c]))
      .filter((p): p is string => Boolean(p));
    const reportPath = reportTitle ? join(root, reportTitle) : null;
    const passToken = reportPath ? extractPassToken(reportPath) : null;
    evidenceSources.push({
      readOnly: true,
      system,
      artifactDir,
      artifacts: paths.map((p) => p.replace(root + '\\', '').replace(root + '/', '')),
      passToken,
      evidenceAvailable: paths.length > 0,
    });
    return { paths, passToken };
  }

  const rbep = loadSystem(
    'Real Build Execution Pipeline V1.1',
    'rbep',
    ['build-proof.json', 'proof-coverage.json', 'generalization-score.json'],
    'REAL_BUILD_EXECUTION_PIPELINE_V1_1_REPORT.md',
  );
  const uvl = loadSystem(
    'UVL Verification Execution V1',
    'uvl',
    ['verification-coverage.json', 'verification-proof.json', 'verification-confidence.json'],
    'UVL_VERIFICATION_EXECUTION_V1_REPORT.md',
  );
  const prg = loadSystem(
    'Production Readiness Gate V1',
    'prg',
    ['assessment.json'],
    'PRODUCTION_READINESS_GATE_V1_REPORT.md',
  );
  const gpcg = loadSystem(
    'General-Purpose Code Generation V1',
    'gpcg',
    ['assessment.json'],
    'GENERAL_PURPOSE_CODE_GENERATION_V1_REPORT.md',
  );
  const cloud = loadSystem(
    'Cloud Execution Path V1',
    'cloud',
    ['assessment.json'],
    'CLOUD_EXECUTION_PATH_V1_REPORT.md',
  );
  const afla = loadSystem(
    'Autonomous Founder Launch Authority',
    'afla',
    ['suite-summary.json'],
    'AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_REPORT.md',
  );
  const pai = loadSystem(
    'Product Architect Intelligence V1',
    'pai',
    ['assessment.json'],
    'PRODUCT_ARCHITECT_INTELLIGENCE_V1_REPORT.md',
  );
  const largeScale = loadSystem(
    'Large-Scale Multi-App Validation V1',
    'largeScale',
    ['assessment.json'],
    'LARGE_SCALE_MULTI_APP_VALIDATION_REPORT.md',
  );

  const rbepBuildProof = readJson<RbepBuildProofEntry[]>(
    findArtifactFile(join(root, RBEP_ARTIFACT_DIR), ['build-proof.json']),
    [],
  );
  const rbepGeneralizationRaw = readJson(
    findArtifactFile(join(root, RBEP_ARTIFACT_DIR), ['generalization-score.json']),
    { metrics: {} },
  ) as { metrics?: Record<string, number> };
  const rbepCoverageRaw = readJson(
    findArtifactFile(join(root, RBEP_ARTIFACT_DIR), ['proof-coverage.json']),
    {},
  ) as Record<string, number>;

  const uvlCoverageRaw = readJson(
    findArtifactFile(join(root, UVL_ARTIFACT_DIR), ['verification-coverage.json']),
    {},
  ) as Record<string, number>;
  const uvlProof = readJson<UvlProofEntry[]>(
    findArtifactFile(join(root, UVL_ARTIFACT_DIR), ['verification-proof.json']),
    [],
  );

  const productionRaw = readJson(
    prg.paths[0] ?? null,
    {},
  ) as Record<string, unknown>;
  const gpcgRaw = readJson(
    gpcg.paths[0] ?? null,
    {},
  ) as {
    domainsEvaluated?: number;
    domainsGenerated?: number;
    domainsBuildProven?: number;
    domainsPreviewProven?: number;
    domainsProductionReady?: number;
    generalPurposeMaturityScore?: number;
    proofStatus?: string;
    passToken?: string;
    domainResults?: Array<{ profile?: string }>;
  };
  const cloudRaw = readJson(
    cloud.paths[0] ?? null,
    {},
  ) as {
    jobsSubmitted?: number;
    jobsCompleted?: number;
    jobsFailed?: number;
    cloudSimulatedProofStatus?: string;
    passToken?: string;
    jobResults?: Array<{
      job?: { requirementsSnapshot?: { profile?: string } };
    }>;
  };
  const aflaSuite = readJson(
    findArtifactFile(join(root, AFLA_ARTIFACT_DIR), ['suite-summary.json']),
    [],
  ) as PipelineEvidenceBundle['aflaSuite'];
  const paiRaw = readJson(
    pai.paths[0] ?? null,
    {},
  ) as { categoriesReviewed?: number; passToken?: string };
  const largeScaleRaw = readJson(
    largeScale.paths[0] ?? null,
    {},
  ) as {
    categoriesTested?: number;
    passRates?: { buildSuccessRate?: number; generationSuccessRate?: number };
    categoryResults?: Array<{ profile?: string }>;
  };

  const gpcgProfiles = (gpcgRaw.domainResults ?? []).map((d) => d.profile).filter(Boolean) as string[];
  const cloudProfiles = (cloudRaw.jobResults ?? [])
    .map((j) => j.job?.requirementsSnapshot?.profile)
    .filter(Boolean) as string[];
  const largeScaleProfiles = (largeScaleRaw.categoryResults ?? [])
    .map((c) => c.profile)
    .filter(Boolean) as string[];

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    projectRootDir: root,
    evidenceSources,
    rbepBuildProof,
    rbepGeneralization: {
      buildSuccessRate: rbepGeneralizationRaw.metrics?.buildSuccessRate ?? 0,
      previewSuccessRate: rbepGeneralizationRaw.metrics?.previewSuccessRate ?? 0,
      verificationSuccessRate: rbepGeneralizationRaw.metrics?.verificationSuccessRate ?? 0,
      launchSuccessRate: rbepGeneralizationRaw.metrics?.launchSuccessRate ?? 0,
      executionProofCompleteRate: rbepGeneralizationRaw.metrics?.executionProofCompleteRate ?? 0,
    },
    rbepProofCoverage: {
      categoriesRequired: rbepCoverageRaw.categoriesRequired ?? 15,
      categoriesWithFullProof: rbepCoverageRaw.categoriesWithFullProof ?? 0,
      builtCount: rbepCoverageRaw.builtCount ?? 0,
      previewedCount: rbepCoverageRaw.previewedCount ?? 0,
      verifiedCount: rbepCoverageRaw.verifiedCount ?? 0,
      aflaVerdictCount: rbepCoverageRaw.aflaVerdictCount ?? rbepCoverageRaw.reviewedCount ?? 0,
      proofCoveragePercent: rbepCoverageRaw.proofCoveragePercent ?? 0,
    },
    uvlCoverage: {
      categoriesRequired: uvlCoverageRaw.categoriesRequired ?? 15,
      verifiedCount: uvlCoverageRaw.verifiedCount ?? 0,
      verificationCoveragePercent: uvlCoverageRaw.verificationCoveragePercent ?? 0,
    },
    uvlProof,
    productionAssessment: {
      categoriesEvaluated: (productionRaw.categoriesEvaluated as number) ?? 0,
      categoriesProductionReady: (productionRaw.categoriesProductionReady as number) ?? 0,
      productionReadinessScore: (productionRaw.productionReadinessScore as number) ?? 0,
      productionProofStatus: (productionRaw.productionProofStatus as string) ?? 'UNPROVEN',
      passToken: prg.passToken ?? (productionRaw.passToken as string) ?? null,
    },
    gpcgAssessment: {
      domainsEvaluated: gpcgRaw.domainsEvaluated ?? 0,
      domainsGenerated: gpcgRaw.domainsGenerated ?? 0,
      domainsBuildProven: gpcgRaw.domainsBuildProven ?? 0,
      domainsPreviewProven: gpcgRaw.domainsPreviewProven ?? 0,
      domainsProductionReady: gpcgRaw.domainsProductionReady ?? 0,
      generalPurposeMaturityScore: gpcgRaw.generalPurposeMaturityScore ?? 0,
      proofStatus: gpcgRaw.proofStatus ?? 'UNPROVEN',
      passToken: gpcg.passToken ?? gpcgRaw.passToken ?? null,
      domainProfiles: gpcgProfiles,
    },
    cloudAssessment: {
      jobsSubmitted: cloudRaw.jobsSubmitted ?? 0,
      jobsCompleted: cloudRaw.jobsCompleted ?? 0,
      jobsFailed: cloudRaw.jobsFailed ?? 0,
      cloudSimulatedProofStatus: cloudRaw.cloudSimulatedProofStatus ?? 'UNPROVEN',
      passToken: cloud.passToken ?? cloudRaw.passToken ?? null,
      profiles: cloudProfiles,
    },
    aflaSuite,
    paiAssessment: {
      categoriesReviewed: paiRaw.categoriesReviewed ?? rbepCoverageRaw.reviewedCount ?? 0,
      passToken: pai.passToken ?? paiRaw.passToken ?? null,
    },
    largeScaleAssessment: {
      categoriesTested: largeScaleRaw.categoriesTested ?? largeScaleProfiles.length,
      buildSuccessRate: largeScaleRaw.passRates?.buildSuccessRate ?? 0,
      generationSuccessRate: largeScaleRaw.passRates?.generationSuccessRate ?? 0,
      profiles: largeScaleProfiles,
    },
  };
}

export function isPipelineEvidenceSufficient(bundle: PipelineEvidenceBundle): boolean {
  return (
    bundle.rbepBuildProof.length >= 1 &&
    bundle.rbepProofCoverage.builtCount > 0 &&
    bundle.uvlCoverage.categoriesRequired > 0
  );
}
