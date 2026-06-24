/**
 * Production Readiness Gate V1 — consumes upstream evidence without duplicating systems.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import { WORKSPACE_ID_PREFIX } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-bounds.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import type { UpstreamEvidenceSnapshot } from './production-readiness-gate-v1-types.js';

const RBEP_V11_DIR = '.real-build-execution-pipeline-v1-1';
const UVL_DIR = '.uvl-verification-execution-v1';
const AFLA_DIR = '.autonomous-founder-launch-authority';

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function resolveWorkspacePath(projectRootDir: string, category: RealBuildSuiteEntry): string {
  const workspaceId = `${WORKSPACE_ID_PREFIX}-${category.profile.toLowerCase().replace(/_/g, '-')}`;
  return join(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);
}

export function loadUpstreamEvidenceForCategory(input: {
  category: RealBuildSuiteEntry;
  projectRootDir: string;
}): UpstreamEvidenceSnapshot & { workspacePath: string } {
  const { category, projectRootDir } = input;
  const workspacePath = resolveWorkspacePath(projectRootDir, category);
  const sources: string[] = [];

  const buildProof = readJson<
    Array<{
      profile?: string;
      buildResult?: string;
      previewResult?: string;
      uvlResult?: string;
      paiResult?: string;
      aflaResult?: string;
      workspacePath?: string;
    }>
  >(join(projectRootDir, RBEP_V11_DIR, 'build-proof.json'), []);

  const uvlProof = readJson<
    Array<{
      profile?: string;
      verificationVerdict?: string;
    }>
  >(join(projectRootDir, UVL_DIR, 'verification-proof.json'), []);

  const aflaSuite = readJson<
    Array<{
      profile?: string;
      verdict?: string;
      overallFounderScore?: number;
      passed?: boolean;
    }>
  >(join(projectRootDir, AFLA_DIR, 'suite-summary.json'), []);

  const rbepEntry = buildProof.find((e) => e.profile === category.profile);
  const uvlEntry = uvlProof.find((e) => e.profile === category.profile);
  const aflaEntry = aflaSuite.find((e) => e.profile === category.profile);

  if (rbepEntry) sources.push(`${RBEP_V11_DIR}/build-proof.json`);
  if (uvlEntry) sources.push(`${UVL_DIR}/verification-proof.json`);
  if (aflaEntry) sources.push(`${AFLA_DIR}/suite-summary.json`);

  const distIndex = join(workspacePath, 'dist', 'index.html');
  const buildProven =
    rbepEntry?.buildResult === 'PASS' || existsSync(distIndex);
  const previewProven =
    rbepEntry?.previewResult === 'PASS' || existsSync(distIndex);
  const verificationProven =
    uvlEntry?.verificationVerdict === 'VERIFIED' || rbepEntry?.uvlResult === 'PASS';
  const launchReady =
    aflaEntry?.passed === true ||
    aflaEntry?.verdict === 'LAUNCH_READY' ||
    rbepEntry?.aflaResult === 'LAUNCH_READY';
  const productArchitectReviewed = rbepEntry?.paiResult === 'PASS';

  return {
    readOnly: true,
    buildProven,
    previewProven,
    verificationProven,
    launchReady,
    productArchitectReviewed,
    cqiRequirementConfidence: null,
    aflaVerdict: aflaEntry?.verdict ?? rbepEntry?.aflaResult ?? null,
    aflaScore: aflaEntry?.overallFounderScore ?? null,
    uvlVerificationConfidence: verificationProven ? 100 : null,
    paiProductReadinessScore: productArchitectReviewed ? 85 : null,
    evidenceSources: sources,
    workspacePath,
  };
}

export function upstreamChainComplete(evidence: UpstreamEvidenceSnapshot): boolean {
  return (
    evidence.buildProven &&
    evidence.previewProven &&
    evidence.verificationProven &&
    evidence.launchReady
  );
}
