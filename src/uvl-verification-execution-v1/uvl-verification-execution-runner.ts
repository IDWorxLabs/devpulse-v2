/**
 * UVL Verification Execution V1 — per-category verification runner.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { executeVerificationExecution } from '../connected-verification-execution/verification-execution-engine.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { runRealBuildForCategory } from '../real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { WORKSPACE_ID_PREFIX } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-bounds.js';
import type { RealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import { classifyVerificationFailure } from './verification-failure-classifier.js';
import {
  startDistPreviewServer,
  stopDistPreviewServer,
} from './workspace-dist-preview-server.js';
import { ensureWorkspaceVerificationMarkers } from './workspace-verification-markers.js';
import { runWorkspaceVerificationChecks } from './workspace-verification-checks.js';
import type {
  VerificationCategoryResult,
  VerificationFailureClass,
  VerificationProofEvidence,
  VerificationVerdict,
} from './uvl-verification-execution-v1-types.js';
import { computeCategoryVerificationConfidence } from './verification-confidence.js';

function workspaceIdForProfile(profile: string): string {
  return `${WORKSPACE_ID_PREFIX}-${profile.toLowerCase().replace(/_/g, '-')}`;
}

function buildProofEvidence(input: {
  previewUrl: string | null;
  checks: Awaited<ReturnType<typeof runWorkspaceVerificationChecks>>;
  executionSucceeded: boolean;
  artifactPath: string | null;
}): VerificationProofEvidence {
  const missing = [...input.checks.missingEvidence];
  if (!input.executionSucceeded) missing.push('Verification execution artifact');

  const proofComplete =
    input.checks.buildSuccess &&
    input.checks.previewLoads &&
    input.checks.navigationWorks &&
    input.checks.coreFeatureWorks &&
    input.checks.blueprintValidationPasses &&
    input.checks.featureRealityPasses &&
    input.checks.engineeringRealityPasses &&
    input.executionSucceeded &&
    missing.length === 0;

  const verdict: VerificationVerdict = proofComplete ? 'VERIFIED' : 'NOT_VERIFIED';

  return {
    readOnly: true,
    previewUrl: input.previewUrl,
    runtimeValidation: input.checks.previewLoads && input.executionSucceeded,
    featureValidation: input.checks.featureRealityPasses,
    blueprintValidation: input.checks.blueprintValidationPasses,
    engineeringValidation: input.checks.engineeringRealityPasses,
    navigationValidation: input.checks.navigationWorks,
    verificationVerdict: verdict,
    verificationArtifactPath: input.artifactPath,
    missingEvidence: missing,
    proofComplete,
  };
}

export async function runVerificationForCategory(input: {
  category: RealBuildSuiteEntry;
  projectRootDir: string;
  ensureBuild?: boolean;
}): Promise<VerificationCategoryResult> {
  const workspaceId = workspaceIdForProfile(input.category.profile);
  const workspacePath = join(
    input.projectRootDir,
    GENERATED_BUILDER_WORKSPACES_DIR,
    workspaceId,
  );

  let failureClass: VerificationFailureClass = 'None';
  let failureDetail = '';

  const distIndex = join(workspacePath, 'dist', 'index.html');
  if (!existsSync(distIndex) && input.ensureBuild !== false) {
    runRealBuildForCategory({
      category: input.category,
      projectRootDir: input.projectRootDir,
      runNpmBuild: true,
      fullProofMode: true,
    });
  }

  if (!existsSync(distIndex)) {
    failureClass = 'Build Failure';
    failureDetail = 'Workspace build output missing';
    return {
      readOnly: true,
      profile: input.category.profile,
      productName: input.category.productName,
      prompt: input.category.prompt,
      workspaceId,
      workspacePath: existsSync(workspacePath) ? workspacePath : null,
      passed: false,
      verified: false,
      metrics: {
        readOnly: true,
        buildSuccess: false,
        previewSuccess: false,
        navigationSuccess: false,
        featureSuccess: false,
        blueprintSuccess: false,
        featureRealitySuccess: false,
        engineeringRealitySuccess: false,
        verificationSuccess: false,
        verificationConfidence: 0,
      },
      failureClass,
      failureDetail,
      verificationProof: {
        readOnly: true,
        previewUrl: null,
        runtimeValidation: false,
        featureValidation: false,
        blueprintValidation: false,
        engineeringValidation: false,
        navigationValidation: false,
        verificationVerdict: 'NOT_VERIFIED',
        verificationArtifactPath: null,
        missingEvidence: ['Application build output'],
        proofComplete: false,
      },
    };
  }

  let previewUrl: string | null = null;
  let executionSucceeded = false;
  let artifactPath: string | null = null;

  try {
    const preview = await startDistPreviewServer(workspacePath);
    previewUrl = preview.url;
    ensureWorkspaceVerificationMarkers({
      workspaceDir: workspacePath,
      workspaceId,
      previewUrl: preview.url,
      port: preview.port,
    });

    const execution = await executeVerificationExecution({
      projectRootDir: input.projectRootDir,
      workspaceRoot: workspacePath,
      workspaceId,
      previewUrl: preview.url,
      executionMode: 'REAL',
    });
    executionSucceeded = execution.success;
    artifactPath = join(workspacePath, '.verification-executed.json');

    const checks = await runWorkspaceVerificationChecks({
      workspaceDir: workspacePath,
      previewUrl: preview.url,
    });

    const verificationProof = buildProofEvidence({
      previewUrl: preview.url,
      checks,
      executionSucceeded,
      artifactPath: existsSync(artifactPath) ? artifactPath : null,
    });

    const verified = verificationProof.proofComplete;
    const verificationConfidence = computeCategoryVerificationConfidence({
      checks,
      executionSucceeded,
      verified,
    });

    if (!verified) {
      const classified = classifyVerificationFailure({ checks, executionSucceeded });
      failureClass = classified.failureClass;
      failureDetail = classified.failureDetail;
    }

    await stopDistPreviewServer(preview);

    return {
      readOnly: true,
      profile: input.category.profile,
      productName: input.category.productName,
      prompt: input.category.prompt,
      workspaceId,
      workspacePath,
      passed: verified,
      verified,
      metrics: {
        readOnly: true,
        buildSuccess: checks.buildSuccess,
        previewSuccess: checks.previewLoads,
        navigationSuccess: checks.navigationWorks,
        featureSuccess: checks.coreFeatureWorks,
        blueprintSuccess: checks.blueprintValidationPasses,
        featureRealitySuccess: checks.featureRealityPasses,
        engineeringRealitySuccess: checks.engineeringRealityPasses,
        verificationSuccess: verified,
        verificationConfidence,
      },
      failureClass,
      failureDetail,
      verificationProof,
    };
  } catch (err) {
    failureClass = 'Runtime Failure';
    failureDetail = err instanceof Error ? err.message : String(err);
    return {
      readOnly: true,
      profile: input.category.profile,
      productName: input.category.productName,
      prompt: input.category.prompt,
      workspaceId,
      workspacePath,
      passed: false,
      verified: false,
      metrics: {
        readOnly: true,
        buildSuccess: true,
        previewSuccess: false,
        navigationSuccess: false,
        featureSuccess: false,
        blueprintSuccess: false,
        featureRealitySuccess: false,
        engineeringRealitySuccess: false,
        verificationSuccess: false,
        verificationConfidence: 0,
      },
      failureClass,
      failureDetail,
      verificationProof: buildProofEvidence({
        previewUrl,
        checks: {
          buildSuccess: true,
          previewLoads: false,
          navigationWorks: false,
          coreFeatureWorks: false,
          blueprintValidationPasses: false,
          featureRealityPasses: false,
          engineeringRealityPasses: false,
          previewBody: '',
          missingEvidence: [failureDetail],
        },
        executionSucceeded,
        artifactPath,
      }),
    };
  }
}
